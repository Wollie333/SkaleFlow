-- Migration 034: Content Template System
-- Unified DB-driven template archive replacing hardcoded config/script-frameworks.ts

-- Drop existing tables (CASCADE on content_templates drops dependent FKs)
DROP TABLE IF EXISTS template_stage_mappings CASCADE;
DROP TABLE IF EXISTS content_templates CASCADE;

-- ============================================================
-- TABLE: content_templates
-- ============================================================
CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('video_script', 'hook', 'cta', 'social_framework', 'seo_content', 'email_outreach', 'web_copy')),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'script', 'hook', 'cta')),
  format_category TEXT CHECK (format_category IN ('short', 'medium', 'long', 'carousel', 'static')),
  tier TEXT NOT NULL DEFAULT 'core_rotation' CHECK (tier IN ('core_rotation', 'high_impact', 'strategic')),
  funnel_stages TEXT[] DEFAULT '{}',
  structure TEXT,
  psychology TEXT,
  description TEXT,
  when_to_use TEXT[],
  when_not_to_use TEXT[],
  example_content TEXT,
  prompt_instructions TEXT NOT NULL,
  output_format TEXT,
  markdown_source TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: template_stage_mappings
-- ============================================================
CREATE TABLE template_stage_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES content_templates(id) ON DELETE CASCADE,
  funnel_stage TEXT NOT NULL,
  storybrand_stage TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  confidence_score INTEGER NOT NULL DEFAULT 80 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  UNIQUE (template_id, funnel_stage, storybrand_stage)
);

-- Indexes
CREATE INDEX idx_content_templates_category ON content_templates(category);
CREATE INDEX idx_content_templates_active ON content_templates(is_active);
CREATE INDEX idx_content_templates_format ON content_templates(format_category);
CREATE INDEX idx_template_stage_mappings_lookup ON template_stage_mappings(funnel_stage, storybrand_stage);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_stage_mappings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active templates
CREATE POLICY "Authenticated users can read active templates"
  ON content_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Super admins can do everything
CREATE POLICY "Super admins full access to templates"
  ON content_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Stage mappings: all authenticated can read
CREATE POLICY "Authenticated users can read stage mappings"
  ON template_stage_mappings FOR SELECT
  TO authenticated
  USING (true);

-- Stage mappings: super admins full access
CREATE POLICY "Super admins full access to stage mappings"
  ON template_stage_mappings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================
-- SEED DATA: Video Script Templates (20)
-- ============================================================

-- Short-form (5)
INSERT INTO content_templates (template_key, name, category, content_type, format_category, tier, funnel_stages, structure, prompt_instructions, is_system, sort_order) VALUES
('problem_insight_reframe', 'Problem → Insight → Reframe', 'video_script', 'script', 'short', 'core_rotation',
 '{awareness,consideration}',
 'HOOK (0-3s) → Name the problem → Deliver a surprising insight → Reframe how they should think about it → CTA (last 2-3s)',
 'Structure the script as:
1. HOOK (0-3s): Open with the viewer''s pain point or problem
2. SCRIPT BODY: Name the specific problem they face → Deliver one surprising insight they haven''t considered → Reframe how they should think about this problem
3. CTA (last 2-3s): Close with the appropriate call-to-action',
 true, 1),

('myth_truth_proof', 'Myth → Truth → Proof', 'video_script', 'script', 'short', 'core_rotation',
 '{awareness,consideration}',
 'HOOK (0-3s) → State the common myth → Reveal the truth → Provide proof/evidence → CTA (last 2-3s)',
 'Structure the script as:
1. HOOK (0-3s): Challenge a widely-held belief
2. SCRIPT BODY: State the common myth/belief in the industry → Reveal the actual truth with authority → Provide brief proof or evidence
3. CTA (last 2-3s): Close with the appropriate call-to-action',
 true, 2),

('how_it_works', 'How It Works', 'video_script', 'script', 'short', 'core_rotation',
 '{consideration}',
 'HOOK (0-3s) → Present the method/system → Walk through 2-3 quick steps → CTA (last 2-3s)',
 'Structure the script as:
1. HOOK (0-3s): Tease the result or method
2. SCRIPT BODY: Present the system/method name → Walk through 2-3 quick steps or components → Show the outcome
3. CTA (last 2-3s): Close with the appropriate call-to-action',
 true, 3),

('behind_the_scenes', 'Behind the Scenes → Meaning', 'video_script', 'script', 'short', 'core_rotation',
 '{awareness,consideration}',
 'HOOK (0-3s) → Show a real moment/process → Explain why it matters → Connect to bigger message → CTA (last 2-3s)',
 'Structure the script as:
1. HOOK (0-3s): Pull them into a real moment
2. SCRIPT BODY: Describe a real behind-the-scenes moment or process → Explain why this matters and what it reveals → Connect it to the bigger brand message
3. CTA (last 2-3s): Close with the appropriate call-to-action',
 true, 4),

('comparison_choice', 'Comparison / Choice', 'video_script', 'script', 'short', 'high_impact',
 '{conversion}',
 'HOOK (0-3s) → Present option A (the wrong way) → Present option B (the right way) → Make the choice clear → CTA (last 2-3s)',
 'Structure the script as:
1. HOOK (0-3s): Present a decision or crossroads
2. SCRIPT BODY: Show option A (the common/wrong approach) → Show option B (the better/right approach) → Make the contrast and choice unmistakable
3. CTA (last 2-3s): Close with the appropriate call-to-action',
 true, 5);

