
export type AppRole = 
  | 'admin'
  | 'kepala_sekolah'
  | 'waka_kesiswaan'
  | 'admin_kesiswaan'
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
  full_name: string;
  nip?: string;
  nis?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
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
