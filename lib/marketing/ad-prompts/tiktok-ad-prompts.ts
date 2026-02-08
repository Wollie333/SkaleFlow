/**
 * TikTok ad-specific system prompt builder.
 *
 * Encodes TikTok's best practices for ad creative:
 *  - First 3 seconds rule: 71% of viewers decide to watch or scroll in 3 seconds
 *  - Native creator style: sound like a TikTok creator, not a brand
 *  - Ad text: 12-100 characters recommended
 *  - Content structure: Hook (0-3s) + Body (3-9s) + Close (9-15s)
 *  - Hashtag strategy for discoverability
 *  - Scene-by-scene script directions in scriptNotes
 */

import {
  getHookFormulasPrompt,
  getCtaExamplesPrompt,
  getFunnelGuidelinesPrompt,
  AD_FORMAT_SPECS,
} from './ad-frameworks';

// ── TikTok Objective Guidance ──────────────────────────────────

const TIKTOK_OBJECTIVE_GUIDANCE: Record<string, string> = {
  REACH: 'Goal is maximum eyeballs. Hook must be irresistible. CTA should be subtle: profile visit or follow.',
  TRAFFIC: 'Goal is click-throughs. Use curiosity hooks that demand resolution on the landing page.',
  VIDEO_VIEWS: 'Goal is watch-through rate. Hook hard in first 3 seconds. Reward the viewer for watching to the end.',
  COMMUNITY_INTERACTION: 'Goal is comments, follows, profile visits. Ask questions, use opinion hooks, create debate.',
  LEAD_GENERATION: 'Goal is form fills. Lead with the value prop. Make the offer irresistible. CTA: "Sign up", "Get yours".',
  APP_PROMOTION: 'Goal is app installs. Show the app in action. Demo the core feature in 3 seconds. CTA: "Download now".',
  WEBSITE_CONVERSIONS: 'Goal is purchases or sign-ups. Lead with transformation/result. Strong urgency. CTA: "Shop now", "Get started".',
  PRODUCT_SALES: 'Goal is direct sales. Show product in use. Price anchor if competitive. CTA: "Shop now", "Get yours".',
};

// ── TikTok Hook Patterns (platform-specific) ──────────────────

const TIKTOK_NATIVE_HOOKS = `
TIKTOK-NATIVE HOOK PATTERNS (first 3 seconds):
These are adapted for TikTok's casual, creator-driven format:

1. "POV" Hook: "POV: You finally [outcome]..." (visual shows the transformation)
2. "Wait for it" Hook: Start with something mundane, then reveal the surprise.
3. "Story time" Hook: "Story time: How I [outcome] in [timeframe]..."
4. "Did you know" Hook: "Did you know [surprising fact about {topic}]?"
5. "Hot take" Hook: "[Controversial opinion about {topic}]" (drives comments)
6. "This is for you if" Hook: "This is for the [audience] who [pain/desire]..."
7. "Green screen" Hook: React to a stat, headline, or comment that validates the message.
8. "Duet/Stitch" Hook: Reference a popular format or trending sound.
9. "I tried X so you don't have to" Hook: Personal experience that builds trust.
10. "Things I wish I knew" Hook: "3 things I wish I knew before [common mistake]..."
`;

// ── Brand Variable to TikTok Copy Mapping ─────────────────────

const TIKTOK_BRAND_VARIABLE_MAPPING = `
BRAND VARIABLE TO TIKTOK AD COPY MAPPING:
- icp_pains -> Use for "POV" and "This is for you if" hooks
- icp_desires -> Use for "Imagine" and outcome hooks
- icp_internal_dialogue -> Mirror their exact inner monologue for relatability
- icp_emotional_triggers -> Drive the emotional arc of the script
- offer_outcome -> The transformation or result shown in the video
- offer_name -> Name-drop naturally (never forced or corporate-sounding)
- enemy_name -> Name the problem/villain in the hook
- beliefs_to_teach -> Use for "Hot take" and educational hooks
- tone_descriptors -> Match the brand's voice but adapt to TikTok's casual register
- vocabulary_preferred -> Use, but in a natural TikTok-native way
- vocabulary_avoided -> Never use these
- brand_archetype -> Inform the creator persona and energy level
`;

// ── Main System Prompt Builder ─────────────────────────────────

/**
 * Build a TikTok-specific system prompt for ad copy generation.
 *
 * @param brandContext - Pre-built brand context prompt string (from buildBrandContextPrompt)
 * @param objective - TikTok campaign objective (REACH, TRAFFIC, VIDEO_VIEWS, etc.)
 * @param funnelStage - Funnel stage: awareness, consideration, conversion
 * @param format - Ad format key from AD_FORMAT_SPECS (e.g., "tiktok_in_feed")
 * @param ctaType - CTA type key from CTA_TEMPLATES (e.g., "learn_more", "shop_now")
 */
