import type { FunnelStage, StoryBrandStage } from '@/types/database';

// ============================================================
// CONTENT FORMAT TYPES
// ============================================================

export type ContentFormat =
  | 'short_video_30_60'
  | 'short_video_60_90'
  | 'short_video_60_120'
  | 'medium_video_2_3'
  | 'medium_video_4_6'
  | 'medium_video_7_10'
  | 'long_video_10_15'
  | 'long_video_20_30'
  | 'long_video_30_45'
  | 'carousel_5_7'
  | 'static_infographic';

export type FormatCategory = 'short' | 'medium' | 'long' | 'carousel' | 'static';

export function getFormatCategory(format: ContentFormat): FormatCategory {
  if (format.startsWith('short_video')) return 'short';
  if (format.startsWith('medium_video')) return 'medium';
  if (format.startsWith('long_video')) return 'long';
  if (format === 'carousel_5_7') return 'carousel';
  return 'static';
}

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  short_video_30_60: 'Short Video (30-60s)',
  short_video_60_90: 'Short Video (60-90s)',
  short_video_60_120: 'Short Video (60-120s)',
  medium_video_2_3: 'Medium Video (2-3 min)',
  medium_video_4_6: 'Medium Video (4-6 min)',
  medium_video_7_10: 'Medium Video (7-10 min)',
  long_video_10_15: 'Long Video (10-15 min)',
  long_video_20_30: 'Long Video (20-30 min)',
  long_video_30_45: 'Long Video (30-45+ min)',
  carousel_5_7: 'Carousel (5-7 slides)',
  static_infographic: 'Static Infographic',
};

// ============================================================
// SHORT-FORM SCRIPT TEMPLATES
// ============================================================

export type ShortScriptTemplate =
  | 'problem_insight_reframe'
  | 'myth_truth_proof'
  | 'how_it_works'
  | 'behind_the_scenes'
  | 'comparison_choice';

export const SHORT_SCRIPT_TEMPLATES: Record<ShortScriptTemplate, {
  name: string;
  structure: string;
  bestFor: string;
  promptInstructions: string;
}> = {
  problem_insight_reframe: {
    name: 'Problem → Insight → Reframe',
    structure: 'HOOK (0-3s) → Name the problem → Deliver a surprising insight → Reframe how they should think about it → CTA (last 2-3s)',
    bestFor: 'awareness + character, external_problem, internal_problem',
    promptInstructions: `Structure the script as:
1. HOOK (0-3s): Open with the viewer's pain point or problem
2. SCRIPT BODY: Name the specific problem they face → Deliver one surprising insight they haven't considered → Reframe how they should think about this problem
3. CTA (last 2-3s): Close with the appropriate call-to-action`,
  },
  myth_truth_proof: {
    name: 'Myth → Truth → Proof',
    structure: 'HOOK (0-3s) → State the common myth → Reveal the truth → Provide proof/evidence → CTA (last 2-3s)',
    bestFor: 'awareness + philosophical_problem; consideration + guide',
    promptInstructions: `Structure the script as:
1. HOOK (0-3s): Challenge a widely-held belief
2. SCRIPT BODY: State the common myth/belief in the industry → Reveal the actual truth with authority → Provide brief proof or evidence
3. CTA (last 2-3s): Close with the appropriate call-to-action`,
  },
  how_it_works: {
    name: 'How It Works',
    structure: 'HOOK (0-3s) → Present the method/system → Walk through 2-3 quick steps → CTA (last 2-3s)',
    bestFor: 'consideration + plan',
    promptInstructions: `Structure the script as:
1. HOOK (0-3s): Tease the result or method
2. SCRIPT BODY: Present the system/method name → Walk through 2-3 quick steps or components → Show the outcome
3. CTA (last 2-3s): Close with the appropriate call-to-action`,
  },
  behind_the_scenes: {
    name: 'Behind the Scenes → Meaning',
    structure: 'HOOK (0-3s) → Show a real moment/process → Explain why it matters → Connect to bigger message → CTA (last 2-3s)',
    bestFor: 'consideration + guide; awareness + character',
    promptInstructions: `Structure the script as:
1. HOOK (0-3s): Pull them into a real moment
2. SCRIPT BODY: Describe a real behind-the-scenes moment or process → Explain why this matters and what it reveals → Connect it to the bigger brand message
3. CTA (last 2-3s): Close with the appropriate call-to-action`,
  },
  comparison_choice: {
    name: 'Comparison / Choice',
    structure: 'HOOK (0-3s) → Present option A (the wrong way) → Present option B (the right way) → Make the choice clear → CTA (last 2-3s)',
    bestFor: 'conversion + call_to_action, failure, success',
    promptInstructions: `Structure the script as:
1. HOOK (0-3s): Present a decision or crossroads
2. SCRIPT BODY: Show option A (the common/wrong approach) → Show option B (the better/right approach) → Make the contrast and choice unmistakable
3. CTA (last 2-3s): Close with the appropriate call-to-action`,
  },
};

// ============================================================
// HOOK TEMPLATES
// ============================================================

export type HookTemplate =
  | 'direct_pain'
  | 'contrarian'
  | 'outcome_first'
  | 'curiosity_gap'
  | 'visual_action';

export const HOOK_TEMPLATES: Record<HookTemplate, {
  name: string;
  description: string;
  promptInstructions: string;
}> = {
  direct_pain: {
    name: 'Direct Pain',
    description: 'Name the viewer\'s exact pain point in the first line',
    promptInstructions: 'Open by naming the viewer\'s specific pain point directly. Use their exact language from the ICP pains. Example: "If you\'re still [pain point], here\'s what no one tells you..."',
  },
  contrarian: {
    name: 'Contrarian',
    description: 'Challenge a common belief or conventional wisdom',
    promptInstructions: 'Open with a bold, contrarian statement that challenges what most people believe. Example: "Stop [common advice]. It\'s actually making things worse."',
  },
  outcome_first: {
    name: 'Outcome-First',
    description: 'Lead with the desirable result',
    promptInstructions: 'Open by painting the desirable outcome first, then pull them in. Example: "What if [desired outcome] was possible in [timeframe]?"',
  },
  curiosity_gap: {
    name: 'Curiosity Gap',
    description: 'Create an open loop that demands resolution',
    promptInstructions: 'Open with an incomplete statement that creates an irresistible knowledge gap. Example: "There\'s one thing [successful people] do that [target audience] never will..."',
  },
  visual_action: {
    name: 'Visual Action',
    description: 'Start with a visual or action-based hook',
    promptInstructions: 'Open with a visual direction or action that grabs attention. Include a filming note for the visual element. Example: "[Visual: hands on desk, frustrated] You know that feeling when..."',
  },
};

