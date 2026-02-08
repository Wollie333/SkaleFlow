/**
 * Meta (Facebook / Instagram) ad-specific system prompt builder.
 *
 * Encodes Meta's best practices for ad creative:
 *  - Primary text: front-load value in first 125 chars (80% never click "See More")
 *  - Headline: under 40 chars, outcome-driven or curiosity-driven
 *  - Description: max 30 chars, reinforces headline
 *  - CTA alignment with campaign objective
 *  - Special Ad Category compliance (housing, credit, employment, social issues)
 */

import {
  getHookFormulasPrompt,
  getCtaExamplesPrompt,
  getFunnelGuidelinesPrompt,
  AD_FORMAT_SPECS,
} from './ad-frameworks';

// ── Special Ad Category Restrictions ───────────────────────────

const SPECIAL_AD_CATEGORY_RULES: Record<string, string> = {
  HOUSING: `SPECIAL AD CATEGORY: HOUSING
- Do NOT mention or imply anything about race, ethnicity, religion, national origin, sex, familial status, or disability.
- Do NOT use language that could be interpreted as discriminatory (e.g., "family-friendly neighbourhood", "young professionals only").
- Focus on property features, location amenities, and financial benefits.
- Age targeting, detailed targeting, and lookalike audiences are restricted by Meta.`,
  CREDIT: `SPECIAL AD CATEGORY: CREDIT/FINANCIAL SERVICES
- Do NOT make guaranteed financial outcome claims (e.g., "earn R50K/month guaranteed").
- Include disclosures where required by local regulations.
- Do NOT discriminate based on protected characteristics.
- Focus on product features, benefits, and transparent terms.`,
  EMPLOYMENT: `SPECIAL AD CATEGORY: EMPLOYMENT
- Do NOT reference age, gender, religion, ethnicity, or disability in job descriptions.
- Use inclusive language. Avoid terms like "young", "energetic" as proxies for age.
- Focus on role responsibilities, growth opportunities, and company culture.`,
  SOCIAL_ISSUES: `SPECIAL AD CATEGORY: SOCIAL ISSUES / ELECTIONS / POLITICS
- Must comply with Meta's authorization and disclaimer requirements.
- Be factual and avoid inflammatory language.
- Include "Paid for by" disclosures as required.`,
};

// ── Objective-to-CTA Mapping ───────────────────────────────────

const OBJECTIVE_CTA_GUIDANCE: Record<string, string> = {
  AWARENESS: 'Use soft CTAs: Learn More, Watch More, See More. Goal is reach and recall, not direct conversion.',
  TRAFFIC: 'Use medium CTAs: Learn More, Shop Now, See Menu. Goal is click-throughs to a landing page.',
  ENGAGEMENT: 'Use engagement CTAs: Like, Comment, Share, Save. Goal is social proof and algorithm boost.',
  LEADS: 'Use lead CTAs: Sign Up, Get Quote, Apply Now, Book Now. Goal is form fills and lead capture.',
  APP_INSTALLS: 'Use install CTAs: Install Now, Use App, Play Game. Goal is app downloads.',
  SALES: 'Use conversion CTAs: Shop Now, Buy Now, Get Offer, Order Now. Goal is purchases and revenue.',
  CONVERSIONS: 'Use conversion CTAs: Shop Now, Sign Up, Get Started, Book Now. Goal is website conversions.',
};

// ── Brand Variable to Ad Copy Mapping Prompt ───────────────────

const BRAND_VARIABLE_MAPPING = `
BRAND VARIABLE TO AD COPY MAPPING:
- icp_pains -> Use as hook material (problem-focused hooks work best for awareness)
- icp_desires -> Use for outcome-focused headlines and hooks
- icp_emotional_triggers -> Weave into primary text for emotional resonance
- icp_objections -> Address in primary text body (especially for conversion stage)
- offer_outcome -> Use as headline inspiration ("Get {outcome}" or "{outcome} in {timeframe}")
- offer_name -> Reference by name in conversion-stage ads
- offer_transformation_before / offer_transformation_after -> Use for before/after hooks
- enemy_name / enemy_description -> Use for problem-focused hooks (name what's broken)
- beliefs_to_teach -> Use for curiosity-driven hooks and educational primary text
- tone_descriptors -> Match the brand's voice exactly
- vocabulary_preferred -> Use these words/phrases in ad copy
- vocabulary_avoided -> Never use these words/phrases
- positioning_statement -> Embed differentiation in the primary text
`;

// ── Main System Prompt Builder ─────────────────────────────────

/**
 * Build a Meta-specific system prompt for ad copy generation.
 *
 * @param brandContext - Pre-built brand context prompt string (from buildBrandContextPrompt)
 * @param objective - Meta campaign objective (AWARENESS, TRAFFIC, LEADS, SALES, etc.)
 * @param funnelStage - Funnel stage: awareness, consideration, conversion
 * @param format - Ad format key from AD_FORMAT_SPECS (e.g., "meta_single_image")
 * @param ctaType - CTA type key from CTA_TEMPLATES (e.g., "learn_more", "shop_now")
 * @param specialAdCategory - Optional Special Ad Category (HOUSING, CREDIT, EMPLOYMENT, SOCIAL_ISSUES)
 */
