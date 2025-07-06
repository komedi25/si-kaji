
-- Enhance student_permits table structure
ALTER TABLE public.student_permits 
ADD COLUMN IF NOT EXISTS permit_category text DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS urgency_level text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS parent_contact text,
ADD COLUMN IF NOT EXISTS parent_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS activity_location text,
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS start_time time,
ADD COLUMN IF NOT EXISTS end_time time,
ADD COLUMN IF NOT EXISTS approval_workflow jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_approval_stage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_approver_id uuid,
ADD COLUMN IF NOT EXISTS dispensation_letter_url text,
ADD COLUMN IF NOT EXISTS qr_code_url text;

-- Create permit approval workflow table
CREATE TABLE IF NOT EXISTS public.permit_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_id uuid NOT NULL REFERENCES public.student_permits(id) ON DELETE CASCADE,
  approver_role text NOT NULL,
  approver_id uuid,
  approval_order integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  approved_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create permit notifications table
CREATE TABLE IF NOT EXISTS public.permit_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_id uuid NOT NULL REFERENCES public.student_permits(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  recipient_role text NOT NULL,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  sent_at timestamp with time zone,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for permit_approvals
ALTER TABLE public.permit_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approvers can view their pending approvals" ON public.permit_approvals
  FOR SELECT USING (
    approver_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = approver_role::app_role 
      AND is_active = true
    )
  );

CREATE POLICY "Approvers can update their approvals" ON public.permit_approvals
  FOR UPDATE USING (
    approver_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = approver_role::app_role 
      AND is_active = true
    )
  );

CREATE POLICY "System can manage permit approvals" ON public.permit_approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'waka_kesiswaan') 
      AND is_active = true
    )
  );

