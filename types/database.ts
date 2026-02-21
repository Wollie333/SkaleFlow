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
export type NotificationType = 'content_submitted' | 'content_approved' | 'content_rejected' | 'revision_requested' | 'generation_completed' | 'change_request_submitted' | 'change_request_approved' | 'change_request_rejected' | 'change_request_revision' | 'credits_allocated' | 'credits_low' | 'call_booked' | 'call_reminder' | 'call_completed' | 'call_summary_ready' | 'brand_audit_completed';
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

// CRM types
export type CrmLifecycleStage = 'lead' | 'prospect' | 'opportunity' | 'customer' | 'churned';
export type CrmContactSource = 'manual' | 'website' | 'referral' | 'social_media' | 'pipeline' | 'import' | 'other';
export type CrmDealStatus = 'open' | 'won' | 'lost';
export type CrmInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type CrmActivityType = 'email' | 'call' | 'meeting' | 'note' | 'deal_created' | 'deal_won' | 'deal_lost' | 'invoice_sent' | 'invoice_paid' | 'stage_changed' | 'contact_created' | 'contact_updated' | 'tag_added' | 'tag_removed';
export type CrmBillingInterval = 'once' | 'monthly' | 'quarterly' | 'annual';

// Authority Engine types
export type AuthorityCategory = 'press_release' | 'media_placement' | 'magazine_feature' | 'podcast_appearance' | 'live_event' | 'tv_video' | 'award_recognition' | 'thought_leadership';
export type AuthorityPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AuthorityStageType = 'active' | 'closed_won' | 'closed_lost';
export type AuthorityReachTier = 'local' | 'regional' | 'national' | 'international';
export type AuthorityEngagementType = 'earned' | 'paid' | 'contra' | 'sponsored';
export type AuthorityPaymentStatus = 'not_invoiced' | 'invoiced' | 'paid' | 'overdue';
export type AuthorityPaymentTerms = 'upfront' | '50_50' | 'on_publication' | 'net_30' | 'custom';
export type PipelineType = 'custom' | 'application';
export type FormFieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'checkbox';
export type FormFieldMapping = 'full_name' | 'email' | 'phone' | 'company' | string;
export type AuthorityContactRole = 'journalist' | 'editor' | 'podcast_host' | 'event_organiser' | 'pr_agent' | 'other';
export type AuthorityContactWarmth = 'cold' | 'warm' | 'hot' | 'active' | 'published';
export type AuthorityContactSource = 'manual' | 'press_page_inquiry' | 'email_capture' | 'csv_import' | 'referral';
export type AuthorityCorrespondenceType = 'email' | 'phone_call' | 'meeting' | 'note' | 'other';
export type AuthorityCorrespondenceDirection = 'inbound' | 'outbound';
export type AuthorityAssetType = 'clipping_screenshot' | 'clipping_pdf' | 'clipping_url' | 'publication_logo' | 'headshot' | 'product_image' | 'brand_logo' | 'document' | 'attachment' | 'other';
export type AuthorityPressReleaseStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type AuthorityPressReleaseTemplate = 'product_launch' | 'milestone' | 'partnership' | 'award' | 'event' | 'executive_appointment' | 'crisis_response';
export type AuthorityQuestStatus = 'locked' | 'active' | 'completed';
export type AuthorityRoundStatus = 'active' | 'completed' | 'expired';
export type AuthorityCalendarEventType = 'submission_deadline' | 'publication_date' | 'embargo_lift' | 'follow_up' | 'speaking_event' | 'amplification_post' | 'quest_deadline' | 'custom';
export type AuthorityNotificationType = 'follow_up_due' | 'publication_approaching' | 'embargo_lifting' | 'inbound_inquiry' | 'deadline_approaching' | 'published_prompt' | 'quest_milestone' | 'payment_overdue' | 'inactivity_warning' | 'seasonal_prompt';
export type AuthorityNotificationChannel = 'in_app' | 'email' | 'push';
export type AuthorityDeclineReason = 'not_relevant' | 'bad_timing' | 'wrong_contact' | 'full_calendar' | 'budget_constraints' | 'other';
export type AuthorityConfirmedFormat = 'feature_article' | 'news_piece' | 'podcast_episode' | 'column' | 'interview' | 'speaking_slot';
export type AuthorityInquiryFormat = 'article' | 'podcast' | 'video_interview' | 'written_qa' | 'other';

// Video Call & AI Sales Co-Pilot types
export type CallType = 'discovery' | 'sales' | 'onboarding' | 'meeting' | 'follow_up' | 'custom';
export type CallStatus = 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type ParticipantRole = 'host' | 'team_member' | 'guest';
export type ParticipantStatus = 'invited' | 'waiting' | 'admitted' | 'in_call' | 'left' | 'denied';
export type GuidanceType = 'question' | 'objection_response' | 'offer_trigger' | 'sentiment_alert' | 'phase_transition' | 'closing' | 'opening' | 'general';
export type InsightType = 'pain_point' | 'language_pattern' | 'objection' | 'budget_signal' | 'need' | 'competitor_mention' | 'value_perception';
export type InsightStatus = 'pending' | 'accepted' | 'dismissed';
export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
export type ActionItemStatus = 'pending' | 'in_progress' | 'completed';
export type InviteMethod = 'link' | 'email' | 'calendar' | 'direct';
export type OfferBillingFrequency = 'once' | 'monthly' | 'quarterly' | 'annual';