-- Medium-form (4)
INSERT INTO content_templates (template_key, name, category, content_type, format_category, tier, funnel_stages, structure, prompt_instructions, is_system, sort_order) VALUES
('three_point_breakdown', '3-Point Breakdown', 'video_script', 'script', 'medium', 'core_rotation',
 '{awareness,consideration}',
 'Hook → Context → Point 1 → Point 2 → Point 3 → Reframe → CTA',
 'Structure the medium-form script as:
1. HOOK (0-10s): Tease the 3 key points
2. CONTEXT (10-30s): Set up who this is for and what''s at stake
3. TEACHING: Break into exactly 3 clear teaching points with transitions
4. REFRAME: Tie all 3 points together with a new perspective
5. CTA: Close with the appropriate call-to-action',
 true, 10),

('step_by_step_system', 'Step-By-Step System', 'video_script', 'script', 'medium', 'core_rotation',
 '{consideration}',
 'Hook → Context → Step 1 → Step 2 → Step 3 → Reframe → CTA',
 'Structure the medium-form script as:
1. HOOK (0-10s): Tease the system/process outcome
2. CONTEXT (10-30s): Explain what this system solves and for whom
3. TEACHING: Walk through the steps sequentially, each building on the last
4. REFRAME: Show what changes when they implement this system
5. CTA: Close with the appropriate call-to-action',
 true, 11),

('problem_cause_solution', 'Problem → Cause → Solution', 'video_script', 'script', 'medium', 'core_rotation',
 '{awareness,consideration}',
 'Hook → Context → Problem deep dive → Root cause → Solution → Reframe → CTA',
 'Structure the medium-form script as:
1. HOOK (0-10s): Name the problem boldly
2. CONTEXT (10-30s): Validate their experience with this problem
3. TEACHING: Deep dive into the problem → Reveal the root cause most people miss → Present the solution framework
4. REFRAME: Change how they see the problem entirely
5. CTA: Close with the appropriate call-to-action',
 true, 12),

('case_study_example', 'Case Study / Example', 'video_script', 'script', 'medium', 'high_impact',
 '{conversion}',
 'Hook → Context → Before state → What changed → After state → Lessons → CTA',
 'Structure the medium-form script as:
1. HOOK (0-10s): Tease the transformation result
2. CONTEXT (10-30s): Set up the scenario/client/example
3. TEACHING: Describe the before state → Explain what changed and why → Show the after state → Extract the key lessons
4. REFRAME: Connect this example to the viewer''s situation
5. CTA: Close with the appropriate call-to-action',
 true, 13);

-- Long-form (3)
INSERT INTO content_templates (template_key, name, category, content_type, format_category, tier, funnel_stages, structure, prompt_instructions, is_system, sort_order) VALUES
('multi_phase_framework', 'Multi-Phase Framework', 'video_script', 'script', 'long', 'strategic',
 '{conversion}',
 'Hook → Context → Problem Expansion → Phase 1 → Phase 2 → Phase 3 → Case Study → Reframe → CTA',
 'Structure the long-form script as:
1. HOOK (0-30s): Bold opening that promises comprehensive value
2. CONTEXT (30s-2min): Who this is for, what they''ll learn, why it matters
3. PROBLEM EXPANSION: Deep dive into the problem landscape, costs, and false solutions
4. FRAMEWORK TEACHING: Present a multi-phase framework. Each phase gets its own section with explanation, examples, and implementation steps
5. CASE STUDY: Walk through a real-world application of the framework
6. REFRAME: Synthesize everything into a new worldview
7. CTA: Close with direct action referencing the offer',
 true, 20),

('step_by_step_deep', 'Step-By-Step System (Deep)', 'video_script', 'script', 'long', 'strategic',
 '{consideration}',
 'Hook → Context → Problem Expansion → Step 1 (deep) → Step 2 (deep) → Step 3 (deep) → Implementation → CTA',
 'Structure the long-form script as:
1. HOOK (0-30s): Promise a complete implementation guide
2. CONTEXT (30s-2min): Set up the problem and what they''ll be able to do after watching
3. PROBLEM EXPANSION: Show why most attempts at this fail
4. FRAMEWORK TEACHING: Deep dive into each step with detailed implementation, common mistakes, and pro tips
5. CASE STUDY: Show an implementation example with real results
6. REFRAME: Position this system as the missing piece
7. CTA: Close with direct action referencing the offer',
 true, 21),

('diagnostic_breakdown', 'Diagnostic Breakdown', 'video_script', 'script', 'long', 'strategic',
 '{awareness,consideration}',
 'Hook → Context → Industry Analysis → Root Causes → Framework → Proof → Reframe → CTA',
 'Structure the long-form script as:
1. HOOK (0-30s): Make a bold diagnostic claim about the industry/problem
2. CONTEXT (30s-2min): Establish authority and frame the analysis
3. PROBLEM EXPANSION: Break down the industry landscape, common approaches, and why they fail
4. FRAMEWORK TEACHING: Present the diagnostic framework - how to identify the real issues and what to do about them
5. CASE STUDY: Apply the diagnostic to a specific example
6. REFRAME: Reframe the entire problem through the diagnostic lens
7. CTA: Close with direct action referencing the offer',
 true, 22);

-- Carousel (4)
INSERT INTO content_templates (template_key, name, category, content_type, format_category, tier, funnel_stages, structure, prompt_instructions, is_system, sort_order) VALUES
('carousel_problem_steps_cta', 'Problem → Steps → CTA', 'video_script', 'script', 'carousel', 'core_rotation',
 '{consideration}',
 'S1: hook/problem → S2-5: solution steps → S6: reframe → S7: CTA',
 'Create a 7-slide carousel:
Slide 1: Hook slide - name the problem in a bold headline
Slides 2-5: Solution steps - one clear step per slide with a brief explanation
Slide 6: Reframe - tie the steps together with a new perspective
Slide 7: CTA slide - clear call to action
Each slide should have: headline text, body text (1-2 sentences max), and a visual direction note.',
 true, 30),