// ============================================================
// CTA TEMPLATES
// ============================================================

export type CTATemplate =
  | 'soft_engagement'
  | 'consideration'
  | 'direct_action'
  | 'authority_loop';

export const CTA_TEMPLATES: Record<CTATemplate, {
  name: string;
  description: string;
  promptInstructions: string;
}> = {
  soft_engagement: {
    name: 'Soft Engagement',
    description: 'Low-commitment social engagement (follow, comment, save)',
    promptInstructions: 'End with a soft, low-commitment CTA that builds community. Example: "Follow for more [topic]", "Save this for later", "Drop a [emoji] if this hit home"',
  },
  consideration: {
    name: 'Consideration',
    description: 'Medium-commitment engagement (share, DM, link in bio)',
    promptInstructions: 'End with a medium-commitment CTA that moves them closer. Example: "Share this with someone who needs to hear it", "DM me [keyword] for the full breakdown", "Link in bio for the complete guide"',
  },
  direct_action: {
    name: 'Direct Action',
    description: 'Clear conversion action referencing the offer',
    promptInstructions: 'End with a direct, clear CTA that references the actual offer by name. Example: "Ready to [outcome]? [Offer name] is how we help. Link in bio."',
  },
  authority_loop: {
    name: 'Authority Loop',
    description: 'Position as ongoing authority source',
    promptInstructions: 'End by positioning yourself as the ongoing authority and reason to stay connected. Example: "I break down [topic] every week. Follow so you don\'t miss the next one."',
  },
};

// ============================================================
// MEDIUM-FORM TEACHING FORMATS
// ============================================================

export type MediumTeachingFormat =
  | 'three_point_breakdown'
  | 'step_by_step_system'
  | 'problem_cause_solution'
  | 'case_study_example';

export const MEDIUM_TEACHING_FORMATS: Record<MediumTeachingFormat, {
  name: string;
  structure: string;
  bestFor: string;
  promptInstructions: string;
}> = {
  three_point_breakdown: {
    name: '3-Point Breakdown',
    structure: 'Hook → Context → Point 1 → Point 2 → Point 3 → Reframe → CTA',
    bestFor: 'awareness + guide, plan; frameworks & strategy education',
    promptInstructions: `Structure the medium-form script as:
1. HOOK (0-10s): Tease the 3 key points
2. CONTEXT (10-30s): Set up who this is for and what's at stake
3. TEACHING: Break into exactly 3 clear teaching points with transitions
4. REFRAME: Tie all 3 points together with a new perspective
5. CTA: Close with the appropriate call-to-action`,
  },
  step_by_step_system: {
    name: 'Step-By-Step System',
    structure: 'Hook → Context → Step 1 → Step 2 → Step 3 → Reframe → CTA',
    bestFor: 'consideration + plan; processes & how-to',
    promptInstructions: `Structure the medium-form script as:
1. HOOK (0-10s): Tease the system/process outcome
2. CONTEXT (10-30s): Explain what this system solves and for whom
3. TEACHING: Walk through the steps sequentially, each building on the last
4. REFRAME: Show what changes when they implement this system
5. CTA: Close with the appropriate call-to-action`,
  },
  problem_cause_solution: {
    name: 'Problem → Cause → Solution',
    structure: 'Hook → Context → Problem deep dive → Root cause → Solution → Reframe → CTA',
    bestFor: 'awareness + external_problem, internal_problem; diagnostic authority',
    promptInstructions: `Structure the medium-form script as:
1. HOOK (0-10s): Name the problem boldly
2. CONTEXT (10-30s): Validate their experience with this problem
3. TEACHING: Deep dive into the problem → Reveal the root cause most people miss → Present the solution framework
4. REFRAME: Change how they see the problem entirely
5. CTA: Close with the appropriate call-to-action`,
  },
  case_study_example: {
    name: 'Case Study / Example',
    structure: 'Hook → Context → Before state → What changed → After state → Lessons → CTA',
    bestFor: 'conversion + success, failure; proof & trust',
    promptInstructions: `Structure the medium-form script as:
1. HOOK (0-10s): Tease the transformation result
2. CONTEXT (10-30s): Set up the scenario/client/example
3. TEACHING: Describe the before state → Explain what changed and why → Show the after state → Extract the key lessons
4. REFRAME: Connect this example to the viewer's situation
5. CTA: Close with the appropriate call-to-action`,
  },
};

// ============================================================
// LONG-FORM TEACHING STRUCTURES
// ============================================================

export type LongTeachingStructure =
  | 'multi_phase_framework'
  | 'step_by_step_deep'
  | 'diagnostic_breakdown';

export const LONG_TEACHING_STRUCTURES: Record<LongTeachingStructure, {
  name: string;
  structure: string;
  bestFor: string;
  promptInstructions: string;
}> = {
  multi_phase_framework: {
    name: 'Multi-Phase Framework',
    structure: 'Hook → Context → Problem Expansion → Phase 1 → Phase 2 → Phase 3 → Case Study → Reframe → CTA',
    bestFor: 'conversion + plan, guide; business frameworks & growth systems',
    promptInstructions: `Structure the long-form script as:
1. HOOK (0-30s): Bold opening that promises comprehensive value
2. CONTEXT (30s-2min): Who this is for, what they'll learn, why it matters
3. PROBLEM EXPANSION: Deep dive into the problem landscape, costs, and false solutions
4. FRAMEWORK TEACHING: Present a multi-phase framework. Each phase gets its own section with explanation, examples, and implementation steps
5. CASE STUDY: Walk through a real-world application of the framework
6. REFRAME: Synthesize everything into a new worldview
7. CTA: Close with direct action referencing the offer`,
  },
  step_by_step_deep: {
    name: 'Step-By-Step System (Deep)',
    structure: 'Hook → Context → Problem Expansion → Step 1 (deep) → Step 2 (deep) → Step 3 (deep) → Implementation → CTA',
    bestFor: 'consideration + plan; implementation & operational walkthroughs',
    promptInstructions: `Structure the long-form script as:
1. HOOK (0-30s): Promise a complete implementation guide
2. CONTEXT (30s-2min): Set up the problem and what they'll be able to do after watching
3. PROBLEM EXPANSION: Show why most attempts at this fail
4. FRAMEWORK TEACHING: Deep dive into each step with detailed implementation, common mistakes, and pro tips
5. CASE STUDY: Show an implementation example with real results
6. REFRAME: Position this system as the missing piece
7. CTA: Close with direct action referencing the offer`,
  },
  diagnostic_breakdown: {
    name: 'Diagnostic Breakdown',
    structure: 'Hook → Context → Industry Analysis → Root Causes → Framework → Proof → Reframe → CTA',
    bestFor: 'consideration + guide; consulting positioning & strategic authority',
    promptInstructions: `Structure the long-form script as:
1. HOOK (0-30s): Make a bold diagnostic claim about the industry/problem
2. CONTEXT (30s-2min): Establish authority and frame the analysis
3. PROBLEM EXPANSION: Break down the industry landscape, common approaches, and why they fail
4. FRAMEWORK TEACHING: Present the diagnostic framework - how to identify the real issues and what to do about them
5. CASE STUDY: Apply the diagnostic to a specific example
6. REFRAME: Reframe the entire problem through the diagnostic lens
7. CTA: Close with direct action referencing the offer`,
  },
};

// ============================================================
// CAROUSEL TEMPLATES
// ============================================================

export type CarouselTemplate =
  | 'problem_steps_cta'
  | 'myth_buster'
  | 'before_after'
  | 'list_tips';

export const CAROUSEL_TEMPLATES: Record<CarouselTemplate, {
  name: string;
  structure: string;
  bestFor: string;
  promptInstructions: string;
}> = {
  problem_steps_cta: {
    name: 'Problem → Steps → CTA',
    structure: 'S1: hook/problem → S2-5: solution steps → S6: reframe → S7: CTA',
    bestFor: 'consideration + plan',
    promptInstructions: `Create a 7-slide carousel:
Slide 1: Hook slide - name the problem in a bold headline
Slides 2-5: Solution steps - one clear step per slide with a brief explanation
Slide 6: Reframe - tie the steps together with a new perspective
Slide 7: CTA slide - clear call to action
Each slide should have: headline text, body text (1-2 sentences max), and a visual direction note.`,
  },
  myth_buster: {
    name: 'Myth Buster',
    structure: 'S1: common belief → S2-5: why wrong + truth → S6: what to do → S7: CTA',
    bestFor: 'awareness + philosophical_problem',
    promptInstructions: `Create a 7-slide carousel:
Slide 1: State the common myth/belief boldly
Slides 2-5: Break down why it's wrong and reveal the truth (one angle per slide)
Slide 6: What to do instead - actionable takeaway
Slide 7: CTA slide
Each slide should have: headline text, body text (1-2 sentences max), and a visual direction note.`,
  },
  before_after: {
    name: 'Before / After',
    structure: 'S1: pain state → S2-3: what\'s wrong → S4-5: transformation → S6: how → S7: CTA',
    bestFor: 'conversion + success, failure',
    promptInstructions: `Create a 7-slide carousel:
Slide 1: Paint the painful "before" state
Slides 2-3: Dig into what's going wrong and why
Slides 4-5: Show the transformation and "after" state
Slide 6: Explain how to get there
Slide 7: CTA slide
Each slide should have: headline text, body text (1-2 sentences max), and a visual direction note.`,
  },
  list_tips: {
    name: 'List / Tips',
    structure: 'S1: "X things..." → S2-6: one tip per slide → S7: CTA',
    bestFor: 'awareness + guide, character',
    promptInstructions: `Create a 7-slide carousel:
Slide 1: Hook with "X things/tips/ways..." headline
Slides 2-6: One valuable tip per slide with brief explanation
Slide 7: CTA slide
Each slide should have: headline text, body text (1-2 sentences max), and a visual direction note.`,
  },
};

// ============================================================
// STATIC INFOGRAPHIC TEMPLATES
// ============================================================

export type StaticTemplate =
  | 'stat_insight'
  | 'quote_card'
  | 'framework_visual'
  | 'comparison_split';

export const STATIC_TEMPLATES: Record<StaticTemplate, {
  name: string;
  structure: string;
  bestFor: string;
  promptInstructions: string;
}> = {
  stat_insight: {
    name: 'Stat + Insight',
    structure: 'Bold stat/number + 1-line insight + brand positioning',
    bestFor: 'awareness + external_problem',
    promptInstructions: `Create a static infographic with:
- headline: A bold, attention-grabbing statistic or number
- body_text: A 1-line insight that contextualizes the stat
- visual_direction: Design notes for the visual treatment (color emphasis, layout)
- Brand positioning element at the bottom`,
  },
  quote_card: {
    name: 'Quote Card',
    structure: 'Authority quote + context line + CTA',
    bestFor: 'awareness + guide, character',
    promptInstructions: `Create a static infographic with:
- headline: A powerful, quotable statement from the brand's perspective
- body_text: A context line that adds depth to the quote
- visual_direction: Design notes (quote marks, typography hierarchy, brand elements)`,
  },
  framework_visual: {
    name: 'Framework Visual',
    structure: 'Named framework/process (3-4 steps) visualized',
    bestFor: 'consideration + plan',
    promptInstructions: `Create a static infographic with:
- headline: The framework/process name
- body_text: Brief description of each step (3-4 steps max, formatted as numbered list)
- visual_direction: Layout notes for visualizing the framework (flow, hierarchy, icons)`,
  },
  comparison_split: {
    name: 'Comparison Split',
    structure: 'Side-by-side "wrong way vs right way"',
    bestFor: 'conversion + call_to_action',
    promptInstructions: `Create a static infographic with:
- headline: The comparison framing (e.g., "What most people do vs. What works")
- body_text: Left side (wrong way, 3-4 bullet points) vs Right side (right way, 3-4 bullet points)
- visual_direction: Split layout notes (colors, contrast, visual hierarchy)`,
  },
};

// ============================================================
// AUTO-SELECTION MAPPING
// ============================================================

type StageCombo = `${FunnelStage}_${StoryBrandStage}`;

const SHORT_TEMPLATE_MAP: Partial<Record<StageCombo, ShortScriptTemplate>> = {
  awareness_character: 'problem_insight_reframe',
  awareness_external_problem: 'problem_insight_reframe',
  awareness_internal_problem: 'problem_insight_reframe',
  awareness_philosophical_problem: 'myth_truth_proof',
  awareness_guide: 'behind_the_scenes',
  awareness_plan: 'how_it_works',
  awareness_call_to_action: 'comparison_choice',
  awareness_failure: 'problem_insight_reframe',
  awareness_success: 'behind_the_scenes',
  consideration_character: 'behind_the_scenes',
  consideration_external_problem: 'problem_insight_reframe',
  consideration_internal_problem: 'problem_insight_reframe',
  consideration_philosophical_problem: 'myth_truth_proof',
  consideration_guide: 'myth_truth_proof',
  consideration_plan: 'how_it_works',
  consideration_call_to_action: 'comparison_choice',
  consideration_failure: 'comparison_choice',
  consideration_success: 'behind_the_scenes',
  conversion_character: 'behind_the_scenes',
  conversion_external_problem: 'comparison_choice',
  conversion_internal_problem: 'comparison_choice',
  conversion_philosophical_problem: 'myth_truth_proof',
  conversion_guide: 'how_it_works',
  conversion_plan: 'how_it_works',
  conversion_call_to_action: 'comparison_choice',
  conversion_failure: 'comparison_choice',
  conversion_success: 'comparison_choice',
};

const HOOK_MAP: Partial<Record<FunnelStage, HookTemplate>> = {
  awareness: 'direct_pain',
  consideration: 'curiosity_gap',
  conversion: 'outcome_first',
};

const CTA_MAP: Partial<Record<FunnelStage, CTATemplate>> = {
  awareness: 'soft_engagement',
  consideration: 'consideration',
  conversion: 'direct_action',
};

const MEDIUM_TEMPLATE_MAP: Partial<Record<StageCombo, MediumTeachingFormat>> = {
  awareness_character: 'three_point_breakdown',
  awareness_external_problem: 'problem_cause_solution',
  awareness_internal_problem: 'problem_cause_solution',
  awareness_philosophical_problem: 'problem_cause_solution',
  awareness_guide: 'three_point_breakdown',
  awareness_plan: 'three_point_breakdown',
  awareness_call_to_action: 'case_study_example',
  awareness_failure: 'problem_cause_solution',
  awareness_success: 'case_study_example',
  consideration_character: 'three_point_breakdown',
  consideration_external_problem: 'problem_cause_solution',
  consideration_internal_problem: 'problem_cause_solution',
  consideration_philosophical_problem: 'problem_cause_solution',
  consideration_guide: 'step_by_step_system',
  consideration_plan: 'step_by_step_system',
  consideration_call_to_action: 'case_study_example',
  consideration_failure: 'problem_cause_solution',
  consideration_success: 'case_study_example',
  conversion_character: 'case_study_example',
  conversion_external_problem: 'problem_cause_solution',
  conversion_internal_problem: 'problem_cause_solution',
  conversion_philosophical_problem: 'problem_cause_solution',
  conversion_guide: 'step_by_step_system',
  conversion_plan: 'step_by_step_system',
  conversion_call_to_action: 'case_study_example',
  conversion_failure: 'case_study_example',
  conversion_success: 'case_study_example',
};

const LONG_TEMPLATE_MAP: Partial<Record<StageCombo, LongTeachingStructure>> = {
  awareness_character: 'diagnostic_breakdown',
  awareness_external_problem: 'diagnostic_breakdown',
  awareness_internal_problem: 'diagnostic_breakdown',
  awareness_philosophical_problem: 'diagnostic_breakdown',
  awareness_guide: 'multi_phase_framework',
  awareness_plan: 'multi_phase_framework',
  awareness_call_to_action: 'multi_phase_framework',
  awareness_failure: 'diagnostic_breakdown',
  awareness_success: 'multi_phase_framework',
  consideration_character: 'diagnostic_breakdown',
  consideration_external_problem: 'diagnostic_breakdown',
  consideration_internal_problem: 'diagnostic_breakdown',
  consideration_philosophical_problem: 'diagnostic_breakdown',
  consideration_guide: 'diagnostic_breakdown',
  consideration_plan: 'step_by_step_deep',
  consideration_call_to_action: 'multi_phase_framework',
  consideration_failure: 'diagnostic_breakdown',
  consideration_success: 'multi_phase_framework',
  conversion_character: 'multi_phase_framework',
  conversion_external_problem: 'multi_phase_framework',
  conversion_internal_problem: 'multi_phase_framework',
  conversion_philosophical_problem: 'diagnostic_breakdown',
  conversion_guide: 'multi_phase_framework',
  conversion_plan: 'multi_phase_framework',
  conversion_call_to_action: 'multi_phase_framework',
  conversion_failure: 'multi_phase_framework',
  conversion_success: 'multi_phase_framework',
};

