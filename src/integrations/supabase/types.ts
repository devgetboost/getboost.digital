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
      academy_courses: {
        Row: {
          category: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          duration: string | null
          external_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          lessons: number | null
          level: string | null
          outcomes: string[] | null
          price: number | null
          price_label: string | null
          slug: string
          sort_order: number
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          external_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          lessons?: number | null
          level?: string | null
          outcomes?: string[] | null
          price?: number | null
          price_label?: string | null
          slug: string
          sort_order?: number
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          external_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          lessons?: number | null
          level?: string | null
          outcomes?: string[] | null
          price?: number | null
          price_label?: string | null
          slug?: string
          sort_order?: number
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_calendar_blocks: {
        Row: {
          active: boolean
          created_at: string
          end_date: string | null
          end_time: string | null
          id: string
          kind: string
          reason: string | null
          start_date: string | null
          start_time: string | null
          timezone: string
          updated_at: string
          user_id: string
          weekday: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          kind: string
          reason?: string | null
          start_date?: string | null
          start_time?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          weekday?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          kind?: string
          reason?: string | null
          start_date?: string | null
          start_time?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          weekday?: number | null
        }
        Relationships: []
      }
      admin_notification_reads: {
        Row: {
          audit_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          audit_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          audit_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_reads_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "social_media_drafts_audit"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          escalated_at: string | null
          id: string
          lead_id: string | null
          link_url: string | null
          priority: string
          quote_id: string | null
          reassign_count: number
          reassigned_at: string | null
          reassigned_from: string | null
          sla_breached_at: string | null
          sla_due_at: string | null
          sla_minutes: number | null
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          escalated_at?: string | null
          id?: string
          lead_id?: string | null
          link_url?: string | null
          priority?: string
          quote_id?: string | null
          reassign_count?: number
          reassigned_at?: string | null
          reassigned_from?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
          sla_minutes?: number | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          escalated_at?: string | null
          id?: string
          lead_id?: string | null
          link_url?: string | null
          priority?: string
          quote_id?: string | null
          reassign_count?: number
          reassigned_at?: string | null
          reassigned_from?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
          sla_minutes?: number | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_tasks_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_agent_audit: {
        Row: {
          action: string
          actor_id: string | null
          agent_id: string
          created_at: string
          from_status: string | null
          id: string
          metadata: Json
          to_status: string | null
          version_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          agent_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          to_status?: string | null
          version_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          agent_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          to_status?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_agent_audit_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_agent_audit_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "agentic_agent_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_agent_metrics_hourly: {
        Row: {
          agent_id: string
          avg_latency_ms: number | null
          created_at: string
          errors: number
          hour: string
          id: string
          p95_latency_ms: number | null
          runs: number
          total_cost_credits: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
        }
        Insert: {
          agent_id: string
          avg_latency_ms?: number | null
          created_at?: string
          errors?: number
          hour: string
          id?: string
          p95_latency_ms?: number | null
          runs?: number
          total_cost_credits?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
        }
        Update: {
          agent_id?: string
          avg_latency_ms?: number | null
          created_at?: string
          errors?: number
          hour?: string
          id?: string
          p95_latency_ms?: number | null
          runs?: number
          total_cost_credits?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_agent_metrics_hourly_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_agent_versions: {
        Row: {
          agent_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          fast_mode: boolean | null
          id: string
          max_tokens: number | null
          model: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          system_prompt: string
          temperature: number | null
          updated_at: string
          version: number
        }
        Insert: {
          agent_id: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          fast_mode?: boolean | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string
          version: number
        }
        Update: {
          agent_id?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          fast_mode?: boolean | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agentic_agent_versions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_agents: {
        Row: {
          active_version_id: string | null
          budget_daily_credits: number | null
          budget_monthly_credits: number | null
          canary_auto_promote: boolean
          canary_error_threshold_pct: number
          canary_halted_at: string | null
          canary_halted_reason: string | null
          canary_min_minutes: number
          canary_min_samples: number
          canary_percent: number
          canary_started_at: string | null
          canary_version_id: string | null
          created_at: string
          created_by: string | null
          description: string
          fast_mode: boolean | null
          function_slug: string | null
          id: string
          max_tokens: number | null
          model: string | null
          name: string
          status: string
          system_prompt: string
          temperature: number | null
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          budget_daily_credits?: number | null
          budget_monthly_credits?: number | null
          canary_auto_promote?: boolean
          canary_error_threshold_pct?: number
          canary_halted_at?: string | null
          canary_halted_reason?: string | null
          canary_min_minutes?: number
          canary_min_samples?: number
          canary_percent?: number
          canary_started_at?: string | null
          canary_version_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          fast_mode?: boolean | null
          function_slug?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          name: string
          status?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          budget_daily_credits?: number | null
          budget_monthly_credits?: number | null
          canary_auto_promote?: boolean
          canary_error_threshold_pct?: number
          canary_halted_at?: string | null
          canary_halted_reason?: string | null
          canary_min_minutes?: number
          canary_min_samples?: number
          canary_percent?: number
          canary_started_at?: string | null
          canary_version_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          fast_mode?: boolean | null
          function_slug?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          name?: string
          status?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentic_agents_active_version_id_fkey"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "agentic_agent_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_agents_canary_version_id_fkey"
            columns: ["canary_version_id"]
            isOneToOne: false
            referencedRelation: "agentic_agent_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_alert_log: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          kind: string
          recipients: string
          runs: number
          threshold: number
          value: number
          window_hours: number
          window_runs: number | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          kind: string
          recipients: string
          runs?: number
          threshold: number
          value: number
          window_hours: number
          window_runs?: number | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          recipients?: string
          runs?: number
          threshold?: number
          value?: number
          window_hours?: number
          window_runs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_alert_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_alert_settings: {
        Row: {
          cooldown_hours: number
          created_at: string
          default_avg_latency_ms: number
          default_error_rate_pct: number
          default_min_runs: number
          enabled: boolean
          id: number
          recipients: string[]
          updated_at: string
          updated_by: string | null
          window_hours: number
        }
        Insert: {
          cooldown_hours?: number
          created_at?: string
          default_avg_latency_ms?: number
          default_error_rate_pct?: number
          default_min_runs?: number
          enabled?: boolean
          id?: number
          recipients?: string[]
          updated_at?: string
          updated_by?: string | null
          window_hours?: number
        }
        Update: {
          cooldown_hours?: number
          created_at?: string
          default_avg_latency_ms?: number
          default_error_rate_pct?: number
          default_min_runs?: number
          enabled?: boolean
          id?: number
          recipients?: string[]
          updated_at?: string
          updated_by?: string | null
          window_hours?: number
        }
        Relationships: []
      }
      agentic_alert_thresholds: {
        Row: {
          agent_id: string | null
          avg_latency_ms: number
          created_at: string
          created_by: string | null
          enabled: boolean
          error_rate_pct: number
          id: string
          min_runs: number
          profile_name: string
          updated_at: string
          window_hours: number | null
          window_runs: number | null
        }
        Insert: {
          agent_id?: string | null
          avg_latency_ms?: number
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          error_rate_pct?: number
          id?: string
          min_runs?: number
          profile_name: string
          updated_at?: string
          window_hours?: number | null
          window_runs?: number | null
        }
        Update: {
          agent_id?: string | null
          avg_latency_ms?: number
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          error_rate_pct?: number
          id?: string
          min_runs?: number
          profile_name?: string
          updated_at?: string
          window_hours?: number | null
          window_runs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_alert_thresholds_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_provider_keys: {
        Row: {
          name: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          name: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          name?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      agentic_run_logs: {
        Row: {
          agent_id: string | null
          cost_credits: number | null
          created_at: string
          error_message: string | null
          error_type: string | null
          finished_at: string | null
          id: string
          input_hash: string | null
          input_tokens: number | null
          latency_ms: number | null
          metadata: Json | null
          model: string | null
          output_preview: string | null
          output_tokens: number | null
          run_id: string
          started_at: string
          status: string
          version_id: string | null
        }
        Insert: {
          agent_id?: string | null
          cost_credits?: number | null
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          finished_at?: string | null
          id?: string
          input_hash?: string | null
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model?: string | null
          output_preview?: string | null
          output_tokens?: number | null
          run_id?: string
          started_at?: string
          status?: string
          version_id?: string | null
        }
        Update: {
          agent_id?: string | null
          cost_credits?: number | null
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          finished_at?: string | null
          id?: string
          input_hash?: string | null
          input_tokens?: number | null
          latency_ms?: number | null
          metadata?: Json | null
          model?: string | null
          output_preview?: string | null
          output_tokens?: number | null
          run_id?: string
          started_at?: string
          status?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_run_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_run_logs_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "agentic_agent_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_scenario_runs: {
        Row: {
          agent_fn: string
          agent_id: string | null
          batch_id: string
          created_at: string
          duration_ms: number | null
          error: string | null
          http_status: number | null
          id: string
          payload: Json | null
          reason: string | null
          request_body: Json | null
          scenario_id: string
          scenario_label: string
          status: string
        }
        Insert: {
          agent_fn: string
          agent_id?: string | null
          batch_id: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          http_status?: number | null
          id?: string
          payload?: Json | null
          reason?: string | null
          request_body?: Json | null
          scenario_id: string
          scenario_label: string
          status: string
        }
        Update: {
          agent_fn?: string
          agent_id?: string | null
          batch_id?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          http_status?: number | null
          id?: string
          payload?: Json | null
          reason?: string | null
          request_body?: Json | null
          scenario_id?: string
          scenario_label?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentic_scenario_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_settings: {
        Row: {
          assistant_name: string
          greeting_message: string
          id: number
          is_active: boolean
          knowledge_base: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          assistant_name?: string
          greeting_message?: string
          id?: number
          is_active?: boolean
          knowledge_base?: string
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          assistant_name?: string
          greeting_message?: string
          id?: number
          is_active?: boolean
          knowledge_base?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_email: string
          author_name: string
          blog_post_id: string
          content: string
          created_at: string
          id: string
          ip_address: string | null
          parent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          author_email: string
          author_name: string
          blog_post_id: string
          content: string
          created_at?: string
          id?: string
          ip_address?: string | null
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          author_email?: string
          author_name?: string
          blog_post_id?: string
          content?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments_public"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string
          featured: boolean
          id: string
          image: string
          keyword: string
          meta_description: string
          meta_title: string
          read_time: string
          scheduled_at: string | null
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          image?: string
          keyword?: string
          meta_description?: string
          meta_title?: string
          read_time?: string
          scheduled_at?: string | null
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          image?: string
          keyword?: string
          meta_description?: string
          meta_title?: string
          read_time?: string
          scheduled_at?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_reschedule_history: {
        Row: {
          actor_source: string
          booking_id: string
          created_at: string
          id: string
          new_meeting_date: string
          new_meeting_link: string | null
          new_meeting_time: string
          new_timezone: string | null
          previous_meeting_date: string | null
          previous_meeting_link: string | null
          previous_meeting_time: string | null
          previous_timezone: string | null
        }
        Insert: {
          actor_source?: string
          booking_id: string
          created_at?: string
          id?: string
          new_meeting_date: string
          new_meeting_link?: string | null
          new_meeting_time: string
          new_timezone?: string | null
          previous_meeting_date?: string | null
          previous_meeting_link?: string | null
          previous_meeting_time?: string | null
          previous_timezone?: string | null
        }
        Update: {
          actor_source?: string
          booking_id?: string
          created_at?: string
          id?: string
          new_meeting_date?: string
          new_meeting_link?: string | null
          new_meeting_time?: string
          new_timezone?: string | null
          previous_meeting_date?: string | null
          previous_meeting_link?: string | null
          previous_meeting_time?: string | null
          previous_timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reschedule_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_settings: {
        Row: {
          available_days: number[]
          available_times: string[]
          id: number
          updated_at: string
        }
        Insert: {
          available_days?: number[]
          available_times?: string[]
          id?: number
          updated_at?: string
        }
        Update: {
          available_days?: number[]
          available_times?: string[]
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          assigned_to: string | null
          challenges: string
          company: string | null
          created_at: string
          email: string
          id: string
          jitsi_room: string | null
          language: string
          lead_status: string
          meeting_date: string
          meeting_link: string | null
          meeting_time: string
          meeting_type: string
          name: string
          phone: string | null
          reminder_2h_sent_at: string | null
          status: string
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          assigned_to?: string | null
          challenges: string
          company?: string | null
          created_at?: string
          email: string
          id?: string
          jitsi_room?: string | null
          language?: string
          lead_status?: string
          meeting_date: string
          meeting_link?: string | null
          meeting_time: string
          meeting_type: string
          name: string
          phone?: string | null
          reminder_2h_sent_at?: string | null
          status?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          assigned_to?: string | null
          challenges?: string
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          jitsi_room?: string | null
          language?: string
          lead_status?: string
          meeting_date?: string
          meeting_link?: string | null
          meeting_time?: string
          meeting_type?: string
          name?: string
          phone?: string | null
          reminder_2h_sent_at?: string | null
          status?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      bookings_lead_status_audit: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          booking_id: string
          created_at: string
          from_status: string | null
          id: string
          metadata: Json
          notes: string | null
          source: string
          to_status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          booking_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          source?: string
          to_status: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          booking_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          source?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lead_status_audit_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          delivered_at: string | null
          error: string | null
          failed_at: string | null
          id: string
          opened_at: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
          variables: Json
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_filter: Json
          body: string | null
          channel: string
          created_at: string
          created_by: string | null
          delay_seconds: number
          id: string
          instance_id: string | null
          name: string
          scheduled_at: string | null
          sent_at: string | null
          stats: Json
          status: string
          subject: string | null
          template_id: string | null
          total_recipients: number
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          body?: string | null
          channel: string
          created_at?: string
          created_by?: string | null
          delay_seconds?: number
          id?: string
          instance_id?: string | null
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json
          status?: string
          subject?: string | null
          template_id?: string | null
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          body?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          delay_seconds?: number
          id?: string
          instance_id?: string | null
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json
          status?: string
          subject?: string | null
          template_id?: string | null
          total_recipients?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          channel: string
          closed_at: string | null
          created_at: string
          id: string
          status: string
          updated_at: string
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          channel?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Update: {
          channel?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          role?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          paid_date: string | null
          pdf_url: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          paid_date?: string | null
          pdf_url?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_date?: string | null
          pdf_url?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      client_services: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          next_step: string | null
          progress: number | null
          service_name: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
          visible_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          next_step?: string | null
          progress?: number | null
          service_name: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
          visible_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          next_step?: string | null
          progress?: number | null
          service_name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          visible_notes?: string | null
        }
        Relationships: []
      }
      client_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string
          currency: string
          id: string
          name: string
          payment_method: string | null
          renewal_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          currency?: string
          id?: string
          name: string
          payment_method?: string | null
          renewal_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          payment_method?: string | null
          renewal_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commercial_audit_reports: {
        Row: {
          admin_notes: string | null
          answers: Json
          contact_company: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          industry: string | null
          lead_id: string | null
          report: Json
          report_status: string
          score: number | null
          updated_at: string
          verdict: string | null
        }
        Insert: {
          admin_notes?: string | null
          answers?: Json
          contact_company?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          lead_id?: string | null
          report?: Json
          report_status?: string
          score?: number | null
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          admin_notes?: string | null
          answers?: Json
          contact_company?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          lead_id?: string | null
          report?: Json
          report_status?: string
          score?: number | null
          updated_at?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_audit_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_handoff_events: {
        Row: {
          category: string | null
          contact_name: string | null
          contact_phone: string | null
          conversation_id: string | null
          created_at: string
          event_id: string | null
          handoff_id: string | null
          id: string
          keyword: string | null
          lang: string | null
          last_message_id: string | null
          last_message_text: string | null
          motivo: string | null
          payload: Json
          response_body: string | null
          source: string | null
          status_code: number | null
        }
        Insert: {
          category?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          event_id?: string | null
          handoff_id?: string | null
          id?: string
          keyword?: string | null
          lang?: string | null
          last_message_id?: string | null
          last_message_text?: string | null
          motivo?: string | null
          payload: Json
          response_body?: string | null
          source?: string | null
          status_code?: number | null
        }
        Update: {
          category?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          event_id?: string | null
          handoff_id?: string | null
          id?: string
          keyword?: string | null
          lang?: string | null
          last_message_id?: string | null
          last_message_text?: string | null
          motivo?: string | null
          payload?: Json
          response_body?: string | null
          source?: string | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_handoff_events_handoff_id_fkey"
            columns: ["handoff_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_handoffs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_validation_failures: {
        Row: {
          click_id: string | null
          created_at: string
          id: string
          issues: Json
          location: string | null
          page_url: string | null
          raw_payload: Json | null
          referrer: string | null
          template: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          click_id?: string | null
          created_at?: string
          id?: string
          issues?: Json
          location?: string | null
          page_url?: string | null
          raw_payload?: Json | null
          referrer?: string | null
          template?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          click_id?: string | null
          created_at?: string
          id?: string
          issues?: Json
          location?: string | null
          page_url?: string | null
          raw_payload?: Json | null
          referrer?: string | null
          template?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          connection_key: string | null
          created_at: string
          display_name: string | null
          email_address: string
          id: string
          last_sync_at: string | null
          provider: Database["public"]["Enums"]["email_provider"]
          provider_meta: Json
          status: Database["public"]["Enums"]["email_account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key?: string | null
          created_at?: string
          display_name?: string | null
          email_address: string
          id?: string
          last_sync_at?: string | null
          provider: Database["public"]["Enums"]["email_provider"]
          provider_meta?: Json
          status?: Database["public"]["Enums"]["email_account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key?: string | null
          created_at?: string
          display_name?: string | null
          email_address?: string
          id?: string
          last_sync_at?: string | null
          provider?: Database["public"]["Enums"]["email_provider"]
          provider_meta?: Json
          status?: Database["public"]["Enums"]["email_account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string | null
          status: string
          template_name: string | null
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          status: string
          template_name?: string | null
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          status?: string
          template_name?: string | null
        }
        Relationships: []
      }
      email_deletion_audit: {
        Row: {
          account_id: string | null
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          provider: string | null
          subjects: Json
          thread_count: number
          thread_ids: Json
        }
        Insert: {
          account_id?: string | null
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          provider?: string | null
          subjects?: Json
          thread_count?: number
          thread_ids?: Json
        }
        Update: {
          account_id?: string | null
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          provider?: string | null
          subjects?: Json
          thread_count?: number
          thread_ids?: Json
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          account_id: string
          bcc_addresses: string[]
          body_html: string
          cc_addresses: string[]
          created_at: string
          id: string
          in_reply_to_message_id: string | null
          provider_thread_id: string | null
          subject: string
          to_addresses: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          bcc_addresses?: string[]
          body_html?: string
          cc_addresses?: string[]
          created_at?: string
          id?: string
          in_reply_to_message_id?: string | null
          provider_thread_id?: string | null
          subject?: string
          to_addresses?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          bcc_addresses?: string[]
          body_html?: string
          cc_addresses?: string[]
          created_at?: string
          id?: string
          in_reply_to_message_id?: string | null
          provider_thread_id?: string | null
          subject?: string
          to_addresses?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_label_assignments: {
        Row: {
          account_id: string
          created_at: string
          id: string
          label_id: string
          provider_message_id: string | null
          provider_thread_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          label_id: string
          provider_message_id?: string | null
          provider_thread_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          label_id?: string
          provider_message_id?: string | null
          provider_thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_label_assignments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "email_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      email_labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_lead_links: {
        Row: {
          account_id: string
          created_at: string
          id: string
          lead_id: string
          linked_by: string | null
          provider_thread_id: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          lead_id: string
          linked_by?: string | null
          provider_thread_id: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          linked_by?: string | null
          provider_thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_lead_links_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_lead_links_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_link_clicks: {
        Row: {
          clicked_at: string
          id: string
          kind: string | null
          message_id: string
          recipient_email: string | null
          referer: string | null
          template_name: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          kind?: string | null
          message_id: string
          recipient_email?: string | null
          referer?: string | null
          template_name?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          kind?: string | null
          message_id?: string
          recipient_email?: string | null
          referer?: string | null
          template_name?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_opens: {
        Row: {
          id: string
          message_id: string
          opened_at: string
          recipient_email: string | null
          referer: string | null
          template_name: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          message_id: string
          opened_at?: string
          recipient_email?: string | null
          referer?: string | null
          template_name?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          opened_at?: string
          recipient_email?: string | null
          referer?: string | null
          template_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_stars: {
        Row: {
          account_id: string
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_stars_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          html: string
          id: string
          name: string
          preview_text: string | null
          subject: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          html: string
          id?: string
          name: string
          preview_text?: string | null
          subject: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          html?: string
          id?: string
          name?: string
          preview_text?: string | null
          subject?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      handoff_sla_settings: {
        Row: {
          category: string
          queue_priority: number
          sla_minutes: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          queue_priority?: number
          sla_minutes: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          queue_priority?: number
          sla_minutes?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          badge_label: string | null
          badge_new: boolean
          created_at: string
          cta_primary_href: string | null
          cta_primary_label: string | null
          cta_secondary_href: string | null
          cta_secondary_label: string | null
          id: string
          image_url: string
          is_active: boolean
          order_index: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_label?: string | null
          badge_new?: boolean
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          order_index?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_label?: string | null
          badge_new?: boolean
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          order_index?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_conversation_messages: {
        Row: {
          contact_phone: string | null
          content: string
          conversation_id: string | null
          created_at: string
          direction: string
          external_id: string | null
          id: string
          lead_id: string
          message_type: string | null
          metadata: Json | null
          sender: string
          sent_at: string
        }
        Insert: {
          contact_phone?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string
          direction: string
          external_id?: string | null
          id?: string
          lead_id: string
          message_type?: string | null
          metadata?: Json | null
          sender: string
          sent_at?: string
        }
        Update: {
          contact_phone?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          direction?: string
          external_id?: string | null
          id?: string
          lead_id?: string
          message_type?: string | null
          metadata?: Json | null
          sender?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_conversation_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tag_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tag_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          auto_rule: Json
          category: string
          color: string
          created_at: string
          description: string | null
          id: string
          label: string
          slug: string
          updated_at: string
        }
        Insert: {
          auto_rule?: Json
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          slug: string
          updated_at?: string
        }
        Update: {
          auto_rule?: Json
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          automation_count: number
          budget: string | null
          business_area: string | null
          cargo: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          landing_page: string | null
          last_automation_at: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          referrer: string | null
          resource_id: string | null
          resource_name: string | null
          service: string | null
          source: string
          status: string
          timeline: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          website: string | null
        }
        Insert: {
          automation_count?: number
          budget?: string | null
          business_area?: string | null
          cargo?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          landing_page?: string | null
          last_automation_at?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          referrer?: string | null
          resource_id?: string | null
          resource_name?: string | null
          service?: string | null
          source?: string
          status?: string
          timeline?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website?: string | null
        }
        Update: {
          automation_count?: number
          budget?: string | null
          business_area?: string | null
          cargo?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          landing_page?: string | null
          last_automation_at?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          referrer?: string | null
          resource_id?: string | null
          resource_name?: string | null
          service?: string | null
          source?: string
          status?: string
          timeline?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website?: string | null
        }
        Relationships: []
      }
      meta_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          nonce: string
          return_to: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          nonce: string
          return_to?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          nonce?: string
          return_to?: string | null
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          consent: boolean
          consented_at: string | null
          created_at: string
          email: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          consent?: boolean
          consented_at?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          consent?: boolean
          consented_at?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      podcast_episodes: {
        Row: {
          audio_url: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          episode_number: number | null
          eyebrow: string | null
          id: string
          published: boolean
          sort_order: number
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          eyebrow?: string | null
          id?: string
          published?: boolean
          sort_order?: number
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          eyebrow?: string | null
          id?: string
          published?: boolean
          sort_order?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_knowledge: {
        Row: {
          cases: Json
          created_at: string
          extra: Json
          faq: Json
          icp: string | null
          id: string
          is_active: boolean
          objections: Json
          pitch: string | null
          pricing: Json
          product_name: string
          product_slug: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          cases?: Json
          created_at?: string
          extra?: Json
          faq?: Json
          icp?: string | null
          id?: string
          is_active?: boolean
          objections?: Json
          pitch?: string | null
          pricing?: Json
          product_name: string
          product_slug: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          cases?: Json
          created_at?: string
          extra?: Json
          faq?: Json
          icp?: string | null
          id?: string
          is_active?: boolean
          objections?: Json
          pitch?: string | null
          pricing?: Json
          product_name?: string
          product_slug?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_knowledge_versions: {
        Row: {
          cases: Json
          created_at: string
          created_by: string | null
          extra: Json
          faq: Json
          icp: string | null
          id: string
          note: string | null
          objections: Json
          pitch: string | null
          pricing: Json
          product_knowledge_id: string
          product_name: string | null
          product_slug: string
          tone: string | null
          version_number: number
        }
        Insert: {
          cases?: Json
          created_at?: string
          created_by?: string | null
          extra?: Json
          faq?: Json
          icp?: string | null
          id?: string
          note?: string | null
          objections?: Json
          pitch?: string | null
          pricing?: Json
          product_knowledge_id: string
          product_name?: string | null
          product_slug: string
          tone?: string | null
          version_number: number
        }
        Update: {
          cases?: Json
          created_at?: string
          created_by?: string | null
          extra?: Json
          faq?: Json
          icp?: string | null
          id?: string
          note?: string | null
          objections?: Json
          pitch?: string | null
          pricing?: Json
          product_knowledge_id?: string
          product_name?: string | null
          product_slug?: string
          tone?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_knowledge_versions_product_knowledge_id_fkey"
            columns: ["product_knowledge_id"]
            isOneToOne: false
            referencedRelation: "product_knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          client: string
          created_at: string
          description: string
          gallery: string[]
          id: string
          image: string
          results: string
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          year: string
        }
        Insert: {
          category?: string
          client?: string
          created_at?: string
          description?: string
          gallery?: string[]
          id?: string
          image?: string
          results?: string
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          year?: string
        }
        Update: {
          category?: string
          client?: string
          created_at?: string
          description?: string
          gallery?: string[]
          id?: string
          image?: string
          results?: string
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          benefits: Json
          category: string
          created_at: string
          cta_text: string
          description: string
          headline: string
          icon: string
          id: string
          link: string
          sort_order: number
          status: string
          subheadline: string
          title: string
          updated_at: string
        }
        Insert: {
          benefits?: Json
          category?: string
          created_at?: string
          cta_text?: string
          description?: string
          headline?: string
          icon?: string
          id?: string
          link?: string
          sort_order?: number
          status?: string
          subheadline?: string
          title: string
          updated_at?: string
        }
        Update: {
          benefits?: Json
          category?: string
          created_at?: string
          cta_text?: string
          description?: string
          headline?: string
          icon?: string
          id?: string
          link?: string
          sort_order?: number
          status?: string
          subheadline?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          benefits: Json
          created_at: string
          faq: Json
          headline: string
          icon: string
          id: string
          image: string
          key: string
          pain_points: Json
          price: string
          process: Json
          results: Json
          slug: string
          sort_order: number
          status: string
          subheadline: string
          updated_at: string
        }
        Insert: {
          benefits?: Json
          created_at?: string
          faq?: Json
          headline?: string
          icon?: string
          id?: string
          image?: string
          key: string
          pain_points?: Json
          price?: string
          process?: Json
          results?: Json
          slug: string
          sort_order?: number
          status?: string
          subheadline?: string
          updated_at?: string
        }
        Update: {
          benefits?: Json
          created_at?: string
          faq?: Json
          headline?: string
          icon?: string
          id?: string
          image?: string
          key?: string
          pain_points?: Json
          price?: string
          process?: Json
          results?: Json
          slug?: string
          sort_order?: number
          status?: string
          subheadline?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_media_accounts: {
        Row: {
          account_label: string
          agent_id: string | null
          connection_checked_at: string | null
          connection_id: string | null
          connection_status: string
          connector_id: string | null
          created_at: string
          external_id: string | null
          handle: string | null
          id: string
          last_error: string | null
          last_error_at: string | null
          metadata: Json
          notes: string | null
          recent_attempts: Json
          rede: string
          status: string
          updated_at: string
        }
        Insert: {
          account_label: string
          agent_id?: string | null
          connection_checked_at?: string | null
          connection_id?: string | null
          connection_status?: string
          connector_id?: string | null
          created_at?: string
          external_id?: string | null
          handle?: string | null
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          metadata?: Json
          notes?: string | null
          recent_attempts?: Json
          rede: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_label?: string
          agent_id?: string | null
          connection_checked_at?: string | null
          connection_id?: string | null
          connection_status?: string
          connector_id?: string | null
          created_at?: string
          external_id?: string | null
          handle?: string | null
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          metadata?: Json
          notes?: string | null
          recent_attempts?: Json
          rede?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_accounts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_author_limits: {
        Row: {
          created_at: string
          hashtags_max: number | null
          hashtags_min: number | null
          id: string
          max_chars: number | null
          notes: string | null
          rede: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashtags_max?: number | null
          hashtags_min?: number | null
          id?: string
          max_chars?: number | null
          notes?: string | null
          rede: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashtags_max?: number | null
          hashtags_min?: number | null
          id?: string
          max_chars?: number | null
          notes?: string | null
          rede?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_drafts: {
        Row: {
          action: string
          approved_at: string | null
          approved_by: string | null
          brand: Json
          created_at: string
          created_by: string | null
          id: string
          model: string | null
          notes: string | null
          output: Json
          payload: Json
          published_at: string | null
          rede: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
          validation: Json
        }
        Insert: {
          action: string
          approved_at?: string | null
          approved_by?: string | null
          brand?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string | null
          notes?: string | null
          output?: Json
          payload?: Json
          published_at?: string | null
          rede?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          validation?: Json
        }
        Update: {
          action?: string
          approved_at?: string | null
          approved_by?: string | null
          brand?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string | null
          notes?: string | null
          output?: Json
          payload?: Json
          published_at?: string | null
          rede?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          validation?: Json
        }
        Relationships: []
      }
      social_media_drafts_audit: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          draft_id: string
          from_status: string | null
          id: string
          metadata: Json
          notes: string | null
          scheduled_at: string | null
          to_status: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          draft_id: string
          from_status?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          scheduled_at?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          draft_id?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          scheduled_at?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_drafts_audit_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "social_media_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_notification_settings: {
        Row: {
          id: number
          recipients: string[]
          rules: Json
          statuses: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          recipients?: string[]
          rules?: Json
          statuses?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          recipients?: string[]
          rules?: Json
          statuses?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      solucao_routing: {
        Row: {
          active: boolean
          brevo_list_id: number | null
          cc_emails: string[]
          created_at: string
          crm_pipeline: string | null
          crm_stage: string | null
          id: string
          notes: string | null
          notify_email: string
          owner_name: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          brevo_list_id?: number | null
          cc_emails?: string[]
          created_at?: string
          crm_pipeline?: string | null
          crm_stage?: string | null
          id?: string
          notes?: string | null
          notify_email?: string
          owner_name?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          brevo_list_id?: number | null
          cc_emails?: string[]
          created_at?: string
          crm_pipeline?: string | null
          crm_stage?: string | null
          id?: string
          notes?: string | null
          notify_email?: string
          owner_name?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string | null
          closed_at: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role?: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_subscribers: {
        Row: {
          consent: boolean
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          consent?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_assistant_config: {
        Row: {
          business_hours: Json
          business_hours_only: boolean
          chunk_delay_ms: number
          chunk_max_chars: number
          chunk_strategy: string
          default_instance_id: string | null
          enabled: boolean
          id: number
          max_chunks_per_reply: number
          max_replies_per_hour: number
          model: string
          offline_message: string
          system_prompt: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_hours?: Json
          business_hours_only?: boolean
          chunk_delay_ms?: number
          chunk_max_chars?: number
          chunk_strategy?: string
          default_instance_id?: string | null
          enabled?: boolean
          id?: number
          max_chunks_per_reply?: number
          max_replies_per_hour?: number
          model?: string
          offline_message?: string
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_hours?: Json
          business_hours_only?: boolean
          chunk_delay_ms?: number
          chunk_max_chars?: number
          chunk_strategy?: string
          default_instance_id?: string | null
          enabled?: boolean
          id?: number
          max_chunks_per_reply?: number
          max_replies_per_hour?: number
          model?: string
          offline_message?: string
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      whatsapp_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          direction: string
          external_id: string | null
          id: string
          read_at: string | null
          sender: string
          status: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          direction: string
          external_id?: string | null
          id?: string
          read_at?: string | null
          sender: string
          status?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          external_id?: string | null
          id?: string
          read_at?: string | null
          sender?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_concierge_alert_log: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          metadata: Json
          metric_value: number | null
          recipients: string | null
          samples: number | null
          severity: string
          threshold: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          metadata?: Json
          metric_value?: number | null
          recipients?: string | null
          samples?: number | null
          severity?: string
          threshold?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          metadata?: Json
          metric_value?: number | null
          recipients?: string | null
          samples?: number | null
          severity?: string
          threshold?: number | null
        }
        Relationships: []
      }
      whatsapp_concierge_alert_settings: {
        Row: {
          bookings_drop_pct: number
          cooldown_hours: number
          enabled: boolean
          id: number
          invites_drop_pct: number
          min_samples: number
          recipients: string[]
          slack_webhook_urls: string[]
          telegram_chat_ids: string[]
          updated_at: string
          valid_pct_min: number
          violations_spike_pct: number
        }
        Insert: {
          bookings_drop_pct?: number
          cooldown_hours?: number
          enabled?: boolean
          id?: number
          invites_drop_pct?: number
          min_samples?: number
          recipients?: string[]
          slack_webhook_urls?: string[]
          telegram_chat_ids?: string[]
          updated_at?: string
          valid_pct_min?: number
          violations_spike_pct?: number
        }
        Update: {
          bookings_drop_pct?: number
          cooldown_hours?: number
          enabled?: boolean
          id?: number
          invites_drop_pct?: number
          min_samples?: number
          recipients?: string[]
          slack_webhook_urls?: string[]
          telegram_chat_ids?: string[]
          updated_at?: string
          valid_pct_min?: number
          violations_spike_pct?: number
        }
        Relationships: []
      }
      whatsapp_concierge_checks: {
        Row: {
          conversation_id: string | null
          created_at: string
          has_booking_link: boolean
          has_meeting_invite: boolean
          id: string
          overridden: boolean
          override_reason: string | null
          persona_ok: boolean
          pt_pt_ok: boolean
          question_count: number
          reply_preview: string | null
          single_question_ok: boolean
          turn_index: number | null
          violations: string[]
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          has_booking_link?: boolean
          has_meeting_invite?: boolean
          id?: string
          overridden?: boolean
          override_reason?: string | null
          persona_ok: boolean
          pt_pt_ok: boolean
          question_count?: number
          reply_preview?: string | null
          single_question_ok: boolean
          turn_index?: number | null
          violations?: string[]
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          has_booking_link?: boolean
          has_meeting_invite?: boolean
          id?: string
          overridden?: boolean
          override_reason?: string | null
          persona_ok?: boolean
          pt_pt_ok?: boolean
          question_count?: number
          reply_preview?: string | null
          single_question_ok?: boolean
          turn_index?: number | null
          violations?: string[]
        }
        Relationships: []
      }
      whatsapp_concierge_reports: {
        Row: {
          bookings_created: number
          created_at: string
          html: string | null
          id: string
          meeting_invites: number
          metadata: Json
          top_violations: Json
          total: number
          valid: number
          valid_pct: number
          violations: number
          window_end: string
          window_start: string
        }
        Insert: {
          bookings_created?: number
          created_at?: string
          html?: string | null
          id?: string
          meeting_invites?: number
          metadata?: Json
          top_violations?: Json
          total?: number
          valid?: number
          valid_pct?: number
          violations?: number
          window_end: string
          window_start: string
        }
        Update: {
          bookings_created?: number
          created_at?: string
          html?: string | null
          id?: string
          meeting_invites?: number
          metadata?: Json
          top_violations?: Json
          total?: number
          valid?: number
          valid_pct?: number
          violations?: number
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          archived: boolean
          assistant_enabled: boolean
          channel: string
          contact_name: string | null
          contact_phone: string
          created_at: string
          external_account_id: string | null
          handoff_to_human: boolean
          id: string
          instance_id: string | null
          last_message_at: string | null
          last_message_preview: string | null
          slot_offer_at: string | null
          slot_reminder_sent_at: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          archived?: boolean
          assistant_enabled?: boolean
          channel?: string
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          external_account_id?: string | null
          handoff_to_human?: boolean
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          slot_offer_at?: string | null
          slot_reminder_sent_at?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          archived?: boolean
          assistant_enabled?: boolean
          channel?: string
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          external_account_id?: string | null
          handoff_to_human?: boolean
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          slot_offer_at?: string | null
          slot_reminder_sent_at?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_fallback_settings: {
        Row: {
          booking_url: string
          created_at: string
          enabled: boolean
          fallback_message: string
          idle_minutes: number
          segment: string
          sms_reminder_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          booking_url: string
          created_at?: string
          enabled?: boolean
          fallback_message: string
          idle_minutes?: number
          segment: string
          sms_reminder_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          booking_url?: string
          created_at?: string
          enabled?: boolean
          fallback_message?: string
          idle_minutes?: number
          segment?: string
          sms_reminder_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      whatsapp_handoffs: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          canned_reply: string | null
          category: string
          contact_name: string | null
          contact_phone: string
          conversation_id: string | null
          created_at: string
          first_human_reply_at: string | null
          forwarded_at: string | null
          forwarded_to: string | null
          id: string
          keyword: string | null
          lang: string
          notes: string | null
          queue_priority: number
          reassign_count: number
          reassign_reason: string | null
          reassigned_at: string | null
          reassigned_from: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_breached_at: string | null
          sla_due_at: string | null
          sla_minutes: number
          source: string
          status: string
          trigger_message: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          canned_reply?: string | null
          category: string
          contact_name?: string | null
          contact_phone: string
          conversation_id?: string | null
          created_at?: string
          first_human_reply_at?: string | null
          forwarded_at?: string | null
          forwarded_to?: string | null
          id?: string
          keyword?: string | null
          lang?: string
          notes?: string | null
          queue_priority?: number
          reassign_count?: number
          reassign_reason?: string | null
          reassigned_at?: string | null
          reassigned_from?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
          sla_minutes?: number
          source?: string
          status?: string
          trigger_message?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          canned_reply?: string | null
          category?: string
          contact_name?: string | null
          contact_phone?: string
          conversation_id?: string | null
          created_at?: string
          first_human_reply_at?: string | null
          forwarded_at?: string | null
          forwarded_to?: string | null
          id?: string
          keyword?: string | null
          lang?: string
          notes?: string | null
          queue_priority?: number
          reassign_count?: number
          reassign_reason?: string | null
          reassigned_at?: string | null
          reassigned_from?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
          sla_minutes?: number
          source?: string
          status?: string
          trigger_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_handoffs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instance_agent_map: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          instance_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          instance_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          instance_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instance_agent_map_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agentic_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_instance_agent_map_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_key: string
          connected_number: string | null
          created_at: string
          id: string
          instance_name: string
          last_connected_at: string | null
          name: string
          pairing_code: string | null
          qrcode_base64: string | null
          qrcode_expires_at: string | null
          server_url: string
          status: string
          updated_at: string
          webhook_configured: boolean
        }
        Insert: {
          api_key: string
          connected_number?: string | null
          created_at?: string
          id?: string
          instance_name?: string
          last_connected_at?: string | null
          name: string
          pairing_code?: string | null
          qrcode_base64?: string | null
          qrcode_expires_at?: string | null
          server_url: string
          status?: string
          updated_at?: string
          webhook_configured?: boolean
        }
        Update: {
          api_key?: string
          connected_number?: string | null
          created_at?: string
          id?: string
          instance_name?: string
          last_connected_at?: string | null
          name?: string
          pairing_code?: string | null
          qrcode_base64?: string | null
          qrcode_expires_at?: string | null
          server_url?: string
          status?: string
          updated_at?: string
          webhook_configured?: boolean
        }
        Relationships: []
      }
      whatsapp_media: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          instance_id: string
          media_mime: string | null
          media_url: string | null
          message: string
          read_at: string | null
          recipient_name: string
          recipient_phone: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          instance_id: string
          media_mime?: string | null
          media_url?: string | null
          message: string
          read_at?: string | null
          recipient_name?: string
          recipient_phone: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          instance_id?: string
          media_mime?: string | null
          media_url?: string | null
          message?: string
          read_at?: string | null
          recipient_name?: string
          recipient_phone?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_quote_attachments: {
        Row: {
          caption: string | null
          conversation_id: string | null
          created_at: string
          external_msg_id: string | null
          file_name: string | null
          file_url: string
          id: string
          kind: string
          lead_id: string | null
          mime_type: string | null
          quote_id: string | null
          size_bytes: number | null
          source: string
        }
        Insert: {
          caption?: string | null
          conversation_id?: string | null
          created_at?: string
          external_msg_id?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          kind?: string
          lead_id?: string | null
          mime_type?: string | null
          quote_id?: string | null
          size_bytes?: number | null
          source?: string
        }
        Update: {
          caption?: string | null
          conversation_id?: string | null
          created_at?: string
          external_msg_id?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          kind?: string
          lead_id?: string | null
          mime_type?: string | null
          quote_id?: string | null
          size_bytes?: number | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_quote_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_quote_attachments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_quote_attachments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_quotes: {
        Row: {
          budget_range: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string
          conversation_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          missing_fields: Json | null
          project_description: string | null
          proposal_pdf_url: string | null
          proposal_text: string | null
          service_type: string | null
          status: string
          timeline: string | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          budget_range?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          missing_fields?: Json | null
          project_description?: string | null
          proposal_pdf_url?: string | null
          proposal_text?: string | null
          service_type?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          budget_range?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          missing_fields?: Json | null
          project_description?: string | null
          proposal_pdf_url?: string | null
          proposal_text?: string | null
          service_type?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_quotes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          language: string
          media_mime: string | null
          media_url: string | null
          name: string
          priority: number
          tag_id: string | null
          trigger_conditions: Json
          trigger_event: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language?: string
          media_mime?: string | null
          media_url?: string | null
          name: string
          priority?: number
          tag_id?: string | null
          trigger_conditions?: Json
          trigger_event?: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language?: string
          media_mime?: string | null
          media_url?: string | null
          name?: string
          priority?: number
          tag_id?: string | null
          trigger_conditions?: Json
          trigger_event?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_tool_call_logs: {
        Row: {
          contact_phone: string | null
          conversation_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input: Json | null
          lead_id: string | null
          model: string | null
          output: Json | null
          status: string
          tool_name: string
        }
        Insert: {
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          lead_id?: string | null
          model?: string | null
          output?: Json | null
          status?: string
          tool_name: string
        }
        Update: {
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          lead_id?: string | null
          model?: string | null
          output?: Json | null
          status?: string
          tool_name?: string
        }
        Relationships: []
      }
      whatsapp_trigger_logs: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          id: string
          message_sent: string
          recipient_name: string
          recipient_phone: string
          sent_at: string | null
          source_id: string | null
          source_table: string | null
          status: string
          template_id: string | null
          trigger_event: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_sent?: string
          recipient_name?: string
          recipient_phone: string
          sent_at?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: string
          template_id?: string | null
          trigger_event: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_sent?: string
          recipient_name?: string
          recipient_phone?: string
          sent_at?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: string
          template_id?: string | null
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_trigger_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      blog_comments_public: {
        Row: {
          author_name: string | null
          blog_post_id: string | null
          content: string | null
          created_at: string | null
          id: string | null
          parent_id: string | null
          status: string | null
        }
        Insert: {
          author_name?: string | null
          blog_post_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          parent_id?: string | null
          status?: string | null
        }
        Update: {
          author_name?: string | null
          blog_post_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          parent_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      chat_conversation_exists: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      check_agent_budget: {
        Args: { _agent_id: string }
        Returns: {
          allowed: boolean
          daily_limit: number
          monthly_limit: number
          reason: string
          spent_month: number
          spent_today: number
        }[]
      }
      check_agentic_canaries: {
        Args: never
        Returns: {
          action: string
          agent_id: string
          error_pct: number
          errors: number
          reason: string
          total: number
        }[]
      }
      check_email_delivery_health: { Args: never; Returns: undefined }
      cron_whatsapp_reminders_24h: { Args: never; Returns: undefined }
      cron_whatsapp_reminders_2h: { Args: never; Returns: undefined }
      cron_whatsapp_slot_choice_reminder: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      dispatch_crm_lead: { Args: { _payload: Json }; Returns: undefined }
      dispatch_whatsapp_trigger: {
        Args: {
          _event: string
          _name: string
          _phone: string
          _source_id: string
          _source_table: string
          _variables: Json
        }
        Returns: undefined
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_agent_budget_usage: {
        Args: { _agent_id: string }
        Returns: {
          daily_limit: number
          monthly_limit: number
          spent_month: number
          spent_today: number
        }[]
      }
      get_agentic_cron_status: {
        Args: never
        Returns: {
          active: boolean
          jobname: string
          last_end: string
          last_message: string
          last_runid: number
          last_start: string
          last_status: string
          schedule: string
        }[]
      }
      get_agentic_error_samples_by_agent: {
        Args: { _limit?: number; _since?: string }
        Returns: {
          agent_id: string
          agent_name: string
          error_message: string
          error_type: string
          function_slug: string
          last_occurred_at: string
          occurrences: number
          sample_output: string
        }[]
      }
      get_agentic_error_samples_by_scenario: {
        Args: { _limit?: number; _since?: string }
        Returns: {
          agent_fn: string
          last_http_status: number
          last_occurred_at: string
          occurrences: number
          reason: string
          sample_error: string
          scenario_id: string
          scenario_label: string
          status: string
        }[]
      }
      get_agentic_report_by_agent: {
        Args: { _since?: string }
        Returns: {
          agent_id: string
          agent_name: string
          avg_latency_ms: number
          cost_credits: number
          error_pct: number
          errors: number
          function_slug: string
          input_tokens: number
          output_tokens: number
          p95_latency_ms: number
          runs: number
          total_tokens: number
        }[]
      }
      get_agentic_report_by_scenario: {
        Args: { _since?: string }
        Returns: {
          agent_fn: string
          avg_latency_ms: number
          error_pct: number
          errors: number
          fail: number
          pass: number
          runs: number
          scenario_id: string
          scenario_label: string
        }[]
      }
      get_assistant_public: {
        Args: never
        Returns: {
          assistant_name: string
          greeting_message: string
          is_active: boolean
        }[]
      }
      get_chat_messages_by_id: {
        Args: { _conversation_id: string }
        Returns: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_slot_blocked: {
        Args: { _date: string; _time: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      noop_touch_conversation: { Args: { _id: string }; Returns: undefined }
      pick_agent_version_for_run: {
        Args: { _agent_id: string; _bucket_key: string }
        Returns: string
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recompute_campaign_stats: {
        Args: { _campaign_id: string }
        Returns: undefined
      }
      rollup_agentic_metrics_hourly: {
        Args: { _hours_back?: number }
        Returns: number
      }
      trigger_agentic_scenario_cron: { Args: never; Returns: number }
      tz_to_language: { Args: { _tz: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "collaborator" | "client"
      email_account_status: "active" | "disconnected" | "error"
      email_provider: "gmail" | "outlook" | "imap"
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
      app_role: ["admin", "user", "collaborator", "client"],
      email_account_status: ["active", "disconnected", "error"],
      email_provider: ["gmail", "outlook", "imap"],
    },
  },
} as const
