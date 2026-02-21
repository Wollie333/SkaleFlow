import { PLATFORM_CONFIG, type SocialPlatform } from './types';

interface ContentForValidation {
  caption?: string | null;
  script_body?: string | null;
  hook?: string | null;
  media_urls?: string[] | null;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateForPublish(
  platform: SocialPlatform,
  content: ContentForValidation,
): ValidationResult {
  const config = PLATFORM_CONFIG[platform];
  const errors: string[] = [];
  const warnings: string[] = [];

  const text = content.caption || content.script_body || content.hook || '';
  const hasMedia = content.media_urls && content.media_urls.length > 0;

  // Must have some text content
  if (!text.trim()) {
    errors.push(`${config.name} requires text content (caption, script, or hook)`);
  }

  // Platform-specific media requirements
  if (config.requiresImage && !hasMedia) {
    errors.push(`${config.name} requires at least one image`);
  }
  if (config.requiresVideo && !hasMedia) {
    errors.push(`${config.name} requires a video file`);
  }

  // Character limits
  if (config.maxCaptionLength && text.length > config.maxCaptionLength) {
    errors.push(`${config.name} caption exceeds ${config.maxCaptionLength} characters (${text.length} used)`);
  }

  // Warnings for near-limit text
  if (config.maxCaptionLength && text.length > config.maxCaptionLength * 0.9 && text.length <= config.maxCaptionLength) {
    warnings.push(`${config.name} caption is near the ${config.maxCaptionLength} character limit (${text.length} used)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateForAllPlatforms(
  platforms: SocialPlatform[],
  content: ContentForValidation,
): Record<SocialPlatform, ValidationResult> {
  const results = {} as Record<SocialPlatform, ValidationResult>;
  for (const platform of platforms) {
    results[platform] = validateForPublish(platform, content);
  }
  return results;
}
