
-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create error_logs table  
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  page_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own error logs" ON error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all logs
CREATE POLICY "Admins can read all activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can read all error logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );
