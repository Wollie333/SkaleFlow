// Presence Engine - Phase definitions with questions, output variables, and instructions
// Mirrors the structure of config/phases.ts (Brand Engine)

import type { PlatformKey } from '@/types/presence';

export interface PresencePhaseTemplate {
  number: string;
  name: string;
  slug: string;
  description: string;
  estimatedMinutes: number;
  platformKey: PlatformKey | null; // null = not platform-specific
  isConditional: boolean; // true = only runs if platform is active
  questions: string[];
  outputVariables: string[];
  questionOutputMap: Record<string, string[]>;
  instructions: string;
}

export const PRESENCE_PHASE_TEMPLATES: Record<string, PresencePhaseTemplate> = {
  '1': {
    number: '1',
    name: 'Platform Strategy',
    slug: 'platform-strategy',
    description: 'Select and prioritise your platforms, set goals, and define your presence north star.',
    estimatedMinutes: 15,
    platformKey: null,
    isConditional: false,
    questions: [
      'Which platforms should your brand prioritize? Based on your business type, ICP, and goals - let\'s determine your platform strategy.',
      'For each platform you\'ve selected - what is the single primary goal? (Lead generation / brand awareness / community / sales / SEO / thought leadership)',
      'What is your realistic posting commitment? How many hours per week can you dedicate to maintaining these platforms?',
      'Do you currently have existing profiles on these platforms? Describe their current state (active, dormant, needs optimization).',
      'What is the one impression someone should have within 10 seconds of landing on any of your profiles?',
    ],
    outputVariables: [
      'presence_platforms_active',
      'presence_platform_goals',
      'presence_time_commitment',
      'presence_existing_profiles',
      'presence_north_star',
      'presence_strategy_summary',
    ],
    questionOutputMap: {
      '0': ['presence_platforms_active'],
      '1': ['presence_platform_goals'],
      '2': ['presence_time_commitment'],
      '3': ['presence_existing_profiles'],
      '4': ['presence_north_star', 'presence_strategy_summary'],
    },
    instructions: `You are guiding the user through Platform Strategy - the first phase of the Presence Engine.

## Your Role
You have access to all of the user's Brand Engine outputs. Use their brand positioning, ICP, archetype, and offers to recommend which platforms they should be active on.

## RESPONSE STYLE FOR EACH QUESTION
**For Question 1 (Platform Strategy):**
When the user engages, immediately:
1. Analyze their brand data (ICP, business type, positioning, archetype)
2. Present a specific platform priority ranking (1-5 platforms)
3. Format as: **1. Platform Name** - Clear reasoning based on their brand
4. Then ask: "Does this align with your vision? Any platforms to add, remove, or re-prioritize?"

**For all questions:**
- Present concrete recommendations FIRST based on their brand data
- Show options, examples, or drafts before asking for feedback
- Never ask "what do you think?" without first showing something

## Phase Flow
1. Present an AI-recommended platform priority ranking based on their brand, ICP, and business type
2. Gather their primary goal for each selected platform
3. Understand their realistic time commitment
4. Learn about existing profiles and their current state
5. Define the "north star" - the single impression every profile should create

## Platform Recommendation Logic
- B2B + thought leadership → LinkedIn first, YouTube second
- B2C + visual product → Instagram first, TikTok second
- Local service business → Google My Business first, Facebook second
- Personal brand → LinkedIn + Instagram or YouTube
- E-commerce → Instagram + Pinterest + TikTok
- Consider their archetype when recommending (e.g., The Sage → LinkedIn + YouTube)

## Output Format
When the user confirms answers, output them in YAML format:
\`\`\`yaml
presence_platforms_active: ["linkedin", "instagram", "youtube"]
presence_platform_goals: {"linkedin": "lead_generation", "instagram": "brand_awareness", "youtube": "thought_leadership"}
\`\`\``,
  },

  '2': {
    number: '2',
    name: 'LinkedIn Presence',
    slug: 'linkedin-presence',
    description: 'Build an authority-first LinkedIn profile that positions you as the Key Person of Influence in your category.',
    estimatedMinutes: 25,
    platformKey: 'linkedin',
    isConditional: true,
    questions: [
      'Let\'s create your LinkedIn headline. What should communicate your authority and value in 220 characters? (I\'ll present 3 options based on your brand)',
      'Now for your About section. What story should your profile tell? What results, proof points, or personality should we highlight? (I\'ll structure it using StoryBrand)',
      'What 3 Featured items should sit on your profile? (Lead magnet, best post, case study, media feature, website, booking link)',
      'What is your LinkedIn connection strategy - who should you connect with and what message should you send?',
      'What concept should your LinkedIn banner communicate? (I\'ll suggest visual direction and copy)',
      'Share your current LinkedIn profile screenshot or URL - I\'ll identify gaps and opportunities for improvement.',
    ],
    outputVariables: [
      'linkedin_headline',
      'linkedin_headline_options',
      'linkedin_about_short',
      'linkedin_about_full',
      'linkedin_featured_items',
      'linkedin_connection_strategy',
      'linkedin_connection_message',
      'linkedin_banner_copy',
      'linkedin_banner_tagline',
      'linkedin_profile_gap_audit',
      'linkedin_experience_framing',
      'linkedin_skills_recommended',
      'linkedin_cta_primary',
      'linkedin_completion_score',
    ],
    questionOutputMap: {
      '0': ['linkedin_headline', 'linkedin_headline_options'],
      '1': ['linkedin_about_short', 'linkedin_about_full'],
      '2': ['linkedin_featured_items'],
      '3': ['linkedin_connection_strategy', 'linkedin_connection_message'],
      '4': ['linkedin_banner_copy', 'linkedin_banner_tagline'],
      '5': ['linkedin_profile_gap_audit', 'linkedin_experience_framing', 'linkedin_skills_recommended', 'linkedin_cta_primary', 'linkedin_completion_score'],
    },
    instructions: `You are guiding the user through their LinkedIn Presence setup.

## Your Role
Using the user's Brand Engine outputs (positioning, ICP, archetype, one-liner, category), pre-generate all LinkedIn profile copy and present it for refinement.

## Key Constraints
- Headline: 220 characters max
- About (mobile preview): 3 sentences visible before "see more"
- About (full): 2,000 characters max, use StoryBrand structure
- Featured: exactly 3 items

## Headline Formula Options
1. Authority: "[Role] | Helping [ICP] [achieve transformation] | [Credibility marker]"
2. Category Claim: "The [Category] Expert for [ICP] | [Result/metric]"
3. Problem-Led: "Most [ICP] struggle with [problem]. I fix that. | [Role] at [Company]"

## About Section Structure (StoryBrand)
1. Hook: Start with the problem your ICP faces (2-3 sentences)
2. Guide: Position yourself as the guide who understands (2-3 sentences)
3. Plan: Show your methodology / approach (3-4 bullet points)
4. Results: Social proof, metrics, testimonials (3-4 examples)
5. CTA: Clear next step (1-2 sentences)

## Output Format
Present each piece of copy as a polished draft. Use YAML for outputs:
\`\`\`yaml
linkedin_headline: "Final headline text here"
linkedin_about_full: "Full about section text..."
\`\`\``,
  },

  '3': {
    number: '3',
    name: 'Facebook Presence',
    slug: 'facebook-presence',
    description: 'Optimise your Facebook Business Page for community building and lead conversion.',
    estimatedMinutes: 20,
    platformKey: 'facebook',
    isConditional: true,
    questions: [
      'What should your Facebook Business Page name and category be? (I\'ll recommend the best category options for your business)',
      'What should your About section communicate? What key message should visitors see? (I\'ll create short and full versions)',
      'What is your primary Facebook CTA button? (Book Now / Contact Us / Sign Up / Learn More / Send Message / Call Now)',
      'What concept should your Facebook cover image communicate? (I\'ll suggest visual direction and headline text)',
      'Do you want to use Facebook Groups as part of your strategy? If yes - what would the group focus on and who would join?',
    ],
    outputVariables: [
      'facebook_page_name',
      'facebook_page_category',
      'facebook_page_subcategory',
      'facebook_about_short',
      'facebook_about_full',
      'facebook_cta_button',
      'facebook_cover_concept',
      'facebook_cover_headline',
      'facebook_group_strategy',
      'facebook_completion_score',
    ],
    questionOutputMap: {
      '0': ['facebook_page_name', 'facebook_page_category', 'facebook_page_subcategory'],
      '1': ['facebook_about_short', 'facebook_about_full'],
      '2': ['facebook_cta_button'],
      '3': ['facebook_cover_concept', 'facebook_cover_headline'],
      '4': ['facebook_group_strategy', 'facebook_completion_score'],
    },
    instructions: `You are guiding the user through their Facebook Presence setup.

## Your Role
Using Brand Engine outputs, pre-generate Facebook page copy and present for refinement.

## Key Constraints
- About (short): 255 characters max
- About (full): up to 1,000 characters
- CTA button: One of: Book Now, Contact Us, Sign Up, Learn More, Send Message, Call Now
- Cover image: Concept + visual direction + headline text

## Category Selection
Present top 3 category options based on their business type and industry. Include sub-category recommendations.

## About Section
- Short: Elevator pitch version of what they do and who they help
- Full: Expanded version with methodology, results, and clear CTA

## Output Format
\`\`\`yaml
facebook_page_name: "Business Name"
facebook_about_short: "255 char version..."
\`\`\``,
  },

  '4': {
    number: '4',
    name: 'Instagram Presence',
    slug: 'instagram-presence',
    description: 'Craft a magnetic Instagram profile with strategic bio, link strategy, and visual direction.',
    estimatedMinutes: 20,
    platformKey: 'instagram',
    isConditional: true,
    questions: [
      'What should your Instagram bio communicate in 150 characters? (I\'ll present 3 formula options: authority-led, problem-led, and transformation-led)',
      'What is your link-in-bio strategy? Single website / Linktree / Lead magnet / Booking link? What are your top 3 links?',
      'What Story Highlights should you maintain? (About, Results, Services, FAQ, Free Resource, Behind the Scenes)',
      'What should your Instagram username be - should it match your brand name exactly or be a variation?',
      'What visual aesthetic should your Instagram feed have? (I\'ll suggest grid direction based on your brand)',
    ],
    outputVariables: [
      'instagram_bio',
      'instagram_bio_options',
      'instagram_bio_emoji_version',
      'instagram_link_bio_strategy',
      'instagram_link_bio_urls',
      'instagram_highlights',
      'instagram_username_recommendation',
      'instagram_grid_aesthetic',
      'instagram_profile_photo_brief',
      'instagram_completion_score',
    ],
    questionOutputMap: {
      '0': ['instagram_bio', 'instagram_bio_options', 'instagram_bio_emoji_version'],
      '1': ['instagram_link_bio_strategy', 'instagram_link_bio_urls'],
      '2': ['instagram_highlights'],
      '3': ['instagram_username_recommendation'],
      '4': ['instagram_grid_aesthetic', 'instagram_profile_photo_brief', 'instagram_completion_score'],
    },
    instructions: `You are guiding the user through their Instagram Presence setup.

## Your Role
Using Brand Engine outputs, craft 3 bio options and present for selection + refinement.

## Key Constraints
- Bio: 150 characters max
- Username: Should match brand name or be clearly related
- Story Highlights: 6-8 curated categories

## Bio Formula Options
1. Authority-led: "[Role/Title] | [Result you deliver] | [CTA] ↓"
2. Problem-led: "[ICP]'s struggle with [problem] | I help them [transformation] | [CTA]"
3. Transformation-led: "[Before state] → [After state] | [How] | [CTA]"

## Link-in-Bio Strategy
Recommend based on their goals:
- Lead gen → Lead magnet landing page
- Services → Booking link
- Multiple offers → Linktree/similar
- E-commerce → Shop link

## Output Format
\`\`\`yaml
instagram_bio: "Final 150-char bio"
instagram_bio_options: {"authority": "...", "problem": "...", "transformation": "..."}
\`\`\``,
  },

  '5': {
    number: '5',
    name: 'Google My Business',
    slug: 'google-my-business',
    description: 'Optimise your Google Business Profile for local search dominance and map pack visibility.',
    estimatedMinutes: 15,
    platformKey: 'google_my_business',
    isConditional: true,
    questions: [
      'What category best describes your business on Google? (I\'ll present the top 3 options based on your business type)',
      'What should your Google Business description say? (I\'ll create a keyword-optimised version - 750 char max)',
      'What are your service areas? (Specific cities, regions, or "nationwide")',
      'What are your business hours - or are you appointment-only / online-only?',
      'What are the top 5 services you want to highlight on your Google Business Profile?',
    ],
    outputVariables: [
      'gmb_primary_category',
      'gmb_secondary_categories',
      'gmb_description',
      'gmb_service_areas',
      'gmb_business_hours',
      'gmb_services_list',
      'gmb_keyword_targets',
      'gmb_completion_score',
    ],
    questionOutputMap: {
      '0': ['gmb_primary_category', 'gmb_secondary_categories'],
      '1': ['gmb_description', 'gmb_keyword_targets'],
      '2': ['gmb_service_areas'],
      '3': ['gmb_business_hours'],
      '4': ['gmb_services_list', 'gmb_completion_score'],
    },
    instructions: `You are guiding the user through their Google My Business (GMB) setup.

## Your Role
Using Brand Engine outputs, recommend categories and generate a keyword-optimised business description.

## Key Constraints
- Description: 750 characters max, must include keywords naturally
- Categories: 1 primary + up to 9 secondary
- Services: Up to 5 entries, each with a description
- Keywords: Target local search terms

## Category Selection
Research the best GMB categories for their business type. Present top 3 with reasoning.

## Description Formula
1. Opening: What you do + who you serve (with primary keyword)
2. Middle: How you're different + methodology/approach
3. Closing: Service area + CTA

## Output Format
\`\`\`yaml
gmb_primary_category: "Marketing Consultant"
gmb_description: "750-char keyword-optimised description..."
\`\`\``,
  },

  '6': {
    number: '6',
    name: 'Video Platforms',
    slug: 'video-platforms',
    description: 'Set up your YouTube channel and/or TikTok account for consistent video content and audience growth.',
    estimatedMinutes: 20,
    platformKey: null, // Handles both youtube and tiktok
    isConditional: true, // Only if youtube OR tiktok is active
    questions: [
      'What should your YouTube channel description or TikTok bio communicate? (I\'ll create optimised versions for each platform)',
      'What should your channel/account name be - should it match your brand name exactly?',
      'What are the 3-5 content categories you\'ll publish consistently on video?',
      'What formula should your videos follow in the first 15 seconds? (hook > who you are > value promise)',
      'What should your channel trailer or pinned video be about? (I\'ll suggest a concept)',
    ],
    outputVariables: [
      'youtube_channel_description',
      'youtube_channel_name',
      'youtube_channel_keywords',
      'youtube_content_categories',
      'youtube_intro_formula',
      'youtube_trailer_concept',
      'tiktok_bio',
      'tiktok_username',
      'tiktok_content_pillars',
      'tiktok_intro_formula',
      'tiktok_pinned_video_concept',
      'video_completion_score',
    ],
    questionOutputMap: {
      '0': ['youtube_channel_description', 'tiktok_bio'],
      '1': ['youtube_channel_name', 'tiktok_username'],
      '2': ['youtube_content_categories', 'youtube_channel_keywords', 'tiktok_content_pillars'],
      '3': ['youtube_intro_formula', 'tiktok_intro_formula'],
      '4': ['youtube_trailer_concept', 'tiktok_pinned_video_concept', 'video_completion_score'],
    },
    instructions: `You are guiding the user through their Video Platform setup (YouTube and/or TikTok).

## Your Role
Using Brand Engine outputs, generate channel/account descriptions and content strategies.

## Key Constraints
- YouTube description: 1,000 characters max
- TikTok bio: 80 characters max
- Content pillars: 3-5 consistent categories
- Intro formula: Must work in first 15 seconds (YouTube) or 3 seconds (TikTok)

## Channel Description Formula (YouTube)
1. Hook: What the channel is about (1 sentence)
2. Who it's for: Target audience description
3. What you'll learn: Content categories
4. Upload schedule: Consistency promise
5. CTA: Subscribe + link

## TikTok Bio Formula
[Title/Result] | [Who you help] | [CTA] ↓

## Output Format
Only generate outputs for platforms the user has active. If only YouTube is active, skip TikTok outputs and vice versa.
\`\`\`yaml
youtube_channel_description: "1000-char description..."
tiktok_bio: "80-char bio..."
\`\`\``,
  },

  '7': {
    number: '7',
    name: 'Presence Audit & Consistency',
    slug: 'presence-audit',
    description: 'Run a cross-platform consistency audit, identify quick wins, and build your 30-day activation plan.',
    estimatedMinutes: 15,
    platformKey: null,
    isConditional: false, // Always runs
    questions: [
      'Let me audit your cross-platform consistency. I\'ll analyze all your presence outputs and identify gaps, inconsistencies, and quick wins.',
      'Which platform will you prioritize first for your 30-day activation plan?',
      'What is the single most important action someone should take when they land on any of your profiles?',
    ],
    outputVariables: [
      'presence_consistency_score',
      'presence_consistency_breakdown',
      'presence_priority_platform',
      'presence_30day_plan',
      'presence_universal_cta',
      'presence_quick_wins',
      'presence_gap_summary',
      'presence_playbook_generated',
    ],
    questionOutputMap: {
      '0': ['presence_consistency_score', 'presence_consistency_breakdown', 'presence_gap_summary'],
      '1': ['presence_priority_platform', 'presence_30day_plan', 'presence_quick_wins'],
      '2': ['presence_universal_cta', 'presence_playbook_generated'],
    },
    instructions: `You are running the final Presence Audit & Consistency check.

## Your Role
Analyse ALL presence outputs generated across Phases 1-6 and produce a comprehensive cross-platform consistency audit.

## Consistency Score Dimensions (Individual Platform, 0-100)
- Completeness (30%): All profile fields filled
- Brand Alignment (25%): Copy reflects Brand Engine positioning and one-liner
- ICP Relevance (20%): Profile speaks directly to ideal client
- CTA Clarity (15%): Clear, singular call to action
- Voice Consistency (10%): Tone matches brand characteristics

## Overall Consistency Score (Cross-Platform, 0-100)
- Headline/Bio Alignment (35%): Core message consistent across bios
- CTA Consistency (25%): Same primary CTA across platforms
- Category Claim (20%): Category name used consistently
- Visual Identity (10%): Visual direction consistent with brand
- Tone Match (10%): Tone matches across all platforms

## Score Thresholds
- 90-100: Excellent - Professional, consistent, client-attracting
- 75-89: Strong - Minor gaps, quick wins available
- 60-74: Developing - Notable inconsistencies
- 40-59: Needs Work - Significant gaps
- 0-39: Critical - Urgent action required

## 30-Day Activation Plan
Build a day-by-day plan starting with the priority platform. Include:
- Days 1-5: Priority platform setup + optimise
- Days 6-10: Second platform setup
- Days 11-15: Remaining platforms
- Days 16-20: Content seeding (first posts on each)
- Days 21-30: Consistency check + refinement

## Output Format
\`\`\`yaml
presence_consistency_score: 85
presence_quick_wins: [{"platform": "linkedin", "action": "...", "impact": "high"}]
\`\`\``,
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getPresencePhaseBySlug(slug: string): PresencePhaseTemplate | undefined {
  return Object.values(PRESENCE_PHASE_TEMPLATES).find(p => p.slug === slug);
}

export function getPresencePhaseByNumber(number: string): PresencePhaseTemplate | undefined {
  return PRESENCE_PHASE_TEMPLATES[number];
}

export function getOutputVariablesForQuestion(phaseNumber: string, questionIndex: number): string[] {
  const phase = PRESENCE_PHASE_TEMPLATES[phaseNumber];
  if (!phase) return [];
  return phase.questionOutputMap[String(questionIndex)] || [];
}

export function getAllPresenceOutputVariables(): string[] {
  const vars: string[] = [];
  Object.values(PRESENCE_PHASE_TEMPLATES).forEach(phase => {
    phase.outputVariables.forEach(v => {
      if (!vars.includes(v)) vars.push(v);
    });
  });
  return vars;
}

export function isPhaseConditionallySkipped(
  phaseNumber: string,
  activePlatforms: string[]
): boolean {
  const phase = PRESENCE_PHASE_TEMPLATES[phaseNumber];
  if (!phase || !phase.isConditional) return false;

  // Phase 6 is special - runs if youtube OR tiktok is active
  if (phaseNumber === '6') {
    return !activePlatforms.includes('youtube') && !activePlatforms.includes('tiktok');
  }

  // For platform-specific phases, skip if that platform isn't active
  if (phase.platformKey) {
    return !activePlatforms.includes(phase.platformKey);
  }

  return false;
}
