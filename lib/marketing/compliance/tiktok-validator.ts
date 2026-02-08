import type { ComplianceIssue } from './shared-rules';
import { checkProhibitedContent, checkUrlAccessibility } from './shared-rules';
import { getComplianceStatus } from './meta-validator';

interface TikTokCreativeInput {
  adText: string;
  displayName?: string | null;
  ctaType?: string | null;
  targetUrl: string;
  /** Whether the ad format is an in-feed video ad (requires video asset) */
  isInFeedAd?: boolean;
  /** URLs of attached video assets */
  videoUrls?: string[];
  /** URLs of attached image assets */
  imageUrls?: string[];
  /** Hashtags included in the ad text */
  hashtags?: string[];
}

// TikTok-specific overly salesy language patterns
const TIKTOK_SALESY_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
}> = [
  {
    pattern: /\b(buy\s+now|order\s+now|shop\s+now|purchase\s+today)\b/i,
    message: 'Overly salesy call-to-action may reduce engagement on TikTok',
  },
  {
    pattern: /\b(limited\s+time|hurry|don'?t\s+miss\s+out|while\s+supplies?\s+last|ends?\s+soon)\b/i,
    message: 'Aggressive urgency language may feel inauthentic on TikTok',
  },
  {
    pattern: /\b(biggest\s+sale|massive\s+discount|blowout|clearance\s+event)\b/i,
    message: 'Heavy promotional language may reduce ad performance on TikTok',
  },
  {
    pattern: /\b(free\s+shipping|no\s+cost|zero\s+risk|money[\s-]back\s+guarantee)\b/i,
    message: 'Commercial offer language may need substantiation on TikTok',
  },
];

// Political content patterns (TikTok bans political ads entirely)
const POLITICAL_PATTERNS: RegExp[] = [
  /\b(vote\s+for|elect|political|politician|democrat|republican|liberal|conservative|campaign\s+for|ballot|referendum|parliament|senator|congress)\b/i,
  /\b(political\s+party|government\s+policy|legislation|lobby(ing)?|advocacy\s+campaign)\b/i,
];

/**
 * Validate a TikTok ad creative against TikTok Advertising Policies.
 *
 * Checks character limits, required assets, prohibited content, political
 * content bans, salesy language, hashtag presence, and landing page accessibility.
 */
export async function validateTikTokCreative(input: TikTokCreativeInput): Promise<ComplianceIssue[]> {
  const issues: ComplianceIssue[] = [];

  // --- Character limits ---
  if (input.adText.length > 5000) {
    issues.push({
      type: 'character_limit',
      severity: 'error',
      field: 'ad_text',
      message: `Ad text is ${input.adText.length} characters (max 5,000).`,
      recommendation: 'Shorten the ad text to stay within TikTok\'s character limit.',
    });
  }

  if (input.adText.length < 12) {
    issues.push({
      type: 'character_limit',
      severity: 'warning',
      field: 'ad_text',
      message: `Very short ad text (${input.adText.length} chars) — 12-100 characters recommended for best performance.`,
      recommendation: 'Add more context to your ad text for better engagement. TikTok recommends at least 12 characters.',
    });
  } else if (input.adText.length > 100) {
    issues.push({
      type: 'character_limit',
      severity: 'warning',
      field: 'ad_text',
      message: `Ad text is ${input.adText.length} characters. Text beyond 100 chars may be truncated in the feed.`,
      recommendation: 'Front-load your key message in the first 100 characters for maximum visibility.',
    });
  }

  if (input.displayName && input.displayName.length > 40) {
    issues.push({
      type: 'character_limit',
      severity: 'error',
      field: 'display_name',
      message: `Display name is ${input.displayName.length} characters (max 40).`,
      recommendation: 'Shorten the display name to 40 characters or fewer.',
    });
  }

  // --- Required assets ---
  if (input.isInFeedAd && (!input.videoUrls || input.videoUrls.length === 0)) {
    issues.push({
      type: 'missing_field',
      severity: 'error',
      field: 'video_asset',
      message: 'In-feed ads require at least one video asset.',
      recommendation: 'Upload a video (9:16 aspect ratio, 5-60s duration recommended) before publishing.',
    });
  }

  if (!input.targetUrl) {
    issues.push({
      type: 'missing_field',
      severity: 'error',
      field: 'target_url',
      message: 'Target URL is required for TikTok ads.',
    });
  }

  // --- Shared prohibited content checks ---
  issues.push(...checkProhibitedContent(input.adText, 'ad_text'));

  // --- Political content (TikTok bans political ads entirely) ---
  for (const pattern of POLITICAL_PATTERNS) {
    if (pattern.test(input.adText)) {
      issues.push({
        type: 'prohibited_content',
        severity: 'error',
        field: 'ad_text',
        message: 'Political content detected. TikTok prohibits all political advertising.',
        recommendation: 'Remove any political references, candidate names, party mentions, or advocacy language from your ad.',
      });
      break; // One political error is sufficient
    }
  }

  // --- Overly salesy language ---
  for (const rule of TIKTOK_SALESY_PATTERNS) {
    if (rule.pattern.test(input.adText)) {
      issues.push({
        type: 'prohibited_content',
        severity: 'warning',
        field: 'ad_text',
        message: rule.message,
        recommendation: 'TikTok ads perform best when they feel native and authentic. Consider using more conversational, creator-style language.',
      });
    }
  }

  // --- Hashtag recommendations ---
  const hashtagsInText = input.adText.match(/#\w+/g) || [];
  const allHashtags = Array.from(new Set([
    ...hashtagsInText,
    ...(input.hashtags || []).map(h => h.startsWith('#') ? h : `#${h}`),
  ]));

  if (allHashtags.length === 0) {
    issues.push({
      type: 'missing_field',
      severity: 'warning',
      field: 'hashtags',
      message: 'No hashtags detected. Add #ForYou for better reach.',
      recommendation: 'Include 2-5 relevant hashtags. #ForYou, #FYP, and niche hashtags help TikTok surface your ad to the right audience.',
    });
  }

  // --- Landing page check ---
  if (input.targetUrl) {
    const urlCheck = await checkUrlAccessibility(input.targetUrl);
    if (!urlCheck.accessible) {
      issues.push({
        type: 'landing_page',
        severity: 'warning',
        field: 'target_url',
        message: `Landing page may not be accessible: ${urlCheck.error || 'unknown error'}.`,
        recommendation: 'Ensure the target URL is live and returns a 200 status before publishing.',
      });
    }
  }

  return issues;
}

// Re-export getComplianceStatus so consumers can import from either validator
export { getComplianceStatus };
