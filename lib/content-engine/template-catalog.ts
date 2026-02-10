/**
 * Client-safe template catalog for the Templates card UI.
 * No server imports — safe to use in 'use client' components.
 */

export interface TemplateOption {
  key: string;
  name: string;
  type: 'script' | 'hook' | 'cta';
  formatCategories: string[];
  description: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  // ── Short scripts (5) ──────────────────────────────────────
  { key: 'problem_insight_reframe', name: 'Problem → Insight → Reframe', type: 'script', formatCategories: ['short'], description: 'Name the problem, deliver surprising insight, reframe thinking' },
  { key: 'myth_truth_proof', name: 'Myth → Truth → Proof', type: 'script', formatCategories: ['short'], description: 'Challenge a common belief with evidence' },
  { key: 'how_it_works', name: 'How It Works', type: 'script', formatCategories: ['short'], description: 'Quick explanation of a process or mechanism' },
  { key: 'behind_the_scenes', name: 'Behind the Scenes → Meaning', type: 'script', formatCategories: ['short'], description: 'Show a behind-the-scenes moment and attach meaning' },
  { key: 'comparison_choice', name: 'Comparison / Choice', type: 'script', formatCategories: ['short'], description: 'Compare two paths and highlight the better option' },

  // ── Medium scripts (4) ─────────────────────────────────────
  { key: 'three_point_breakdown', name: '3-Point Breakdown', type: 'script', formatCategories: ['medium'], description: 'Three key points with depth and context' },
  { key: 'step_by_step_system', name: 'Step-By-Step System', type: 'script', formatCategories: ['medium'], description: 'Walk through a process in clear steps' },
  { key: 'problem_cause_solution', name: 'Problem → Cause → Solution', type: 'script', formatCategories: ['medium'], description: 'Identify the problem, explain root cause, deliver solution' },
  { key: 'case_study_example', name: 'Case Study / Example', type: 'script', formatCategories: ['medium'], description: 'Real example or case study with results' },

  // ── Long scripts (3) ───────────────────────────────────────
  { key: 'multi_phase_framework', name: 'Multi-Phase Framework', type: 'script', formatCategories: ['long'], description: 'Comprehensive multi-phase teaching framework' },
  { key: 'step_by_step_deep', name: 'Step-By-Step System (Deep)', type: 'script', formatCategories: ['long'], description: 'Deep-dive step-by-step system with examples' },
  { key: 'diagnostic_breakdown', name: 'Diagnostic Breakdown', type: 'script', formatCategories: ['long'], description: 'Diagnose a complex problem layer by layer' },

  // ── Carousel scripts (4) ───────────────────────────────────
  { key: 'problem_steps_cta', name: 'Problem → Steps → CTA', type: 'script', formatCategories: ['carousel'], description: 'Slide-by-slide problem, steps, and call to action' },
  { key: 'myth_buster', name: 'Myth Buster', type: 'script', formatCategories: ['carousel'], description: 'Bust myths one slide at a time' },
  { key: 'before_after', name: 'Before / After', type: 'script', formatCategories: ['carousel'], description: 'Show transformation from before to after' },
  { key: 'list_tips', name: 'List / Tips', type: 'script', formatCategories: ['carousel'], description: 'Numbered tips or list format' },

  // ── Static scripts (4) ─────────────────────────────────────
  { key: 'stat_insight', name: 'Stat + Insight', type: 'script', formatCategories: ['static'], description: 'Lead with a statistic, add insight' },
  { key: 'quote_card', name: 'Quote Card', type: 'script', formatCategories: ['static'], description: 'Powerful quote with visual direction' },
  { key: 'framework_visual', name: 'Framework Visual', type: 'script', formatCategories: ['static'], description: 'Visual representation of a framework' },
  { key: 'comparison_split', name: 'Comparison Split', type: 'script', formatCategories: ['static'], description: 'Side-by-side comparison visual' },

  // ── Hook styles (5) — all formats ──────────────────────────
  { key: 'direct_pain', name: 'Direct Pain', type: 'hook', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Name the exact pain point immediately' },
  { key: 'contrarian', name: 'Contrarian', type: 'hook', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Challenge a common belief or conventional wisdom' },
  { key: 'outcome_first', name: 'Outcome-First', type: 'hook', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Lead with the desirable result' },
  { key: 'curiosity_gap', name: 'Curiosity Gap', type: 'hook', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Create an open loop that demands resolution' },
  { key: 'visual_action', name: 'Visual Action', type: 'hook', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Start with a visual or action-based hook' },

  // ── CTA styles (4) — all formats ───────────────────────────
  { key: 'soft_engagement', name: 'Soft Engagement', type: 'cta', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Follow, comment, save — low commitment' },
  { key: 'consideration', name: 'Consideration', type: 'cta', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Share, DM, link in bio — medium commitment' },
  { key: 'direct_action', name: 'Direct Action', type: 'cta', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Clear conversion action referencing the offer' },
  { key: 'authority_loop', name: 'Authority Loop', type: 'cta', formatCategories: ['short', 'medium', 'long', 'carousel', 'static'], description: 'Position as ongoing authority source' },
];

/** Filter templates by format category */
export function getTemplatesForFormat(formatCategory: string) {
  return {
    scripts: TEMPLATE_OPTIONS.filter(t => t.type === 'script' && t.formatCategories.includes(formatCategory)),
    hooks: TEMPLATE_OPTIONS.filter(t => t.type === 'hook'),
    ctas: TEMPLATE_OPTIONS.filter(t => t.type === 'cta'),
  };
}

/** Get a template option by key */
export function getTemplateByKey(key: string): TemplateOption | undefined {
  return TEMPLATE_OPTIONS.find(t => t.key === key);
}
