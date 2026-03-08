// Presence Engine — Phase definitions with questions, output variables, and instructions
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
      'Do you agree with this recommended platform priority ranking? Any platforms to add, remove, or re-prioritise?',
      'For each platform — what is the single primary goal? (Lead generation / brand awareness / community / sales / SEO / thought leadership)',
      'What is your realistic posting commitment? How many hours per week can you dedicate?',
      'Do you currently have existing profiles? Describe their current state.',
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
    instructions: `You are guiding the user through Platform Strategy — the first phase of the Presence Engine.

## Your Role
You have access to all of the user's Brand Engine outputs. Use their brand positioning, ICP, archetype, and offers to recommend which platforms they should be active on.

## Phase Flow
1. Present an AI-recommended platform priority ranking based on their brand, ICP, and business type
2. Gather their primary goal for each selected platform
3. Understand their realistic time commitment
4. Learn about existing profiles and their current state
5. Define the "north star" — the single impression every profile should create

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
      'Here are 3 headline options I\'ve crafted for you. Which feels most accurate? What would you change?',
      'Here\'s your full About section in StoryBrand structure. What needs refining? Any results, proof points, or personality missing?',
      'What 3 Featured items should sit on your profile? (Lead magnet, best post, case study, media feature, website, booking link)',
      'What is your LinkedIn connection strategy — who should you connect with and what message should you send?',
      'What is your LinkedIn banner image concept?',
      'Upload your current LinkedIn profile screenshot — I\'ll identify gaps and improvements.',
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
      'Here\'s the page name, category, and sub-category I recommend. Does this match what you want?',
      'Here\'s your About section. What needs refining?',
      'What is your primary Facebook CTA button? (Book Now / Contact Us / Sign Up / Learn More / Send Message / Call Now)',
      'What is your Facebook cover image concept?',
      'Do you want to use Facebook Groups as part of your strategy? If yes — group name, purpose, membership criteria?',
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
      'Here are 3 bio options: authority-led, problem-led, and transformation-led. Which resonates most?',
      'What is your link-in-bio strategy? Single website / Linktree / Lead magnet / Booking link? What are your top 3 links?',
      'What Story Highlights should you maintain? (About, Results, Services, FAQ, Free Resource, Behind the Scenes)',
      'What is your Instagram username — does it match your brand name?',
      'What is the visual grid aesthetic direction for your feed?',
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
      'Here are the top 3 category options for your business. Which is most accurate?',
      'Here\'s a keyword-optimised GMB description. What needs changing?',
      'What are your service areas? (Specific cities, regions, or "nationwide")',
      'What are your business hours — or are you appointment-only / online-only?',
      'What are the top 5 services to list with their own descriptions?',
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
      'Here\'s your channel description / TikTok bio. What needs refining?',
      'What is the channel/account name — does it match your brand name?',
      'What are the 3–5 content categories you\'ll publish consistently?',
      'What is your video intro formula — the hook + who you are + what they\'ll get in the first 15 seconds?',
      'What is the channel trailer / pinned video concept?',
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
      'Here\'s your full cross-platform audit. Are there gaps or inconsistencies I missed?',
      'Which platform will you prioritise first? I want to build you a 30-day activation plan.',
      'What is the single most important thing someone should do when they land on any of your profiles?',
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
- 90-100: Excellent — Professional, consistent, client-attracting
- 75-89: Strong — Minor gaps, quick wins available
- 60-74: Developing — Notable inconsistencies
- 40-59: Needs Work — Significant gaps
- 0-39: Critical — Urgent action required

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

  // Phase 6 is special — runs if youtube OR tiktok is active
  if (phaseNumber === '6') {
    return !activePlatforms.includes('youtube') && !activePlatforms.includes('tiktok');
  }

  // For platform-specific phases, skip if that platform isn't active
  if (phase.platformKey) {
    return !activePlatforms.includes(phase.platformKey);
  }

  return false;
}
