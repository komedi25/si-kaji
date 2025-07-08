-- Parent Portal Enhancement: Real-time notifications, progress monitoring, and communication

-- Create parent access table for linking parents to students
CREATE TABLE IF NOT EXISTS public.parent_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'parent', -- parent, guardian, etc
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);

-- Create parent communications table
CREATE TABLE public.parent_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id),
  recipient_type TEXT NOT NULL, -- wali_kelas, guru_bk, waka_kesiswaan, admin
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'sent', -- sent, read, replied, closed
  read_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  reply_message TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real-time notifications for parents
CREATE TABLE public.parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- attendance, achievement, violation, grade, communication
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID, -- ID of related record (attendance, violation, etc)
  reference_table TEXT, -- name of related table
  priority TEXT NOT NULL DEFAULT 'medium',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT, -- deep link to relevant section
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student progress tracking table
CREATE TABLE public.student_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_percentage DECIMAL(5,2),
  discipline_score INTEGER,
  achievement_count INTEGER DEFAULT 0,
  violation_count INTEGER DEFAULT 0,
  academic_notes TEXT,
  behavioral_notes TEXT,
  monthly_summary JSONB DEFAULT '{}',
  semester_summary JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, tracking_date)
);

-- Enable RLS on all tables
ALTER TABLE public.parent_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_access
CREATE POLICY "Parents can view their own access records" ON public.parent_access
  FOR SELECT USING (parent_user_id = auth.uid());

CREATE POLICY "Admin can manage parent access" ON public.parent_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- RLS Policies for parent_communications
CREATE POLICY "Parents can manage their own communications" ON public.parent_communications
  FOR ALL USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Teachers can view and reply to communications" ON public.parent_communications
  FOR ALL USING (
    recipient_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'wali_kelas', 'guru_bk', 'waka_kesiswaan') 
      AND is_active = true
    )
  );

-- RLS Policies for parent_notifications
CREATE POLICY "Parents can view their own notifications" ON public.parent_notifications
  FOR SELECT USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can update their notification status" ON public.parent_notifications
  FOR UPDATE USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.parent_notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for student_progress_tracking
CREATE POLICY "Parents can view their child's progress" ON public.student_progress_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_access pa
      WHERE pa.parent_user_id = auth.uid()
      AND pa.student_id = student_progress_tracking.student_id
      AND pa.is_active = true
    )
  );

CREATE POLICY "Teachers can manage student progress" ON public.student_progress_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'wali_kelas', 'guru_bk', 'waka_kesiswaan') 
      AND is_active = true
    )
  );

