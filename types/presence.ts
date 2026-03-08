// =====================================================
// PRESENCE ENGINE — Type Definitions
// =====================================================

export type PlatformKey =
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'google_my_business'
  | 'tiktok'
  | 'youtube'
  | 'twitter_x'
  | 'pinterest';

export type PlatformStatus = 'active' | 'inactive' | 'skipped';

export type PresencePhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'locked' | 'skipped';

export type PresenceEngineStatus = 'not_started' | 'in_progress' | 'completed';

export type PlatformGoal =
  | 'lead_generation'
  | 'brand_awareness'
  | 'community'
  | 'sales'
  | 'seo'
  | 'thought_leadership';

export interface PlatformConfig {
  key: PlatformKey;
  name: string;
  icon: string;
  description: string;
  primaryUse: string;
  fields: PlatformField[];
  phaseNumber: string; // Which phase handles this platform
}

export interface PlatformField {
  key: string;
  label: string;
  maxChars?: number;
  description: string;
  required: boolean;
}

export interface PresenceOutput {
  id: string;
  organization_id: string;
  phase_id: string;
  output_key: string;
  output_value: unknown;
  version: number;
  is_locked: boolean;
  generated_from_brand: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsistencyScore {
  overall: number;
  dimensions: {
    headline_bio_alignment: number;
    cta_consistency: number;
    category_claim: number;
    visual_identity: number;
    tone_match: number;
  };
  platformScores: PlatformScore[];
}

export interface PlatformScore {
  platformKey: PlatformKey;
  score: number;
  dimensions: {
    completeness: number;
    brand_alignment: number;
    icp_relevance: number;
    cta_clarity: number;
    voice_consistency: number;
  };
  gaps: ConsistencyFlag[];
}

export interface ConsistencyFlag {
  severity: 'critical' | 'warning' | 'info';
  field: string;
  message: string;
  recommendation: string;
}

export interface PresencePhaseTemplate {
  number: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  platformKey: PlatformKey | null; // null = not platform-specific
  isConditional: boolean; // true = only runs if platform is active
  questions: string[];
  outputVariables: string[];
  questionOutputMap: Record<string, string[]>;
  instructions: string;
}

export interface PresenceAgent {
  id: string;
  name: string;
  title: string;
  expertise: string;
  avatarInitials: string;
  avatarColor: string;
  persona: {
    openingStyle: string;
    communicationTraits: string[];
    signaturePhrases: string[];
    methodology: string;
    refinementStyle: string;
    pushbackStyle: string;
    closingStyle: string;
  };
}

export interface PresenceAgentMapping {
  phaseNumber: string;
  primaryAgent: string;
  questionAgentMap?: Record<string, string>;
}

export interface PresencePlatformActivation {
  platformKey: PlatformKey;
  isActive: boolean;
  primaryGoal: PlatformGoal | null;
  priorityOrder: number;
  existingProfileUrl: string | null;
}

export interface PresenceScreenshot {
  id: string;
  organization_id: string;
  platform_key: PlatformKey;
  screenshot_url: string;
  file_name: string | null;
  file_size: number | null;
  uploaded_by: string;
  audit_result: unknown;
  created_at: string;
}

export interface QuickWin {
  platform: PlatformKey;
  action: string;
  impact: 'high' | 'medium' | 'low';
  timeEstimate: string;
}

export interface ActivationPlanItem {
  day: number;
  platform: PlatformKey;
  action: string;
  details: string;
  completed: boolean;
}
