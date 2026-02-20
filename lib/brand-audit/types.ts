/**
 * Brand Audit — shared types and constants.
 */

import type { Json, BrandAuditSectionKey, BrandAuditCategory, BrandAuditRating } from '@/types/database';

// ============ Section JSONB data shapes ============

export interface CompanyOverviewData {
  business_name?: string;
  industry?: string;
  years_in_business?: number;
  business_model?: string;
  target_market?: string;
  employee_count?: string;
  annual_revenue_range?: string;
  website_url?: string;
  social_media_links?: Record<string, string>;
}

export interface BrandFoundationData {
  mission_statement?: string;
  vision_statement?: string;
  core_values?: string[];
  brand_personality?: string[];
  brand_promise?: string;
  brand_archetype?: string;
  unique_value_proposition?: string;
}

export interface VisualIdentityData {
  has_professional_logo?: boolean;
  logo_quality_notes?: string;
  primary_colors?: string[];
  secondary_colors?: string[];
  typography_notes?: string;
  brand_guidelines_exist?: boolean;
  consistency_rating?: number; // 1-5
  visual_identity_notes?: string;
}

export interface MessagingData {
  tagline?: string;
  elevator_pitch?: string;
  key_messages?: string[];
  tone_of_voice?: string;
  brand_story?: string;
  messaging_consistency_notes?: string;
}

export interface DigitalPresenceData {
  website_quality?: number; // 1-5
  website_last_updated?: string;
  seo_rating?: number; // 1-5
  social_platforms?: string[];
  social_engagement_notes?: string;
  content_strategy_exists?: boolean;
  paid_advertising?: boolean;
  advertising_notes?: string;
  email_marketing?: boolean;
}

export interface CustomerExperienceData {
  customer_journey_defined?: boolean;
  customer_journey_notes?: string;
  feedback_collection_method?: string;
  nps_score?: number;
  review_rating?: number;
  review_count?: number;
  complaint_handling_process?: string;
  customer_retention_notes?: string;
}

export interface CompetitiveLandscapeData {
  competitors?: Array<{
    name: string;
    website?: string;
    strengths?: string;
    weaknesses?: string;
  }>;
  competitive_advantages?: string[];
  market_position?: string;
  industry_trends?: string;
  threats?: string;
  opportunities?: string;
}

export interface GoalsChallengesData {
  short_term_goals?: string[];
  long_term_goals?: string[];
  biggest_challenge?: string;
  budget_range?: string;
  timeline?: string;
  additional_notes?: string;
}

// Map section keys to data types
export type SectionDataMap = {
  company_overview: CompanyOverviewData;
  brand_foundation: BrandFoundationData;
  visual_identity: VisualIdentityData;
  messaging: MessagingData;
  digital_presence: DigitalPresenceData;
  customer_experience: CustomerExperienceData;
  competitive_landscape: CompetitiveLandscapeData;
  goals_challenges: GoalsChallengesData;
};

// ============ Composite types ============

export interface BrandAuditWithRelations {
  id: string;
  organization_id: string;
  contact_id: string | null;
  call_id: string | null;
  created_by: string;
  status: string;
  source: string;
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
  // Relations
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    company_id: string | null;
    crm_companies?: { id: string; name: string } | null;
  } | null;
  creator?: { id: string; full_name: string; email: string } | null;
  sections?: Array<{
    id: string;
    section_key: BrandAuditSectionKey;
    data: Json;
    is_complete: boolean;
    data_source: string;
    extraction_confidence: number | null;
  }>;
  scores?: Array<{
    id: string;
    category: BrandAuditCategory;
    score: number;
    rating: BrandAuditRating;
    analysis: string | null;
    key_finding: string | null;
    actionable_insight: string | null;
  }>;
}

// ============ Constants ============

export const SECTION_ORDER: BrandAuditSectionKey[] = [
  'company_overview',
  'brand_foundation',
  'visual_identity',
  'messaging',
  'digital_presence',
  'customer_experience',
  'competitive_landscape',
  'goals_challenges',
];

export const SECTION_LABELS: Record<BrandAuditSectionKey, string> = {
  company_overview: 'Company Overview',
  brand_foundation: 'Brand Foundation',
  visual_identity: 'Visual Identity',
  messaging: 'Messaging',
  digital_presence: 'Digital Presence',
  customer_experience: 'Customer Experience',
  competitive_landscape: 'Competitive Landscape',
  goals_challenges: 'Goals & Challenges',
};

export const CATEGORY_ORDER: BrandAuditCategory[] = [
  'brand_foundation',
  'message_consistency',
  'visual_identity',
  'digital_presence',
  'customer_perception',
  'competitive_differentiation',
];

export const CATEGORY_LABELS: Record<BrandAuditCategory, string> = {
  brand_foundation: 'Brand Foundation',
  message_consistency: 'Message Consistency',
  visual_identity: 'Visual Identity',
  digital_presence: 'Digital Presence',
  customer_perception: 'Customer Perception',
  competitive_differentiation: 'Competitive Differentiation',
};

export const CATEGORY_WEIGHTS: Record<BrandAuditCategory, number> = {
  brand_foundation: 0.20,
  message_consistency: 0.18,
  visual_identity: 0.15,
  digital_presence: 0.17,
  customer_perception: 0.15,
  competitive_differentiation: 0.15,
};

/** Maps scoring categories to the sections they draw data from */
export const CATEGORY_SOURCE_SECTIONS: Record<BrandAuditCategory, BrandAuditSectionKey[]> = {
  brand_foundation: ['brand_foundation', 'company_overview'],
  message_consistency: ['messaging', 'brand_foundation'],
  visual_identity: ['visual_identity'],
  digital_presence: ['digital_presence'],
  customer_perception: ['customer_experience'],
  competitive_differentiation: ['competitive_landscape', 'brand_foundation'],
};

/** Maps scoring categories to service tags for offer matching */
export const TAG_CATEGORY_MAP: Record<BrandAuditCategory, string[]> = {
  brand_foundation: ['branding', 'strategy', 'consulting'],
  message_consistency: ['messaging', 'content', 'consulting'],
  visual_identity: ['design', 'branding', 'website'],
  digital_presence: ['website', 'seo', 'social', 'advertising'],
  customer_perception: ['consulting', 'strategy', 'content'],
  competitive_differentiation: ['strategy', 'branding', 'consulting'],
};

export const SERVICE_TAG_OPTIONS = [
  'branding', 'messaging', 'content', 'digital', 'design',
  'strategy', 'website', 'social', 'seo', 'advertising', 'consulting',
] as const;

/** Credit costs per action */
export const AUDIT_CREDIT_COSTS = {
  section_refine: 5,
  website_analysis: 10,
  post_call_extraction: 15,
  scoring: 30,
  roadmap: 10,
  pdf_generation: 15,
} as const;
