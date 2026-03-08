// Platform configurations for the Presence Engine
// Defines 8 platforms with field specs, character limits, and recommendation logic

import type { PlatformKey } from '@/types/presence';

export interface PlatformFieldSpec {
  key: string;
  label: string;
  maxChars?: number;
  description: string;
  required: boolean;
}

export interface PlatformConfigEntry {
  key: PlatformKey;
  name: string;
  icon: string; // Heroicon name or emoji
  description: string;
  primaryUse: string;
  phaseNumber: string;
  fields: PlatformFieldSpec[];
  color: string; // Tailwind color class for UI
}

export const PLATFORM_CONFIGS: Record<PlatformKey, PlatformConfigEntry> = {
  linkedin: {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    description: 'Professional networking and B2B authority building',
    primaryUse: 'B2B authority, lead generation, networking',
    phaseNumber: '2',
    color: 'bg-blue-700',
    fields: [
      { key: 'linkedin_headline', label: 'Headline', maxChars: 220, description: 'Your primary positioning statement', required: true },
      { key: 'linkedin_about_short', label: 'About (Preview)', description: 'First 3 lines visible on mobile', required: true },
      { key: 'linkedin_about_full', label: 'About (Full)', maxChars: 2000, description: 'Full About section in StoryBrand structure', required: true },
      { key: 'linkedin_featured_items', label: 'Featured Items', description: '3 featured section items', required: true },
      { key: 'linkedin_connection_strategy', label: 'Connection Strategy', description: 'Who to connect with', required: false },
      { key: 'linkedin_connection_message', label: 'Connection Message', description: 'Template for new connections', required: false },
      { key: 'linkedin_banner_copy', label: 'Banner Concept', description: 'Banner image copy and direction', required: false },
      { key: 'linkedin_banner_tagline', label: 'Banner Tagline', description: 'Primary banner statement', required: false },
      { key: 'linkedin_experience_framing', label: 'Experience Framing', description: 'How to frame experience entries', required: false },
      { key: 'linkedin_skills_recommended', label: 'Skills', description: 'Skills to add for SEO', required: false },
      { key: 'linkedin_cta_primary', label: 'Primary CTA', description: 'Primary call to action', required: true },
    ],
  },

  facebook: {
    key: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    description: 'Community building and local business presence',
    primaryUse: 'Community, local business, paid ads',
    phaseNumber: '3',
    color: 'bg-blue-600',
    fields: [
      { key: 'facebook_page_name', label: 'Page Name', description: 'Official page name', required: true },
      { key: 'facebook_page_category', label: 'Category', description: 'Primary page category', required: true },
      { key: 'facebook_page_subcategory', label: 'Sub-category', description: 'Secondary category', required: false },
      { key: 'facebook_about_short', label: 'About (Short)', maxChars: 255, description: 'Short description', required: true },
      { key: 'facebook_about_full', label: 'About (Full)', maxChars: 1000, description: 'Full about section', required: true },
      { key: 'facebook_cta_button', label: 'CTA Button', description: 'Primary CTA button type & URL', required: true },
      { key: 'facebook_cover_concept', label: 'Cover Concept', description: 'Cover image copy & visual direction', required: false },
      { key: 'facebook_cover_headline', label: 'Cover Headline', description: 'Primary headline for cover', required: false },
      { key: 'facebook_group_strategy', label: 'Group Strategy', description: 'Facebook Group details (if applicable)', required: false },
    ],
  },

  instagram: {
    key: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    description: 'Visual brand storytelling and B2C discovery',
    primaryUse: 'Visual brand, lifestyle, B2C, B2B discovery',
    phaseNumber: '4',
    color: 'bg-gradient-to-br from-purple-600 to-pink-500',
    fields: [
      { key: 'instagram_bio', label: 'Bio', maxChars: 150, description: 'Profile bio', required: true },
      { key: 'instagram_bio_options', label: 'Bio Options', description: 'Authority, problem, transformation versions', required: false },
      { key: 'instagram_bio_emoji_version', label: 'Bio (Emoji)', description: 'Emoji-formatted version', required: false },
      { key: 'instagram_link_bio_strategy', label: 'Link Strategy', description: 'Single link vs multi-link decision', required: true },
      { key: 'instagram_link_bio_urls', label: 'Link URLs', description: 'Top 3 priority links', required: true },
      { key: 'instagram_highlights', label: 'Story Highlights', description: 'Highlight categories and strategy', required: true },
      { key: 'instagram_username_recommendation', label: 'Username', description: 'Username assessment', required: false },
      { key: 'instagram_grid_aesthetic', label: 'Grid Aesthetic', description: 'Visual grid direction', required: false },
      { key: 'instagram_profile_photo_brief', label: 'Profile Photo', description: 'Ideal profile photo style', required: false },
    ],
  },

  google_my_business: {
    key: 'google_my_business',
    name: 'Google Business',
    icon: 'google',
    description: 'Local SEO and map pack visibility',
    primaryUse: 'Local SEO, reviews, maps visibility',
    phaseNumber: '5',
    color: 'bg-green-600',
    fields: [
      { key: 'gmb_primary_category', label: 'Primary Category', description: 'Best-fit GMB category', required: true },
      { key: 'gmb_secondary_categories', label: 'Secondary Categories', description: 'Up to 9 additional categories', required: false },
      { key: 'gmb_description', label: 'Description', maxChars: 750, description: 'Keyword-optimised business description', required: true },
      { key: 'gmb_service_areas', label: 'Service Areas', description: 'Cities, regions, or nationwide', required: true },
      { key: 'gmb_business_hours', label: 'Business Hours', description: 'Operating hours or appointment flag', required: true },
      { key: 'gmb_services_list', label: 'Services', description: 'Up to 5 service entries with descriptions', required: true },
      { key: 'gmb_keyword_targets', label: 'Keywords', description: 'Primary SEO keywords', required: false },
    ],
  },

  tiktok: {
    key: 'tiktok',
    name: 'TikTok',
    icon: 'tiktok',
    description: 'Short-form video and organic discovery',
    primaryUse: 'Short video, organic reach, younger demographic',
    phaseNumber: '6',
    color: 'bg-black',
    fields: [
      { key: 'tiktok_bio', label: 'Bio', maxChars: 80, description: 'Profile bio', required: true },
      { key: 'tiktok_username', label: 'Username', description: 'TikTok handle', required: true },
      { key: 'tiktok_content_pillars', label: 'Content Pillars', description: '3-5 content categories', required: true },
      { key: 'tiktok_intro_formula', label: 'Intro Formula', description: 'Hook formula for first 3 seconds', required: true },
      { key: 'tiktok_pinned_video_concept', label: 'Pinned Video', description: 'Pinned video script concept', required: false },
    ],
  },

  youtube: {
    key: 'youtube',
    name: 'YouTube',
    icon: 'youtube',
    description: 'Long-form authority building and SEO',
    primaryUse: 'Long-form authority, tutorials, SEO',
    phaseNumber: '6',
    color: 'bg-red-600',
    fields: [
      { key: 'youtube_channel_description', label: 'Channel Description', maxChars: 1000, description: 'YouTube channel description', required: true },
      { key: 'youtube_channel_name', label: 'Channel Name', description: 'Official channel name', required: true },
      { key: 'youtube_channel_keywords', label: 'Channel Keywords', description: 'YouTube SEO keywords', required: true },
      { key: 'youtube_content_categories', label: 'Content Categories', description: '3-5 content pillars', required: true },
      { key: 'youtube_intro_formula', label: 'Intro Formula', description: 'Hook + identity + value promise (15 sec)', required: true },
      { key: 'youtube_trailer_concept', label: 'Trailer Concept', description: 'Channel trailer script outline', required: false },
    ],
  },

  twitter_x: {
    key: 'twitter_x',
    name: 'X (Twitter)',
    icon: 'twitter',
    description: 'Thought leadership and real-time engagement',
    primaryUse: 'Thought leadership, real-time, networking',
    phaseNumber: '2', // Handled as part of general presence
    color: 'bg-black',
    fields: [
      { key: 'twitter_bio', label: 'Bio', maxChars: 160, description: 'Profile bio', required: true },
      { key: 'twitter_header_concept', label: 'Header Concept', description: 'Header image direction', required: false },
      { key: 'twitter_pinned_tweet', label: 'Pinned Tweet', description: 'Pinned tweet strategy', required: false },
    ],
  },

  pinterest: {
    key: 'pinterest',
    name: 'Pinterest',
    icon: 'pinterest',
    description: 'Visual content and evergreen discovery',
    primaryUse: 'Visual content, evergreen, e-commerce, lifestyle',
    phaseNumber: '4', // Handled as part of visual presence
    color: 'bg-red-700',
    fields: [
      { key: 'pinterest_bio', label: 'Bio', maxChars: 500, description: 'Profile description', required: true },
      { key: 'pinterest_board_strategy', label: 'Board Strategy', description: 'Board names and categories', required: true },
      { key: 'pinterest_keyword_strategy', label: 'Keywords', description: 'Pinterest SEO keywords', required: false },
    ],
  },
};

