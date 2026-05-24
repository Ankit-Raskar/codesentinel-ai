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
      ai_reviews: {
        Row: {
          bug_probability: number | null
          completed_at: string | null
          created_at: string
          critical_count: number | null
          error: string | null
          id: string
          merge_safety_score: number | null
          optimization_count: number | null
          performance_score: number | null
          pull_request_id: string
          quality_score: number | null
          raw_response: Json | null
          security_score: number | null
          status: string
          suggestion_count: number | null
          summary: string | null
          total_issues: number | null
          user_id: string
          warning_count: number | null
        }
        Insert: {
          bug_probability?: number | null
          completed_at?: string | null
          created_at?: string
          critical_count?: number | null
          error?: string | null
          id?: string
          merge_safety_score?: number | null
          optimization_count?: number | null
          performance_score?: number | null
          pull_request_id: string
          quality_score?: number | null
          raw_response?: Json | null
          security_score?: number | null
          status?: string
          suggestion_count?: number | null
          summary?: string | null
          total_issues?: number | null
          user_id: string
          warning_count?: number | null
        }
        Update: {
          bug_probability?: number | null
          completed_at?: string | null
          created_at?: string
          critical_count?: number | null
          error?: string | null
          id?: string
          merge_safety_score?: number | null
          optimization_count?: number | null
          performance_score?: number | null
          pull_request_id?: string
          quality_score?: number | null
          raw_response?: Json | null
          security_score?: number | null
          status?: string
          suggestion_count?: number | null
          summary?: string | null
          total_issues?: number | null
          user_id?: string
          warning_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_reviews_pull_request_id_fkey"
            columns: ["pull_request_id"]
            isOneToOne: false
            referencedRelation: "pull_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          review_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          review_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          review_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "ai_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      github_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json | null
          source: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          source?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          source?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          github_token: string | null
          github_username: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          github_token?: string | null
          github_username?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          github_token?: string | null
          github_username?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pull_requests: {
        Row: {
          additions: number | null
          author: string | null
          author_avatar: string | null
          base_ref: string | null
          base_sha: string | null
          body: string | null
          changed_files: number | null
          created_at: string
          deletions: number | null
          github_created_at: string | null
          github_pr_number: number
          head_ref: string | null
          head_sha: string | null
          html_url: string | null
          id: string
          repository_id: string
          state: string
          title: string
          user_id: string
        }
        Insert: {
          additions?: number | null
          author?: string | null
          author_avatar?: string | null
          base_ref?: string | null
          base_sha?: string | null
          body?: string | null
          changed_files?: number | null
          created_at?: string
          deletions?: number | null
          github_created_at?: string | null
          github_pr_number: number
          head_ref?: string | null
          head_sha?: string | null
          html_url?: string | null
          id?: string
          repository_id: string
          state?: string
          title: string
          user_id: string
        }
        Update: {
          additions?: number | null
          author?: string | null
          author_avatar?: string | null
          base_ref?: string | null
          base_sha?: string | null
          body?: string | null
          changed_files?: number | null
          created_at?: string
          deletions?: number | null
          github_created_at?: string | null
          github_pr_number?: number
          head_ref?: string | null
          head_sha?: string | null
          html_url?: string | null
          id?: string
          repository_id?: string
          state?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pull_requests_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      repositories: {
        Row: {
          created_at: string
          default_branch: string | null
          description: string | null
          full_name: string
          github_repo_id: number
          html_url: string | null
          id: string
          language: string | null
          name: string
          private: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          default_branch?: string | null
          description?: string | null
          full_name: string
          github_repo_id: number
          html_url?: string | null
          id?: string
          language?: string | null
          name: string
          private?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          default_branch?: string | null
          description?: string | null
          full_name?: string
          github_repo_id?: number
          html_url?: string | null
          id?: string
          language?: string | null
          name?: string
          private?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      review_comments: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string
          explanation: string
          file_path: string
          id: string
          line_number: number | null
          review_id: string
          severity: string
          suggested_fix: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          explanation: string
          file_path: string
          id?: string
          line_number?: number | null
          review_id: string
          severity?: string
          suggested_fix?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          explanation?: string
          file_path?: string
          id?: string
          line_number?: number | null
          review_id?: string
          severity?: string
          suggested_fix?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "ai_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_postings: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          github_html_url: string | null
          github_review_id: number | null
          id: string
          mode: string
          payload: Json | null
          pull_request_id: string
          review_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          github_html_url?: string | null
          github_review_id?: number | null
          id?: string
          mode: string
          payload?: Json | null
          pull_request_id: string
          review_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          github_html_url?: string | null
          github_review_id?: number | null
          id?: string
          mode?: string
          payload?: Json | null
          pull_request_id?: string
          review_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_postings_pull_request_id_fkey"
            columns: ["pull_request_id"]
            isOneToOne: false
            referencedRelation: "pull_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_postings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "ai_reviews"
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
