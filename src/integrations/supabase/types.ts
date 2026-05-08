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
      [_ in never]: never
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
    Enums: {},
  },
} as const
