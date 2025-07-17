export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      activity_proposals: {
        Row: {
          activity_report: string | null
          activity_type: string
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          attachment_urls: string[] | null
          budget_breakdown: Json | null
          budget_estimation: number | null
          created_at: string
          description: string | null
          documentation_urls: string[] | null
          end_date: string
          end_time: string | null
          estimated_participants: number | null
          facility_requests: string[] | null
          id: string
          location: string | null
          organizer_id: string | null
          organizer_name: string | null
          proposal_number: string
          rejected_reason: string | null
          start_date: string
          start_time: string | null
          status: string
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_report?: string | null
          activity_type?: string
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_urls?: string[] | null
          budget_breakdown?: Json | null
          budget_estimation?: number | null
          created_at?: string
          description?: string | null
          documentation_urls?: string[] | null
          end_date: string
          end_time?: string | null
          estimated_participants?: number | null
          facility_requests?: string[] | null
          id?: string
          location?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          proposal_number: string
          rejected_reason?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_report?: string | null
          activity_type?: string
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_urls?: string[] | null
          budget_breakdown?: Json | null
          budget_estimation?: number | null
          created_at?: string
          description?: string | null
          documentation_urls?: string[] | null
          end_date?: string
          end_time?: string | null
          estimated_participants?: number | null
          facility_requests?: string[] | null
          id?: string
          location?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          proposal_number?: string
          rejected_reason?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_preferences: {
        Row: {
          api_keys: Json | null
          auto_analysis_enabled: boolean
          auto_analysis_schedule: string | null
          created_at: string
          id: string
          notification_enabled: boolean
          preferred_model: string | null
          preferred_provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_keys?: Json | null
          auto_analysis_enabled?: boolean
          auto_analysis_schedule?: string | null
          created_at?: string
          id?: string
          notification_enabled?: boolean
          preferred_model?: string | null
          preferred_provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_keys?: Json | null
          auto_analysis_enabled?: boolean
          auto_analysis_schedule?: string | null
          created_at?: string
          id?: string
          notification_enabled?: boolean
          preferred_model?: string | null
          preferred_provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          assigned_role: string | null
          assigned_to: string | null
          content: string
          created_at: string
          created_by_ai: boolean
          id: string
          metadata: Json | null
          priority: string
          recommendation_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_role?: string | null
          assigned_to?: string | null
          content: string
          created_at?: string
          created_by_ai?: boolean
          id?: string
          metadata?: Json | null
          priority?: string
          recommendation_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_role?: string | null
          assigned_to?: string | null
          content?: string
          created_at?: string
          created_by_ai?: boolean
          id?: string
          metadata?: Json | null
          priority?: string
          recommendation_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          cost: number | null
          created_at: string
          id: string
          prompt_length: number
          provider: string
          response_length: number
          task_type: string
          tokens_used: number
          user_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          prompt_length?: number
          provider: string
          response_length?: number
          task_type: string
          tokens_used?: number
          user_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          prompt_length?: number
          provider?: string
          response_length?: number
          task_type?: string
          tokens_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      attendance_global_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          setting_name: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_name: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_name?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      attendance_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          holiday_name: string
          holiday_type: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          holiday_name: string
          holiday_type?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          holiday_name?: string
          holiday_type?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      attendance_locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          location_type: string | null
          longitude: number
          name: string
          polygon_coordinates: Json | null
          radius_meters: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          location_type?: string | null
          longitude: number
          name: string
          polygon_coordinates?: Json | null
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          location_type?: string | null
          longitude?: number
          name?: string
          polygon_coordinates?: Json | null
          radius_meters?: number
          updated_at?: string
        }
        Relationships: []
      }
      attendance_schedules: {
        Row: {
          applies_to_all_classes: boolean | null
          check_in_end: string
          check_in_start: string
          check_out_end: string
          check_out_start: string
          class_id: string | null
          created_at: string
          day_of_week: number
          id: string
          is_active: boolean
          late_threshold_minutes: number
          name: string
          updated_at: string
        }
        Insert: {
          applies_to_all_classes?: boolean | null
          check_in_end: string
          check_in_start: string
          check_out_end: string
          check_out_start: string
          class_id?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_active?: boolean
          late_threshold_minutes?: number
          name: string
          updated_at?: string
        }
        Update: {
          applies_to_all_classes?: boolean | null
          check_in_end?: string
          check_in_start?: string
          check_out_end?: string
          check_out_start?: string
          class_id?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_active?: boolean
          late_threshold_minutes?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      case_activities: {
        Row: {
          activity_type: string
          case_id: string
          created_at: string
          description: string
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          case_id: string
          created_at?: string
          description: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          case_id?: string
          created_at?: string
          description?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "student_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assigned_to: string
          case_id: string
          completed_at: string | null
          handler_type: Database["public"]["Enums"]["case_handler_type"]
          id: string
          is_active: boolean
          notes: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to: string
          case_id: string
          completed_at?: string | null
          handler_type: Database["public"]["Enums"]["case_handler_type"]
          id?: string
          is_active?: boolean
          notes?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string
          case_id?: string
          completed_at?: string | null
          handler_type?: Database["public"]["Enums"]["case_handler_type"]
          id?: string
          is_active?: boolean
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "student_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_escalations: {
        Row: {
          automated: boolean
          case_id: string
          escalated_at: string
          escalated_by: string | null
          escalated_from: string | null
          escalated_to: string
          escalation_reason: string
          id: string
          notes: string | null
        }
        Insert: {
          automated?: boolean
          case_id: string
          escalated_at?: string
          escalated_by?: string | null
          escalated_from?: string | null
          escalated_to: string
          escalation_reason: string
          id?: string
          notes?: string | null
        }
        Update: {
          automated?: boolean
          case_id?: string
          escalated_at?: string
          escalated_by?: string | null
          escalated_from?: string | null
          escalated_to?: string
          escalation_reason?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_escalations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "student_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_escalations_escalated_by_fkey"
            columns: ["escalated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notifications: {
        Row: {
          case_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          read_at: string | null
          recipient_id: string | null
          recipient_role: string | null
          sent_at: string | null
          title: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          sent_at?: string | null
          title: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "student_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_timeline: {
        Row: {
          case_id: string
          event_data: Json | null
          event_date: string
          event_type: string
          id: string
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          case_id: string
          event_data?: Json | null
          event_date?: string
          event_type: string
          id?: string
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          case_id?: string
          event_data?: Json | null
          event_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_timeline_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "student_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_timeline_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_workflow_rules: {
        Row: {
          auto_assign_to: string | null
          category: string | null
          created_at: string
          escalation_conditions: Json
          escalation_to: string | null
          id: string
          is_active: boolean
          max_response_hours: number | null
          name: string
          priority: string | null
          updated_at: string
        }
        Insert: {
          auto_assign_to?: string | null
          category?: string | null
          created_at?: string
          escalation_conditions?: Json
          escalation_to?: string | null
          id?: string
          is_active?: boolean
          max_response_hours?: number | null
          name: string
          priority?: string | null
          updated_at?: string
        }
        Update: {
          auto_assign_to?: string | null
          category?: string | null
          created_at?: string
          escalation_conditions?: Json
          escalation_to?: string | null
          id?: string
          is_active?: boolean
          max_response_hours?: number | null
          name?: string
          priority?: string | null
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
      coach_activity_logs: {
        Row: {
          attendance_count: number | null
          coach_id: string
          created_at: string
          extracurricular_id: string
          id: string
          log_date: string
          materials_used: string | null
          next_session_plan: string | null
          session_description: string | null
          session_topic: string
          student_progress_notes: string | null
          updated_at: string
        }
        Insert: {
          attendance_count?: number | null
          coach_id: string
          created_at?: string
          extracurricular_id: string
          id?: string
          log_date: string
          materials_used?: string | null
          next_session_plan?: string | null
          session_description?: string | null
          session_topic: string
          student_progress_notes?: string | null
          updated_at?: string
        }
        Update: {
          attendance_count?: number | null
          coach_id?: string
          created_at?: string
          extracurricular_id?: string
          id?: string
          log_date?: string
          materials_used?: string | null
          next_session_plan?: string | null
          session_description?: string | null
          session_topic?: string
          student_progress_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_activity_logs_extracurricular_id_fkey"
            columns: ["extracurricular_id"]
            isOneToOne: false
            referencedRelation: "extracurriculars"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_attendances: {
        Row: {
          activities_conducted: string | null
          attendance_date: string
          coach_id: string
          created_at: string
          end_time: string | null
          extracurricular_id: string
          id: string
          notes: string | null
          participant_count: number | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          activities_conducted?: string | null
          attendance_date: string
          coach_id: string
          created_at?: string
          end_time?: string | null
          extracurricular_id: string
          id?: string
          notes?: string | null
          participant_count?: number | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          activities_conducted?: string | null
          attendance_date?: string
          coach_id?: string
          created_at?: string
          end_time?: string | null
          extracurricular_id?: string
          id?: string
          notes?: string | null
          participant_count?: number | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_attendances_extracurricular_id_fkey"
            columns: ["extracurricular_id"]
            isOneToOne: false
            referencedRelation: "extracurriculars"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_bookings: {
        Row: {
          booking_reason: string
          confirmed_at: string | null
          counselor_id: string
          created_at: string | null
          id: string
          priority_level: string | null
          requested_date: string
          requested_time: string
          session_id: string | null
          status: string | null
          student_id: string
          student_notes: string | null
          updated_at: string | null
        }
        Insert: {
          booking_reason: string
          confirmed_at?: string | null
          counselor_id: string
          created_at?: string | null
          id?: string
          priority_level?: string | null
          requested_date: string
          requested_time: string
          session_id?: string | null
          status?: string | null
          student_id: string
          student_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_reason?: string
          confirmed_at?: string | null
          counselor_id?: string
          created_at?: string | null
          id?: string
          priority_level?: string | null
          requested_date?: string
          requested_time?: string
          session_id?: string | null
          status?: string | null
          student_id?: string
          student_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counseling_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "counseling_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counseling_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_referrals: {
        Row: {
          assigned_counselor: string | null
          created_at: string | null
          id: string
          notes: string | null
          recommended_sessions: number | null
          reference_id: string | null
          referral_reason: string
          referral_type: string
          referred_by: string
          status: string | null
          student_id: string
          updated_at: string | null
          urgency_level: string | null
        }
        Insert: {
          assigned_counselor?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          recommended_sessions?: number | null
          reference_id?: string | null
          referral_reason: string
          referral_type: string
          referred_by: string
          status?: string | null
          student_id: string
          updated_at?: string | null
          urgency_level?: string | null
        }
        Update: {
          assigned_counselor?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          recommended_sessions?: number | null
          reference_id?: string | null
          referral_reason?: string
          referral_type?: string
          referred_by?: string
          status?: string | null
          student_id?: string
          updated_at?: string | null
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counseling_referrals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_schedules: {
        Row: {
          counselor_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          max_sessions_per_slot: number | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          counselor_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          max_sessions_per_slot?: number | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          counselor_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_sessions_per_slot?: number | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      counseling_session_notes: {
        Row: {
          created_at: string | null
          created_by: string
          encrypted_content: string
          encryption_key_hint: string | null
          id: string
          is_confidential: boolean | null
          note_type: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          encrypted_content: string
          encryption_key_hint?: string | null
          id?: string
          is_confidential?: boolean | null
          note_type: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          encrypted_content?: string
          encryption_key_hint?: string | null
          id?: string
          is_confidential?: boolean | null
          note_type?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counseling_session_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "counseling_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_sessions: {
        Row: {
          booking_status: string | null
          case_id: string | null
          counselor_id: string
          created_at: string
          duration_minutes: number | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          is_emergency: boolean | null
          next_session_scheduled: boolean | null
          notes_encrypted: string | null
          parent_notification_sent: boolean | null
          referred_from: string | null
          reminder_sent: boolean | null
          session_date: string
          session_location: string | null
          session_outcome: string | null
          session_time: string
          session_type: string
          status: string
          student_id: string
          student_phone: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          booking_status?: string | null
          case_id?: string | null
          counselor_id: string
          created_at?: string
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          is_emergency?: boolean | null
          next_session_scheduled?: boolean | null
          notes_encrypted?: string | null
          parent_notification_sent?: boolean | null
          referred_from?: string | null
          reminder_sent?: boolean | null
          session_date: string
          session_location?: string | null
          session_outcome?: string | null
          session_time: string
          session_type: string
          status?: string
          student_id: string
          student_phone?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          booking_status?: string | null
          case_id?: string | null
          counselor_id?: string
          created_at?: string
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          is_emergency?: boolean | null
          next_session_scheduled?: boolean | null
          notes_encrypted?: string | null
          parent_notification_sent?: boolean | null
          referred_from?: string | null
          reminder_sent?: boolean | null
          session_date?: string
          session_location?: string | null
          session_outcome?: string | null
          session_time?: string
          session_type?: string
          status?: string
          student_id?: string
          student_phone?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counseling_sessions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "student_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counseling_sessions_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counseling_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_category_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_repository: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          description: string | null
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean
          is_public: boolean
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          document_type?: string
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: []
      }
      document_reviews: {
        Row: {
          annotations: Json | null
          comments: string | null
          created_at: string
          document_id: string
          id: string
          review_type: string
          reviewed_at: string | null
          reviewer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          annotations?: Json | null
          comments?: string | null
          created_at?: string
          document_id: string
          id?: string
          review_type?: string
          reviewed_at?: string | null
          reviewer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          annotations?: Json | null
          comments?: string | null
          created_at?: string
          document_id?: string
          id?: string
          review_type?: string
          reviewed_at?: string | null
          reviewer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_repository"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          created_at: string
          document_id: string
          id: string
          signature_data: string | null
          signature_position: Json | null
          signature_timestamp: string
          signer_id: string
          signer_role: string
          status: Database["public"]["Enums"]["signature_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          signature_data?: string | null
          signature_position?: Json | null
          signature_timestamp?: string
          signer_id: string
          signer_role: string
          status?: Database["public"]["Enums"]["signature_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          signature_data?: string | null
          signature_position?: Json | null
          signature_timestamp?: string
          signer_id?: string
          signer_role?: string
          status?: Database["public"]["Enums"]["signature_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_repository"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_type: string | null
          changes_description: string | null
          created_at: string
          document_id: string
          file_url: string
          id: string
          is_major_version: boolean | null
          parent_version_id: string | null
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          change_type?: string | null
          changes_description?: string | null
          created_at?: string
          document_id: string
          file_url: string
          id?: string
          is_major_version?: boolean | null
          parent_version_id?: string | null
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          change_type?: string | null
          changes_description?: string | null
          created_at?: string
          document_id?: string
          file_url?: string
          id?: string
          is_major_version?: boolean | null
          parent_version_id?: string | null
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_repository"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflows: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          approver_role: string
          comments: string | null
          created_at: string
          document_id: string
          id: string
          status: Database["public"]["Enums"]["document_workflow_status"]
          updated_at: string
          workflow_step: number
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          approver_role: string
          comments?: string | null
          created_at?: string
          document_id: string
          id?: string
          status?: Database["public"]["Enums"]["document_workflow_status"]
          updated_at?: string
          workflow_step?: number
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          approver_role?: string
          comments?: string | null
          created_at?: string
          document_id?: string
          id?: string
          status?: Database["public"]["Enums"]["document_workflow_status"]
          updated_at?: string
          workflow_step?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_workflows_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_repository"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      extracurricular_coaches: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          coach_id: string
          created_at: string | null
          extracurricular_id: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          coach_id: string
          created_at?: string | null
          extracurricular_id: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          coach_id?: string
          created_at?: string | null
          extracurricular_id?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extracurricular_coaches_extracurricular_id_fkey"
            columns: ["extracurricular_id"]
            isOneToOne: false
            referencedRelation: "extracurriculars"
            referencedColumns: ["id"]
          },
        ]
      }
      extracurricular_enrollments: {
        Row: {
          created_at: string
          enrollment_date: string
          extracurricular_id: string
          id: string
          notes: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrollment_date?: string
          extracurricular_id: string
          id?: string
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrollment_date?: string
          extracurricular_id?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracurricular_enrollments_extracurricular_id_fkey"
            columns: ["extracurricular_id"]
            isOneToOne: false
            referencedRelation: "extracurriculars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracurricular_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
          registration_open: boolean | null
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
          registration_open?: boolean | null
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
          registration_open?: boolean | null
          schedule_day?: string | null
          schedule_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homeroom_journals: {
        Row: {
          activity_description: string
          attachments: Json | null
          attendance_summary: string | null
          behavioral_notes: string | null
          class_id: string
          created_at: string
          follow_up_actions: string | null
          homeroom_teacher_id: string
          id: string
          journal_date: string
          learning_progress: string | null
          period_type: string | null
          student_notes: string | null
          updated_at: string
        }
        Insert: {
          activity_description: string
          attachments?: Json | null
          attendance_summary?: string | null
          behavioral_notes?: string | null
          class_id: string
          created_at?: string
          follow_up_actions?: string | null
          homeroom_teacher_id: string
          id?: string
          journal_date: string
          learning_progress?: string | null
          period_type?: string | null
          student_notes?: string | null
          updated_at?: string
        }
        Update: {
          activity_description?: string
          attachments?: Json | null
          attendance_summary?: string | null
          behavioral_notes?: string | null
          class_id?: string
          created_at?: string
          follow_up_actions?: string | null
          homeroom_teacher_id?: string
          id?: string
          journal_date?: string
          learning_progress?: string | null
          period_type?: string | null
          student_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      journal_student_entries: {
        Row: {
          academic_progress: string | null
          behavior_rating: number | null
          created_at: string
          id: string
          individual_notes: string | null
          journal_id: string
          special_notes: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_progress?: string | null
          behavior_rating?: number | null
          created_at?: string
          id?: string
          individual_notes?: string | null
          journal_id: string
          special_notes?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_progress?: string | null
          behavior_rating?: number | null
          created_at?: string
          id?: string
          individual_notes?: string | null
          journal_id?: string
          special_notes?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_student_entries_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "homeroom_journals"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_generation_queue: {
        Row: {
          created_at: string
          error_message: string | null
          generated_at: string | null
          generation_data: Json | null
          id: string
          letter_request_id: string
          pdf_url: string | null
          status: string
          template_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          generated_at?: string | null
          generation_data?: Json | null
          id?: string
          letter_request_id: string
          pdf_url?: string | null
          status?: string
          template_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          generated_at?: string | null
          generation_data?: Json | null
          id?: string
          letter_request_id?: string
          pdf_url?: string | null
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_generation_queue_letter_request_id_fkey"
            columns: ["letter_request_id"]
            isOneToOne: false
            referencedRelation: "letter_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_generation_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "letter_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_requests: {
        Row: {
          additional_notes: string | null
          attachment_urls: string[] | null
          created_at: string
          id: string
          issued_at: string | null
          issued_by: string | null
          letter_type: string
          letter_url: string | null
          processed_at: string | null
          processed_by: string | null
          purpose: string
          rejection_reason: string | null
          request_number: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          attachment_urls?: string[] | null
          created_at?: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          letter_type: string
          letter_url?: string | null
          processed_at?: string | null
          processed_by?: string | null
          purpose: string
          rejection_reason?: string | null
          request_number: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          attachment_urls?: string[] | null
          created_at?: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          letter_type?: string
          letter_url?: string | null
          processed_at?: string | null
          processed_by?: string | null
          purpose?: string
          rejection_reason?: string | null
          request_number?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          letter_type: string
          template_content: string
          template_name: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          letter_type: string
          template_content: string
          template_name: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          letter_type?: string
          template_content?: string
          template_name?: string
          updated_at?: string
          variables?: Json | null
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
      notification_channels: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          attempts: number
          channel_type: string
          created_at: string
          error_message: string | null
          id: string
          max_attempts: number
          metadata: Json | null
          notification_id: string | null
          recipient: string
          scheduled_at: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          metadata?: Json | null
          notification_id?: string | null
          recipient: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          metadata?: Json | null
          notification_id?: string | null
          recipient?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          channels: string[]
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message_template: string
          name: string
          title_template: string
          type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          channels?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message_template: string
          name: string
          title_template: string
          type?: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          channels?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message_template?: string
          name?: string
          title_template?: string
          type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      parent_access: {
        Row: {
          access_level: string
          created_at: string
          id: string
          is_active: boolean
          parent_user_id: string
          relationship: string
          student_id: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_user_id: string
          relationship: string
          student_id: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_user_id?: string
          relationship?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_access_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_communications: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          message: string
          parent_user_id: string
          priority: string
          read_at: string | null
          recipient_id: string | null
          recipient_type: string
          replied_at: string | null
          reply_message: string | null
          status: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message: string
          parent_user_id: string
          priority?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type: string
          replied_at?: string | null
          reply_message?: string | null
          status?: string
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message?: string
          parent_user_id?: string
          priority?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
          replied_at?: string | null
          reply_message?: string | null
          status?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          parent_user_id: string
          priority: string
          read_at: string | null
          reference_id: string | null
          reference_table: string | null
          student_id: string
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          parent_user_id: string
          priority?: string
          read_at?: string | null
          reference_id?: string | null
          reference_table?: string | null
          student_id: string
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          parent_user_id?: string
          priority?: string
          read_at?: string | null
          reference_id?: string | null
          reference_table?: string | null
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      permit_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string
          permit_id: string
          read_at: string | null
          recipient_id: string
          recipient_role: string
          sent_at: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type: string
          permit_id: string
          read_at?: string | null
          recipient_id: string
          recipient_role: string
          sent_at?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          permit_id?: string
          read_at?: string | null
          recipient_id?: string
          recipient_role?: string
          sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_notifications_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "student_permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_qr_codes: {
        Row: {
          generated_at: string
          id: string
          is_active: boolean
          last_verified_at: string | null
          permit_id: string
          qr_data: string
          qr_url: string
          verification_count: number
        }
        Insert: {
          generated_at?: string
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          permit_id: string
          qr_data: string
          qr_url: string
          verification_count?: number
        }
        Update: {
          generated_at?: string
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          permit_id?: string
          qr_data?: string
          qr_url?: string
          verification_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "permit_qr_codes_permit_id_fkey"
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
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          nip: string | null
          nis: string | null
          phone: string | null
          role: string | null
          student_id: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          nip?: string | null
          nis?: string | null
          phone?: string | null
          role?: string | null
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          nip?: string | null
          nis?: string | null
          phone?: string | null
          role?: string | null
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_approvals: {
        Row: {
          approval_order: number
          approved_at: string | null
          approver_id: string | null
          approver_role: string
          created_at: string
          id: string
          notes: string | null
          proposal_id: string
          status: string
        }
        Insert: {
          approval_order: number
          approved_at?: string | null
          approver_id?: string | null
          approver_role: string
          created_at?: string
          id?: string
          notes?: string | null
          proposal_id: string
          status?: string
        }
        Update: {
          approval_order?: number
          approved_at?: string | null
          approver_id?: string | null
          approver_role?: string
          created_at?: string
          id?: string
          notes?: string | null
          proposal_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_approvals_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "activity_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string | null
        }
        Insert: {
          id?: string
          permission_id?: string | null
        }
        Update: {
          id?: string
          permission_id?: string | null
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
      student_cases: {
        Row: {
          assigned_handler:
            | Database["public"]["Enums"]["case_handler_type"]
            | null
          assigned_to: string | null
          case_number: string
          category: Database["public"]["Enums"]["case_category"]
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          incident_date: string | null
          incident_location: string | null
          is_anonymous: boolean
          priority: Database["public"]["Enums"]["case_priority"]
          reported_by: string | null
          reported_student_class: string | null
          reported_student_id: string | null
          reported_student_name: string | null
          reporter_contact: string | null
          reporter_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
          witnesses: string | null
        }
        Insert: {
          assigned_handler?:
            | Database["public"]["Enums"]["case_handler_type"]
            | null
          assigned_to?: string | null
          case_number: string
          category: Database["public"]["Enums"]["case_category"]
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          incident_date?: string | null
          incident_location?: string | null
          is_anonymous?: boolean
          priority?: Database["public"]["Enums"]["case_priority"]
          reported_by?: string | null
          reported_student_class?: string | null
          reported_student_id?: string | null
          reported_student_name?: string | null
          reporter_contact?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at?: string
          witnesses?: string | null
        }
        Update: {
          assigned_handler?:
            | Database["public"]["Enums"]["case_handler_type"]
            | null
          assigned_to?: string | null
          case_number?: string
          category?: Database["public"]["Enums"]["case_category"]
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          incident_date?: string | null
          incident_location?: string | null
          is_anonymous?: boolean
          priority?: Database["public"]["Enums"]["case_priority"]
          reported_by?: string | null
          reported_student_class?: string | null
          reported_student_id?: string | null
          reported_student_name?: string | null
          reporter_contact?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          updated_at?: string
          witnesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_cases_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_cases_reported_student_id_fkey"
            columns: ["reported_student_id"]
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
      student_extracurricular_attendances: {
        Row: {
          attendance_date: string
          created_at: string | null
          extracurricular_id: string
          id: string
          notes: string | null
          recorded_by: string | null
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          attendance_date?: string
          created_at?: string | null
          extracurricular_id: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          attendance_date?: string
          created_at?: string | null
          extracurricular_id?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_extracurricular_attendances_extracurricular_id_fkey"
            columns: ["extracurricular_id"]
            isOneToOne: false
            referencedRelation: "extracurriculars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_extracurricular_attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_mutations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          destination_school: string | null
          documents_required: string[] | null
          documents_submitted: string[] | null
          id: string
          mutation_date: string
          mutation_type: string
          notes: string | null
          origin_school: string | null
          reason: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          destination_school?: string | null
          documents_required?: string[] | null
          documents_submitted?: string[] | null
          id?: string
          mutation_date: string
          mutation_type: string
          notes?: string | null
          origin_school?: string | null
          reason: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          destination_school?: string | null
          documents_required?: string[] | null
          documents_submitted?: string[] | null
          id?: string
          mutation_date?: string
          mutation_type?: string
          notes?: string | null
          origin_school?: string | null
          reason?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_mutations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_permits: {
        Row: {
          activity_location: string | null
          approval_letter_url: string | null
          approval_workflow: Json | null
          created_at: string
          current_approval_stage: number | null
          dispensation_letter_url: string | null
          emergency_contact: string | null
          end_date: string
          end_time: string | null
          final_approver_id: string | null
          id: string
          parent_approval: boolean | null
          parent_contact: string | null
          permit_category: string | null
          permit_type: string
          qr_code_url: string | null
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          start_time: string | null
          status: string
          student_id: string
          submitted_at: string
          supporting_document_url: string | null
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          activity_location?: string | null
          approval_letter_url?: string | null
          approval_workflow?: Json | null
          created_at?: string
          current_approval_stage?: number | null
          dispensation_letter_url?: string | null
          emergency_contact?: string | null
          end_date: string
          end_time?: string | null
          final_approver_id?: string | null
          id?: string
          parent_approval?: boolean | null
          parent_contact?: string | null
          permit_category?: string | null
          permit_type: string
          qr_code_url?: string | null
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          student_id: string
          submitted_at?: string
          supporting_document_url?: string | null
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          activity_location?: string | null
          approval_letter_url?: string | null
          approval_workflow?: Json | null
          created_at?: string
          current_approval_stage?: number | null
          dispensation_letter_url?: string | null
          emergency_contact?: string | null
          end_date?: string
          end_time?: string | null
          final_approver_id?: string | null
          id?: string
          parent_approval?: boolean | null
          parent_contact?: string | null
          permit_category?: string | null
          permit_type?: string
          qr_code_url?: string | null
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          student_id?: string
          submitted_at?: string
          supporting_document_url?: string | null
          updated_at?: string
          urgency_level?: string | null
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
      student_progress_tracking: {
        Row: {
          academic_notes: string | null
          achievement_count: number | null
          attendance_percentage: number | null
          behavioral_notes: string | null
          created_at: string
          discipline_score: number | null
          id: string
          monthly_summary: Json | null
          semester_summary: Json | null
          student_id: string
          tracking_date: string
          updated_at: string
          violation_count: number | null
        }
        Insert: {
          academic_notes?: string | null
          achievement_count?: number | null
          attendance_percentage?: number | null
          behavioral_notes?: string | null
          created_at?: string
          discipline_score?: number | null
          id?: string
          monthly_summary?: Json | null
          semester_summary?: Json | null
          student_id: string
          tracking_date?: string
          updated_at?: string
          violation_count?: number | null
        }
        Update: {
          academic_notes?: string | null
          achievement_count?: number | null
          attendance_percentage?: number | null
          behavioral_notes?: string | null
          created_at?: string
          discipline_score?: number | null
          id?: string
          monthly_summary?: Json | null
          semester_summary?: Json | null
          student_id?: string
          tracking_date?: string
          updated_at?: string
          violation_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_tracking_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_self_attendances: {
        Row: {
          attendance_date: string
          check_in_latitude: number | null
          check_in_location_id: string | null
          check_in_longitude: number | null
          check_in_time: string | null
          check_out_latitude: number | null
          check_out_location_id: string | null
          check_out_longitude: number | null
          check_out_time: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          student_id: string
          updated_at: string
          violation_created: boolean | null
        }
        Insert: {
          attendance_date?: string
          check_in_latitude?: number | null
          check_in_location_id?: string | null
          check_in_longitude?: number | null
          check_in_time?: string | null
          check_out_latitude?: number | null
          check_out_location_id?: string | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
          violation_created?: boolean | null
        }
        Update: {
          attendance_date?: string
          check_in_latitude?: number | null
          check_in_location_id?: string | null
          check_in_longitude?: number | null
          check_in_time?: string | null
          check_out_latitude?: number | null
          check_out_location_id?: string | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          violation_created?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "student_self_attendances_check_in_location_id_fkey"
            columns: ["check_in_location_id"]
            isOneToOne: false
            referencedRelation: "attendance_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_self_attendances_check_out_location_id_fkey"
            columns: ["check_out_location_id"]
            isOneToOne: false
            referencedRelation: "attendance_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_self_attendances_student_id_fkey"
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
          recorded_by: string | null
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
          recorded_by?: string | null
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
          recorded_by?: string | null
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
      unified_attendances: {
        Row: {
          attendance_date: string
          check_in_latitude: number | null
          check_in_location_id: string | null
          check_in_longitude: number | null
          check_in_method: string | null
          check_in_time: string | null
          check_out_latitude: number | null
          check_out_location_id: string | null
          check_out_longitude: number | null
          check_out_method: string | null
          check_out_time: string | null
          class_id: string | null
          created_at: string
          early_leave_minutes: number | null
          id: string
          late_minutes: number | null
          notes: string | null
          recorded_by: string | null
          status: string
          student_id: string
          updated_at: string
          violation_created: boolean | null
        }
        Insert: {
          attendance_date: string
          check_in_latitude?: number | null
          check_in_location_id?: string | null
          check_in_longitude?: number | null
          check_in_method?: string | null
          check_in_time?: string | null
          check_out_latitude?: number | null
          check_out_location_id?: string | null
          check_out_longitude?: number | null
          check_out_method?: string | null
          check_out_time?: string | null
          class_id?: string | null
          created_at?: string
          early_leave_minutes?: number | null
          id?: string
          late_minutes?: number | null
          notes?: string | null
          recorded_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
          violation_created?: boolean | null
        }
        Update: {
          attendance_date?: string
          check_in_latitude?: number | null
          check_in_location_id?: string | null
          check_in_longitude?: number | null
          check_in_method?: string | null
          check_in_time?: string | null
          check_out_latitude?: number | null
          check_out_location_id?: string | null
          check_out_longitude?: number | null
          check_out_method?: string | null
          check_out_time?: string | null
          class_id?: string | null
          created_at?: string
          early_leave_minutes?: number | null
          id?: string
          late_minutes?: number | null
          notes?: string | null
          recorded_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          violation_created?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_attendances_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          channels: string[]
          created_at: string
          id: string
          is_enabled: boolean
          notification_type: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: string[]
          created_at?: string
          id?: string
          is_enabled?: boolean
          notification_type: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: string[]
          created_at?: string
          id?: string
          is_enabled?: boolean
          notification_type?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_save: boolean
          created_at: string
          date_format: string
          email_notifications: boolean
          id: string
          items_per_page: number
          language: string
          notifications_enabled: boolean
          sms_notifications: boolean
          theme: string
          time_format: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save?: boolean
          created_at?: string
          date_format?: string
          email_notifications?: boolean
          id?: string
          items_per_page?: number
          language?: string
          notifications_enabled?: boolean
          sms_notifications?: boolean
          theme?: string
          time_format?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save?: boolean
          created_at?: string
          date_format?: string
          email_notifications?: boolean
          id?: string
          items_per_page?: number
          language?: string
          notifications_enabled?: boolean
          sms_notifications?: boolean
          theme?: string
          time_format?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean
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
      approve_workflow_step: {
        Args: {
          _workflow_id: string
          _approver_id: string
          _status: Database["public"]["Enums"]["document_workflow_status"]
          _comments?: string
        }
        Returns: boolean
      }
      check_case_escalations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_document_version: {
        Args: {
          _document_id: string
          _file_url: string
          _changes_description: string
          _change_type?: string
          _is_major_version?: boolean
        }
        Returns: string
      }
      create_document_workflow: {
        Args: { _document_id: string; _workflow_steps: Json }
        Returns: string
      }
      create_notification: {
        Args: {
          _user_id: string
          _title: string
          _message: string
          _type?: string
          _data?: Json
        }
        Returns: string
      }
      create_parent_notification: {
        Args: {
          _student_id: string
          _notification_type: string
          _title: string
          _message: string
          _reference_id?: string
          _reference_table?: string
          _priority?: string
          _action_url?: string
          _metadata?: Json
        }
        Returns: undefined
      }
      debug_user_schedule_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          user_roles: string[]
          can_manage_schedules: boolean
        }[]
      }
      generate_case_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_proposal_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_request_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_activity_logs: {
        Args: { since_date: string; limit_count?: number }
        Returns: {
          id: string
          user_id: string
          activity_type: string
          description: string
          page_url: string
          metadata: Json
          created_at: string
          user_name: string
        }[]
      }
      get_ai_task_stats: {
        Args: { since_date: string }
        Returns: {
          task_type: string
          count: number
        }[]
      }
      get_ai_usage_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_ai_usage_count_since: {
        Args: { since_date: string }
        Returns: number
      }
      get_error_logs: {
        Args: { since_date: string; limit_count?: number }
        Returns: {
          id: string
          user_id: string
          error_type: string
          error_message: string
          error_stack: string
          page_url: string
          metadata: Json
          created_at: string
          user_name: string
        }[]
      }
      get_recent_ai_activities: {
        Args: { limit_count: number }
        Returns: {
          id: string
          task_type: string
          created_at: string
          user_name: string
          provider: string
          tokens_used: number
        }[]
      }
      has_permission: {
        Args: { _user_id: string; _permission_name: string }
        Returns: boolean
      }
      initialize_permit_workflow: {
        Args: { _permit_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_within_location_radius: {
        Args: { student_lat: number; student_lng: number; location_id: string }
        Returns: boolean
      }
      link_profile_to_student: {
        Args: { profile_id: string; student_identifier: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_user_id: string
          p_activity_type: string
          p_description: string
          p_page_url: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_ai_usage: {
        Args: {
          p_user_id: string
          p_provider: string
          p_task_type: string
          p_prompt_length: number
          p_response_length: number
          p_tokens_used: number
          p_cost?: number
        }
        Returns: undefined
      }
      log_error: {
        Args: {
          p_user_id: string
          p_error_type: string
          p_error_message: string
          p_error_stack?: string
          p_page_url?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      process_letter_approval: {
        Args: {
          _request_id: string
          _processor_id: string
          _status: string
          _notes?: string
        }
        Returns: boolean
      }
      process_permit_approval: {
        Args: {
          _permit_id: string
          _approver_id: string
          _status: string
          _notes?: string
        }
        Returns: boolean
      }
      process_proposal_approval: {
        Args: {
          _proposal_id: string
          _approver_id: string
          _status: string
          _notes?: string
        }
        Returns: boolean
      }
      queue_letter_generation: {
        Args: { _letter_request_id: string }
        Returns: string
      }
      recalculate_discipline_points: {
        Args: {
          _student_id: string
          _academic_year_id: string
          _semester_id?: string
        }
        Returns: undefined
      }
      send_multi_channel_notification: {
        Args:
          | {
              _user_id: string
              _title: string
              _message: string
              _type?: string
              _channels?: string[]
              _data?: Json
            }
          | {
              _user_id: string
              _title: string
              _message: string
              _type?: string
              _data?: Json
              _channels?: string[]
            }
        Returns: string
      }
      send_notification_by_role: {
        Args: {
          _role: string
          _title: string
          _message: string
          _type?: string
          _channels?: string[]
          _data?: Json
        }
        Returns: number
      }
      update_notification_queue_status: {
        Args: { _queue_id: string; _status: string; _error_message?: string }
        Returns: boolean
      }
      update_student_progress_tracking: {
        Args: { _student_id: string }
        Returns: undefined
      }
      verify_permit_qr: {
        Args: { _permit_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
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
        | "osis"
      case_category:
        | "bullying"
        | "kekerasan"
        | "narkoba"
        | "pergaulan_bebas"
        | "tawuran"
        | "pencurian"
        | "vandalisme"
        | "lainnya"
      case_handler_type: "tppk" | "arps" | "p4gn" | "guru_bk" | "waka_kesiswaan"
      case_priority: "low" | "medium" | "high" | "critical"
      case_status:
        | "pending"
        | "under_review"
        | "investigating"
        | "escalated"
        | "resolved"
        | "closed"
      document_workflow_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "published"
      signature_status: "pending" | "signed" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
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
        "osis",
      ],
      case_category: [
        "bullying",
        "kekerasan",
        "narkoba",
        "pergaulan_bebas",
        "tawuran",
        "pencurian",
        "vandalisme",
        "lainnya",
      ],
      case_handler_type: ["tppk", "arps", "p4gn", "guru_bk", "waka_kesiswaan"],
      case_priority: ["low", "medium", "high", "critical"],
      case_status: [
        "pending",
        "under_review",
        "investigating",
        "escalated",
        "resolved",
        "closed",
      ],
      document_workflow_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "published",
      ],
      signature_status: ["pending", "signed", "rejected"],
    },
  },
} as const
