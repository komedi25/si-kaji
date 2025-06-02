
export interface ViolationType {
  id: string;
  name: string;
  description?: string;
  point_deduction: number;
  category: 'ringan' | 'sedang' | 'berat';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AchievementType {
  id: string;
  name: string;
  description?: string;
  point_reward: number;
  category: 'akademik' | 'non_akademik' | 'prestasi';
  level: 'sekolah' | 'kecamatan' | 'kabupaten' | 'provinsi' | 'nasional' | 'internasional';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Extracurricular {
  id: string;
  name: string;
  description?: string;
  coach_id?: string;
  max_participants?: number;
  schedule_day?: string;
  schedule_time?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolFacility {
  id: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
  maintenance_schedule?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  academic_year_id?: string;
  name: string;
  semester_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  academic_year?: {
    id: string;
    name: string;
    year_start: number;
    year_end: number;
  };
}
