import type { AuthorityCategory, AuthorityReachTier } from './types';

// ============================================================================
// Default Pipeline Stages
// ============================================================================
export const DEFAULT_STAGES = [
  { slug: 'inbound',       name: 'Inbound',       stage_order: 1,  stage_type: 'active' as const,      color: '#6366f1' },
  { slug: 'prospect',      name: 'Prospect',      stage_order: 2,  stage_type: 'active' as const,      color: '#8b5cf6' },
  { slug: 'pitched',       name: 'Pitched',       stage_order: 3,  stage_type: 'active' as const,      color: '#3b82f6' },
  { slug: 'in_discussion', name: 'In Discussion', stage_order: 4,  stage_type: 'active' as const,      color: '#0ea5e9' },
  { slug: 'agreed',        name: 'Agreed',        stage_order: 5,  stage_type: 'active' as const,      color: '#14b8a6' },
  { slug: 'content_prep',  name: 'Content Prep',  stage_order: 6,  stage_type: 'active' as const,      color: '#10b981' },
  { slug: 'submitted',     name: 'Submitted',     stage_order: 7,  stage_type: 'active' as const,      color: '#22c55e' },
  { slug: 'published',     name: 'Published',     stage_order: 8,  stage_type: 'active' as const,      color: '#84cc16' },
  { slug: 'amplified',     name: 'Amplified',     stage_order: 9,  stage_type: 'closed_won' as const,  color: '#eab308' },
  { slug: 'archived',      name: 'Archived',      stage_order: 10, stage_type: 'closed_won' as const,  color: '#6b7280' },
  { slug: 'declined',      name: 'Declined',      stage_order: 11, stage_type: 'closed_lost' as const, color: '#ef4444' },
  { slug: 'no_response',   name: 'No Response',   stage_order: 12, stage_type: 'closed_lost' as const, color: '#f97316' },
  { slug: 'on_hold',       name: 'On Hold',       stage_order: 13, stage_type: 'active' as const,      color: '#a855f7' },
] as const;

// Stages that are "closed" (collapsible in the kanban UI)
export const CLOSED_STAGE_SLUGS = ['declined', 'no_response', 'archived'] as const;

// ============================================================================
// Category Configuration
// ============================================================================
export const CATEGORY_CONFIG: Record<AuthorityCategory, { label: string; icon: string; basePoints: number }> = {
  press_release:       { label: 'Press Release',       icon: 'DocumentTextIcon',  basePoints: 10 },
  media_placement:     { label: 'Media Placement',     icon: 'NewspaperIcon',     basePoints: 15 },
  magazine_feature:    { label: 'Magazine Feature',    icon: 'BookOpenIcon',      basePoints: 40 },
  podcast_appearance:  { label: 'Podcast Appearance',  icon: 'MicrophoneIcon',    basePoints: 15 },
  live_event:          { label: 'Live Event',          icon: 'CalendarDaysIcon',  basePoints: 30 },
  tv_video:            { label: 'TV / Video',          icon: 'VideoCameraIcon',   basePoints: 35 },
  award_recognition:   { label: 'Award / Recognition', icon: 'TrophyIcon',        basePoints: 25 },
  thought_leadership:  { label: 'Thought Leadership',  icon: 'LightBulbIcon',     basePoints: 10 },
};

// ============================================================================
// Scoring Tables
// ============================================================================
export const REACH_MULTIPLIERS: Record<AuthorityReachTier, number> = {
  local:         1.0,
  regional:      1.5,
  national:      2.5,
  international: 3.5,
};

export const ENGAGEMENT_MULTIPLIERS: Record<string, number> = {
  earned:    1.0,
  paid:      0.65,
  contra:    0.65,
  sponsored: 0.65,
};

export const BONUS_PERCENTAGES = {
  amplification: 0.25,
  round_completion: 0.15,
  consistency: 0.10,
} as const;

// ============================================================================
// Decline Reasons
// ============================================================================
export const DECLINE_REASONS = [
  { value: 'not_relevant',      label: 'Not Relevant' },
  { value: 'bad_timing',        label: 'Bad Timing' },
  { value: 'wrong_contact',     label: 'Wrong Contact' },
  { value: 'full_calendar',     label: 'Full Editorial Calendar' },
  { value: 'budget_constraints', label: 'Budget Constraints' },
  { value: 'other',             label: 'Other' },
] as const;

// ============================================================================
// Priority Config
// ============================================================================
export const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#6b7280' },
  medium: { label: 'Medium', color: '#3b82f6' },
  high:   { label: 'High',   color: '#f59e0b' },
  urgent: { label: 'Urgent', color: '#ef4444' },
} as const;

// ============================================================================
// Contact Warmth Config
// ============================================================================
export const WARMTH_CONFIG = {
  cold:      { label: 'Cold',      color: '#6b7280', bgColor: '#f3f4f6' },
  warm:      { label: 'Warm',      color: '#f59e0b', bgColor: '#fef3c7' },
  hot:       { label: 'Hot',       color: '#ef4444', bgColor: '#fee2e2' },
  active:    { label: 'Active',    color: '#14b8a6', bgColor: '#ccfbf1' },
  published: { label: 'Published', color: '#d4a017', bgColor: '#fef9c3' },
} as const;

// ============================================================================
// Tier Config
// ============================================================================
export const AUTHORITY_TIERS = [
  { tier: 1, name: 'Foundation',  minPoints: 0,   maxPoints: 50,   color: '#6b7280' },
  { tier: 2, name: 'Emerging',    minPoints: 50,  maxPoints: 150,  color: '#3b82f6' },
  { tier: 3, name: 'Rising',      minPoints: 150, maxPoints: 400,  color: '#8b5cf6' },
  { tier: 4, name: 'Established', minPoints: 400, maxPoints: 800,  color: '#f59e0b' },
  { tier: 5, name: 'Authority',   minPoints: 800, maxPoints: null,  color: '#d4a017' },
] as const;

// ============================================================================
// Confirmed Format Options
// ============================================================================
export const CONFIRMED_FORMATS = [
  { value: 'feature_article',  label: 'Feature Article' },
  { value: 'news_piece',       label: 'News Piece' },
  { value: 'podcast_episode',  label: 'Podcast Episode' },
  { value: 'column',           label: 'Column' },
  { value: 'interview',        label: 'Interview' },
  { value: 'speaking_slot',    label: 'Speaking Slot' },
] as const;

// ============================================================================
// Contact Role Options
// ============================================================================
export const CONTACT_ROLES = [
  { value: 'journalist',       label: 'Journalist' },
  { value: 'editor',           label: 'Editor' },
  { value: 'podcast_host',     label: 'Podcast Host' },
  { value: 'event_organiser',  label: 'Event Organiser' },
  { value: 'pr_agent',         label: 'PR Agent' },
  { value: 'other',            label: 'Other' },
] as const;

// Stage slugs that auto-set timestamps on card when moved
export const STAGE_TIMESTAMP_MAP: Record<string, string> = {
  pitched:      'pitched_at',
  agreed:       'agreed_at',
  submitted:    'submitted_at',
  published:    'published_at',
  amplified:    'amplified_at',
  archived:     'archived_at',
};