('carousel_myth_buster', 'Myth Buster', 'video_script', 'script', 'carousel', 'core_rotation',
 '{awareness}',
 'S1: common belief → S2-5: why wrong + truth → S6: what to do → S7: CTA',
 'Create a 7-slide carousel:
Slide 1: State the common myth/belief boldly
Slides 2-5: Break down why it''s wrong and reveal the truth (one angle per slide)
Slide 6: What to do instead - actionable takeaway
Slide 7: CTA slide
Each slide should have: headline text, body text (1-2 sentences max), and a visual direction note.',
 true, 31),

('carousel_before_after', 'Before / After', 'video_script', 'script', 'carousel', 'high_impact',
 '{conversion}',
 'S1: pain state → S2-3: what''s wrong → S4-5: transformation → S6: how → S7: CTA',
 'Create a 7-slide carousel:
Slide 1: Paint the painful "before" state
Slides 2-3: Dig into what''s going wrong and why
Slides 4-5: Show the transformation and "after" state
Slide 6: Explain how to get there
Slide 7: CTA slide
Each slide should have: headline text, body text (1-2 sentences max), and a visual direction note.',
 true, 32),

('carousel_list_tips', 'List / Tips', 'video_script', 'script', 'carousel', 'core_rotation',
 '{awareness}',
 'S1: "X things..." → S2-6: one tip per slide → S7: CTA',
 'Create a 7-slide carousel:
Slide 1: Hook with "X things/tips/ways..." headline
Slides 2-6: One valuable tip per slide with brief explanation
Slide 7: CTA slide
Each slide should have: headline text, body text (1-2 sentences max), and a visual direction note.',
 true, 33);

-- Static (4)
INSERT INTO content_templates (template_key, name, category, content_type, format_category, tier, funnel_stages, structure, prompt_instructions, is_system, sort_order) VALUES
('static_stat_insight', 'Stat + Insight', 'video_script', 'script', 'static', 'core_rotation',
 '{awareness}',
 'Bold stat/number + 1-line insight + brand positioning',
 'Create a static infographic with:
- headline: A bold, attention-grabbing statistic or number
- body_text: A 1-line insight that contextualizes the stat
- visual_direction: Design notes for the visual treatment (color emphasis, layout)
- Brand positioning element at the bottom',
 true, 40),

('static_quote_card', 'Quote Card', 'video_script', 'script', 'static', 'core_rotation',
 '{awareness}',
 'Authority quote + context line + CTA',
 'Create a static infographic with:
- headline: A powerful, quotable statement from the brand''s perspective
- body_text: A context line that adds depth to the quote
- visual_direction: Design notes (quote marks, typography hierarchy, brand elements)',
 true, 41),

('static_framework_visual', 'Framework Visual', 'video_script', 'script', 'static', 'high_impact',
 '{consideration}',
 'Named framework/process (3-4 steps) visualized',
 'Create a static infographic with:
- headline: The framework/process name
- body_text: Brief description of each step (3-4 steps max, formatted as numbered list)
- visual_direction: Layout notes for visualizing the framework (flow, hierarchy, icons)',
 true, 42),

('static_comparison_split', 'Comparison Split', 'video_script', 'script', 'static', 'high_impact',
 '{conversion}',
 'Side-by-side "wrong way vs right way"',
 'Create a static infographic with:
- headline: The comparison framing (e.g., "What most people do vs. What works")
- body_text: Left side (wrong way, 3-4 bullet points) vs Right side (right way, 3-4 bullet points)
- visual_direction: Split layout notes (colors, contrast, visual hierarchy)',
 true, 43);

-- ============================================================
-- SEED DATA: Hook Templates (5)
-- ============================================================
INSERT INTO content_templates (template_key, name, category, content_type, tier, funnel_stages, description, prompt_instructions, is_system, sort_order) VALUES
('hook_direct_pain', 'Direct Pain', 'hook', 'hook', 'core_rotation',
 '{awareness}',
 'Name the viewer''s exact pain point in the first line',
 'Open by naming the viewer''s specific pain point directly. Use their exact language from the ICP pains. Example: "If you''re still [pain point], here''s what no one tells you..."',
 true, 50),

('hook_contrarian', 'Contrarian', 'hook', 'hook', 'core_rotation',
 '{awareness,consideration}',
 'Challenge a common belief or conventional wisdom',
 'Open with a bold, contrarian statement that challenges what most people believe. Example: "Stop [common advice]. It''s actually making things worse."',
 true, 51),

('hook_outcome_first', 'Outcome-First', 'hook', 'hook', 'core_rotation',
 '{conversion}',
 'Lead with the desirable result',
 'Open by painting the desirable outcome first, then pull them in. Example: "What if [desired outcome] was possible in [timeframe]?"',
 true, 52),

('hook_curiosity_gap', 'Curiosity Gap', 'hook', 'hook', 'core_rotation',
 '{consideration}',
 'Create an open loop that demands resolution',
 'Open with an incomplete statement that creates an irresistible knowledge gap. Example: "There''s one thing [successful people] do that [target audience] never will..."',
 true, 53),

('hook_visual_action', 'Visual Action', 'hook', 'hook', 'core_rotation',
 '{awareness}',
 'Start with a visual or action-based hook',
 'Open with a visual direction or action that grabs attention. Include a filming note for the visual element. Example: "[Visual: hands on desk, frustrated] You know that feeling when..."',
 true, 54);

-- ============================================================
-- SEED DATA: CTA Templates (4)
-- ============================================================
INSERT INTO content_templates (template_key, name, category, content_type, tier, funnel_stages, description, prompt_instructions, is_system, sort_order) VALUES
('cta_soft_engagement', 'Soft Engagement', 'cta', 'cta', 'core_rotation',
 '{awareness}',
 'Low-commitment social engagement (follow, comment, save)',
 'End with a soft, low-commitment CTA that builds community. Example: "Follow for more [topic]", "Save this for later", "Drop a [emoji] if this hit home"',
 true, 60),

