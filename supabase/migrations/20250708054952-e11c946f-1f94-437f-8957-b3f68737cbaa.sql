-- Enhanced Document & Letter Management System
-- Auto PDF generation, Digital signatures, Document workflow approval, Version control

-- Create document workflow states
CREATE TYPE document_workflow_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'published');
CREATE TYPE signature_status AS ENUM ('pending', 'signed', 'rejected');

-- Create document workflows table
CREATE TABLE public.document_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_repository(id) ON DELETE CASCADE,
  workflow_step INTEGER NOT NULL DEFAULT 1,
  approver_role TEXT NOT NULL,
  approver_id UUID REFERENCES auth.users(id),
  status document_workflow_status NOT NULL DEFAULT 'pending_review',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create digital signatures table
CREATE TABLE public.document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_repository(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES auth.users(id),
  signer_role TEXT NOT NULL,
  signature_data TEXT, -- Base64 encoded signature or signature metadata
  signature_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status signature_status NOT NULL DEFAULT 'pending',
  signature_position JSONB DEFAULT '{}', -- {"x": 100, "y": 200, "page": 1}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced letter requests with workflow and PDF generation
CREATE TABLE public.letter_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_request_id UUID NOT NULL REFERENCES public.letter_requests(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.letter_templates(id),
  status TEXT NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed
  pdf_url TEXT,
  generation_data JSONB DEFAULT '{}',
  error_message TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document collaboration and reviews
CREATE TABLE public.document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_repository(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  review_type TEXT NOT NULL DEFAULT 'general', -- general, legal, technical, content
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, changes_requested
  comments TEXT,
  annotations JSONB DEFAULT '[]', -- Array of annotation objects
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced document versioning with automatic tracking
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS change_type TEXT DEFAULT 'manual'; -- manual, auto_save, approval, signature
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES public.document_versions(id);
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS is_major_version BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX idx_document_workflows_document_id ON public.document_workflows(document_id);
CREATE INDEX idx_document_workflows_approver_id ON public.document_workflows(approver_id);
CREATE INDEX idx_document_signatures_document_id ON public.document_signatures(document_id);
CREATE INDEX idx_document_signatures_signer_id ON public.document_signatures(signer_id);
CREATE INDEX idx_letter_generation_queue_status ON public.letter_generation_queue(status);
CREATE INDEX idx_document_reviews_document_id ON public.document_reviews(document_id);

-- Enable RLS on new tables
ALTER TABLE public.document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_workflows
CREATE POLICY "Admin can manage all workflows" ON public.document_workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

CREATE POLICY "Approvers can view and update their workflows" ON public.document_workflows
  FOR ALL USING (
    approver_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role::TEXT = approver_role 
      AND is_active = true
    )
  );

-- RLS policies for document_signatures
CREATE POLICY "Users can view signatures for documents they can access" ON public.document_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_repository dr
      WHERE dr.id = document_signatures.document_id
      AND (dr.is_public = true OR dr.uploaded_by = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'waka_kesiswaan') 
      AND is_active = true
    )
  );

CREATE POLICY "Users can sign documents they are authorized to sign" ON public.document_signatures
  FOR INSERT WITH CHECK (
    signer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role::TEXT = signer_role 
      AND is_active = true
    )
  );

-- RLS policies for letter_generation_queue
CREATE POLICY "Admin can manage letter generation queue" ON public.letter_generation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'waka_kesiswaan') 
      AND is_active = true
    )
  );

CREATE POLICY "Users can view their own letter generation status" ON public.letter_generation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.letter_requests lr
      JOIN public.students s ON s.id = lr.student_id
      WHERE lr.id = letter_generation_queue.letter_request_id
      AND s.user_id = auth.uid()
    )
  );

-- RLS policies for document_reviews
CREATE POLICY "Reviewers can manage their own reviews" ON public.document_reviews
  FOR ALL USING (reviewer_id = auth.uid());

CREATE POLICY "Admin can view all reviews" ON public.document_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- Function to create document workflow
CREATE OR REPLACE FUNCTION public.create_document_workflow(
  _document_id UUID,
  _workflow_steps JSONB -- [{"step": 1, "role": "wali_kelas"}, {"step": 2, "role": "waka_kesiswaan"}]
)
RETURNS UUID AS $$
DECLARE
  workflow_step RECORD;
  workflow_id UUID;
BEGIN
  -- Create workflow steps from the provided configuration
  FOR workflow_step IN SELECT * FROM jsonb_array_elements(_workflow_steps)
  LOOP
    INSERT INTO public.document_workflows (
      document_id, workflow_step, approver_role, status
    ) VALUES (
      _document_id,
      (workflow_step.value->>'step')::INTEGER,
      workflow_step.value->>'role',
      'pending_review'
    ) RETURNING id INTO workflow_id;
  END LOOP;
  
  RETURN workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve document workflow step
