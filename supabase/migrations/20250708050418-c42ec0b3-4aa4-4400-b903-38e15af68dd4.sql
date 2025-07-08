-- Enhanced Case Management System with Auto-Assignment and Escalation

-- Create case workflow rules table
CREATE TABLE public.case_workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- null means applies to all categories
  priority TEXT, -- null means applies to all priorities  
  auto_assign_to TEXT, -- role to auto-assign to
  escalation_conditions JSONB NOT NULL DEFAULT '{}',
  escalation_to TEXT, -- role to escalate to
  max_response_hours INTEGER DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case escalations table
CREATE TABLE public.case_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.student_cases(id) ON DELETE CASCADE,
  escalated_from TEXT, -- previous handler role
  escalated_to TEXT NOT NULL, -- new handler role
  escalated_by UUID REFERENCES public.profiles(id),
  escalation_reason TEXT NOT NULL,
  escalated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  automated BOOLEAN NOT NULL DEFAULT false,
  notes TEXT
);

-- Create case notifications table
CREATE TABLE public.case_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.student_cases(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id),
  recipient_role TEXT,
  notification_type TEXT NOT NULL, -- 'assignment', 'escalation', 'deadline', 'update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case timeline table for better tracking
CREATE TABLE public.case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.student_cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'assigned', 'escalated', 'updated', 'resolved'
  event_data JSONB DEFAULT '{}',
  performed_by UUID REFERENCES public.profiles(id),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Insert default workflow rules
INSERT INTO public.case_workflow_rules (name, category, auto_assign_to, max_response_hours) VALUES
('Bullying Auto-Assignment', 'bullying', 'tppk', 24),
('Kekerasan Auto-Assignment', 'kekerasan', 'tppk', 12),
('Narkoba Auto-Assignment', 'narkoba', 'p4gn', 6),
('Pergaulan Bebas Auto-Assignment', 'pergaulan_bebas', 'arps', 24),
('Critical Cases', null, 'tppk', 2),
('High Priority Cases', null, 'tppk', 6);

-- Insert escalation rules
INSERT INTO public.case_workflow_rules (name, escalation_conditions, escalation_to, max_response_hours) VALUES
('TPPK to Waka Escalation', '{"no_response_hours": 48, "from_role": "tppk"}', 'waka_kesiswaan', 72),
('P4GN Critical Escalation', '{"no_response_hours": 12, "from_role": "p4gn", "priority": "critical"}', 'waka_kesiswaan', 24),
('ARPS Urgent Escalation', '{"no_response_hours": 36, "from_role": "arps"}', 'waka_kesiswaan', 48);

-- Function to auto-assign cases based on rules
CREATE OR REPLACE FUNCTION public.auto_assign_case()
RETURNS TRIGGER AS $$
DECLARE
  assignment_rule RECORD;
  handler_user_id UUID;