const CAROUSEL_TEMPLATE_MAP: Partial<Record<StageCombo, CarouselTemplate>> = {
  awareness_character: 'list_tips',
  awareness_external_problem: 'myth_buster',
  awareness_internal_problem: 'myth_buster',
  awareness_philosophical_problem: 'myth_buster',
  awareness_guide: 'list_tips',
  awareness_plan: 'problem_steps_cta',
  awareness_call_to_action: 'before_after',
  awareness_failure: 'myth_buster',
  awareness_success: 'before_after',
  consideration_character: 'list_tips',
  consideration_external_problem: 'myth_buster',
  consideration_internal_problem: 'myth_buster',
  consideration_philosophical_problem: 'myth_buster',
  consideration_guide: 'list_tips',
  consideration_plan: 'problem_steps_cta',
  consideration_call_to_action: 'before_after',
  consideration_failure: 'myth_buster',
  consideration_success: 'before_after',
  conversion_character: 'before_after',
  conversion_external_problem: 'before_after',
  conversion_internal_problem: 'before_after',
  conversion_philosophical_problem: 'myth_buster',
  conversion_guide: 'problem_steps_cta',
  conversion_plan: 'problem_steps_cta',
  conversion_call_to_action: 'before_after',
  conversion_failure: 'before_after',
  conversion_success: 'before_after',
};

const STATIC_TEMPLATE_MAP: Partial<Record<StageCombo, StaticTemplate>> = {
  awareness_character: 'quote_card',
  awareness_external_problem: 'stat_insight',
  awareness_internal_problem: 'stat_insight',
  awareness_philosophical_problem: 'stat_insight',
  awareness_guide: 'quote_card',
  awareness_plan: 'framework_visual',
  awareness_call_to_action: 'comparison_split',
  awareness_failure: 'stat_insight',
  awareness_success: 'quote_card',
  consideration_character: 'quote_card',
  consideration_external_problem: 'stat_insight',
  consideration_internal_problem: 'stat_insight',
  consideration_philosophical_problem: 'stat_insight',
  consideration_guide: 'quote_card',
  consideration_plan: 'framework_visual',
  consideration_call_to_action: 'comparison_split',
  consideration_failure: 'stat_insight',
  consideration_success: 'quote_card',
  conversion_character: 'quote_card',
  conversion_external_problem: 'comparison_split',
  conversion_internal_problem: 'comparison_split',
  conversion_philosophical_problem: 'stat_insight',
  conversion_guide: 'framework_visual',
  conversion_plan: 'framework_visual',
  conversion_call_to_action: 'comparison_split',
  conversion_failure: 'comparison_split',
  conversion_success: 'comparison_split',
};

// ============================================================
// DURATION GUIDANCE
// ============================================================

const MEDIUM_DURATION_GUIDANCE: Record<string, string> = {
  medium_video_2_3: '2-3 minutes: Hook + 2 teaching points + CTA. Keep it tight and focused.',
  medium_video_4_6: '4-6 minutes: Hook + Context + 3 teaching points + Reframe + CTA. Full medium-form structure.',
  medium_video_7_10: '7-10 minutes: Hook + Context + Deep teaching + Example + Reframe + CTA. Most comprehensive medium-form.',
};

const LONG_DURATION_GUIDANCE: Record<string, string> = {
  long_video_10_15: '10-15 minutes: Hook + Context + Framework overview + CTA. Introductory long-form.',
  long_video_20_30: '20-30 minutes: Hook + Context + Problem expansion + Framework deep dive + Case study + CTA. Standard authority piece.',
  long_video_30_45: '30-45+ minutes: Hook + Context + Industry breakdown + Multi-phase framework + Case studies + Reframe + CTA. Flagship content.',
};

// ============================================================
// OUTPUT FORMAT DEFINITIONS
// ============================================================

const CAPTION_INSTRUCTIONS = `The "caption" is a UNIVERSAL fallback post description. But the REAL descriptions go in "platform_captions" — see below.`;

// Helper to build platform-specific output instructions
function buildPlatformOutputFields(platforms: string[]): string {
  const platformCaptionFields = platforms.map(p => {
    const limits: Record<string, { caption: number; hashtags: number; tone: string }> = {
      linkedin: { caption: 3000, hashtags: 10, tone: 'professional, thought-leadership, value-driven. Use line breaks for readability. Include a hook in the first 2 lines (shown before "see more"). End with a clear CTA.' },
      facebook: { caption: 3000, hashtags: 10, tone: 'conversational, relatable, community-driven. Use short paragraphs. Ask questions to drive engagement. End with a CTA or question.' },
      instagram: { caption: 2200, hashtags: 30, tone: 'visual storytelling, aspirational, authentic. Lead with a strong first line. Use emojis sparingly. Put hashtags at the end separated by dots/line breaks.' },
      twitter: { caption: 280, hashtags: 3, tone: 'punchy, direct, sharp. Every word counts. Use 1-2 hashtags inline only. Be provocative or insightful.' },
      tiktok: { caption: 2200, hashtags: 15, tone: 'casual, trendy, authentic, hook-driven. Short punchy lines. Use relevant trending hashtags.' },
    };
    const info = limits[p] || { caption: 2000, hashtags: 5, tone: 'professional' };
    return `    "${p}": "A UNIQUE post description for ${p} (max ${info.caption} chars, tone: ${info.tone})"`;
  }).join(',\n');

  const platformHashtagFields = platforms.map(p => {
    const maxTags: Record<string, number> = { linkedin: 10, facebook: 10, instagram: 30, twitter: 3, tiktok: 15 };
    return `    "${p}": ["hashtag1", "hashtag2"] // max ${maxTags[p] || 5} hashtags, NO # prefix`;
  }).join(',\n');

  return `  "caption": "Universal fallback post description (~300 chars, used if platform-specific not available)",
  "platform_captions": {
${platformCaptionFields}
  },
  "hashtags": ["universal", "hashtags", "without_hash_prefix"],
  "platform_hashtags": {
${platformHashtagFields}
  }`;
}

