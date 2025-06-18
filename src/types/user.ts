
import { AppRole } from './auth';

export interface AllUserData {
  id: string;
  full_name: string;
  email?: string | null;
  nip?: string | null;
  nis?: string | null;
  phone?: string | null;
  user_type: 'staff' | 'student';
  roles: AppRole[];
  current_class?: string;
  has_user_account: boolean;
  created_at: string;
  // Student-specific fields
  student_id?: string;
  student_status?: string;
}

export interface ProfileData {
  id: string;
  full_name: string;
  nip?: string | null;
  nis?: string | null;
  phone?: string | null;
  created_at?: string | null;
}

export interface StudentData {
  id: string;
  user_id?: string | null;
  full_name: string;
  nis: string;
  phone?: string | null;
  status: string;
  created_at: string;
  student_enrollments?: Array<{
    classes?: {
      name: string;
      grade: number;
    } | null;
  }> | null;
}

export interface UserRoleData {
  user_id: string;
  role: string;
}

export interface AuthUserData {
  id: string;
  email?: string;
}