('cta_consideration', 'Consideration', 'cta', 'cta', 'core_rotation',
 '{consideration}',
 'Medium-commitment engagement (share, DM, link in bio)',
 'End with a medium-commitment CTA that moves them closer. Example: "Share this with someone who needs to hear it", "DM me [keyword] for the full breakdown", "Link in bio for the complete guide"',
 true, 61),

('cta_direct_action', 'Direct Action', 'cta', 'cta', 'high_impact',
 '{conversion}',
 'Clear conversion action referencing the offer',
 'End with a direct, clear CTA that references the actual offer by name. Example: "Ready to [outcome]? [Offer name] is how we help. Link in bio."',
 true, 62),

('cta_authority_loop', 'Authority Loop', 'cta', 'cta', 'core_rotation',
 '{awareness,consideration}',
 'Position as ongoing authority source',
 'End by positioning yourself as the ongoing authority and reason to stay connected. Example: "I break down [topic] every week. Follow so you don''t miss the next one."',
 true, 63);

-- ============================================================
-- SEED DATA: Social Post Frameworks (20)
-- ============================================================
INSERT INTO content_templates (template_key, name, category, content_type, tier, funnel_stages, structure, psychology, when_to_use, when_not_to_use, prompt_instructions, is_system, sort_order) VALUES
('social_uncomfortable_truth', 'The Uncomfortable Truth', 'social_framework', 'post', 'high_impact',
 '{awareness}',
 'Bold contrarian statement → Evidence/reasoning → Reframe → Micro-CTA',
 'Pattern interrupts by challenging accepted beliefs. Creates cognitive dissonance that demands resolution.',
 '{"When challenging industry norms","When you have data to back a contrarian claim","For thought-leadership positioning"}',
 '{"When you lack evidence for the claim","For sensitive topics without nuance","When the audience is brand new"}',
 'Write a social post using The Uncomfortable Truth framework:
1. Open with a bold, contrarian statement that challenges what most people in the industry believe
2. Back it up with evidence, data, or logical reasoning that makes the claim undeniable
3. Reframe how the reader should think about this topic going forward
4. End with a micro-CTA (save, share, comment)
The tone should be confident and authoritative, not arrogant. Write each sentence on its own line.',
 true, 100),

('social_bab', 'Before-After-Bridge (BAB)', 'social_framework', 'post', 'core_rotation',
 '{awareness,consideration}',
 'Before (pain state) → After (desired state) → Bridge (how to get there)',
 'Taps into loss aversion and aspiration simultaneously. The contrast between states creates emotional momentum.',
 '{"For offer-adjacent content","When painting transformation stories","For case study style posts"}',
 '{"When you can''t show a clear transformation","For purely educational content","When the after state feels unrealistic"}',
 'Write a social post using the Before-After-Bridge (BAB) framework:
1. BEFORE: Paint a vivid picture of the reader''s current painful reality. Use specific details they''ll recognize.
2. AFTER: Show what life looks like once the problem is solved. Make it tangible and desirable.
3. BRIDGE: Explain the path from Before to After — the insight, method, or offer that makes it possible.
Write each sentence on its own line. Be specific, not generic.',
 true, 101),

('social_pas', 'Problem-Agitate-Solve (PAS)', 'social_framework', 'post', 'core_rotation',
 '{awareness,consideration}',
 'Problem (name it) → Agitate (twist the knife) → Solve (present the way out)',
 'Amplifies pain before offering relief. The agitation phase creates urgency that a simple problem-solution misses.',
 '{"For pain-point focused content","When the audience knows they have a problem","For driving urgency"}',
 '{"When the agitation feels manipulative","For top-of-funnel brand awareness","When the audience doesn''t recognize the problem yet"}',
 'Write a social post using the Problem-Agitate-Solve (PAS) framework:
1. PROBLEM: Name the specific problem the reader faces. Use their language.
2. AGITATE: Dig deeper. Show the consequences, the ripple effects, what it''s really costing them. Make them feel it.
3. SOLVE: Present the solution — your insight, framework, or offer. Keep it clear and actionable.
Write each sentence on its own line. The agitation should be empathetic, not fear-mongering.',
 true, 102),

('social_aida', 'AIDA', 'social_framework', 'post', 'core_rotation',
 '{consideration,conversion}',
 'Attention → Interest → Desire → Action',
 'Classic persuasion sequence. Each stage builds on the last, creating a natural path to action.',
 '{"For conversion-focused posts","For product/offer launches","When driving a specific action"}',
 '{"For pure education or thought-leadership","When you don''t have a clear CTA","For top-of-funnel awareness"}',
 'Write a social post using the AIDA framework:
1. ATTENTION: Open with a scroll-stopping hook that grabs attention immediately
2. INTEREST: Build interest by sharing something valuable, surprising, or relevant to their situation
3. DESIRE: Create desire by showing the outcome, benefit, or transformation they want
4. ACTION: End with a clear, specific call-to-action
Write each sentence on its own line.',
 true, 103),

('social_storytelling', 'The Story Arc', 'social_framework', 'post', 'high_impact',
 '{awareness,consideration}',
 'Setup (context) → Conflict (challenge) → Resolution (insight/lesson) → Takeaway',
 'Stories activate mirror neurons and create emotional investment. The conflict creates tension that demands resolution.',
 '{"For personal brand content","For building trust and relatability","When you have a real story to share"}',
 '{"When the story doesn''t have a clear lesson","For data-heavy content","When the audience wants quick tactical value"}',
 'Write a social post using The Story Arc framework:
1. SETUP: Set the scene. When, where, what was happening. Pull the reader in with a specific moment.
2. CONFLICT: What went wrong? What challenge appeared? Create tension.
3. RESOLUTION: How was it resolved? What insight emerged? What changed?
4. TAKEAWAY: What should the reader learn from this story? Make it actionable.
Write each sentence on its own line. Use vivid, specific details — not vague generalities.',
 true, 104),