export function getOutputFormat(formatKey: string, platforms: string[]): string {
  const platformFields = buildPlatformOutputFields(platforms);
  const formats: Record<string, string> = {
    short: `Return a JSON object with these exact fields:
{
  "title": "Compelling title for the post",
  "hook": "The 0-3 second hook text",
  "script_body": "The main script body (problem/insight/teaching section). Write each sentence on its own line for easy reading.",
  "cta": "The closing call-to-action (2-3 seconds)",
  "filming_notes": "Specific filming/visual directions for the creator",
${platformFields}
}`,
    medium: `Return a JSON object with these exact fields:
{
  "title": "Compelling title for the post",
  "hook": "The 0-10 second hook text",
  "context_section": "The context section (10-30 seconds) setting up who this is for",
  "teaching_points": "The core teaching body with clear sections/points. Write each sentence on its own line.",
  "reframe": "The reframe section tying everything together",
  "cta": "The closing call-to-action",
  "filming_notes": "Specific filming/visual/B-roll directions for the creator",
${platformFields}
}`,
    long: `Return a JSON object with these exact fields:
{
  "title": "Compelling title for the post",
  "hook": "The 0-30 second hook text",
  "context_section": "Context section (30s-2min) establishing authority and framing",
  "problem_expansion": "Deep dive into the problem landscape, costs, false solutions. Write each sentence on its own line.",
  "framework_teaching": "The core framework/teaching content with detailed sections. Write each sentence on its own line.",
  "case_study": "Case study or application example",
  "reframe": "Synthesis and worldview reframe",
  "cta": "The closing call-to-action",
  "filming_notes": "Detailed filming/visual/B-roll/graphics directions",
${platformFields}
}`,
    carousel: `Return a JSON object with these exact fields:
{
  "title": "Compelling title for the carousel",
  "slides": [
    {"slide_number": 1, "text": "Headline + body text for this slide", "visual_direction": "Design notes for this slide"},
    {"slide_number": 2, "text": "...", "visual_direction": "..."},
    {"slide_number": 3, "text": "...", "visual_direction": "..."},
    {"slide_number": 4, "text": "...", "visual_direction": "..."},
    {"slide_number": 5, "text": "...", "visual_direction": "..."},
    {"slide_number": 6, "text": "...", "visual_direction": "..."},
    {"slide_number": 7, "text": "...", "visual_direction": "..."}
  ],
${platformFields}
}`,
    static: `Return a JSON object with these exact fields:
{
  "title": "Title for the infographic post",
  "headline": "The main bold headline/stat on the graphic",
  "body_text": "Supporting text on the graphic",
  "visual_direction": "Detailed design direction (layout, colors, typography, elements)",
${platformFields}
}`,
  };
  return formats[formatKey] || formats.short;
}

// Legacy OUTPUT_FORMATS kept for backward compatibility
export const OUTPUT_FORMATS = {
  short: `Return a JSON object with these exact fields:
{
  "title": "Compelling title for the post",
  "hook": "The 0-3 second hook text",
  "script_body": "The main script body (problem/insight/teaching section)",
  "cta": "The closing call-to-action (2-3 seconds)",
  "filming_notes": "Specific filming/visual directions for the creator",
  "caption": "Post description — ${CAPTION_INSTRUCTIONS}",
  "hashtags": ["relevant", "hashtags", "array"]
}`,
  medium: `Return a JSON object with these exact fields:
{
  "title": "Compelling title for the post",
  "hook": "The 0-10 second hook text",
  "context_section": "The context section (10-30 seconds) setting up who this is for",
  "teaching_points": "The core teaching body with clear sections/points",
  "reframe": "The reframe section tying everything together",
  "cta": "The closing call-to-action",
  "filming_notes": "Specific filming/visual/B-roll directions for the creator",
  "caption": "Post description — ${CAPTION_INSTRUCTIONS}",
  "hashtags": ["relevant", "hashtags", "array"]
}`,
  long: `Return a JSON object with these exact fields:
{
  "title": "Compelling title for the post",
  "hook": "The 0-30 second hook text",
  "context_section": "Context section (30s-2min) establishing authority and framing",
  "problem_expansion": "Deep dive into the problem landscape, costs, false solutions",
  "framework_teaching": "The core framework/teaching content with detailed sections",
  "case_study": "Case study or application example",
  "reframe": "Synthesis and worldview reframe",
  "cta": "The closing call-to-action",
  "filming_notes": "Detailed filming/visual/B-roll/graphics directions",
  "caption": "Post description — ${CAPTION_INSTRUCTIONS}",
  "hashtags": ["relevant", "hashtags", "array"]
}`,
  carousel: `Return a JSON object with these exact fields:
{
  "title": "Compelling title for the carousel",
  "slides": [
    {"slide_number": 1, "text": "Headline + body text for this slide", "visual_direction": "Design notes for this slide"},
    {"slide_number": 2, "text": "...", "visual_direction": "..."},
    {"slide_number": 3, "text": "...", "visual_direction": "..."},
    {"slide_number": 4, "text": "...", "visual_direction": "..."},
    {"slide_number": 5, "text": "...", "visual_direction": "..."},
    {"slide_number": 6, "text": "...", "visual_direction": "..."},
    {"slide_number": 7, "text": "...", "visual_direction": "..."}
  ],
  "caption": "Post description — ${CAPTION_INSTRUCTIONS}",
  "hashtags": ["relevant", "hashtags", "array"]
}`,
  static: `Return a JSON object with these exact fields:
{
  "title": "Title for the infographic post",
  "headline": "The main bold headline/stat on the graphic",
  "body_text": "Supporting text on the graphic",
  "visual_direction": "Detailed design direction (layout, colors, typography, elements)",
  "caption": "Post description — ${CAPTION_INSTRUCTIONS}",
  "hashtags": ["relevant", "hashtags", "array"]
}`,
};

// ============================================================
// BRAND VARIABLE PROMPT BUILDER
// ============================================================

