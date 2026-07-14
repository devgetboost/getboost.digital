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
      admin_notification_reads: {
        Row: {
          audit_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          audit_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          audit_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agentic_agent_audit: {
        Row: {
          action: string
          actor_id: string | null
          agent_id: string | null
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
          agent_id?: string | null
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
          agent_id?: string | null
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
          description: string | null
          fast_mode: boolean | null
          function_slug: string | null
          id: string
          max_tokens: number | null
          model: string | null
          name: string
          status: string
          system_prompt: string | null
          temperature: number | null
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
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
          description?: string | null
          fast_mode?: boolean | null
          function_slug?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          name: string
          status?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
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
          description?: string | null
          fast_mode?: boolean | null
          function_slug?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          name?: string
          status?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentic_agents_active_version_fk"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "agentic_agent_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_agents_canary_version_fk"
            columns: ["canary_version_id"]
            isOneToOne: false
            referencedRelation: "agentic_agent_versions"
            referencedColumns: ["id"]
          },
        ]
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
          batch_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          http_status: number | null
          id: string
          latency_ms: number | null
          metadata: Json
          output_preview: string | null
          reason: string | null
          scenario_id: string
          scenario_label: string | null
          status: string
        }
        Insert: {
          agent_fn: string
          batch_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          metadata?: Json
          output_preview?: string | null
          reason?: string | null
          scenario_id: string
          scenario_label?: string | null
          status?: string
        }
        Update: {
          agent_fn?: string
          batch_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          metadata?: Json
          output_preview?: string | null
          reason?: string | null
          scenario_id?: string
          scenario_label?: string | null
          status?: string
        }
        Relationships: []
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
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
          read_time: string
          scheduled_at: string | null
          slug: string
          status: string
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
          read_time?: string
          scheduled_at?: string | null
          slug: string
          status?: string
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
          read_time?: string
          scheduled_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_reschedule_history: {
        Row: {
          actor_source: string | null
          booking_id: string | null
          created_at: string
          id: string
          new_meeting_date: string | null
          new_meeting_link: string | null
          new_meeting_time: string | null
          new_timezone: string | null
          previous_meeting_date: string | null
          previous_meeting_link: string | null
          previous_meeting_time: string | null
          previous_timezone: string | null
        }
        Insert: {
          actor_source?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          new_meeting_date?: string | null
          new_meeting_link?: string | null
          new_meeting_time?: string | null
          new_timezone?: string | null
          previous_meeting_date?: string | null
          previous_meeting_link?: string | null
          previous_meeting_time?: string | null
          previous_timezone?: string | null
        }
        Update: {
          actor_source?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          new_meeting_date?: string | null
          new_meeting_link?: string | null
          new_meeting_time?: string | null
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
          buffer_minutes: number
          id: number
          is_active: boolean
          updated_at: string
        }
        Insert: {
          available_days?: number[]
          available_times?: string[]
          buffer_minutes?: number
          id?: number
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          available_days?: number[]
          available_times?: string[]
          buffer_minutes?: number
          id?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          challenges: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          jitsi_room: string | null
          language: string | null
          lead_status: string | null
          meeting_date: string | null
          meeting_link: string | null
          meeting_time: string | null
          meeting_type: string | null
          name: string | null
          phone: string | null
          status: string
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          challenges?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jitsi_room?: string | null
          language?: string | null
          lead_status?: string | null
          meeting_date?: string | null
          meeting_link?: string | null
          meeting_time?: string | null
          meeting_type?: string | null
          name?: string | null
          phone?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          challenges?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jitsi_room?: string | null
          language?: string | null
          lead_status?: string | null
          meeting_date?: string | null
          meeting_link?: string | null
          meeting_time?: string | null
          meeting_type?: string | null
          name?: string | null
          phone?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      bookings_lead_status_audit: {
        Row: {
          action: string
          actor_email: string | null
          booking_id: string | null
          created_at: string
          from_status: string | null
          id: string
          metadata: Json
          notes: string | null
          source: string | null
          to_status: string | null
        }
        Insert: {
          action?: string
          actor_email?: string | null
          booking_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          source?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          booking_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          source?: string | null
          to_status?: string | null
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
          campaign_id: string | null
          clicked_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          error: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
          variables: Json
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          error?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          error?: string | null
          id?: string
          opened_at?: string | null
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
          channel?: string
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
        Relationships: [
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
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
          company: string | null
          contact_company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          lead_id: string | null
          name: string | null
          notes: string | null
          phone: string | null
          report: Json
          report_status: string
          score: number | null
          status: string
          updated_at: string
          verdict: string | null
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          answers?: Json
          company?: string | null
          contact_company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          lead_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          report?: Json
          report_status?: string
          score?: number | null
          status?: string
          updated_at?: string
          verdict?: string | null
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          answers?: Json
          company?: string | null
          contact_company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          lead_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          report?: Json
          report_status?: string
          score?: number | null
          status?: string
          updated_at?: string
          verdict?: string | null
          website?: string | null
        }
        Relationships: []
      }
      crm_validation_failures: {
        Row: {
          click_id: string | null
          created_at: string
          expected: string | null
          field: string | null
          field_name: string | null
          id: string
          issues: Json
          location: string | null
          page_url: string | null
          payload: Json
          raw_payload: Json
          reason: string | null
          received: string | null
          resolved: boolean
          severity: string | null
          source: string | null
          source_id: string | null
          template: string | null
          value: string | null
        }
        Insert: {
          click_id?: string | null
          created_at?: string
          expected?: string | null
          field?: string | null
          field_name?: string | null
          id?: string
          issues?: Json
          location?: string | null
          page_url?: string | null
          payload?: Json
          raw_payload?: Json
          reason?: string | null
          received?: string | null
          resolved?: boolean
          severity?: string | null
          source?: string | null
          source_id?: string | null
          template?: string | null
          value?: string | null
        }
        Update: {
          click_id?: string | null
          created_at?: string
          expected?: string | null
          field?: string | null
          field_name?: string | null
          id?: string
          issues?: Json
          location?: string | null
          page_url?: string | null
          payload?: Json
          raw_payload?: Json
          reason?: string | null
          received?: string | null
          resolved?: boolean
          severity?: string | null
          source?: string | null
          source_id?: string | null
          template?: string | null
          value?: string | null
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          connection_key: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          last_sync_at: string | null
          metadata: Json
          provider: string
          status: string
          sync_enabled: boolean
          updated_at: string
        }
        Insert: {
          connection_key?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json
          provider?: string
          status?: string
          sync_enabled?: boolean
          updated_at?: string
        }
        Update: {
          connection_key?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json
          provider?: string
          status?: string
          sync_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          account_id: string | null
          attachments: Json
          bcc_emails: string[]
          body_html: string | null
          body_text: string | null
          cc_emails: string[]
          created_at: string
          created_by: string | null
          id: string
          in_reply_to_message_id: string | null
          provider_thread_id: string | null
          subject: string | null
          to_emails: string[]
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          attachments?: Json
          bcc_emails?: string[]
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          in_reply_to_message_id?: string | null
          provider_thread_id?: string | null
          subject?: string | null
          to_emails?: string[]
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          attachments?: Json
          bcc_emails?: string[]
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          in_reply_to_message_id?: string | null
          provider_thread_id?: string | null
          subject?: string | null
          to_emails?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      email_labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_lead_links: {
        Row: {
          created_at: string
          direction: string | null
          id: string
          lead_id: string | null
          provider_message_id: string | null
          provider_thread_id: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          direction?: string | null
          id?: string
          lead_id?: string | null
          provider_message_id?: string | null
          provider_thread_id?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          direction?: string | null
          id?: string
          lead_id?: string | null
          provider_message_id?: string | null
          provider_thread_id?: string | null
          subject?: string | null
        }
        Relationships: [
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
          created_at: string
          id: string
          kind: string | null
          message_id: string | null
          metadata: Json
          recipient_email: string | null
          template_name: string | null
          url: string | null
        }
        Insert: {
          clicked_at?: string
          created_at?: string
          id?: string
          kind?: string | null
          message_id?: string | null
          metadata?: Json
          recipient_email?: string | null
          template_name?: string | null
          url?: string | null
        }
        Update: {
          clicked_at?: string
          created_at?: string
          id?: string
          kind?: string | null
          message_id?: string | null
          metadata?: Json
          recipient_email?: string | null
          template_name?: string | null
          url?: string | null
        }
        Relationships: []
      }
      email_opens: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          metadata: Json
          opened_at: string
          recipient_email: string | null
          template_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          metadata?: Json
          opened_at?: string
          recipient_email?: string | null
          template_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          metadata?: Json
          opened_at?: string
          recipient_email?: string | null
          template_name?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json
          recipient_email: string | null
          sent_at: string | null
          status: string
          template_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json
          recipient_email?: string | null
          sent_at?: string | null
          status?: string
          template_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json
          recipient_email?: string | null
          sent_at?: string | null
          status?: string
          template_name?: string | null
          updated_at?: string
        }
        Relationships: []
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
          content: string
          created_at: string
          direction: string
          id: string
          lead_id: string | null
          message_type: string
          metadata: Json | null
          sent_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string | null
          message_type?: string
          metadata?: Json | null
          sent_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string | null
          message_type?: string
          metadata?: Json | null
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
          assigned_by: string | null
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
          crm_error: string | null
          crm_sent_at: string | null
          crm_status: string | null
          email: string
          id: string
          landing_page: string | null
          last_automation_at: string | null
          last_email_at: string | null
          last_email_subject: string | null
          lead_status: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          referrer: string | null
          resource_id: string | null
          resource_name: string | null
          role: string | null
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
          crm_error?: string | null
          crm_sent_at?: string | null
          crm_status?: string | null
          email: string
          id?: string
          landing_page?: string | null
          last_automation_at?: string | null
          last_email_at?: string | null
          last_email_subject?: string | null
          lead_status?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          referrer?: string | null
          resource_id?: string | null
          resource_name?: string | null
          role?: string | null
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
          crm_error?: string | null
          crm_sent_at?: string | null
          crm_status?: string | null
          email?: string
          id?: string
          landing_page?: string | null
          last_automation_at?: string | null
          last_email_at?: string | null
          last_email_subject?: string | null
          lead_status?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          referrer?: string | null
          resource_id?: string | null
          resource_name?: string | null
          role?: string | null
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
          cover_image: string | null
          cover_url: string | null
          created_at: string
          description: string
          duration: string | null
          duration_seconds: number | null
          episode_number: number | null
          eyebrow: string | null
          guest_name: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          sort_order: number
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          cover_image?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          duration?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          eyebrow?: string | null
          guest_name?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          sort_order?: number
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          cover_image?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          duration?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          eyebrow?: string | null
          guest_name?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          sort_order?: number
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
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
          full_name?: string | null
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
          full_name?: string | null
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
          metadata: Json | null
          notes: string | null
          recent_attempts: Json | null
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
          metadata?: Json | null
          notes?: string | null
          recent_attempts?: Json | null
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
          metadata?: Json | null
          notes?: string | null
          recent_attempts?: Json | null
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
      social_media_drafts: {
        Row: {
          account_id: string | null
          action: string | null
          content: string
          created_at: string
          hashtags: string[]
          id: string
          metadata: Json
          notes: string | null
          output: Json
          published_at: string | null
          rede: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          action?: string | null
          content?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          metadata?: Json
          notes?: string | null
          output?: Json
          published_at?: string | null
          rede?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          action?: string | null
          content?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          metadata?: Json
          notes?: string | null
          output?: Json
          published_at?: string | null
          rede?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_media_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_drafts_audit: {
        Row: {
          action: string
          actor_email: string | null
          created_at: string
          draft_id: string | null
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
          created_at?: string
          draft_id?: string | null
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
          created_at?: string
          draft_id?: string | null
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
          enabled: boolean
          id: number
          recipients: string[]
          statuses: string[]
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: number
          recipients?: string[]
          statuses?: string[]
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: number
          recipients?: string[]
          statuses?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      solucao_routing: {
        Row: {
          add_to_brevo: boolean
          brevo_list_id: number | null
          created_at: string
          id: string
          is_active: boolean
          notify_email: boolean
          recipients: string[]
          slug: string
          updated_at: string
        }
        Insert: {
          add_to_brevo?: boolean
          brevo_list_id?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          notify_email?: boolean
          recipients?: string[]
          slug: string
          updated_at?: string
        }
        Update: {
          add_to_brevo?: boolean
          brevo_list_id?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          notify_email?: boolean
          recipients?: string[]
          slug?: string
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
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_assistant_config: {
        Row: {
          assistant_name: string
          default_instance_id: string | null
          escalation_email: string | null
          id: number
          is_active: boolean
          knowledge_base: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          assistant_name?: string
          default_instance_id?: string | null
          escalation_email?: string | null
          id?: number
          is_active?: boolean
          knowledge_base?: string
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          assistant_name?: string
          default_instance_id?: string | null
          escalation_email?: string | null
          id?: number
          is_active?: boolean
          knowledge_base?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          direction: string
          id: string
          sender: string
          status: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          direction: string
          id?: string
          sender?: string
          status?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          direction?: string
          id?: string
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
          kind: string | null
          message: string | null
          metadata: Json
          severity: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string | null
          message?: string | null
          metadata?: Json
          severity?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string | null
          message?: string | null
          metadata?: Json
          severity?: string | null
        }
        Relationships: []
      }
      whatsapp_concierge_alert_settings: {
        Row: {
          email_recipients: string[]
          enabled: boolean
          id: number
          telegram_chat_ids: string[]
          updated_at: string
          violation_threshold: number
          webhook_url: string | null
        }
        Insert: {
          email_recipients?: string[]
          enabled?: boolean
          id?: number
          telegram_chat_ids?: string[]
          updated_at?: string
          violation_threshold?: number
          webhook_url?: string | null
        }
        Update: {
          email_recipients?: string[]
          enabled?: boolean
          id?: number
          telegram_chat_ids?: string[]
          updated_at?: string
          violation_threshold?: number
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_concierge_checks: {
        Row: {
          conversation_id: string | null
          created_at: string
          has_booking_link: boolean | null
          has_meeting_invite: boolean | null
          id: string
          overridden: boolean
          override_reason: string | null
          persona_ok: boolean | null
          pt_pt_ok: boolean | null
          question_count: number | null
          reply_preview: string | null
          single_question_ok: boolean | null
          turn_index: number | null
          violations: Json
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          has_booking_link?: boolean | null
          has_meeting_invite?: boolean | null
          id?: string
          overridden?: boolean
          override_reason?: string | null
          persona_ok?: boolean | null
          pt_pt_ok?: boolean | null
          question_count?: number | null
          reply_preview?: string | null
          single_question_ok?: boolean | null
          turn_index?: number | null
          violations?: Json
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          has_booking_link?: boolean | null
          has_meeting_invite?: boolean | null
          id?: string
          overridden?: boolean
          override_reason?: string | null
          persona_ok?: boolean | null
          pt_pt_ok?: boolean | null
          question_count?: number | null
          reply_preview?: string | null
          single_question_ok?: boolean | null
          turn_index?: number | null
          violations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_concierge_checks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          archived: boolean
          assistant_enabled: boolean
          channel: string | null
          contact_name: string | null
          contact_phone: string
          created_at: string
          handoff_to_human: boolean
          id: string
          instance_id: string | null
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json
          status: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          archived?: boolean
          assistant_enabled?: boolean
          channel?: string | null
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          handoff_to_human?: boolean
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          archived?: boolean
          assistant_enabled?: boolean
          channel?: string | null
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          handoff_to_human?: boolean
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_handoffs: {
        Row: {
          assigned_to: string | null
          category: string | null
          conversation_id: string | null
          created_at: string
          first_human_reply_at: string | null
          forwarded_at: string | null
          forwarded_to: string | null
          id: string
          keyword: string | null
          lang: string | null
          notes: string | null
          queue_priority: number
          reassign_count: number
          resolved_at: string | null
          resolved_by: string | null
          sla_breached_at: string | null
          sla_due_at: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          first_human_reply_at?: string | null
          forwarded_at?: string | null
          forwarded_to?: string | null
          id?: string
          keyword?: string | null
          lang?: string | null
          notes?: string | null
          queue_priority?: number
          reassign_count?: number
          resolved_at?: string | null
          resolved_by?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          first_human_reply_at?: string | null
          forwarded_at?: string | null
          forwarded_to?: string | null
          id?: string
          keyword?: string | null
          lang?: string | null
          notes?: string | null
          queue_priority?: number
          reassign_count?: number
          resolved_at?: string | null
          resolved_by?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
          source?: string | null
          status?: string
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
          agent_id: string | null
          created_at: string
          id: string
          instance_id: string
          is_active: boolean
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          instance_id: string
          is_active?: boolean
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          instance_id?: string
          is_active?: boolean
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
          connected_number: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          connected_number?: string | null
          created_at?: string
          id: string
          metadata?: Json
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          connected_number?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_media: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          mime_type: string | null
          url: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          mime_type?: string | null
          url: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          mime_type?: string | null
          url?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          id: string
          instance_id: string | null
          message: string | null
          read_at: string | null
          recipient_name: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          instance_id?: string | null
          message?: string | null
          read_at?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          instance_id?: string | null
          message?: string | null
          read_at?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      whatsapp_quotes: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          conversation_id: string | null
          created_at: string
          id: string
          payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_quotes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          media_mime: string | null
          media_url: string | null
          name: string
          priority: number
          tag_id: string | null
          trigger_event: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          media_mime?: string | null
          media_url?: string | null
          name: string
          priority?: number
          tag_id?: string | null
          trigger_event?: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          media_mime?: string | null
          media_url?: string | null
          name?: string
          priority?: number
          tag_id?: string | null
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
      whatsapp_trigger_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_sent: string | null
          recipient_name: string | null
          recipient_phone: string | null
          sent_at: string | null
          source_id: string | null
          status: string
          template_id: string | null
          trigger_event: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_sent?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          source_id?: string | null
          status?: string
          template_id?: string | null
          trigger_event?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_sent?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          source_id?: string | null
          status?: string
          template_id?: string | null
          trigger_event?: string | null
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
        Args: { _limit?: number; _since: string }
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
        Args: { _limit?: number; _since: string }
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
        Args: { _since: string }
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
        Args: { _since: string }
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "collaborator" | "client"
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
      app_role: ["admin", "moderator", "user", "collaborator", "client"],
    },
  },
} as const