// Brand Audit types
export type BrandAuditStatus = 'draft' | 'in_progress' | 'call_scheduled' | 'call_in_progress' | 'call_complete' | 'review' | 'scoring' | 'complete' | 'report_generated' | 'delivered' | 'abandoned';
export type BrandAuditSource = 'manual' | 'call' | 'hybrid' | 'website';
export type BrandAuditSectionKey = 'company_overview' | 'brand_foundation' | 'visual_identity' | 'messaging' | 'digital_presence' | 'customer_experience' | 'competitive_landscape' | 'goals_challenges';
export type BrandAuditCategory = 'brand_foundation' | 'message_consistency' | 'visual_identity' | 'digital_presence' | 'customer_perception' | 'competitive_differentiation';
export type BrandAuditRating = 'red' | 'amber' | 'green';
export type BrandAuditDataSource = 'manual' | 'call_extracted' | 'website_extracted' | 'ai_refined';

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
          organization_id: string | null;
          ai_beta_enabled: boolean;
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
          organization_id?: string | null;
          ai_beta_enabled?: boolean;
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
          organization_id?: string | null;
          ai_beta_enabled?: boolean;
        };
        Relationships: [];
      };
      user_api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          encrypted_key: string;
          key_iv: string;
          key_hint: string;
          is_valid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          encrypted_key: string;
          key_iv: string;
          key_hint?: string;
          is_valid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          encrypted_key?: string;
          key_iv?: string;
          key_hint?: string;
          is_valid?: boolean;
          created_at?: string;
          updated_at?: string;
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
          industry: string | null;
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
          industry?: string | null;
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
          industry?: string | null;
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
          call_id: string | null;
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
          call_id?: string | null;
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
          call_id?: string | null;
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
          {
            foreignKeyName: "ai_usage_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
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
          application_id: string | null;
          host_user_id: string;
          pipeline_contact_id: string | null;
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
          application_id?: string | null;
          host_user_id: string;
          pipeline_contact_id?: string | null;
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
          application_id?: string | null;
          host_user_id?: string;
          pipeline_contact_id?: string | null;
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
          {
            foreignKeyName: "meetings_pipeline_contact_id_fkey";
            columns: ["pipeline_contact_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_contacts";
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
      canva_connections: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          canva_user_id: string | null;
          scopes: string[] | null;
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
          canva_user_id?: string | null;
          scopes?: string[] | null;
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
          canva_user_id?: string | null;
          scopes?: string[] | null;
          is_active?: boolean;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "canva_connections_organization_id_fkey";
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
          pipeline_type: string;
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
          pipeline_type?: string;
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
          pipeline_type?: string;
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
          crm_contact_id: string | null;
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
          crm_contact_id?: string | null;
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
          crm_contact_id?: string | null;
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
          creative_direction: string | null;
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
          creative_direction?: string | null;
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
          creative_direction?: string | null;
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
          hook_rules: string | null;
          body_rules: string | null;
          cta_rules: string | null;
          tone_voice: string | null;
          formatting_rules: string | null;
          is_standardised: boolean;
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
          hook_rules?: string | null;
          body_rules?: string | null;
          cta_rules?: string | null;
          tone_voice?: string | null;
          formatting_rules?: string | null;
          is_standardised?: boolean;
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
          hook_rules?: string | null;
          body_rules?: string | null;
          cta_rules?: string | null;
          tone_voice?: string | null;
          formatting_rules?: string | null;
          is_standardised?: boolean;
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

      // ================================================================
      // Authority Engine Tables
      // ================================================================

      authority_pipeline_stages: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          stage_order: number;
          stage_type: AuthorityStageType;
          color: string | null;
          is_default: boolean;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          stage_order: number;
          stage_type?: AuthorityStageType;
          color?: string | null;
          is_default?: boolean;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          stage_order?: number;
          stage_type?: AuthorityStageType;
          color?: string | null;
          is_default?: boolean;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_pipeline_stages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_contacts: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          outlet: string | null;
          role: string | null;
          beat: string | null;
          location: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          website_url: string | null;
          warmth: AuthorityContactWarmth;
          source: AuthorityContactSource;
          email_normalised: string | null;
          notes: string | null;
          last_contacted_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          outlet?: string | null;
          role?: string | null;
          beat?: string | null;
          location?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          website_url?: string | null;
          warmth?: AuthorityContactWarmth;
          source?: AuthorityContactSource;
          email_normalised?: string | null;
          notes?: string | null;
          last_contacted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          outlet?: string | null;
          role?: string | null;
          beat?: string | null;
          location?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          website_url?: string | null;
          warmth?: AuthorityContactWarmth;
          source?: AuthorityContactSource;
          email_normalised?: string | null;
          notes?: string | null;
          last_contacted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_contacts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_story_angles: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string;
          category: string | null;
          target_audience: string | null;
          suggested_outlets: string | null;
          is_active: boolean;
          is_ai_generated: boolean;
          display_order: number;
          times_used: number;
          times_successful: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description: string;
          category?: string | null;
          target_audience?: string | null;
          suggested_outlets?: string | null;
          is_active?: boolean;
          is_ai_generated?: boolean;
          display_order?: number;
          times_used?: number;
          times_successful?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string;
          category?: string | null;
          target_audience?: string | null;
          suggested_outlets?: string | null;
          is_active?: boolean;
          is_ai_generated?: boolean;
          display_order?: number;
          times_used?: number;
          times_successful?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_story_angles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_press_kit: {
        Row: {
          id: string;
          organization_id: string;
          brand_overview: string | null;
          boilerplate: string | null;
          founder_bio_short: string | null;
          founder_bio_long: string | null;
          fact_sheet: Json;
          speaking_topics: Json;
          social_stats: Json;
          brand_colors: Json;
          brand_fonts: Json;
          logo_usage_notes: string | null;
          public_page_enabled: boolean;
          public_page_slug: string | null;
          hero_tagline: string | null;
          setup_completed: boolean;
          setup_completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brand_overview?: string | null;
          boilerplate?: string | null;
          founder_bio_short?: string | null;
          founder_bio_long?: string | null;
          fact_sheet?: Json;
          speaking_topics?: Json;
          social_stats?: Json;
          brand_colors?: Json;
          brand_fonts?: Json;
          logo_usage_notes?: string | null;
          public_page_enabled?: boolean;
          public_page_slug?: string | null;
          hero_tagline?: string | null;
          setup_completed?: boolean;
          setup_completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          brand_overview?: string | null;
          boilerplate?: string | null;
          founder_bio_short?: string | null;
          founder_bio_long?: string | null;
          fact_sheet?: Json;
          speaking_topics?: Json;
          social_stats?: Json;
          brand_colors?: Json;
          brand_fonts?: Json;
          logo_usage_notes?: string | null;
          public_page_enabled?: boolean;
          public_page_slug?: string | null;
          hero_tagline?: string | null;
          setup_completed?: boolean;
          setup_completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_press_kit_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_pipeline_cards: {
        Row: {
          id: string;
          organization_id: string;
          opportunity_name: string;
          stage_id: string;
          category: AuthorityCategory;
          priority: AuthorityPriority;
          target_outlet: string | null;
          contact_id: string | null;
          story_angle_id: string | null;
          custom_story_angle: string | null;
          target_date: string | null;
          pitched_at: string | null;
          agreed_at: string | null;
          submitted_at: string | null;
          published_at: string | null;
          amplified_at: string | null;
          archived_at: string | null;
          confirmed_format: string | null;
          confirmed_angle: string | null;
          submission_deadline: string | null;
          expected_publication_date: string | null;
          embargo_date: string | null;
          embargo_active: boolean;
          live_url: string | null;
          reach_tier: AuthorityReachTier;
          decline_reason: string | null;
          decline_reason_other: string | null;
          decline_try_again_date: string | null;
          decline_referred_to: string | null;
          no_response_follow_up_count: number;
          on_hold_reason: string | null;
          on_hold_resume_date: string | null;
          content_campaign_id: string | null;
          pre_launch_campaign_id: string | null;
          notes: string | null;
          authority_points_earned: number;
          points_calculated: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          opportunity_name: string;
          stage_id: string;
          category: AuthorityCategory;
          priority?: AuthorityPriority;
          target_outlet?: string | null;
          contact_id?: string | null;
          story_angle_id?: string | null;
          custom_story_angle?: string | null;
          target_date?: string | null;
          pitched_at?: string | null;
          agreed_at?: string | null;
          submitted_at?: string | null;
          published_at?: string | null;
          amplified_at?: string | null;
          archived_at?: string | null;
          confirmed_format?: string | null;
          confirmed_angle?: string | null;
          submission_deadline?: string | null;
          expected_publication_date?: string | null;
          embargo_date?: string | null;
          embargo_active?: boolean;
          live_url?: string | null;
          reach_tier?: AuthorityReachTier;
          decline_reason?: string | null;
          decline_reason_other?: string | null;
          decline_try_again_date?: string | null;
          decline_referred_to?: string | null;
          no_response_follow_up_count?: number;
          on_hold_reason?: string | null;
          on_hold_resume_date?: string | null;
          content_campaign_id?: string | null;
          pre_launch_campaign_id?: string | null;
          notes?: string | null;
          authority_points_earned?: number;
          points_calculated?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          opportunity_name?: string;
          stage_id?: string;
          category?: AuthorityCategory;
          priority?: AuthorityPriority;
          target_outlet?: string | null;
          contact_id?: string | null;
          story_angle_id?: string | null;
          custom_story_angle?: string | null;
          target_date?: string | null;
          pitched_at?: string | null;
          agreed_at?: string | null;
          submitted_at?: string | null;
          published_at?: string | null;
          amplified_at?: string | null;
          archived_at?: string | null;
          confirmed_format?: string | null;
          confirmed_angle?: string | null;
          submission_deadline?: string | null;
          expected_publication_date?: string | null;
          embargo_date?: string | null;
          embargo_active?: boolean;
          live_url?: string | null;
          reach_tier?: AuthorityReachTier;
          decline_reason?: string | null;
          decline_reason_other?: string | null;
          decline_try_again_date?: string | null;
          decline_referred_to?: string | null;
          no_response_follow_up_count?: number;
          on_hold_reason?: string | null;
          on_hold_resume_date?: string | null;
          content_campaign_id?: string | null;
          pre_launch_campaign_id?: string | null;
          notes?: string | null;
          authority_points_earned?: number;
          points_calculated?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_pipeline_cards_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_pipeline_cards_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_pipeline_cards_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "authority_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_pipeline_cards_story_angle_id_fkey";
            columns: ["story_angle_id"];
            isOneToOne: false;
            referencedRelation: "authority_story_angles";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_commercial: {
        Row: {
          id: string;
          organization_id: string;
          card_id: string;
          engagement_type: AuthorityEngagementType;
          deal_value: number;
          currency: string;
          payment_status: AuthorityPaymentStatus;
          payment_terms: string | null;
          payment_terms_custom: string | null;
          invoice_reference: string | null;
          invoice_date: string | null;
          payment_due_date: string | null;
          payment_received_date: string | null;
          budget_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          card_id: string;
          engagement_type: AuthorityEngagementType;
          deal_value?: number;
          currency?: string;
          payment_status?: AuthorityPaymentStatus;
          payment_terms?: string | null;
          payment_terms_custom?: string | null;
          invoice_reference?: string | null;
          invoice_date?: string | null;
          payment_due_date?: string | null;
          payment_received_date?: string | null;
          budget_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          card_id?: string;
          engagement_type?: AuthorityEngagementType;
          deal_value?: number;
          currency?: string;
          payment_status?: AuthorityPaymentStatus;
          payment_terms?: string | null;
          payment_terms_custom?: string | null;
          invoice_reference?: string | null;
          invoice_date?: string | null;
          payment_due_date?: string | null;
          payment_received_date?: string | null;
          budget_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_commercial_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_commercial_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: true;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_correspondence: {
        Row: {
          id: string;
          organization_id: string;
          card_id: string | null;
          contact_id: string | null;
          type: AuthorityCorrespondenceType;
          direction: AuthorityCorrespondenceDirection | null;
          email_subject: string | null;
          email_from: string | null;
          email_to: string | null;
          email_cc: string | null;
          email_bcc: string | null;
          email_body_text: string | null;
          email_body_html: string | null;
          email_message_id: string | null;
          email_in_reply_to: string | null;
          email_thread_id: string | null;
          summary: string | null;
          content: string | null;
          occurred_at: string;
          duration_minutes: number | null;
          created_by: string | null;
          synced_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          card_id?: string | null;
          contact_id?: string | null;
          type: AuthorityCorrespondenceType;
          direction?: AuthorityCorrespondenceDirection | null;
          email_subject?: string | null;
          email_from?: string | null;
          email_to?: string | null;
          email_cc?: string | null;
          email_bcc?: string | null;
          email_body_text?: string | null;
          email_body_html?: string | null;
          email_message_id?: string | null;
          email_in_reply_to?: string | null;
          email_thread_id?: string | null;
          summary?: string | null;
          content?: string | null;
          occurred_at: string;
          duration_minutes?: number | null;
          created_by?: string | null;
          synced_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          card_id?: string | null;
          contact_id?: string | null;
          type?: AuthorityCorrespondenceType;
          direction?: AuthorityCorrespondenceDirection | null;
          email_subject?: string | null;
          email_from?: string | null;
          email_to?: string | null;
          email_cc?: string | null;
          email_bcc?: string | null;
          email_body_text?: string | null;
          email_body_html?: string | null;
          email_message_id?: string | null;
          email_in_reply_to?: string | null;
          email_thread_id?: string | null;
          summary?: string | null;
          content?: string | null;
          occurred_at?: string;
          duration_minutes?: number | null;
          created_by?: string | null;
          synced_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_correspondence_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_correspondence_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_correspondence_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "authority_contacts";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_press_releases: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          subtitle: string | null;
          template_type: string | null;
          headline: string;
          subheadline: string | null;
          dateline: string | null;
          body_content: string;
          quotes: Json;
          boilerplate: string | null;
          contact_info: string | null;
          status: AuthorityPressReleaseStatus;
          published_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          is_public: boolean;
          public_excerpt: string | null;
          slug: string | null;
          card_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          subtitle?: string | null;
          template_type?: string | null;
          headline: string;
          subheadline?: string | null;
          dateline?: string | null;
          body_content: string;
          quotes?: Json;
          boilerplate?: string | null;
          contact_info?: string | null;
          status?: AuthorityPressReleaseStatus;
          published_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          is_public?: boolean;
          public_excerpt?: string | null;
          slug?: string | null;
          card_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          subtitle?: string | null;
          template_type?: string | null;
          headline?: string;
          subheadline?: string | null;
          dateline?: string | null;
          body_content?: string;
          quotes?: Json;
          boilerplate?: string | null;
          contact_info?: string | null;
          status?: AuthorityPressReleaseStatus;
          published_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          is_public?: boolean;
          public_excerpt?: string | null;
          slug?: string | null;
          card_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_press_releases_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_press_releases_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_assets: {
        Row: {
          id: string;
          organization_id: string;
          card_id: string | null;
          correspondence_id: string | null;
          press_release_id: string | null;
          press_kit_id: string | null;
          asset_type: AuthorityAssetType;
          file_name: string | null;
          file_url: string;
          file_size: number | null;
          mime_type: string | null;
          title: string | null;
          description: string | null;
          alt_text: string | null;
          outlet_name: string | null;
          is_public: boolean;
          public_display_order: number | null;
          key_quotes: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          card_id?: string | null;
          correspondence_id?: string | null;
          press_release_id?: string | null;
          press_kit_id?: string | null;
          asset_type: AuthorityAssetType;
          file_name?: string | null;
          file_url: string;
          file_size?: number | null;
          mime_type?: string | null;
          title?: string | null;
          description?: string | null;
          alt_text?: string | null;
          outlet_name?: string | null;
          is_public?: boolean;
          public_display_order?: number | null;
          key_quotes?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          card_id?: string | null;
          correspondence_id?: string | null;
          press_release_id?: string | null;
          press_kit_id?: string | null;
          asset_type?: AuthorityAssetType;
          file_name?: string | null;
          file_url?: string;
          file_size?: number | null;
          mime_type?: string | null;
          title?: string | null;
          description?: string | null;
          alt_text?: string | null;
          outlet_name?: string | null;
          is_public?: boolean;
          public_display_order?: number | null;
          key_quotes?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_assets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_assets_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_assets_correspondence_id_fkey";
            columns: ["correspondence_id"];
            isOneToOne: false;
            referencedRelation: "authority_correspondence";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_assets_press_release_id_fkey";
            columns: ["press_release_id"];
            isOneToOne: false;
            referencedRelation: "authority_press_releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_assets_press_kit_id_fkey";
            columns: ["press_kit_id"];
            isOneToOne: false;
            referencedRelation: "authority_press_kit";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_quests: {
        Row: {
          id: string;
          organization_id: string;
          quest_name: string;
          quest_slug: string;
          tier: number;
          description: string | null;
          requirements: Json;
          status: AuthorityQuestStatus;
          progress_percentage: number;
          started_at: string | null;
          completed_at: string | null;
          target_completion_date: string | null;
          points_threshold_min: number;
          points_threshold_max: number | null;
          is_system: boolean;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          quest_name: string;
          quest_slug: string;
          tier: number;
          description?: string | null;
          requirements: Json;
          status?: AuthorityQuestStatus;
          progress_percentage?: number;
          started_at?: string | null;
          completed_at?: string | null;
          target_completion_date?: string | null;
          points_threshold_min: number;
          points_threshold_max?: number | null;
          is_system?: boolean;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          quest_name?: string;
          quest_slug?: string;
          tier?: number;
          description?: string | null;
          requirements?: Json;
          status?: AuthorityQuestStatus;
          progress_percentage?: number;
          started_at?: string | null;
          completed_at?: string | null;
          target_completion_date?: string | null;
          points_threshold_min?: number;
          points_threshold_max?: number | null;
          is_system?: boolean;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_quests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_scores: {
        Row: {
          id: string;
          organization_id: string;
          card_id: string;
          base_points: number;
          reach_multiplier: number;
          engagement_multiplier: number;
          amplification_bonus: number;
          round_bonus: number;
          consistency_bonus: number;
          total_points: number;
          activity_category: string;
          reach_tier: AuthorityReachTier;
          engagement_type: AuthorityEngagementType;
          description: string | null;
          scored_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          card_id: string;
          base_points: number;
          reach_multiplier?: number;
          engagement_multiplier?: number;
          amplification_bonus?: number;
          round_bonus?: number;
          consistency_bonus?: number;
          total_points: number;
          activity_category: string;
          reach_tier: AuthorityReachTier;
          engagement_type: AuthorityEngagementType;
          description?: string | null;
          scored_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          card_id?: string;
          base_points?: number;
          reach_multiplier?: number;
          engagement_multiplier?: number;
          amplification_bonus?: number;
          round_bonus?: number;
          consistency_bonus?: number;
          total_points?: number;
          activity_category?: string;
          reach_tier?: AuthorityReachTier;
          engagement_type?: AuthorityEngagementType;
          description?: string | null;
          scored_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_scores_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_scores_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_calendar_events: {
        Row: {
          id: string;
          organization_id: string;
          card_id: string | null;
          event_type: AuthorityCalendarEventType;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          reminder_sent: boolean;
          reminder_days_before: number;
          is_completed: boolean;
          completed_at: string | null;
          is_recurring: boolean;
          recurrence_pattern: string | null;
          color: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          card_id?: string | null;
          event_type: AuthorityCalendarEventType;
          title: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          reminder_sent?: boolean;
          reminder_days_before?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          is_recurring?: boolean;
          recurrence_pattern?: string | null;
          color?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          card_id?: string | null;
          event_type?: AuthorityCalendarEventType;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          reminder_sent?: boolean;
          reminder_days_before?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          is_recurring?: boolean;
          recurrence_pattern?: string | null;
          color?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_calendar_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_calendar_events_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          notification_type: AuthorityNotificationType;
          title: string;
          message: string;
          card_id: string | null;
          contact_id: string | null;
          quest_id: string | null;
          channel: AuthorityNotificationChannel;
          is_read: boolean;
          read_at: string | null;
          is_sent: boolean;
          sent_at: string | null;
          scheduled_for: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          notification_type: AuthorityNotificationType;
          title: string;
          message: string;
          card_id?: string | null;
          contact_id?: string | null;
          quest_id?: string | null;
          channel?: AuthorityNotificationChannel;
          is_read?: boolean;
          read_at?: string | null;
          is_sent?: boolean;
          sent_at?: string | null;
          scheduled_for?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          notification_type?: AuthorityNotificationType;
          title?: string;
          message?: string;
          card_id?: string | null;
          contact_id?: string | null;
          quest_id?: string | null;
          channel?: AuthorityNotificationChannel;
          is_read?: boolean;
          read_at?: string | null;
          is_sent?: boolean;
          sent_at?: string | null;
          scheduled_for?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_notifications_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_notifications_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "authority_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_notifications_quest_id_fkey";
            columns: ["quest_id"];
            isOneToOne: false;
            referencedRelation: "authority_quests";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_card_checklist: {
        Row: {
          id: string;
          card_id: string;
          organization_id: string;
          item_text: string;
          is_completed: boolean;
          completed_at: string | null;
          completed_by: string | null;
          is_system: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          organization_id: string;
          item_text: string;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          is_system?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          organization_id?: string;
          item_text?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          is_system?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_card_checklist_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_card_checklist_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_email_config: {
        Row: {
          id: string;
          organization_id: string;
          bcc_address: string;
          bcc_enabled: boolean;
          gmail_connected: boolean;
          gmail_access_token: string | null;
          gmail_refresh_token: string | null;
          gmail_token_expiry: string | null;
          gmail_email: string | null;
          gmail_sync_enabled: boolean;
          gmail_last_sync: string | null;
          outlook_connected: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          bcc_address: string;
          bcc_enabled?: boolean;
          gmail_connected?: boolean;
          gmail_access_token?: string | null;
          gmail_refresh_token?: string | null;
          gmail_token_expiry?: string | null;
          gmail_email?: string | null;
          gmail_sync_enabled?: boolean;
          gmail_last_sync?: string | null;
          outlook_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          bcc_address?: string;
          bcc_enabled?: boolean;
          gmail_connected?: boolean;
          gmail_access_token?: string | null;
          gmail_refresh_token?: string | null;
          gmail_token_expiry?: string | null;
          gmail_email?: string | null;
          gmail_sync_enabled?: boolean;
          gmail_last_sync?: string | null;
          outlook_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_email_config_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_email_connections: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          provider: string;
          email_address: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          is_active: boolean;
          sync_enabled: boolean;
          last_history_id: string | null;
          last_sync_at: string | null;
          connected_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          provider?: string;
          email_address: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          is_active?: boolean;
          sync_enabled?: boolean;
          last_history_id?: string | null;
          last_sync_at?: string | null;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          provider?: string;
          email_address?: string;
          access_token?: string;
          refresh_token?: string;
          token_expires_at?: string;
          is_active?: boolean;
          sync_enabled?: boolean;
          last_history_id?: string | null;
          last_sync_at?: string | null;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_email_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_email_connections_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_rounds: {
        Row: {
          id: string;
          organization_id: string;
          round_name: string;
          round_number: number;
          requirements: Json;
          linked_card_ids: Json;
          status: AuthorityRoundStatus;
          started_at: string;
          target_completion_date: string | null;
          completed_at: string | null;
          bonus_percentage: number;
          bonus_applied: boolean;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          round_name: string;
          round_number: number;
          requirements: Json;
          linked_card_ids?: Json;
          status?: AuthorityRoundStatus;
          started_at?: string;
          target_completion_date?: string | null;
          completed_at?: string | null;
          bonus_percentage?: number;
          bonus_applied?: boolean;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          round_name?: string;
          round_number?: number;
          requirements?: Json;
          linked_card_ids?: Json;
          status?: AuthorityRoundStatus;
          started_at?: string;
          target_completion_date?: string | null;
          completed_at?: string | null;
          bonus_percentage?: number;
          bonus_applied?: boolean;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_rounds_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      authority_press_page_inquiries: {
        Row: {
          id: string;
          organization_id: string;
          journalist_name: string;
          journalist_outlet: string;
          journalist_email: string;
          journalist_phone: string | null;
          topic_of_interest: string;
          preferred_format: string | null;
          deadline: string | null;
          additional_notes: string | null;
          story_angle_id: string | null;
          is_processed: boolean;
          processed_at: string | null;
          contact_id: string | null;
          card_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          journalist_name: string;
          journalist_outlet: string;
          journalist_email: string;
          journalist_phone?: string | null;
          topic_of_interest: string;
          preferred_format?: string | null;
          deadline?: string | null;
          additional_notes?: string | null;
          story_angle_id?: string | null;
          is_processed?: boolean;
          processed_at?: string | null;
          contact_id?: string | null;
          card_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          journalist_name?: string;
          journalist_outlet?: string;
          journalist_email?: string;
          journalist_phone?: string | null;
          topic_of_interest?: string;
          preferred_format?: string | null;
          deadline?: string | null;
          additional_notes?: string | null;
          story_angle_id?: string | null;
          is_processed?: boolean;
          processed_at?: string | null;
          contact_id?: string | null;
          card_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authority_press_page_inquiries_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_press_page_inquiries_story_angle_id_fkey";
            columns: ["story_angle_id"];
            isOneToOne: false;
            referencedRelation: "authority_story_angles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_press_page_inquiries_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "authority_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authority_press_page_inquiries_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "authority_pipeline_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      competitors: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          website: string | null;
          logo_url: string | null;
          linkedin_handle: string | null;
          facebook_handle: string | null;
          instagram_handle: string | null;
          twitter_handle: string | null;
          tiktok_handle: string | null;
          youtube_handle: string | null;
          is_active: boolean;
          track_mentions: boolean;
          track_performance: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          linkedin_handle?: string | null;
          facebook_handle?: string | null;
          instagram_handle?: string | null;
          twitter_handle?: string | null;
          tiktok_handle?: string | null;
          youtube_handle?: string | null;
          is_active?: boolean;
          track_mentions?: boolean;
          track_performance?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          linkedin_handle?: string | null;
          facebook_handle?: string | null;
          instagram_handle?: string | null;
          twitter_handle?: string | null;
          tiktok_handle?: string | null;
          youtube_handle?: string | null;
          is_active?: boolean;
          track_mentions?: boolean;
          track_performance?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      competitor_metrics: {
        Row: {
          id: string;
          competitor_id: string;
          metric_date: string;
          platform: string | null;
          followers: number | null;
          engagement_rate: number | null;
          posts_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competitor_id: string;
          metric_date: string;
          platform?: string | null;
          followers?: number | null;
          engagement_rate?: number | null;
          posts_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competitor_id?: string;
          metric_date?: string;
          platform?: string | null;
          followers?: number | null;
          engagement_rate?: number | null;
          posts_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hashtag_sets: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          hashtags: string[];
          platforms: string[];
          category: string;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          hashtags: string[];
          platforms?: string[];
          category?: string;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          hashtags?: string[];
          platforms?: string[];
          category?: string;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hashtag_analytics: {
        Row: {
          id: string;
          organization_id: string;
          hashtag: string;
          used_count: number;
          avg_engagement_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          hashtag: string;
          used_count?: number;
          avg_engagement_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          hashtag?: string;
          used_count?: number;
          avg_engagement_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_listening_keywords: {
        Row: {
          id: string;
          organization_id: string;
          keyword: string;
          keyword_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          keyword: string;
          keyword_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          keyword?: string;
          keyword_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_listening_mentions: {
        Row: {
          id: string;
          organization_id: string;
          keyword_id: string | null;
          platform: string;
          author_name: string | null;
          author_username: string | null;
          message: string;
          sentiment: string;
          is_read: boolean;
          is_flagged: boolean;
          notes: string | null;
          published_at: string;
          discovered_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          keyword_id?: string | null;
          platform: string;
          author_name?: string | null;
          author_username?: string | null;
          message: string;
          sentiment?: string;
          is_read?: boolean;
          is_flagged?: boolean;
          notes?: string | null;
          published_at: string;
          discovered_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          keyword_id?: string | null;
          platform?: string;
          author_name?: string | null;
          author_username?: string | null;
          message?: string;
          sentiment?: string;
          is_read?: boolean;
          is_flagged?: boolean;
          notes?: string | null;
          published_at?: string;
          discovered_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_listening_trends: {
        Row: {
          id: string;
          organization_id: string;
          trend_type: string;
          trend_value: string;
          mention_count: number;
          growth_rate: number | null;
          peak_timestamp: string | null;
          related_keywords: string[] | null;
          top_influencers: Json;
          platform_distribution: Json;
          time_period: string;
          analyzed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          trend_type: string;
          trend_value: string;
          mention_count: number;
          growth_rate?: number | null;
          peak_timestamp?: string | null;
          related_keywords?: string[] | null;
          top_influencers?: Json;
          platform_distribution?: Json;
          time_period: string;
          analyzed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          trend_type?: string;
          trend_value?: string;
          mention_count?: number;
          growth_rate?: number | null;
          peak_timestamp?: string | null;
          related_keywords?: string[] | null;
          top_influencers?: Json;
          platform_distribution?: Json;
          time_period?: string;
          analyzed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      social_interactions: {
        Row: {
          id: string;
          organization_id: string;
          connection_id: string;
          platform: string;
          interaction_type: string;
          platform_interaction_id: string;
          parent_interaction_id: string | null;
          message: string | null;
          author_platform_id: string | null;
          author_name: string | null;
          author_username: string | null;
          author_avatar_url: string | null;
          is_read: boolean;
          is_replied: boolean;
          is_flagged: boolean;
          assigned_to: string | null;
          replied_at: string | null;
          replied_by: string | null;
          interaction_timestamp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connection_id: string;
          platform: string;
          interaction_type: string;
          platform_interaction_id: string;
          parent_interaction_id?: string | null;
          message?: string | null;
          author_platform_id?: string | null;
          author_name?: string | null;
          author_username?: string | null;
          author_avatar_url?: string | null;
          is_read?: boolean;
          is_replied?: boolean;
          is_flagged?: boolean;
          assigned_to?: string | null;
          replied_at?: string | null;
          replied_by?: string | null;
          interaction_timestamp: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connection_id?: string;
          platform?: string;
          interaction_type?: string;
          platform_interaction_id?: string;
          parent_interaction_id?: string | null;
          message?: string | null;
          author_platform_id?: string | null;
          author_name?: string | null;
          author_username?: string | null;
          author_avatar_url?: string | null;
          is_read?: boolean;
          is_replied?: boolean;
          is_flagged?: boolean;
          assigned_to?: string | null;
          replied_at?: string | null;
          replied_by?: string | null;
          interaction_timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posting_schedule_analysis: {
        Row: {
          id: string;
          organization_id: string;
          platform: string;
          best_times: Json;
          confidence_score: number;
          sample_size: number;
          avg_engagement_by_hour: Json;
          avg_reach_by_hour: Json | null;
          analyzed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          platform: string;
          best_times: Json;
          confidence_score: number;
          sample_size: number;
          avg_engagement_by_hour: Json;
          avg_reach_by_hour?: Json | null;
          analyzed_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          platform?: string;
          best_times?: Json;
          confidence_score?: number;
          sample_size?: number;
          avg_engagement_by_hour?: Json;
          avg_reach_by_hour?: Json | null;
          analyzed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      industry_benchmarks: {
        Row: {
          id: string;
          industry: string;
          platform: string | null;
          metric_name: string;
          metric_value: number;
          metric_unit: string | null;
          source: string | null;
          period: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          industry: string;
          platform?: string | null;
          metric_name: string;
          metric_value: number;
          metric_unit?: string | null;
          source?: string | null;
          period?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          industry?: string;
          platform?: string | null;
          metric_name?: string;
          metric_value?: number;
          metric_unit?: string | null;
          source?: string | null;
          period?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_replies: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          content: string;
          category: string | null;
          use_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          content: string;
          category?: string | null;
          use_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          content?: string;
          category?: string | null;
          use_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ========== CRM Tables ==========

      crm_companies: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          industry: string | null;
          website: string | null;
          size: string | null;
          annual_revenue_cents: number | null;
          billing_address: Json;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          custom_fields: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          industry?: string | null;
          website?: string | null;
          size?: string | null;
          annual_revenue_cents?: number | null;
          billing_address?: Json;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          custom_fields?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          industry?: string | null;
          website?: string | null;
          size?: string | null;
          annual_revenue_cents?: number | null;
          billing_address?: Json;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          custom_fields?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      crm_contacts: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          email_normalised: string | null;
          phone: string | null;
          job_title: string | null;
          company_id: string | null;
          lifecycle_stage: string;
          source: string;
          assigned_to: string | null;
          custom_fields: Json;
          last_contacted_at: string | null;
          lifetime_value_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          email_normalised?: string | null;
          phone?: string | null;
          job_title?: string | null;
          company_id?: string | null;
          lifecycle_stage?: string;
          source?: string;
          assigned_to?: string | null;
          custom_fields?: Json;
          last_contacted_at?: string | null;
          lifetime_value_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          email_normalised?: string | null;
          phone?: string | null;
          job_title?: string | null;
          company_id?: string | null;
          lifecycle_stage?: string;
          source?: string;
          assigned_to?: string | null;
          custom_fields?: Json;
          last_contacted_at?: string | null;
          lifetime_value_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      crm_tags: {
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
        Relationships: [];
      };

      crm_contact_tags: {
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
        Relationships: [];
      };

      crm_products: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          sku: string | null;
          price_cents: number;
          currency: string;
          recurring: boolean;
          billing_interval: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          price_cents?: number;
          currency?: string;
          recurring?: boolean;
          billing_interval?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          sku?: string | null;
          price_cents?: number;
          currency?: string;
          recurring?: boolean;
          billing_interval?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      crm_deals: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          contact_id: string | null;
          company_id: string | null;
          pipeline_id: string | null;
          stage_id: string | null;
          value_cents: number;
          probability: number;
          expected_close_date: string | null;
          status: string;
          lost_reason: string | null;
          assigned_to: string | null;
          products: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          contact_id?: string | null;
          company_id?: string | null;
          pipeline_id?: string | null;
          stage_id?: string | null;
          value_cents?: number;
          probability?: number;
          expected_close_date?: string | null;
          status?: string;
          lost_reason?: string | null;
          assigned_to?: string | null;
          products?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          contact_id?: string | null;
          company_id?: string | null;
          pipeline_id?: string | null;
          stage_id?: string | null;
          value_cents?: number;
          probability?: number;
          expected_close_date?: string | null;
          status?: string;
          lost_reason?: string | null;
          assigned_to?: string | null;
          products?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      crm_invoices: {
        Row: {
          id: string;
          organization_id: string;
          invoice_number: string;
          contact_id: string | null;
          company_id: string | null;
          deal_id: string | null;
          status: string;
          subtotal_cents: number;
          tax_rate: number;
          tax_cents: number;
          total_cents: number;
          currency: string;
          due_date: string | null;
          paid_at: string | null;
          billing_from: Json;
          billing_to: Json;
          share_token: string | null;
          notes: string | null;
          footer_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          invoice_number: string;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          status?: string;
          subtotal_cents?: number;
          tax_rate?: number;
          tax_cents?: number;
          total_cents?: number;
          currency?: string;
          due_date?: string | null;
          paid_at?: string | null;
          billing_from?: Json;
          billing_to?: Json;
          share_token?: string | null;
          notes?: string | null;
          footer_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          invoice_number?: string;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          status?: string;
          subtotal_cents?: number;
          tax_rate?: number;
          tax_cents?: number;
          total_cents?: number;
          currency?: string;
          due_date?: string | null;
          paid_at?: string | null;
          billing_from?: Json;
          billing_to?: Json;
          share_token?: string | null;
          notes?: string | null;
          footer_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      crm_invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          product_id: string | null;
          description: string;
          quantity: number;
          unit_price_cents: number;
          total_cents: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          product_id?: string | null;
          description: string;
          quantity?: number;
          unit_price_cents?: number;
          total_cents?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          product_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price_cents?: number;
          total_cents?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "crm_invoices";
            referencedColumns: ["id"];
          },
        ];
      };

      crm_activity: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string | null;
          company_id: string | null;
          deal_id: string | null;
          invoice_id: string | null;
          activity_type: string;
          title: string;
          description: string | null;
          metadata: Json;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          invoice_id?: string | null;
          activity_type: string;
          title: string;
          description?: string | null;
          metadata?: Json;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          invoice_id?: string | null;
          activity_type?: string;
          title?: string;
          description?: string | null;
          metadata?: Json;
          performed_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ===== Video Call & AI Sales Co-Pilot Tables =====

      offers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          tier: string | null;
          price_display: string | null;
          price_value: number | null;
          currency: string;
          billing_frequency: OfferBillingFrequency | null;
          deliverables: Json;
          ideal_client_profile: string | null;
          value_propositions: Json;
          common_objections: Json;
          roi_framing: string | null;
          comparison_points: Json;
          is_active: boolean;
          sort_order: number;
          source: string;
          service_tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          tier?: string | null;
          price_display?: string | null;
          price_value?: number | null;
          currency?: string;
          billing_frequency?: OfferBillingFrequency | null;
          deliverables?: Json;
          ideal_client_profile?: string | null;
          value_propositions?: Json;
          common_objections?: Json;
          roi_framing?: string | null;
          comparison_points?: Json;
          is_active?: boolean;
          sort_order?: number;
          source?: string;
          service_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          tier?: string | null;
          price_display?: string | null;
          price_value?: number | null;
          currency?: string;
          billing_frequency?: OfferBillingFrequency | null;
          deliverables?: Json;
          ideal_client_profile?: string | null;
          value_propositions?: Json;
          common_objections?: Json;
          roi_framing?: string | null;
          comparison_points?: Json;
          is_active?: boolean;
          sort_order?: number;
          source?: string;
          service_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      call_templates: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          description: string | null;
          call_type: CallType;
          is_system: boolean;
          is_active: boolean;
          phases: Json;
          opening_script: string | null;
          closing_script: string | null;
          objection_bank: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          name: string;
          description?: string | null;
          call_type?: CallType;
          is_system?: boolean;
          is_active?: boolean;
          phases?: Json;
          opening_script?: string | null;
          closing_script?: string | null;
          objection_bank?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          name?: string;
          description?: string | null;
          call_type?: CallType;
          is_system?: boolean;
          is_active?: boolean;
          phases?: Json;
          opening_script?: string | null;
          closing_script?: string | null;
          objection_bank?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      calls: {
        Row: {
          id: string;
          organization_id: string;
          host_user_id: string;
          title: string;
          call_type: CallType;
          call_status: CallStatus;
          template_id: string | null;
          call_objective: string | null;
          scheduled_start: string | null;
          scheduled_duration_min: number;
          actual_start: string | null;
          actual_end: string | null;
          recording_url: string | null;
          recording_consent: boolean;
          room_code: string;
          booking_id: string | null;
          crm_contact_id: string | null;
          crm_deal_id: string | null;
          call_number: number;
          previous_call_id: string | null;
          google_event_id: string | null;
          meet_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          host_user_id: string;
          title: string;
          call_type?: CallType;
          call_status?: CallStatus;
          template_id?: string | null;
          call_objective?: string | null;
          scheduled_start?: string | null;
          scheduled_duration_min?: number;
          actual_start?: string | null;
          actual_end?: string | null;
          recording_url?: string | null;
          recording_consent?: boolean;
          room_code: string;
          booking_id?: string | null;
          crm_contact_id?: string | null;
          crm_deal_id?: string | null;
          call_number?: number;
          previous_call_id?: string | null;
          google_event_id?: string | null;
          meet_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          host_user_id?: string;
          title?: string;
          call_type?: CallType;
          call_status?: CallStatus;
          template_id?: string | null;
          call_objective?: string | null;
          scheduled_start?: string | null;
          scheduled_duration_min?: number;
          actual_start?: string | null;
          actual_end?: string | null;
          recording_url?: string | null;
          recording_consent?: boolean;
          room_code?: string;
          booking_id?: string | null;
          crm_contact_id?: string | null;
          crm_deal_id?: string | null;
          call_number?: number;
          previous_call_id?: string | null;
          google_event_id?: string | null;
          meet_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calls_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calls_host_user_id_fkey";
            columns: ["host_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calls_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "call_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calls_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "call_bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calls_crm_contact_id_fkey";
            columns: ["crm_contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calls_crm_deal_id_fkey";
            columns: ["crm_deal_id"];
            isOneToOne: false;
            referencedRelation: "crm_deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calls_previous_call_id_fkey";
            columns: ["previous_call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          }
        ];
      };

      call_participants: {
        Row: {
          id: string;
          call_id: string;
          user_id: string | null;
          guest_name: string | null;
          guest_email: string | null;
          role: ParticipantRole;
          status: ParticipantStatus;
          joined_at: string | null;
          left_at: string | null;
          consent_given: boolean;
          invite_method: InviteMethod;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          user_id?: string | null;
          guest_name?: string | null;
          guest_email?: string | null;
          role?: ParticipantRole;
          status?: ParticipantStatus;
          joined_at?: string | null;
          left_at?: string | null;
          consent_given?: boolean;
          invite_method?: InviteMethod;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          user_id?: string | null;
          guest_name?: string | null;
          guest_email?: string | null;
          role?: ParticipantRole;
          status?: ParticipantStatus;
          joined_at?: string | null;
          left_at?: string | null;
          consent_given?: boolean;
          invite_method?: InviteMethod;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_participants_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      call_transcripts: {
        Row: {
          id: string;
          call_id: string;
          participant_id: string;
          speaker_label: string;
          content: string;
          timestamp_start: number;
          timestamp_end: number | null;
          is_flagged: boolean;
          flag_note: string | null;
          confidence: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          participant_id: string;
          speaker_label: string;
          content: string;
          timestamp_start?: number;
          timestamp_end?: number | null;
          is_flagged?: boolean;
          flag_note?: string | null;
          confidence?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          participant_id?: string;
          speaker_label?: string;
          content?: string;
          timestamp_start?: number;
          timestamp_end?: number | null;
          is_flagged?: boolean;
          flag_note?: string | null;
          confidence?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_transcripts_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_transcripts_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "call_participants";
            referencedColumns: ["id"];
          }
        ];
      };

      call_ai_guidance: {
        Row: {
          id: string;
          call_id: string;
          guidance_type: GuidanceType;
          content: string;
          framework_phase: string | null;
          framework_step: string | null;
          triggered_by_transcript_id: string | null;
          was_used: boolean;
          was_dismissed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          guidance_type?: GuidanceType;
          content: string;
          framework_phase?: string | null;
          framework_step?: string | null;
          triggered_by_transcript_id?: string | null;
          was_used?: boolean;
          was_dismissed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          guidance_type?: GuidanceType;
          content?: string;
          framework_phase?: string | null;
          framework_step?: string | null;
          triggered_by_transcript_id?: string | null;
          was_used?: boolean;
          was_dismissed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_ai_guidance_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_ai_guidance_triggered_by_transcript_id_fkey";
            columns: ["triggered_by_transcript_id"];
            isOneToOne: false;
            referencedRelation: "call_transcripts";
            referencedColumns: ["id"];
          }
        ];
      };

      call_summaries: {
        Row: {
          id: string;
          call_id: string;
          summary_text: string | null;
          key_points: Json;
          decisions_made: Json;
          objections_raised: Json;
          sentiment_arc: Json;
          next_steps: Json;
          deal_stage_recommendation: string | null;
          call_score: Json;
          brand_engine_insights: Json;
          follow_up_email_draft: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          summary_text?: string | null;
          key_points?: Json;
          decisions_made?: Json;
          objections_raised?: Json;
          sentiment_arc?: Json;
          next_steps?: Json;
          deal_stage_recommendation?: string | null;
          call_score?: Json;
          brand_engine_insights?: Json;
          follow_up_email_draft?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          summary_text?: string | null;
          key_points?: Json;
          decisions_made?: Json;
          objections_raised?: Json;
          sentiment_arc?: Json;
          next_steps?: Json;
          deal_stage_recommendation?: string | null;
          call_score?: Json;
          brand_engine_insights?: Json;
          follow_up_email_draft?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_summaries_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: true;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          }
        ];
      };

      call_action_items: {
        Row: {
          id: string;
          call_id: string;
          call_summary_id: string | null;
          assigned_to: string | null;
          description: string;
          due_date: string | null;
          status: ActionItemStatus;
          crm_task_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          call_summary_id?: string | null;
          assigned_to?: string | null;
          description: string;
          due_date?: string | null;
          status?: ActionItemStatus;
          crm_task_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          call_summary_id?: string | null;
          assigned_to?: string | null;
          description?: string;
          due_date?: string | null;
          status?: ActionItemStatus;
          crm_task_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_action_items_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_action_items_call_summary_id_fkey";
            columns: ["call_summary_id"];
            isOneToOne: false;
            referencedRelation: "call_summaries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_action_items_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      booking_pages: {
        Row: {
          id: string;
          organization_id: string;
          slug: string;
          title: string;
          description: string | null;
          available_durations: Json;
          available_hours: Json;
          buffer_minutes: number;
          max_advance_days: number;
          intake_questions: Json;
          branding: Json;
          default_call_type: CallType;
          is_active: boolean;
          calendar_integration: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          slug: string;
          title: string;
          description?: string | null;
          available_durations?: Json;
          available_hours?: Json;
          buffer_minutes?: number;
          max_advance_days?: number;
          intake_questions?: Json;
          branding?: Json;
          default_call_type?: CallType;
          is_active?: boolean;
          calendar_integration?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          available_durations?: Json;
          available_hours?: Json;
          buffer_minutes?: number;
          max_advance_days?: number;
          intake_questions?: Json;
          branding?: Json;
          default_call_type?: CallType;
          is_active?: boolean;
          calendar_integration?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_pages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      call_bookings: {
        Row: {
          id: string;
          organization_id: string;
          booking_page_id: string;
          guest_name: string;
          guest_email: string;
          guest_company: string | null;
          guest_notes: string | null;
          scheduled_time: string;
          duration_min: number;
          status: BookingStatus;
          crm_contact_id: string | null;
          call_id: string | null;
          confirmation_sent: boolean;
          reminder_sent: boolean;
          intake_responses: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          booking_page_id: string;
          guest_name: string;
          guest_email: string;
          guest_company?: string | null;
          guest_notes?: string | null;
          scheduled_time: string;
          duration_min?: number;
          status?: BookingStatus;
          crm_contact_id?: string | null;
          call_id?: string | null;
          confirmation_sent?: boolean;
          reminder_sent?: boolean;
          intake_responses?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          booking_page_id?: string;
          guest_name?: string;
          guest_email?: string;
          guest_company?: string | null;
          guest_notes?: string | null;
          scheduled_time?: string;
          duration_min?: number;
          status?: BookingStatus;
          crm_contact_id?: string | null;
          call_id?: string | null;
          confirmation_sent?: boolean;
          reminder_sent?: boolean;
          intake_responses?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_bookings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_bookings_booking_page_id_fkey";
            columns: ["booking_page_id"];
            isOneToOne: false;
            referencedRelation: "booking_pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_bookings_crm_contact_id_fkey";
            columns: ["crm_contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_bookings_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          }
        ];
      };

      call_brand_insights: {
        Row: {
          id: string;
          call_id: string;
          organization_id: string;
          insight_type: InsightType;
          content: string;
          source_transcript_id: string | null;
          brand_engine_field: string | null;
          status: InsightStatus;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          organization_id: string;
          insight_type: InsightType;
          content: string;
          source_transcript_id?: string | null;
          brand_engine_field?: string | null;
          status?: InsightStatus;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          organization_id?: string;
          insight_type?: InsightType;
          content?: string;
          source_transcript_id?: string | null;
          brand_engine_field?: string | null;
          status?: InsightStatus;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_brand_insights_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_brand_insights_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_brand_insights_source_transcript_id_fkey";
            columns: ["source_transcript_id"];
            isOneToOne: false;
            referencedRelation: "call_transcripts";
            referencedColumns: ["id"];
          }
        ];
      };
      pipeline_forms: {
        Row: {
          id: string;
          organization_id: string;
          pipeline_id: string;
          stage_id: string;
          name: string;
          description: string | null;
          submit_button_text: string;
          success_message: string;
          is_published: boolean;
          slug: string;
          settings: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          pipeline_id: string;
          stage_id: string;
          name: string;
          description?: string | null;
          submit_button_text?: string;
          success_message?: string;
          is_published?: boolean;
          slug: string;
          settings?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          pipeline_id?: string;
          stage_id?: string;
          name?: string;
          description?: string | null;
          submit_button_text?: string;
          success_message?: string;
          is_published?: boolean;
          slug?: string;
          settings?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_forms_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_forms_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_forms_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id"];
          }
        ];
      };
      pipeline_form_fields: {
        Row: {
          id: string;
          form_id: string;
          label: string;
          field_type: string;
          placeholder: string | null;
          is_required: boolean;
          options: Json | null;
          mapping: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          label: string;
          field_type: string;
          placeholder?: string | null;
          is_required?: boolean;
          options?: Json | null;
          mapping: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          label?: string;
          field_type?: string;
          placeholder?: string | null;
          is_required?: boolean;
          options?: Json | null;
          mapping?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_form_fields_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_forms";
            referencedColumns: ["id"];
          }
        ];
      };
      // ============ Brand Audit Tables ============
      brand_audits: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string | null;
          call_id: string | null;
          created_by: string;
          status: BrandAuditStatus;
          source: BrandAuditSource;
          overall_score: number | null;
          overall_rating: BrandAuditRating | null;
          executive_summary: string | null;
          priority_roadmap: Json;
          sections_completed: number;
          total_sections: number;
          previous_audit_id: string | null;
          comparison_data: Json;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id?: string | null;
          call_id?: string | null;
          created_by: string;
          status?: BrandAuditStatus;
          source?: BrandAuditSource;
          overall_score?: number | null;
          overall_rating?: BrandAuditRating | null;
          executive_summary?: string | null;
          priority_roadmap?: Json;
          sections_completed?: number;
          total_sections?: number;
          previous_audit_id?: string | null;
          comparison_data?: Json;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          contact_id?: string | null;
          call_id?: string | null;
          created_by?: string;
          status?: BrandAuditStatus;
          source?: BrandAuditSource;
          overall_score?: number | null;
          overall_rating?: BrandAuditRating | null;
          executive_summary?: string | null;
          priority_roadmap?: Json;
          sections_completed?: number;
          total_sections?: number;
          previous_audit_id?: string | null;
          comparison_data?: Json;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_audits_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_audits_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_audits_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_audits_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      brand_audit_sections: {
        Row: {
          id: string;
          audit_id: string;
          section_key: BrandAuditSectionKey;
          data: Json;
          is_complete: boolean;
          data_source: BrandAuditDataSource;
          extraction_confidence: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          section_key: BrandAuditSectionKey;
          data?: Json;
          is_complete?: boolean;
          data_source?: BrandAuditDataSource;
          extraction_confidence?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          audit_id?: string;
          section_key?: BrandAuditSectionKey;
          data?: Json;
          is_complete?: boolean;
          data_source?: BrandAuditDataSource;
          extraction_confidence?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_audit_sections_audit_id_fkey";
            columns: ["audit_id"];
            isOneToOne: false;
            referencedRelation: "brand_audits";
            referencedColumns: ["id"];
          }
        ];
      };

      brand_audit_scores: {
        Row: {
          id: string;
          audit_id: string;
          category: BrandAuditCategory;
          score: number;
          rating: BrandAuditRating;
          weight: number;
          analysis: string | null;
          key_finding: string | null;
          actionable_insight: string | null;
          evidence: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          category: BrandAuditCategory;
          score?: number;
          rating?: BrandAuditRating;
          weight?: number;
          analysis?: string | null;
          key_finding?: string | null;
          actionable_insight?: string | null;
          evidence?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          audit_id?: string;
          category?: BrandAuditCategory;
          score?: number;
          rating?: BrandAuditRating;
          weight?: number;
          analysis?: string | null;
          key_finding?: string | null;
          actionable_insight?: string | null;
          evidence?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_audit_scores_audit_id_fkey";
            columns: ["audit_id"];
            isOneToOne: false;
            referencedRelation: "brand_audits";
            referencedColumns: ["id"];
          }
        ];
      };

      brand_audit_reports: {
        Row: {
          id: string;
          audit_id: string;
          organization_id: string;
          version: number;
          storage_path: string;
          file_size_bytes: number | null;
          share_token: string | null;
          share_expires_at: string | null;
          delivered_at: string | null;
          delivered_via: string | null;
          delivered_to: string | null;
          view_count: number;
          last_viewed_at: string | null;
          brand_snapshot: Json;
          include_pricing: boolean;
          include_comparison: boolean;
          about_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          organization_id: string;
          version?: number;
          storage_path: string;
          file_size_bytes?: number | null;
          share_token?: string | null;
          share_expires_at?: string | null;
          delivered_at?: string | null;
          delivered_via?: string | null;
          delivered_to?: string | null;
          view_count?: number;
          last_viewed_at?: string | null;
          brand_snapshot?: Json;
          include_pricing?: boolean;
          include_comparison?: boolean;
          about_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          audit_id?: string;
          organization_id?: string;
          version?: number;
          storage_path?: string;
          file_size_bytes?: number | null;
          share_token?: string | null;
          share_expires_at?: string | null;
          delivered_at?: string | null;
          delivered_via?: string | null;
          delivered_to?: string | null;
          view_count?: number;
          last_viewed_at?: string | null;
          brand_snapshot?: Json;
          include_pricing?: boolean;
          include_comparison?: boolean;
          about_text?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_audit_reports_audit_id_fkey";
            columns: ["audit_id"];
            isOneToOne: false;
            referencedRelation: "brand_audits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_audit_reports_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      brand_audit_offer_matches: {
        Row: {
          id: string;
          audit_id: string;
          audit_category: BrandAuditCategory;
          offer_id: string | null;
          priority: number;
          relevance_description: string | null;
          is_user_override: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          audit_category: BrandAuditCategory;
          offer_id?: string | null;
          priority?: number;
          relevance_description?: string | null;
          is_user_override?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          audit_id?: string;
          audit_category?: BrandAuditCategory;
          offer_id?: string | null;
          priority?: number;
          relevance_description?: string | null;
          is_user_override?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_audit_offer_matches_audit_id_fkey";
            columns: ["audit_id"];
            isOneToOne: false;
            referencedRelation: "brand_audits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_audit_offer_matches_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          }
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
      seed_authority_stages: {
        Args: {
          p_org_id: string;
        };
        Returns: void;
      };
      seed_authority_quests: {
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
