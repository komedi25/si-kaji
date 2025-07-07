-- Create permit QR codes table for tracking generated QR codes
CREATE TABLE IF NOT EXISTS public.permit_qr_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_id uuid NOT NULL REFERENCES public.student_permits(id) ON DELETE CASCADE,
  qr_data text NOT NULL,
  qr_url text NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  verification_count integer NOT NULL DEFAULT 0,
  last_verified_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.permit_qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for permit QR codes
CREATE POLICY "Users can view QR codes for permits they can access" ON public.permit_qr_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_permits sp
      WHERE sp.id = permit_qr_codes.permit_id
      AND (
        -- Students can see their own permit QR codes
        EXISTS (
          SELECT 1 FROM students s
          WHERE s.id = sp.student_id AND s.user_id = auth.uid()
        )
        OR
        -- Staff can see all QR codes
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() 
          AND role = ANY(ARRAY['admin'::app_role, 'wali_kelas'::app_role, 'waka_kesiswaan'::app_role, 'tppk'::app_role, 'guru_bk'::app_role])
          AND is_active = true
        )
      )
    )
  );

CREATE POLICY "System can create QR codes" ON public.permit_qr_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update QR codes" ON public.permit_qr_codes
  FOR UPDATE USING (true);

-- Add QR code verification function
CREATE OR REPLACE FUNCTION public.verify_permit_qr(_permit_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update verification count
  UPDATE public.permit_qr_codes
  SET verification_count = verification_count + 1,
      last_verified_at = now()
  WHERE permit_id = _permit_id AND is_active = true;
  
  -- Check if permit exists and is approved
  RETURN EXISTS (
    SELECT 1 FROM public.student_permits
    WHERE id = _permit_id 
    AND status = 'approved'
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE
  );
END;
$$;