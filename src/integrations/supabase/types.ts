export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          year_end: number
          year_start: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          year_end: number
          year_start: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          year_end?: number
          year_start?: number
        }
        Relationships: []
      }
      achievement_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          level: string
          name: string
          point_reward: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string
          name: string
          point_reward?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string
          name?: string
          point_reward?: number
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year_id: string | null
          created_at: string
          grade: number
          homeroom_teacher_id: string | null
          id: string
          is_active: boolean
          major_id: string | null
          max_students: number | null
          name: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          grade: number
          homeroom_teacher_id?: string | null
          id?: string
          is_active?: boolean
          major_id?: string | null
          max_students?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          grade?: number
          homeroom_teacher_id?: string | null
          id?: string
          is_active?: boolean
          major_id?: string | null
          max_students?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
        ]
      }
      extracurriculars: {
        Row: {
          coach_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          max_participants: number | null
          name: string
          schedule_day: string | null
          schedule_time: string | null
          updated_at: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          max_participants?: number | null
          name: string
          schedule_day?: string | null
          schedule_time?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          max_participants?: number | null
          name?: string
          schedule_day?: string | null
          schedule_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      majors: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          action: string
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          action?: string
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      permit_approvals: {
        Row: {
          approval_order: number
          approved_at: string | null
          approver_id: string | null
          approver_role: string
          created_at: string
          id: string
          notes: string | null
          permit_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approval_order: number
          approved_at?: string | null
          approver_id?: string | null
          approver_role: string
          created_at?: string
          id?: string
          notes?: string | null
          permit_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approval_order?: number
          approved_at?: string | null
          approver_id?: string | null
          approver_role?: string
          created_at?: string
          id?: string
          notes?: string | null
          permit_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_approvals_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "student_permits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string | null
          full_name: string
          id: string
          nip: string | null
          nis: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          full_name: string
          id: string
          nip?: string | null
          nis?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          nip?: string | null
          nis?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          permission_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          permission_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      school_facilities: {
        Row: {
          capacity: number | null
          condition: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          maintenance_schedule: string | null
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          maintenance_schedule?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          maintenance_schedule?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      semesters: {
        Row: {
          academic_year_id: string | null
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          semester_number: number
          start_date: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          semester_number: number
          start_date: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          semester_number?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "semesters_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      student_achievements: {
        Row: {
          achievement_date: string
          achievement_type_id: string
          certificate_url: string | null
          created_at: string
          description: string | null
          id: string
          point_reward: number
          recorded_by: string | null
          status: string
          student_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          achievement_date: string
          achievement_type_id: string
          certificate_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          point_reward?: number
          recorded_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          achievement_date?: string
          achievement_type_id?: string
          certificate_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          point_reward?: number
          recorded_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_type_id_fkey"
            columns: ["achievement_type_id"]
            isOneToOne: false
            referencedRelation: "achievement_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendances: {
        Row: {
          attendance_date: string
          class_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          class_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          class_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendances_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_discipline_points: {
        Row: {
          academic_year_id: string
          created_at: string
          discipline_status: string
          final_score: number
          id: string
          last_updated: string
          semester_id: string | null
          student_id: string
          total_achievement_points: number
          total_violation_points: number
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          discipline_status?: string
          final_score?: number
          id?: string
          last_updated?: string
          semester_id?: string | null
          student_id: string
          total_achievement_points?: number
          total_violation_points?: number
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          discipline_status?: string
          final_score?: number
          id?: string
          last_updated?: string
          semester_id?: string | null
          student_id?: string
          total_achievement_points?: number
          total_violation_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_discipline_points_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discipline_points_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discipline_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year_id: string | null
          class_id: string | null
          created_at: string
          enrollment_date: string
          id: string
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          class_id?: string | null
          created_at?: string
          enrollment_date?: string
          id?: string
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string | null
          created_at?: string
          enrollment_date?: string
          id?: string
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_permits: {
        Row: {
          approval_letter_url: string | null
          created_at: string
          end_date: string
          id: string
          permit_type: string
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          student_id: string
          submitted_at: string
          supporting_document_url: string | null
          updated_at: string
        }
        Insert: {
          approval_letter_url?: string | null
          created_at?: string
          end_date: string
          id?: string
          permit_type: string
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          student_id: string
          submitted_at?: string
          supporting_document_url?: string | null
          updated_at?: string
        }
        Update: {
          approval_letter_url?: string | null
          created_at?: string
          end_date?: string
          id?: string
          permit_type?: string
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          student_id?: string
          submitted_at?: string
          supporting_document_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_permits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_violations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          point_deduction: number
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          student_id: string
          updated_at: string
          violation_date: string
          violation_type_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          point_deduction?: number
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
          violation_date: string
          violation_type_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          point_deduction?: number
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          violation_date?: string
          violation_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_violations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_violations_violation_type_id_fkey"
            columns: ["violation_type_id"]
            isOneToOne: false
            referencedRelation: "violation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_date: string
          birth_date: string | null
          birth_place: string | null
          created_at: string
          full_name: string
          gender: string
          graduation_date: string | null
          id: string
          nis: string
          nisn: string | null
          parent_address: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          photo_url: string | null
          religion: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          full_name: string
          gender: string
          graduation_date?: string | null
          id?: string
          nis: string
          nisn?: string | null
          parent_address?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          photo_url?: string | null
          religion?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          full_name?: string
          gender?: string
          graduation_date?: string | null
          id?: string
          nis?: string
          nisn?: string | null
          parent_address?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          photo_url?: string | null
          religion?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      violation_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          point_deduction: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          point_deduction?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          point_deduction?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_permission: {
        Args: { _user_id: string; _permission_name: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      recalculate_discipline_points: {
        Args: {
          _student_id: string
          _academic_year_id: string
          _semester_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin_sistem"
        | "admin_kesiswaan"
        | "kepala_sekolah"
        | "tppk"
        | "arps"
        | "p4gn"
        | "koordinator_ekstrakurikuler"
        | "wali_kelas"
        | "guru_bk"
        | "waka_kesiswaan"
        | "pelatih_ekstrakurikuler"
        | "siswa"
        | "orang_tua"
        | "penanggung_jawab_sarpras"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin_sistem",
        "admin_kesiswaan",
        "kepala_sekolah",
        "tppk",
        "arps",
        "p4gn",
        "koordinator_ekstrakurikuler",
        "wali_kelas",
        "guru_bk",
        "waka_kesiswaan",
        "pelatih_ekstrakurikuler",
        "siswa",
        "orang_tua",
        "penanggung_jawab_sarpras",
      ],
    },
  },
} as const
