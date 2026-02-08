/**
 * Ad copy frameworks, hook formulas, CTA templates, and funnel stage guidelines.
 * Used by platform-specific prompt builders (Meta, TikTok) to inject
 * proven copywriting structures into the AI system prompt.
 */

// ── Hook Formulas ──────────────────────────────────────────────

export const HOOK_FORMULAS: Record<string, string[]> = {
  problem_focused: [
    'Tired of {pain}?',
    'Still struggling with {pain}?',
    '{pain} is costing you more than you think.',
    'What if {pain} wasn\'t a problem anymore?',
  ],
  stat_driven: [
    '{stat}% of {audience} struggle with {pain}.',
    'The average {audience} wastes {stat} on {pain}.',
    '{stat} out of {stat_total} {audience} don\'t know this about {topic}.',
  ],
  outcome_focused: [
    'Imagine {outcome} in just {timeframe}.',
    'What would your life look like with {outcome}?',
    'From {before_state} to {after_state} \u2014 here\'s how.',
    'Ready for {outcome}?',
  ],
  curiosity: [
    'The #1 mistake {audience} make with {topic}.',
    'Nobody tells you this about {topic}.',
    'Here\'s what {authority} taught me about {topic}.',
    'Stop doing {common_mistake} if you want {outcome}.',
  ],
  social_proof: [
    '{number}+ {audience} already {action}.',
    'Join {number} {audience} who {outcome}.',
    'See why {audience} are switching to {solution}.',
  ],
};

// ── CTA Templates ──────────────────────────────────────────────

export const CTA_TEMPLATES: Record<string, { text: string; urgency: 'low' | 'medium' | 'high' }[]> = {
  learn_more: [
    { text: 'Discover how \u2192', urgency: 'low' },
    { text: 'See the full story', urgency: 'low' },
    { text: 'Learn more about this', urgency: 'low' },
  ],
  shop_now: [
    { text: 'Shop the collection', urgency: 'medium' },
    { text: 'Get yours now', urgency: 'high' },
    { text: 'Limited stock \u2014 Shop now', urgency: 'high' },
  ],
  sign_up: [
    { text: 'Join free today', urgency: 'medium' },
    { text: 'Start your free trial', urgency: 'medium' },
    { text: 'Sign up \u2014 it takes 30 seconds', urgency: 'low' },
  ],
  download: [
    { text: 'Get your free copy', urgency: 'medium' },
    { text: 'Download now', urgency: 'medium' },
    { text: 'Grab the guide \u2192', urgency: 'low' },
  ],
  get_quote: [
    { text: 'Get your free quote', urgency: 'medium' },
    { text: 'See your personalised price', urgency: 'medium' },
  ],
  apply_now: [
    { text: 'Apply in 2 minutes', urgency: 'medium' },
    { text: 'Submit your application', urgency: 'low' },
  ],
  book_now: [
    { text: 'Book your spot', urgency: 'medium' },
    { text: 'Reserve now \u2014 spots filling fast', urgency: 'high' },
  ],
  contact_us: [
    { text: 'Let\'s talk', urgency: 'low' },
    { text: 'Get in touch today', urgency: 'medium' },
  ],
};

// ── Funnel Stage Guidelines ────────────────────────────────────

export const FUNNEL_STAGE_GUIDELINES: Record<string, { focus: string; tone: string; ctaStyle: string }> = {
  awareness: {
    focus: 'Problem identification and emotional resonance. Make the audience feel seen.',
    tone: 'Empathetic, relatable, educational. Avoid hard selling.',
    ctaStyle: 'Soft CTAs: Learn More, Discover, See How',
  },
  consideration: {
    focus: 'Solution presentation and differentiation. Show proof and credibility.',
    tone: 'Confident, authoritative, helpful. Present evidence.',
    ctaStyle: 'Medium CTAs: Get Your Free Guide, See Demo, Compare',
  },
  conversion: {
    focus: 'Urgency and final objection handling. Make it easy to say yes.',
    tone: 'Direct, urgent, reassuring. Address last-minute doubts.',
    ctaStyle: 'Strong CTAs: Buy Now, Start Free Trial, Book Today',
  },
};

// ── Ad Format Specs ────────────────────────────────────────────

export const AD_FORMAT_SPECS: Record<string, {
  label: string;
  platform: 'meta' | 'tiktok';
  primaryTextMax: number;
  headlineMax: number | null;
  descriptionMax: number | null;
  hasScript: boolean;
}> = {
  // Meta formats
  meta_single_image: {
    label: 'Single Image',
    platform: 'meta',
    primaryTextMax: 125,
    headlineMax: 40,
    descriptionMax: 30,
    hasScript: false,
  },
  meta_single_video: {
    label: 'Single Video',
    platform: 'meta',
    primaryTextMax: 125,
    headlineMax: 40,
    descriptionMax: 30,
    hasScript: true,
  },
  meta_carousel: {
    label: 'Carousel',
    platform: 'meta',
    primaryTextMax: 125,
    headlineMax: 40,
    descriptionMax: 30,
    hasScript: false,
  },
  meta_stories: {
    label: 'Stories / Reels',
    platform: 'meta',
    primaryTextMax: 125,
    headlineMax: null,
    descriptionMax: null,
    hasScript: true,
  },
  // TikTok formats
  tiktok_in_feed: {
    label: 'In-Feed Ad',
    platform: 'tiktok',
    primaryTextMax: 100,
    headlineMax: null,
    descriptionMax: null,
    hasScript: true,
  },
  tiktok_spark: {
    label: 'Spark Ad',
    platform: 'tiktok',
    primaryTextMax: 100,
    headlineMax: null,
    descriptionMax: null,
    hasScript: true,
  },
  tiktok_topview: {
    label: 'TopView',
    platform: 'tiktok',
    primaryTextMax: 100,
    headlineMax: null,
    descriptionMax: null,
    hasScript: true,
  },
};

// ── Output Interface ───────────────────────────────────────────

export interface AdCopyOutput {
  primaryText: string;
  headline: string | null;
  description: string | null;
  ctaType: string;
  hookStyle: string;
  scriptNotes?: string;
}

// ── Helper: Get hook formulas as prompt text ───────────────────

export function getHookFormulasPrompt(styles: string[]): string {
  const lines: string[] = [];
  for (const style of styles) {
    const formulas = HOOK_FORMULAS[style];
    if (!formulas) continue;
    const label = style.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    lines.push(`${label}:`);
    for (const f of formulas) {
      lines.push(`  - "${f}"`);
    }
  }
  return lines.join('\n');
}

// ── Helper: Get CTA examples for a given type ──────────────────

export function getCtaExamplesPrompt(ctaType: string): string {
  const templates = CTA_TEMPLATES[ctaType];
  if (!templates || templates.length === 0) return `CTA type: ${ctaType}`;
  const examples = templates.map(t => `"${t.text}" (urgency: ${t.urgency})`).join(', ');
  return `CTA type "${ctaType}" \u2014 examples: ${examples}`;
}

// ── Helper: Get funnel guidelines as prompt text ───────────────

export function getFunnelGuidelinesPrompt(funnelStage: string): string {
  const guidelines = FUNNEL_STAGE_GUIDELINES[funnelStage];
  if (!guidelines) return '';
  return `FUNNEL STAGE: ${funnelStage.toUpperCase()}
- Focus: ${guidelines.focus}
- Tone: ${guidelines.tone}
- CTA style: ${guidelines.ctaStyle}`;
}
