
export interface StudentAttendance {
  id: string;
  student_id: string;
  class_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recorded_by?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    nis: string;
  };
  classes?: {
    id: string;
    name: string;
  };
}

export interface StudentViolation {
  id: string;
  student_id: string;
  violation_type_id: string;
  violation_date: string;
  description?: string;
  point_deduction: number;
  reported_by?: string;
  status: 'active' | 'resolved' | 'appealed';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    nis: string;
  };
  violation_types?: {
    id: string;
    name: string;
    category: string;
    point_deduction: number;
  };
}

export interface StudentAchievement {
  id: string;
  student_id: string;
  achievement_type_id: string;
  achievement_date: string;
  description?: string;
  point_reward: number;
  certificate_url?: string;
  recorded_by?: string;
  verified_by?: string;
  verified_at?: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    nis: string;
  };
  achievement_types?: {
    id: string;
    name: string;
    category: string;
    level: string;
    point_reward: number;
  };
}

export interface StudentPermit {
  id: string;
  student_id: string;
  permit_type: 'sick_leave' | 'family_leave' | 'school_activity' | 'other';
  start_date: string;
  end_date: string;
  reason: string;
  supporting_document_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  approval_letter_url?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    nis: string;
  };
}

export interface StudentDisciplinePoint {
  id: string;
  student_id: string;
  academic_year_id: string;
  semester_id?: string;
  total_violation_points: number;
  total_achievement_points: number;
  final_score: number;
  discipline_status: 'excellent' | 'good' | 'warning' | 'probation' | 'critical';
  last_updated: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    nis: string;
  };
  academic_years?: {
    id: string;
    name: string;
  };
  semesters?: {
    id: string;
    name: string;
  };
}