-- Function to create parent notification
CREATE OR REPLACE FUNCTION public.create_parent_notification(
  _student_id UUID,
  _notification_type TEXT,
  _title TEXT,
  _message TEXT,
  _reference_id UUID DEFAULT NULL,
  _reference_table TEXT DEFAULT NULL,
  _priority TEXT DEFAULT 'medium',
  _action_url TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  -- Create notification for all active parents of the student
  INSERT INTO public.parent_notifications (
    parent_user_id, student_id, notification_type, title, message,
    reference_id, reference_table, priority, action_url, metadata
  )
  SELECT 
    pa.parent_user_id,
    _student_id,
    _notification_type,
    _title,
    _message,
    _reference_id,
    _reference_table,
    _priority,
    _action_url,
    _metadata
  FROM public.parent_access pa
  WHERE pa.student_id = _student_id 
    AND pa.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create notifications for various events
CREATE OR REPLACE FUNCTION public.notify_parents_on_violation()
RETURNS TRIGGER AS $$
DECLARE
  student_name TEXT;
  violation_name TEXT;
BEGIN
  -- Get student and violation details
  SELECT s.full_name INTO student_name
  FROM public.students s WHERE s.id = NEW.student_id;
  
  SELECT vt.name INTO violation_name
  FROM public.violation_types vt WHERE vt.id = NEW.violation_type_id;
  
  -- Create notification
  PERFORM public.create_parent_notification(
    NEW.student_id,
    'violation',
    'Pelanggaran Baru: ' || student_name,
    'Anak Anda, ' || student_name || ', melakukan pelanggaran: ' || violation_name || 
    ' pada tanggal ' || NEW.violation_date || '. Poin dikurangi: ' || NEW.point_deduction,
    NEW.id,
    'student_violations',
    CASE 
      WHEN NEW.point_deduction >= 20 THEN 'high'
      WHEN NEW.point_deduction >= 10 THEN 'medium'
      ELSE 'low'
    END,
    '/violation-management',
    jsonb_build_object('violation_type', violation_name, 'points', NEW.point_deduction)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify parents on achievements
CREATE OR REPLACE FUNCTION public.notify_parents_on_achievement()
RETURNS TRIGGER AS $$
DECLARE
  student_name TEXT;
  achievement_name TEXT;
BEGIN
  -- Get student and achievement details
  SELECT s.full_name INTO student_name
  FROM public.students s WHERE s.id = NEW.student_id;
  
  SELECT at.name INTO achievement_name
  FROM public.achievement_types at WHERE at.id = NEW.achievement_type_id;
  
  -- Create notification when achievement is verified
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    PERFORM public.create_parent_notification(
      NEW.student_id,
      'achievement',
      'Prestasi Baru: ' || student_name,
      'Selamat! Anak Anda, ' || student_name || ', meraih prestasi: ' || achievement_name || 
      ' pada tanggal ' || NEW.achievement_date || '. Poin didapat: ' || NEW.point_reward,
      NEW.id,
      'student_achievements',
      'medium',
      '/achievement-management',
      jsonb_build_object('achievement_type', achievement_name, 'points', NEW.point_reward)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify parents on attendance issues
CREATE OR REPLACE FUNCTION public.notify_parents_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  student_name TEXT;
  absence_count INTEGER;
BEGIN
  -- Get student details
  SELECT s.full_name INTO student_name
  FROM public.students s WHERE s.id = NEW.student_id;
  
  -- Notify on absent or late status
  IF NEW.status IN ('absent', 'late') THEN
    -- Count recent absences in current month
    SELECT COUNT(*) INTO absence_count
    FROM public.student_attendances sa
    WHERE sa.student_id = NEW.student_id
      AND sa.status IN ('absent', 'late')
      AND sa.attendance_date >= date_trunc('month', NEW.attendance_date);
    
    PERFORM public.create_parent_notification(
      NEW.student_id,
      'attendance',
      CASE NEW.status
        WHEN 'absent' THEN 'Ketidakhadiran: ' || student_name
        WHEN 'late' THEN 'Keterlambatan: ' || student_name
      END,
      student_name || ' ' || 
      CASE NEW.status
        WHEN 'absent' THEN 'tidak hadir'
        WHEN 'late' THEN 'terlambat (' || COALESCE(NEW.late_minutes::TEXT, '0') || ' menit)'
      END ||
      ' pada tanggal ' || NEW.attendance_date || 
      '. Total ketidakhadiran bulan ini: ' || absence_count,
      NEW.id,
      'student_attendances',
      CASE WHEN absence_count >= 3 THEN 'high' ELSE 'medium' END,
      '/attendance-management',
      jsonb_build_object('status', NEW.status, 'monthly_count', absence_count)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_notify_parents_violation
  AFTER INSERT ON public.student_violations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parents_on_violation();

CREATE TRIGGER trigger_notify_parents_achievement
  AFTER INSERT OR UPDATE ON public.student_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parents_on_achievement();

CREATE TRIGGER trigger_notify_parents_attendance
  AFTER INSERT OR UPDATE ON public.student_attendances
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parents_on_attendance();

-- Function to update student progress tracking
CREATE OR REPLACE FUNCTION public.update_student_progress_tracking(_student_id UUID)
RETURNS void AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  attendance_pct DECIMAL(5,2);
  discipline_pts INTEGER;
  achievement_cnt INTEGER;
  violation_cnt INTEGER;
BEGIN
  -- Calculate attendance percentage for current month
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status IN ('present', 'late'))::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 100.00
    END
  INTO attendance_pct
  FROM public.student_attendances
  WHERE student_id = _student_id
    AND attendance_date >= date_trunc('month', today_date);

  -- Get current discipline points
  SELECT 
    COALESCE(final_score, 100)
  INTO discipline_pts
  FROM public.student_discipline_points
  WHERE student_id = _student_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Count achievements this month
  SELECT COUNT(*)
  INTO achievement_cnt
  FROM public.student_achievements
  WHERE student_id = _student_id
    AND status = 'verified'
    AND achievement_date >= date_trunc('month', today_date);

  -- Count violations this month
  SELECT COUNT(*)
  INTO violation_cnt
  FROM public.student_violations
  WHERE student_id = _student_id
    AND status = 'active'
    AND violation_date >= date_trunc('month', today_date);

  -- Insert or update progress tracking
  INSERT INTO public.student_progress_tracking (
    student_id, tracking_date, attendance_percentage, discipline_score,
    achievement_count, violation_count
  )
  VALUES (
    _student_id, today_date, attendance_pct, discipline_pts,
    achievement_cnt, violation_cnt
  )
  ON CONFLICT (student_id, tracking_date)
  DO UPDATE SET
    attendance_percentage = EXCLUDED.attendance_percentage,
    discipline_score = EXCLUDED.discipline_score,
    achievement_count = EXCLUDED.achievement_count,
    violation_count = EXCLUDED.violation_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update progress tracking
CREATE OR REPLACE FUNCTION public.trigger_update_progress_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Update progress for affected student
  PERFORM public.update_student_progress_tracking(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.student_id
      ELSE NEW.student_id
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply progress tracking triggers
CREATE TRIGGER trigger_update_progress_on_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.student_attendances
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_progress_tracking();

CREATE TRIGGER trigger_update_progress_on_violations
  AFTER INSERT OR UPDATE OR DELETE ON public.student_violations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_progress_tracking();

CREATE TRIGGER trigger_update_progress_on_achievements
  AFTER INSERT OR UPDATE OR DELETE ON public.student_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_progress_tracking();