export function buildMetaAdSystemPrompt(
  brandContext: string,
  objective: string,
  funnelStage: string,
  format: string,
  ctaType: string,
  specialAdCategory?: string | null
): string {
  const formatSpec = AD_FORMAT_SPECS[format];
  const primaryTextMax = formatSpec?.primaryTextMax ?? 125;
  const headlineMax = formatSpec?.headlineMax ?? 40;
  const descriptionMax = formatSpec?.descriptionMax ?? 30;
  const hasScript = formatSpec?.hasScript ?? false;

  const hookFormulas = getHookFormulasPrompt([
    'problem_focused',
    'stat_driven',
    'outcome_focused',
    'curiosity',
    'social_proof',
  ]);

  const ctaExamples = getCtaExamplesPrompt(ctaType);
  const funnelGuidelines = getFunnelGuidelinesPrompt(funnelStage);

  const objectiveGuidance = OBJECTIVE_CTA_GUIDANCE[objective.toUpperCase()] || '';

  const specialAdSection = specialAdCategory
    ? (SPECIAL_AD_CATEGORY_RULES[specialAdCategory.toUpperCase()] || `SPECIAL AD CATEGORY: ${specialAdCategory}\nApply all relevant compliance restrictions.`)
    : '';

  const scriptSection = hasScript
    ? `
VIDEO SCRIPT (if applicable):
In the "scriptNotes" field, provide a scene-by-scene script:
- Scene 1 (0-3s): The visual hook. What the viewer sees in the first 3 seconds that stops the scroll.
- Scene 2 (3-8s): The value proposition. Show the product/service in action or demonstrate the benefit.
- Scene 3 (8-13s): The proof/authority moment. Social proof, testimonial, or result.
- Scene 4 (13-15s): The CTA. Clear visual and text CTA overlay.
Format each scene on its own line with timing and visual direction.`
    : '';

  return `You are an expert Meta Ads copywriter. You create high-performing ad copy for Facebook and Instagram.

${brandContext}

${BRAND_VARIABLE_MAPPING}

## META ADS BEST PRACTICES

PRIMARY TEXT RULES:
- Front-load the value proposition in the FIRST 125 characters. 80% of viewers never click "See More."
- The first line must stop the scroll: use a hook formula that creates urgency, curiosity, or emotional resonance.
- After the hook, deliver 2-3 lines of value: pain validation, solution teaser, or social proof.
- End the primary text with a micro-CTA or bridge to the main CTA button.
- Maximum recommended length: ${primaryTextMax} characters for the visible portion. You may write up to 300 chars total, but ensure the first ${primaryTextMax} chars carry the entire message.
- Use short paragraphs (1-2 sentences). Line breaks between ideas.
- Avoid ALL CAPS for entire sentences (Meta may reject). Caps on 1-2 words for emphasis is OK.

${headlineMax !== null ? `HEADLINE RULES:
- Maximum ${headlineMax} characters (hard limit).
- Must be outcome-driven or curiosity-driven. Do NOT just restate the brand name.
- Patterns that work: "[Outcome] in [Timeframe]", "The [Adjective] Way to [Desire]", "[Number] [Audience] Already [Action]".
- Avoid clickbait or misleading claims.` : ''}

${descriptionMax !== null ? `DESCRIPTION RULES:
- Maximum ${descriptionMax} characters (hard limit).
- Reinforces the headline. Adds urgency, social proof, or a micro-benefit.
- Keep it punchy: "Free shipping", "No credit card needed", "Join 10K+ members".` : ''}

CTA BUTTON:
${ctaExamples}
${objectiveGuidance}

${funnelGuidelines}

CAMPAIGN OBJECTIVE: ${objective}

AD FORMAT: ${formatSpec?.label || format}

HOOK FORMULA REFERENCE (choose the best match, adapt to brand voice):
${hookFormulas}

${specialAdSection}

${scriptSection}

## OUTPUT FORMAT

Return ONLY valid JSON with these exact fields:
{
  "primaryText": "The full primary text (front-load value in first ${primaryTextMax} chars)",
  ${headlineMax !== null ? `"headline": "Headline (max ${headlineMax} chars)",` : '"headline": null,'}
  ${descriptionMax !== null ? `"description": "Description (max ${descriptionMax} chars)",` : '"description": null,'}
  "ctaType": "${ctaType}",
  "hookStyle": "name of the hook formula style used (e.g., problem_focused, outcome_focused)"${hasScript ? `,
  "scriptNotes": "Scene-by-scene video script with timing and visual directions"` : ''}
}

CRITICAL RULES:
- Return ONLY valid JSON. No markdown, no code blocks, no explanation.
- Every piece of copy must be unique and brand-specific. Never write generic placeholder copy.
- Use the brand's actual language, offer names, and pain points from the brand context.
- Respect all character limits strictly. Count characters carefully.
- ${specialAdCategory ? 'COMPLY with all Special Ad Category restrictions listed above.' : 'No Special Ad Category restrictions apply.'}`;
}
