# SkaleFlow Content Engine — Master Reference

> Complete documentation of the Content Engine system: campaign structure, content types, variables, database schema, user journeys, AI generation logic, analytics, and architecture.
> **Engine 3 of 5 in the Brand Gravity Method.**
> **Prerequisites: Brand Engine (complete) + Presence Engine (at least 1 platform active).**

---

## Table of Contents

1. [Overview](#1-overview)
2. [The Meta Ads Manager Model — How It Works](#2-the-meta-ads-manager-model--how-it-works)
3. [The 7 Content Types](#3-the-7-content-types)
4. [Campaign Objectives & Content Type Ratios](#4-campaign-objectives--content-type-ratios)
5. [Campaign Structure — Fields & Rules](#5-campaign-structure--fields--rules)
6. [AI Content Generation Logic](#6-ai-content-generation-logic)
7. [Brand Variable Injection](#7-brand-variable-injection)
8. [Content Status Lifecycle](#8-content-status-lifecycle)
9. [Mid-Campaign AI Adjustment System](#9-mid-campaign-ai-adjustment-system)
10. [Winner Identification System](#10-winner-identification-system)
11. [Content Recycling Engine](#11-content-recycling-engine)
12. [Scheduling Rules](#12-scheduling-rules)
13. [Publishing System](#13-publishing-system)
14. [UTM & Conversion Tracking](#14-utm--conversion-tracking)
15. [Analytics & Reporting](#15-analytics--reporting)
16. [Intelligence Features](#16-intelligence-features)
17. [Database Schema](#17-database-schema)
18. [User Journey Maps](#18-user-journey-maps)
19. [API Routes](#19-api-routes)
20. [Key Components](#20-key-components)
21. [Architecture & Design Decisions](#21-architecture--design-decisions)
22. [File Reference](#22-file-reference)
23. [V3 Migration Notes](#23-v3-migration-notes)

---

## 1. Overview

The Content Engine is SkaleFlow's AI-powered organic content system. It is modelled after Meta Ads Manager — the same Campaign → Ad Set → Ad hierarchy — but for organic social content instead of paid ads.

Instead of paying for reach, the user earns it through strategically planned content. The AI selects the right mix of content types based on the campaign objective, generates all posts from Brand Engine variables, schedules them across active platforms, tracks performance, and gets smarter with every campaign.

**Key stats:**

| Metric | Value |
|--------|-------|
| Campaign hierarchy levels | 3 — Campaign → Ad Set → Post |
| Content types | 7 |
| Campaign objectives | 18 |
| Supported platforms | 6 — LinkedIn, Facebook, Instagram, TikTok, YouTube, X/Twitter |
| Aggressiveness tiers | 3 — Focused (3/wk), Committed (5/wk), Aggressive (7–10/wk) |
| Posts generated per batch | Up to 30 (paid tier), up to 7 (free tier) |
| Brand Engine variables available | 123 |
| Core variables always injected | 8 |
| Strategic variables per post | 5 (curated per objective × content type) |

**What V3 replaces in V2:**
- Removes StoryBrand stage × funnel stage as the primary content organising logic
- Replaces with 7 Content Types × Campaign Objective as the primary logic
- Adds Campaign → Ad Set → Ad hierarchy (did not exist in V2)
- Adds aggressiveness tiers per channel
- Adds mid-campaign AI adjustment system
- Adds winner identification and winner pool
- Adds content recycling engine
- Adds AI objective sequencing recommendations
- Retains V2 infrastructure: queue system, publishing adapters, analytics, approval workflow, UTM system

---

## 2. The Meta Ads Manager Model — How It Works

### The Core Concept

V2 treated content as a flat calendar. V3 treats content as campaigns with strategy.

```
CAMPAIGN (What you want to achieve)
└── AD SET (Which channel, how often, what formats)
    └── POST (The actual content — hook, body, CTA, visual brief)
```

### How a User Creates a Campaign

1. **Create Campaign** — Pick objective, name it, set dates
2. **Configure Ad Sets** — For each platform, set aggressiveness and formats
3. **AI suggests content type ratio** — Based on objective and channel, the AI recommends how many of each content type to generate (user can adjust)
4. **Generate content** — AI batch-generates all posts using Brand Engine variables
5. **Review and approve** — User reviews each post, edits if needed, approves
6. **Schedule and publish** — Posts scheduled per platform, auto-published
7. **Track and optimise** — Performance data feeds back, AI flags winners and suggests adjustments

### Multiple Campaigns Can Run Simultaneously

Users can have multiple active campaigns at once — e.g. an Awareness campaign on Instagram while running an Authority campaign on LinkedIn. The system detects conflicts and flags them.

---

## 3. The 7 Content Types

Every piece of content maps to one of seven types. These types exist on a spectrum — bottom types grow audience fastest, top types convert that audience.

```
DECISION MAKERS ←————————————————————————→ PRACTITIONERS
(Slow growth, high conversion value)        (Fast growth, high volume)
Type 1   Type 2   Type 3   Type 4   Type 5   Type 6   Type 7
Outcome   POV    Strategic  Frame   Guides   Tactics   Micro
```

| # | Name | What It Is | Content Examples | Primary Outcome |
|---|------|-----------|-----------------|-----------------|
| 1 | **Outcome Oriented** | Proof of results. KPIs, revenue numbers, growth metrics, case study data. | "We generated R291K with R5K spend." / Revenue screenshots. Before/after metrics. Client results. | Slowest audience growth. Wins decision makers. Closes high-ticket buyers. |
| 2 | **Point of View** | Primary insight, core values, strategic narrative. Contrarian takes. Belief statements. What you stand for. | "Most marketing advice keeps you dependent on the person giving it." / Strategy principles. Worldview content. | Wins decision makers. Attracts people who share your worldview. Builds authority. |
| 3 | **Strategic** | High-level processes, complete overviews, strategy summaries. The big picture thinking. | "The 3-engine approach to brand building." / "Why your funnel is upside down." / Strategy breakdowns. | Medium audience growth. Positions you as seeing the full picture. |
| 4 | **Frameworks** | Abstract frameworks, decision matrices, planning models, comparison frameworks. Thinking tools. | "The Brand Gravity Method in one image." / "Use this matrix to decide your content mix." / Decision trees. | Medium audience growth. Wins champions — people who recommend you to decision makers. |
| 5 | **Step-by-Step Guides** | Action plans, roadmaps, tactical systems, workflows, playbooks. How to do specific things. | "How to create a 30-day content calendar in 60 minutes." / "5 steps to define your ICP." / Roadmaps. | Faster audience growth. People save and share this content. |
| 6 | **Tactics** | Lists of tools, quick tips, mini guides, best practices, guidelines, checklists. | "7 tools every founder needs." / "Quick tip: Always lead with the problem." / LinkedIn posting checklist. | Fastest audience growth. Wins practitioners — people who implement. |
| 7 | **Micro Execution** | Do's vs don'ts, tool breakdowns, templates, hacks, before/afters, real examples, micro-tweaks. | "Before vs after: this headline change doubled engagement." / "Don't do X. Do Y instead." / Templates. | Fastest audience growth. Extremely shareable. Wins practitioners. |

### Key Principle

> You need BOTH ends of the spectrum. Types 5–7 fill your audience. Types 1–3 convert that audience into customers. Types 3–4 bridge the two. Running only one end of the spectrum explains why most content strategies fail.

---

## 4. Campaign Objectives & Content Type Ratios

### All 18 Campaign Objectives

#### Growth Objectives

| Objective | Heavy Content Types | Light Content Types | Primary Metrics |
|-----------|-------------------|-------------------|----------------|
| **Awareness** | 5, 6, 7 | 3, 4 | Impressions, reach, follower growth, profile visits |
| **Leads** | 1, 2, 3 | 5 | Link clicks, form completions, DMs |
| **Engagement** | 4, 5, 6 | 7 | Comments, shares, saves, engagement rate |
| **Authority** | 1, 2, 3, 4 | — | Profile visits, DMs from decision makers, share of voice |

#### Revenue Objectives

| Objective | Heavy Content Types | Light Content Types | Primary Metrics |
|-----------|-------------------|-------------------|----------------|
| **Sales** | 1, 2 | 5 | Conversions, revenue, booking rate |
| **Upsell** | 1, 3, 4 | — | Upgrade rate, expansion revenue |
| **Retention** | 5, 6, 7 | — | Customer engagement, churn rate |
| **Referrals** | 1, 7 | — | Referral rate, referral conversions |

#### Launch Objectives

| Objective | Heavy Content Types | Light Content Types | Primary Metrics |
|-----------|-------------------|-------------------|----------------|
| **Pre-Launch Hype** | 2, 4 | 6, 7 | Waitlist signups, teaser engagement |
| **Product Launch** | 1, 2, 5 | 7 | Conversions, revenue, launch engagement |
| **Event Promotion** | 3, 5, 6 | — | Registrations, attendance rate |
| **Offer Promotion** | 1, 6, 7 | — | Conversions, revenue, urgency engagement |

#### Brand Objectives

| Objective | Heavy Content Types | Light Content Types | Primary Metrics |
|-----------|-------------------|-------------------|----------------|
| **Recruitment** | 2, 7 | — | Applications, culture post engagement |
| **Partnership** | 1, 2, 3 | — | Inbound partner inquiries, DMs |
| **Repositioning** | 2, 3, 4 | — | Sentiment shift, new audience demographics |
| **Crisis Management** | 2, 3 | — | Sentiment recovery, message reach |

#### Community Objectives

| Objective | Heavy Content Types | Light Content Types | Primary Metrics |
|-----------|-------------------|-------------------|----------------|
| **Nurture** | 5, 6, 7 | — | Re-engagement rate, returning visitors |
| **Education** | 3, 4, 5 | — | Save rate, share rate, content completion |

### Content Type Ratio Table

AI default ratios. All user-adjustable.

| Objective | T1 | T2 | T3 | T4 | T5 | T6 | T7 |
|-----------|----|----|----|----|----|----|-----|
| Awareness | 0% | 5% | 10% | 10% | 20% | 30% | 25% |
| Leads | 25% | 25% | 20% | 10% | 15% | 5% | 0% |
| Engagement | 5% | 5% | 10% | 20% | 25% | 25% | 10% |
| Authority | 20% | 25% | 25% | 20% | 10% | 0% | 0% |
| Sales | 30% | 25% | 15% | 5% | 15% | 5% | 5% |
| Upsell | 25% | 20% | 25% | 20% | 10% | 0% | 0% |
| Retention | 5% | 5% | 10% | 10% | 25% | 25% | 20% |
| Referrals | 35% | 10% | 10% | 5% | 10% | 20% | 10% |
| Pre-Launch | 5% | 25% | 10% | 20% | 10% | 15% | 15% |
| Product Launch | 25% | 20% | 10% | 5% | 20% | 10% | 10% |
| Event Promotion | 5% | 10% | 20% | 10% | 25% | 20% | 10% |
| Offer Promotion | 25% | 15% | 10% | 5% | 15% | 15% | 15% |
| Recruitment | 10% | 30% | 10% | 5% | 10% | 10% | 25% |
| Partnership | 25% | 30% | 30% | 10% | 5% | 0% | 0% |
| Repositioning | 10% | 35% | 30% | 20% | 5% | 0% | 0% |
| Crisis Management | 5% | 45% | 40% | 10% | 0% | 0% | 0% |
| Nurture | 5% | 5% | 10% | 10% | 25% | 25% | 20% |
| Education | 5% | 10% | 25% | 25% | 25% | 10% | 0% |

> **Adjustment rule:** If the brand has no case studies, reduce Type 1 to 0% and redistribute to Types 2–3. If capacity is video-only, shift weight toward Types that perform best in video formats (6, 7 for short video; 3, 5 for long video). Ratios are starting points — not rules.

---

## 5. Campaign Structure — Fields & Rules

### 5.1 Campaign Level

One campaign = one objective + one duration. Multiple campaigns can run simultaneously.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `campaign_id` | UUID (PK) | |
| `organization_id` | UUID (FK → organizations) | |
| `name` | TEXT | User-defined or AI-suggested |
| `objective` | TEXT | One of 18 objectives (see Section 4) |
| `objective_category` | TEXT | `growth` / `revenue` / `launch` / `brand` / `community` |
| `status` | TEXT | `draft` / `active` / `paused` / `completed` / `cancelled` / `archived` |
| `start_date` | DATE | Default: today |
| `end_date` | DATE | Default: today + 30 days. Null = ongoing. |
| `total_posts_target` | INTEGER | Calculated from all ad set configurations |
| `sequence_position` | INTEGER (nullable) | Position in an AI-recommended campaign sequence |
| `sequence_id` | UUID (nullable) | Groups campaigns in a recommended sequence |
| `ai_sequence_recommendation` | JSONB (nullable) | The AI's full sequence recommendation stored for reference |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Rules:**
- One campaign = one primary objective
- Multiple campaigns can run simultaneously
- Campaign-level analytics aggregate from all ad sets and posts within it
- Max 5 simultaneous active campaigns per organisation (enforced in UI, not database)

---

### 5.2 Ad Set Level (Per Channel)

Each platform within a campaign gets its own configuration.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `adset_id` | UUID (PK) | |
| `campaign_id` | UUID (FK → campaigns) | |
| `organization_id` | UUID (FK → organizations) | |
| `channel` | TEXT | `linkedin` / `facebook` / `instagram` / `tiktok` / `youtube` / `x` |
| `aggressiveness` | TEXT | `focused` / `committed` / `aggressive` |
| `posts_per_week` | INTEGER | Focused=3, Committed=5, Aggressive=7–10 |
| `total_posts` | INTEGER | Calculated: posts_per_week × campaign_weeks |
| `content_type_ratio` | JSONB | `{type_1: %, type_2: %, ..., type_7: %}` — AI default, user adjustable |
| `content_type_counts` | JSONB | `{type_1: n, type_2: n, ..., type_7: n}` — actual post counts per type |
| `format_ratio` | JSONB | `{reel: %, static: %, carousel: %, text: %, video: %}` — AI-suggested, user adjustable |
| `posting_schedule` | JSONB | `{monday: [time], tuesday: [time], ...}` — AI defaults or user-defined |
| `status` | TEXT | `active` / `paused` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Aggressiveness defaults:**

| Tier | Posts/Week | Posts/30 days | Best For |
|------|-----------|--------------|---------|
| Focused | 3 | 12–13 | Solo founders running this alongside their business |
| Committed | 5 | 21–22 | Founders with a small team or dedicated content blocks |
| Aggressive | 7–10 | 30–40+ | Teams with production support (designer, editor) |

**Format ratio defaults per channel:**

| Channel | Reel | Static | Carousel | Text | Video |
|---------|------|--------|----------|------|-------|
| LinkedIn | 20% | 20% | 30% | 30% | 0% |
| Instagram | 40% | 30% | 30% | 0% | 0% |
| Facebook | 25% | 25% | 25% | 25% | 0% |
| TikTok | 80% | 0% | 0% | 0% | 20% |
| YouTube | 0% | 0% | 0% | 0% | 100% |
| X/Twitter | 0% | 20% | 10% | 70% | 0% |

---

### 5.3 Post Level (Individual Content)

The actual content unit — one post per row.

**Core identifiers:**

| Field | Type | Description |
|-------|------|-------------|
| `post_id` | UUID (PK) | |
| `adset_id` | UUID (FK → adsets) | |
| `campaign_id` | UUID (FK → campaigns) | |
| `organization_id` | UUID (FK → organizations) | |

**Strategy:**

| Field | Type | Description |
|-------|------|-------------|
| `content_type` | INTEGER | 1–7 (see Section 3) |
| `content_type_name` | TEXT | Human display name |
| `objective` | TEXT | Inherited from campaign |
| `platform` | TEXT | Single platform (one post = one platform) |
| `format` | TEXT | `reel` / `static` / `carousel` / `text` / `video` / `long_video` |
| `placement_type` | TEXT | Platform-specific placement (e.g. `instagram_reel`, `linkedin_feed`) |

**Content body:**

| Field | Type | Description |
|-------|------|-------------|
| `topic` | TEXT | Post topic / one-line summary |
| `hook` | TEXT | Selected hook (from hook_variations) |
| `hook_variations` | TEXT[] | 3 hook options generated by AI |
| `body` | TEXT | Main body copy or script |
| `cta` | TEXT | Call to action |
| `caption` | TEXT | Social media caption (may differ from body for video posts) |
| `hashtags` | TEXT[] | Array of hashtags |
| `visual_brief` | TEXT | Image concept brief for designer |
| `shot_suggestions` | TEXT | Filming directions for video/reel formats |
| `slide_content` | JSONB (nullable) | Per-slide content for carousel posts — `[{slide: 1, headline: "", body: ""}]` |
| `on_screen_text` | JSONB (nullable) | On-screen text overlays for video — `[{timestamp: "0:03", text: ""}]` |

**Platform-native variations:**

| Field | Type | Description |
|-------|------|-------------|
| `platform_variations` | JSONB (nullable) | Same content adapted per platform — `{linkedin: {caption}, instagram: {caption}}` |

**Scheduling:**

| Field | Type | Description |
|-------|------|-------------|
| `scheduled_date` | DATE | Planned publish date |
| `scheduled_time` | TIME | Planned publish time |
| `generation_week` | INTEGER | 1–5, position within campaign |

**AI metadata:**

| Field | Type | Description |
|-------|------|-------------|
| `ai_generated` | BOOLEAN | Whether AI produced this content |
| `ai_model` | TEXT | Model ID used |
| `ai_prompt_used` | TEXT | Full prompt for debugging |
| `brand_voice_score` | DECIMAL (nullable) | 0–100 AI-assessed brand voice consistency |
| `brand_variables_used` | TEXT[] | Keys of brand variables injected into this post's generation |

**Approval workflow:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | TEXT | See Content Status Lifecycle |
| `assigned_to` | UUID (FK → users, nullable) | |
| `approved_at` | TIMESTAMPTZ (nullable) | |
| `approved_by` | UUID (FK → users, nullable) | |
| `review_comment` | TEXT (nullable) | Revision feedback |
| `rejection_reason` | TEXT (nullable) | Why rejected |

**Tracking:**

| Field | Type | Description |
|-------|------|-------------|
| `target_url` | TEXT (nullable) | Destination URL |
| `utm_parameters` | JSONB (nullable) | `{utm_source, utm_medium, utm_campaign, utm_content}` |
| `variation_group_id` | UUID (nullable) | Groups A/B hook variations |
| `is_primary_variation` | BOOLEAN | Primary vs alternate |

**Performance:**

| Field | Type | Description |
|-------|------|-------------|
| `performance` | JSONB | `{impressions, reach, likes, comments, shares, saves, clicks, video_views, engagement_rate}` |
| `winner_category` | TEXT (nullable) | `awareness` / `engagement` / `traffic` / `conversion` / `viral` |
| `is_winner` | BOOLEAN | Flagged as a winner |
| `recycled_from` | UUID (nullable) | Post ID if this is a recycled version |

**Publishing:**

| Field | Type | Description |
|-------|------|-------------|
| `published_at` | TIMESTAMPTZ (nullable) | |
| `platform_post_id` | TEXT (nullable) | Platform-side post ID |
| `post_url` | TEXT (nullable) | Live URL of published post |

**Timestamps:**

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

## 6. AI Content Generation Logic

### Generation Flow

```
User triggers generation for a campaign ad set
→ System reads campaign objective + channel + content type ratio
→ System reads Brand Engine variables (8 core + 5 strategic)
→ System reads platform-specific format rules and character limits
→ AI generates all posts in batch (queue-based)
→ Each post: hook × 3, body, CTA, caption, visual brief / shot suggestions
→ Brand voice score calculated per post
→ Posts land in review queue
```

### Per-Post Generation Requirements

**For Every Post:**
1. Generate 3 hook variations — user picks the one that sounds most like them
2. Hook must stop the scroll in line 1 (text) or first 3 seconds (video)
3. Every post must work standalone — assume zero prior context
4. End with a CTA aligned to the campaign objective
5. Use brand vocabulary and avoid blacklisted words (from Brand Engine)
6. Reference ICP-specific pain points and language
7. Name the enemy where contextually relevant
8. Add hashtags — mix of brand + topic + reach

**For Text Posts:**
- Hook (lines 1–2): Pattern interrupt, contrarian statement, or direct pain point
- Body: Value delivery in the content type's style
- Keep paragraphs to 1–2 lines for readability
- CTA: Aligned to campaign objective

**For Static Images:**
- Caption follows text post rules
- Visual brief: what text/data/image goes on the graphic, layout suggestion, brand colour usage

**For Carousels:**
- Slide 1: The hook — treated as a headline. Must stop the scroll.
- Slides 2–8: One key point per slide, minimal text per slide, visual hierarchy
- Final slide: CTA — tell them what to do next
- Caption: Summarise carousel value + CTA + hashtags
- `slide_content` JSONB populated with per-slide text

**For Reels / Short Video:**
- Hook (0–3 sec): Pattern interrupt. No intros, no logos, no "hey guys"
- Body (3–60 sec): Content delivered. One idea per video. Keep it moving.
- CTA (last 5–10 sec): Tell them what to do
- `shot_suggestions` populated with: talking head / screen recording / B-roll / text overlay notes
- `on_screen_text` JSONB populated with timestamp-keyed overlay text

**For Long Video (YouTube):**
- Hook (0–15 sec): Why they should keep watching
- Intro (15–30 sec): What they'll learn
- Body: Structured sections with clear transitions
- CTA: What to do next
- Chapter markers, thumbnail concept, description copy

### Scheduling Rules Enforced During Generation

1. Never schedule a CTA/conversion post cold — always have attraction or authority content in the 1–2 days before a conversion post
2. Never repeat the same content type 3 times in a row
3. Front-load the week — if 3x/week: Monday-Wednesday-Friday. If 5x: Monday–Friday
4. Default posting times (overridden once platform performance data exists):
   - LinkedIn: Tuesday–Thursday, 8–10am and 12–1pm
   - Facebook: Monday–Friday, 9am–12pm
   - Instagram: Monday–Friday, 11am–1pm and 7–9pm
   - TikTok: Tuesday–Thursday, 7–9pm
   - YouTube: Friday–Sunday, 12–3pm
   - X/Twitter: Monday–Friday, 8–10am

### Batch Generation

| Tier | Max items per batch |
|------|-------------------|
| Free / Trial | 7 |
| Paid | 30 |
| Super Admin | Unlimited |

**Batch exports available:**
- Script export — all video scripts formatted for teleprompter delivery
- Design brief export — all visual posts compiled with dimensions, text, layout notes, brand colours
- Bulk approve — approve all posts in a batch at once

---

## 7. Brand Variable Injection

### 8 Core Variables (Always Injected)

Every single post generation request receives these 8 variables:

```
tone_descriptors
vocabulary_preferred
vocabulary_avoided
brand_archetype
brand_characteristics
brand_values
message_core
one_liner
```

### Strategic Variable Selection

Each post additionally receives 5 strategic variables selected based on `campaign_objective × content_type` combination.

**Full strategic variable map:**

| Objective | Content Type | Strategic Variables Injected |
|-----------|-------------|----------------------------|
| Awareness | Type 5, 6, 7 | `icp_pains`, `icp_desires`, `content_themes`, `enemy_name`, `icp_tactic_trap` |
| Awareness | Type 1, 2 | `icp_emotional_triggers`, `enemy_description`, `brand_origin_story`, `icp_right_client_traits` |
| Authority | Type 1, 2 | `offer_outcome`, `offer_transformation_after`, `positioning_statement`, `differentiation_statement`, `competitive_landscape` |
| Authority | Type 3, 4 | `message_pillars`, `content_pillars`, `beliefs_to_teach`, `category_name`, `brand_purpose` |
| Leads | Type 1, 2, 3 | `offer_name`, `offer_outcome`, `offer_inclusions`, `lead_magnet_title`, `offer_transformation_after` |
| Leads | Type 5 | `icp_objections`, `icp_buying_triggers`, `offer_qualification_criteria`, `lead_magnet_promise` |
| Sales | Type 1, 2 | `offer_name`, `offer_tagline`, `offer_transformation_before`, `offer_transformation_after`, `offer_inclusions` |
| Sales | Type 5 | `offer_objections`, `offer_qualification_criteria`, `conversion_strategy`, `conversion_funnel` |
| Pre-Launch | Type 2, 4 | `enemy_name`, `category_name`, `brand_purpose`, `icp_pains`, `beliefs_to_teach` |
| Product Launch | Type 1, 2, 5 | `offer_name`, `offer_tagline`, `offer_outcome`, `lead_magnet_title`, `conversion_strategy` |
| Repositioning | Type 2, 3, 4 | `category_name`, `category_claim`, `differentiation_statement`, `positioning_statement`, `enemy_name` |
| Education | Type 3, 4, 5 | `beliefs_to_teach`, `content_themes`, `message_pillars`, `icp_internal_dialogue`, `icp_pains` |
| Nurture | Type 5, 6, 7 | `icp_desires`, `icp_right_client_traits`, `brand_values`, `offer_affiliate_tools`, `brand_faith_positioning` |
| Thought Leadership | Type 2, 3, 4 | `category_name`, `differentiation_statement`, `brand_purpose`, `message_pillars`, `competitive_landscape` |

### Variable Categories Reference

| Category | Variables |
|----------|-----------|
| **ICP** | `icp_demographics`, `icp_pains`, `icp_desires`, `icp_emotional_triggers`, `icp_internal_dialogue`, `icp_psychographics`, `icp_objections`, `icp_buying_triggers`, `customer_journey_stages`, `icp_right_client_traits`, `icp_values_alignment`, `icp_wrong_client_flags`, `icp_tactic_trap` |
| **Brand Identity** | `brand_archetype`, `brand_characteristics`, `brand_purpose`, `brand_values`, `brand_vision`, `brand_non_negotiables`, `brand_faith_positioning`, `brand_origin_story`, `founder_story` |
| **Enemy & Market** | `enemy_name`, `enemy_type`, `enemy_description`, `enemy_cost`, `enemy_false_promises`, `icp_tactic_trap` |
| **Offer & Lead Magnet** | `offer_problem`, `offer_outcome`, `offer_name`, `offer_tagline`, `offer_inclusions`, `offer_exclusions`, `offer_transformation_before`, `offer_transformation_after`, `lead_magnet_type`, `lead_magnet_title`, `lead_magnet_promise`, `offer_price_display`, `offer_tier`, `offer_objections`, `offer_qualification_criteria`, `offer_implementation_services`, `offer_affiliate_tools` |
| **Brand Voice** | `tone_descriptors`, `vocabulary_preferred`, `vocabulary_avoided`, `industry_terms_embrace`, `industry_terms_reject` |
| **Messaging & Positioning** | `message_core`, `message_pillars`, `positioning_statement`, `differentiation_statement`, `category`, `category_name`, `category_claim`, `one_liner`, `competitive_landscape`, `beliefs_to_teach` |
| **Content Strategy** | `content_themes`, `content_pillars` |
| **Growth Engine** | `authority_pitch`, `authority_publish_plan`, `authority_product_ecosystem`, `authority_partnerships`, `conversion_business_type`, `conversion_strategy`, `conversion_funnel`, `conversion_metrics` |

### Brand Voice Learning

The AI adapts based on user edits:
- If a user consistently removes specific words → those words added to a soft `vocabulary_avoided_learned` list
- If a user consistently restructures sentence patterns → AI adjusts generation style
- After 10+ edits, AI surfaces a notification: "I've noticed you consistently remove words like 'leverage' and 'synergy'. I've updated your brand voice profile accordingly."
- Learned patterns stored in `brand_voice_learned` on the organization record

---

## 8. Content Status Lifecycle

```
idea → scripted → pending_review → [approved | rejected | revision_requested]
                                          ↓
                                   filming / designing
                                          ↓
                                   filmed / designed → editing → edited
                                          ↓
                                      scheduled → published
                                                      ↓
                                                   failed (retry available)
                                                   archived
```

**Full status enum:**

```typescript
type ContentStatus =
  | 'idea'                 // Topic assigned, not yet written
  | 'scripted'             // AI-generated, not yet reviewed
  | 'pending_review'       // Submitted for human approval
  | 'revision_requested'   // Reviewer requested changes
  | 'approved'             // Cleared for production
  | 'rejected'             // Will not be published
  | 'filming'              // Video content in production
  | 'filmed'               // Video captured, needs editing
  | 'designing'            // Visual asset in progress
  | 'designed'             // Visual asset complete
  | 'editing'              // Video editing in progress
  | 'edited'               // Editing complete, ready to schedule
  | 'scheduled'            // In publishing queue
  | 'published'            // Live on platform
  | 'failed'               // Publish failed, retry available
  | 'archived';            // Removed from active use
```

---

## 9. Mid-Campaign AI Adjustment System

The AI monitors campaign performance continuously and surfaces recommendations when performance is off-track.

### Trigger Conditions

| Trigger | Condition |
|---------|-----------|
| Underperformance | Campaign engagement rate is 30%+ below baseline after 7 days |
| Content type fatigue | One content type's engagement drops 40%+ over consecutive posts |
| Format underperformance | One format consistently underperforms others by 2x+ |
| Scheduling gap | No posts published in 48+ hours |
| Objective mismatch | Post performance suggests audience is at different funnel stage than targeted |

### Adjustment Recommendation Format

The AI surfaces a specific, actionable recommendation — never vague:

```
"Your Type 6 Tactics reels on LinkedIn are getting 3× more engagement than 
your Type 3 Strategic static posts. You have 12 posts remaining in this 
ad set. I recommend shifting 4 of those static posts to Tactics reels.

Current ratio: Type 3 (33%), Type 6 (17%)
Proposed ratio: Type 3 (17%), Type 6 (33%)

This change affects posts 18, 22, 25, 27.
[Approve change] [Keep current plan] [Customise]"
```

**Rules:**
- No automatic changes without explicit user approval
- Recommendations stored in `campaign_adjustments` whether approved or dismissed
- Dismissed recommendations logged for AI learning
- Maximum 2 adjustment recommendations per week per campaign

---

## 10. Winner Identification System

The AI continuously monitors all posts and flags top performers.

### Winner Categories

| Category | Criteria | Primary Paid Use |
|----------|----------|-----------------|
| **Awareness Winner** | Top 10% by impressions and reach | Top-of-funnel awareness ad |
| **Engagement Winner** | Top 10% by engagement rate | Engagement-optimised ad for audience building |
| **Traffic Winner** | Top 10% by click-through rate | Traffic campaign to landing page |
| **Conversion Winner** | Directly led to tracked conversions | Retargeting ad for warm audiences |
| **Viral Winner** | 3× or more of average reach and engagement | Lookalike audience seed |

### Winner Pool

All flagged winners accumulate in a Winner Pool library:
- Each winner tagged with: category, performance data, content type, format, hook pattern, posting time
- AI extracts winning elements and feeds them back into future generation:
  - Winning hook patterns → weighted in future hook generation
  - Winning content types for this audience → weighted in future ratio recommendations
  - Winning posting times → overrides default scheduling recommendations
  - Winning formats → weighted in format ratio suggestions

### Winner Threshold Logic

```
Baseline = average engagement rate across all posts in the organisation (rolling 90 days)
Winner threshold = baseline × 2.5 for engagement/traffic winners
Winner threshold = baseline × 4.0 for viral winners
Conversion winners = any post with a tracked conversion event
```

---

## 11. Content Recycling Engine

High-performing posts are candidates for recycling after 90+ days.

### Recycling Criteria

| Condition | Value |
|-----------|-------|
| Minimum original performance score | Top 30% of all posts |
| Minimum days since published | 90 days |
| Not already recycled in last 180 days | Required |
| Original platform must still be active | Required |

### Recycling Process

1. AI identifies recycling candidates automatically
2. User sees: "These 3 posts are candidates for recycling — they performed well 90+ days ago and your current audience may not have seen them"
3. For each candidate, AI generates a refreshed version:
   - Same core message and content type
   - New hook (different pattern from original)
   - Updated examples or stats if applicable
   - Current context added where relevant
4. User approves before scheduling
5. `recycled_from` field maintains lineage tracking
6. Recycled posts compete on their own performance — not given inflated scores based on original

---

## 12. Scheduling Rules

### Conflict Detection

Index on `(organization_id, platform, scheduled_date, scheduled_time)` WHERE status NOT IN (`idea`, `rejected`, `archived`) — used for fast conflict detection.

### Platform Posting Limits (Enforced)

| Platform | Max per day | Max per week |
|----------|------------|--------------|
| LinkedIn | 2 | 10 |
| Instagram | 3 | 14 |
| Facebook | 3 | 14 |
| TikTok | 4 | 20 |
| YouTube | 1 | 5 |
| X/Twitter | 5 | 25 |

### Cross-Campaign Conflict Detection

If two active campaigns target the same platform on the same day with conflicting objectives (e.g. Awareness and Sales), the system flags the conflict and recommends:
- Stagger posting times (if daily limit allows)
- Pause one campaign for that day
- Merge the posts into a single ad set

---

## 13. Publishing System

### Platform Adapters

Located in `lib/social/platforms/`:

| Platform | Adapter | Placements |
|----------|---------|-----------|
| LinkedIn | `linkedin.ts` | feed, article, document |
| Facebook | `facebook.ts` | feed, reel, story |
| Instagram | `instagram.ts` | feed, reel, story |
| TikTok | `tiktok.ts` | video, story |
| YouTube | `youtube.ts` | video, short, community post |
| X/Twitter | `twitter.ts` | tweet, thread |

### Publish Flow

1. Client calls `POST /api/content/publish` with `postId` + `platform`
2. System reads `platform_variations` — if platform-specific version exists, use it; otherwise use base content
3. Append UTM-tagged URL to caption (if `target_url` set)
4. Call platform adapter to upload media and post
5. On success: update `platform_post_id`, `post_url`, status → `published`, `published_at`
6. On failure: store `error_message`, increment `retry_count`, status → `failed`

### Scheduled Publishing

Cron at `*/15 * * * *`:
- Finds all posts with status `scheduled` and `scheduled_time <= now`
- Publishes automatically
- Failed posts flagged with error reason

### Format Specifications

**Static Image:**
- LinkedIn: 1200×1200 or 1080×1350
- Facebook: 1200×630 or 1080×1080
- Instagram: 1080×1080 or 1080×1350
- TikTok: 1080×1920

**Carousel:**
- LinkedIn/Facebook/Instagram: 1080×1080 (up to 10 slides)

**Reel / Short Video:**
- All platforms: 9:16 (1080×1920)
- LinkedIn/Facebook/Instagram: up to 90 seconds
- TikTok: up to 10 minutes

**Long Video:**
- LinkedIn: 16:9 up to 10 minutes
- Facebook: 16:9 up to 240 minutes
- YouTube: 16:9 any length

---

## 14. UTM & Conversion Tracking

### UTM Auto-Generation

Every post with a link receives:

```
utm_source=[platform]
utm_medium=organic
utm_campaign=[campaign_id]
utm_content=[content_type]_[format]_[post_id]
```

### Conversion Tracking Chain

```
Post Published
→ Impressions / Engagement tracked via platform API
→ Click tracked via UTM in Google Analytics
→ Website visit tracked via pixel
→ Conversion event tracked (form submit, booking, purchase)
→ Attribution flows back to: specific post → content type → ad set → campaign
```

### Pixel Integrations

- **Meta Pixel** — WordPress plugin, Systeme.io, GoHighLevel
- **LinkedIn Insight Tag**
- **Google Analytics** (via UTM)

**Conversion events tracked:** form_submit, booking, purchase, video_view_25pct, video_view_50pct, video_view_100pct, page_visit, lead_magnet_download

---

## 15. Analytics & Reporting

### Campaign Dashboard

Two views — toggle between:
- **Table view** — like Meta Ads Manager. Campaign → Ad Set → Post drill-down. Columns sortable by any metric.
- **Calendar view** — visual calendar with post status indicators, engagement rate overlays

**Metrics at every level:**
- Campaign level: total impressions, total reach, total engagement, engagement rate, follower growth, tracked conversions, cost per conversion (if paid)
- Ad set level: per-channel breakdown of all above
- Post level: individual post stats + brand voice score + winner flag

### Analytics API

`GET /api/content/analytics?dateFrom=&dateTo=&campaignId=&adsetId=`

Returns:
- **Aggregates**: total likes, comments, shares, saves, impressions, reach, clicks, video views, avg engagement rate
- **Period comparison**: Percentage change vs previous period
- **Time series**: Daily breakdown with per-platform metrics
- **Content type performance**: Which of the 7 types performed best for this objective
- **Format performance**: Which formats outperformed
- **Top posts**: 5 highest-engagement posts
- **Heatmap**: Day × hour engagement patterns

### Post-Campaign AI Report

Auto-generated after every campaign ends:

```
Campaign: [name]
Objective: [objective]
Duration: 30 days | Channels: LinkedIn, Instagram
Total posts published: 42 | Avg engagement rate: 4.8%

TOP PERFORMERS:
- Type 6 Tactics reels (LinkedIn): 6.2% engagement — 3× campaign average
- Type 2 POV text posts (LinkedIn): 4.1% engagement, highest profile visits

UNDERPERFORMERS:
- Type 3 Strategic static posts (Instagram): 1.2% engagement
- Type 1 Outcome carousels (Instagram): 0.8% engagement

RECOMMENDATION FOR NEXT CAMPAIGN:
Run an Authority campaign on LinkedIn focused on Types 1-3. 
Your audience engages with practical content but hasn't seen 
enough proof to convert. Suggest 30-day Authority before a Leads campaign.

BRAND INTELLIGENCE UPDATE:
Your ICP responds most strongly to content about [top topics from engagement data].
Consider adding these pain points to your Brand Engine messaging framework.
```

### Campaign Readiness Dashboard

Before launching any campaign:
- Checklist of required elements (brand engine complete, platform connected, content approved)
- Health indicators per channel (green / amber / red)
- Amber alert if platform token expiring within 7 days
- Alert if campaign has unreviewed posts in the week ahead

---

## 16. Intelligence Features

### AI Objective Sequencing

AI recommends campaign sequences based on audience size and brand maturity. Always presented as recommendations — user can always override.

**Brand-new user (zero audience):**
1. Awareness campaign (30 days) — Types 5–7 heavy, build base
2. Authority campaign (30 days) — Types 1–4 heavy, establish expertise
3. Leads campaign (30 days) — CTA heavy, convert warm audience

**Product launch sequence:**
1. Education campaign (2 weeks) — Condition the market
2. Pre-Launch Hype (1 week) — Waitlist, teasers, anticipation
3. Product Launch (2 weeks) — Proof, urgency, CTAs
4. Nurture (ongoing) — Convert stragglers

**Established brand wanting more leads:**
1. Authority campaign (30 days) — Deepen trust
2. Leads campaign (30 days) — Convert with proof + CTAs
3. Engagement campaign (30 days) — Build community for social proof

### Viral Momentum Detection

AI detects unusual traction in first 2–4 hours post-publication:
- Velocity threshold: 3× typical engagement rate within first 2 hours
- Alert: "This post is gaining momentum. Consider posting a follow-up on [platform] today to ride the wave."
- Suggested follow-up content type and topic provided

### Content Fatigue Detection

AI identifies when audience engagement drops consistently on a specific content type or format:
- Fatigue threshold: 40%+ engagement drop across 3+ consecutive posts of same type
- Recommendation surfaced with before/after ratio and reasoning

### Campaign Conflict Detection

Flags if two active campaigns simultaneously target the same audience with conflicting messages or objectives:
- Conflict types: same platform + same day, opposing objectives (e.g. Awareness vs Sales), messaging contradiction
- Suggests: merge ad sets / stagger dates / pause one campaign

### Brand Intelligence Report

Post-campaign report that feeds insights back to Brand Engine:
- Which ICP pain points drove the most engagement
- Which messaging angles resonated most
- Brand voice evolution recommendations
- ICP refinement suggestions
- Stored in `brand_intelligence_reports` for reference

---

## 17. Database Schema

### `campaigns`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `organization_id` | UUID (FK) | |
| `name` | TEXT | |
| `objective` | TEXT | One of 18 objectives |
| `objective_category` | TEXT | growth / revenue / launch / brand / community |
| `status` | TEXT | draft / active / paused / completed / cancelled / archived |
| `start_date` | DATE | |
| `end_date` | DATE (nullable) | Null = ongoing |
| `total_posts_target` | INTEGER | Calculated |
| `sequence_position` | INTEGER (nullable) | |
| `sequence_id` | UUID (nullable) | |
| `ai_sequence_recommendation` | JSONB (nullable) | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### `campaign_adsets`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `campaign_id` | UUID (FK → campaigns) | |
| `organization_id` | UUID (FK) | |
| `channel` | TEXT | linkedin / facebook / instagram / tiktok / youtube / x |
| `aggressiveness` | TEXT | focused / committed / aggressive |
| `posts_per_week` | INTEGER | |
| `total_posts` | INTEGER | |
| `content_type_ratio` | JSONB | `{type_1: %, ..., type_7: %}` |
| `content_type_counts` | JSONB | `{type_1: n, ..., type_7: n}` |
| `format_ratio` | JSONB | `{reel: %, static: %, carousel: %, text: %, video: %}` |
| `posting_schedule` | JSONB | `{monday: ["08:00", "12:00"], ...}` |
| `status` | TEXT | active / paused |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### `content_posts`

> **V3 renames `content_items` to `content_posts`** for clarity in the new Campaign → Ad Set → Post hierarchy. All V2 data migrated.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `adset_id` | UUID (FK → campaign_adsets) | |
| `campaign_id` | UUID (FK → campaigns) | |
| `organization_id` | UUID (FK) | |
| `content_type` | INTEGER | 1–7 |
| `content_type_name` | TEXT | |
| `objective` | TEXT | Inherited from campaign |
| `platform` | TEXT | |
| `format` | TEXT | |
| `placement_type` | TEXT | |
| `topic` | TEXT | |
| `hook` | TEXT | Selected hook |
| `hook_variations` | TEXT[] | 3 options |
| `body` | TEXT | |
| `cta` | TEXT | |
| `caption` | TEXT | |
| `hashtags` | TEXT[] | |
| `visual_brief` | TEXT | |
| `shot_suggestions` | TEXT | |
| `slide_content` | JSONB (nullable) | |
| `on_screen_text` | JSONB (nullable) | |
| `platform_variations` | JSONB (nullable) | |
| `scheduled_date` | DATE | |
| `scheduled_time` | TIME | |
| `generation_week` | INTEGER | |
| `ai_generated` | BOOLEAN | |
| `ai_model` | TEXT | |
| `ai_prompt_used` | TEXT | |
| `brand_voice_score` | DECIMAL (nullable) | |
| `brand_variables_used` | TEXT[] | |
| `status` | TEXT | Full ContentStatus enum |
| `assigned_to` | UUID (nullable) | |
| `approved_at` | TIMESTAMPTZ (nullable) | |
| `approved_by` | UUID (nullable) | |
| `review_comment` | TEXT (nullable) | |
| `rejection_reason` | TEXT (nullable) | |
| `target_url` | TEXT (nullable) | |
| `utm_parameters` | JSONB (nullable) | |
| `variation_group_id` | UUID (nullable) | |
| `is_primary_variation` | BOOLEAN | |
| `performance` | JSONB | |
| `winner_category` | TEXT (nullable) | |
| `is_winner` | BOOLEAN | |
| `recycled_from` | UUID (nullable) | |
| `published_at` | TIMESTAMPTZ (nullable) | |
| `platform_post_id` | TEXT (nullable) | |
| `post_url` | TEXT (nullable) | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Index:** `idx_content_posts_schedule_conflict` on `(organization_id, platform, scheduled_date, scheduled_time)` WHERE status NOT IN (`idea`, `rejected`, `archived`)

---

### `generation_batches`

> Retained from V2 with additions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `organization_id` | UUID (FK) | |
| `campaign_id` | UUID (FK → campaigns, nullable) | |
| `adset_id` | UUID (FK → campaign_adsets, nullable) | |
| `user_id` | UUID (FK) | Who triggered |
| `model_id` | TEXT | AI model used |
| `status` | TEXT | pending / processing / completed / failed / cancelled |
| `total_items` | INTEGER | |
| `completed_items` | INTEGER | |
| `failed_items` | INTEGER | |
| `uniqueness_log` | JSONB | Prevents duplicates within batch |
| `selected_brand_variables` | JSONB (nullable) | Override variable selection |
| `generate_scripts` | BOOLEAN | Whether to generate full scripts |
| `creative_direction` | TEXT (nullable) | User context for AI |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `completed_at` | TIMESTAMPTZ (nullable) | |

---

### `generation_queue`

> Retained from V2 unchanged.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `batch_id` | UUID (FK → generation_batches) | |
| `post_id` | UUID (FK → content_posts) | |
| `organization_id` | UUID (FK) | |
| `status` | TEXT | pending / processing / completed / failed |
| `attempt_count` | INTEGER | Max 3 retries |
| `error_message` | TEXT (nullable) | |
| `locked_at` | TIMESTAMPTZ (nullable) | Processing lock |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### `campaign_adjustments`

Stores all mid-campaign AI recommendations (approved and dismissed).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `campaign_id` | UUID (FK → campaigns) | |
| `adset_id` | UUID (FK → campaign_adsets) | |
| `organization_id` | UUID (FK) | |
| `trigger_condition` | TEXT | underperformance / fatigue / format / scheduling / objective_mismatch |
| `recommendation_text` | TEXT | Full recommendation shown to user |
| `current_ratio` | JSONB | Content type ratio before change |
| `proposed_ratio` | JSONB | Recommended new ratio |
| `affected_post_ids` | UUID[] | Which posts would change |
| `status` | TEXT | pending / approved / dismissed |
| `approved_at` | TIMESTAMPTZ (nullable) | |
| `dismissed_at` | TIMESTAMPTZ (nullable) | |
| `created_at` | TIMESTAMPTZ | |

---

### `winner_pool`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `post_id` | UUID (FK → content_posts) | |
| `campaign_id` | UUID (FK → campaigns) | |
| `organization_id` | UUID (FK) | |
| `winner_category` | TEXT | awareness / engagement / traffic / conversion / viral |
| `performance_snapshot` | JSONB | Metrics at time of flagging |
| `hook_pattern` | TEXT | Pattern classification of winning hook |
| `content_type` | INTEGER | 1–7 |
| `format` | TEXT | |
| `posting_time` | TIME | What time it was posted |
| `posting_day` | TEXT | Day of week |
| `flagged_at` | TIMESTAMPTZ | |
| `amplified_to_paid` | BOOLEAN | Whether pushed to Ads Engine |
| `paid_campaign_id` | UUID (nullable) | FK to paid campaign if amplified |

---

### `post_analytics`

Detailed analytics per published post. Updated by daily sync cron.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `post_id` | UUID (FK → content_posts) | |
| `organization_id` | UUID (FK) | |
| `platform` | TEXT | |
| `impressions` | INTEGER | |
| `reach` | INTEGER | |
| `likes` | INTEGER | |
| `comments` | INTEGER | |
| `shares` | INTEGER | |
| `saves` | INTEGER | |
| `clicks` | INTEGER | |
| `video_views` | INTEGER | |
| `engagement_rate` | DECIMAL | |
| `follower_change` | INTEGER | Net new followers attributed |
| `synced_at` | TIMESTAMPTZ | Last data pull |

---

### `brand_intelligence_reports`

Post-campaign AI reports that feed insights back to Brand Engine.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `campaign_id` | UUID (FK → campaigns) | |
| `organization_id` | UUID (FK) | |
| `top_pain_points` | TEXT[] | ICP pain points that drove most engagement |
| `top_messaging_angles` | TEXT[] | Messaging angles that resonated |
| `brand_voice_recommendations` | TEXT | AI narrative recommendations |
| `icp_refinement_suggestions` | TEXT | Suggested ICP updates |
| `content_type_performance` | JSONB | Per-type performance summary |
| `format_performance` | JSONB | Per-format performance summary |
| `next_campaign_recommendation` | JSONB | Objective, ratios, reasoning |
| `generated_at` | TIMESTAMPTZ | |

---

### `organizations` (content-related fields added in V3)

```
content_engine_status     ContentEngineStatus: not_started | in_progress | active
brand_voice_learned       JSONB — AI-learned vocabulary patterns
active_campaign_count     INTEGER — cached count (max 5 enforcement)
```

### Key Types

```typescript
type ContentStatus =
  | 'idea' | 'scripted' | 'pending_review' | 'revision_requested'
  | 'approved' | 'rejected'
  | 'filming' | 'filmed' | 'designing' | 'designed' | 'editing' | 'edited'
  | 'scheduled' | 'published' | 'failed' | 'archived';

type CampaignObjective =
  | 'awareness' | 'leads' | 'engagement' | 'authority'
  | 'sales' | 'upsell' | 'retention' | 'referrals'
  | 'pre_launch' | 'product_launch' | 'event_promotion' | 'offer_promotion'
  | 'recruitment' | 'partnership' | 'repositioning' | 'crisis_management'
  | 'nurture' | 'education';

type Aggressiveness = 'focused' | 'committed' | 'aggressive';

type SocialChannel = 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x';

type ContentFormat = 'reel' | 'static' | 'carousel' | 'text' | 'video' | 'long_video' | 'thread' | 'story';

type WinnerCategory = 'awareness' | 'engagement' | 'traffic' | 'conversion' | 'viral';

type AdjustmentTrigger = 'underperformance' | 'content_fatigue' | 'format_underperformance' | 'scheduling_gap' | 'objective_mismatch';

interface ContentTypeRatio {
  type_1: number; // percentage
  type_2: number;
  type_3: number;
  type_4: number;
  type_5: number;
  type_6: number;
  type_7: number;
}

interface PostPerformance {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
  engagement_rate: number;
  follower_change: number;
}
```

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| 090 | Create `campaigns` and `campaign_adsets` tables |
| 091 | Rename `content_items` → `content_posts`, add new V3 columns |
| 092 | Add `adset_id`, `campaign_id` to `content_posts` |
| 093 | Create `campaign_adjustments` table |
| 094 | Create `winner_pool` table |
| 095 | Create `brand_intelligence_reports` table |
| 096 | Update `generation_batches` — add `adset_id`, remove deprecated columns |
| 097 | Add `brand_voice_learned`, `content_engine_status`, `active_campaign_count` to `organizations` |

---

## 18. User Journey Maps

### Journey 1 — New User, First Campaign (Zero Audience)

```
Step 1: User enters Content Engine
        → AI detects brand_engine_status = completed, presence_engine_status = completed
        → AI presents sequence recommendation for new brand:
          "Based on your brand maturity and no existing audience, 
           I recommend starting with an Awareness campaign."
        → User accepts recommendation or picks their own objective

Step 2: Create Campaign
        → User names campaign (or accepts AI suggestion based on objective)
        → Selects start/end dates (default: today, +30 days)
        → Campaign created in draft status

Step 3: Configure Ad Sets
        → User selects which platforms to use
        → For each platform: selects aggressiveness tier
        → AI displays: content type ratio + post count + format split
        → User can adjust ratios or accept AI defaults
        → AI shows preview: "This will generate 22 posts for LinkedIn over 30 days:
          4 Type 5 Guides, 7 Type 6 Tactics, 6 Type 7 Micro, 3 Type 3 Strategic, 2 Type 4 Frameworks"

Step 4: Generate Content
        → User clicks "Generate All Posts"
        → System reads all Brand Engine variables
        → Generation queue processes batch
        → All posts land in review queue with status: scripted

Step 5: Review and Approve
        → User reviews each post — reads all 3 hook variations, selects best
        → Edits any copy that doesn't sound right
        → Approves posts individually or bulk-approves
        → AI calculates brand voice score per post

Step 6: Schedule
        → Approved posts automatically scheduled per posting_schedule in ad set
        → Calendar view shows all posts across all platforms
        → Conflicts flagged if any

Step 7: Launch Campaign
        → Campaign status changes from draft → active
        → Posts publish automatically on schedule
        → Performance tracking begins

Step 8: Mid-Campaign (Day 10)
        → AI checks engagement rate against baseline
        → If underperforming: adjustment recommendation surfaced
        → User reviews and approves/dismisses

Step 9: Campaign End
        → Post-campaign AI report auto-generated
        → Winners flagged in Winner Pool
        → Brand Intelligence Report updates Brand Engine
        → AI recommends next campaign
```

### Journey 2 — Returning User, Creating a Second Campaign

```
Step 1: User returns to Content Engine dashboard
        → First campaign performance summary shown
        → AI recommendation: "Your Awareness campaign grew your LinkedIn by 
           340 followers. Your Type 6 Tactics posts drove 60% of that. 
           Ready to launch an Authority campaign to convert this new audience?"

Step 2: User accepts recommendation or picks different objective

Step 3: Campaign creation follows same flow
        → AI pre-populates format ratio based on what worked in Campaign 1
        → AI adjusts content type weights toward what performed best

Step 4: Generation uses refined brand voice
        → AI applies learned vocabulary preferences from Campaign 1 edits
        → Posts generated feel more accurate from the start
        → User edits fewer posts than in Campaign 1

Step 5: Two campaigns running simultaneously
        → Dashboard shows both campaigns
        → Conflict detection prevents same-platform same-day overlap
```

### Journey 3 — User Reviews and Edits a Post

```
Step 1: User opens review queue
        → Sees all posts with status: scripted
        → Sorted by scheduled date

Step 2: User opens individual post
        → Sees: 3 hook variations, body copy, CTA, visual brief / shot suggestions
        → Sees: brand voice score (e.g. 87/100)
        → Sees: which brand variables were used

Step 3: User selects preferred hook
        → Clicks "Use this hook" on Hook Option 2

Step 4: User edits body copy
        → Removes word "leverage" (system logs this for brand voice learning)
        → Rewrites one paragraph in their own voice

Step 5: User approves
        → Status → approved
        → Scheduled for correct date/time automatically

Step 6: (After 10+ edits) AI surface notification
        → "I've noticed you consistently replace 'leverage' with 'use' 
           and remove the word 'synergy'. I've updated your brand voice 
           profile to avoid these words in future generation."
        → User confirms or reverts
```

### Journey 4 — Winner Identified, Campaign Adjustment Recommended

```
Step 1: Post published on Day 8 of campaign
        → 2 hours after publication: 3× average engagement rate
        → Viral Momentum Detection triggers
        → Alert: "This post is gaining momentum — consider a follow-up post today"

Step 2: AI flags post as Engagement Winner
        → Added to Winner Pool
        → Hook pattern logged: "Contrarian opening + numbered framework"

Step 3: Day 14: Mid-campaign check
        → AI detects: Type 6 Tactics posts averaging 5.8% engagement
        → Type 3 Strategic posts averaging 1.2% engagement
        → Adjustment recommendation surfaced:
          "Shift 4 remaining Type 3 posts to Type 6 Tactics reels. 
           Affects posts 18, 22, 25, 27."

Step 4: User reviews recommendation
        → Sees current vs proposed ratio
        → Sees which posts will change
        → Approves

Step 5: AI regenerates 4 posts as Type 6 Tactics reels
        → Replaces static posts with reel scripts
        → Re-schedules appropriately
        → Brand voice applied to new content
```

### Journey 5 — Exporting Design Briefs and Scripts for Production

```
Step 1: User selects Week 1 posts in campaign
        → Filters by: format = static / carousel (design needed)
        → Clicks "Export Design Brief"

Step 2: Design brief generated
        → One brief per visual post
        → Includes: platform + dimensions, text for each slide/image, 
          layout suggestion, brand colours, font guidance
        → Formatted as handover document for designer

Step 3: User selects Week 1 video posts
        → Filters by: format = reel / video
        → Clicks "Export Scripts"

Step 4: Script export generated
        → Teleprompter-formatted scripts for each video
        → Short sentences, line breaks at natural pauses
        → Cut markers for editor
        → On-screen text overlays timed
        → Shot notes for filming
        → What to wear / where to film / props (if specified in shot_suggestions)
```

---

## 19. API Routes

All routes under `app/api/content/`:

### Campaign Management

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/content/campaigns` | Create new campaign |
| GET | `/api/content/campaigns` | List all campaigns for org |
| GET | `/api/content/campaigns/[id]` | Get campaign with ad sets and post counts |
| PATCH | `/api/content/campaigns/[id]` | Update campaign (name, dates, status) |
| DELETE | `/api/content/campaigns/[id]` | Archive campaign |
| GET | `/api/content/campaigns/sequence-recommendation` | Get AI sequence recommendation for org |

### Ad Set Management

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/content/campaigns/[id]/adsets` | Create ad set for campaign |
| GET | `/api/content/campaigns/[id]/adsets` | List ad sets for campaign |
| PATCH | `/api/content/adsets/[id]` | Update ad set (aggressiveness, ratios, schedule) |
| POST | `/api/content/adsets/[id]/ratio` | Update content type ratio + recalculate post counts |

### Content Generation

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/content/generate/queue` | Enqueue batch generation for ad set |
| GET | `/api/content/generate/queue/status` | Poll batch status |
| POST | `/api/content/generate/queue/process` | Cron: process next item in queue |
| POST | `/api/content/generate/single` | Generate single post |

### Post Management

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/content/posts` | List posts (filterable by campaign, adset, status, platform) |
| GET | `/api/content/posts/[id]` | Get single post with all fields |
| PATCH | `/api/content/posts/[id]` | Update post content |
| POST | `/api/content/posts/[id]/review` | Approve / reject / request revision |
| POST | `/api/content/posts/bulk-action` | Bulk approve / reject / reschedule |
| POST | `/api/content/posts/[id]/regenerate` | Regenerate single post |
| POST | `/api/content/posts/[id]/recycle` | Flag as recycling candidate and generate refreshed version |

### Scheduling & Publishing

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/content/publish` | Publish post immediately |
| POST | `/api/content/schedule` | Schedule post for specific time |
| POST | `/api/content/schedule/bulk` | Bulk schedule |
| GET | `/api/content/schedule/conflicts` | Check for scheduling conflicts |

### Analytics

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/content/analytics` | Campaign analytics (filterable) |
| POST | `/api/content/analytics/sync` | Cron: sync platform analytics |
| GET | `/api/content/winner-pool` | Get all winners for org |
| POST | `/api/content/winner-pool/[id]/flag` | Manually flag as winner |

### Exports

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/content/export/design-briefs` | Export design briefs for selection |
| GET | `/api/content/export/scripts` | Export video scripts for selection |
| GET | `/api/content/export/calendar` | Export campaign calendar as PDF/HTML |
| GET | `/api/content/export/report/[campaignId]` | Export post-campaign AI report |

### Adjustments

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/content/adjustments/[campaignId]` | Get pending adjustment recommendations |
| POST | `/api/content/adjustments/[id]/approve` | Approve adjustment and apply |
| POST | `/api/content/adjustments/[id]/dismiss` | Dismiss adjustment recommendation |

---

## 20. Key Components

All under `components/content/`:

| Component | Purpose |
|-----------|---------|
| `campaign-manager.tsx` | Campaign list view — create, manage, status, quick stats |
| `campaign-wizard.tsx` | Multi-step campaign creation flow |
| `adset-configurator.tsx` | Per-channel aggressiveness, ratio, schedule settings |
| `ratio-adjuster.tsx` | Visual slider-based content type ratio adjustment |
| `content-type-explainer.tsx` | 7 content types explained with examples (shown during campaign setup) |
| `generation-launcher.tsx` | Triggers batch generation with progress indicator |
| `generation-batch-tracker.tsx` | Real-time batch progress display (retained from V2) |
| `post-review-queue.tsx` | Review queue with filter by campaign / platform / status |
| `post-editor.tsx` | Full post editing view — hooks, body, CTA, visual brief, shot notes |
| `hook-selector.tsx` | Shows 3 hook variations with select button |
| `brand-voice-score.tsx` | Score badge with tooltip explaining factors |
| `calendar-view.tsx` | Visual calendar with post tiles, status colours, engagement overlays |
| `table-view.tsx` | Meta Ads Manager-style table: campaign → ad set → post drill-down |
| `analytics-dashboard.tsx` | Campaign performance with charts and heatmaps |
| `winner-pool.tsx` | Winner pool library with categorisation and amplification options |
| `adjustment-banner.tsx` | Mid-campaign recommendation banner with approve/dismiss |
| `campaign-report.tsx` | Post-campaign AI report display |
| `design-brief-exporter.tsx` | Design brief compile and download |
| `script-exporter.tsx` | Teleprompter script compile and download |
| `sequence-recommendation-card.tsx` | AI campaign sequence recommendation with accept/customise |
| `conflict-alert.tsx` | Scheduling or campaign conflict alert with resolution options |

---

## 21. Architecture & Design Decisions

### Campaign → Ad Set → Post is the Core Mental Model

Every interaction in the Content Engine starts from campaign context. There is no "free floating post" concept in V3. Every post belongs to an ad set which belongs to a campaign. This mirrors how Meta Ads Manager works — and it makes the user think strategically, not just tactically.

> V2 exception retained: Users can still create a standalone "single post" outside of a campaign for ad-hoc needs. This is accessible but not the primary flow.

### Content Type Ratios Are Starting Points, Not Rules

The AI suggests ratios based on objective. The user adjusts them. The ratios update based on what actually performs. The system never tells the user they are wrong — it presents data and recommendations, and the user decides.

### No Automatic Changes

Following the same principle as the Brand Engine lock/unlock model:
- Mid-campaign adjustments require explicit user approval
- Brand voice learning updates require user confirmation
- Winner pool entries can be manually dismissed
- The system never changes a scheduled post without permission

### V2 Infrastructure Preserved

The following V2 systems are retained in V3 with no rework:
- Queue processing system (queue-service.ts, queue-config.ts)
- Platform publishing adapters (all 6 platforms)
- UTM generation (generate-utm.ts)
- Approval workflow routes
- Analytics sync cron
- Content status lifecycle

### Platform-Native Variations

Every post can have platform-specific adaptations stored in `platform_variations`. The base content is written once — the AI generates platform-native versions automatically:
- LinkedIn: Professional, longer text, no emoji-per-line, industry context
- Instagram: Visual-first, shorter caption, emoji-friendly, hashtag-rich
- Facebook: Conversational, community-focused, question hooks
- TikTok: Hook in first 1 second, casual, entertainment-meets-education
- X/Twitter: Punchy, thread-formatted longer takes, retweet-worthy
- YouTube: SEO-optimised titles, chapter markers, description with links

### Brand Engine Variables Feed Everything

No manual configuration in the Content Engine setup. Every variable the system needs is output by the Brand Engine. This is a fundamental architectural principle — the content engine is a consumer of Brand Engine data, not a data-entry interface.

---

## 22. File Reference

### Configuration

| File | Content |
|------|---------|
| `config/campaign-objectives.ts` | 18 objectives with content type ratios, metric definitions, sequence logic |
| `config/content-types.ts` | 7 content type definitions with examples, best formats, spectrum position |
| `config/platform-defaults.ts` | Default format ratios, posting schedules, limits per platform |
| `lib/content-engine/brand-variable-categories.ts` | 8 categories, variable display names, strategic selection per objective × type |

### Services

| File | Purpose |
|------|---------|
| `lib/content-engine/queue-service.ts` | Queue processing logic (retained from V2) |
| `lib/content-engine/queue-config.ts` | Queue settings (retained from V2) |
| `lib/content-engine/generate-content.ts` | Core generation: reads brand vars, builds prompt, calls AI |
| `lib/content-engine/ratio-calculator.ts` | Calculates post counts from aggressiveness + ratio + duration |
| `lib/content-engine/adjustment-engine.ts` | Mid-campaign performance monitoring and recommendation logic |
| `lib/content-engine/winner-detector.ts` | Winner threshold calculations and pool management |
| `lib/content-engine/recycling-engine.ts` | Identifies recycling candidates and generates refreshed versions |
| `lib/content-engine/brand-intelligence.ts` | Post-campaign report generation |
| `lib/content-engine/brand-voice-learner.ts` | Tracks user edits and updates learned voice profile |
| `lib/utm/generate-utm.ts` | UTM generation (retained from V2) |
| `lib/social/platforms/` | Platform adapters (all retained from V2) |
| `lib/social/publish.ts` | Publish orchestration (retained from V2) |

### Types

| File | Types |
|------|-------|
| `types/content.ts` | ContentStatus, CampaignObjective, Aggressiveness, SocialChannel, ContentFormat, WinnerCategory, ContentTypeRatio, PostPerformance |
| `types/database.ts` | campaigns, campaign_adsets, content_posts, generation_batches, generation_queue, campaign_adjustments, winner_pool, post_analytics, brand_intelligence_reports |

---

## 23. V3 Migration Notes

### What Changes From V2

| V2 | V3 |
|----|-----|
| `content_calendars` table | → `campaigns` table (new hierarchy) |
| `content_items` table | → `content_posts` table (renamed + new columns) |
| `funnel_stage` + `storybrand_stage` columns | → `content_type` (1–7) + `objective` columns |
| `angle_id` / `content_angles` table | → Removed. Content type + objective combination replaces angles. |
| No campaign hierarchy | → Campaign → Ad Set → Post hierarchy |
| No aggressiveness tiers | → Aggressiveness per ad set |
| No mid-campaign adjustments | → `campaign_adjustments` table + adjustment engine |
| No winner pool | → `winner_pool` table + winner detector |
| No content recycling | → Recycling engine + `recycled_from` field |
| No brand intelligence reports | → `brand_intelligence_reports` table |
| No brand voice learning | → `brand_voice_learned` on organizations |

### What Is Retained From V2 Unchanged

- Queue processing infrastructure (generation_batches, generation_queue, queue-service.ts)
- Platform publishing adapters (all 6 platforms)
- Approval workflow (review API, permissions, notifications)
- UTM generation
- Analytics sync cron
- Scheduled publishing cron
- Content status lifecycle (expanded with additional statuses in V3)
- Brand variable injection architecture
- A/B variation grouping

### Data Migration

| Migration | Action |
|-----------|--------|
| 090 | Create `campaigns` — backfill one campaign per existing `content_calendar` |
| 091 | Rename `content_items` → `content_posts` |
| 092 | Add `adset_id`, `campaign_id` to `content_posts` — backfill from `calendar_id` mapping |
| 093–097 | New tables only — no backfill needed |

---

*End of CONTENT-ENGINE-MASTER.md*
*Version: 3.0 — Full V3 Redesign*
*Replaces: content_Engine.md (V2) and content_engine_v3.md (spec)*
*Built on: BRAND-ENGINE-MASTER.md V3 (123 variables)*
*Aligned with: PRESENCE-ENGINE-MASTER.md V1*
