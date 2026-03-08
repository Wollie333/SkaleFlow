// Profile Generator — Pre-generates platform copy from brand variables
// Called before Phase 2-6 conversations start to pre-populate AI drafts

import { readBrandOutputsForPresence, formatBrandContextForPresence } from './brand-variable-reader';
import { PRESENCE_PHASE_TEMPLATES } from '@/config/presence-phases';
import { PLATFORM_CONFIGS } from '@/config/platform-configs';
import type { PlatformKey } from '@/types/presence';

export interface ProfileDraft {
  phaseNumber: string;
  platformKey: PlatformKey | null;
  drafts: Record<string, string>;
}

/**
 * Generates initial profile copy drafts for a phase using brand variables.
 * These are presented to the user by the AI agent for refinement.
 */
export async function generateProfileDraft(
  orgId: string,
  phaseNumber: string
): Promise<ProfileDraft> {
  const brandOutputs = await readBrandOutputsForPresence(orgId);
  const phase = PRESENCE_PHASE_TEMPLATES[phaseNumber];

  if (!phase) {
    return { phaseNumber, platformKey: null, drafts: {} };
  }

  const drafts: Record<string, string> = {};
  const brandName = String(brandOutputs.brand_name || 'Your Brand');
  const oneLiner = String(brandOutputs.brand_one_liner || '');
  const icpName = String(brandOutputs.icp_name || 'your ideal client');
  const category = String(brandOutputs.category_name || brandOutputs.brand_category || '');
  const archetype = String(brandOutputs.brand_archetype || '');
  const transformation = String(brandOutputs.offer_transformation || '');
  const cta = String(brandOutputs.storybrand_cta || '');

  // Phase 2: LinkedIn
  if (phaseNumber === '2') {
    drafts.linkedin_headline_option_1 = truncate(
      `${category} Expert | Helping ${icpName} ${transformation} | ${brandName}`,
      220
    );
    drafts.linkedin_headline_option_2 = truncate(
      `The ${category} Specialist for ${icpName} | ${oneLiner}`,
      220
    );
    drafts.linkedin_headline_option_3 = truncate(
      `${oneLiner} | ${brandName} | ${cta}`,
      220
    );
    drafts.linkedin_about_preview = `Most ${icpName} struggle with achieving real results. They've tried everything, but nothing sticks. That's where ${brandName} comes in.`;
  }

  // Phase 3: Facebook
  if (phaseNumber === '3') {
    drafts.facebook_page_name = brandName;
    drafts.facebook_about_short = truncate(oneLiner || `${brandName} helps ${icpName} ${transformation}.`, 255);
  }

  // Phase 4: Instagram
  if (phaseNumber === '4') {
    drafts.instagram_bio_authority = truncate(`${category} Expert | ${transformation} | ${cta} ↓`, 150);
    drafts.instagram_bio_problem = truncate(`${icpName} struggling? | ${oneLiner} | ${cta} ↓`, 150);
    drafts.instagram_bio_transformation = truncate(`${transformation} | ${brandName} | ${cta} ↓`, 150);
  }

  // Phase 5: GMB
  if (phaseNumber === '5') {
    drafts.gmb_description_draft = truncate(
      `${brandName} is a ${category} helping ${icpName} ${transformation}. ${oneLiner}`,
      750
    );
  }

  // Phase 6: Video Platforms
  if (phaseNumber === '6') {
    drafts.youtube_description_draft = truncate(
      `Welcome to ${brandName} — the channel for ${icpName} who want to ${transformation}. Subscribe for expert content on ${category}.`,
      1000
    );
    drafts.tiktok_bio_draft = truncate(`${category} | ${transformation} | ${cta} ↓`, 80);
  }

  return {
    phaseNumber,
    platformKey: phase.platformKey,
    drafts,
  };
}

/**
 * Build a system prompt context section with brand variables for a presence phase.
 */
export function buildPresenceBrandContext(
  brandOutputs: Record<string, unknown>,
  phaseNumber: string
): string {
  const phase = PRESENCE_PHASE_TEMPLATES[phaseNumber];
  const platformKey = phase?.platformKey;

  let context = '## Brand Engine Context (Read-Only)\n';
  context += 'Use these brand variables to generate and refine platform copy. Never contradict them.\n\n';
  context += formatBrandContextForPresence(brandOutputs, platformKey || undefined);

  // Add platform-specific constraints
  if (platformKey && PLATFORM_CONFIGS[platformKey]) {
    const config = PLATFORM_CONFIGS[platformKey];
    context += '\n\n## Platform Constraints\n';
    for (const field of config.fields) {
      if (field.maxChars) {
        context += `- ${field.label}: ${field.maxChars} characters max\n`;
      }
    }
  }

  // Phase 6 handles both youtube and tiktok
  if (phaseNumber === '6') {
    context += '\n\n## Platform Constraints\n';
    context += '- YouTube Channel Description: 1,000 characters max\n';
    context += '- TikTok Bio: 80 characters max\n';
    context += '- Video Intro: Must work in first 15 seconds (YouTube) or 3 seconds (TikTok)\n';
  }

  return context;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}
