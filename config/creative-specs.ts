import type { ContentFormat } from './script-frameworks';

export interface CreativeSpec {
  format: ContentFormat;
  label: string;
  dimensions: string[];
  aspectRatio: string[];
  fileTypes: string[];
  duration: string | null;
  platformNotes: Record<string, string>;
}

export const CREATIVE_SPECS: Record<ContentFormat, CreativeSpec> = {
  short_video_30_60: {
    format: 'short_video_30_60',
    label: 'Short Video (30-60s)',
    dimensions: ['1080x1920px'],
    aspectRatio: ['9:16'],
    fileTypes: ['MP4', 'MOV'],
    duration: '30-60 seconds',
    platformNotes: {
      tiktok: 'Include captions for muted viewers. Use trending sounds when possible.',
      instagram: 'Reels format. First 3 seconds critical for retention.',
      youtube: 'Shorts format. Vertical only.',
      linkedin: 'Professional tone. Consider text overlay for muted autoplay.',
      facebook: 'Reels format. Square (1:1) also acceptable.',
    },
  },
  short_video_60_90: {
    format: 'short_video_60_90',
    label: 'Short Video (60-90s)',
    dimensions: ['1080x1920px'],
    aspectRatio: ['9:16'],
    fileTypes: ['MP4', 'MOV'],
    duration: '60-90 seconds',
    platformNotes: {
      tiktok: 'Include captions. Longer format allows deeper storytelling.',
      instagram: 'Reels format. Strong hook essential — algorithm favors watch-through.',
      youtube: 'Shorts max 60s. May need trimmed version.',
      linkedin: 'Professional tone. Good length for thought leadership.',
      facebook: 'Reels format.',
    },
  },
  short_video_60_120: {
    format: 'short_video_60_120',
    label: 'Short Video (60-120s)',
    dimensions: ['1080x1920px'],
    aspectRatio: ['9:16'],
    fileTypes: ['MP4', 'MOV'],
    duration: '60-120 seconds',
    platformNotes: {
      tiktok: 'Include captions. Use chapter-style sections for longer content.',
      instagram: 'Reels up to 90s. May need trimmed version for IG.',
      youtube: 'Exceeds Shorts limit. Post as regular vertical video.',
      linkedin: 'Great length for professional storytelling.',
      facebook: 'Reels format.',
    },
  },
  medium_video_2_3: {
    format: 'medium_video_2_3',
    label: 'Medium Video (2-3 min)',
    dimensions: ['1920x1080px', '1080x1920px'],
    aspectRatio: ['16:9', '9:16'],
    fileTypes: ['MP4', 'MOV'],
    duration: '2-3 minutes',
    platformNotes: {
      youtube: 'Standard video. Include chapters in description. Thumbnail required.',
      linkedin: 'Native upload preferred. Add captions.',
      instagram: 'Post as Reel (vertical) or IGTV.',
      tiktok: 'Vertical format. Break into logical sections.',
      facebook: 'Native upload. Add captions for autoplay.',
    },
  },
  medium_video_4_6: {
    format: 'medium_video_4_6',
    label: 'Medium Video (4-6 min)',
    dimensions: ['1920x1080px'],
    aspectRatio: ['16:9'],
    fileTypes: ['MP4', 'MOV'],
    duration: '4-6 minutes',
    platformNotes: {
      youtube: 'Standard video. Add chapters, end screen, cards. Thumbnail required.',
      linkedin: 'Great for thought leadership. Keep under 10min for LinkedIn native.',
      facebook: 'Native upload with captions.',
      instagram: 'Consider cutting to shorter clips for Reels.',
      tiktok: 'Consider cutting to shorter clips.',
    },
  },
  medium_video_7_10: {
    format: 'medium_video_7_10',
    label: 'Medium Video (7-10 min)',
    dimensions: ['1920x1080px'],
    aspectRatio: ['16:9'],
    fileTypes: ['MP4', 'MOV'],
    duration: '7-10 minutes',
    platformNotes: {
      youtube: 'Standard video. Optimal YouTube length. Add chapters, cards, end screen.',
      linkedin: 'LinkedIn native supports up to 10min. Good for authority content.',
      facebook: 'Native upload. Consider Facebook Watch.',
      instagram: 'Too long for Reels. Cut shorter clips.',
      tiktok: 'Too long. Cut shorter clips for TikTok.',
    },
  },
  long_video_10_15: {
    format: 'long_video_10_15',
    label: 'Long Video (10-15 min)',
    dimensions: ['1920x1080px'],
    aspectRatio: ['16:9'],
    fileTypes: ['MP4', 'MOV'],
    duration: '10-15 minutes',
    platformNotes: {
      youtube: 'Strong YouTube length. Mid-roll ads eligible. Full chapter structure.',
      linkedin: 'Exceeds LinkedIn native limit. Share YouTube link or trim.',
      facebook: 'Native upload possible. Facebook Watch recommended.',
      instagram: 'Extract 3-5 short clips for Reels.',
      tiktok: 'Extract 5-10 short clips for TikTok.',
    },
  },
  long_video_20_30: {
    format: 'long_video_20_30',
    label: 'Long Video (20-30 min)',
    dimensions: ['1920x1080px'],
    aspectRatio: ['16:9'],
    fileTypes: ['MP4', 'MOV'],
    duration: '20-30 minutes',
    platformNotes: {
      youtube: 'Premium YouTube content. Multiple mid-roll ad placements. Full production value.',
      linkedin: 'Share as YouTube link. Extract key moments as native clips.',
      facebook: 'Share as YouTube link or Facebook Watch.',
      instagram: 'Extract 5-8 short clips for Reels.',
      tiktok: 'Extract 10-15 short clips.',
    },
  },
  long_video_30_45: {
    format: 'long_video_30_45',
    label: 'Long Video (30-45+ min)',
    dimensions: ['1920x1080px'],
    aspectRatio: ['16:9'],
    fileTypes: ['MP4', 'MOV'],
    duration: '30-45+ minutes',
    platformNotes: {
      youtube: 'Flagship content. Full production. Multiple ad placements. Chapter structure essential.',
      linkedin: 'Share as YouTube link. Extract 3-5 authority clips.',
      facebook: 'Share as YouTube link.',
      instagram: 'Extract 10-20 short clips. Source for weeks of Reels content.',
      tiktok: 'Extract 10-20 short clips. Source for weeks of content.',
    },
  },
  carousel_5_7: {
    format: 'carousel_5_7',
    label: 'Carousel (5-7 slides)',
    dimensions: ['1080x1080px', '1080x1350px'],
    aspectRatio: ['1:1', '4:5'],
    fileTypes: ['PNG', 'JPG', 'PDF'],
    duration: null,
    platformNotes: {
      instagram: 'Up to 10 slides. 4:5 recommended for maximum feed real estate.',
      linkedin: 'PDF carousel (document post) or multi-image. 1:1 recommended.',
      facebook: 'Multi-image post. 1:1 format.',
      tiktok: 'Photo mode carousel. 1080x1920 (9:16) also works.',
      twitter: 'Up to 4 images. Use 1:1 format.',
    },
  },
  static_infographic: {
    format: 'static_infographic',
    label: 'Static Infographic',
    dimensions: ['1080x1080px', '1080x1350px'],
    aspectRatio: ['1:1', '4:5'],
    fileTypes: ['PNG', 'JPG'],
    duration: null,
    platformNotes: {
      instagram: '4:5 for maximum feed presence. Clean, bold typography.',
      linkedin: '1:1 recommended. Professional design, data-driven.',
      facebook: '1:1 or 4:5. Eye-catching colors for feed scroll.',
      twitter: '1:1 or 16:9. Bold text for timeline scanning.',
      tiktok: 'Photo mode. 9:16 version recommended.',
    },
  },
};

export function getCreativeSpec(format: ContentFormat): CreativeSpec {
  return CREATIVE_SPECS[format];
}

export const PLATFORM_CHARACTER_LIMITS: Record<string, { caption: number; hashtags: number }> = {
  instagram: { caption: 2200, hashtags: 30 },
  linkedin: { caption: 3000, hashtags: 10 },
  facebook: { caption: 63206, hashtags: 10 },
  twitter: { caption: 280, hashtags: 5 },
  tiktok: { caption: 2200, hashtags: 15 },
};