('social_hot_take', 'The Hot Take', 'social_framework', 'post', 'high_impact',
 '{awareness}',
 'Bold opinion → Supporting evidence → Implication → Engagement prompt',
 'Polarization drives engagement. A strong opinion forces readers to pick a side and engage.',
 '{"When you have a genuine strong opinion","For driving comments and debate","For positioning as a thought leader"}',
 '{"When you''re just being contrarian for clicks","On sensitive topics","When you can''t back it up"}',
 'Write a social post using The Hot Take framework:
1. Open with a bold, polarizing opinion stated as a confident assertion
2. Back it up with 2-3 supporting points or evidence
3. Explain what this means for the reader / industry
4. End with an engagement prompt (agree/disagree, what''s your take)
Write each sentence on its own line. Be bold but not reckless.',
 true, 105),

('social_listicle', 'The Listicle', 'social_framework', 'post', 'core_rotation',
 '{awareness,consideration}',
 'Hook promise → Numbered list (3-7 items) → Summary/CTA',
 'Lists reduce cognitive load. Numbered items create clear value units and are easy to save/share.',
 '{"For educational/tactical content","When you have multiple tips or insights","For high-save-rate content"}',
 '{"When items are too shallow","For conversion-focused content","When one deep insight beats many shallow ones"}',
 'Write a social post using The Listicle framework:
1. Open with a hook that promises a specific number of valuable items
2. List 5-7 actionable items, each with a brief explanation (1-2 sentences)
3. Close with a summary line and CTA (save for later, share with someone who needs this)
Number each item clearly. Each should be genuinely useful, not filler.',
 true, 106),

('social_myth_busting', 'Myth Busting', 'social_framework', 'post', 'core_rotation',
 '{awareness}',
 'Common myth → Why people believe it → The reality → What to do instead',
 'Correcting false beliefs creates a knowledge gap that positions you as the authority.',
 '{"When correcting common misconceptions","For positioning against competitors","When you have expertise others lack"}',
 '{"When the myth is actually true","When you can''t prove the alternative","For audiences who don''t hold the myth"}',
 'Write a social post using the Myth Busting framework:
1. State the common myth or belief that most people accept as true
2. Explain why people believe it (it seems logical, it''s widely taught, etc.)
3. Reveal the reality — what''s actually true and why
4. Tell them what to do instead — actionable next step
Write each sentence on its own line. Be respectful, not condescending.',
 true, 107),

('social_framework_reveal', 'The Framework Reveal', 'social_framework', 'post', 'high_impact',
 '{consideration}',
 'Problem context → Named framework → Steps/components → Application tip',
 'Named frameworks feel proprietary and valuable. They create intellectual property that drives saves and shares.',
 '{"When you have a unique process or system","For establishing methodology authority","For high-save content"}',
 '{"When the framework is generic","When it''s too complex for a post","When the audience needs motivation, not methodology"}',
 'Write a social post using The Framework Reveal:
1. Set up the problem this framework solves
2. Introduce the framework by name (create a memorable acronym or name)
3. Walk through each step/component with a brief explanation
4. End with a quick tip on how to apply it immediately
Write each sentence on its own line. The framework should feel proprietary and valuable.',
 true, 108),

('social_data_storytelling', 'Data Storytelling', 'social_framework', 'post', 'strategic',
 '{awareness,consideration}',
 'Surprising stat → Context/interpretation → Implication → Action step',
 'Data creates credibility. A surprising statistic disrupts assumptions and demands attention.',
 '{"When you have compelling data","For credibility-building content","When data tells a story the audience doesn''t expect"}',
 '{"When data is boring or expected","When you don''t have a source","For emotional/personal content"}',
 'Write a social post using the Data Storytelling framework:
1. Open with a surprising, specific statistic or data point
2. Provide context — what does this number mean? Why should they care?
3. Explain the implication for the reader or their industry
4. Give one actionable step they can take based on this insight
Write each sentence on its own line. Cite or attribute the data source.',
 true, 109),

('social_contrarian_playbook', 'The Contrarian Playbook', 'social_framework', 'post', 'high_impact',
 '{awareness}',
 '"Everyone says X" → "Here''s why that''s wrong" → Evidence → New approach',
 'Directly opposing popular advice creates instant attention and positions you as an independent thinker.',
 '{"When popular advice is genuinely wrong","For differentiation from competitors","When you have proof of a better way"}',
 '{"When you''re wrong and the popular advice is right","Just to be edgy","When the audience trusts the popular advice deeply"}',
 'Write a social post using The Contrarian Playbook:
1. State what "everyone" says or believes (the popular advice)
2. Explain why this is wrong or incomplete
3. Share your evidence or experience that proves the alternative
4. Present the better approach
Write each sentence on its own line. Be specific and evidence-based, not just contrarian for clicks.',
 true, 110),

('social_value_bomb', 'The Value Bomb', 'social_framework', 'post', 'core_rotation',
 '{consideration}',
 'Teaser → Deep tactical value → Application → Save/share CTA',
 'Giving away high-value tactical content builds reciprocity and authority simultaneously.',
 '{"For building trust through generosity","When you have genuinely useful tactics","For driving saves and shares"}',
 '{"When the value is surface-level","For conversion content","When you need to sell, not teach"}',
 'Write a social post that is a pure Value Bomb:
1. Open with a teaser that promises specific, actionable value
2. Deliver 3-5 genuinely useful tactical tips or insights
3. Explain how to apply the most important one immediately
4. End with a CTA to save for later or share with someone who needs it
Each tip should be specific enough to implement today. No fluff.',
 true, 111),

