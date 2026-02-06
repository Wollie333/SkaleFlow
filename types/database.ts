export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'super_admin' | 'client' | 'team_member';
export type OrgMemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type SubscriptionStatus = 'trial' | 'active' | 'paused' | 'cancelled' | 'expired';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type BrandEngineStatus = 'not_started' | 'in_progress' | 'completed';
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'locked';
export type CalendarStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ContentStatus =
  | 'idea'
  | 'scripted'
  | 'approved'
  | 'filming'
  | 'filmed'
  | 'designing'
  | 'designed'
  | 'editing'
  | 'edited'
  | 'scheduled'
  | 'published'
  | 'failed';
export type FunnelStage = 'awareness' | 'consideration' | 'conversion';
export type TimeSlot = 'AM' | 'PM' | 'MID' | 'EVE';
export type StoryBrandStage =
  | 'character'
  | 'external_problem'
  | 'internal_problem'
  | 'philosophical_problem'
  | 'guide'
  | 'plan'
  | 'call_to_action'
  | 'failure'
  | 'success';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
          email_verified: boolean;
          onboarding_completed: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          email_verified?: boolean;
          onboarding_completed?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          email_verified?: boolean;
          onboarding_completed?: boolean;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          owner_id: string | null;
          settings: Json;
          brand_engine_status: BrandEngineStatus;
          content_engine_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          owner_id?: string | null;
          settings?: Json;
          brand_engine_status?: BrandEngineStatus;
          content_engine_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          owner_id?: string | null;
          settings?: Json;
          brand_engine_status?: BrandEngineStatus;
          content_engine_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      org_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrgMemberRole;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrgMemberRole;
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrgMemberRole;
          invited_by?: string | null;
          joined_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          organization_name: string;
          invited_by: string | null;
          token: string;
          tier_id: string | null;
          status: InvitationStatus;
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          organization_name: string;
          invited_by?: string | null;
          token?: string;
          tier_id?: string | null;
          status?: InvitationStatus;
          expires_at?: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          organization_name?: string;
          invited_by?: string | null;
          token?: string;
          tier_id?: string | null;
          status?: InvitationStatus;
          expires_at?: string;
          created_at?: string;
          accepted_at?: string | null;
        };
      };
      subscription_tiers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number | null;
          features: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price_monthly: number;
          price_yearly?: number | null;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          tier_id: string | null;
          status: SubscriptionStatus;
          paystack_customer_id: string | null;
          paystack_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_ends_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tier_id?: string | null;
          status?: SubscriptionStatus;
          paystack_customer_id?: string | null;
          paystack_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_ends_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          tier_id?: string | null;
          status?: SubscriptionStatus;
          paystack_customer_id?: string | null;
          paystack_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_ends_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_phases: {
        Row: {
          id: string;
          organization_id: string;
          phase_number: string;
          phase_name: string;
          status: PhaseStatus;
          started_at: string | null;
          completed_at: string | null;
          locked_at: string | null;
          locked_by: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          phase_number: string;
          phase_name: string;
          status?: PhaseStatus;
          started_at?: string | null;
          completed_at?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          sort_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          phase_number?: string;
          phase_name?: string;
          status?: PhaseStatus;
          started_at?: string | null;
          completed_at?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_outputs: {
        Row: {
          id: string;
          organization_id: string;
          phase_id: string;
          output_key: string;
          output_value: Json;
          version: number;
          is_locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          phase_id: string;
          output_key: string;
          output_value: Json;
          version?: number;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          phase_id?: string;
          output_key?: string;
          output_value?: Json;
          version?: number;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_conversations: {
        Row: {
          id: string;
          organization_id: string;
          phase_id: string;
          user_id: string | null;
          messages: Json;
          ai_model: string;
          tokens_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          phase_id: string;
          user_id?: string | null;
          messages?: Json;
          ai_model?: string;
          tokens_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          phase_id?: string;
          user_id?: string | null;
          messages?: Json;
          ai_model?: string;
          tokens_used?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_playbooks: {
        Row: {
          id: string;
          organization_id: string;
          version: number;
          generated_by: string | null;
          file_url: string | null;
          file_size: number | null;
          includes_phases: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          version?: number;
          generated_by?: string | null;
          file_url?: string | null;
          file_size?: number | null;
          includes_phases: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          version?: number;
          generated_by?: string | null;
          file_url?: string | null;
          file_size?: number | null;
          includes_phases?: string[];
          created_at?: string;
        };
      };
      content_calendars: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          start_date: string;
          end_date: string;
          status: CalendarStatus;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          start_date: string;
          end_date: string;
          status?: CalendarStatus;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          status?: CalendarStatus;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_angles: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          description: string | null;
          emotional_target: string | null;
          week_number: number | null;
          is_active: boolean;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          description?: string | null;
          emotional_target?: string | null;
          week_number?: number | null;
          is_active?: boolean;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          code?: string;
          description?: string | null;
          emotional_target?: string | null;
          week_number?: number | null;
          is_active?: boolean;
          sort_order?: number | null;
        };
      };
      content_items: {
        Row: {
          id: string;
          organization_id: string;
          calendar_id: string;
          scheduled_date: string;
          time_slot: TimeSlot;
          scheduled_time: string | null;
          funnel_stage: FunnelStage;
          storybrand_stage: StoryBrandStage;
          angle_id: string | null;
          format: string;
          topic: string | null;
          hook: string | null;
          script_body: string | null;
          cta: string | null;
          caption: string | null;
          hashtags: string[] | null;
          platforms: string[];
          platform_specs: Json;
          status: ContentStatus;
          assigned_to: string | null;
          ai_generated: boolean;
          ai_model: string | null;
          ai_prompt_used: string | null;
          media_urls: string[] | null;
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
          approved_at: string | null;
          approved_by: string | null;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          calendar_id: string;
          scheduled_date: string;
          time_slot: TimeSlot;
          scheduled_time?: string | null;
          funnel_stage: FunnelStage;
          storybrand_stage: StoryBrandStage;
          angle_id?: string | null;
          format: string;
          topic?: string | null;
          hook?: string | null;
          script_body?: string | null;
          cta?: string | null;
          caption?: string | null;
          hashtags?: string[] | null;
          platforms?: string[];
          platform_specs?: Json;
          status?: ContentStatus;
          assigned_to?: string | null;
          ai_generated?: boolean;
          ai_model?: string | null;
          ai_prompt_used?: string | null;
          media_urls?: string[] | null;
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          calendar_id?: string;
          scheduled_date?: string;
          time_slot?: TimeSlot;
          scheduled_time?: string | null;
          funnel_stage?: FunnelStage;
          storybrand_stage?: StoryBrandStage;
          angle_id?: string | null;
          format?: string;
          topic?: string | null;
          hook?: string | null;
          script_body?: string | null;
          cta?: string | null;
          caption?: string | null;
          hashtags?: string[] | null;
          platforms?: string[];
          platform_specs?: Json;
          status?: ContentStatus;
          assigned_to?: string | null;
          ai_generated?: boolean;
          ai_model?: string | null;
          ai_prompt_used?: string | null;
          media_urls?: string[] | null;
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          published_at?: string | null;
        };
      };
      ai_usage: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          feature: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          cost_cents: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          feature: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          cost_cents?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          feature?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          cost_cents?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
