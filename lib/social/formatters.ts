import type { SocialPlatform, PostPayload } from './types';
import type { PlacementType } from '@/types/database';
import { buildTrackedUrl, type UTMParams } from '@/lib/utm/generate-utm';

interface ContentItem {
  topic: string | null;
  hook: string | null;
  script_body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[] | null;
  media_urls: string[] | null;
  target_url?: string | null;
  utm_parameters?: Record<string, string> | null;
  placement_type?: string | null;
}

function appendTrackedUrl(text: string, item: ContentItem, platform: string): string {
  if (!item.target_url || !item.utm_parameters) return text;

  // Override utm_source with the actual publishing platform
  const platformParams = { ...item.utm_parameters, utm_source: platform } as unknown as UTMParams;
  const trackedUrl = buildTrackedUrl(item.target_url, platformParams);
  return text ? `${text}\n\n${trackedUrl}` : trackedUrl;
}

export function formatForPlatform(platform: SocialPlatform, item: ContentItem, placementType?: PlacementType | null): PostPayload {
  // Placement-specific formatting overrides
  const pt = placementType || item.placement_type;
  if (pt === 'twitter_thread') {
    return formatForTwitterThread(item);
  }
  if (pt === 'linkedin_article') {
    return formatForLinkedInArticle(item);
  }

  // Default platform-based formatting
  switch (platform) {
    case 'facebook':
      return formatForFacebook(item);
    case 'instagram':
      return formatForInstagram(item);
    case 'linkedin':
      return formatForLinkedIn(item);
    case 'twitter':
      return formatForTwitter(item);
    case 'tiktok':
      return formatForTikTok(item);
    case 'youtube':
      return formatForYouTube(item);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function formatForFacebook(item: ContentItem): PostPayload {
  const text = appendTrackedUrl(item.caption || buildDefaultText(item), item, 'facebook');
  return {
    text,
    hashtags: item.hashtags || [],
    mediaUrls: item.media_urls || [],
  };
}

function formatForInstagram(item: ContentItem): PostPayload {
  return {
    text: '',
    caption: appendTrackedUrl(item.caption || buildDefaultText(item), item, 'instagram'),
    hashtags: item.hashtags || [],
    mediaUrls: item.media_urls || [],
  };
}

function formatForLinkedIn(item: ContentItem): PostPayload {
  const text = appendTrackedUrl(item.caption || buildDefaultText(item), item, 'linkedin');
  return {
    text,
    hashtags: item.hashtags || [],
    mediaUrls: item.media_urls || [],
  };
}

function formatForTwitter(item: ContentItem): PostPayload {
  let text = item.caption || item.hook || item.topic || '';

  // Append tracked URL before truncating
  text = appendTrackedUrl(text, item, 'twitter');

  // Twitter: 280 char limit
  if (text.length > 280) {
    text = text.slice(0, 277) + '...';
  }

  return {
    text,
    caption: text,
    hashtags: item.hashtags || [],
    mediaUrls: item.media_urls || [],
  };
}

function formatForTikTok(item: ContentItem): PostPayload {
  return {
    text: '',
    caption: appendTrackedUrl(item.caption || buildDefaultText(item), item, 'tiktok'),
    hashtags: item.hashtags || [],
    mediaUrls: item.media_urls || [],
  };
}

function formatForYouTube(item: ContentItem): PostPayload {
  return {
    text: '',
    caption: appendTrackedUrl(item.caption || buildDefaultText(item), item, 'youtube'),
    hashtags: item.hashtags || [],
    mediaUrls: item.media_urls || [],
  };
}

function buildDefaultText(item: ContentItem): string {
  const parts: string[] = [];
  if (item.hook) parts.push(item.hook);
  if (item.script_body) parts.push(item.script_body);
  if (item.cta) parts.push(item.cta);
  return parts.join('\n\n');
}

// ─── Placement-specific formatters ──────────────────────────────────────

function formatForTwitterThread(item: ContentItem): PostPayload {
  // Split caption into tweet-sized chunks for thread publishing
  const text = appendTrackedUrl(item.caption || buildDefaultText(item), item, 'twitter');
  return {
    text,
    hashtags: item.hashtags || [],
    mediaUrls: item.media_urls || [],
    // Thread splitting happens in the platform adapter
    isThread: true,
  } as PostPayload;
}

function formatForLinkedInArticle(item: ContentItem): PostPayload {
  // Articles use the caption as the article body, first line as title
  const lines = (item.caption || buildDefaultText(item)).split('\n');
  const title = lines[0] || item.topic || 'Untitled Article';
  const body = lines.slice(1).join('\n').trim();
  return {
    text: title,
    caption: body,
    hashtags: item.hashtags || [],
    mediaUrls: item.media_urls || [],
  };
}

export function canPublishToPlatform(platform: SocialPlatform, item: Pick<ContentItem, 'media_urls'>): { canPublish: boolean; reason?: string } {
  switch (platform) {
    case 'instagram':
      if (!item.media_urls || item.media_urls.length === 0) {
        return { canPublish: false, reason: 'Instagram requires at least one image or video.' };
      }
      return { canPublish: true };

    case 'tiktok': {
      const hasVideo = item.media_urls?.some(url => /\.(mp4|mov|avi|wmv)$/i.test(url));
      if (!hasVideo) {
        return { canPublish: false, reason: 'TikTok requires a video file.' };
      }
      return { canPublish: true };
    }

    case 'youtube': {
      const hasYTVideo = item.media_urls?.some(url => /\.(mp4|mov|avi|wmv|mkv|flv|webm)$/i.test(url));
      if (!hasYTVideo) {
        return { canPublish: false, reason: 'YouTube requires a video file.' };
      }
      return { canPublish: true };
    }

    default:
      return { canPublish: true };
  }
}