// ─── Platform Recommendation Logic ──────────────────────────────────────────

export type RecommendationLevel = 'strongly_recommended' | 'recommended' | 'optional';

export interface PlatformRecommendation {
  platformKey: PlatformKey;
  level: RecommendationLevel;
  reason: string;
}

export function getPlatformRecommendations(brandOutputs: Record<string, unknown>): PlatformRecommendation[] {
  const archetype = (brandOutputs.brand_archetype as string || '').toLowerCase();
  const icpType = (brandOutputs.icp_business_type as string || '').toLowerCase();
  const offerings = (brandOutputs.offer_type as string || '').toLowerCase();
  const isB2B = icpType.includes('b2b') || icpType.includes('business') || icpType.includes('professional');
  const isLocal = icpType.includes('local') || offerings.includes('service');
  const isVisual = archetype.includes('creator') || archetype.includes('lover') || offerings.includes('product');
  const isThoughtLeader = archetype.includes('sage') || archetype.includes('ruler') || archetype.includes('magician');

  const recommendations: PlatformRecommendation[] = [];

  // LinkedIn — strongly recommended for B2B, thought leaders
  recommendations.push({
    platformKey: 'linkedin',
    level: isB2B || isThoughtLeader ? 'strongly_recommended' : 'recommended',
    reason: isB2B
      ? 'Essential for B2B businesses — your buyers are here'
      : 'Good for professional credibility and networking',
  });

  // Facebook — strongly recommended for local, community
  recommendations.push({
    platformKey: 'facebook',
    level: isLocal ? 'strongly_recommended' : 'recommended',
    reason: isLocal
      ? 'Critical for local businesses — your customers search here'
      : 'Good for community building and paid ads',
  });

  // Instagram — strongly recommended for visual, B2C
  recommendations.push({
    platformKey: 'instagram',
    level: isVisual || !isB2B ? 'strongly_recommended' : 'recommended',
    reason: isVisual
      ? 'Perfect for visual brands — showcase your work'
      : 'Great for brand discovery and visual storytelling',
  });

  // Google My Business — strongly recommended for local
  recommendations.push({
    platformKey: 'google_my_business',
    level: isLocal ? 'strongly_recommended' : 'optional',
    reason: isLocal
      ? 'Essential — local customers find you through Google Maps'
      : 'Optional unless you serve local clients',
  });

  // TikTok — recommended for B2C, creators
  recommendations.push({
    platformKey: 'tiktok',
    level: isVisual || !isB2B ? 'recommended' : 'optional',
    reason: !isB2B
      ? 'High organic reach — great for brand awareness'
      : 'Optional for B2B but growing in relevance',
  });

  // YouTube — recommended for thought leaders, educators
  recommendations.push({
    platformKey: 'youtube',
    level: isThoughtLeader ? 'strongly_recommended' : 'recommended',
    reason: isThoughtLeader
      ? 'Perfect for demonstrating expertise — long-form authority building'
      : 'Good for SEO and building a content library',
  });

  // X/Twitter — optional for most, recommended for thought leaders
  recommendations.push({
    platformKey: 'twitter_x',
    level: isThoughtLeader ? 'recommended' : 'optional',
    reason: isThoughtLeader
      ? 'Good for real-time thought leadership and networking'
      : 'Optional unless your audience is highly active here',
  });

  // Pinterest — optional for most, recommended for visual/e-commerce
  recommendations.push({
    platformKey: 'pinterest',
    level: isVisual && !isB2B ? 'recommended' : 'optional',
    reason: isVisual
      ? 'Great for evergreen visual content and product discovery'
      : 'Optional — best for lifestyle, design, and e-commerce brands',
  });

  return recommendations;
}

export function getPlatformConfig(key: PlatformKey): PlatformConfigEntry {
  return PLATFORM_CONFIGS[key];
}

export function getActivePlatformConfigs(activeKeys: PlatformKey[]): PlatformConfigEntry[] {
  return activeKeys.map(key => PLATFORM_CONFIGS[key]).filter(Boolean);
}
