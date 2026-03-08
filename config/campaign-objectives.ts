// ============================================================
// V3 Content Engine — Campaign Objectives
// 18 objectives across 5 categories
// ============================================================

export type ObjectiveCategory = 'growth' | 'revenue' | 'launch' | 'brand' | 'community';

export type CampaignObjectiveId =
  | 'awareness' | 'leads' | 'engagement' | 'authority'
  | 'sales' | 'upsell' | 'retention' | 'referrals'
  | 'pre_launch' | 'product_launch' | 'event_promotion' | 'offer_promotion'
  | 'recruitment' | 'partnership' | 'repositioning' | 'crisis_management'
  | 'nurture' | 'education';

export interface ContentTypeRatio {
  type_1: number;
  type_2: number;
  type_3: number;
  type_4: number;
  type_5: number;
  type_6: number;
  type_7: number;
}

export interface CampaignObjectiveConfig {
  id: CampaignObjectiveId;
  name: string;
  category: ObjectiveCategory;
  description: string;
  defaultRatio: ContentTypeRatio;
  primaryMetrics: string[];
  sequenceNext: CampaignObjectiveId[];
}

// ---- Category metadata ----

export const OBJECTIVE_CATEGORIES: Record<ObjectiveCategory, { label: string; description: string }> = {
  growth: {
    label: 'Growth',
    description: 'Build audience, drive engagement, establish authority',
  },
  revenue: {
    label: 'Revenue',
    description: 'Generate sales, upsells, retention, and referrals',
  },
  launch: {
    label: 'Launch',
    description: 'Pre-launch hype, product launches, events, offers',
  },
  brand: {
    label: 'Brand',
    description: 'Recruitment, partnerships, repositioning, crisis management',
  },
  community: {
    label: 'Community',
    description: 'Nurture existing audience and educate',
  },
};

// ---- All 18 objectives ----