('social_prediction', 'The Prediction', 'social_framework', 'post', 'strategic',
 '{awareness}',
 'Trend observation → Prediction → Why it matters → How to prepare',
 'Predictions position you as a forward-thinker. The audience wants to be ahead of trends.',
 '{"For thought-leadership positioning","When you spot emerging trends early","For driving discussion and debate"}',
 '{"When the prediction is obvious","When you have no basis for the claim","For tactical how-to content"}',
 'Write a social post using The Prediction framework:
1. Share a trend or pattern you''re observing in the industry
2. Make a specific prediction about what this means for the future
3. Explain why this matters to the reader specifically
4. Give one thing they should do now to prepare
Write each sentence on its own line. Be specific and bold.',
 true, 112),

('social_behind_the_curtain', 'Behind the Curtain', 'social_framework', 'post', 'core_rotation',
 '{awareness,consideration}',
 'Setup ("let me show you...") → Honest reveal → Lesson learned → Takeaway',
 'Transparency builds trust faster than any other content type. Vulnerability creates connection.',
 '{"For building trust and authenticity","When sharing real processes or decisions","For humanizing the brand"}',
 '{"When the reveal is boring","When sharing sensitive business info","When the audience wants results, not process"}',
 'Write a social post using the Behind the Curtain framework:
1. Open with a "let me show you something most people don''t share" hook
2. Reveal something honest about your process, decisions, or journey
3. Share the lesson you learned from this experience
4. Give the reader an actionable takeaway they can apply
Write each sentence on its own line. Be genuinely transparent.',
 true, 113),

('social_question_flip', 'The Question Flip', 'social_framework', 'post', 'core_rotation',
 '{awareness}',
 'Common question → Reframe the question → Better question → Insight',
 'Reframing questions changes how people think about problems. It positions you as someone who sees deeper.',
 '{"When a common question has a bad premise","For reframing how people think","For building thought-leadership"}',
 '{"When the original question is valid","For tactical content","When the audience just wants an answer"}',
 'Write a social post using The Question Flip:
1. Start with a common question people ask in your industry
2. Explain why this question has the wrong premise or framing
3. Reveal the better question they should be asking instead
4. Answer the better question with a key insight
Write each sentence on its own line.',
 true, 114),

('social_case_study_mini', 'The Mini Case Study', 'social_framework', 'post', 'high_impact',
 '{consideration,conversion}',
 'Client/scenario intro → Challenge → What we did → Result → Key lesson',
 'Social proof is the most powerful persuasion tool. A specific example beats a hundred claims.',
 '{"For building credibility through proof","When you have real results to share","For conversion-stage content"}',
 '{"When you don''t have real results","When the case is too generic","For top-of-funnel awareness content"}',
 'Write a social post using The Mini Case Study framework:
1. Introduce the client or scenario briefly (industry, situation)
2. Describe the specific challenge they faced
3. Explain what was done to solve it (method or approach, not just "we helped")
4. Share the specific result with numbers if possible
5. Extract the key lesson that applies to the reader
Write each sentence on its own line. Use specific details, not vague claims.',
 true, 115),

('social_dos_and_donts', 'Do This, Not That', 'social_framework', 'post', 'core_rotation',
 '{consideration}',
 'Context → Don''t (wrong approach) → Do (right approach) → Why it matters',
 'Direct comparison makes the right choice obvious. The contrast creates clarity.',
 '{"For correcting common mistakes","When the right approach is counterintuitive","For practical, tactical content"}',
 '{"When both approaches are valid","For nuanced topics","When the don''t is actually fine in context"}',
 'Write a social post using the Do This, Not That framework:
1. Set up the context (what decision or approach is being discussed)
2. Show the wrong approach (Don''t) with a brief explanation of why it fails
3. Show the right approach (Do) with a brief explanation of why it works
4. End with why making this switch matters
Write each sentence on its own line. Be specific with both the do and don''t.',
 true, 116),

('social_one_thing', 'The One Thing', 'social_framework', 'post', 'core_rotation',
 '{consideration,conversion}',
 'Context → The one thing → Why it matters → How to do it',
 'Simplification is powerful. In a world of overwhelm, one focused action step is a relief.',
 '{"When simplicity is the message","For cutting through overwhelm","For driving a single specific action"}',
 '{"When the topic genuinely needs nuance","For complex multi-step processes","When one thing isn''t enough"}',
 'Write a social post using The One Thing framework:
1. Set up the context (a problem, goal, or situation the reader faces)
2. Reveal the ONE thing that makes the biggest difference
3. Explain why this one thing matters more than everything else
4. Give a clear, actionable way to implement it today
Write each sentence on its own line. The power is in the simplicity — don''t dilute it.',
 true, 117),

('social_transformation_timeline', 'The Transformation Timeline', 'social_framework', 'post', 'strategic',
 '{conversion}',
 'Day 1 / Week 1 / Month 1 → Progressive milestones → End state',
 'Timelines make abstract outcomes concrete. Showing progressive milestones makes the journey feel achievable.',
 '{"For selling a process or program","When outcomes happen over time","For making a big goal feel achievable"}',
 '{"When results aren''t predictable","For instant-gratification content","When the timeline is dishonest"}',
 'Write a social post using The Transformation Timeline:
1. Start with where the reader is today (Day 0 / starting point)
2. Walk through 3-5 progressive milestones with specific timeframes
3. Describe what changes at each milestone (be specific, not vague)
4. End with the final outcome and a CTA
Write each sentence on its own line. Make each milestone tangible and believable.',
 true, 118),

