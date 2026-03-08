# SkaleFlow Presence Engine — Master Reference

> Complete documentation of the Presence Engine system: phases, variables, database schema, user journeys, expert agents, API routes, components, and architecture.
> **Engine 2 of 5 in the Brand Gravity Method.**
> **Prerequisite: Brand Engine must be fully completed before Presence Engine is accessible.**

---

## Table of Contents

1. [Overview](#1-overview)
2. [How It Works — The Core Logic](#2-how-it-works--the-core-logic)
3. [Platform Selection & Activation](#3-platform-selection--activation)
4. [The 7 Presence Engine Phases](#4-the-7-presence-engine-phases)
5. [Complete Variable Reference (68)](#5-complete-variable-reference-68)
6. [Brand Engine Variables Consumed](#6-brand-engine-variables-consumed)
7. [Database Schema](#7-database-schema)
8. [User Journey Maps](#8-user-journey-maps)
9. [Expert AI Agents](#9-expert-ai-agents)
10. [Profile Scoring System](#10-profile-scoring-system)
11. [API Routes](#11-api-routes)
12. [Key Components](#12-key-components)
13. [Architecture & Design Decisions](#13-architecture--design-decisions)
14. [File Reference](#14-file-reference)

---

## 1. Overview

The Presence Engine is a **7-phase, AI-guided online presence system** that transforms brand strategy into uniform, professional, client-attracting profiles across every platform the user chooses to activate.

It does not start from scratch. It reads all 123 Brand Engine variables and uses them as the foundation for every profile it builds. Every headline, bio, description, and CTA is generated from the brand's actual strategy — not generic templates.

**Key stats:**

| Metric | Value |
|--------|-------|
| Phases | 7 |
| Total output variables | 68 |
| Supported platforms | 8 (LinkedIn, Facebook, Instagram, Google My Business, TikTok, YouTube, X/Twitter, Pinterest) |
| Expert AI agents | 7 (one per phase) |
| Profile fields generated per platform | 8–22 depending on platform |
| Estimated completion time | 2–3 hours |
| Brand Engine variables consumed | 31 |

**Frameworks used:** Key Person of Influence (Daniel Priestley), Platform Authority (Gary Vaynerchuk), Personal Branding (Dorie Clark), Social Media Examiner best practices, Google My Business optimisation, LinkedIn Sales Navigator methodology.

---

## 2. How It Works — The Core Logic

### The Problem It Solves

Most founders have inconsistent online profiles. Their LinkedIn says one thing. Their Instagram says another. Their Facebook page was set up in 2019 and never updated. Their Google My Business has the wrong category. None of it reflects the brand strategy they just spent 3 hours building in the Brand Engine.

The Presence Engine fixes this systematically.

### The Approach

1. **User selects which platforms to activate** — they are not forced to use all 8. They choose the ones relevant to their business.
2. **AI reads Brand Engine outputs** and pre-generates profile copy for every selected platform.
3. **User reviews, refines, and approves** each platform through a guided conversation with a named expert agent.
4. **Profiles are locked** — generating a Presence Playbook with copy-ready content for each platform.
5. **Consistency score** is calculated — measuring how uniformly the brand is represented across all active platforms.

### The Key Principle

> The Presence Engine does not ask what to write. It already knows from the Brand Engine. It asks whether the AI-generated copy is right — and refines from there.

This is a fundamentally different UX from the Brand Engine. The Brand Engine extracts information through conversation. The Presence Engine proposes content and refines through feedback. Most phases open with the AI presenting a full draft — the user reacts, refines, and approves.

---

## 3. Platform Selection & Activation

### Platform Activation Flow

Before Phase 1 begins, the user selects which platforms to activate. This is a one-time setup step.

**Available platforms:**

| Platform Key | Platform Name | Primary Use Case | Audience Type |
|-------------|---------------|------------------|---------------|
| `linkedin` | LinkedIn | B2B authority, lead generation, networking | Professional/B2B |
| `facebook` | Facebook | Community, local business, paid ads | Mixed B2B/B2C |
| `instagram` | Instagram | Visual brand, lifestyle, B2C, B2B discovery | Visual/Discovery |
| `google_my_business` | Google My Business | Local SEO, reviews, maps visibility | Local/Intent-based |
| `tiktok` | TikTok | Short video, organic reach, younger demographic | Discovery/B2C |
| `youtube` | YouTube | Long-form authority, tutorials, SEO | Education/Authority |
| `twitter_x` | X (Twitter) | Thought leadership, real-time, networking | Thought Leadership |
| `pinterest` | Pinterest | Visual content, evergreen, e-commerce, lifestyle | Visual/Evergreen |

**Activation rules:**
- User must select at least 1 platform to proceed.
- LinkedIn is recommended as primary for B2B brands (pre-selected by default with ability to deselect).
- Google My Business is only shown if the user's brand serves local clients (detected from `icp_demographics.geography`).
- Pinterest is only shown if visual product/lifestyle content is relevant (detected from `brand_archetype` and `visual_mood`).
- All selected platforms are stored in `presence_platforms_active`.

### Platform Recommendation Logic

The AI recommends platforms based on Brand Engine data before the user selects:

```
IF icp_demographics includes "B2B" OR "business owner" OR "professional":
  → Strongly recommend: LinkedIn, Facebook
  → Recommend: YouTube, X/Twitter
  → Optional: Instagram

IF icp_demographics includes "local" OR geography is city/region specific:
  → Strongly recommend: Google My Business
  
IF brand_archetype IN [Creator, Explorer, Innocent, Jester]:
  → Strongly recommend: Instagram, TikTok

IF content_themes includes "education" OR "tutorials" OR "how-to":
  → Strongly recommend: YouTube

IF visual_mood IN [Premium, Bold, Aspirational]:
  → Recommend: Instagram, Pinterest
```

---

## 4. The 7 Presence Engine Phases

### Phase Structure Overview

| Phase | Name | Expert Agent | Platforms Covered | Est. Time | Output Variables |
|-------|------|-------------|-------------------|-----------|-----------------|
| 1 | Platform Strategy | Gary Vaynerchuk | All selected | 15 min | 6 |
| 2 | LinkedIn Presence | Daniel Priestley | LinkedIn | 25 min | 14 |
| 3 | Facebook Presence | Mari Smith | Facebook | 20 min | 10 |
| 4 | Instagram Presence | Jasmine Star | Instagram | 20 min | 10 |
| 5 | Google My Business | Neil Patel | Google My Business | 15 min | 8 |
| 6 | Video Platforms | Roberto Blake | TikTok + YouTube | 20 min | 12 |
| 7 | Presence Audit & Score | Dorie Clark | All platforms | 15 min | 8 |

> **Platform-conditional phases:** Phases 3–6 are only shown for selected platforms. If a user does not activate Facebook, Phase 3 is skipped entirely. Phase 6 is only shown if TikTok or YouTube (or both) are selected. Phase 7 always runs regardless of platform selection.

---

### Phase 1: Platform Strategy

| Field | Value |
|-------|-------|
| Expert Agent | Gary Vaynerchuk (Platform Strategist) |
| Estimated Time | 15 minutes |
| Questions | 5 |
| Output Variables | 6 |
| Prerequisite | Brand Engine complete |

**Opening Behaviour:**
Gary Vaynerchuk agent opens by reading `icp_demographics`, `one_liner`, `brand_archetype`, and `content_themes` from Brand Engine — then presents a recommended platform priority ranking with reasoning before asking Q0.

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Based on your brand strategy, here is my recommended platform priority for you. [AI presents ranked platform list with reasoning]. Do you agree with this — or are there platforms you want to add, remove, or re-prioritise? |
| 1 | For each platform you're activating — what is the single primary goal? (Lead generation / brand awareness / community / sales / SEO visibility / thought leadership) |
| 2 | What is your realistic posting commitment? How many hours per week can you dedicate to social media across all platforms? |
| 3 | Do you currently have existing profiles on any of these platforms? If yes — describe their current state. (We will audit and fix, not rebuild from scratch if possible.) |
| 4 | What is the one impression you want someone to have within 10 seconds of landing on any of your profiles? This becomes your presence north star. |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `presence_platforms_active` | Array of selected platform keys in priority order | Q0 |
| `presence_platform_goals` | Object mapping each platform to its primary goal | Q1 |
| `presence_time_commitment` | Weekly hours available for social media management | Q2 |
| `presence_existing_profiles` | Current state of existing profiles per platform | Q3 |
| `presence_north_star` | The one impression every profile must create in 10 seconds | Q4 |
| `presence_strategy_summary` | AI-generated strategic summary of platform approach | Q0–Q4 |

---

### Phase 2: LinkedIn Presence

| Field | Value |
|-------|-------|
| Expert Agent | Daniel Priestley (LinkedIn Authority Strategist) |
| Estimated Time | 25 minutes |
| Questions | 6 |
| Output Variables | 14 |
| Conditional | Only shown if `linkedin` in `presence_platforms_active` |

**Opening Behaviour:**
Daniel Priestley agent reads Brand Engine variables and **pre-generates a complete LinkedIn profile** — headline, about section, featured section strategy, and banner copy — before asking Q0. The user reacts to the draft rather than starting from zero.

**Brand Engine variables injected at phase start:**
`one_liner`, `brand_purpose`, `category_name`, `positioning_statement`, `icp_demographics`, `icp_pains`, `offer_name`, `offer_outcome`, `founder_story`, `brand_values`, `tone_descriptors`, `vocabulary_preferred`, `message_core`, `differentiation_statement`

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Here is your AI-generated LinkedIn headline. [Presents 3 options based on one_liner + category_name + icp pain]. Which feels most accurate? What would you change? |
| 1 | Here is your LinkedIn About section. [Presents full draft using StoryBrand structure: hook → problem → guide → solution → CTA]. What needs refining? Are there results, proof points, or personality elements missing? |
| 2 | What 3 Featured items should sit on your profile? (Lead magnet, best post, case study, media appearance, website link, booking link) |
| 3 | What is your current LinkedIn connection strategy — who do you want to connect with, and what message do you send when connecting? |
| 4 | What is your LinkedIn banner image concept? (We will generate the copy/direction for your designer.) |
| 5 | Upload your current LinkedIn profile screenshot if you have one — I will identify the gaps between where you are and where you need to be. |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `linkedin_headline` | Final approved LinkedIn headline (220 chars max) | Q0 |
| `linkedin_headline_options` | All 3 headline options generated (for A/B testing) | Q0 |
| `linkedin_about_short` | 3-sentence short version for mobile preview | Q1 |
| `linkedin_about_full` | Full About section (2000 chars, StoryBrand structure) | Q1 |
| `linkedin_featured_items` | 3 featured items with titles, descriptions, and URLs | Q2 |
| `linkedin_connection_strategy` | Who to connect with and connection request message | Q3 |
| `linkedin_connection_message` | Template message for new connection requests | Q3 |
| `linkedin_banner_copy` | Text/concept direction for banner image | Q4 |
| `linkedin_banner_tagline` | Primary banner statement (from banner_statement if set) | Q4 |
| `linkedin_profile_gap_audit` | Identified gaps between current and target profile | Q5 |
| `linkedin_experience_framing` | How to frame experience entries to support positioning | Q1 |
| `linkedin_skills_recommended` | Recommended skills to add/endorse for SEO | Q1 |
| `linkedin_cta_primary` | Primary call to action on profile | Q2 |
| `linkedin_completion_score` | AI-assessed score 0–100 for profile completeness | Q0–Q5 |

---

### Phase 3: Facebook Presence

| Field | Value |
|-------|-------|
| Expert Agent | Mari Smith (Facebook Marketing Expert) |
| Estimated Time | 20 minutes |
| Questions | 5 |
| Output Variables | 10 |
| Conditional | Only shown if `facebook` in `presence_platforms_active` |

**Opening Behaviour:**
Mari Smith agent reads Brand Engine variables and pre-generates Facebook page copy — page name recommendation, about section, and cover image direction.

**Brand Engine variables injected at phase start:**
`brand_name`, `one_liner`, `category_name`, `icp_demographics`, `icp_pains`, `offer_name`, `lead_magnet_title`, `brand_characteristics`, `tone_descriptors`, `brand_color_palette`

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Here is your recommended Facebook Page name and category setup. [Presents page name, category, sub-category]. Does this match what you want? Note: the page name should match your brand name exactly for searchability. |
| 1 | Here is your Facebook Page About section. [Presents draft using one_liner + offer_outcome + CTA]. What needs refining? |
| 2 | What is your primary Facebook CTA button? (Book Now / Contact Us / Sign Up / Learn More / Send Message / Call Now) |
| 3 | What is your Facebook cover image concept? The cover image is prime real estate — it should state what you do and who you help in under 5 seconds. |
| 4 | Do you want to use Facebook Groups as part of your strategy? If yes — what is the group name, purpose, and membership criteria? |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `facebook_page_name` | Official Facebook page name | Q0 |
| `facebook_page_category` | Primary category selection | Q0 |
| `facebook_page_subcategory` | Sub-category selection | Q0 |
| `facebook_about_short` | Short description (255 chars) | Q1 |
| `facebook_about_full` | Full about section (up to 1000 chars) | Q1 |
| `facebook_cta_button` | Selected CTA button type and destination URL | Q2 |
| `facebook_cover_concept` | Cover image copy and visual direction for designer | Q3 |
| `facebook_cover_headline` | Primary headline for cover image | Q3 |
| `facebook_group_strategy` | Group name, purpose, rules, membership criteria (if applicable) | Q4 |
| `facebook_completion_score` | AI-assessed score 0–100 for page completeness | Q0–Q4 |

---

### Phase 4: Instagram Presence

| Field | Value |
|-------|-------|
| Expert Agent | Jasmine Star (Instagram Growth Strategist) |
| Estimated Time | 20 minutes |
| Questions | 5 |
| Output Variables | 10 |
| Conditional | Only shown if `instagram` in `presence_platforms_active` |

**Opening Behaviour:**
Jasmine Star agent reads visual Brand Engine variables and pre-generates the Instagram bio and highlight strategy.

**Brand Engine variables injected at phase start:**
`one_liner`, `icp_pains`, `icp_desires`, `offer_name`, `lead_magnet_title`, `brand_characteristics`, `visual_mood`, `brand_color_palette`, `brand_archetype`, `tone_descriptors`

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Here is your Instagram bio — 150 characters to stop a scroll. [Presents 3 options: one authority-led, one problem-led, one transformation-led]. Which resonates? What feels off? |
| 1 | What is your link-in-bio strategy? (Single website / Linktree-style multi-link / Lead magnet direct / Booking link) What are the top 3 links your profile should always send people to? |
| 2 | What Story Highlights should you maintain permanently? [AI recommends based on offer ecosystem: About, Results, Services, FAQ, Free Resource, Behind the Scenes]. Which do you want? |
| 3 | What is your Instagram username — does it match your brand name? If not, should we recommend a change? |
| 4 | What is the visual grid aesthetic direction for your feed? (Consistent with Phase 7 visual identity — AI confirms alignment or flags inconsistency.) |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `instagram_bio` | Final approved Instagram bio (150 chars max) | Q0 |
| `instagram_bio_options` | All 3 bio options generated | Q0 |
| `instagram_bio_emoji_version` | Emoji-formatted version of bio for casual tone | Q0 |
| `instagram_link_bio_strategy` | Single link vs multi-link decision and rationale | Q1 |
| `instagram_link_bio_urls` | Top 3 URLs in priority order with labels | Q1 |
| `instagram_highlights` | Story highlight names, cover concepts, content strategy per highlight | Q2 |
| `instagram_username_recommendation` | Username assessment and change recommendation if needed | Q3 |
| `instagram_grid_aesthetic` | Visual grid direction aligned with brand visual identity | Q4 |
| `instagram_profile_photo_brief` | Description of ideal profile photo style | Q0 |
| `instagram_completion_score` | AI-assessed score 0–100 for profile completeness | Q0–Q4 |

---

### Phase 5: Google My Business

| Field | Value |
|-------|-------|
| Expert Agent | Neil Patel (Local SEO & Digital Presence Expert) |
| Estimated Time | 15 minutes |
| Questions | 5 |
| Output Variables | 8 |
| Conditional | Only shown if `google_my_business` in `presence_platforms_active` |

**Opening Behaviour:**
Neil Patel agent reads `icp_demographics.geography`, `brand_name`, `category_name`, `offer_name` and pre-generates the GMB description and category selection.

**Brand Engine variables injected at phase start:**
`brand_name`, `brand_purpose`, `one_liner`, `offer_name`, `offer_outcome`, `icp_demographics`, `icp_pains`, `brand_values`, `message_core`

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Here is your recommended Google My Business primary category. [Presents top 3 category options based on offer type]. Which is most accurate? |
| 1 | Here is your GMB business description. [Presents 750-char draft using one_liner + offer_outcome + local service area]. What needs changing? |
| 2 | What are your service areas? (Specific cities, regions, or 'nationwide'.) |
| 3 | What are your business hours — or are you appointment-only / online-only? |
| 4 | What are the top 5 services to list on your GMB profile? These become searchable service entries with their own descriptions. |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `gmb_primary_category` | Primary Google My Business category | Q0 |
| `gmb_secondary_categories` | Up to 9 additional category selections | Q0 |
| `gmb_description` | Business description (750 chars max, keyword-optimised) | Q1 |
| `gmb_service_areas` | List of cities/regions served | Q2 |
| `gmb_business_hours` | Operating hours or appointment-only flag | Q3 |
| `gmb_services_list` | Up to 5 service entries with name and description | Q4 |
| `gmb_keyword_targets` | Primary keywords the GMB profile targets for local SEO | Q0–Q4 |
| `gmb_completion_score` | AI-assessed score 0–100 for profile completeness | Q0–Q4 |

---

### Phase 6: Video Platforms (TikTok + YouTube)

| Field | Value |
|-------|-------|
| Expert Agent | Roberto Blake (YouTube & Video Strategy Expert) |
| Estimated Time | 20 minutes |
| Questions | 5 |
| Output Variables | 12 |
| Conditional | Only shown if `tiktok` OR `youtube` in `presence_platforms_active` |

**Opening Behaviour:**
Roberto Blake agent reads Brand Engine content variables and pre-generates channel descriptions and bio copy for active video platforms.

**Brand Engine variables injected at phase start:**
`one_liner`, `brand_purpose`, `content_themes`, `content_pillars`, `icp_pains`, `icp_desires`, `brand_characteristics`, `tone_descriptors`, `vocabulary_preferred`, `offer_name`, `lead_magnet_title`, `brand_archetype`

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Here is your YouTube channel description / TikTok bio — whichever you're activating (or both). [Presents pre-generated copy]. What needs refining? |
| 1 | What is the channel/account name — does it match your brand name exactly? If TikTok handle is taken, what are your alternatives? |
| 2 | What are the 3–5 content categories you will publish consistently? [AI suggests based on content_pillars + icp_pains]. These become your channel pillars. |
| 3 | What is your video intro formula — the hook + who you are + what they'll get in the first 15 seconds of every video? |
| 4 | What is the channel trailer / pinned video concept? (For YouTube: 60–90 second channel intro. For TikTok: pinned video introducing who you are.) |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `youtube_channel_description` | YouTube channel description (1000 chars) | Q0 |
| `youtube_channel_name` | Official YouTube channel name | Q1 |
| `youtube_channel_keywords` | Keywords for YouTube SEO | Q0–Q2 |
| `youtube_content_categories` | 3–5 content pillars for the channel | Q2 |
| `youtube_intro_formula` | Hook + identity + value promise for video intros | Q3 |
| `youtube_trailer_concept` | Channel trailer script outline | Q4 |
| `tiktok_bio` | TikTok bio (80 chars max) | Q0 |
| `tiktok_username` | TikTok handle / username | Q1 |
| `tiktok_content_pillars` | 3–5 content categories for TikTok | Q2 |
| `tiktok_intro_formula` | Hook formula for first 3 seconds of TikTok videos | Q3 |
| `tiktok_pinned_video_concept` | Pinned video script concept | Q4 |
| `video_completion_score` | AI-assessed score 0–100 for video platform setup | Q0–Q4 |

---

### Phase 7: Presence Audit & Consistency Score

| Field | Value |
|-------|-------|
| Expert Agent | Dorie Clark (Personal Brand Strategist) |
| Estimated Time | 15 minutes |
| Questions | 3 |
| Output Variables | 8 |
| Conditional | Always runs — for all users regardless of platform selection |

**Opening Behaviour:**
Dorie Clark agent reads all completed Presence Engine outputs across all active platforms and generates a full consistency audit before asking Q0. She identifies where messaging is inconsistent, where opportunities exist, and where the most urgent gaps remain.

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Here is your Presence Consistency Audit. [Presents full cross-platform audit: what is consistent, what is inconsistent, what is missing]. Are there gaps or inconsistencies I missed? |
| 1 | Which platform will you prioritise first for implementation? I want to build you a 30-day activation plan focused on that platform. |
| 2 | What is the single most important thing someone should do when they land on any of your profiles? This becomes your universal conversion action across all platforms. |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `presence_consistency_score` | Overall score 0–100 measuring cross-platform consistency | Q0 |
| `presence_consistency_breakdown` | Per-platform score with specific gaps identified | Q0 |
| `presence_priority_platform` | Platform selected for first implementation focus | Q1 |
| `presence_30day_plan` | Step-by-step 30-day activation plan for priority platform | Q1 |
| `presence_universal_cta` | The single conversion action consistent across all platforms | Q2 |
| `presence_quick_wins` | Top 3 changes that can be implemented today for immediate impact | Q0 |
| `presence_gap_summary` | Narrative summary of all remaining gaps | Q0 |
| `presence_playbook_generated` | Boolean flag when Presence Playbook export is complete | Q0–Q2 |

---

## 5. Complete Variable Reference (68)

### All Variables by Phase

#### Phase 1 — Platform Strategy (6 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 1 | `presence_platforms_active` | Active Platforms |
| 2 | `presence_platform_goals` | Platform Goals |
| 3 | `presence_time_commitment` | Time Commitment |
| 4 | `presence_existing_profiles` | Existing Profile Status |
| 5 | `presence_north_star` | Presence North Star |
| 6 | `presence_strategy_summary` | Platform Strategy Summary |

#### Phase 2 — LinkedIn Presence (14 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 7 | `linkedin_headline` | LinkedIn Headline |
| 8 | `linkedin_headline_options` | Headline Options (A/B) |
| 9 | `linkedin_about_short` | About (Short) |
| 10 | `linkedin_about_full` | About (Full) |
| 11 | `linkedin_featured_items` | Featured Section Items |
| 12 | `linkedin_connection_strategy` | Connection Strategy |
| 13 | `linkedin_connection_message` | Connection Request Template |
| 14 | `linkedin_banner_copy` | Banner Copy |
| 15 | `linkedin_banner_tagline` | Banner Tagline |
| 16 | `linkedin_profile_gap_audit` | Profile Gap Audit |
| 17 | `linkedin_experience_framing` | Experience Framing Guide |
| 18 | `linkedin_skills_recommended` | Recommended Skills |
| 19 | `linkedin_cta_primary` | Primary CTA |
| 20 | `linkedin_completion_score` | LinkedIn Completion Score |

#### Phase 3 — Facebook Presence (10 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 21 | `facebook_page_name` | Page Name |
| 22 | `facebook_page_category` | Page Category |
| 23 | `facebook_page_subcategory` | Page Sub-category |
| 24 | `facebook_about_short` | About (Short) |
| 25 | `facebook_about_full` | About (Full) |
| 26 | `facebook_cta_button` | CTA Button |
| 27 | `facebook_cover_concept` | Cover Image Concept |
| 28 | `facebook_cover_headline` | Cover Headline |
| 29 | `facebook_group_strategy` | Group Strategy |
| 30 | `facebook_completion_score` | Facebook Completion Score |

#### Phase 4 — Instagram Presence (10 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 31 | `instagram_bio` | Instagram Bio |
| 32 | `instagram_bio_options` | Bio Options (A/B/C) |
| 33 | `instagram_bio_emoji_version` | Bio (Emoji Version) |
| 34 | `instagram_link_bio_strategy` | Link-in-Bio Strategy |
| 35 | `instagram_link_bio_urls` | Link-in-Bio URLs |
| 36 | `instagram_highlights` | Story Highlights Strategy |
| 37 | `instagram_username_recommendation` | Username Recommendation |
| 38 | `instagram_grid_aesthetic` | Grid Aesthetic Direction |
| 39 | `instagram_profile_photo_brief` | Profile Photo Brief |
| 40 | `instagram_completion_score` | Instagram Completion Score |

#### Phase 5 — Google My Business (8 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 41 | `gmb_primary_category` | GMB Primary Category |
| 42 | `gmb_secondary_categories` | GMB Secondary Categories |
| 43 | `gmb_description` | GMB Description |
| 44 | `gmb_service_areas` | Service Areas |
| 45 | `gmb_business_hours` | Business Hours |
| 46 | `gmb_services_list` | Services List |
| 47 | `gmb_keyword_targets` | SEO Keyword Targets |
| 48 | `gmb_completion_score` | GMB Completion Score |

#### Phase 6 — Video Platforms (12 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 49 | `youtube_channel_description` | YouTube Channel Description |
| 50 | `youtube_channel_name` | YouTube Channel Name |
| 51 | `youtube_channel_keywords` | YouTube SEO Keywords |
| 52 | `youtube_content_categories` | YouTube Content Pillars |
| 53 | `youtube_intro_formula` | YouTube Video Intro Formula |
| 54 | `youtube_trailer_concept` | Channel Trailer Concept |
| 55 | `tiktok_bio` | TikTok Bio |
| 56 | `tiktok_username` | TikTok Username |
| 57 | `tiktok_content_pillars` | TikTok Content Pillars |
| 58 | `tiktok_intro_formula` | TikTok Hook Formula |
| 59 | `tiktok_pinned_video_concept` | Pinned Video Concept |
| 60 | `video_completion_score` | Video Platforms Score |

#### Phase 7 — Presence Audit (8 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 61 | `presence_consistency_score` | Consistency Score |
| 62 | `presence_consistency_breakdown` | Consistency Breakdown |
| 63 | `presence_priority_platform` | Priority Platform |
| 64 | `presence_30day_plan` | 30-Day Activation Plan |
| 65 | `presence_universal_cta` | Universal CTA |
| 66 | `presence_quick_wins` | Quick Wins |
| 67 | `presence_gap_summary` | Gap Summary |
| 68 | `presence_playbook_generated` | Playbook Generated Flag |

---

## 6. Brand Engine Variables Consumed

The Presence Engine reads these 31 Brand Engine variables. They must all be locked in the Brand Engine before Presence Engine is accessible. These are read-only — the Presence Engine never modifies Brand Engine variables.

| Brand Engine Variable | Used In Phase(s) | How It's Used |
|----------------------|-----------------|---------------|
| `one_liner` | 1, 2, 3, 4, 5, 6 | Primary profile headline foundation for all platforms |
| `brand_name` | 1, 3, 5, 6 | Page name, channel name consistency check |
| `brand_purpose` | 2, 5, 6 | Injected into About sections and descriptions |
| `brand_mission` | 2 | LinkedIn About long version |
| `brand_vision` | 2 | LinkedIn About — aspirational section |
| `brand_values` | 2, 5 | Trust signals in bios and descriptions |
| `brand_characteristics` | 2, 4, 6 | Tone matching for each platform |
| `brand_archetype` | 1, 4, 6 | Platform priority recommendation, visual direction |
| `brand_faith_positioning` | 2 | LinkedIn About — selective inclusion based on faith_explicit flag |
| `brand_origin_story` | 2 | LinkedIn About — founder as guide narrative |
| `founder_story` | 2 | LinkedIn About — personal journey element |
| `category_name` | 1, 2, 3 | Headline and bio positioning anchor |
| `category_claim` | 2 | LinkedIn headline option generation |
| `positioning_statement` | 2, 5 | Platform descriptions and GMB |
| `differentiation_statement` | 2, 3 | Why choose us element in bios |
| `icp_demographics` | 1, 3, 5 | Platform selection recommendation, GMB service areas |
| `icp_pains` | 2, 4, 6 | Hook-based bio writing |
| `icp_desires` | 4, 6 | Transformation language in bios |
| `offer_name` | 2, 3, 4, 5, 6 | Service listings and CTAs |
| `offer_outcome` | 2, 5 | Result-focused descriptions |
| `offer_transformation_after` | 2, 4 | After-state language in headlines |
| `lead_magnet_title` | 2, 3, 4, 6 | CTA and link-in-bio entries |
| `tone_descriptors` | 2, 3, 4, 5, 6 | Tone matching for each platform's culture |
| `vocabulary_preferred` | 2, 3, 4, 5, 6 | Word selection in all generated copy |
| `vocabulary_avoided` | 2, 3, 4, 5, 6 | Excluded from all generated copy |
| `message_core` | 2, 3, 5 | Core message consistency check |
| `message_pillars` | 6 | YouTube/TikTok content pillar generation |
| `content_themes` | 6 | Video platform channel pillar alignment |
| `content_pillars` | 6 | Channel categories |
| `brand_color_palette` | 3, 4 | Cover image and grid aesthetic direction |
| `visual_mood` | 4, 6 | Grid aesthetic and video visual direction |

---

## 7. Database Schema

### presence_platforms

Tracks which platforms each organization has activated.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
platform_key          TEXT ('linkedin' | 'facebook' | 'instagram' | 'google_my_business' | 'tiktok' | 'youtube' | 'twitter_x' | 'pinterest')
is_active             BOOLEAN (default false)
priority_order        INTEGER (user-defined ranking)
goal                  TEXT (lead_gen | brand_awareness | community | sales | seo | thought_leadership)
status                PlatformStatus: not_started | in_progress | completed
completion_score      INTEGER (0–100)
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### presence_phases

Tracks each organization's progress through the 7 presence phases. Mirrors `brand_phases` structure exactly.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
phase_number          TEXT ('1' through '7')
phase_name            TEXT
status                PhaseStatus: not_started | in_progress | completed | locked | skipped
platform_key          TEXT | NULL (NULL for phases 1 and 7; platform key for phases 2–6)
started_at            TIMESTAMPTZ | NULL
completed_at          TIMESTAMPTZ | NULL
locked_at             TIMESTAMPTZ | NULL
locked_by             UUID (FK → users) | NULL
current_question_index INTEGER (0-indexed)
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

> **Note on `status: skipped`:** Phases 3–6 are skipped (not locked) when the corresponding platform is not activated. Skipped phases do not block progression.

### presence_outputs

Stores all Presence Engine variable values. One row per variable per organization. Mirrors `brand_outputs` structure exactly.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
phase_id              UUID (FK → presence_phases)
platform_key          TEXT | NULL (platform context for output, NULL for global outputs)
output_key            TEXT (e.g., 'linkedin_headline', 'presence_consistency_score')
output_value          JSONB (flexible — string, object, array, or structured data)
version               INTEGER (default 1)
is_locked             BOOLEAN (default false)
generated_from_brand  BOOLEAN (default false — true if value was AI-generated from Brand Engine vars)
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

> **`generated_from_brand` flag:** When the AI generates a value from Brand Engine variables without user editing, this is `true`. When the user modifies the AI-generated value, it flips to `false`. This enables future analytics on how much users accept vs modify AI-generated copy.

### presence_conversations

Stores chat history per phase. Mirrors `brand_conversations` structure exactly.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
phase_id              UUID (FK → presence_phases)
user_id               UUID (FK → users) | NULL
messages              JSONB (array of {role, content, files?})
ai_model              TEXT
tokens_used           INTEGER
credits_used          INTEGER
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### presence_profile_screenshots

Stores uploaded profile screenshots for gap auditing.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
platform_key          TEXT
file_url              TEXT (Supabase storage path)
file_name             TEXT
uploaded_at           TIMESTAMPTZ
audit_completed       BOOLEAN (default false)
audit_findings        JSONB | NULL (AI-generated gap analysis)
created_at            TIMESTAMPTZ
```

### presence_playbooks

Tracks Presence Playbook exports.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
version               INTEGER (auto-increment)
generated_by          UUID (FK → users) | NULL
platforms_included    TEXT[] (e.g., ['linkedin', 'instagram', 'google_my_business'])
file_url              TEXT | NULL
consistency_score     INTEGER (snapshot of score at time of export)
created_at            TIMESTAMPTZ
```

### organizations (presence-related fields added)

```
presence_engine_status    PresenceEngineStatus: not_started | in_progress | completed
presence_consistency_score INTEGER | NULL
presence_playbook_token    TEXT | NULL (public share token)
```

### Key Types

```typescript
type PlatformKey = 'linkedin' | 'facebook' | 'instagram' | 'google_my_business' | 'tiktok' | 'youtube' | 'twitter_x' | 'pinterest';

type PlatformStatus = 'not_started' | 'in_progress' | 'completed';

type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'locked' | 'skipped';

type PresenceEngineStatus = 'not_started' | 'in_progress' | 'completed';

type PlatformGoal = 'lead_gen' | 'brand_awareness' | 'community' | 'sales' | 'seo' | 'thought_leadership';

interface PlatformConfig {
  platform_key: PlatformKey;
  platform_name: string;
  is_active: boolean;
  priority_order: number;
  goal: PlatformGoal;
  completion_score: number;
}

interface PresenceOutput {
  output_key: string;
  output_value: unknown; // JSONB
  platform_key: PlatformKey | null;
  is_locked: boolean;
  generated_from_brand: boolean;
}

interface ConsistencyScore {
  overall: number;
  by_platform: Record<PlatformKey, number>;
  consistency_flags: ConsistencyFlag[];
}

interface ConsistencyFlag {
  type: 'headline_mismatch' | 'cta_mismatch' | 'missing_platform' | 'tone_inconsistency' | 'category_missing';
  platforms_affected: PlatformKey[];
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}
```

### Supabase Storage Buckets

```
presence-screenshots    — Profile screenshots uploaded for audit (private, RLS)
```

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| 080 | Create `presence_platforms`, `presence_phases`, `presence_outputs` tables |
| 081 | Create `presence_conversations`, `presence_profile_screenshots` tables |
| 082 | Create `presence_playbooks` table, add presence fields to `organizations` |
| 083 | Create `presence-screenshots` storage bucket with RLS policies |

---

## 8. User Journey Maps

### Journey 1 — New User, Brand Engine Complete, First Time in Presence Engine

```
Step 1: User completes Brand Engine Phase 10
        → System auto-detects completion
        → Presence Engine unlocked notification shown
        → Dashboard shows "Presence Engine — Ready to activate"

Step 2: User clicks "Start Presence Engine"
        → Platform Selection screen loads
        → AI reads icp_demographics, brand_archetype, content_themes
        → Recommended platforms shown with reasoning
        → User selects platforms (min 1)
        → presence_platforms_active saved

Step 3: Phase 1 — Platform Strategy
        → Gary Vaynerchuk agent opens
        → Reads Brand Engine variables
        → Presents platform priority ranking
        → 5 questions with expert guidance
        → Phase 1 locked

Step 4: Phase 2 — LinkedIn (if selected)
        → Daniel Priestley agent opens
        → AI pre-generates complete LinkedIn profile from Brand Engine vars
        → User sees full draft instantly — reacts and refines
        → 6 questions with expert guidance
        → LinkedIn outputs locked
        → LinkedIn completion score: 85–95 (typical)

Step 5: Phase 3 — Facebook (if selected), OR Phase 4 — Instagram (if selected)
        → Continues through selected platforms
        → Each platform phase opens with pre-generated draft
        → User refines and approves

Step 6: Phase 7 — Presence Audit
        → Dorie Clark agent opens
        → AI cross-references all platform outputs
        → Consistency Score calculated
        → Gap report presented
        → 30-day activation plan generated

Step 7: Presence Playbook generated
        → PDF/HTML document with all platform copy ready to implement
        → Shareable link generated
        → User proceeds to Content Engine (Engine 3)
```

### Journey 2 — Returning User, Updating One Platform

```
Step 1: User enters Presence Engine from dashboard
        → All previously locked platforms shown with scores
        → User identifies low-scoring platform to improve

Step 2: User clicks "Improve [Platform]"
        → Phase for that platform opens in edit mode
        → All existing outputs shown
        → User unlocks specific outputs to refine
        → Expert agent assists with improvements

Step 3: Phase 7 auto-recalculates
        → Consistency Score updates
        → Gap report refreshes
        → Updated Playbook can be regenerated

Step 4: User implements updated copy on actual platform
        → Marks platform as "Implemented" in the dashboard
        → Implementation tracking recorded
```

### Journey 3 — Adding a New Platform Later

```
Step 1: User returns to Platform Selection
        → Can add new platform at any time
        → Existing platforms and scores preserved

Step 2: New platform phase activates
        → AI reads all existing Brand Engine + Presence Engine outputs
        → Pre-generates new platform profile using all available context
        → Consistency is auto-enforced — new platform matches existing

Step 3: Phase 7 re-runs
        → Includes new platform in consistency audit
        → Score updates
        → Playbook regenerates with new platform included
```

### Journey 4 — User Updates Brand Engine (Re-runs Presence Engine)

```
Step 1: User updates a Brand Engine variable (e.g., new one_liner after brand pivot)
        → System detects Brand Engine output has changed
        → Presence Engine shows notification: "Brand Engine updated — review affected profiles"

Step 2: Affected outputs flagged
        → Any Presence Engine output generated from updated Brand Engine variable is flagged as "Needs review"
        → User sees which platform profiles are affected and what specifically changed

Step 3: User re-runs affected phases
        → Opens flagged phases
        → AI re-generates content using updated Brand Engine variables
        → User reviews and approves
        → Outputs re-locked

Step 4: Consistency Score recalculated
        → New score reflects updated profiles
        → Playbook regenerated
```

---

## 9. Expert AI Agents

Each Presence Engine phase has a named expert. Same persona structure as Brand Engine agents.

### Agent Persona Structure

Each agent has:
- **openingStyle** — How they introduce the phase and present pre-generated content
- **communicationTraits** — Array of characteristic behaviors
- **signaturePhrases** — Memorable phrases they use
- **methodology** — Core framework they apply
- **refinementStyle** — How they guide copy refinement (different from Brand Engine pushback — here they refine, not extract)
- **closingStyle** — How they present final locked outputs

### Phase → Agent Mapping

| Phase | Agent | Title | Methodology | Key Trait |
|-------|-------|-------|-------------|-----------|
| 1 | Gary Vaynerchuk | Platform Strategist | Jab Jab Jab Right Hook — platform-native content | Blunt, direct, anti-perfectionism |
| 2 | Daniel Priestley | LinkedIn Authority Expert | Key Person of Influence 5P framework | Prestigious, strategic, authority-builder |
| 3 | Mari Smith | Facebook Marketing Expert | Facebook Engagement Formula | Warm, community-focused, relationship-first |
| 4 | Jasmine Star | Instagram Growth Strategist | Magnetic Content + Aesthetic Cohesion | Visual, aspirational, story-driven |
| 5 | Neil Patel | Local SEO Expert | Search Intent + Local Authority | Data-driven, practical, ROI-focused |
| 6 | Roberto Blake | YouTube & Video Strategist | Content Creator Economy principles | Encouraging, systems-focused, long-game |
| 7 | Dorie Clark | Personal Brand Strategist | Stand Out (long-game brand building) | Thoughtful, diagnostic, clarity-focused |

### Key Behavioural Difference from Brand Engine Agents

Brand Engine agents **extract** — they dig until they get the truth.
Presence Engine agents **propose and refine** — they present pre-generated copy and iterate toward approval.

The refinement loop for each platform phase follows this pattern:

```
1. AI presents pre-generated draft based on Brand Engine variables
2. User reacts — "what feels wrong, what is missing, what needs changing"
3. AI refines — presents updated version
4. User approves or refines again (maximum 5 refinement rounds per question)
5. User says "lock this" — outputs saved
6. AI moves to next question
```

---

## 10. Profile Scoring System

### How Scores Are Calculated

Each platform's completion score (0–100) is calculated across 5 dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| **Completeness** | 30% | All profile fields filled in |
| **Brand Alignment** | 25% | Copy reflects Brand Engine positioning and one_liner |
| **ICP Relevance** | 20% | Profile speaks directly to ideal client pain/desire |
| **CTA Clarity** | 15% | Clear, singular call to action present |
| **Voice Consistency** | 10% | Tone matches brand_characteristics and tone_descriptors |

### Consistency Score (Phase 7)

The overall Presence Consistency Score (0–100) measures how uniform the brand is across all active platforms:

| Factor | Weight | How Measured |
|--------|--------|-------------|
| **Headline/Bio Alignment** | 35% | Does core message appear consistently across all bios? |
| **CTA Consistency** | 25% | Does the same primary CTA appear across all platforms? |
| **Category Claim** | 20% | Is the category_name used consistently? |
| **Visual Identity Reference** | 10% | Are visual direction notes consistent with Phase 7 brand identity? |
| **Tone Match** | 10% | Does tone match brand_characteristics across platforms? |

### Score Thresholds

| Score Range | Label | Meaning |
|------------|-------|---------|
| 90–100 | Excellent | Brand presence is professional, consistent, and client-attracting |
| 75–89 | Strong | Minor gaps — quick wins available |
| 60–74 | Developing | Notable inconsistencies — targeted improvements needed |
| 40–59 | Needs Work | Significant gaps — multiple platforms need attention |
| 0–39 | Critical | Presence is doing more harm than good — urgent action required |

---

## 11. API Routes

All routes under `app/api/presence/`:

### Core Chat & Navigation

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/presence/chat` | Main expert chat (supports text + screenshot uploads, streaming) |
| POST | `/api/presence/navigate-question` | Jump to specific question index within phase |
| POST | `/api/presence/lock-answer` | Lock question outputs |
| POST | `/api/presence/unlock` | Unlock a locked answer |

### Platform Management

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/presence/platforms/activate` | Activate or deactivate a platform |
| GET | `/api/presence/platforms` | Get all platforms with status and scores |
| POST | `/api/presence/platforms/reorder` | Update platform priority order |

### Output Management

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/presence/variable` | Save/update individual presence output variable |
| POST | `/api/presence/lock` | Lock question outputs + transition to next question |
| GET | `/api/presence/outputs` | Get all outputs for an organization |
| POST | `/api/presence/generate` | Trigger AI pre-generation for a phase (reads Brand Engine vars) |

### Screenshots & Audit

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/presence/screenshot` | Upload profile screenshot for audit |
| GET | `/api/presence/screenshot/[platform]` | Retrieve screenshots for a platform |
| POST | `/api/presence/audit` | Trigger consistency audit and score calculation |

### Playbook & Export

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/presence/playbook/export` | Export Presence Playbook as browsable HTML |
| GET | `/api/presence/playbook/[platform]` | Export single-platform profile guide |

---

## 12. Key Components

All under `components/presence/`:

| Component | Purpose |
|-----------|---------|
| `platform-selector.tsx` | Multi-platform selection grid with AI recommendations |
| `platform-nav-tabs.tsx` | Tab navigation across active platforms |
| `presence-progress-sidebar.tsx` | Sidebar showing all phases with status and completion scores |
| `phase-header.tsx` | Phase banner with expert agent, platform, and progress |
| `question-stepper.tsx` | Question stepper (reused from Brand Engine) |
| `chat-interface.tsx` | Expert chat UI (reused from Brand Engine) |
| `expert-chat-panel.tsx` | Expert persona display + chat (reused from Brand Engine) |
| `profile-draft-preview.tsx` | Real-time preview of AI-generated profile copy |
| `platform-preview-card.tsx` | Visual mockup of profile as it would appear on the platform |
| `screenshot-uploader.tsx` | Drag-drop screenshot upload for gap audit |
| `consistency-score-display.tsx` | Circular score gauge with breakdown by platform |
| `platform-score-card.tsx` | Individual platform score with gap indicators |
| `presence-output-panel.tsx` | Display locked outputs from current phase |
| `variable-preview-card.tsx` | Single variable preview card with lock/unlock (reused) |
| `quick-wins-list.tsx` | Prioritised list of actionable quick wins |
| `activation-plan-timeline.tsx` | 30-day plan displayed as interactive timeline |
| `presence-playbook-viewer.tsx` | Full playbook browsable HTML viewer |
| `brand-variable-injector.tsx` | Shows which Brand Engine vars are feeding the current phase |

---

## 13. Architecture & Design Decisions

### Pre-Generation, Not Extraction

The fundamental UX difference between the Brand Engine and Presence Engine:
- Brand Engine extracts information the user has not yet articulated
- Presence Engine generates content from information already captured — then refines it

This means the Presence Engine should feel **faster** and **less mentally demanding** than the Brand Engine. The hard thinking is already done.

### Platform-Conditional Phase Architecture

Phases 3–6 are conditionally rendered based on `presence_platforms_active`. The phase structure in the database uses a `skipped` status rather than `locked` for non-activated platforms. This allows:
- Adding platforms later without resetting the engine
- Clean progress tracking that doesn't penalise users for not using all platforms
- Consistent phase numbers across all organisations (Phase 3 is always Facebook, regardless of whether it's active)

### Generated From Brand Flag

The `generated_from_brand` boolean on `presence_outputs` enables future product intelligence:
- Track acceptance rate of AI-generated copy (how much do users change?)
- Identify which brand variables produce the most accepted output
- Flag outputs that need review when brand variables change

### Profile Preview Components

Each platform phase should show a live preview of what the profile will look like — not just copy in a text field. This means:
- LinkedIn: Show the profile card with headline, photo placeholder, and About preview
- Instagram: Show the profile grid header with bio and link
- Facebook: Show the page header with cover image placeholder
- GMB: Show the knowledge panel preview

These are mockup components — not live API connections to the platforms. They give the user visual confirmation that the copy will work in context.

### Screenshot Upload for Gap Audit

Phase 2, Q5 and Phase 7 accept screenshot uploads. The AI analyses the screenshot against the approved outputs and generates specific, actionable gap findings. This is the most high-value feature for returning users who want to update existing profiles.

### Brand Engine Re-Run Detection

When a Brand Engine variable changes after Presence Engine is complete:
- A database trigger compares the updated variable against `generated_from_brand = true` outputs
- Affected outputs are flagged as `needs_review`
- A notification appears in the Presence Engine dashboard
- The user can selectively re-run affected phases

This prevents stale profiles after brand pivots — a common problem that the Presence Engine solves permanently.

### Sequential Progression With Platform Skipping

Users must complete phases in order — but skipped phases (non-activated platforms) do not block progression. The sequence enforcement logic must:
1. Check if next phase is skipped (`status = 'skipped'`)
2. If skipped, auto-advance to the next non-skipped phase
3. Never block on a skipped phase

### Presence Playbook Structure

The Presence Playbook exports per platform with:
1. **Platform Cover Page** — Platform name, overall score, and priority ranking
2. **Profile Copy Sheet** — All approved copy for every field on that platform
3. **Implementation Checklist** — Step-by-step instructions for updating the actual profile
4. **Visual Briefs** — Designer briefs for banner/cover images
5. **Cross-Platform Consistency Summary** — How this platform connects to the others

---

## 14. File Reference

### Configuration

| File | Content |
|------|---------|
| `config/presence-phases.ts` | 7 phase definitions with questions, outputs, question-output maps, agent assignments |
| `config/presence-agents.ts` | 7 agent definitions with personas, methodologies, refinement styles |
| `config/platform-configs.ts` | Platform definitions, field specs, character limits, recommendation logic |

### Services

| File | Purpose |
|------|---------|
| `lib/presence/brand-variable-reader.ts` | Reads Brand Engine outputs and formats them for Presence Engine injection |
| `lib/presence/profile-generator.ts` | Core AI generation service — produces initial platform drafts from brand vars |
| `lib/presence/consistency-scorer.ts` | Calculates consistency scores across platforms |
| `lib/presence/gap-analyser.ts` | Identifies gaps between current profile (from screenshots) and target outputs |
| `lib/playbook/parse-presence-outputs.ts` | Parses raw outputs to `ParsedPresenceData` structure |
| `lib/playbook/presence-playbook-theme.ts` | Playbook styling using brand colors/typography |

### Types

| File | Relevant Types/Tables |
|------|----------------------|
| `types/database.ts` | presence_platforms, presence_phases, presence_outputs, presence_conversations, presence_profile_screenshots, presence_playbooks |
| `types/presence.ts` | PlatformKey, PlatformStatus, PlatformGoal, PresenceOutput, ConsistencyScore, ConsistencyFlag |

### Migrations

| Migration | Purpose |
|-----------|---------|
| 080 | Create presence_platforms, presence_phases, presence_outputs |
| 081 | Create presence_conversations, presence_profile_screenshots |
| 082 | Create presence_playbooks, add presence fields to organizations |
| 083 | Create presence-screenshots storage bucket with RLS |

---

*End of PRESENCE-ENGINE-MASTER.md*
*Version: 1.0 — Initial specification*
*Built on: BRAND-ENGINE-MASTER.md V3 (123 variables)*
