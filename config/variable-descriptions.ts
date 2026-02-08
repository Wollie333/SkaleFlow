/**
 * Variable descriptions for every brand output key.
 * Used in the playbook two-column layout to explain what each variable represents.
 */

export const VARIABLE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  // Phase 1: Brand Foundation
  brand_purpose: { label: 'Brand Purpose', description: "Your brand's fundamental reason for existing beyond profit." },
  brand_vision: { label: 'Brand Vision', description: 'The future state your brand is working to create.' },
  brand_mission: { label: 'Brand Mission', description: 'How your brand delivers on its purpose day-to-day.' },
  brand_values: { label: 'Brand Values', description: 'The principles that guide every decision and action.' },
  brand_characteristics: { label: 'Brand Characteristics', description: 'The personality traits and behaviors that define how the brand shows up.' },
  brand_archetype: { label: 'Brand Archetype', description: 'The universal character pattern your brand embodies.' },
  brand_non_negotiables: { label: 'Non-Negotiables', description: 'The lines your brand will never cross, and the reasoning behind each.' },
  brand_origin_story: { label: 'Origin Story', description: 'How the business came to exist — the gap noticed and the moment of inception.' },
  founder_story: { label: 'Founder Story', description: "The founder's personal journey, experiences, and beliefs that led here." },

  // Phase 2: Ideal Customer
  icp_demographics: { label: 'ICP Demographics', description: 'Role, industry, company size, geography, and decision-making authority.' },
  icp_psychographics: { label: 'ICP Psychographics', description: 'Beliefs, worldview, aspirations, identity, and lifestyle of your ideal customer.' },
  icp_pains: { label: 'ICP Pains', description: 'The surface frustrations, deeper impacts, and root causes your customer faces.' },
  icp_desires: { label: 'ICP Desires', description: 'What your customer says they want — and what they actually want beneath.' },
  icp_emotional_triggers: { label: 'Emotional Triggers', description: 'The breaking points, FOMO moments, and catalytic events that force action.' },
  icp_internal_dialogue: { label: 'Internal Dialogue', description: 'The self-talk, doubts, hopes, and internal narratives your customer carries.' },
  icp_objections: { label: 'Objections', description: 'What stops them from buying — the stated concern and the real one underneath.' },
  icp_buying_triggers: { label: 'Buying Triggers', description: 'The external events and internal shifts that finally push them to act.' },
  customer_journey_stages: { label: 'Customer Journey', description: 'The path from awareness through advocacy, with emotions at each stage.' },

  // Phase 3: Market Enemy
  enemy_name: { label: 'Enemy Name', description: 'The branded name for the mindset, system, or approach your brand fights against.' },
  enemy_type: { label: 'Enemy Type', description: 'Whether the enemy is a mindset, system, approach, or myth.' },
  enemy_description: { label: 'Enemy Description', description: 'What keeps creating problems for your customers and why.' },
  enemy_cost: { label: 'Enemy Cost', description: 'The emotional, financial, time, and opportunity costs of the enemy.' },
  enemy_false_promises: { label: 'False Promises', description: 'The failed advice and broken approaches that have let customers down.' },

  // Phase 4: Offer & Lead Magnet
  offer_problem: { label: 'Core Problem', description: 'The specific problem your offer solves.' },
  offer_outcome: { label: 'Specific Outcome', description: 'The measurable, time-bound result your offer delivers.' },
  offer_inclusions: { label: 'Offer Inclusions', description: 'Everything included in the offer.' },
  offer_exclusions: { label: 'Offer Exclusions', description: 'What is explicitly not included — setting clear boundaries.' },
  offer_name: { label: 'Offer Name', description: 'The memorable, brandable name for your offer.' },
  offer_tagline: { label: 'Offer Tagline', description: 'The one-line promise that communicates the core value.' },
  offer_transformation_before: { label: 'Before State', description: 'Where your customer is now — the pain, frustration, and limitations.' },
  offer_transformation_after: { label: 'After State', description: 'Where your customer will be — the outcome, relief, and new reality.' },
  lead_magnet_type: { label: 'Lead Magnet Type', description: 'The format that best fits your ICP and offer (guide, checklist, quiz, etc.).' },
  lead_magnet_title: { label: 'Lead Magnet Title', description: 'The compelling title that promises a specific quick win.' },
  lead_magnet_promise: { label: 'Lead Magnet Promise', description: 'The specific result someone gets from consuming the lead magnet.' },
  lead_magnet_content_outline: { label: 'Lead Magnet Outline', description: 'Sections, key takeaways, and how it connects to the main offer.' },

  // Phase 5: Market Positioning
  positioning_statement: { label: 'Positioning Statement', description: 'For [ICP] who [need], [Brand] is the [category] that [differentiates] because [proof].' },
  differentiation_statement: { label: 'Differentiation', description: 'Why alternatives fail and what makes your approach uniquely effective.' },
  category: { label: 'Category', description: 'The market category you own or are creating.' },
  competitive_landscape: { label: 'Competitive Landscape', description: 'Who else serves your ICP, what they get right, and your strategic advantage.' },

  // Phase 6: Brand Voice & Messaging
  vocabulary_preferred: { label: 'Preferred Vocabulary', description: 'Words and phrases the brand always uses, with context for when and how.' },
  vocabulary_avoided: { label: 'Avoided Vocabulary', description: 'Words the brand never uses and why — what negative message each sends.' },
  tone_descriptors: { label: 'Tone Descriptors', description: 'How the brand sounds in different contexts — default, formal, social, sales.' },
  industry_terms_embrace: { label: 'Embraced Terms', description: 'Industry jargon that makes the brand sound knowledgeable.' },
  industry_terms_reject: { label: 'Rejected Terms', description: 'Industry jargon that alienates the audience.' },
  message_core: { label: 'Core Message', description: 'The one thing people should remember about this brand.' },
  message_pillars: { label: 'Message Pillars', description: 'The 3-4 supporting themes that reinforce the core message.' },

  // Phase 7: Visual Identity
  brand_logo_url: { label: 'Brand Logo', description: 'The primary logo mark for the brand.' },
  brand_color_palette: { label: 'Color Palette', description: 'Primary, dark, accent, light, and neutral colors with hex values.' },
  brand_typography: { label: 'Typography', description: 'Heading and body font pairings with weights.' },
  visual_mood: { label: 'Visual Mood', description: 'The overall visual feeling — premium, bold, minimal, warm, etc.' },
  imagery_direction: { label: 'Imagery Direction', description: 'Photography style, illustration approach, and icon preferences.' },
  brand_elements: { label: 'Brand Elements', description: 'Additional visual rules, patterns, and graphic elements.' },
  visual_inspirations: { label: 'Visual Inspirations', description: 'Brands, styles, and references that inform the visual direction.' },

  // Phase 8: Design System
  design_system_colors: { label: 'Color System', description: 'Full color system with HEX, RGB, roles, and usage guidelines.' },
  design_system_typography: { label: 'Typography Scale', description: 'Complete type scale — display through caption with sizes and weights.' },
  design_system_components: { label: 'Component Patterns', description: 'Design patterns for buttons, cards, forms, and spacing.' },
  design_system_animations: { label: 'Animation Guidelines', description: 'Motion preferences for transitions, scroll effects, and loading states.' },

  // Phase 9: Website Strategy & Copy
  website_role: { label: 'Website Role', description: 'The primary strategic purpose of the website.' },
  primary_conversion: { label: 'Primary Conversion', description: 'The main action visitors should take (book, apply, buy, download).' },
  secondary_conversion: { label: 'Secondary Conversion', description: 'The fallback action for visitors not ready for the primary.' },
  traffic_sources: { label: 'Traffic Sources', description: 'How people find the site — organic, social, ads, referrals.' },
  website_sitemap: { label: 'Website Sitemap', description: 'The lean page structure — only pages that serve a purpose.' },
  user_journey: { label: 'User Journey', description: 'The ideal path from landing to conversion.' },
  content_themes: { label: 'Content Themes', description: 'Topics the brand has authority to speak on.' },
  content_pillars: { label: 'Content Pillars', description: 'Categories for blog, resources, and ongoing content.' },
  beliefs_to_teach: { label: 'Beliefs to Teach', description: 'Market beliefs that need to shift before they buy.' },
  homepage_hero: { label: 'Homepage Hero', description: 'Headline, subheadline, and primary CTA for the homepage.' },
  homepage_problem: { label: 'Homepage Problem', description: 'The pain section that shows you understand their struggle.' },
  homepage_solution: { label: 'Homepage Solution', description: 'How your brand solves the problem differently.' },
  homepage_who_we_help: { label: 'Who We Help', description: 'The target audience section — making the right people feel seen.' },
  homepage_proof: { label: 'Homepage Proof', description: 'Social proof, testimonials, and results that build trust.' },
  homepage_why_us: { label: 'Why Choose Us', description: 'The differentiation section — what makes you the obvious choice.' },
  homepage_final_cta: { label: 'Homepage Final CTA', description: 'The closing call-to-action that drives conversion.' },
  sales_page_hero: { label: 'Sales Page Hero', description: 'The headline, subheadline, and hook that stops the scroll.' },
  sales_page_story_pain: { label: 'Pain Narrative', description: 'The story that agitates the problem and creates urgency.' },
  sales_page_turn_enemy: { label: 'Turn & Enemy', description: 'Naming the enemy and explaining why previous solutions failed.' },
  sales_page_value_stack: { label: 'Value Stack', description: 'Everything included with perceived value positioning.' },
  sales_page_transformation: { label: 'Transformation', description: 'The before-and-after comparison that sells the outcome.' },
  sales_page_proof: { label: 'Sales Proof', description: 'Case studies and testimonials that validate the promise.' },
  sales_page_faq: { label: 'FAQ Section', description: 'Answers that handle objections and remove friction.' },
  sales_page_final_cta: { label: 'Sales Final CTA', description: 'The urgency-driven final call-to-action.' },
  about_page_copy: { label: 'About Page', description: 'Copy that positions the founder as the guide using the origin story.' },
  problems_page_copy: { label: 'Problems Page', description: 'Copy addressing specific ICP problems with empathy and authority.' },
  results_page_copy: { label: 'Results Page', description: 'Proof-heavy copy with case studies and measurable outcomes.' },
  apply_page_copy: { label: 'Application Page', description: 'Conversion page copy that drives applications or bookings.' },
  form_fields: { label: 'Form Fields', description: 'What information to collect from prospects.' },
  form_cta: { label: 'Form CTA', description: 'Button text and supporting copy near the form.' },
  reassurance: { label: 'Reassurance Copy', description: 'Objection-handling copy placed near the conversion point.' },
  lead_page_headline: { label: 'Lead Page Headline', description: 'Attention-grabbing headline for the lead magnet page.' },
  lead_page_copy: { label: 'Lead Page Copy', description: 'Supporting copy that sells the lead magnet.' },
  lead_page_cta: { label: 'Lead Page CTA', description: 'Button text and promise for the lead magnet download.' },

  // Phase 10: Growth Engine
  authority_pitch: { label: 'Pitch', description: 'One-liner, elevator pitch, and signature talk title.' },
  authority_publish_plan: { label: 'Publishing Strategy', description: 'What to publish, where, and how often — with a 12-month roadmap.' },
  authority_product_ecosystem: { label: 'Product Ecosystem', description: 'The product ladder from free through premium with pricing rationale.' },
  authority_profile_plan: { label: 'Profile & PR Plan', description: 'Media targets, speaking opportunities, awards, and thought leadership.' },
  authority_partnerships: { label: 'Strategic Partnerships', description: 'Ideal partners, collaboration models, and expected outcomes.' },
  conversion_business_type: { label: 'Business Type', description: 'The classification of this business for conversion planning.' },
  conversion_strategy: { label: 'Conversion Strategy', description: 'The recommended approach — VSL, application funnel, community, or hybrid.' },
  conversion_funnel: { label: 'Conversion Funnel', description: 'The specific path from prospect to customer with concrete steps.' },
  conversion_metrics: { label: 'Conversion Metrics', description: 'KPIs to track at each funnel stage.' },

  // Legacy variables (pre-restructure)
  conversion_flow: { label: 'Conversion Flow', description: 'The end-to-end flow from lead to customer.' },
  nurture_sequence: { label: 'Nurture Sequence', description: 'The email or content sequence that warms leads over time.' },
  authority_assets: { label: 'Authority Assets', description: 'Content, credentials, and proof that build credibility.' },
  authority_gaps: { label: 'Authority Gaps', description: 'Missing credibility elements that need to be built.' },
};

export function getVariableDescription(key: string): { label: string; description: string } {
  return VARIABLE_DESCRIPTIONS[key] || {
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: '',
  };
}