('social_permission_slip', 'The Permission Slip', 'social_framework', 'post', 'high_impact',
 '{awareness}',
 'Common pressure/expectation → "You don''t have to" → New perspective → Relief + action',
 'Giving permission to stop doing something stressful creates instant emotional relief and loyalty.',
 '{"When your audience is overwhelmed","For building emotional connection","When industry advice creates pressure"}',
 '{"When the audience needs motivation to act","For tactical content","When the pressure is actually warranted"}',
 'Write a social post using The Permission Slip framework:
1. Name a common pressure or expectation the reader feels
2. Give them permission to stop / let go / do it differently
3. Offer a new, healthier perspective on the topic
4. End with what they can do instead that actually works
Write each sentence on its own line. The tone should be warm, empathetic, and relieving.',
 true, 119);

-- ============================================================
-- SEED DATA: Template Stage Mappings (from existing config maps)
-- ============================================================

-- Short-form stage mappings
INSERT INTO template_stage_mappings (template_id, funnel_stage, storybrand_stage, is_primary, confidence_score)
SELECT ct.id, m.funnel_stage, m.storybrand_stage, true, 90
FROM (VALUES
  ('problem_insight_reframe', 'awareness', 'character'),
  ('problem_insight_reframe', 'awareness', 'external_problem'),
  ('problem_insight_reframe', 'awareness', 'internal_problem'),
  ('problem_insight_reframe', 'awareness', 'failure'),
  ('problem_insight_reframe', 'consideration', 'external_problem'),
  ('problem_insight_reframe', 'consideration', 'internal_problem'),
  ('myth_truth_proof', 'awareness', 'philosophical_problem'),
  ('myth_truth_proof', 'consideration', 'philosophical_problem'),
  ('myth_truth_proof', 'consideration', 'guide'),
  ('myth_truth_proof', 'conversion', 'philosophical_problem'),
  ('how_it_works', 'awareness', 'plan'),
  ('how_it_works', 'consideration', 'plan'),
  ('how_it_works', 'conversion', 'guide'),
  ('how_it_works', 'conversion', 'plan'),
  ('behind_the_scenes', 'awareness', 'guide'),
  ('behind_the_scenes', 'awareness', 'success'),
  ('behind_the_scenes', 'consideration', 'character'),
  ('behind_the_scenes', 'consideration', 'success'),
  ('behind_the_scenes', 'conversion', 'character'),
  ('comparison_choice', 'awareness', 'call_to_action'),
  ('comparison_choice', 'consideration', 'call_to_action'),
  ('comparison_choice', 'consideration', 'failure'),
  ('comparison_choice', 'conversion', 'external_problem'),
  ('comparison_choice', 'conversion', 'internal_problem'),
  ('comparison_choice', 'conversion', 'call_to_action'),
  ('comparison_choice', 'conversion', 'failure'),
  ('comparison_choice', 'conversion', 'success')
) AS m(template_key, funnel_stage, storybrand_stage)
JOIN content_templates ct ON ct.template_key = m.template_key;

-- Medium-form stage mappings
INSERT INTO template_stage_mappings (template_id, funnel_stage, storybrand_stage, is_primary, confidence_score)
SELECT ct.id, m.funnel_stage, m.storybrand_stage, true, 90
FROM (VALUES
  ('three_point_breakdown', 'awareness', 'character'),
  ('three_point_breakdown', 'awareness', 'guide'),
  ('three_point_breakdown', 'awareness', 'plan'),
  ('three_point_breakdown', 'consideration', 'character'),
  ('problem_cause_solution', 'awareness', 'external_problem'),
  ('problem_cause_solution', 'awareness', 'internal_problem'),
  ('problem_cause_solution', 'awareness', 'philosophical_problem'),
  ('problem_cause_solution', 'awareness', 'failure'),
  ('problem_cause_solution', 'consideration', 'external_problem'),
  ('problem_cause_solution', 'consideration', 'internal_problem'),
  ('problem_cause_solution', 'consideration', 'philosophical_problem'),
  ('problem_cause_solution', 'consideration', 'failure'),
  ('problem_cause_solution', 'conversion', 'external_problem'),
  ('problem_cause_solution', 'conversion', 'internal_problem'),
  ('problem_cause_solution', 'conversion', 'philosophical_problem'),
  ('step_by_step_system', 'consideration', 'guide'),
  ('step_by_step_system', 'consideration', 'plan'),
  ('step_by_step_system', 'conversion', 'guide'),
  ('step_by_step_system', 'conversion', 'plan'),
  ('case_study_example', 'awareness', 'call_to_action'),
  ('case_study_example', 'awareness', 'success'),
  ('case_study_example', 'consideration', 'call_to_action'),
  ('case_study_example', 'consideration', 'success'),
  ('case_study_example', 'conversion', 'character'),
  ('case_study_example', 'conversion', 'call_to_action'),
  ('case_study_example', 'conversion', 'failure'),
  ('case_study_example', 'conversion', 'success')
) AS m(template_key, funnel_stage, storybrand_stage)
JOIN content_templates ct ON ct.template_key = m.template_key;

