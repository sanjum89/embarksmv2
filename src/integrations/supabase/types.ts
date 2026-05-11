export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          accent_color: string | null
          created_at: string | null
          data: Json
          id: string
          is_default: boolean | null
          logo: string | null
          logo_superlight: string | null
          name: string
          use_case_context: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          is_default?: boolean | null
          logo?: string | null
          logo_superlight?: string | null
          name: string
          use_case_context?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          is_default?: boolean | null
          logo?: string | null
          logo_superlight?: string | null
          name?: string
          use_case_context?: string | null
        }
        Relationships: []
      }
      agent_one_events: {
        Row: {
          account_id: string
          category: string
          created_at: string
          event_type: string
          id: string
          payload: Json
          related_assessment_id: string | null
          related_employee_ids: Json
          related_mentor_employee_id: string | null
          related_role_play_id: string | null
          related_skill_target_id: string | null
          source_employee_id: string | null
          source_user_id: string | null
          status: string
          target_employee_id: string | null
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          category: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          related_assessment_id?: string | null
          related_employee_ids?: Json
          related_mentor_employee_id?: string | null
          related_role_play_id?: string | null
          related_skill_target_id?: string | null
          source_employee_id?: string | null
          source_user_id?: string | null
          status?: string
          target_employee_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          category?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          related_assessment_id?: string | null
          related_employee_ids?: Json
          related_mentor_employee_id?: string | null
          related_role_play_id?: string | null
          related_skill_target_id?: string | null
          source_employee_id?: string | null
          source_user_id?: string | null
          status?: string
          target_employee_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_one_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_instances: {
        Row: {
          account_id: string
          agent_action: Database["public"]["Enums"]["agent_action"] | null
          agent_rationale: string | null
          attempt_number: number
          blueprint_code: string | null
          chapter_code: string | null
          cohort_id: string
          completed_at: string | null
          created_at: string
          employee_id: string
          generated_questions: Json
          id: string
          kind: Database["public"]["Enums"]["assessment_scope"]
          learner_responses: Json
          metadata: Json
          module_code: string | null
          score: number | null
          started_at: string
          status: string
          strong_topic_tags: string[]
          updated_at: string
          weak_topic_tags: string[]
        }
        Insert: {
          account_id: string
          agent_action?: Database["public"]["Enums"]["agent_action"] | null
          agent_rationale?: string | null
          attempt_number?: number
          blueprint_code?: string | null
          chapter_code?: string | null
          cohort_id: string
          completed_at?: string | null
          created_at?: string
          employee_id: string
          generated_questions?: Json
          id?: string
          kind: Database["public"]["Enums"]["assessment_scope"]
          learner_responses?: Json
          metadata?: Json
          module_code?: string | null
          score?: number | null
          started_at?: string
          status?: string
          strong_topic_tags?: string[]
          updated_at?: string
          weak_topic_tags?: string[]
        }
        Update: {
          account_id?: string
          agent_action?: Database["public"]["Enums"]["agent_action"] | null
          agent_rationale?: string | null
          attempt_number?: number
          blueprint_code?: string | null
          chapter_code?: string | null
          cohort_id?: string
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          generated_questions?: Json
          id?: string
          kind?: Database["public"]["Enums"]["assessment_scope"]
          learner_responses?: Json
          metadata?: Json
          module_code?: string | null
          score?: number | null
          started_at?: string
          status?: string
          strong_topic_tags?: string[]
          updated_at?: string
          weak_topic_tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_instances_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_assessment_blueprints: {
        Row: {
          account_id: string
          assessment_summary: string | null
          assessment_title: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          blueprint_code: string
          chapter_code: string | null
          created_at: string
          display_order: number
          distinction_criteria: string | null
          evidence_generated: string[]
          id: string
          metadata: Json
          module_code: string
          pass_criteria: string | null
          passing_score: number
          realistic_synthetic_prompt_or_scenario: string | null
          remediation_if_failed: string | null
          scope: Database["public"]["Enums"]["assessment_scope"]
          scoring_dimensions: Json
          topic_outline: Json
          updated_at: string
        }
        Insert: {
          account_id: string
          assessment_summary?: string | null
          assessment_title: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          blueprint_code: string
          chapter_code?: string | null
          created_at?: string
          display_order?: number
          distinction_criteria?: string | null
          evidence_generated?: string[]
          id?: string
          metadata?: Json
          module_code: string
          pass_criteria?: string | null
          passing_score?: number
          realistic_synthetic_prompt_or_scenario?: string | null
          remediation_if_failed?: string | null
          scope?: Database["public"]["Enums"]["assessment_scope"]
          scoring_dimensions?: Json
          topic_outline?: Json
          updated_at?: string
        }
        Update: {
          account_id?: string
          assessment_summary?: string | null
          assessment_title?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          blueprint_code?: string
          chapter_code?: string | null
          created_at?: string
          display_order?: number
          distinction_criteria?: string | null
          evidence_generated?: string[]
          id?: string
          metadata?: Json
          module_code?: string
          pass_criteria?: string | null
          passing_score?: number
          realistic_synthetic_prompt_or_scenario?: string | null
          remediation_if_failed?: string | null
          scope?: Database["public"]["Enums"]["assessment_scope"]
          scoring_dimensions?: Json
          topic_outline?: Json
          updated_at?: string
        }
        Relationships: []
      }
      catalog_chapters: {
        Row: {
          account_id: string
          chapter_code: string
          chapter_summary: string | null
          chapter_title: string
          complexity: number
          content_type: Database["public"]["Enums"]["chapter_content_type"]
          created_at: string
          delivery_mode: Database["public"]["Enums"]["delivery_mode"]
          difficulty_level: Database["public"]["Enums"]["difficulty_level"]
          display_order: number
          estimated_time_minutes: number
          id: string
          learning_objective: string | null
          metadata: Json
          module_code: string
          practical_activity: string | null
          realistic_content_outline: string | null
          reflection_prompt: string | null
          related_capabilities: string[]
          topic_tags: string[]
          updated_at: string
        }
        Insert: {
          account_id: string
          chapter_code: string
          chapter_summary?: string | null
          chapter_title: string
          complexity?: number
          content_type?: Database["public"]["Enums"]["chapter_content_type"]
          created_at?: string
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          display_order?: number
          estimated_time_minutes?: number
          id?: string
          learning_objective?: string | null
          metadata?: Json
          module_code: string
          practical_activity?: string | null
          realistic_content_outline?: string | null
          reflection_prompt?: string | null
          related_capabilities?: string[]
          topic_tags?: string[]
          updated_at?: string
        }
        Update: {
          account_id?: string
          chapter_code?: string
          chapter_summary?: string | null
          chapter_title?: string
          complexity?: number
          content_type?: Database["public"]["Enums"]["chapter_content_type"]
          created_at?: string
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          display_order?: number
          estimated_time_minutes?: number
          id?: string
          learning_objective?: string | null
          metadata?: Json
          module_code?: string
          practical_activity?: string | null
          realistic_content_outline?: string | null
          reflection_prompt?: string | null
          related_capabilities?: string[]
          topic_tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      catalog_evidence_tasks: {
        Row: {
          account_id: string
          created_at: string
          display_order: number
          evidence_description: string | null
          evidence_task_code: string
          evidence_title: string
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          example_synthetic_evidence_summary: string | null
          id: string
          metadata: Json
          module_code: string
          quality_indicators: string[]
          required_for_gate: boolean
          reviewer_role: Database["public"]["Enums"]["reviewer_role"]
          submission_format: Database["public"]["Enums"]["submission_format"]
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          display_order?: number
          evidence_description?: string | null
          evidence_task_code: string
          evidence_title: string
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          example_synthetic_evidence_summary?: string | null
          id?: string
          metadata?: Json
          module_code: string
          quality_indicators?: string[]
          required_for_gate?: boolean
          reviewer_role?: Database["public"]["Enums"]["reviewer_role"]
          submission_format?: Database["public"]["Enums"]["submission_format"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          display_order?: number
          evidence_description?: string | null
          evidence_task_code?: string
          evidence_title?: string
          evidence_type?: Database["public"]["Enums"]["evidence_type"]
          example_synthetic_evidence_summary?: string | null
          id?: string
          metadata?: Json
          module_code?: string
          quality_indicators?: string[]
          required_for_gate?: boolean
          reviewer_role?: Database["public"]["Enums"]["reviewer_role"]
          submission_format?: Database["public"]["Enums"]["submission_format"]
          updated_at?: string
        }
        Relationships: []
      }
      catalog_gate_requirements: {
        Row: {
          account_id: string
          created_at: string
          gate_code: string
          id: string
          notes: string | null
          requirement_code: string
          requirement_kind: Database["public"]["Enums"]["gate_requirement_kind"]
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          gate_code: string
          id?: string
          notes?: string | null
          requirement_code: string
          requirement_kind: Database["public"]["Enums"]["gate_requirement_kind"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          gate_code?: string
          id?: string
          notes?: string | null
          requirement_code?: string
          requirement_kind?: Database["public"]["Enums"]["gate_requirement_kind"]
          updated_at?: string
        }
        Relationships: []
      }
      catalog_modules: {
        Row: {
          account_id: string
          created_at: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level"]
          display_order: number
          domain_code: string
          estimated_effort_hours: number | null
          id: string
          is_core_required: boolean
          is_shell: boolean
          is_stretch_module: boolean
          learning_track_code: string
          manager_conversation_prompt: string | null
          metadata: Json
          module_code: string
          module_summary: string | null
          module_title: string
          nudge_trigger_tags: string[]
          prerequisite_module_codes: string[]
          progression_stage: string | null
          recommended_delivery_mode: Database["public"]["Enums"]["delivery_mode"]
          remediation_recommendation: string | null
          risk_flags_if_not_completed: string[]
          role_cohort_code: string
          stretch_recommendation: string | null
          stretch_target_role_cohort: string | null
          stretch_unlock_conditions: string[]
          target_capabilities: string[]
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          display_order?: number
          domain_code: string
          estimated_effort_hours?: number | null
          id?: string
          is_core_required?: boolean
          is_shell?: boolean
          is_stretch_module?: boolean
          learning_track_code: string
          manager_conversation_prompt?: string | null
          metadata?: Json
          module_code: string
          module_summary?: string | null
          module_title: string
          nudge_trigger_tags?: string[]
          prerequisite_module_codes?: string[]
          progression_stage?: string | null
          recommended_delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          remediation_recommendation?: string | null
          risk_flags_if_not_completed?: string[]
          role_cohort_code: string
          stretch_recommendation?: string | null
          stretch_target_role_cohort?: string | null
          stretch_unlock_conditions?: string[]
          target_capabilities?: string[]
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          display_order?: number
          domain_code?: string
          estimated_effort_hours?: number | null
          id?: string
          is_core_required?: boolean
          is_shell?: boolean
          is_stretch_module?: boolean
          learning_track_code?: string
          manager_conversation_prompt?: string | null
          metadata?: Json
          module_code?: string
          module_summary?: string | null
          module_title?: string
          nudge_trigger_tags?: string[]
          prerequisite_module_codes?: string[]
          progression_stage?: string | null
          recommended_delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          remediation_recommendation?: string | null
          risk_flags_if_not_completed?: string[]
          role_cohort_code?: string
          stretch_recommendation?: string | null
          stretch_target_role_cohort?: string | null
          stretch_unlock_conditions?: string[]
          target_capabilities?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      catalog_readiness_gates: {
        Row: {
          account_id: string
          applies_to_role_cohort: string
          assessor_signoff_required: boolean
          behavioural_indicators: string[]
          business_impact_indicators: string[]
          created_at: string
          gate_code: string
          gate_title: string
          id: string
          manager_signoff_required: boolean
          metadata: Json
          readiness_outcomes: string[]
          target_next_role_or_stretch_level: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          applies_to_role_cohort: string
          assessor_signoff_required?: boolean
          behavioural_indicators?: string[]
          business_impact_indicators?: string[]
          created_at?: string
          gate_code: string
          gate_title: string
          id?: string
          manager_signoff_required?: boolean
          metadata?: Json
          readiness_outcomes?: string[]
          target_next_role_or_stretch_level?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          applies_to_role_cohort?: string
          assessor_signoff_required?: boolean
          behavioural_indicators?: string[]
          business_impact_indicators?: string[]
          created_at?: string
          gate_code?: string
          gate_title?: string
          id?: string
          manager_signoff_required?: boolean
          metadata?: Json
          readiness_outcomes?: string[]
          target_next_role_or_stretch_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chapter_lock_events: {
        Row: {
          account_id: string
          chapter_code: string
          cohort_id: string
          created_at: string
          employee_id: string
          id: string
          module_code: string
          reason: string | null
          triggered_by_assessment_id: string | null
          unlocked_at: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          chapter_code: string
          cohort_id: string
          created_at?: string
          employee_id: string
          id?: string
          module_code: string
          reason?: string | null
          triggered_by_assessment_id?: string | null
          unlocked_at?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          chapter_code?: string
          cohort_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          module_code?: string
          reason?: string | null
          triggered_by_assessment_id?: string | null
          unlocked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_lock_events_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_enrollments: {
        Row: {
          account_id: string
          cohort_id: string
          employee_id: string
          enrolled_at: string
          id: string
          metadata: Json
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          cohort_id: string
          employee_id: string
          enrolled_at?: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          cohort_id?: string
          employee_id?: string
          enrolled_at?: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          account_id: string
          assessment_pass_percentage: number
          cohort_code: string
          cohort_title: string
          common_assessment_date: string | null
          created_at: string
          domain_code: string
          due_date: string | null
          id: string
          is_legacy_skill_target_wrapper: boolean
          metadata: Json
          next_cohort_id: string | null
          progress_check_max_per_module: number
          role_cohort_code: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          assessment_pass_percentage?: number
          cohort_code: string
          cohort_title: string
          common_assessment_date?: string | null
          created_at?: string
          domain_code: string
          due_date?: string | null
          id?: string
          is_legacy_skill_target_wrapper?: boolean
          metadata?: Json
          next_cohort_id?: string | null
          progress_check_max_per_module?: number
          role_cohort_code: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          assessment_pass_percentage?: number
          cohort_code?: string
          cohort_title?: string
          common_assessment_date?: string | null
          created_at?: string
          domain_code?: string
          due_date?: string | null
          id?: string
          is_legacy_skill_target_wrapper?: boolean
          metadata?: Json
          next_cohort_id?: string | null
          progress_check_max_per_module?: number
          role_cohort_code?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_next_cohort_id_fkey"
            columns: ["next_cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_catalog: {
        Row: {
          account_id: string
          competency_id: string
          competency_name: string
          created_at: string
          display_order: number
          evidence_needed: string | null
          id: string
          metadata: Json
          risk_critical: boolean
          short_description: string | null
          supporting_skills: string[]
          track_code: string
          updated_at: string
        }
        Insert: {
          account_id: string
          competency_id: string
          competency_name: string
          created_at?: string
          display_order?: number
          evidence_needed?: string | null
          id?: string
          metadata?: Json
          risk_critical?: boolean
          short_description?: string | null
          supporting_skills?: string[]
          track_code: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          competency_id?: string
          competency_name?: string
          created_at?: string
          display_order?: number
          evidence_needed?: string | null
          id?: string
          metadata?: Json
          risk_critical?: boolean
          short_description?: string | null
          supporting_skills?: string[]
          track_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          account_id: string
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          account_id: string
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_persona_assignments: {
        Row: {
          account_id: string
          assigned_at: string
          employee_id: string
          id: string
          metadata: Json
          persona_code: string
          role_progression_code: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          assigned_at?: string
          employee_id: string
          id?: string
          metadata?: Json
          persona_code: string
          role_progression_code?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          assigned_at?: string
          employee_id?: string
          id?: string
          metadata?: Json
          persona_code?: string
          role_progression_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_personas: {
        Row: {
          account_id: string
          code: string
          created_at: string
          default_role_progression_code: string | null
          description: string | null
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          account_id: string
          code: string
          created_at?: string
          default_role_progression_code?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          code?: string
          created_at?: string
          default_role_progression_code?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      learner_analytics: {
        Row: {
          account_id: string
          cohort_id: string
          created_at: string
          employee_id: string
          id: string
          last_activity_at: string | null
          metadata: Json
          rolling_strong_topic_tags: string[]
          rolling_weak_topic_tags: string[]
          time_to_readiness_days: number | null
          total_assessment_attempts: number
          total_micro_learnings: number
          total_retakes: number
          updated_at: string
        }
        Insert: {
          account_id: string
          cohort_id: string
          created_at?: string
          employee_id: string
          id?: string
          last_activity_at?: string | null
          metadata?: Json
          rolling_strong_topic_tags?: string[]
          rolling_weak_topic_tags?: string[]
          time_to_readiness_days?: number | null
          total_assessment_attempts?: number
          total_micro_learnings?: number
          total_retakes?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          cohort_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          last_activity_at?: string | null
          metadata?: Json
          rolling_strong_topic_tags?: string[]
          rolling_weak_topic_tags?: string[]
          time_to_readiness_days?: number | null
          total_assessment_attempts?: number
          total_micro_learnings?: number
          total_retakes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_analytics_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_progress: {
        Row: {
          account_id: string
          chapter_code: string | null
          cohort_id: string
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          is_locked: boolean
          metadata: Json
          module_code: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          chapter_code?: string | null
          cohort_id: string
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_locked?: boolean
          metadata?: Json
          module_code: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          chapter_code?: string | null
          cohort_id?: string
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_locked?: boolean
          metadata?: Json
          module_code?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_progress_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_tracks: {
        Row: {
          account_id: string
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          account_id: string
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_assignments: {
        Row: {
          account_id: string
          assigned_by_user_id: string
          created_at: string
          focus_areas: Json
          id: string
          mentee_employee_id: string
          mentor_employee_id: string
          notes: string | null
          reason: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          assigned_by_user_id: string
          created_at?: string
          focus_areas?: Json
          id?: string
          mentee_employee_id: string
          mentor_employee_id: string
          notes?: string | null
          reason?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          assigned_by_user_id?: string
          created_at?: string
          focus_areas?: Json
          id?: string
          mentee_employee_id?: string
          mentor_employee_id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_assignments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_learnings: {
        Row: {
          account_id: string
          chapters: Json
          cohort_id: string
          completed_at: string | null
          correct_answer: string | null
          created_at: string
          employee_id: string
          failed_question: string
          id: string
          learner_answer: string | null
          practical_activity: string | null
          source_assessment_id: string
          status: string
          teaching_content_outline: string | null
          updated_at: string
          why_wrong: string | null
        }
        Insert: {
          account_id: string
          chapters?: Json
          cohort_id: string
          completed_at?: string | null
          correct_answer?: string | null
          created_at?: string
          employee_id: string
          failed_question: string
          id?: string
          learner_answer?: string | null
          practical_activity?: string | null
          source_assessment_id: string
          status?: string
          teaching_content_outline?: string | null
          updated_at?: string
          why_wrong?: string | null
        }
        Update: {
          account_id?: string
          chapters?: Json
          cohort_id?: string
          completed_at?: string | null
          correct_answer?: string | null
          created_at?: string
          employee_id?: string
          failed_question?: string
          id?: string
          learner_answer?: string | null
          practical_activity?: string | null
          source_assessment_id?: string
          status?: string
          teaching_content_outline?: string | null
          updated_at?: string
          why_wrong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "micro_learnings_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_learnings_source_assessment_id_fkey"
            columns: ["source_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      module_competency_tags: {
        Row: {
          account_id: string
          can_be_diagnostic_only: boolean
          can_be_microlearning: boolean
          can_be_skipped_after_validation: boolean
          created_at: string
          default_delivery: string
          id: string
          module_code: string
          primary_competency_id: string
          risk_critical: boolean
          secondary_competency_ids: string[]
          updated_at: string
        }
        Insert: {
          account_id: string
          can_be_diagnostic_only?: boolean
          can_be_microlearning?: boolean
          can_be_skipped_after_validation?: boolean
          created_at?: string
          default_delivery?: string
          id?: string
          module_code: string
          primary_competency_id: string
          risk_critical?: boolean
          secondary_competency_ids?: string[]
          updated_at?: string
        }
        Update: {
          account_id?: string
          can_be_diagnostic_only?: boolean
          can_be_microlearning?: boolean
          can_be_skipped_after_validation?: boolean
          created_at?: string
          default_delivery?: string
          id?: string
          module_code?: string
          primary_competency_id?: string
          risk_critical?: boolean
          secondary_competency_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      nudge_cards: {
        Row: {
          account_id: string
          audience_type: string
          category: string | null
          color_theme: string
          created_at: string
          created_by: string
          cta_action: Json
          cta_label: string
          grouping_key: string | null
          id: string
          metadata: Json | null
          priority: string
          recipient_employee_id: string | null
          source_event_id: string | null
          subtitle: string
          target_user_id: string
          title: string
          type: string
          viewed: boolean
        }
        Insert: {
          account_id: string
          audience_type?: string
          category?: string | null
          color_theme?: string
          created_at?: string
          created_by?: string
          cta_action?: Json
          cta_label?: string
          grouping_key?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          recipient_employee_id?: string | null
          source_event_id?: string | null
          subtitle?: string
          target_user_id: string
          title: string
          type: string
          viewed?: boolean
        }
        Update: {
          account_id?: string
          audience_type?: string
          category?: string | null
          color_theme?: string
          created_at?: string
          created_by?: string
          cta_action?: Json
          cta_label?: string
          grouping_key?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          recipient_employee_id?: string | null
          source_event_id?: string | null
          subtitle?: string
          target_user_id?: string
          title?: string
          type?: string
          viewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "nudge_cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_competency_profiles: {
        Row: {
          account_id: string
          competency_id: string
          confidence: string
          created_at: string
          current_level: number
          id: string
          persona_code: string
          short_rationale: string | null
          updated_at: string
          validation_needed: boolean
        }
        Insert: {
          account_id: string
          competency_id: string
          confidence?: string
          created_at?: string
          current_level: number
          id?: string
          persona_code: string
          short_rationale?: string | null
          updated_at?: string
          validation_needed?: boolean
        }
        Update: {
          account_id?: string
          competency_id?: string
          confidence?: string
          created_at?: string
          current_level?: number
          id?: string
          persona_code?: string
          short_rationale?: string | null
          updated_at?: string
          validation_needed?: boolean
        }
        Relationships: []
      }
      persona_module_adaptations: {
        Row: {
          account_id: string
          adaptation_type: string
          created_at: string
          id: string
          manager_note: string | null
          module_code: string
          persona_code: string
          reason: string | null
          updated_at: string
          visible_to_learner: boolean
        }
        Insert: {
          account_id: string
          adaptation_type: string
          created_at?: string
          id?: string
          manager_note?: string | null
          module_code: string
          persona_code: string
          reason?: string | null
          updated_at?: string
          visible_to_learner?: boolean
        }
        Update: {
          account_id?: string
          adaptation_type?: string
          created_at?: string
          id?: string
          manager_note?: string | null
          module_code?: string
          persona_code?: string
          reason?: string | null
          updated_at?: string
          visible_to_learner?: boolean
        }
        Relationships: []
      }
      promotion_signals: {
        Row: {
          account_id: string
          cohort_id: string | null
          created_at: string
          current_role_cohort: string
          delta_module_codes: string[]
          employee_id: string
          id: string
          manager_decision: string | null
          manager_notes: string | null
          metadata: Json
          next_cohort_id: string | null
          signal_strength: number
          status: string
          target_role_cohort: string
          triggered_by: Database["public"]["Enums"]["promotion_trigger"]
          updated_at: string
        }
        Insert: {
          account_id: string
          cohort_id?: string | null
          created_at?: string
          current_role_cohort: string
          delta_module_codes?: string[]
          employee_id: string
          id?: string
          manager_decision?: string | null
          manager_notes?: string | null
          metadata?: Json
          next_cohort_id?: string | null
          signal_strength?: number
          status?: string
          target_role_cohort: string
          triggered_by?: Database["public"]["Enums"]["promotion_trigger"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          cohort_id?: string | null
          created_at?: string
          current_role_cohort?: string
          delta_module_codes?: string[]
          employee_id?: string
          id?: string
          manager_decision?: string | null
          manager_notes?: string | null
          metadata?: Json
          next_cohort_id?: string | null
          signal_strength?: number
          status?: string
          target_role_cohort?: string
          triggered_by?: Database["public"]["Enums"]["promotion_trigger"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_signals_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_signals_next_cohort_id_fkey"
            columns: ["next_cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_gate_results: {
        Row: {
          account_id: string
          ai_rationale: string | null
          ai_recommendation:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          assessor_decision:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          assessor_notes: string | null
          assessor_signed_off_at: string | null
          cohort_id: string
          created_at: string
          employee_id: string
          gate_code: string
          id: string
          manager_decision:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          manager_notes: string | null
          manager_signed_off_at: string | null
          metadata: Json
          outcome: Database["public"]["Enums"]["readiness_outcome"] | null
          updated_at: string
        }
        Insert: {
          account_id: string
          ai_rationale?: string | null
          ai_recommendation?:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          assessor_decision?:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          assessor_notes?: string | null
          assessor_signed_off_at?: string | null
          cohort_id: string
          created_at?: string
          employee_id: string
          gate_code: string
          id?: string
          manager_decision?:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          manager_notes?: string | null
          manager_signed_off_at?: string | null
          metadata?: Json
          outcome?: Database["public"]["Enums"]["readiness_outcome"] | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          ai_rationale?: string | null
          ai_recommendation?:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          assessor_decision?:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          assessor_notes?: string | null
          assessor_signed_off_at?: string | null
          cohort_id?: string
          created_at?: string
          employee_id?: string
          gate_code?: string
          id?: string
          manager_decision?:
            | Database["public"]["Enums"]["readiness_outcome"]
            | null
          manager_notes?: string | null
          manager_signed_off_at?: string | null
          metadata?: Json
          outcome?: Database["public"]["Enums"]["readiness_outcome"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_gate_results_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_requests: {
        Row: {
          account_id: string
          created_at: string
          custom_message: string | null
          id: string
          manager_employee_id: string
          questions: Json
          status: string
          target_employee_ids: Json
          topic: string
        }
        Insert: {
          account_id: string
          created_at?: string
          custom_message?: string | null
          id?: string
          manager_employee_id: string
          questions?: Json
          status?: string
          target_employee_ids?: Json
          topic?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          custom_message?: string | null
          id?: string
          manager_employee_id?: string
          questions?: Json
          status?: string
          target_employee_ids?: Json
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          account_id: string
          additional_notes: string | null
          created_at: string
          employee_id: string
          id: string
          manager_feedback: string | null
          manager_id: string
          questions: Json
          raw_conversation: Json
          reviewed_at: string | null
          skills_extracted: Json
          status: string
          submitted_at: string | null
          summary: string | null
          topic: string
          trigger_type: string
        }
        Insert: {
          account_id: string
          additional_notes?: string | null
          created_at?: string
          employee_id: string
          id?: string
          manager_feedback?: string | null
          manager_id?: string
          questions?: Json
          raw_conversation?: Json
          reviewed_at?: string | null
          skills_extracted?: Json
          status?: string
          submitted_at?: string | null
          summary?: string | null
          topic?: string
          trigger_type?: string
        }
        Update: {
          account_id?: string
          additional_notes?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          manager_feedback?: string | null
          manager_id?: string
          questions?: Json
          raw_conversation?: Json
          reviewed_at?: string | null
          skills_extracted?: Json
          status?: string
          submitted_at?: string | null
          summary?: string | null
          topic?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      role_competency_requirements: {
        Row: {
          account_id: string
          competency_id: string
          created_at: string
          id: string
          required_level: number
          role_cohort_code: string
          updated_at: string
        }
        Insert: {
          account_id: string
          competency_id: string
          created_at?: string
          id?: string
          required_level: number
          role_cohort_code: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          competency_id?: string
          created_at?: string
          id?: string
          required_level?: number
          role_cohort_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_progressions: {
        Row: {
          account_id: string
          code: string
          created_at: string
          description: string | null
          domain_code: string
          id: string
          level_order: number
          name: string
          progression_stage: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          code: string
          created_at?: string
          description?: string | null
          domain_code: string
          id?: string
          level_order: number
          name: string
          progression_stage?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          code?: string
          created_at?: string
          description?: string | null
          domain_code?: string
          id?: string
          level_order?: number
          name?: string
          progression_stage?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      super_agent_conversations: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          messages: Json
          metadata: Json | null
          onboarding_stage: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          messages?: Json
          metadata?: Json | null
          onboarding_stage?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          messages?: Json
          metadata?: Json | null
          onboarding_stage?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_agent_conversations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agent_action:
        | "continue"
        | "micro_learn"
        | "reopen_and_lock"
        | "manager_review"
      assessment_scope: "milestone" | "module_post" | "readiness_gate" | "adhoc"
      assessment_type:
        | "diagnostic_knowledge_check"
        | "applied_client_scenario"
        | "investment_research_case"
        | "portfolio_construction_case"
        | "suitability_review"
        | "consumer_duty_judgement_case"
        | "regulatory_knowledge_check"
        | "ethical_dilemma"
        | "client_conversation_simulation"
        | "market_volatility_scenario"
        | "business_development_plan"
        | "observed_client_meeting"
        | "mentor_review"
        | "manager_signoff"
        | "assessor_review"
        | "readiness_board_evidence_pack"
        | "cpd_reflection"
        | "system_workflow_completion"
        | "ai_tool_usage_reflection"
        | "calculation_exercise"
        | "case_analysis"
        | "client_simulation_chat"
        | "client_simulation_voice"
        | "compliance_review_task"
        | "external_certification"
        | "knowledge_check_mcq"
        | "manager_observation"
        | "mentor_signoff"
        | "peer_review"
        | "portfolio_construction_task"
        | "presentation_assessed"
        | "reflective_journal"
        | "scenario_response"
        | "system_task_simulation"
        | "written_long_form"
      chapter_content_type:
        | "reading"
        | "video"
        | "case_study"
        | "client_scenario"
        | "simulation"
        | "system_practice"
        | "shadowing_task"
        | "coaching_discussion"
        | "mentor_discussion"
        | "peer_discussion"
        | "reflection"
        | "quiz"
        | "observed_practice"
        | "workplace_assignment"
        | "coaching"
        | "shadowing"
        | "scenario_walkthrough"
        | "self_study"
        | "presentation_assessed"
        | "role_play_assessed"
      delivery_mode:
        | "digital"
        | "offline"
        | "blended"
        | "live_cohort"
        | "simulation"
        | "workplace_practice"
        | "coaching"
        | "self_study"
      difficulty_level:
        | "foundation"
        | "practitioner"
        | "advanced"
        | "leadership"
      evidence_type:
        | "quiz_score"
        | "written_case_response"
        | "simulation_score"
        | "observed_behaviour_note"
        | "manager_signoff"
        | "mentor_feedback"
        | "assessor_review"
        | "cpd_reflection"
        | "system_task_completion"
        | "workplace_assignment"
        | "client_meeting_observation"
        | "readiness_board_pack"
        | "case_writeup"
        | "manager_observation_form"
        | "mentor_feedback_form"
        | "peer_feedback"
        | "presentation_deck"
        | "shadowing_log"
        | "system_screenshot_pack"
        | "trade_rationale"
      gate_requirement_kind: "track" | "module" | "assessment" | "evidence"
      promotion_trigger:
        | "readiness_gate"
        | "stretch_completion"
        | "manager_initiated"
      readiness_outcome:
        | "not_ready"
        | "ready_with_support"
        | "ready"
        | "ready_for_stretch"
      reviewer_role: "manager" | "mentor" | "assessor" | "peer" | "self"
      submission_format:
        | "written"
        | "upload"
        | "observation"
        | "system_record"
        | "recording"
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
      agent_action: [
        "continue",
        "micro_learn",
        "reopen_and_lock",
        "manager_review",
      ],
      assessment_scope: ["milestone", "module_post", "readiness_gate", "adhoc"],
      assessment_type: [
        "diagnostic_knowledge_check",
        "applied_client_scenario",
        "investment_research_case",
        "portfolio_construction_case",
        "suitability_review",
        "consumer_duty_judgement_case",
        "regulatory_knowledge_check",
        "ethical_dilemma",
        "client_conversation_simulation",
        "market_volatility_scenario",
        "business_development_plan",
        "observed_client_meeting",
        "mentor_review",
        "manager_signoff",
        "assessor_review",
        "readiness_board_evidence_pack",
        "cpd_reflection",
        "system_workflow_completion",
        "ai_tool_usage_reflection",
        "calculation_exercise",
        "case_analysis",
        "client_simulation_chat",
        "client_simulation_voice",
        "compliance_review_task",
        "external_certification",
        "knowledge_check_mcq",
        "manager_observation",
        "mentor_signoff",
        "peer_review",
        "portfolio_construction_task",
        "presentation_assessed",
        "reflective_journal",
        "scenario_response",
        "system_task_simulation",
        "written_long_form",
      ],
      chapter_content_type: [
        "reading",
        "video",
        "case_study",
        "client_scenario",
        "simulation",
        "system_practice",
        "shadowing_task",
        "coaching_discussion",
        "mentor_discussion",
        "peer_discussion",
        "reflection",
        "quiz",
        "observed_practice",
        "workplace_assignment",
        "coaching",
        "shadowing",
        "scenario_walkthrough",
        "self_study",
        "presentation_assessed",
        "role_play_assessed",
      ],
      delivery_mode: [
        "digital",
        "offline",
        "blended",
        "live_cohort",
        "simulation",
        "workplace_practice",
        "coaching",
        "self_study",
      ],
      difficulty_level: [
        "foundation",
        "practitioner",
        "advanced",
        "leadership",
      ],
      evidence_type: [
        "quiz_score",
        "written_case_response",
        "simulation_score",
        "observed_behaviour_note",
        "manager_signoff",
        "mentor_feedback",
        "assessor_review",
        "cpd_reflection",
        "system_task_completion",
        "workplace_assignment",
        "client_meeting_observation",
        "readiness_board_pack",
        "case_writeup",
        "manager_observation_form",
        "mentor_feedback_form",
        "peer_feedback",
        "presentation_deck",
        "shadowing_log",
        "system_screenshot_pack",
        "trade_rationale",
      ],
      gate_requirement_kind: ["track", "module", "assessment", "evidence"],
      promotion_trigger: [
        "readiness_gate",
        "stretch_completion",
        "manager_initiated",
      ],
      readiness_outcome: [
        "not_ready",
        "ready_with_support",
        "ready",
        "ready_for_stretch",
      ],
      reviewer_role: ["manager", "mentor", "assessor", "peer", "self"],
      submission_format: [
        "written",
        "upload",
        "observation",
        "system_record",
        "recording",
      ],
    },
  },
} as const
