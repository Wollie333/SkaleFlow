import type { ComplianceIssue } from './shared-rules';
import { checkProhibitedContent, detectSpecialCategoryKeywords, checkUrlAccessibility } from './shared-rules';

interface MetaCreativeInput {
  primaryText: string;
  headline?: string | null;
  description?: string | null;
  ctaType?: string | null;
  targetUrl: string;
  mediaUrls?: string[];
  specialAdCategory?: string | null;
  targetingConfig?: {
    ageMin?: number;
    ageMax?: number;
    genders?: number[];
  } | null;
}

/**
 * Validate a Meta ad creative against Meta Advertising Standards.
 *
 * Checks character limits, required fields, prohibited content, special ad
 * category requirements, targeting restrictions, and landing page accessibility.
 */
export async function validateMetaCreative(input: MetaCreativeInput): Promise<ComplianceIssue[]> {
  const issues: ComplianceIssue[] = [];

  // --- Character limits ---
  if (input.primaryText.length > 475) {
    issues.push({
      type: 'character_limit',
      severity: 'error',
      field: 'primary_text',
      message: `Primary text is ${input.primaryText.length} characters (max 475).`,
      recommendation: 'Shorten the primary text to stay within Meta\'s character limit.',
    });
  } else if (input.primaryText.length > 125) {
    issues.push({
      type: 'character_limit',
      severity: 'warning',
      field: 'primary_text',
      message: `Primary text is ${input.primaryText.length} characters. Text after 125 chars may be truncated — front-load your key message.`,
      recommendation: 'Move your strongest hook and value proposition to the first 125 characters.',
    });
  }

  if (input.headline && input.headline.length > 40) {
    issues.push({
      type: 'character_limit',
      severity: 'error',
      field: 'headline',
      message: `Headline is ${input.headline.length} characters (max 40).`,
      recommendation: 'Shorten the headline to 40 characters or fewer.',
    });
  }

  if (input.description && input.description.length > 30) {
    issues.push({
      type: 'character_limit',
      severity: 'error',
      field: 'description',
      message: `Description is ${input.description.length} characters (max 30).`,
      recommendation: 'Shorten the description to 30 characters or fewer.',
    });
  }

  // --- Required fields ---
  if (!input.targetUrl) {
    issues.push({
      type: 'missing_field',
      severity: 'error',
      field: 'target_url',
      message: 'Target URL is required for Meta ads.',
    });
  }

  // --- Prohibited content ---
  issues.push(...checkProhibitedContent(input.primaryText, 'primary_text'));
  if (input.headline) {
    issues.push(...checkProhibitedContent(input.headline, 'headline'));
  }
  if (input.description) {
    issues.push(...checkProhibitedContent(input.description, 'description'));
  }

  // --- Special Ad Category detection ---
  const allText = [input.primaryText, input.headline || '', input.description || ''].join(' ');
  const detectedCategories = detectSpecialCategoryKeywords(allText);

  if (detectedCategories.length > 0 && !input.specialAdCategory) {
    issues.push({
      type: 'special_category',
      severity: 'warning',
      field: 'special_ad_category',
      message: `Content may require a Special Ad Category declaration: ${detectedCategories.join(', ')}.`,
      recommendation: 'If your ad relates to housing, employment, credit, or social issues, you must select the appropriate Special Ad Category.',
    });
  }

  // --- Special Ad Category targeting restrictions ---
  if (input.specialAdCategory && input.targetingConfig) {
    const tc = input.targetingConfig;
    if (tc.ageMin && tc.ageMin < 18) {
      issues.push({
        type: 'special_category',
        severity: 'error',
        field: 'targeting_config',
        message: 'Special Ad Category ads cannot target users under 18.',
        recommendation: 'Set minimum age to 18 or higher.',
      });
    }
    if (tc.genders && tc.genders.length > 0 && tc.genders.length < 2) {
      issues.push({
        type: 'special_category',
        severity: 'error',
        field: 'targeting_config',
        message: 'Special Ad Category ads cannot restrict by gender.',
        recommendation: 'Remove gender targeting for Special Ad Category campaigns.',
      });
    }
    if (tc.ageMax && tc.ageMax < 65) {
      issues.push({
        type: 'special_category',
        severity: 'error',
        field: 'targeting_config',
        message: 'Special Ad Category ads cannot set a maximum age below 65.',
        recommendation: 'Set maximum age to 65+ or remove age cap.',
      });
    }
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

/**
 * Determine overall compliance status from issues.
 *
 * - `rejected` — at least one error-severity issue (ad will likely be rejected)
 * - `flagged`  — warnings only (ad may be flagged for manual review)
 * - `passed`   — no issues detected
 */
export function getComplianceStatus(issues: ComplianceIssue[]): 'passed' | 'flagged' | 'rejected' {
  const hasErrors = issues.some(i => i.severity === 'error');
  const hasWarnings = issues.some(i => i.severity === 'warning');

  if (hasErrors) return 'rejected';
  if (hasWarnings) return 'flagged';
  return 'passed';
}
