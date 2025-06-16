
export interface AttendanceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSchedule {
  id: string;
  name: string;
  class_id?: string;
  day_of_week: number;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  late_threshold_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentSelfAttendance {
  id: string;
  student_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_in_location_id?: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_out_time?: string;
  check_out_location_id?: string;
  check_out_latitude?: number;
  check_out_longitude?: number;
  status: 'present' | 'late' | 'absent' | 'early_leave';
  notes?: string;
  violation_created: boolean;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    nis: string;
  };
  check_in_location?: AttendanceLocation;
  check_out_location?: AttendanceLocation;
}

export interface LocationPermission {
  granted: boolean;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  error?: string;
}