-- Long-form stage mappings
INSERT INTO template_stage_mappings (template_id, funnel_stage, storybrand_stage, is_primary, confidence_score)
SELECT ct.id, m.funnel_stage, m.storybrand_stage, true, 90
FROM (VALUES
  ('multi_phase_framework', 'awareness', 'guide'),
  ('multi_phase_framework', 'awareness', 'plan'),
  ('multi_phase_framework', 'awareness', 'call_to_action'),
  ('multi_phase_framework', 'awareness', 'success'),
  ('multi_phase_framework', 'consideration', 'call_to_action'),
  ('multi_phase_framework', 'consideration', 'success'),
  ('multi_phase_framework', 'conversion', 'character'),
  ('multi_phase_framework', 'conversion', 'external_problem'),
  ('multi_phase_framework', 'conversion', 'internal_problem'),
  ('multi_phase_framework', 'conversion', 'guide'),
  ('multi_phase_framework', 'conversion', 'plan'),
  ('multi_phase_framework', 'conversion', 'call_to_action'),
  ('multi_phase_framework', 'conversion', 'failure'),
  ('multi_phase_framework', 'conversion', 'success'),
  ('step_by_step_deep', 'consideration', 'plan'),
  ('diagnostic_breakdown', 'awareness', 'character'),
  ('diagnostic_breakdown', 'awareness', 'external_problem'),
  ('diagnostic_breakdown', 'awareness', 'internal_problem'),
  ('diagnostic_breakdown', 'awareness', 'philosophical_problem'),
  ('diagnostic_breakdown', 'awareness', 'failure'),
  ('diagnostic_breakdown', 'consideration', 'character'),
  ('diagnostic_breakdown', 'consideration', 'external_problem'),
  ('diagnostic_breakdown', 'consideration', 'internal_problem'),
  ('diagnostic_breakdown', 'consideration', 'philosophical_problem'),
  ('diagnostic_breakdown', 'consideration', 'guide'),
  ('diagnostic_breakdown', 'consideration', 'failure'),
  ('diagnostic_breakdown', 'conversion', 'philosophical_problem')
) AS m(template_key, funnel_stage, storybrand_stage)
JOIN content_templates ct ON ct.template_key = m.template_key;

-- Carousel stage mappings
INSERT INTO template_stage_mappings (template_id, funnel_stage, storybrand_stage, is_primary, confidence_score)
SELECT ct.id, m.funnel_stage, m.storybrand_stage, true, 90
FROM (VALUES
  ('carousel_problem_steps_cta', 'awareness', 'plan'),
  ('carousel_problem_steps_cta', 'consideration', 'plan'),
  ('carousel_problem_steps_cta', 'conversion', 'guide'),
  ('carousel_problem_steps_cta', 'conversion', 'plan'),
  ('carousel_myth_buster', 'awareness', 'external_problem'),
  ('carousel_myth_buster', 'awareness', 'internal_problem'),
  ('carousel_myth_buster', 'awareness', 'philosophical_problem'),
  ('carousel_myth_buster', 'awareness', 'failure'),
  ('carousel_myth_buster', 'consideration', 'external_problem'),
  ('carousel_myth_buster', 'consideration', 'internal_problem'),
  ('carousel_myth_buster', 'consideration', 'philosophical_problem'),
  ('carousel_myth_buster', 'consideration', 'failure'),
  ('carousel_myth_buster', 'conversion', 'philosophical_problem'),
  ('carousel_before_after', 'awareness', 'call_to_action'),
  ('carousel_before_after', 'awareness', 'success'),
  ('carousel_before_after', 'consideration', 'call_to_action'),
  ('carousel_before_after', 'consideration', 'success'),
  ('carousel_before_after', 'conversion', 'character'),
  ('carousel_before_after', 'conversion', 'external_problem'),
  ('carousel_before_after', 'conversion', 'internal_problem'),
  ('carousel_before_after', 'conversion', 'call_to_action'),
  ('carousel_before_after', 'conversion', 'failure'),
  ('carousel_before_after', 'conversion', 'success'),
  ('carousel_list_tips', 'awareness', 'character'),
  ('carousel_list_tips', 'awareness', 'guide'),
  ('carousel_list_tips', 'consideration', 'character'),
  ('carousel_list_tips', 'consideration', 'guide')
) AS m(template_key, funnel_stage, storybrand_stage)
JOIN content_templates ct ON ct.template_key = m.template_key;

-- Static stage mappings
INSERT INTO template_stage_mappings (template_id, funnel_stage, storybrand_stage, is_primary, confidence_score)
SELECT ct.id, m.funnel_stage, m.storybrand_stage, true, 90
FROM (VALUES
  ('static_stat_insight', 'awareness', 'external_problem'),
  ('static_stat_insight', 'awareness', 'internal_problem'),
  ('static_stat_insight', 'awareness', 'philosophical_problem'),
  ('static_stat_insight', 'awareness', 'failure'),
  ('static_stat_insight', 'consideration', 'external_problem'),
  ('static_stat_insight', 'consideration', 'internal_problem'),
  ('static_stat_insight', 'consideration', 'philosophical_problem'),
  ('static_stat_insight', 'consideration', 'failure'),
  ('static_stat_insight', 'conversion', 'philosophical_problem'),
  ('static_quote_card', 'awareness', 'character'),
  ('static_quote_card', 'awareness', 'guide'),
  ('static_quote_card', 'awareness', 'success'),
  ('static_quote_card', 'consideration', 'character'),
  ('static_quote_card', 'consideration', 'guide'),
  ('static_quote_card', 'consideration', 'success'),
  ('static_quote_card', 'conversion', 'character'),
  ('static_framework_visual', 'awareness', 'plan'),
  ('static_framework_visual', 'consideration', 'plan'),
  ('static_framework_visual', 'conversion', 'guide'),
  ('static_framework_visual', 'conversion', 'plan'),
  ('static_comparison_split', 'awareness', 'call_to_action'),
  ('static_comparison_split', 'consideration', 'call_to_action'),
  ('static_comparison_split', 'conversion', 'external_problem'),
  ('static_comparison_split', 'conversion', 'internal_problem'),
  ('static_comparison_split', 'conversion', 'call_to_action'),
  ('static_comparison_split', 'conversion', 'failure'),
  ('static_comparison_split', 'conversion', 'success')
) AS m(template_key, funnel_stage, storybrand_stage)
JOIN content_templates ct ON ct.template_key = m.template_key;
