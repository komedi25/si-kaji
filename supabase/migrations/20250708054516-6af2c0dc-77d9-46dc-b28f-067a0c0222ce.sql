-- Create multi-channel notification system enhancements

-- Add default notification templates
INSERT INTO public.notification_templates (name, title_template, message_template, type, channels, variables, is_active) VALUES
('student_violation', 'Pelanggaran: {{student_name}}', 'Siswa {{student_name}} melakukan pelanggaran {{violation_type}} pada {{date}}. Poin dikurangi: {{points}}', 'warning', ARRAY['app', 'email', 'whatsapp'], '[{"name": "student_name", "type": "text"}, {"name": "violation_type", "type": "text"}, {"name": "date", "type": "date"}, {"name": "points", "type": "number"}]'::jsonb, true),
('achievement_recorded', 'Prestasi: {{student_name}}', 'Selamat! {{student_name}} meraih prestasi {{achievement_type}} pada {{date}}. Poin didapat: {{points}}', 'success', ARRAY['app', 'email', 'whatsapp'], '[{"name": "student_name", "type": "text"}, {"name": "achievement_type", "type": "text"}, {"name": "date", "type": "date"}, {"name": "points", "type": "number"}]'::jsonb, true),
('permit_approved', 'Izin Disetujui: {{student_name}}', 'Permohonan izin {{permit_type}} untuk {{student_name}} telah disetujui pada {{date}}', 'success', ARRAY['app', 'email'], '[{"name": "student_name", "type": "text"}, {"name": "permit_type", "type": "text"}, {"name": "date", "type": "date"}]'::jsonb, true),
('attendance_reminder', 'Pengingat Presensi', 'Jangan lupa melakukan presensi hari ini sebelum {{deadline}}', 'info', ARRAY['app', 'push'], '[{"name": "deadline", "type": "time"}]'::jsonb, true),
('proposal_needs_approval', 'Persetujuan Proposal', 'Proposal {{proposal_title}} memerlukan persetujuan Anda', 'info', ARRAY['app', 'email'], '[{"name": "proposal_title", "type": "text"}]'::jsonb, true);

-- Add default notification channels
INSERT INTO public.notification_channels (name, type, config, is_active) VALUES
('App Internal', 'app', '{"description": "In-app notifications"}', true),
('Email SMTP', 'email', '{"smtp_host": "", "smtp_port": 587, "use_tls": true}', false),
('WhatsApp API', 'whatsapp', '{"api_url": "", "business_number": ""}', false),
('SMS Gateway', 'sms', '{"provider": "twilio", "api_key": ""}', false),
('Push Notifications', 'push', '{"fcm_server_key": "", "vapid_public_key": ""}', false);

-- Function to send multi-channel notification
CREATE OR REPLACE FUNCTION public.send_multi_channel_notification(
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _type TEXT DEFAULT 'info',
  _channels TEXT[] DEFAULT ARRAY['app'],
  _data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  channel TEXT;
  user_email TEXT;
  user_phone TEXT;
  user_preferences RECORD;
BEGIN
  -- Create the main notification
  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (_user_id, _title, _message, _type, _data)
  RETURNING id INTO notification_id;
  
  -- Get user contact information
  SELECT email INTO user_email FROM auth.users WHERE id = _user_id;
  SELECT phone INTO user_phone FROM public.profiles WHERE id = _user_id;
  
  -- Check user preferences for this notification type
  SELECT * INTO user_preferences
  FROM public.user_notification_preferences
  WHERE user_id = _user_id AND notification_type = _type;
  
  -- Use user preferences if available, otherwise use provided channels
  IF user_preferences.id IS NOT NULL AND user_preferences.is_enabled THEN
    _channels := user_preferences.channels;
  END IF;
  
  -- Check quiet hours
  IF user_preferences.quiet_hours_start IS NOT NULL AND user_preferences.quiet_hours_end IS NOT NULL THEN
    IF CURRENT_TIME BETWEEN user_preferences.quiet_hours_start AND user_preferences.quiet_hours_end THEN
      -- Only send app notifications during quiet hours
      _channels := ARRAY['app'];
    END IF;
  END IF;
  
  -- Queue notifications for each channel
  FOREACH channel IN ARRAY _channels
  LOOP
    IF channel = 'email' AND user_email IS NOT NULL THEN
      INSERT INTO public.notification_queue (notification_id, channel_type, recipient)
      VALUES (notification_id, 'email', user_email);
    ELSIF channel = 'whatsapp' AND user_phone IS NOT NULL THEN
      INSERT INTO public.notification_queue (notification_id, channel_type, recipient)
      VALUES (notification_id, 'whatsapp', user_phone);
    ELSIF channel = 'sms' AND user_phone IS NOT NULL THEN
      INSERT INTO public.notification_queue (notification_id, channel_type, recipient)
      VALUES (notification_id, 'sms', user_phone);
    ELSIF channel = 'push' THEN
      INSERT INTO public.notification_queue (notification_id, channel_type, recipient)
      VALUES (notification_id, 'push', _user_id::TEXT);
    -- App notifications are handled by the main notifications table
    END IF;
  END LOOP;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification by role with multi-channel support
CREATE OR REPLACE FUNCTION public.send_notification_by_role(
  _role TEXT,
  _title TEXT,
  _message TEXT,
  _type TEXT DEFAULT 'info',
  _channels TEXT[] DEFAULT ARRAY['app'],
  _data JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Send notification to all users with the specified role
  FOR user_record IN
    SELECT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = _role::app_role AND ur.is_active = true
  LOOP
    PERFORM public.send_multi_channel_notification(
      user_record.user_id,
      _title,
      _message,
      _type,
      _channels,
      _data
    );
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notification queue processing status
CREATE OR REPLACE FUNCTION public.update_notification_queue_status(
  _queue_id UUID,
  _status TEXT,
  _error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notification_queue
  SET 
    status = _status,
    sent_at = CASE WHEN _status = 'sent' THEN now() ELSE sent_at END,
    error_message = _error_message,
    attempts = attempts + 1,
    updated_at = now()
  WHERE id = _queue_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on notification queue
CREATE POLICY "Users can view their own notification queue" ON public.notification_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.id = notification_queue.notification_id
      AND n.user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_queue TO authenticated;
GRANT SELECT ON public.notification_templates TO authenticated;
GRANT SELECT ON public.notification_channels TO authenticated;