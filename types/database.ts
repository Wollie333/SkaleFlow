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
export type InvitationEmailStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced';
export type BrandEngineStatus = 'not_started' | 'in_progress' | 'completed';
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'locked';
export type CalendarStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ContentStatus =
  | 'idea'
  | 'scripted'
  | 'pending_review'
  | 'revision_requested'
  | 'approved'
  | 'rejected'
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
export type PipelineStage = 'application' | 'declined' | 'approved' | 'booking_made' | 'lost' | 'won';
export type MeetingStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube';
export type PlacementType =
  | 'facebook_feed' | 'facebook_reel' | 'facebook_story'
  | 'instagram_feed' | 'instagram_reel' | 'instagram_story'
  | 'linkedin_feed' | 'linkedin_article' | 'linkedin_document'
  | 'twitter_tweet' | 'twitter_thread'
  | 'tiktok_video' | 'tiktok_story'
  | 'youtube_video' | 'youtube_short' | 'youtube_community_post';
export type PublishStatus = 'queued' | 'publishing' | 'published' | 'failed';
export type NotificationType = 'content_submitted' | 'content_approved' | 'content_rejected' | 'revision_requested' | 'generation_completed' | 'change_request_submitted' | 'change_request_approved' | 'change_request_rejected' | 'change_request_revision' | 'credits_allocated' | 'credits_low';
export type FeatureType = 'brand_engine' | 'content_engine' | 'pipeline' | 'ad_campaigns';
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';
export type ChangeType = 'create' | 'update' | 'delete';
export type GenerationBatchStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type GenerationQueueStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CreditTransactionType = 'monthly_allocation' | 'monthly_reset' | 'topup_purchase' | 'ai_usage_deduction' | 'refund' | 'admin_adjustment';
export type InvoiceType = 'subscription' | 'topup' | 'refund';
export type InvoiceStatus = 'draft' | 'paid' | 'failed' | 'refunded';
export type PipelineEventType = 'stage_changed' | 'contact_created' | 'tag_added' | 'tag_removed' | 'note_added' | 'email_sent' | 'contact_updated';
export type AutomationTriggerType = 'stage_changed' | 'contact_created' | 'tag_added' | 'tag_removed';
export type AutomationStepType = 'send_email' | 'move_stage' | 'add_tag' | 'remove_tag' | 'webhook' | 'delay' | 'condition';
export type AutomationRunStatus = 'running' | 'completed' | 'failed' | 'waiting';
export type AutomationStepLogStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting' | 'skipped';
export type IntegrationType = 'google_calendar' | 'google_drive' | 'slack' | 'zapier' | 'make';
export type AdPlatform = 'meta' | 'tiktok';
export type AdCampaignObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'conversions' | 'app_installs';
export type AdCampaignStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected';
export type AdFormat = 'single_image' | 'single_video' | 'carousel' | 'collection' | 'in_feed' | 'topview' | 'spark_ad';
export type AdBiddingStrategy = 'lowest_cost' | 'cost_cap' | 'bid_cap' | 'target_cost';
export type AdComplianceStatus = 'pending' | 'passed' | 'flagged' | 'rejected';
export type AdAudienceType = 'saved' | 'custom' | 'lookalike';
export type AdCtaType = 'learn_more' | 'shop_now' | 'sign_up' | 'download' | 'get_quote' | 'apply_now' | 'book_now' | 'contact_us';
export type AdGenerationBatchStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type TemplateCategory = 'video_script' | 'hook' | 'cta' | 'social_framework' | 'seo_content' | 'email_outreach' | 'web_copy';
export type TemplateTier = 'core_rotation' | 'high_impact' | 'strategic';
export type TemplateContentType = 'post' | 'script' | 'hook' | 'cta';
export type ContentFeedbackType = 'rejected' | 'accepted' | 'regenerated';

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
          approved: boolean;
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
          approved?: boolean;
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
          approved?: boolean;
        };
        Relationships: [];
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
          playbook_share_token: string | null;
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
          playbook_share_token?: string | null;
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
          playbook_share_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      org_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrgMemberRole;
          invited_by: string | null;
          joined_at: string;
          team_role: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrgMemberRole;
          invited_by?: string | null;
          joined_at?: string;
          team_role?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrgMemberRole;
          invited_by?: string | null;
          joined_at?: string;
          team_role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
          email_status: InvitationEmailStatus;
          email_sent_at: string | null;
          email_error: string | null;
          resend_email_id: string | null;
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
          email_status?: InvitationEmailStatus;
          email_sent_at?: string | null;
          email_error?: string | null;
          resend_email_id?: string | null;
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
          email_status?: InvitationEmailStatus;
          email_sent_at?: string | null;
          email_error?: string | null;
          resend_email_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_tier_id_fkey";
            columns: ["tier_id"];
            isOneToOne: false;
            referencedRelation: "subscription_tiers";
            referencedColumns: ["id"];
          },
        ];
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
          monthly_credits: number;
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
          monthly_credits?: number;
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
          monthly_credits?: number;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_tier_id_fkey";
            columns: ["tier_id"];
            isOneToOne: false;
            referencedRelation: "subscription_tiers";
            referencedColumns: ["id"];
          },
        ];
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
          current_question_index: number;
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
          current_question_index?: number;
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
          current_question_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_phases_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_phases_locked_by_fkey";
            columns: ["locked_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "brand_outputs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_outputs_phase_id_fkey";
            columns: ["phase_id"];
            isOneToOne: false;
            referencedRelation: "brand_phases";
            referencedColumns: ["id"];
          },
        ];
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
          credits_used: number;
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
          credits_used?: number;
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
          credits_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_conversations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_conversations_phase_id_fkey";
            columns: ["phase_id"];
            isOneToOne: false;
            referencedRelation: "brand_phases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "brand_playbooks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_playbooks_generated_by_fkey";
            columns: ["generated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
          generation_progress: Json;
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
          generation_progress?: Json;
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
          generation_progress?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_calendars_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "content_angles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      content_items: {
        Row: {
          id: string;
          organization_id: string;
          calendar_id: string | null;
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
          rejection_reason: string | null;
          review_comment: string | null;
          generation_week: number | null;
          script_template: string | null;
          hook_template: string | null;
          cta_template: string | null;
          filming_notes: string | null;
          context_section: string | null;
          teaching_points: string | null;
          reframe: string | null;
          problem_expansion: string | null;
          case_study: string | null;
          framework_teaching: string | null;
          target_url: string | null;
          utm_parameters: Json;
          placement_type: string | null;
          variation_group_id: string | null;
          is_primary_variation: boolean;
        };
        Insert: {
          id?: string;
          organization_id: string;
          calendar_id?: string | null;
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
          rejection_reason?: string | null;
          review_comment?: string | null;
          generation_week?: number | null;
          script_template?: string | null;
          hook_template?: string | null;
          cta_template?: string | null;
          filming_notes?: string | null;
          context_section?: string | null;
          teaching_points?: string | null;
          reframe?: string | null;
          problem_expansion?: string | null;
          case_study?: string | null;
          framework_teaching?: string | null;
          target_url?: string | null;
          utm_parameters?: Json;
          placement_type?: string | null;
          variation_group_id?: string | null;
          is_primary_variation?: boolean;
        };
        Update: {
          id?: string;
          organization_id?: string;
          calendar_id?: string | null;
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
          rejection_reason?: string | null;
          review_comment?: string | null;
          generation_week?: number | null;
          script_template?: string | null;
          hook_template?: string | null;
          cta_template?: string | null;
          filming_notes?: string | null;
          context_section?: string | null;
          teaching_points?: string | null;
          reframe?: string | null;
          problem_expansion?: string | null;
          case_study?: string | null;
          framework_teaching?: string | null;
          target_url?: string | null;
          utm_parameters?: Json;
          placement_type?: string | null;
          variation_group_id?: string | null;
          is_primary_variation?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "content_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_items_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "content_calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_items_angle_id_fkey";
            columns: ["angle_id"];
            isOneToOne: false;
            referencedRelation: "content_angles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_items_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_items_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
          credits_charged: number;
          provider: string;
          is_free_model: boolean;
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
          credits_charged?: number;
          provider?: string;
          is_free_model?: boolean;
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
          credits_charged?: number;
          provider?: string;
          is_free_model?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          business_name: string;
          website_url: string | null;
          team_size: string;
          annual_revenue: string;
          biggest_challenge: string;
          what_tried: string | null;
          why_applying: string;
          pipeline_stage: PipelineStage;
          admin_notes: string | null;
          activated_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone: string;
          business_name: string;
          website_url?: string | null;
          team_size: string;
          annual_revenue: string;
          biggest_challenge: string;
          what_tried?: string | null;
          why_applying: string;
          pipeline_stage?: PipelineStage;
          admin_notes?: string | null;
          activated_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          business_name?: string;
          website_url?: string | null;
          team_size?: string;
          annual_revenue?: string;
          biggest_challenge?: string;
          what_tried?: string | null;
          why_applying?: string;
          pipeline_stage?: PipelineStage;
          admin_notes?: string | null;
          activated_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_activated_user_id_fkey";
            columns: ["activated_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      application_activity: {
        Row: {
          id: string;
          application_id: string;
          action: string;
          from_stage: string | null;
          to_stage: string | null;
          description: string;
          performed_by: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          action: string;
          from_stage?: string | null;
          to_stage?: string | null;
          description: string;
          performed_by?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          action?: string;
          from_stage?: string | null;
          to_stage?: string | null;
          description?: string;
          performed_by?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_activity_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_activity_performed_by_fkey";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      google_integrations: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          calendar_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          calendar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          token_expires_at?: string;
          calendar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "google_integrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      meetings: {
        Row: {
          id: string;
          application_id: string;
          host_user_id: string;
          google_event_id: string | null;
          meet_link: string | null;
          scheduled_at: string | null;
          duration_minutes: number;
          attendee_email: string;
          attendee_name: string;
          status: MeetingStatus;
          booking_token: string;
          token_expires_at: string;
          booked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          host_user_id: string;
          google_event_id?: string | null;
          meet_link?: string | null;
          scheduled_at?: string | null;
          duration_minutes?: number;
          attendee_email: string;
          attendee_name: string;
          status?: MeetingStatus;
          booking_token?: string;
          token_expires_at: string;
          booked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          host_user_id?: string;
          google_event_id?: string | null;
          meet_link?: string | null;
          scheduled_at?: string | null;
          duration_minutes?: number;
          attendee_email?: string;
          attendee_name?: string;
          status?: MeetingStatus;
          booking_token?: string;
          token_expires_at?: string;
          booked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meetings_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meetings_host_user_id_fkey";
            columns: ["host_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      social_media_connections: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          platform: SocialPlatform;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          platform_user_id: string | null;
          platform_username: string | null;
          platform_page_id: string | null;
          platform_page_name: string | null;
          account_type: string;
          scopes: string[] | null;
          is_active: boolean;
          connected_at: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          platform: SocialPlatform;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          platform_user_id?: string | null;
          platform_username?: string | null;
          platform_page_id?: string | null;
          platform_page_name?: string | null;
          account_type?: string;
          scopes?: string[] | null;
          is_active?: boolean;
          connected_at?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          platform?: SocialPlatform;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          platform_user_id?: string | null;
          platform_username?: string | null;
          platform_page_id?: string | null;
          platform_page_name?: string | null;
          account_type?: string;
          scopes?: string[] | null;
          is_active?: boolean;
          connected_at?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_media_connections_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_media_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      published_posts: {
        Row: {
          id: string;
          content_item_id: string;
          organization_id: string;
          connection_id: string;
          platform: SocialPlatform;
          platform_post_id: string | null;
          post_url: string | null;
          published_at: string | null;
          publish_status: PublishStatus;
          error_message: string | null;
          retry_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          organization_id: string;
          connection_id: string;
          platform: SocialPlatform;
          platform_post_id?: string | null;
          post_url?: string | null;
          published_at?: string | null;
          publish_status?: PublishStatus;
          error_message?: string | null;
          retry_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_item_id?: string;
          organization_id?: string;
          connection_id?: string;
          platform?: SocialPlatform;
          platform_post_id?: string | null;
          post_url?: string | null;
          published_at?: string | null;
          publish_status?: PublishStatus;
          error_message?: string | null;
          retry_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "published_posts_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "published_posts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "published_posts_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "social_media_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      post_analytics: {
        Row: {
          id: string;
          published_post_id: string;
          synced_at: string;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          impressions: number;
          reach: number;
          clicks: number;
          video_views: number;
          engagement_rate: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          published_post_id: string;
          synced_at?: string;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          impressions?: number;
          reach?: number;
          clicks?: number;
          video_views?: number;
          engagement_rate?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          published_post_id?: string;
          synced_at?: string;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          impressions?: number;
          reach?: number;
          clicks?: number;
          video_views?: number;
          engagement_rate?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_analytics_published_post_id_fkey";
            columns: ["published_post_id"];
            isOneToOne: false;
            referencedRelation: "published_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      google_drive_connections: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          drive_email: string | null;
          is_active: boolean;
          connected_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          drive_email?: string | null;
          is_active?: boolean;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          token_expires_at?: string;
          drive_email?: string | null;
          is_active?: boolean;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "google_drive_connections_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets: {
        Row: {
          id: string;
          organization_id: string;
          file_url: string;
          file_name: string;
          file_type: string;
          file_size: number;
          tags: string[];
          folder: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          file_url: string;
          file_name: string;
          file_type: string;
          file_size?: number;
          tags?: string[];
          folder?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          file_url?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          tags?: string[];
          folder?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_assets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      content_comments: {
        Row: {
          id: string;
          content_item_id: string;
          user_id: string;
          parent_comment_id: string | null;
          body: string;
          is_resolved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          user_id: string;
          parent_comment_id?: string | null;
          body: string;
          is_resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_item_id?: string;
          user_id?: string;
          parent_comment_id?: string | null;
          body?: string;
          is_resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_comments_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "content_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      content_tags: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_tags_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      content_item_tags: {
        Row: {
          id: string;
          content_item_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_item_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_item_tags_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_item_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "content_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      content_versions: {
        Row: {
          id: string;
          content_item_id: string;
          version_number: number;
          changed_by: string | null;
          snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          version_number?: number;
          changed_by?: string | null;
          snapshot: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_item_id?: string;
          version_number?: number;
          changed_by?: string | null;
          snapshot?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_versions_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_balances: {
        Row: {
          id: string;
          organization_id: string;
          monthly_credits_remaining: number;
          monthly_credits_total: number;
          topup_credits_remaining: number;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          monthly_credits_remaining?: number;
          monthly_credits_total?: number;
          topup_credits_remaining?: number;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          monthly_credits_remaining?: number;
          monthly_credits_total?: number;
          topup_credits_remaining?: number;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_balances_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_transactions: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          transaction_type: CreditTransactionType;
          credits_amount: number;
          credits_before: number;
          credits_after: number;
          source: string | null;
          description: string | null;
          ai_usage_id: string | null;
          invoice_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          transaction_type: CreditTransactionType;
          credits_amount: number;
          credits_before: number;
          credits_after: number;
          source?: string | null;
          description?: string | null;
          ai_usage_id?: string | null;
          invoice_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          transaction_type?: CreditTransactionType;
          credits_amount?: number;
          credits_before?: number;
          credits_after?: number;
          source?: string | null;
          description?: string | null;
          ai_usage_id?: string | null;
          invoice_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_ai_usage_id_fkey";
            columns: ["ai_usage_id"];
            isOneToOne: false;
            referencedRelation: "ai_usage";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_topup_packs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          credits: number;
          price_cents: number;
          description: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          credits: number;
          price_cents: number;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          credits?: number;
          price_cents?: number;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          invoice_number: string;
          invoice_type: InvoiceType;
          status: InvoiceStatus;
          subtotal_cents: number;
          vat_cents: number;
          total_cents: number;
          line_items: Json;
          paystack_reference: string | null;
          billing_name: string | null;
          billing_email: string | null;
          billing_address: string | null;
          credits_granted: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          invoice_number: string;
          invoice_type: InvoiceType;
          status?: InvoiceStatus;
          subtotal_cents?: number;
          vat_cents?: number;
          total_cents?: number;
          line_items?: Json;
          paystack_reference?: string | null;
          billing_name?: string | null;
          billing_email?: string | null;
          billing_address?: string | null;
          credits_granted?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          invoice_number?: string;
          invoice_type?: InvoiceType;
          status?: InvoiceStatus;
          subtotal_cents?: number;
          vat_cents?: number;
          total_cents?: number;
          line_items?: Json;
          paystack_reference?: string | null;
          billing_name?: string | null;
          billing_email?: string | null;
          billing_address?: string | null;
          credits_granted?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_model_preferences: {
        Row: {
          id: string;
          organization_id: string;
          feature: string;
          provider: string;
          model: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          feature: string;
          provider: string;
          model: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          feature?: string;
          provider?: string;
          model?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_model_preferences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      model_access_rules: {
        Row: {
          id: string;
          model_id: string;
          scope_type: string;
          scope_id: string;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          model_id: string;
          scope_type: string;
          scope_id: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          model_id?: string;
          scope_type?: string;
          scope_id?: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pipelines: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          is_default: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipelines_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_stages: {
        Row: {
          id: string;
          pipeline_id: string;
          name: string;
          color: string;
          sort_order: number;
          is_win_stage: boolean;
          is_loss_stage: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          pipeline_id: string;
          name: string;
          color?: string;
          sort_order?: number;
          is_win_stage?: boolean;
          is_loss_stage?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          pipeline_id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          is_win_stage?: boolean;
          is_loss_stage?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_contacts: {
        Row: {
          id: string;
          organization_id: string;
          pipeline_id: string;
          stage_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          value_cents: number;
          currency: string;
          assigned_to: string | null;
          custom_fields: Json;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          pipeline_id: string;
          stage_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          value_cents?: number;
          currency?: string;
          assigned_to?: string | null;
          custom_fields?: Json;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          pipeline_id?: string;
          stage_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          value_cents?: number;
          currency?: string;
          assigned_to?: string | null;
          custom_fields?: Json;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_contacts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_contacts_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_contacts_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_tags: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_tags_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_contact_tags: {
        Row: {
          id: string;
          contact_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_contact_tags_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_contact_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_activity: {
        Row: {
          id: string;
          contact_id: string;
          organization_id: string;
          event_type: string;
          from_stage_id: string | null;
          to_stage_id: string | null;
          metadata: Json;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          organization_id: string;
          event_type: string;
          from_stage_id?: string | null;
          to_stage_id?: string | null;
          metadata?: Json;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          organization_id?: string;
          event_type?: string;
          from_stage_id?: string | null;
          to_stage_id?: string | null;
          metadata?: Json;
          performed_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_activity_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_activity_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      email_templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          subject: string;
          body_html: string;
          merge_fields: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          subject: string;
          body_html: string;
          merge_fields?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          subject?: string;
          body_html?: string;
          merge_fields?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_workflows: {
        Row: {
          id: string;
          organization_id: string;
          pipeline_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          trigger_type: string;
          trigger_config: Json;
          graph_data: Json;
          version: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          pipeline_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          trigger_type: string;
          trigger_config?: Json;
          graph_data?: Json;
          version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          pipeline_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          trigger_type?: string;
          trigger_config?: Json;
          graph_data?: Json;
          version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_workflows_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_workflows_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_steps: {
        Row: {
          id: string;
          workflow_id: string;
          step_order: number;
          step_type: string;
          config: Json;
          next_step_id: string | null;
          condition_true_step_id: string | null;
          condition_false_step_id: string | null;
          reactflow_node_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          step_order?: number;
          step_type: string;
          config?: Json;
          next_step_id?: string | null;
          condition_true_step_id?: string | null;
          condition_false_step_id?: string | null;
          reactflow_node_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          step_order?: number;
          step_type?: string;
          config?: Json;
          next_step_id?: string | null;
          condition_true_step_id?: string | null;
          condition_false_step_id?: string | null;
          reactflow_node_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_steps_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_runs: {
        Row: {
          id: string;
          workflow_id: string;
          contact_id: string;
          status: string;
          current_step_id: string | null;
          started_at: string;
          completed_at: string | null;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          contact_id: string;
          status?: string;
          current_step_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          contact_id?: string;
          status?: string;
          current_step_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "automation_runs_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_runs_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_step_logs: {
        Row: {
          id: string;
          run_id: string;
          step_id: string;
          status: string;
          started_at: string | null;
          completed_at: string | null;
          result: Json;
          retry_count: number;
          next_retry_at: string | null;
        };
        Insert: {
          id?: string;
          run_id: string;
          step_id: string;
          status?: string;
          started_at?: string | null;
          completed_at?: string | null;
          result?: Json;
          retry_count?: number;
          next_retry_at?: string | null;
        };
        Update: {
          id?: string;
          run_id?: string;
          step_id?: string;
          status?: string;
          started_at?: string | null;
          completed_at?: string | null;
          result?: Json;
          retry_count?: number;
          next_retry_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_step_logs_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "automation_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_step_logs_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "automation_steps";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_endpoints: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          url: string;
          method: string;
          headers: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          url: string;
          method?: string;
          headers?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          url?: string;
          method?: string;
          headers?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_configs: {
        Row: {
          id: string;
          organization_id: string;
          integration_type: string;
          config: Json;
          credentials: Json;
          is_active: boolean;
          connected_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          integration_type: string;
          config?: Json;
          credentials?: Json;
          is_active?: boolean;
          connected_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          integration_type?: string;
          config?: Json;
          credentials?: Json;
          is_active?: boolean;
          connected_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_configs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_batches: {
        Row: {
          id: string;
          organization_id: string;
          calendar_id: string | null;
          user_id: string;
          model_id: string;
          status: string;
          total_items: number;
          completed_items: number;
          failed_items: number;
          uniqueness_log: Json;
          selected_brand_variables: Json | null;
          generate_scripts: boolean;
          selected_placements: Json | null;
          template_overrides: Json | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          calendar_id?: string | null;
          user_id: string;
          model_id: string;
          status?: string;
          total_items?: number;
          completed_items?: number;
          failed_items?: number;
          uniqueness_log?: Json;
          selected_brand_variables?: Json | null;
          generate_scripts?: boolean;
          selected_placements?: Json | null;
          template_overrides?: Json | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          calendar_id?: string | null;
          user_id?: string;
          model_id?: string;
          status?: string;
          total_items?: number;
          completed_items?: number;
          failed_items?: number;
          uniqueness_log?: Json;
          selected_brand_variables?: Json | null;
          generate_scripts?: boolean;
          selected_placements?: Json | null;
          template_overrides?: Json | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "generation_batches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generation_batches_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "content_calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generation_batches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_queue: {
        Row: {
          id: string;
          batch_id: string;
          content_item_id: string;
          organization_id: string;
          status: string;
          priority: number;
          attempt_count: number;
          max_attempts: number;
          locked_at: string | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          batch_id: string;
          content_item_id: string;
          organization_id: string;
          status?: string;
          priority?: number;
          attempt_count?: number;
          max_attempts?: number;
          locked_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          batch_id?: string;
          content_item_id?: string;
          organization_id?: string;
          status?: string;
          priority?: number;
          attempt_count?: number;
          max_attempts?: number;
          locked_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "generation_queue_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "generation_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generation_queue_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generation_queue_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_accounts: {
        Row: {
          id: string;
          organization_id: string;
          platform: string;
          account_name: string;
          platform_account_id: string;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          scopes: string[];
          is_active: boolean;
          connected_by: string;
          connected_at: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          platform: string;
          account_name: string;
          platform_account_id: string;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          is_active?: boolean;
          connected_by: string;
          connected_at?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          platform?: string;
          account_name?: string;
          platform_account_id?: string;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          is_active?: boolean;
          connected_by?: string;
          connected_at?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_accounts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_accounts_connected_by_fkey";
            columns: ["connected_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_campaigns: {
        Row: {
          id: string;
          organization_id: string;
          ad_account_id: string;
          name: string;
          platform: string;
          objective: string;
          status: string;
          budget_type: string;
          budget_cents: number;
          currency: string;
          start_date: string | null;
          end_date: string | null;
          special_ad_category: string | null;
          platform_campaign_id: string | null;
          compliance_notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          ad_account_id: string;
          name: string;
          platform: string;
          objective: string;
          status?: string;
          budget_type: string;
          budget_cents?: number;
          currency?: string;
          start_date?: string | null;
          end_date?: string | null;
          special_ad_category?: string | null;
          platform_campaign_id?: string | null;
          compliance_notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          ad_account_id?: string;
          name?: string;
          platform?: string;
          objective?: string;
          status?: string;
          budget_type?: string;
          budget_cents?: number;
          currency?: string;
          start_date?: string | null;
          end_date?: string | null;
          special_ad_category?: string | null;
          platform_campaign_id?: string | null;
          compliance_notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_campaigns_ad_account_id_fkey";
            columns: ["ad_account_id"];
            isOneToOne: false;
            referencedRelation: "ad_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_campaigns_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_sets: {
        Row: {
          id: string;
          campaign_id: string;
          organization_id: string;
          name: string;
          targeting_config: Json;
          placements: string[];
          bidding_strategy: string;
          bid_amount_cents: number | null;
          budget_type: string | null;
          budget_cents: number | null;
          platform_ad_set_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          organization_id: string;
          name: string;
          targeting_config?: Json;
          placements?: string[];
          bidding_strategy?: string;
          bid_amount_cents?: number | null;
          budget_type?: string | null;
          budget_cents?: number | null;
          platform_ad_set_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          organization_id?: string;
          name?: string;
          targeting_config?: Json;
          placements?: string[];
          bidding_strategy?: string;
          bid_amount_cents?: number | null;
          budget_type?: string | null;
          budget_cents?: number | null;
          platform_ad_set_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_sets_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "ad_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_sets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_creatives: {
        Row: {
          id: string;
          ad_set_id: string | null;
          campaign_id: string | null;
          organization_id: string;
          name: string;
          format: string;
          media_urls: string[];
          thumbnail_url: string | null;
          primary_text: string;
          headline: string | null;
          description: string | null;
          cta_type: string | null;
          target_url: string;
          utm_parameters: Json;
          display_link: string | null;
          ai_generated: boolean;
          ai_model: string | null;
          funnel_stage: string | null;
          storybrand_stage: string | null;
          selected_brand_variables: Json | null;
          compliance_status: string;
          compliance_issues: Json;
          special_ad_category: string | null;
          platform_creative_id: string | null;
          platform_ad_id: string | null;
          status: string;
          rejection_reason: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ad_set_id?: string | null;
          campaign_id?: string | null;
          organization_id: string;
          name: string;
          format: string;
          media_urls?: string[];
          thumbnail_url?: string | null;
          primary_text: string;
          headline?: string | null;
          description?: string | null;
          cta_type?: string | null;
          target_url: string;
          utm_parameters?: Json;
          display_link?: string | null;
          ai_generated?: boolean;
          ai_model?: string | null;
          funnel_stage?: string | null;
          storybrand_stage?: string | null;
          selected_brand_variables?: Json | null;
          compliance_status?: string;
          compliance_issues?: Json;
          special_ad_category?: string | null;
          platform_creative_id?: string | null;
          platform_ad_id?: string | null;
          status?: string;
          rejection_reason?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ad_set_id?: string | null;
          campaign_id?: string | null;
          organization_id?: string;
          name?: string;
          format?: string;
          media_urls?: string[];
          thumbnail_url?: string | null;
          primary_text?: string;
          headline?: string | null;
          description?: string | null;
          cta_type?: string | null;
          target_url?: string;
          utm_parameters?: Json;
          display_link?: string | null;
          ai_generated?: boolean;
          ai_model?: string | null;
          funnel_stage?: string | null;
          storybrand_stage?: string | null;
          selected_brand_variables?: Json | null;
          compliance_status?: string;
          compliance_issues?: Json;
          special_ad_category?: string | null;
          platform_creative_id?: string | null;
          platform_ad_id?: string | null;
          status?: string;
          rejection_reason?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_creatives_ad_set_id_fkey";
            columns: ["ad_set_id"];
            isOneToOne: false;
            referencedRelation: "ad_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "ad_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_creatives_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_creatives_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_audiences: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          platform: string;
          audience_type: string;
          targeting_spec: Json;
          source_pipeline_id: string | null;
          source_stage_ids: string[];
          source_tag_ids: string[];
          last_synced_at: string | null;
          platform_audience_id: string | null;
          approximate_size: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          platform: string;
          audience_type: string;
          targeting_spec?: Json;
          source_pipeline_id?: string | null;
          source_stage_ids?: string[];
          source_tag_ids?: string[];
          last_synced_at?: string | null;
          platform_audience_id?: string | null;
          approximate_size?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          platform?: string;
          audience_type?: string;
          targeting_spec?: Json;
          source_pipeline_id?: string | null;
          source_stage_ids?: string[];
          source_tag_ids?: string[];
          last_synced_at?: string | null;
          platform_audience_id?: string | null;
          approximate_size?: number | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_audiences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_audiences_source_pipeline_id_fkey";
            columns: ["source_pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_audiences_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_metrics: {
        Row: {
          id: string;
          creative_id: string;
          campaign_id: string;
          date: string;
          impressions: number;
          reach: number;
          frequency: number;
          clicks: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          video_views: number;
          video_3s_views: number;
          ctr: number;
          engagement_rate: number;
          conversions: number;
          conversion_value_cents: number;
          spend_cents: number;
          currency: string;
          cpc_cents: number;
          cpm_cents: number;
          cpa_cents: number | null;
          roas: number | null;
          metadata: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          creative_id: string;
          campaign_id: string;
          date: string;
          impressions?: number;
          reach?: number;
          frequency?: number;
          clicks?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          video_views?: number;
          video_3s_views?: number;
          ctr?: number;
          engagement_rate?: number;
          conversions?: number;
          conversion_value_cents?: number;
          spend_cents?: number;
          currency?: string;
          cpc_cents?: number;
          cpm_cents?: number;
          cpa_cents?: number | null;
          roas?: number | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          creative_id?: string;
          campaign_id?: string;
          date?: string;
          impressions?: number;
          reach?: number;
          frequency?: number;
          clicks?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          video_views?: number;
          video_3s_views?: number;
          ctr?: number;
          engagement_rate?: number;
          conversions?: number;
          conversion_value_cents?: number;
          spend_cents?: number;
          currency?: string;
          cpc_cents?: number;
          cpm_cents?: number;
          cpa_cents?: number | null;
          roas?: number | null;
          metadata?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_metrics_creative_id_fkey";
            columns: ["creative_id"];
            isOneToOne: false;
            referencedRelation: "ad_creatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_metrics_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "ad_campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_generation_batches: {
        Row: {
          id: string;
          organization_id: string;
          campaign_id: string | null;
          ad_set_id: string | null;
          user_id: string;
          model_id: string;
          platform: string;
          format: string;
          objective: string | null;
          funnel_stage: string | null;
          selected_brand_variables: Json | null;
          status: string;
          total_variations: number;
          completed_variations: number;
          failed_variations: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          campaign_id?: string | null;
          ad_set_id?: string | null;
          user_id: string;
          model_id: string;
          platform: string;
          format: string;
          objective?: string | null;
          funnel_stage?: string | null;
          selected_brand_variables?: Json | null;
          status?: string;
          total_variations?: number;
          completed_variations?: number;
          failed_variations?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          campaign_id?: string | null;
          ad_set_id?: string | null;
          user_id?: string;
          model_id?: string;
          platform?: string;
          format?: string;
          objective?: string | null;
          funnel_stage?: string | null;
          selected_brand_variables?: Json | null;
          status?: string;
          total_variations?: number;
          completed_variations?: number;
          failed_variations?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_generation_batches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_generation_batches_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "ad_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_generation_batches_ad_set_id_fkey";
            columns: ["ad_set_id"];
            isOneToOne: false;
            referencedRelation: "ad_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_generation_batches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      team_permissions: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          feature: string;
          permissions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          feature: string;
          permissions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          feature?: string;
          permissions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_permissions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_permissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      team_credit_allocations: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          feature: string;
          credits_allocated: number;
          credits_remaining: number;
          allocated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          feature: string;
          credits_allocated?: number;
          credits_remaining?: number;
          allocated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          feature?: string;
          credits_allocated?: number;
          credits_remaining?: number;
          allocated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_credit_allocations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_credit_allocations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_credit_allocations_allocated_by_fkey";
            columns: ["allocated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      change_requests: {
        Row: {
          id: string;
          organization_id: string;
          requested_by: string;
          feature: string;
          entity_type: string;
          entity_id: string | null;
          change_type: string;
          current_value: Json | null;
          proposed_value: Json | null;
          metadata: Json;
          status: string;
          reviewed_by: string | null;
          review_comment: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          requested_by: string;
          feature: string;
          entity_type: string;
          entity_id?: string | null;
          change_type: string;
          current_value?: Json | null;
          proposed_value?: Json | null;
          metadata?: Json;
          status?: string;
          reviewed_by?: string | null;
          review_comment?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          requested_by?: string;
          feature?: string;
          entity_type?: string;
          entity_id?: string | null;
          change_type?: string;
          current_value?: Json | null;
          proposed_value?: Json | null;
          metadata?: Json;
          status?: string;
          reviewed_by?: string | null;
          review_comment?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "change_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "change_requests_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "change_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      content_templates: {
        Row: {
          id: string;
          template_key: string;
          name: string;
          category: TemplateCategory;
          content_type: TemplateContentType;
          format_category: string | null;
          tier: TemplateTier;
          funnel_stages: string[];
          structure: string | null;
          psychology: string | null;
          description: string | null;
          when_to_use: string[] | null;
          when_not_to_use: string[] | null;
          example_content: string | null;
          prompt_instructions: string;
          output_format: string | null;
          markdown_source: string | null;
          is_active: boolean;
          is_system: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          template_key: string;
          name: string;
          category: TemplateCategory;
          content_type: TemplateContentType;
          format_category?: string | null;
          tier?: TemplateTier;
          funnel_stages?: string[];
          structure?: string | null;
          psychology?: string | null;
          description?: string | null;
          when_to_use?: string[] | null;
          when_not_to_use?: string[] | null;
          example_content?: string | null;
          prompt_instructions: string;
          output_format?: string | null;
          markdown_source?: string | null;
          is_active?: boolean;
          is_system?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          template_key?: string;
          name?: string;
          category?: TemplateCategory;
          content_type?: TemplateContentType;
          format_category?: string | null;
          tier?: TemplateTier;
          funnel_stages?: string[];
          structure?: string | null;
          psychology?: string | null;
          description?: string | null;
          when_to_use?: string[] | null;
          when_not_to_use?: string[] | null;
          example_content?: string | null;
          prompt_instructions?: string;
          output_format?: string | null;
          markdown_source?: string | null;
          is_active?: boolean;
          is_system?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      template_stage_mappings: {
        Row: {
          id: string;
          template_id: string;
          funnel_stage: string;
          storybrand_stage: string;
          is_primary: boolean;
          confidence_score: number;
        };
        Insert: {
          id?: string;
          template_id: string;
          funnel_stage: string;
          storybrand_stage: string;
          is_primary?: boolean;
          confidence_score?: number;
        };
        Update: {
          id?: string;
          template_id?: string;
          funnel_stage?: string;
          storybrand_stage?: string;
          is_primary?: boolean;
          confidence_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "template_stage_mappings_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "content_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      content_feedback: {
        Row: {
          id: string;
          content_item_id: string;
          organization_id: string;
          user_id: string;
          feedback_type: ContentFeedbackType;
          reason: string | null;
          tags: string[];
          generation_config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          organization_id: string;
          user_id: string;
          feedback_type: ContentFeedbackType;
          reason?: string | null;
          tags?: string[];
          generation_config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_item_id?: string;
          organization_id?: string;
          user_id?: string;
          feedback_type?: ContentFeedbackType;
          reason?: string | null;
          tags?: string[];
          generation_config?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_feedback_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_feedback_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {
      get_brand_context: {
        Args: {
          org_id: string;
        };
        Returns: Json;
      };
      reset_monthly_credits: {
        Args: {
          p_org_id: string;
        };
        Returns: void;
      };
    };
    Enums: {};
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
