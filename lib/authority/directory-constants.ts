import type { PRDirectoryCategory, PRDirectoryFlagReason } from '@/types/database';

export const PR_DIRECTORY_CATEGORIES: Record<PRDirectoryCategory, { label: string; color: string }> = {
  news: { label: 'News', color: 'bg-blue-100 text-blue-800' },
  magazine: { label: 'Magazine', color: 'bg-purple-100 text-purple-800' },
  radio: { label: 'Radio', color: 'bg-amber-100 text-amber-800' },
  podcasts: { label: 'Podcasts', color: 'bg-green-100 text-green-800' },
  live_events: { label: 'Live Events', color: 'bg-red-100 text-red-800' },
  tv: { label: 'TV', color: 'bg-indigo-100 text-indigo-800' },
  digital_online: { label: 'Digital / Online', color: 'bg-cyan-100 text-cyan-800' },
  blogs_influencers: { label: 'Blogs & Influencers', color: 'bg-pink-100 text-pink-800' },
  speaking_conferences: { label: 'Speaking & Conferences', color: 'bg-orange-100 text-orange-800' },
  awards: { label: 'Awards', color: 'bg-yellow-100 text-yellow-800' },
};

export const PR_DIRECTORY_INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Lifestyle',
  'Fashion',
  'Food & Beverage',
  'Real Estate',
  'Sports',
  'Entertainment',
  'Education',
  'Travel',
  'Automotive',
  'Energy',
  'Nonprofit',
  'Government',
  'Other',
] as const;

export const PR_DIRECTORY_FLAG_REASONS: Record<PRDirectoryFlagReason, { label: string }> = {
  incorrect_info: { label: 'Incorrect information' },
  duplicate: { label: 'Duplicate contact' },
  spam: { label: 'Spam or fake entry' },
  no_longer_active: { label: 'No longer active' },
  inappropriate: { label: 'Inappropriate content' },
  other: { label: 'Other' },
};

// Map directory category → authority category for reach-out
export const DIRECTORY_TO_AUTHORITY_CATEGORY: Record<PRDirectoryCategory, string> = {
  news: 'media_placement',
  magazine: 'magazine_feature',
  radio: 'media_placement',
  podcasts: 'podcast_appearance',
  live_events: 'live_event',
  tv: 'tv_video',
  digital_online: 'media_placement',
  blogs_influencers: 'thought_leadership',
  speaking_conferences: 'live_event',
  awards: 'award_recognition',
};