export const CAMPAIGN_OBJECTIVES: Record<CampaignObjectiveId, CampaignObjectiveConfig> = {
  // ===== GROWTH =====
  awareness: {
    id: 'awareness',
    name: 'Awareness',
    category: 'growth',
    description: 'Grow your audience with high-reach, shareable content',
    defaultRatio: { type_1: 0, type_2: 5, type_3: 10, type_4: 10, type_5: 20, type_6: 30, type_7: 25 },
    primaryMetrics: ['impressions', 'reach', 'follower_growth', 'profile_visits'],
    sequenceNext: ['authority', 'engagement'],
  },
  leads: {
    id: 'leads',
    name: 'Leads',
    category: 'growth',
    description: 'Convert audience into leads with proof and CTAs',
    defaultRatio: { type_1: 25, type_2: 25, type_3: 20, type_4: 10, type_5: 15, type_6: 5, type_7: 0 },
    primaryMetrics: ['link_clicks', 'form_completions', 'dms'],
    sequenceNext: ['sales', 'nurture'],
  },
  engagement: {
    id: 'engagement',
    name: 'Engagement',
    category: 'growth',
    description: 'Maximise comments, shares, and saves',
    defaultRatio: { type_1: 5, type_2: 5, type_3: 10, type_4: 20, type_5: 25, type_6: 25, type_7: 10 },
    primaryMetrics: ['comments', 'shares', 'saves', 'engagement_rate'],
    sequenceNext: ['leads', 'authority'],
  },
  authority: {
    id: 'authority',
    name: 'Authority',
    category: 'growth',
    description: 'Position yourself as the go-to expert in your space',
    defaultRatio: { type_1: 20, type_2: 25, type_3: 25, type_4: 20, type_5: 10, type_6: 0, type_7: 0 },
    primaryMetrics: ['profile_visits', 'dms', 'share_of_voice'],
    sequenceNext: ['leads', 'sales'],
  },

  // ===== REVENUE =====
  sales: {
    id: 'sales',
    name: 'Sales',
    category: 'revenue',
    description: 'Drive conversions, bookings, and revenue',
    defaultRatio: { type_1: 30, type_2: 25, type_3: 15, type_4: 5, type_5: 15, type_6: 5, type_7: 5 },
    primaryMetrics: ['conversions', 'revenue', 'booking_rate'],
    sequenceNext: ['retention', 'upsell'],
  },
  upsell: {
    id: 'upsell',
    name: 'Upsell',
    category: 'revenue',
    description: 'Upgrade existing customers to higher tiers',
    defaultRatio: { type_1: 25, type_2: 20, type_3: 25, type_4: 20, type_5: 10, type_6: 0, type_7: 0 },
    primaryMetrics: ['upgrade_rate', 'expansion_revenue'],
    sequenceNext: ['retention', 'referrals'],
  },
  retention: {
    id: 'retention',
    name: 'Retention',
    category: 'revenue',
    description: 'Keep existing customers engaged and reduce churn',
    defaultRatio: { type_1: 5, type_2: 5, type_3: 10, type_4: 10, type_5: 25, type_6: 25, type_7: 20 },
    primaryMetrics: ['customer_engagement', 'churn_rate'],
    sequenceNext: ['upsell', 'referrals'],
  },
  referrals: {
    id: 'referrals',
    name: 'Referrals',
    category: 'revenue',
    description: 'Turn customers into advocates who refer others',
    defaultRatio: { type_1: 35, type_2: 10, type_3: 10, type_4: 5, type_5: 10, type_6: 20, type_7: 10 },
    primaryMetrics: ['referral_rate', 'referral_conversions'],
    sequenceNext: ['awareness', 'nurture'],
  },

  // ===== LAUNCH =====
  pre_launch: {
    id: 'pre_launch',
    name: 'Pre-Launch Hype',
    category: 'launch',
    description: 'Build anticipation before a product or offer launch',
    defaultRatio: { type_1: 5, type_2: 25, type_3: 10, type_4: 20, type_5: 10, type_6: 15, type_7: 15 },
    primaryMetrics: ['waitlist_signups', 'teaser_engagement'],
    sequenceNext: ['product_launch'],
  },
  product_launch: {
    id: 'product_launch',
    name: 'Product Launch',
    category: 'launch',
    description: 'Launch a new product or service with maximum impact',
    defaultRatio: { type_1: 25, type_2: 20, type_3: 10, type_4: 5, type_5: 20, type_6: 10, type_7: 10 },
    primaryMetrics: ['conversions', 'revenue', 'launch_engagement'],
    sequenceNext: ['nurture', 'retention'],
  },
  event_promotion: {
    id: 'event_promotion',
    name: 'Event Promotion',
    category: 'launch',
    description: 'Drive registrations and attendance for an event',
    defaultRatio: { type_1: 5, type_2: 10, type_3: 20, type_4: 10, type_5: 25, type_6: 20, type_7: 10 },
    primaryMetrics: ['registrations', 'attendance_rate'],
    sequenceNext: ['nurture', 'leads'],
  },
  offer_promotion: {
    id: 'offer_promotion',
    name: 'Offer Promotion',
    category: 'launch',
    description: 'Promote a limited-time offer or discount',
    defaultRatio: { type_1: 25, type_2: 15, type_3: 10, type_4: 5, type_5: 15, type_6: 15, type_7: 15 },
    primaryMetrics: ['conversions', 'revenue', 'urgency_engagement'],
    sequenceNext: ['retention', 'nurture'],
  },

  // ===== BRAND =====
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment',
    category: 'brand',
    description: 'Attract talent by showcasing culture and opportunities',
    defaultRatio: { type_1: 10, type_2: 30, type_3: 10, type_4: 5, type_5: 10, type_6: 10, type_7: 25 },
    primaryMetrics: ['applications', 'culture_post_engagement'],
    sequenceNext: ['awareness'],
  },
  partnership: {
    id: 'partnership',
    name: 'Partnership',
    category: 'brand',
    description: 'Attract strategic partners and collaborators',
    defaultRatio: { type_1: 25, type_2: 30, type_3: 30, type_4: 10, type_5: 5, type_6: 0, type_7: 0 },
    primaryMetrics: ['inbound_partner_inquiries', 'dms'],
    sequenceNext: ['authority'],
  },
  repositioning: {
    id: 'repositioning',
    name: 'Repositioning',
    category: 'brand',
    description: 'Shift market perception and attract new audience segments',
    defaultRatio: { type_1: 10, type_2: 35, type_3: 30, type_4: 20, type_5: 5, type_6: 0, type_7: 0 },
    primaryMetrics: ['sentiment_shift', 'new_audience_demographics'],
    sequenceNext: ['awareness', 'authority'],
  },
  crisis_management: {
    id: 'crisis_management',
    name: 'Crisis Management',
    category: 'brand',
    description: 'Recover from a brand crisis with transparent, controlled messaging',
    defaultRatio: { type_1: 5, type_2: 45, type_3: 40, type_4: 10, type_5: 0, type_6: 0, type_7: 0 },
    primaryMetrics: ['sentiment_recovery', 'message_reach'],
    sequenceNext: ['repositioning', 'awareness'],
  },

  // ===== COMMUNITY =====
  nurture: {
    id: 'nurture',
    name: 'Nurture',
    category: 'community',
    description: 'Re-engage and warm up your existing audience',
    defaultRatio: { type_1: 5, type_2: 5, type_3: 10, type_4: 10, type_5: 25, type_6: 25, type_7: 20 },
    primaryMetrics: ['re_engagement_rate', 'returning_visitors'],
    sequenceNext: ['leads', 'sales'],
  },
  education: {
    id: 'education',
    name: 'Education',
    category: 'community',
    description: 'Teach your audience and build trust through value',
    defaultRatio: { type_1: 5, type_2: 10, type_3: 25, type_4: 25, type_5: 25, type_6: 10, type_7: 0 },
    primaryMetrics: ['save_rate', 'share_rate', 'content_completion'],
    sequenceNext: ['authority', 'leads'],
  },
};

// ---- Helpers ----

export function getObjectivesByCategory(category: ObjectiveCategory): CampaignObjectiveConfig[] {
  return Object.values(CAMPAIGN_OBJECTIVES).filter(o => o.category === category);
}

export function getObjective(id: CampaignObjectiveId): CampaignObjectiveConfig {
  return CAMPAIGN_OBJECTIVES[id];
}

export const ALL_OBJECTIVE_IDS = Object.keys(CAMPAIGN_OBJECTIVES) as CampaignObjectiveId[];
