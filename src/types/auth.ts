
export type AppRole = 
  | 'admin'
  | 'kepala_sekolah'
  | 'waka_kesiswaan'
  | 'tppk'
  | 'arps'
  | 'p4gn'
  | 'koordinator_ekstrakurikuler'
  | 'wali_kelas'
  | 'guru_bk'
  | 'pelatih_ekstrakurikuler'
  | 'siswa'
  | 'orang_tua'
  | 'penanggung_jawab_sarpras'
  | 'osis';

export interface UserProfile {
  id: string;
  role: string; // Added the missing role property
  full_name: string;
  nip?: string;
  nis?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  // Student specific fields
  nisn?: string;
  gender?: 'L' | 'P';
  birth_place?: string;
  birth_date?: string;
  religion?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_address?: string;
  admission_date?: string;
  graduation_date?: string;
  status?: 'active' | 'graduated' | 'transferred' | 'dropped';
  photo_url?: string;
  current_class?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
  roles: AppRole[];
}
