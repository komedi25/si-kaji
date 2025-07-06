
// Types for extracurricular components
export interface ExtracurricularDetails {
  id: string;
  name: string;
  description?: string;
  schedule_day?: string;
  schedule_time?: string;
  location?: string;
  max_participants?: number;
  current_participants: number;
  coach_name?: string;
  enrollments: EnrollmentDetails[];
}

export interface EnrollmentDetails {
  id: string;
  student_name: string;
  student_nis: string;
  student_class?: string;
  enrollment_date: string;
  status: string;
}

export interface EnrollmentRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class?: string;
  extracurricular_name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface StudentOption {
  id: string;
  full_name: string;
  nis: string;
  class_name?: string;
}