CREATE OR REPLACE FUNCTION public.approve_workflow_step(
  _workflow_id UUID,
  _approver_id UUID,
  _status document_workflow_status,
  _comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  workflow_record RECORD;
  next_step_exists BOOLEAN;
BEGIN
  -- Update current workflow step
  UPDATE public.document_workflows
  SET 
    status = _status,
    approver_id = _approver_id,
    comments = _comments,
    approved_at = CASE WHEN _status = 'approved' THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = _workflow_id
  RETURNING * INTO workflow_record;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If approved, check if there are more steps
  IF _status = 'approved' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.document_workflows
      WHERE document_id = workflow_record.document_id
      AND workflow_step > workflow_record.workflow_step
      AND status = 'pending_review'
    ) INTO next_step_exists;
    
    -- If no more steps, mark document as approved
    IF NOT next_step_exists THEN
      UPDATE public.document_repository
      SET approved_by = _approver_id, approved_at = now(), updated_at = now()
      WHERE id = workflow_record.document_id;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue letter for PDF generation
CREATE OR REPLACE FUNCTION public.queue_letter_generation(
  _letter_request_id UUID
)
RETURNS UUID AS $$
DECLARE
  letter_request_record RECORD;
  template_record RECORD;
  generation_id UUID;
  student_data JSONB;
BEGIN
  -- Get letter request details
  SELECT lr.*, s.full_name, s.nis, s.birth_date, s.birth_place,
         c.name as class_name, c.grade,
         m.name as major_name
  INTO letter_request_record
  FROM public.letter_requests lr
  JOIN public.students s ON s.id = lr.student_id
  LEFT JOIN public.student_enrollments se ON se.student_id = s.id AND se.status = 'active'
  LEFT JOIN public.classes c ON c.id = se.class_id
  LEFT JOIN public.majors m ON m.id = c.major_id
  WHERE lr.id = _letter_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Letter request not found';
  END IF;
  
  -- Get template
  SELECT * INTO template_record
  FROM public.letter_templates
  WHERE letter_type = letter_request_record.letter_type
  AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found for letter type: %', letter_request_record.letter_type;
  END IF;
  
  -- Prepare student data for template variable replacement
  student_data := jsonb_build_object(
    'nama_siswa', letter_request_record.full_name,
    'nis', letter_request_record.nis,
    'kelas', COALESCE(letter_request_record.grade || ' ' || letter_request_record.class_name, ''),
    'jurusan', COALESCE(letter_request_record.major_name, ''),
    'tempat_lahir', COALESCE(letter_request_record.birth_place, ''),
    'tanggal_lahir', COALESCE(letter_request_record.birth_date::TEXT, ''),
    'tujuan', letter_request_record.purpose,
    'nomor_surat', letter_request_record.request_number,
    'tanggal_surat', to_char(now(), 'DD Month YYYY')
  );
  
  -- Queue for generation
  INSERT INTO public.letter_generation_queue (
    letter_request_id, template_id, status, generation_data
  ) VALUES (
    _letter_request_id, template_record.id, 'queued', student_data
  ) RETURNING id INTO generation_id;
  
  RETURN generation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create document version automatically
CREATE OR REPLACE FUNCTION public.create_document_version(
  _document_id UUID,
  _file_url TEXT,
  _changes_description TEXT,
  _change_type TEXT DEFAULT 'manual',
  _is_major_version BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  current_version INTEGER;
  new_version INTEGER;
  version_id UUID;
BEGIN
  -- Get current highest version
  SELECT COALESCE(MAX(version_number), 0) INTO current_version
  FROM public.document_versions
  WHERE document_id = _document_id;
  
  -- Determine new version number
  IF _is_major_version THEN
    new_version := current_version + 1;
  ELSE
    new_version := current_version + 1;
  END IF;
  
  -- Create new version
  INSERT INTO public.document_versions (
    document_id, version_number, file_url, changes_description, 
    change_type, is_major_version, uploaded_by
  ) VALUES (
    _document_id, new_version, _file_url, _changes_description,
    _change_type, _is_major_version, auth.uid()
  ) RETURNING id INTO version_id;
  
  -- Update main document version
  UPDATE public.document_repository
  SET version_number = new_version, updated_at = now()
  WHERE id = _document_id;
  
  RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-queue letter generation when letter request is created
CREATE OR REPLACE FUNCTION public.trigger_letter_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue for PDF generation when letter request is approved or created
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved') THEN
    
    PERFORM public.queue_letter_generation(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic letter generation
DROP TRIGGER IF EXISTS trigger_auto_letter_generation ON public.letter_requests;
CREATE TRIGGER trigger_auto_letter_generation
  AFTER INSERT OR UPDATE ON public.letter_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_letter_generation();