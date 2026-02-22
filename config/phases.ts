export interface PhaseTemplate {
  number: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  questions: string[];
  outputVariables: string[];
  questionOutputMap: Record<number, string[]>;
  instructions: string;
}

export const PHASE_TEMPLATES: Record<string, PhaseTemplate> = {
  '1': {
    number: '1',
    name: 'Brand Foundation',
    description: 'Define the internal core of your brand — purpose, vision, values, archetype, and origin story.',
    estimatedMinutes: 25,
    questions: [
      'Why does this business exist beyond making money? Who does it serve and how?',
      'What future are you building? Where do you want this brand to be in 5-10 years?',
      'What values guide your decisions? Give me 3-5 values with a definition and behavioral example for each.',
      'What characteristics should the brand embody? (Personality traits, communication style, how the brand "shows up")',
      'Let\'s identify your brand archetype. Based on everything we\'ve discussed, I\'ll suggest the best-fit archetypes for your brand.',
      'What will this brand NEVER do? Give me 3-5 non-negotiables with the reasoning behind each.',
      'What\'s the brand\'s origin story? How did this business come to be, and what\'s the founder\'s personal journey?',
    ],
    outputVariables: [
      'brand_purpose',
      'brand_vision',
      'brand_mission',
      'brand_values',
      'brand_characteristics',
      'brand_archetype',
      'brand_non_negotiables',
      'brand_origin_story',
      'founder_story',
    ],
    questionOutputMap: {
      0: ['brand_purpose', 'brand_mission'],
      1: ['brand_vision'],
      2: ['brand_values'],
      3: ['brand_characteristics'],
      4: ['brand_archetype'],
      5: ['brand_non_negotiables'],
      6: ['brand_origin_story', 'founder_story'],
    },
    instructions: `Guide the user through Brand Foundation. Ask each question, listen to their answer, help them refine it, and structure it as YAML only after they approve.

QUESTION 0 — PURPOSE & MISSION:
Ask the user why this business exists and who it serves. From their answer, help them separate the emotional WHY (brand_purpose) from the functional mission (brand_mission). If their answer is vague, ask a follow-up to get specifics — but use their words, not yours.

QUESTION 1 — VISION:
Ask where they want the brand to be in 5-10 years. Help them make it specific and measurable if needed, but keep their aspiration intact.

QUESTION 2 — VALUES:
Ask for their core values. For each value they give, help them add a definition and a behavioral example if they haven't already. If they give generic values, ask what makes that value unique to THEIR brand — don't dismiss it.

QUESTION 3 — CHARACTERISTICS:
Ask how the brand should "show up" — personality, tone, style. Help them describe it like a person. Use what they say, refine for clarity.

QUESTION 4 — ARCHETYPE:
Based on their prior answers (purpose, values, characteristics), suggest 2-3 best-fit archetypes with brief reasoning. Let them choose. After they confirm, produce the FULL structured archetype profile with all fields.

QUESTION 5 — NON-NEGOTIABLES:
Ask what the brand will NEVER do. For each one they give, help them add the reasoning behind it if missing. Use their language.

QUESTION 6 — ORIGIN & FOUNDER STORY:
Ask for both the business origin story and the founder's personal journey. Capture their narrative faithfully — these are personal stories, so preserve their voice and emotion.`,
  },
  '2': {
    number: '2',
    name: 'Ideal Customer',
    description: 'Define a complete Ideal Customer Profile with layered depth — demographics, psychographics, pains, desires, and journey.',
    estimatedMinutes: 25,
    questions: [
      'Who is the decision-maker? (Role, company size, industry, revenue, geography, team size)',
      'What frustrates them most? Go deep — surface pain, deeper pain, and root cause.',
      'What do they desire? Both the stated desires AND the unstated/real desires beneath.',
      'What do they tell themselves internally? Capture their self-talk, doubts, hopes, emotional triggers, and breaking points.',
      'What are their beliefs, worldview, and identity? (Psychographics — what they believe, aspire to, value, how they see themselves)',
      'What objections stop them, and what triggers them to finally act?',
      'Map their customer journey — from awareness through advocacy, with touchpoints and emotions at each stage.',
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
      'customer_journey_stages',
    ],
    questionOutputMap: {
      0: ['icp_demographics'],
      1: ['icp_pains'],
      2: ['icp_desires'],
      3: ['icp_internal_dialogue', 'icp_emotional_triggers'],
      4: ['icp_psychographics'],
      5: ['icp_objections', 'icp_buying_triggers'],
      6: ['customer_journey_stages'],
    },
    instructions: `Guide the user through defining their Ideal Customer Profile. Listen to their knowledge of their customer — they know this person. Help them articulate and deepen what they already know.

QUESTION 0 — DEMOGRAPHICS:
Ask who their ideal customer is. Let them describe the person. If they're missing key details (role, company size, industry, geography), ask follow-ups one at a time.

QUESTION 1 — PAINS:
Ask what frustrates their customer most. Help them go deeper if their answer is surface-level — ask "What does that lead to?" or "What's the real cost of that?" Use THEIR examples, not hypothetical ones.

QUESTION 2 — DESIRES:
Ask what their customer truly wants. If they only give functional desires, gently ask about the emotional/personal desires underneath — but only if it feels natural. Don't force layers they don't see.

QUESTION 3 — INTERNAL DIALOGUE & TRIGGERS:
Ask the user to share what their customer says to themselves — doubts, hopes, breaking points. If the user knows specific phrases their customers use, capture those exact words. Don't fabricate internal dialogue.

QUESTION 4 — PSYCHOGRAPHICS:
Ask about their customer's beliefs, values, worldview, and identity. Let the user describe this in their own way. Help structure it, but don't add traits the user didn't mention.

QUESTION 5 — OBJECTIONS & BUYING TRIGGERS:
Ask what objections they hear and what finally makes someone buy. Use the user's actual experience — real objections they've encountered, real moments they've seen trigger a purchase.

QUESTION 6 — CUSTOMER JOURNEY:
Ask the user to walk you through how someone goes from first hearing about them to becoming a loyal customer. Help them map it into stages, but use their actual touchpoints and process.`,
  },
  '3': {
    number: '3',
    name: 'Market Enemy',
    description: 'Define the one enemy your brand fights against — the mindset, system, or broken approach.',
    estimatedMinutes: 10,
    questions: [
      'What keeps creating problems for your customers? What is the real cost — emotionally, financially, in time, and in missed opportunity?',
      'What advice or approach has failed them? What does it promise vs. what it actually delivers, and why do people keep believing it?',
      'Name the enemy. Give it a memorable, brandable name — and define its type (mindset, system, approach, or myth).',
    ],
    outputVariables: [
      'enemy_name',
      'enemy_type',
      'enemy_description',
      'enemy_cost',
      'enemy_false_promises',
    ],
    questionOutputMap: {
      0: ['enemy_description', 'enemy_cost'],
      1: ['enemy_false_promises'],
      2: ['enemy_name', 'enemy_type'],
    },
    instructions: `Guide the user to define the ONE enemy their brand fights against — a mindset, system, or broken approach (never a specific competitor).

QUESTION 0 — ENEMY DESCRIPTION & COST:
Ask the user what keeps creating problems for their customers. Listen to their answer, then help them articulate the cost if they haven't (emotional, financial, time, opportunity). Use their examples, not hypothetical scenarios.

QUESTION 1 — FALSE PROMISES:
Ask what advice or approach has failed their customers before. Let the user describe what doesn't work and why. Help them structure it clearly.

QUESTION 2 — NAME & TYPE:
Ask the user to name this enemy. If they need help, offer 2-3 name ideas based on what they've described — but let them choose or create their own. Define the type (mindset, system, approach, or myth) together.`,
  },
  '4': {
    number: '4',
    name: 'Offer & Lead Magnet',
    description: 'Design a clear, aligned offer and a strategic lead magnet that feeds into it.',
    estimatedMinutes: 30,
    questions: [
      'What core problem does your offer solve?',
      'What specific outcome are you responsible for delivering?',
      'What is included in the offer, and what is explicitly excluded?',
      'What is the transformation? Name the offer and create a tagline.',
      'What type of lead magnet best fits? (Checklist, guide, quiz, template, mini-course) What does it promise?',
      'Outline the lead magnet content — sections, key takeaways, and how it connects to the main offer.',
      'What is the pricing structure? (Tier name, displayed price, billing frequency — once-off, monthly, quarterly, annual)',
      'What are the top 3 objections prospects raise, and what is your ideal response to each?',
    ],
    outputVariables: [
      'offer_problem',
      'offer_outcome',
      'offer_inclusions',
      'offer_exclusions',
      'offer_name',
      'offer_tagline',
      'offer_transformation_before',
      'offer_transformation_after',
      'lead_magnet_type',
      'lead_magnet_title',
      'lead_magnet_promise',
      'lead_magnet_content_outline',
      'offer_price_display',
      'offer_billing_frequency',
      'offer_tier',
      'offer_objections',
    ],
    questionOutputMap: {
      0: ['offer_problem'],
      1: ['offer_outcome'],
      2: ['offer_inclusions', 'offer_exclusions'],
      3: ['offer_transformation_before', 'offer_transformation_after', 'offer_name', 'offer_tagline'],
      4: ['lead_magnet_type', 'lead_magnet_title', 'lead_magnet_promise'],
      5: ['lead_magnet_content_outline'],
      6: ['offer_price_display', 'offer_billing_frequency', 'offer_tier'],
      7: ['offer_objections'],
    },
    instructions: `Guide the user through designing their offer and lead magnet. The user knows their business — help them articulate and structure what they already know.

QUESTION 0 — CORE PROBLEM:
Ask what core problem their offer solves. If vague, ask a follow-up to get specifics. Reference ICP pains from Phase 2 to help them connect the dots, but let them define it.

QUESTION 1 — SPECIFIC OUTCOME:
Ask what specific outcome they deliver. Help them make it measurable if needed, but use their description of the result.

QUESTION 2 — INCLUSIONS & EXCLUSIONS:
Ask what's included and what's explicitly excluded. Help them organize the lists clearly. Don't add items they didn't mention.

QUESTION 3 — TRANSFORMATION & NAMING:
Ask them to describe the before/after transformation. For naming: ask if they have a name in mind. If they want help, offer 3-5 options based on THEIR transformation description — let them choose or modify. Same for the tagline.

QUESTION 4 — LEAD MAGNET TYPE & PROMISE:
Ask the user what type of lead magnet they want. If they already know (e.g., "video mini-course"), that IS the answer — help them refine the title and promise for THAT format. Only suggest alternatives if they explicitly ask for options.

QUESTION 5 — LEAD MAGNET CONTENT:
The lead magnet type was already decided in Question 4 — check the "DECISIONS ALREADY MADE IN THIS PHASE" section. Build the content outline for THAT specific format. Ask the user about sections and key takeaways, then help them structure it.

QUESTION 6 — PRICING:
Ask the user about pricing. Help them define: (1) tier name (e.g. "Premium", "Starter", "Growth"), (2) the displayed price (e.g. "R5,000/month", "$997 once-off"), (3) billing frequency (once-off, monthly, quarterly, or annual). If they have multiple tiers, focus on their PRIMARY offer tier — the one they'd present on a sales call. Output as offer_tier, offer_price_display, and offer_billing_frequency.

QUESTION 7 — OBJECTION HANDLING:
Ask the user for the top 3 objections they hear from prospects and their ideal response to each. Use their REAL sales experience — the objections they actually encounter. For each, capture the objection and the response as a pair. Output as offer_objections — a structured list of {objection, response} pairs.`,
  },
  '5': {
    number: '5',
    name: 'Market Positioning',
    description: 'Define market position, differentiation, category, and competitive landscape.',
    estimatedMinutes: 20,
    questions: [
      'Why does this offer exist? Complete this: "For [ICP] who [need], [Brand] is the [category] that [differentiation] because [proof]."',
      'Why do alternatives fail? What do competitors, DIY, and doing nothing get wrong?',
      'What is your unique mechanism — the thing you do that no one else does?',
      'What category do you own or want to create? Define it clearly.',
      'Map the competitive landscape — who else serves this ICP, what they get right, what they miss, and your strategic advantage.',
    ],
    outputVariables: [
      'positioning_statement',
      'differentiation_statement',
      'category',
      'competitive_landscape',
    ],
    questionOutputMap: {
      0: ['positioning_statement'],
      1: ['differentiation_statement'],
      2: ['differentiation_statement'],
      3: ['category'],
      4: ['competitive_landscape'],
    },
    instructions: `Guide the user through defining their market positioning and competitive differentiation. Position against the ENEMY from Phase 3, not against specific competitors. The user knows their market — help them articulate and sharpen what they already know.

QUESTION 0 — POSITIONING STATEMENT:
Ask the user to describe what makes their offer different and who it's for. Use the formula: "For [ICP] who [need], [Brand] is the [category] that [differentiation] because [proof]." Pull in their Phase 2 ICP data and Phase 3 enemy to help them fill the blanks — but let them choose the final wording. If their first attempt is rough, help refine it using their words.

QUESTION 1 — WHY ALTERNATIVES FAIL:
Ask the user what alternatives their customers typically try before coming to them — competitors, DIY, or doing nothing. Let them describe what goes wrong with each from their real experience. Help them organize these into a clear structure, but use their actual observations, not hypothetical scenarios.

QUESTION 2 — UNIQUE MECHANISM:
Ask the user what they do that nobody else does — their proprietary process, methodology, or approach. If they struggle, ask "What's the specific thing you do that makes results more predictable?" Help them name it and describe why it works, but the mechanism must come from THEM.

QUESTION 3 — CATEGORY:
Ask the user what category they see themselves in. If they feel the existing category doesn't fit, help them articulate a new one. Offer 2-3 options based on their positioning — but let them choose, modify, or create their own. Define what the category means and why it matters.

QUESTION 4 — COMPETITIVE LANDSCAPE:
Ask the user to map who else serves their ICP. Let them describe what competitors get right and what they miss. Help them organize it into a clear strategic view, using their knowledge of the market. This is internal strategy — use their honest assessment.`,
  },
  '6': {
    number: '6',
    name: 'Brand Voice & Messaging',
    description: 'Define vocabulary, tone, core message, and message pillars.',
    estimatedMinutes: 20,
    questions: [
      'What words and phrases should the brand ALWAYS use? Include context for when and how to use each.',
      'What words should the brand NEVER use? Include WHY each is avoided and what message it sends.',
      'What tone describes the brand, and which industry terms do you embrace or reject?',
      'What is the ONE core message? If people remember one thing about this brand, what is it?',
      'What 3-4 supporting message pillars reinforce the core message? Each needs a statement, evidence, ICP pain connection, and content themes it enables.',
    ],
    outputVariables: [
      'vocabulary_preferred',
      'vocabulary_avoided',
      'tone_descriptors',
      'industry_terms_embrace',
      'industry_terms_reject',
      'message_core',
      'message_pillars',
    ],
    questionOutputMap: {
      0: ['vocabulary_preferred'],
      1: ['vocabulary_avoided'],
      2: ['tone_descriptors', 'industry_terms_embrace', 'industry_terms_reject'],
      3: ['message_core'],
      4: ['message_pillars'],
    },
    instructions: `Guide the user through defining their brand voice and messaging framework. This creates consistency across all touchpoints. The user's natural way of communicating is the starting point — help them refine and codify it, not replace it.

QUESTION 0 — PREFERRED VOCABULARY:
Ask the user what words and phrases feel like "them" — words they naturally use with clients, in their content, in conversations. For each word, help them add context for when/how to use it if they haven't. Reference the brand archetype's voice characteristics as a prompt if they're stuck, but the vocabulary should come from their world.

QUESTION 1 — AVOIDED VOCABULARY:
Ask what words or phrases feel wrong for their brand — words that make them cringe or that send the wrong message. For each, help them articulate WHY it's avoided and what to use instead. Use their gut reactions as the guide.

QUESTION 2 — TONE & INDUSTRY TERMS:
Ask the user to describe how they naturally communicate — their default tone, how it shifts in different contexts (formal, social, sales). For industry terms: ask which jargon they embrace (it signals expertise) vs. which they reject (it alienates). Let them decide what fits.

QUESTION 3 — CORE MESSAGE:
Ask the user: "If people remember one thing about your brand, what is it?" Let them answer first. Help them refine it into a clear core message with the underlying belief and the tension it resolves — but the message should come from their words and conviction, not yours.

QUESTION 4 — MESSAGE PILLARS:
Ask the user what key themes or messages they keep coming back to in their business. Help them organize these into 3-4 supporting pillars. For each, help them add: a clear statement, supporting evidence, which ICP pain it addresses, and what content it enables. Build from what they already say and believe.`,
  },
  '7': {
    number: '7',
    name: 'Visual Identity',
    description: 'Define your complete visual identity — logo, colors, typography, and visual direction.',
    estimatedMinutes: 20,
    questions: [
      'Upload your logo (PNG/SVG/JPG) using the upload area above, or describe what you\'d like and we\'ll generate concepts.',
      'Let\'s define your brand color palette. I\'ll present options based on your archetype and brand characteristics.',
      'Let\'s choose your typography. I\'ll suggest Google Font pairings that match your brand mood.',
      'What visual mood and imagery direction fits your brand? (Photography style, illustrations, icons)',
      'Any brand elements, visual rules, or inspirations to define?',
    ],
    outputVariables: [
      'brand_logo_url',
      'brand_color_palette',
      'brand_typography',
      'brand_tagline',
      'visual_mood',
      'imagery_direction',
      'brand_elements',
      'visual_inspirations',
      'brand_visual_assets_summary',
    ],
    questionOutputMap: {
      0: ['brand_logo_url', 'brand_visual_assets_summary'],
      1: ['brand_color_palette'],
      2: ['brand_typography'],
      3: ['visual_mood', 'imagery_direction', 'brand_tagline'],
      4: ['brand_elements', 'visual_inspirations'],
    },
    instructions: `Guide the user through creating their visual identity. Use their brand archetype, characteristics, values, and personality from Phase 1 to inform suggestions — but the user makes every final decision.

QUESTION 0 — LOGO & VISUAL ASSETS:
The user may upload a logo file using the upload component above the chat, or describe what they'd like. If they upload one, acknowledge it and move on. If they want AI generation, help them describe their vision clearly. If they have no logo yet, that's fine — acknowledge it and note they can add one later.

IMPORTANT: The user also has a "Visual Assets" panel where they can upload logo variants (dark bg, light bg, icon), patterns, and mood board images. Encourage them to upload different logo variants for different backgrounds, and any patterns or mood board images that represent their brand's visual direction. These will appear on their brand guide page.

For brand_logo_url output: If the user uploaded a logo, output the URL they provide. If not, output "none".
For brand_visual_assets_summary output: Summarize what visual assets the user has uploaded (e.g., "Primary logo, dark variant, 3 mood board images"). If none, output "none".

QUESTION 1 — COLOR PALETTE:
Present EXACTLY 3 named color palette options inspired by their archetype's color_associations from Phase 1. Each palette must include: a creative palette name, primary (hex), dark_base (hex), accent (hex), light (hex), neutral (hex). Recommend ONE with reasoning, but let the user choose, modify, or request new options. Only save the palette they explicitly approve.

Present them as YAML like this:
\`\`\`yaml
brand_color_palette:
  name: "Palette Name"
  primary: "#hex"
  dark_base: "#hex"
  accent: "#hex"
  light: "#hex"
  neutral: "#hex"
\`\`\`

QUESTION 2 — TYPOGRAPHY:
Suggest 2-3 Google Font pairings that match the brand mood and archetype visual style. Explain why each works. Let the user choose. If they have a font preference already, use that as the starting point. Output as:
\`\`\`yaml
brand_typography:
  heading_font: "Font Name"
  heading_weight: "700"
  body_font: "Font Name"
  body_weight: "400"
\`\`\`

QUESTION 3 — VISUAL MOOD, IMAGERY & TAGLINE:
Ask the user what visual mood fits their brand (e.g., Premium, Bold, Minimal, Warm, Technical) and what kind of imagery they envision (photography style, illustrations, icons). If they're unsure, offer 2-3 mood directions based on their archetype — let them choose. Output as visual_mood and imagery_direction strings.

Also propose a brand tagline — a short, memorable phrase that captures the brand's essence (e.g., "Just Do It", "Think Different"). Propose 3 options based on everything discussed. Let the user choose or create their own. Output as brand_tagline string.

QUESTION 4 — BRAND ELEMENTS & INSPIRATIONS:
Ask the user about any additional visual rules, brand elements, or visual inspirations they have in mind. If they have reference brands or images, capture those. If they have nothing specific, that's okay — help them define basic visual rules based on their earlier choices.`,
  },
  '8': {
    number: '8',
    name: 'Design System',
    description: 'Build a complete design system with color roles, typography scale, and component specifications.',
    estimatedMinutes: 15,
    questions: [
      'Let\'s expand your Phase 7 color palette into a full color system with roles, tints, and usage rules.',
      'Let\'s define your typography scale — sizes, weights, and line heights for headings, body, and UI elements.',
      'Define component design patterns and any animation/motion preferences.',
    ],
    outputVariables: [
      'design_system_colors',
      'design_system_typography',
      'design_system_components',
      'design_system_animations',
    ],
    questionOutputMap: {
      0: ['design_system_colors'],
      1: ['design_system_typography'],
      2: ['design_system_components', 'design_system_animations'],
    },
    instructions: `This phase is TECHNICAL — most users are not designers and won't know terms like "transitions", "line-height", or "spacing systems". YOUR JOB is to take the lead: analyze everything from Phases 1-7 (archetype, visual mood, color palette, typography, imagery direction) and BUILD the best design system yourself.

CRITICAL BEHAVIOR FOR THIS PHASE: Unlike other phases where you wait for user input, in Phase 8 YOU propose the full technical system upfront. Include the YAML output block IN your initial proposal message — do NOT wait for a separate confirmation step before producing YAML. The flow is:
1. Build the best design system based on all prior brand variables
2. Explain each choice in plain English so the user understands it
3. Include the YAML block right there in the same message
4. Ask: "If this looks right, click **Save & Continue** to lock it in. Want me to adjust anything?"
5. If user says "yes" or "looks good" — the YAML is already saved as a draft. They just need to lock it.
6. If user wants changes — adjust and present updated YAML immediately.

DO NOT describe the system in plain English first and then ask permission to create YAML in a separate step. That creates unnecessary back-and-forth. Present explanation + YAML together in ONE message.

QUESTION 0 — FULL COLOR SYSTEM:
Take the brand_color_palette from Phase 7 and automatically expand it into a full color system. Explain each role in plain English, AND include the YAML block in the same message.

\`\`\`yaml
design_system_colors:
  primary:
    hex: "#hex"
    rgb: "r, g, b"
    role: "Primary CTA buttons, links, key accents"
  dark_base:
    hex: "#hex"
    rgb: "r, g, b"
    role: "Dark backgrounds, headers, footer"
  accent:
    hex: "#hex"
    rgb: "r, g, b"
    role: "Accent highlights, hover states, badges"
  light:
    hex: "#hex"
    rgb: "r, g, b"
    role: "Page backgrounds, light sections"
  neutral:
    hex: "#hex"
    rgb: "r, g, b"
    role: "Body text, borders, subtle elements"
\`\`\`

QUESTION 1 — TYPOGRAPHY SCALE:
Using the brand_typography fonts from Phase 7, automatically build a complete typography scale. Explain what each level is for in plain English, AND include the YAML block in the same message.

\`\`\`yaml
design_system_typography:
  display:
    font: "Heading Font"
    size: "48px"
    weight: "700"
    line_height: "1.2"
  heading:
    font: "Heading Font"
    size: "32px"
    weight: "700"
    line_height: "1.3"
  subheading:
    font: "Heading Font"
    size: "24px"
    weight: "600"
    line_height: "1.4"
  body:
    font: "Body Font"
    size: "16px"
    weight: "400"
    line_height: "1.6"
  small:
    font: "Body Font"
    size: "14px"
    weight: "400"
    line_height: "1.5"
  caption:
    font: "Body Font"
    size: "12px"
    weight: "500"
    line_height: "1.4"
\`\`\`

QUESTION 2 — COMPONENTS & ANIMATION:
This is the most technical part. Based on the brand's visual mood (Phase 7), archetype personality (Phase 1), and overall brand feel, BUILD the best component styles and animations yourself. Explain each choice in plain English AND include the YAML block in the same message:
- Buttons: "Rounded with a solid fill — feels approachable and clear"
- Cards: "Clean with subtle shadows — professional without being heavy"
- Transitions: "Smooth, gentle hover effects — nothing jarring, matches your premium feel"
- Scroll animations: "Sections fade in softly as you scroll — keeps it elegant"

Include BOTH YAML blocks together:
\`\`\`yaml
design_system_components:
  buttons: "description"
  cards: "description"
  forms: "description"
  spacing: "description"
design_system_animations:
  transitions: "description"
  scroll: "description"
  loading: "description"
\`\`\`

Then say: "If this looks right, click **Save & Continue** to lock it in. Want me to adjust anything?"`,
  },
  '9': {
    number: '9',
    name: 'Website Strategy & Copy',
    description: 'Define website architecture, content strategy, and write copy for all key pages.',
    estimatedMinutes: 45,
    questions: [
      'What is the primary role of the website? (Generate leads, sell directly, build authority)',
      'What are the primary and secondary conversion actions?',
      'How will people find this site, what pages do you need, and what is the user journey?',
      'What content themes, pillars, and beliefs do you need to teach your market?',
      'Let\'s write the homepage — hero section, problem statement, solution, and who you help.',
      'Continue the homepage — proof, why choose us, and final CTA.',
      'Sales page opening — hero, story/pain narrative, and turning point where you name the enemy.',
      'Sales page close — value stack, transformation, proof, FAQ, and final CTA.',
      'Supporting pages — about page, problems page, and results page.',
      'Conversion pages — application/booking page, form fields, CTA, and reassurance copy.',
      'Lead magnet page — headline, supporting copy, and CTA.',
    ],
    outputVariables: [
      'website_role',
      'primary_conversion',
      'secondary_conversion',
      'traffic_sources',
      'website_sitemap',
      'user_journey',
      'content_themes',
      'content_pillars',
      'beliefs_to_teach',
      'homepage_hero',
      'homepage_problem',
      'homepage_solution',
      'homepage_who_we_help',
      'homepage_proof',
      'homepage_why_us',
      'homepage_final_cta',
      'sales_page_hero',
      'sales_page_story_pain',
      'sales_page_turn_enemy',
      'sales_page_value_stack',
      'sales_page_transformation',
      'sales_page_proof',
      'sales_page_faq',
      'sales_page_final_cta',
      'about_page_copy',
      'problems_page_copy',
      'results_page_copy',
      'apply_page_copy',
      'form_fields',
      'form_cta',
      'reassurance',
      'lead_page_headline',
      'lead_page_copy',
      'lead_page_cta',
    ],
    questionOutputMap: {
      0: ['website_role'],
      1: ['primary_conversion', 'secondary_conversion'],
      2: ['traffic_sources', 'website_sitemap', 'user_journey'],
      3: ['content_themes', 'content_pillars', 'beliefs_to_teach'],
      4: ['homepage_hero', 'homepage_problem', 'homepage_solution', 'homepage_who_we_help'],
      5: ['homepage_proof', 'homepage_why_us', 'homepage_final_cta'],
      6: ['sales_page_hero', 'sales_page_story_pain', 'sales_page_turn_enemy'],
      7: ['sales_page_value_stack', 'sales_page_transformation', 'sales_page_proof', 'sales_page_faq', 'sales_page_final_cta'],
      8: ['about_page_copy', 'problems_page_copy', 'results_page_copy'],
      9: ['apply_page_copy', 'form_fields', 'form_cta', 'reassurance'],
      10: ['lead_page_headline', 'lead_page_copy', 'lead_page_cta'],
    },
    instructions: `Guide the user through website strategy and copywriting. Use the brand's voice, messaging framework, and ICP insights from all earlier phases. For strategy questions (0-3), collaborate with the user. For copy questions (4-10), draft copy using the user's locked brand variables, present it for review, and revise based on their feedback. The user's voice and message pillars drive the copy — don't invent new messaging.

QUESTION 0 — WEBSITE ROLE:
Ask the user what the primary role of their website is — generate leads, sell directly, build authority, or a combination. Let them define it. If they're unsure, present 2-3 options based on their business type and offer from Phase 4.

QUESTION 1 — CONVERSION ACTIONS:
Ask the user what they want visitors to DO on the site — primary action (book call, apply, download, purchase) and secondary action (newsletter, follow, download lead magnet). Use their answer directly.

QUESTION 2 — TRAFFIC, SITEMAP & JOURNEY:
Ask the user how people currently find them and how they plan to drive traffic. Help them map the pages needed (lean — only pages that serve a purpose) and the user journey from landing to conversion. Use their actual channels and process, not hypothetical ones.

QUESTION 3 — CONTENT STRATEGY:
Ask the user what topics they have authority to speak on, and what beliefs their market needs to shift before buying. Help them organize into content themes, content pillars, and beliefs to teach. Build from their expertise and message pillars from Phase 6.

QUESTION 4 — HOMEPAGE (PART 1):
Draft homepage copy: hero (headline + subheadline + CTA), problem section, solution section, who-we-help section. Pull from ICP pains/desires (Phase 2), core message (Phase 6), and positioning (Phase 5). Present the draft, explain your choices, and let the user revise before saving.

QUESTION 5 — HOMEPAGE (PART 2):
Draft: proof section, why-us section, final CTA section. Reference the user's differentiation (Phase 5) and offer (Phase 4). Present for review — the user may want to adjust tone, emphasis, or specific claims.

QUESTION 6 — SALES PAGE OPENING:
Draft: sales_page_hero (headline, subheadline, hook), sales_page_story_pain (pain narrative), sales_page_turn_enemy (name the enemy from Phase 3, explain why previous solutions failed). Use StoryBrand framework — customer is hero, brand is guide. Present for user review.

QUESTION 7 — SALES PAGE CLOSE:
Draft: value stack, transformation (before/after from Phase 4), proof section, FAQ (address objections from Phase 2), final CTA. Present for user review and revision.

QUESTION 8 — SUPPORTING PAGES:
Draft: about page (positions founder as guide, uses origin story from Phase 1), problems page (ICP problems from Phase 2), results page (proof-focused). Present each for review.

QUESTION 9 — CONVERSION PAGES:
Ask the user what their conversion page should include — application form, booking page, or checkout. Draft the copy, form fields, CTA, and reassurance copy based on their answer. Let them refine.

QUESTION 10 — LEAD MAGNET PAGE:
Draft: headline, supporting copy, and CTA for the lead magnet landing page. Reference the lead magnet defined in Phase 4. Present for user review — they know what messaging resonates with their audience.`,
  },
  '10': {
    number: '10',
    name: 'Growth Engine',
    description: 'Build your authority platform and conversion strategy using the Key Person of Influence 5P framework.',
    estimatedMinutes: 30,
    questions: [
      'Perfect your pitch — create your one-liner, elevator pitch, and signature talk title.',
      'What will you publish, where, and how often? (Book, podcast, newsletter, blog, social)',
      'Map your product ecosystem — from free lead magnet through core offer to premium tier.',
      'Build your profile and PR plan — media targets, speaking opportunities, awards, thought leadership.',
      'Define strategic partnerships — who to partner with, why, and how.',
      'Based on EVERYTHING we\'ve built across all phases, what is the best conversion model for THIS specific business?',
    ],
    outputVariables: [
      'authority_pitch',
      'authority_publish_plan',
      'authority_product_ecosystem',
      'authority_profile_plan',
      'authority_partnerships',
      'conversion_business_type',
      'conversion_strategy',
      'conversion_funnel',
      'conversion_metrics',
    ],
    questionOutputMap: {
      0: ['authority_pitch'],
      1: ['authority_publish_plan'],
      2: ['authority_product_ecosystem'],
      3: ['authority_profile_plan'],
      4: ['authority_partnerships'],
      5: ['conversion_business_type', 'conversion_strategy', 'conversion_funnel', 'conversion_metrics'],
    },
    instructions: `Guide the user through building their Growth Engine using Daniel Priestley's Key Person of Influence 5P framework combined with strategic conversion planning. The user knows their business and industry — help them articulate and structure their growth strategy using what they've already built in phases 1-9.

QUESTION 0 — PERFECT YOUR PITCH:
Ask the user how they currently describe what they do. Help them refine it into three formats: (1) a one-liner, (2) a 60-second elevator pitch, (3) a signature talk title. Draft each using their words, brand foundation, and positioning — then present for review. If they have existing pitches, start from those and refine.

QUESTION 1 — PUBLISHING STRATEGY:
Ask the user what they're already publishing or plan to publish — book, podcast, newsletter, blog, social content. Ask where and how often. Help them organize this into a structured publishing plan aligned with their content pillars from Phase 6. If they're starting from scratch, ask what format excites them most and build from there.

QUESTION 2 — PRODUCT ECOSYSTEM:
Ask the user to describe their current or planned product/service tiers — from free to premium. Reference their lead magnet (Phase 4) as the free tier and their core offer (Phase 4) as the anchor. Help them map the ladder and add pricing rationale if they want it. Don't invent tiers they haven't mentioned — ask what levels they envision.

QUESTION 3 — PROFILE & PR PLAN:
Ask the user about their current visibility — speaking, media, awards, thought leadership. Help them build a PR strategy from where they are now. Ask what opportunities they'd most like to pursue. Don't fabricate media targets — ask what's relevant to their industry and help them organize a plan.

QUESTION 4 — STRATEGIC PARTNERSHIPS:
Ask the user who they'd most like to partner with and why — complementary businesses, influencers, industry bodies. Help them define collaboration models and expected outcomes for each. Use their network knowledge, not generic suggestions.

QUESTION 5 — CONVERSION PLAN:
This is the capstone question. Ask the user how they currently convert prospects to customers — their existing sales process. Then, using ALL prior phases (archetype sales approach, ICP buying triggers, offer structure, positioning), help them design the optimal conversion plan:
- conversion_business_type: Classify together with the user
- conversion_strategy: Present 2-3 approach options (VSL, application funnel, community, event, direct sales, hybrid) with reasoning tied to THEIR specific business — let them choose
- conversion_funnel: Map the specific path together — use their actual process as the starting point
- conversion_metrics: Help them define what to track at each stage

Present the full conversion plan as YAML draft for user review before saving. This must be fully personalized to THIS business — reference specific outputs from earlier phases.`,
  },
};

export function getPhaseTemplate(phaseNumber: string): PhaseTemplate | undefined {
  return PHASE_TEMPLATES[phaseNumber];
}

export function getAllPhases(): PhaseTemplate[] {
  return Object.values(PHASE_TEMPLATES);
}