BEGIN
  -- Find matching workflow rule
  SELECT * INTO assignment_rule
  FROM public.case_workflow_rules
  WHERE is_active = true
    AND (category IS NULL OR category = NEW.category)
    AND auto_assign_to IS NOT NULL
  ORDER BY 
    CASE WHEN category = NEW.category THEN 1 ELSE 2 END,
    CASE WHEN NEW.priority = 'critical' THEN 1 
         WHEN NEW.priority = 'high' THEN 2 
         ELSE 3 END
  LIMIT 1;

  IF FOUND THEN
    -- Find a user with the assigned role
    SELECT ur.user_id INTO handler_user_id
    FROM public.user_roles ur
    WHERE ur.role = assignment_rule.auto_assign_to::app_role
      AND ur.is_active = true
    ORDER BY RANDOM() -- Simple load balancing
    LIMIT 1;

    IF FOUND THEN
      -- Update case with assignment
      UPDATE public.student_cases
      SET assigned_to = handler_user_id,
          assigned_handler = assignment_rule.auto_assign_to::case_handler_type,
          status = 'under_review'::case_status
      WHERE id = NEW.id;

      -- Create assignment record
      INSERT INTO public.case_assignments (
        case_id, assigned_to, assigned_by, handler_type
      ) VALUES (
        NEW.id, handler_user_id, null, assignment_rule.auto_assign_to::case_handler_type
      );

      -- Create notification
      INSERT INTO public.case_notifications (
        case_id, recipient_id, recipient_role, notification_type,
        title, message
      ) VALUES (
        NEW.id, handler_user_id, assignment_rule.auto_assign_to,
        'assignment',
        'Kasus Baru Ditugaskan',
        'Kasus #' || NEW.case_number || ' telah ditugaskan kepada Anda untuk ditangani'
      );

      -- Add to timeline
      INSERT INTO public.case_timeline (
        case_id, event_type, event_data, performed_by
      ) VALUES (
        NEW.id, 'assigned', 
        jsonb_build_object('assigned_to', handler_user_id, 'rule', assignment_rule.name),
        null -- System assignment
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check for escalations
CREATE OR REPLACE FUNCTION public.check_case_escalations()
RETURNS void AS $$
DECLARE
  case_record RECORD;
  escalation_rule RECORD;
  escalation_user_id UUID;
BEGIN
  -- Check all active cases that might need escalation
  FOR case_record IN
    SELECT sc.*, ca.assigned_at, ca.handler_type
    FROM public.student_cases sc
    LEFT JOIN public.case_assignments ca ON ca.case_id = sc.id AND ca.is_active = true
    WHERE sc.status NOT IN ('resolved', 'closed')
      AND sc.created_at < now() - INTERVAL '1 hour' -- Only check cases older than 1 hour
  LOOP
    -- Find matching escalation rule
    SELECT * INTO escalation_rule
    FROM public.case_workflow_rules
    WHERE is_active = true
      AND escalation_to IS NOT NULL
      AND escalation_conditions ? 'no_response_hours'
      AND (escalation_conditions->>'from_role')::TEXT = case_record.assigned_handler::TEXT
      AND case_record.created_at < now() - INTERVAL '1 hour' * (escalation_conditions->>'no_response_hours')::INTEGER
    LIMIT 1;

    IF FOUND THEN
      -- Check if already escalated
      IF NOT EXISTS (
        SELECT 1 FROM public.case_escalations 
        WHERE case_id = case_record.id 
          AND escalated_to = escalation_rule.escalation_to
      ) THEN
        -- Find user to escalate to
        SELECT ur.user_id INTO escalation_user_id
        FROM public.user_roles ur
        WHERE ur.role = escalation_rule.escalation_to::app_role
          AND ur.is_active = true
        ORDER BY RANDOM()
        LIMIT 1;

        IF FOUND THEN
          -- Create escalation record
          INSERT INTO public.case_escalations (
            case_id, escalated_from, escalated_to, escalation_reason, automated
          ) VALUES (
            case_record.id, case_record.assigned_handler, escalation_rule.escalation_to,
            'Otomatis: Tidak ada respons dalam ' || (escalation_rule.escalation_conditions->>'no_response_hours') || ' jam',
            true
          );

          -- Update case assignment
          UPDATE public.student_cases
          SET assigned_to = escalation_user_id,
              assigned_handler = escalation_rule.escalation_to::case_handler_type,
              status = 'escalated'::case_status
          WHERE id = case_record.id;

          -- Create new assignment
          INSERT INTO public.case_assignments (
            case_id, assigned_to, handler_type, notes
          ) VALUES (
            case_record.id, escalation_user_id, escalation_rule.escalation_to::case_handler_type,
            'Eskalasi otomatis dari ' || case_record.assigned_handler
          );

          -- Create notification
          INSERT INTO public.case_notifications (
            case_id, recipient_id, recipient_role, notification_type,
            title, message
          ) VALUES (
            case_record.id, escalation_user_id, escalation_rule.escalation_to,
            'escalation',
            'Kasus Dieskalasi',
            'Kasus #' || case_record.case_number || ' telah dieskalasi kepada Anda karena tidak ada respons'
          );

          -- Add to timeline
          INSERT INTO public.case_timeline (
            case_id, event_type, event_data
          ) VALUES (
            case_record.id, 'escalated',
            jsonb_build_object(
              'from', case_record.assigned_handler,
              'to', escalation_rule.escalation_to,
              'reason', 'automatic_escalation',
              'rule', escalation_rule.name
            )
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
CREATE TRIGGER trigger_auto_assign_case
  AFTER INSERT ON public.student_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_case();

-- Enable RLS on new tables
ALTER TABLE public.case_workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_workflow_rules
CREATE POLICY "Admins can manage workflow rules" ON public.case_workflow_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'waka_kesiswaan')
      AND is_active = true
    )
  );

CREATE POLICY "Staff can view workflow rules" ON public.case_workflow_rules
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );

-- RLS Policies for case_escalations
CREATE POLICY "Staff can view case escalations" ON public.case_escalations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );

CREATE POLICY "Staff can create escalations" ON public.case_escalations
  FOR INSERT WITH CHECK (
    escalated_by = auth.uid() AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );

-- RLS Policies for case_notifications
CREATE POLICY "Users can view their own notifications" ON public.case_notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.case_notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.case_notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for case_timeline
CREATE POLICY "Staff can view case timeline" ON public.case_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );

CREATE POLICY "System can manage timeline" ON public.case_timeline
  FOR ALL USING (true) WITH CHECK (true);

-- Enhanced RLS for student_cases to support staff access
DROP POLICY IF EXISTS "Staff can manage all cases" ON public.student_cases;
CREATE POLICY "Staff can manage all cases" ON public.student_cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'guru_bk', 'tppk', 'arps', 'p4gn', 'waka_kesiswaan')
      AND is_active = true
    )
  );