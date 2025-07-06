
-- Create parent_access table to link parents with students
CREATE TABLE public.parent_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'parent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);

-- Create student_extracurriculars table
CREATE TABLE public.student_extracurriculars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  extracurricular_id UUID REFERENCES public.extracurriculars(id) ON DELETE CASCADE NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, extracurricular_id)
);

-- Create parent_messages table for parent-teacher communication
CREATE TABLE public.parent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_replies table
CREATE TABLE public.message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.parent_messages(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS for new tables
ALTER TABLE public.parent_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_extracurriculars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for parent_access
CREATE POLICY "Parents can view their own access records"
  ON public.parent_access
  FOR SELECT
  USING (parent_user_id = auth.uid());

-- Create RLS policies for student_extracurriculars
CREATE POLICY "Students and staff can view extracurricular enrollments"
  ON public.student_extracurriculars
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_extracurriculars.student_id AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = ANY(ARRAY['admin'::app_role, 'waka_kesiswaan'::app_role, 'koordinator_ekstrakurikuler'::app_role])
      AND is_active = true
    )
  );

-- Create RLS policies for parent_messages
CREATE POLICY "Users can manage their own messages"
  ON public.parent_messages
  FOR ALL
  USING (sender_id = auth.uid());

-- Create RLS policies for message_replies
CREATE POLICY "Users can view replies to accessible messages"
  ON public.message_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_messages pm
      WHERE pm.id = message_replies.message_id
      AND pm.sender_id = auth.uid()
    )
  );