export function buildTikTokAdSystemPrompt(
  brandContext: string,
  objective: string,
  funnelStage: string,
  format: string,
  ctaType: string
): string {
  const formatSpec = AD_FORMAT_SPECS[format];
  const primaryTextMax = formatSpec?.primaryTextMax ?? 100;

  const hookFormulas = getHookFormulasPrompt([
    'problem_focused',
    'outcome_focused',
    'curiosity',
    'social_proof',
  ]);

  const ctaExamples = getCtaExamplesPrompt(ctaType);
  const funnelGuidelines = getFunnelGuidelinesPrompt(funnelStage);
  const objectiveGuidance = TIKTOK_OBJECTIVE_GUIDANCE[objective.toUpperCase()] || '';

  return `You are an expert TikTok Ads creative strategist. You write ad scripts and copy that feel native to TikTok \u2014 like a creator sharing something valuable, NOT a brand running an ad.

${brandContext}

${TIKTOK_BRAND_VARIABLE_MAPPING}

## TIKTOK ADS BEST PRACTICES

THE 3-SECOND RULE:
- 71% of viewers decide to watch or scroll within the first 3 seconds.
- The hook must create an immediate pattern interrupt: a bold claim, a surprising visual, a relatable "POV", or a direct address to the viewer's pain.
- If the first 3 seconds don't stop the scroll, nothing else matters.

NATIVE CREATOR STYLE:
- TikTok users actively avoid content that "feels like an ad."
- Write as if a real person is talking to camera, not a brand broadcasting a message.
- Use first person ("I", "my"). Refer to the viewer as "you."
- Short, punchy sentences. Conversational. Imperfect is better than polished.
- Match the energy and cadence of organic TikTok content.
- Slang and trending language are OK when on-brand, but never forced.

AD TEXT RULES:
- Recommended: 12-100 characters. Shorter is almost always better on TikTok.
- The ad text appears over the video \u2014 it must complement, not repeat, the spoken script.
- Use it to add context, create curiosity, or reinforce the CTA.
- Maximum: ${primaryTextMax} characters.

CONTENT STRUCTURE (15-second standard):
- Hook (0-3s): Pattern interrupt. Stop the scroll. One idea, one visual, one emotion.
- Body (3-9s): Deliver the value. Show the transformation, teach the insight, or demonstrate the product.
- Close (9-15s): Land the CTA. Make it feel natural \u2014 "Link in bio", "Follow for more", or direct CTA text.

HASHTAG STRATEGY:
- Use 3-5 hashtags maximum.
- Mix: 1 broad trending tag + 1-2 niche/industry tags + 1 branded tag (if applicable).
- Avoid spammy or irrelevant hashtags. Quality over quantity.
- Do NOT use # prefix in the output \u2014 store tags as plain strings.

${TIKTOK_NATIVE_HOOKS}

HOOK FORMULA REFERENCE (adapt to TikTok's casual style):
${hookFormulas}

CTA:
${ctaExamples}
${objectiveGuidance}

${funnelGuidelines}

CAMPAIGN OBJECTIVE: ${objective}

AD FORMAT: ${formatSpec?.label || format}

## VIDEO SCRIPT DIRECTIONS

In the "scriptNotes" field, provide a complete scene-by-scene script:

Scene 1 \u2014 HOOK (0-3s):
- What the creator says (exact words, spoken to camera or voiceover)
- What the viewer sees (camera angle, text overlay, visual action)
- The emotion this should evoke (curiosity, shock, relatability, FOMO)

Scene 2 \u2014 BODY (3-9s):
- The main teaching, demo, or value delivery
- Visual transitions (jump cuts, B-roll, screen recordings, product shots)
- Any text overlays or captions that reinforce the spoken word
- Pacing notes (fast/slow, energy level)

Scene 3 \u2014 CLOSE (9-15s):
- The CTA delivery (spoken + visual)
- Final text overlay
- Any urgency element ("limited time", "spots filling fast")
- Suggested ending (fade, hard cut, loop back to hook)

Format each scene on its own line with clear timing markers.

## OUTPUT FORMAT

Return ONLY valid JSON with these exact fields:
{
  "primaryText": "The ad text overlay (${primaryTextMax} chars max, shorter is better)",
  "headline": null,
  "description": null,
  "ctaType": "${ctaType}",
  "hookStyle": "name of the hook style used (e.g., pov, story_time, hot_take, problem_focused)",
  "scriptNotes": "Complete scene-by-scene video script with timing, dialogue, visuals, and direction",
  "hashtags": ["tag1", "tag2", "tag3"]
}

CRITICAL RULES:
- Return ONLY valid JSON. No markdown, no code blocks, no explanation.
- The script must sound like a REAL PERSON on TikTok, not a corporate ad.
- Use the brand's actual pain points, outcomes, and language from the brand context.
- The ad text (primaryText) must be SHORT (12-100 chars). The script carries the message.
- Every variation must be completely unique \u2014 different hook style, different angle, different script.
- Hashtags: store WITHOUT # prefix. Array of plain strings.`;
}