-- Add RLS policies for permit_notifications
ALTER TABLE public.permit_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their permit notifications" ON public.permit_notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "System can create permit notifications" ON public.permit_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can mark notifications as read" ON public.permit_notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Function to process permit approval workflow
CREATE OR REPLACE FUNCTION public.process_permit_approval(
  _permit_id uuid,
  _approver_id uuid,
  _status text,
  _notes text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stage integer;
  next_stage integer;
  next_approver uuid;
  next_role text;
  permit_info record;
  student_info record;
BEGIN
  -- Get current approval stage
  SELECT current_approval_stage INTO current_stage
  FROM public.student_permits 
  WHERE id = _permit_id;
  
  -- Update current approval
  UPDATE public.permit_approvals
  SET status = _status, 
      approved_at = now(), 
      notes = _notes,
      approver_id = _approver_id
  WHERE permit_id = _permit_id 
    AND approval_order = current_stage
    AND status = 'pending';
  
  -- Get permit and student info
  SELECT sp.*, s.full_name as student_name, s.nis as student_nis
  INTO permit_info
  FROM public.student_permits sp
  JOIN public.students s ON s.id = sp.student_id
  WHERE sp.id = _permit_id;
  
  IF _status = 'approved' THEN
    -- Check if there's next approval stage
    SELECT approval_order, approver_role
    INTO next_stage, next_role
    FROM public.permit_approvals
    WHERE permit_id = _permit_id 
      AND approval_order > current_stage
      AND status = 'pending'
    ORDER BY approval_order ASC
    LIMIT 1;
    
    IF next_stage IS NOT NULL THEN
      -- Update current stage and notify next approver
      UPDATE public.student_permits
      SET current_approval_stage = next_stage
      WHERE id = _permit_id;
      
      -- Find specific approver for next stage
      SELECT id INTO next_approver
      FROM public.user_roles ur
      JOIN auth.users u ON u.id = ur.user_id
      WHERE ur.role = next_role::app_role 
        AND ur.is_active = true
      LIMIT 1;
      
      -- Create notification for next approver
      INSERT INTO public.permit_notifications (
        permit_id, recipient_id, recipient_role, notification_type,
        title, message
      ) VALUES (
        _permit_id, next_approver, next_role, 'approval_required',
        'Persetujuan Izin Diperlukan',
        'Permohonan izin dari ' || permit_info.student_name || ' memerlukan persetujuan Anda'
      );
    ELSE
      -- All approvals completed
      UPDATE public.student_permits
      SET status = 'approved',
          approved_at = now(),
          final_approver_id = _approver_id
      WHERE id = _permit_id;
      
      -- Notify student
      INSERT INTO public.permit_notifications (
        permit_id, recipient_id, recipient_role, notification_type,
        title, message
      ) VALUES (
        _permit_id, permit_info.student_id, 'siswa', 'approved',
        'Izin Disetujui',
        'Permohonan izin Anda telah disetujui dan dapat digunakan'
      );
    END IF;
  ELSE
    -- Permit rejected
    UPDATE public.student_permits
    SET status = 'rejected',
        approved_at = now(),
        final_approver_id = _approver_id,
        review_notes = _notes
    WHERE id = _permit_id;
    
    -- Notify student
    INSERT INTO public.permit_notifications (
      permit_id, recipient_id, recipient_role, notification_type,
      title, message
    ) VALUES (
      _permit_id, permit_info.student_id, 'siswa', 'rejected',
      'Izin Ditolak',
      'Permohonan izin Anda ditolak: ' || COALESCE(_notes, 'Tidak ada catatan')
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to initialize permit approval workflow
CREATE OR REPLACE FUNCTION public.initialize_permit_workflow(_permit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  permit_type text;
  workflow_stages jsonb;
BEGIN
  -- Get permit type
  SELECT permit_type INTO permit_type FROM public.student_permits WHERE id = _permit_id;
  
  -- Define approval workflow based on permit type
  CASE permit_type
    WHEN 'kegiatan_setelah_jam_sekolah' THEN
      workflow_stages := '[
        {"order": 1, "role": "wali_kelas", "required": true},
        {"order": 2, "role": "guru_bk", "required": true},
        {"order": 3, "role": "waka_kesiswaan", "required": true}
      ]'::jsonb;
    WHEN 'dispensasi_akademik' THEN
      workflow_stages := '[
        {"order": 1, "role": "wali_kelas", "required": true},
        {"order": 2, "role": "waka_kesiswaan", "required": true}
      ]'::jsonb;
    ELSE
      workflow_stages := '[
        {"order": 1, "role": "wali_kelas", "required": true}
      ]'::jsonb;
  END CASE;
  
  -- Create approval records
  INSERT INTO public.permit_approvals (permit_id, approver_role, approval_order)
  SELECT 
    _permit_id,
    (stage->>'role')::text,
    (stage->>'order')::integer
  FROM jsonb_array_elements(workflow_stages) AS stage;
  
  -- Update permit with workflow
  UPDATE public.student_permits
  SET approval_workflow = workflow_stages,
      current_approval_stage = 1
  WHERE id = _permit_id;
  
  -- Notify first approver
  INSERT INTO public.permit_notifications (
    permit_id, recipient_id, recipient_role, notification_type,
    title, message
  )
  SELECT 
    _permit_id,
    ur.user_id,
    'wali_kelas',
    'approval_required',
    'Persetujuan Izin Diperlukan',
    'Permohonan izin baru memerlukan persetujuan Anda'
  FROM public.user_roles ur
  WHERE ur.role = 'wali_kelas'::app_role 
    AND ur.is_active = true
  LIMIT 1;
END;
$$;

-- Trigger to initialize workflow when permit is created
CREATE OR REPLACE FUNCTION public.trigger_permit_workflow()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Initialize approval workflow for new permits
  IF TG_OP = 'INSERT' THEN
    PERFORM public.initialize_permit_workflow(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS permit_workflow_trigger ON public.student_permits;
CREATE TRIGGER permit_workflow_trigger
  AFTER INSERT ON public.student_permits
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_permit_workflow();
