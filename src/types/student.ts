export interface AcademicYear {
  id: string;
  year_start: number;
  year_end: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Major {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  grade: number;
  major_id?: string;
  academic_year_id?: string;
  homeroom_teacher_id?: string;
  max_students?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  major?: Major;
  academic_year?: AcademicYear;
}

export interface Student {
  id: string;
  user_id?: string;
  nis: string;
  nisn?: string;
  full_name: string;
  gender: 'L' | 'P';
  birth_place?: string;
  birth_date?: string;
  religion?: string;
  address?: string;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_address?: string;
  admission_date: string;
  graduation_date?: string;
  status: 'active' | 'graduated' | 'transferred' | 'dropped';
  photo_url?: string;
  created_at: string;
  updated_at: string;
  // Add properties that are used in StudentDataManager
  current_class?: string;
  user_email?: string | null;
  has_user_account?: boolean;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  enrollment_date: string;
  status: 'active' | 'transferred' | 'completed';
  created_at: string;
  updated_at: string;
  student?: Student;
  classes?: Class;
  academic_years?: AcademicYear;
}

// Keep the interface simple and consistent
export interface StudentWithClass extends Student {
  current_class?: string; // Keep as string for consistency
  current_enrollment?: StudentEnrollment;
}

export interface Semester {
  id: string;
  name: string;
  semester_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  academic_year_id: string;
  created_at: string;
  updated_at: string;
}