export function buildBrandContextPrompt(
  brandOutputs: Record<string, unknown>,
  selectedVariableKeys?: string[]
): string {
  const get = (key: string) => {
    if (selectedVariableKeys && !selectedVariableKeys.includes(key)) return null;
    const val = brandOutputs[key];
    if (!val) return 'Not specified';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  // Helper: build a line only if variable is selected (get returns non-null)
  const line = (key: string, prefix: string, suffix = '') => {
    const val = get(key);
    return val !== null ? `${prefix}${val}${suffix}` : '';
  };

  // Handle brand_archetype as structured object (new) or string (legacy)
  const archetypeVal = brandOutputs['brand_archetype'];
  let archetypeLines: string[] = [];
  if (archetypeVal && (!selectedVariableKeys || selectedVariableKeys.includes('brand_archetype'))) {
    if (typeof archetypeVal === 'object' && archetypeVal !== null && 'name' in (archetypeVal as Record<string, unknown>)) {
      const arch = archetypeVal as Record<string, unknown>;
      archetypeLines = [
        `Your brand archetype is ${arch.name}.`,
        arch.brand_voice ? `Archetype voice: ${Array.isArray(arch.brand_voice) ? (arch.brand_voice as string[]).join(', ') : arch.brand_voice}` : '',
        arch.content_approach ? `Content approach: ${arch.content_approach}` : '',
        arch.sales_approach ? `Sales approach: ${arch.sales_approach}` : '',
        arch.emotional_hook ? `Emotional hook: ${arch.emotional_hook}` : '',
        arch.storybrand_guide_style ? `Guide style: ${arch.storybrand_guide_style}` : '',
        arch.differentiation_angle ? `Differentiation: ${arch.differentiation_angle}` : '',
      ].filter(Boolean);
    } else {
      archetypeLines = [`Your brand archetype is ${String(archetypeVal)}.`];
    }
  }

  const identityLines = [
    ...archetypeLines,
    line('tone_descriptors', 'Your tone is: ', '.'),
    line('vocabulary_preferred', 'ALWAYS use these words/phrases: '),
    line('vocabulary_avoided', 'NEVER use these words/phrases: '),
    line('brand_characteristics', 'Your brand characteristics: '),
    line('brand_purpose', 'Brand purpose: '),
    line('brand_values', 'Brand values: '),
    line('brand_origin_story', 'Origin story: '),
    line('founder_story', 'Founder story: '),
    line('category', 'Category: '),
  ].filter(Boolean);

  const icpLines = [
    line('icp_demographics', 'Demographics: '),
    line('icp_pains', 'Their pains: '),
    line('icp_desires', 'Their desires: '),
    line('icp_emotional_triggers', 'Their emotional triggers: '),
    line('icp_internal_dialogue', 'Their internal dialogue: '),
    line('icp_objections', 'Their objections: '),
    line('icp_psychographics', 'Their psychographics: '),
    line('customer_journey_stages', 'Customer journey: '),
  ].filter(Boolean);

  const enemyLines = [
    (() => {
      const name = get('enemy_name');
      const desc = get('enemy_description');
      if (name === null && desc === null) return '';
      return `The enemy is: ${name || 'Not specified'} — ${desc || 'Not specified'}`;
    })(),
    line('enemy_cost', 'The cost of the enemy: '),
    line('enemy_false_promises', 'False promises the market makes: '),
  ].filter(Boolean);

  const positioningLines = [
    line('message_core', 'Core message: '),
    line('message_pillars', 'Message pillars: '),
    line('positioning_statement', 'Positioning: '),
    line('differentiation_statement', 'Differentiation: '),
    line('competitive_landscape', 'Competitive landscape: '),
    line('beliefs_to_teach', 'Beliefs to teach: '),
    line('content_themes', 'Content themes: '),
  ].filter(Boolean);

  const offerLines = [
    (() => {
      const name = get('offer_name');
      const tagline = get('offer_tagline');
      if (name === null && tagline === null) return '';
      return `Name: ${name || 'Not specified'} — ${tagline || 'Not specified'}`;
    })(),
    line('offer_problem', 'Problem solved: '),
    line('offer_outcome', 'Outcome delivered: '),
    (() => {
      const before = get('offer_transformation_before');
      const after = get('offer_transformation_after');
      if (before === null && after === null) return '';
      return `Transformation: ${before || 'Not specified'} → ${after || 'Not specified'}`;
    })(),
    line('offer_inclusions', "What's included: "),
    line('lead_magnet_type', 'Lead magnet type: '),
    line('lead_magnet_title', 'Lead magnet: '),
    line('lead_magnet_promise', 'Lead magnet promise: '),
    line('lead_magnet_content_outline', 'Lead magnet outline: '),
  ].filter(Boolean);

  const growthLines = [
    line('authority_pitch', 'Authority pitch: '),
    line('authority_publish_plan', 'Publishing plan: '),
    line('authority_product_ecosystem', 'Product ecosystem: '),
    line('authority_profile_plan', 'Profile plan: '),
    line('authority_partnerships', 'Partnerships: '),
    line('conversion_business_type', 'Business type: '),
    line('conversion_strategy', 'Conversion strategy: '),
    line('conversion_funnel', 'Conversion funnel: '),
    line('conversion_metrics', 'Key metrics: '),
  ].filter(Boolean);

  // Assemble only non-empty sections
  const sections: string[] = [];

  if (identityLines.length > 0) {
    sections.push(`## YOUR IDENTITY\nYou are the voice of this brand.\n${identityLines.join('\n')}`);
  }
  if (icpLines.length > 0) {
    sections.push(`## WHO YOU'RE SPEAKING TO\n${icpLines.join('\n')}`);
  }
  if (enemyLines.length > 0) {
    sections.push(`## YOUR ENEMY\n${enemyLines.join('\n')}`);
  }
  if (positioningLines.length > 0) {
    sections.push(`## YOUR POSITIONING\n${positioningLines.join('\n')}`);
  }
  if (offerLines.length > 0) {
    sections.push(`## YOUR OFFER\n${offerLines.join('\n')}`);
  }
  if (growthLines.length > 0) {
    sections.push(`## YOUR GROWTH STRATEGY\n${growthLines.join('\n')}`);
  }

  return sections.join('\n\n');
}

// ============================================================
// MAIN AUTO-SELECTION FUNCTION
// ============================================================

export interface ScriptFrameworkResult {
  formatCategory: FormatCategory;
  scriptTemplate: string;
  scriptTemplateName: string;
  hookTemplate: HookTemplate;
  hookTemplateName: string;
  ctaTemplate: CTATemplate;
  ctaTemplateName: string;
  outputFormat: string;
  promptInstructions: string;
  durationGuidance?: string;
}

export function getScriptFramework(
  format: ContentFormat,
  funnelStage: FunnelStage,
  storybrandStage: StoryBrandStage,
  platforms?: string[]
): ScriptFrameworkResult {
  const category = getFormatCategory(format);
  const combo: StageCombo = `${funnelStage}_${storybrandStage}`;
  const hookTemplate = HOOK_MAP[funnelStage] || 'direct_pain';
  const ctaTemplate = CTA_MAP[funnelStage] || 'soft_engagement';

  // Use platform-aware output format when platforms provided, else legacy
  const resolveOutputFormat = (cat: string) =>
    platforms && platforms.length > 0
      ? getOutputFormat(cat, platforms)
      : OUTPUT_FORMATS[cat as keyof typeof OUTPUT_FORMATS];

  switch (category) {
    case 'short': {
      const template = SHORT_TEMPLATE_MAP[combo] || 'problem_insight_reframe';
      const tmpl = SHORT_SCRIPT_TEMPLATES[template];
      return {
        formatCategory: 'short',
        scriptTemplate: template,
        scriptTemplateName: tmpl.name,
        hookTemplate,
        hookTemplateName: HOOK_TEMPLATES[hookTemplate].name,
        ctaTemplate,
        ctaTemplateName: CTA_TEMPLATES[ctaTemplate].name,
        outputFormat: resolveOutputFormat('short'),
        promptInstructions: `${tmpl.promptInstructions}\n\nHook style: ${HOOK_TEMPLATES[hookTemplate].promptInstructions}\n\nCTA style: ${CTA_TEMPLATES[ctaTemplate].promptInstructions}`,
      };
    }
    case 'medium': {
      const template = MEDIUM_TEMPLATE_MAP[combo] || 'three_point_breakdown';
      const tmpl = MEDIUM_TEACHING_FORMATS[template];
      return {
        formatCategory: 'medium',
        scriptTemplate: template,
        scriptTemplateName: tmpl.name,
        hookTemplate,
        hookTemplateName: HOOK_TEMPLATES[hookTemplate].name,
        ctaTemplate,
        ctaTemplateName: CTA_TEMPLATES[ctaTemplate].name,
        outputFormat: resolveOutputFormat('medium'),
        promptInstructions: `${tmpl.promptInstructions}\n\nHook style: ${HOOK_TEMPLATES[hookTemplate].promptInstructions}\n\nCTA style: ${CTA_TEMPLATES[ctaTemplate].promptInstructions}`,
        durationGuidance: MEDIUM_DURATION_GUIDANCE[format],
      };
    }
    case 'long': {
      const template = LONG_TEMPLATE_MAP[combo] || 'multi_phase_framework';
      const tmpl = LONG_TEACHING_STRUCTURES[template];
      return {
        formatCategory: 'long',
        scriptTemplate: template,
        scriptTemplateName: tmpl.name,
        hookTemplate,
        hookTemplateName: HOOK_TEMPLATES[hookTemplate].name,
        ctaTemplate,
        ctaTemplateName: CTA_TEMPLATES[ctaTemplate].name,
        outputFormat: resolveOutputFormat('long'),
        promptInstructions: `${tmpl.promptInstructions}\n\nHook style: ${HOOK_TEMPLATES[hookTemplate].promptInstructions}\n\nCTA style: ${CTA_TEMPLATES[ctaTemplate].promptInstructions}`,
        durationGuidance: LONG_DURATION_GUIDANCE[format],
      };
    }
    case 'carousel': {
      const template = CAROUSEL_TEMPLATE_MAP[combo] || 'problem_steps_cta';
      const tmpl = CAROUSEL_TEMPLATES[template];
      return {
        formatCategory: 'carousel',
        scriptTemplate: template,
        scriptTemplateName: tmpl.name,
        hookTemplate,
        hookTemplateName: HOOK_TEMPLATES[hookTemplate].name,
        ctaTemplate,
        ctaTemplateName: CTA_TEMPLATES[ctaTemplate].name,
        outputFormat: resolveOutputFormat('carousel'),
        promptInstructions: tmpl.promptInstructions,
      };
    }
    case 'static': {
      const template = STATIC_TEMPLATE_MAP[combo] || 'stat_insight';
      const tmpl = STATIC_TEMPLATES[template];
      return {
        formatCategory: 'static',
        scriptTemplate: template,
        scriptTemplateName: tmpl.name,
        hookTemplate,
        hookTemplateName: HOOK_TEMPLATES[hookTemplate].name,
        ctaTemplate,
        ctaTemplateName: CTA_TEMPLATES[ctaTemplate].name,
        outputFormat: resolveOutputFormat('static'),
        promptInstructions: tmpl.promptInstructions,
      };
    }
  }
}

// ============================================================
// TEMPLATE LISTS FOR UI DROPDOWNS
// ============================================================

export function getAvailableTemplates(format: ContentFormat) {
  const category = getFormatCategory(format);
  switch (category) {
    case 'short':
      return Object.entries(SHORT_SCRIPT_TEMPLATES).map(([key, val]) => ({ value: key, label: val.name }));
    case 'medium':
      return Object.entries(MEDIUM_TEACHING_FORMATS).map(([key, val]) => ({ value: key, label: val.name }));
    case 'long':
      return Object.entries(LONG_TEACHING_STRUCTURES).map(([key, val]) => ({ value: key, label: val.name }));
    case 'carousel':
      return Object.entries(CAROUSEL_TEMPLATES).map(([key, val]) => ({ value: key, label: val.name }));
    case 'static':
      return Object.entries(STATIC_TEMPLATES).map(([key, val]) => ({ value: key, label: val.name }));
  }
}
