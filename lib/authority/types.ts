import type {
  AuthorityCategory,
  AuthorityPriority,
  AuthorityStageType,
  AuthorityReachTier,
  AuthorityEngagementType,
  AuthorityPaymentStatus,
  AuthorityPaymentTerms,
  AuthorityContactWarmth,
  AuthorityContactSource,
  AuthorityCorrespondenceType,
  AuthorityCorrespondenceDirection,
  AuthorityAssetType,
  AuthorityPressReleaseStatus,
  AuthorityQuestStatus,
  AuthorityRoundStatus,
  AuthorityCalendarEventType,
  AuthorityNotificationType,
  AuthorityNotificationChannel,
  AuthorityDeclineReason,
  AuthorityConfirmedFormat,
  Tables,
} from '@/types/database';

// Row types
export type AuthorityStage = Tables<'authority_pipeline_stages'>;
export type AuthorityCard = Tables<'authority_pipeline_cards'>;
export type AuthorityCommercial = Tables<'authority_commercial'>;
export type AuthorityContact = Tables<'authority_contacts'>;
export type AuthorityCorrespondence = Tables<'authority_correspondence'>;
export type AuthorityAsset = Tables<'authority_assets'>;
export type AuthorityPressRelease = Tables<'authority_press_releases'>;
export type AuthorityStoryAngle = Tables<'authority_story_angles'>;
export type AuthorityPressKit = Tables<'authority_press_kit'>;
export type AuthorityQuest = Tables<'authority_quests'>;
export type AuthorityScore = Tables<'authority_scores'>;
export type AuthorityCalendarEvent = Tables<'authority_calendar_events'>;
export type AuthorityNotification = Tables<'authority_notifications'>;
export type AuthorityChecklist = Tables<'authority_card_checklist'>;
export type AuthorityEmailConfig = Tables<'authority_email_config'>;
export type AuthorityRound = Tables<'authority_rounds'>;
export type AuthorityInquiry = Tables<'authority_press_page_inquiries'>;

// Card with relations (joined data from API)
export interface AuthorityCardWithRelations extends AuthorityCard {
  stage?: AuthorityStage;
  contact?: AuthorityContact | null;
  story_angle?: AuthorityStoryAngle | null;
  commercial?: AuthorityCommercial | null;
  checklist_count?: number;
  checklist_completed?: number;
  correspondence_count?: number;
}

// Quest requirement shape (stored as JSONB)
export interface QuestRequirement {
  type: string;
  target: number;
  current: number;
  completed: boolean;
  label: string;
}

// Round requirement shape (stored as JSONB)
export interface RoundRequirement {
  category: AuthorityCategory;
  count: number;
  completed_count: number;
}

// Press kit fact sheet shape (stored as JSONB)
export interface FactSheet {
  founding_date?: string;
  milestones?: string[];
  team_size?: string;
  markets?: string;
  awards?: string[];
  key_stats?: string[];
}

// Press release quote shape (stored as JSONB)
export interface PressReleaseQuote {
  quote: string;
  attribution: string;
  title?: string;
}

// Asset key quote shape (stored as JSONB)
export interface AssetKeyQuote {
  quote: string;
  attribution: string;
}

// Re-export type aliases for convenience
export type {
  AuthorityCategory,
  AuthorityPriority,
  AuthorityStageType,
  AuthorityReachTier,
  AuthorityEngagementType,
  AuthorityPaymentStatus,
  AuthorityPaymentTerms,
  AuthorityContactWarmth,
  AuthorityContactSource,
  AuthorityCorrespondenceType,
  AuthorityCorrespondenceDirection,
  AuthorityAssetType,
  AuthorityPressReleaseStatus,
  AuthorityQuestStatus,
  AuthorityRoundStatus,
  AuthorityCalendarEventType,
  AuthorityNotificationType,
  AuthorityNotificationChannel,
  AuthorityDeclineReason,
  AuthorityConfirmedFormat,
};
