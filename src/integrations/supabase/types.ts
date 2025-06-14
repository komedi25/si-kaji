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
      counseling_sessions: {
        Row: {
          case_id: string | null
          counselor_id: string
          created_at: string
          duration_minutes: number | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          notes_encrypted: string | null
          session_date: string
          session_time: string
          session_type: string
          status: string
          student_id: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          counselor_id: string
          created_at?: string
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          notes_encrypted?: string | null
          session_date: string
          session_time: string
          session_type: string
          status?: string
          student_id: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          counselor_id?: string
          created_at?: string
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          notes_encrypted?: string | null
          session_date?: string
          session_time?: string
          session_type?: string
          status?: string
          student_id?: string
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
      document_versions: {
        Row: {
          changes_description: string | null
          created_at: string
          document_id: string
          file_url: string
          id: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          changes_description?: string | null
          created_at?: string
          document_id: string
          file_url: string
          id?: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          changes_description?: string | null
          created_at?: string
          document_id?: string
          file_url?: string
          id?: string
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
      process_proposal_approval: {
        Args: {
          _proposal_id: string
          _approver_id: string
          _status: string
          _notes?: string
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
      send_multi_channel_notification: {
        Args: {
          _user_id: string
          _title: string
          _message: string
          _type?: string
          _data?: Json
          _channels?: string[]
        }
        Returns: string
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
        | "admin"
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
        "admin",
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
    },
  },
} as const
