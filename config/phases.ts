export interface PhaseTemplate {
  number: string;
  name: string;
  description: string;
  questions: string[];
  outputVariables: string[];
  instructions: string;
}

export const PHASE_TEMPLATES: Record<string, PhaseTemplate> = {
  '1': {
    number: '1',
    name: 'Brand Substance',
    description: 'Define the internal core of your brand.',
    questions: [
      'Why does this business exist beyond money?',
      'What future are you building?',
      'What values guide your decisions?',
      'What characteristics should the brand embody?',
      'Which archetype fits best? (Guide, Rebel, Creator, Hero, Sage, Magician, Ruler, Caregiver, Innocent, Explorer, Lover, Jester)',
      'What will this brand NEVER do?',
    ],
    outputVariables: [
      'brand_purpose',
      'brand_vision',
      'brand_mission',
      'brand_values',
      'brand_characteristics',
      'brand_archetype',
      'brand_non_negotiables',
    ],
    instructions: `Ask these questions one at a time. Structure the user's raw answers into clear, concise outputs. Challenge vague answers. When complete, present the outputs as YAML and ask for confirmation before locking.`,
  },
  '2': {
    number: '2',
    name: 'ICP Definition',
    description: 'Define a complete Ideal Customer Profile with depth.',
    questions: [
      'Who is the decision-maker? (Role, company size, industry)',
      'What frustrates them most about their current situation?',
      'What do they desire most? (Outcomes, not features)',
      'What do they tell themselves internally? (Self-talk, doubts, hopes)',
      'What objections stop them from taking action?',
      'What triggers them to finally seek change?',
    ],
    outputVariables: [
      'icp_demographics',
      'icp_psychographics',
      'icp_pains',
      'icp_desires',
      'icp_emotional_triggers',
      'icp_internal_dialogue',
      'icp_objections',
      'icp_buying_triggers',
    ],
    instructions: `Create a full ICP including demographics, psychographics, pains, desires, emotional triggers, internal dialogue, objections, and buying triggers. Make it specific enough to recognize this person in a room.`,
  },
  '2A': {
    number: '2A',
    name: 'Enemy Definition',
    description: 'Define the one enemy your brand fights against.',
    questions: [
      'What keeps creating confusion or frustration for your customers?',
      'What advice or approach has failed them?',
      'If ONE thing disappeared from your industry, what would help most?',
    ],
    outputVariables: [
      'enemy_name',
      'enemy_type',
      'enemy_description',
      'enemy_cost',
      'enemy_false_promises',
    ],
    instructions: `Define ONE clear enemy. Name it something memorable. The enemy is never a specific competitor—it's a mindset, system, or broken approach.`,
  },
  '3': {
    number: '3',
    name: 'Offer Design',
    description: 'Design a clear, aligned offer.',
    questions: [
      'What core problem do you solve?',
      'What specific outcome are you responsible for delivering?',
      'What is included in the offer?',
      'What is explicitly excluded?',
    ],
    outputVariables: [
      'offer_problem',
      'offer_outcome',
      'offer_inclusions',
      'offer_exclusions',
    ],
    instructions: `Design an offer that directly addresses the ICP's pains and delivers their desires. Ensure alignment with brand values. Clear inclusions and exclusions prevent scope creep.`,
  },
  '4': {
    number: '4',
    name: 'Brandable Naming',
    description: 'Create a brandable, ownable name for the offer.',
    questions: [
      'What transformation occurs when someone completes your offer?',
      'Can this scale into a framework or methodology?',
      'What metaphors or imagery represent this transformation?',
    ],
    outputVariables: [
      'offer_name',
      'offer_tagline',
      'offer_transformation_before',
      'offer_transformation_after',
    ],
    instructions: `Generate 5-10 brandable name options. Names should be memorable, ownable, hint at transformation, and work as a framework name.`,
  },
  '5': {
    number: '5',
    name: 'Positioning',
    description: 'Define market position and differentiation.',
    questions: [
      'Why does this offer exist? (Beyond "to make money")',
      'Why do alternatives fail? (Competitors, DIY, doing nothing)',
      'What do you do that no one else does?',
      'What would you want to be known for in 5 years?',
    ],
    outputVariables: [
      'positioning_statement',
      'differentiation_statement',
      'category',
    ],
    instructions: `Create positioning and differentiation statements. If no clear category exists, help create one. Position against the ENEMY, not competitors.`,
  },
  '6A': {
    number: '6A',
    name: 'Brand Vocabulary',
    description: 'Control language for consistency.',
    questions: [
      'What words should the brand ALWAYS use?',
      'What words should the brand NEVER use?',
      'What tone describes the brand? (e.g., Direct, Warm, Technical, Casual)',
      'Any industry jargon to embrace or reject?',
    ],
    outputVariables: [
      'vocabulary_preferred',
      'vocabulary_avoided',
      'tone_descriptors',
      'industry_terms_embrace',
      'industry_terms_reject',
    ],
    instructions: `Define preferred and avoided vocabulary. This creates consistency across all touchpoints.`,
  },
  '6B': {
    number: '6B',
    name: 'Messaging Framework',
    description: 'Build core messaging architecture.',
    questions: [
      'What is the ONE core message? (If people remember one thing, what is it?)',
      'What 3-4 supporting messages reinforce the core?',
      'What proof points back up each message?',
    ],
    outputVariables: [
      'message_core',
      'message_pillars',
    ],
    instructions: `Build a messaging framework with one core message and 3-4 supporting pillars. Each pillar needs proof.`,
  },
  '7': {
    number: '7',
    name: 'Brand Governance',
    description: 'Define visual identity guidelines and brand governance rules.',
    questions: [
      'Do you have an existing logo? If yes, describe it. If no, what direction feels right?',
      'What visual mood fits the brand? (Premium, Bold, Minimal, Warm, Technical, etc.)',
      'What colors feel right? Any colors to avoid?',
      'What brands (in any industry) have a visual style you admire?',
      'Any specific imagery direction? (Photography style, illustrations, icons)',
    ],
    outputVariables: [
      'visual_mood',
      'color_direction',
      'typography_direction',
      'brand_elements',
      'imagery_direction',
      'logo_status',
      'visual_inspirations',
    ],
    instructions: `Capture visual direction without requiring final design decisions. This phase informs the design system created later.`,
  },
  '8': {
    number: '8',
    name: 'Website Architecture',
    description: 'Define site structure, page purposes, and user flow.',
    questions: [
      'What is the primary role of the website? (Generate leads, sell directly, build authority)',
      'What is the primary conversion action? (Book call, apply, download, purchase)',
      'What is the secondary conversion action?',
      'How will people find this site? (Organic search, social, ads, referrals)',
      'What pages do you need?',
    ],
    outputVariables: [
      'website_role',
      'primary_conversion',
      'secondary_conversion',
      'traffic_sources',
      'website_sitemap',
      'user_journey',
    ],
    instructions: `Define sitemap with page type classification, purpose, CTAs, and traffic sources for each page. Keep it lean—only pages that serve a purpose.`,
  },
  '8A': {
    number: '8A',
    name: 'Content Themes',
    description: 'Define content pillars that inform website sections and ongoing content.',
    questions: [
      'What 3-5 topics does your brand have authority to speak on?',
      'What beliefs do you need to teach your market?',
      'What categories would your blog/resources be organized into?',
      'What topics align with your ICP\'s problems and your solution?',
    ],
    outputVariables: [
      'content_themes',
      'beliefs_to_teach',
    ],
    instructions: `Define content themes that ladder up to the brand's positioning and address ICP pains. Each theme should connect to a specific ICP pain point.`,
  },
  '8B': {
    number: '8B',
    name: 'Homepage Copy',
    description: 'Write the homepage copy using locked strategy.',
    questions: [
      'What\'s the key frustration your visitor arrives with?',
      'What headline would stop them in their tracks?',
      'What proof do you have that you can solve it?',
      'What objections might they have on the homepage?',
    ],
    outputVariables: [
      'homepage_hero',
      'homepage_problem',
      'homepage_solution',
      'homepage_who_we_help',
      'homepage_proof',
      'homepage_why_us',
      'homepage_final_cta',
    ],
    instructions: `Write homepage copy using the messaging framework, vocabulary, and ICP insights. Copy should address pain immediately, present solution clearly, include proof, and drive to CTA.`,
  },
  '8C': {
    number: '8C',
    name: 'Sales Page Copy',
    description: 'Write long-form sales page copy for the primary offer.',
    questions: [
      'What\'s the #1 objection you need to overcome?',
      'What proof/case study is your strongest?',
      'What happens if they don\'t solve this problem?',
      'Who is this explicitly NOT for?',
    ],
    outputVariables: [
      'sales_page_hero',
      'sales_page_story_pain',
      'sales_page_turn_enemy',
      'sales_page_value_stack',
      'sales_page_transformation',
      'sales_page_proof',
      'sales_page_faq',
      'sales_page_final_cta',
    ],
    instructions: `Write long-form sales page copy following the 15-section structure. Use StoryBrand framework (customer is hero, brand is guide).`,
  },
  '8D': {
    number: '8D',
    name: 'Supporting Pages',
    description: 'Write copy for authority and pain-focused pages.',
    questions: [
      'What\'s your origin story?',
      'What results have you achieved for clients?',
      'What specific problems do clients come to you with?',
    ],
    outputVariables: [
      'about_page_copy',
      'problems_page_copy',
      'results_page_copy',
    ],
    instructions: `Write supporting page copy that builds trust and addresses pain. About page positions founder as guide. Results page is proof-heavy.`,
  },
  '8E': {
    number: '8E',
    name: 'Conversion Pages',
    description: 'Write copy for pages where the conversion happens.',
    questions: [
      'What information do you need to collect?',
      'What happens immediately after they submit?',
      'What objections might stop them at the form?',
      'Is this a booking, application, or purchase?',
    ],
    outputVariables: [
      'apply_page_copy',
      'form_fields',
      'form_cta',
      'reassurance',
    ],
    instructions: `Write conversion page copy that reduces friction and qualifies leads. Keep copy direct—this page is about action.`,
  },
  '8F': {
    number: '8F',
    name: 'Visual Direction',
    description: 'Create specific visual specifications for website implementation.',
    questions: [
      'Review the visual direction from Phase 7—ready to lock specific colors?',
      'What fonts are available/preferred? (Google Fonts recommended)',
      'Any specific design elements that feel "on brand"?',
    ],
    outputVariables: [
      'design_system_colors',
      'design_system_typography',
      'design_system_components',
      'design_system_animations',
    ],
    instructions: `Create a specific, implementable design system. Define all components needed for the website.`,
  },
  '9': {
    number: '9',
    name: 'Conversion System',
    description: 'Design the lead-to-customer flow.',
    questions: [
      'What is the primary conversion action? (Book call, download, purchase, subscribe)',
      'What happens immediately after conversion?',
      'What is the nurture sequence?',
      'How do leads become customers?',
    ],
    outputVariables: [
      'conversion_flow',
      'secondary_conversion',
      'nurture_sequence',
    ],
    instructions: `Design complete conversion flow from first touch to customer. Include trigger, immediate response, nurture sequence, and sales process.`,
  },
  '10': {
    number: '10',
    name: 'Authority System',
    description: 'Build trust and credibility.',
    questions: [
      'What proof do you have? (Case studies, testimonials, results, credentials)',
      'What beliefs must you teach your market?',
      'What content establishes expertise?',
      'What partnerships or associations add credibility?',
    ],
    outputVariables: [
      'authority_assets',
      'authority_gaps',
    ],
    instructions: `Define authority assets. Identify gaps and recommend what to build. Authority should support positioning and overcome ICP objections.`,
  },
  '11': {
    number: '11',
    name: 'Content Calendar',
    description: 'Plan ongoing content execution.',
    questions: [
      'What is realistic cadence? (Daily, 3x week, weekly)',
      'What formats work best? (Written, video, audio, mixed)',
      'What platforms are priority?',
    ],
    outputVariables: [
      'content_plan',
      'content_cadence',
      'content_platforms',
    ],
    instructions: `Create content plan aligned with authority system and ICP interests. Each piece should connect to a content theme and support overall positioning.`,
  },
  '12': {
    number: '12',
    name: 'Implementation',
    description: 'Validate system readiness and define implementation artifacts.',
    questions: [
      'Are all previous phases complete with locked outputs?',
      'What deliverables need to be produced?',
      'What is the priority order for implementation?',
    ],
    outputVariables: [
      'implementation_artifacts',
      'implementation_ready',
      'gaps_identified',
      'next_actions',
      'priority_order',
    ],
    instructions: `Validate all phases are complete. Identify gaps. Define all implementation artifacts with specific formats.`,
  },
};

export function getPhaseTemplate(phaseNumber: string): PhaseTemplate | undefined {
  return PHASE_TEMPLATES[phaseNumber];
}

export function getAllPhases(): PhaseTemplate[] {
  return Object.values(PHASE_TEMPLATES);
}
