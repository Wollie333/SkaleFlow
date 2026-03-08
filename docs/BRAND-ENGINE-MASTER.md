# SkaleFlow Brand Engine — Master Reference

> Complete documentation of the Brand Engine system: phases, variables, database schema, archetypes, expert agents, and architecture.

---

## Table of Contents

1. [Overview](#1-overview)
2. [The 10 Brand Engine Phases](#2-the-10-brand-engine-phases)
3. [Complete Variable Reference (123)](#3-complete-variable-reference)
4. [Variable Categories & Content Generation](#4-variable-categories--content-generation)
5. [The 12 Brand Archetypes](#5-the-12-brand-archetypes)
6. [Database Schema](#6-database-schema)
7. [Expert AI Agents](#7-expert-ai-agents)
8. [API Routes](#8-api-routes)
9. [Key Components](#9-key-components)
10. [Playbook System](#10-playbook-system)
11. [Architecture & Design Decisions](#11-architecture--design-decisions)
12. [File Reference](#12-file-reference)
13. [V3 Changelog](#v3-changelog)

---

## 1. Overview

The Brand Engine is a **10-phase, AI-guided brand strategy system** that takes organizations from vague identity to clear, actionable brand foundation in ~2-3 hours of guided conversation.

**Key stats:**

| Metric | Value |
|--------|-------|
| Phases | 10 (consolidated from 18 via Migration 025) |
| Total output variables | 123 |
| Variable categories | 8 |
| Expert AI agents | 10 (one per phase) |
| Brand archetypes | 12 |
| Questions across all phases | ~122 |

**Frameworks used:** StoryBrand (Donald Miller), Key Person of Influence (Daniel Priestley), Grand Slam Offer (Alex Hormozi), Obviously Awesome (April Dunford), ASK Method (Ryan Levesque), Purple Cow + Tribes (Seth Godin), The Futur (Chris Do), RPM (Tony Robbins), DotCom Secrets (Russell Brunson).

---

## 2. The 10 Brand Engine Phases

> **V3 Phase Order (sort_order):** Phases are presented in a new strategic sequence. The `phase_number` is unchanged, but `sort_order` determines user-facing order:
>
> | sort_order | Phase | phase_number |
> |-----------|-------|-------------|
> | 1 | Market Enemy | 3 |
> | 2 | Ideal Customer | 2 |
> | 3 | Offer & Lead Magnet | 4 |
> | 4 | Brand Foundation | 1 |
> | 5 | Market Positioning | 5 |
> | 6 | Brand Voice & Messaging | 6 |
> | 7 | Visual Identity | 7 |
> | 8 | Design System | 8 |
> | 9 | Website Strategy & Copy | 9 |
> | 10 | Growth Engine | 10 |

### Phase 1: Brand Foundation

| Field | Value |
|-------|-------|
| Expert Agent | Tony Robbins (Peak Performance Strategist) |
| Estimated Time | 25 minutes |
| Questions | 8 |
| Output Variables | 10 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Why does this business exist beyond making money? Who does it serve and how? |
| 1 | What future are you building? Where do you want this brand to be in 5-10 years? |
| 2 | What values guide your decisions? Give me 3-5 values with a definition and behavioral example for each. |
| 3 | What characteristics should the brand embody? (Personality traits, communication style, how the brand "shows up") |
| 4 | Let's identify your brand archetype. Based on everything we've discussed, I'll suggest the best-fit archetypes. |
| 5 | What will this brand NEVER do? Give me 3-5 non-negotiables with the reasoning behind each. |
| 6 | How does your personal faith, spiritual conviction, or guiding philosophy show up in your brand? |
| 7 | What's the brand's origin story? How did this business come to be, and what's the founder's personal journey? |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `brand_purpose` | The emotional WHY the business exists | Q0 |
| `brand_mission` | The functional mission statement | Q0 |
| `brand_vision` | 5-10 year aspiration | Q1 |
| `brand_values` | 3-5 core values with definitions and behavioral examples | Q2 |
| `brand_characteristics` | Personality traits and how the brand shows up | Q3 |
| `brand_archetype` | Selected archetype from the 12 options | Q4 |
| `brand_non_negotiables` | 3-5 things the brand will never do with reasoning | Q5 |
| `brand_faith_positioning` | Faith/philosophy positioning level | Q6 |
| `brand_origin_story` | Business origin narrative | Q7 |
| `founder_story` | Personal journey of the founder | Q7 |

---

### Phase 2: Ideal Customer Profile

| Field | Value |
|-------|-------|
| Expert Agent | Ryan Levesque (Customer Intelligence Expert) |
| Estimated Time | 25 minutes |
| Questions | 9 |
| Output Variables | 12 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Who is the decision-maker? (Role, company size, industry, revenue, geography, team size) |
| 1 | What frustrates them most? Go deep — surface pain, deeper pain, and root cause. |
| 2 | What do they desire? Both the stated desires AND the unstated/real desires beneath. |
| 3 | What do they tell themselves internally? Capture their self-talk, doubts, hopes, emotional triggers, and breaking points. |
| 4 | What are their beliefs, worldview, and identity? (Psychographics — what they believe, aspire to, value, how they see themselves) |
| 5 | What objections stop them, and what triggers them to finally act? |
| 6 | Map their customer journey — from awareness through advocacy, with touchpoints and emotions at each stage. |
| 7 | Describe the RIGHT client — the person who gets the best results and is a joy to work with. |
| 8 | Describe the WRONG client — the red flags that signal someone is not a fit. |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `icp_demographics` | Role, company, industry, revenue, geography, team size | Q0 |
| `icp_pains` | Surface, deeper, and root cause pain points | Q1 |
| `icp_desires` | Both stated and unstated desires | Q2 |
| `icp_emotional_triggers` | What makes them feel something, breaking points | Q3 |
| `icp_internal_dialogue` | What they say to themselves, doubts, hopes | Q3 |
| `icp_psychographics` | Beliefs, worldview, identity, aspirations | Q4 |
| `icp_objections` | Common objections that stop purchase | Q5 |
| `icp_buying_triggers` | What finally makes them act | Q5 |
| `customer_journey_stages` | Awareness → Consideration → Conversion → Advocacy with touchpoints and emotions | Q6 |
| `icp_right_client_traits` | Traits of ideal-fit clients | Q7 |
| `icp_values_alignment` | Shared values between brand and ICP | Q7 |
| `icp_wrong_client_flags` | Red flags for wrong-fit clients | Q8 |

---

### Phase 3: Market Enemy

| Field | Value |
|-------|-------|
| Expert Agent | Seth Godin (Marketing Philosopher) |
| Estimated Time | 10 minutes |
| Questions | 4 |
| Output Variables | 6 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | What keeps creating problems for your customers? What is the real cost — emotionally, financially, in time, and in missed opportunity? |
| 1 | What advice or approach has failed them? What does it promise vs. what it actually delivers, and why do people keep believing it? |
| 2 | What tactics, hacks, or shortcuts does your market keep chasing? |
| 3 | Name the enemy. Give it a memorable, brandable name — and define its type (mindset, system, approach, or myth). |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `enemy_name` | Memorable, brandable name for the enemy | Q3 |
| `enemy_type` | Classification: mindset, system, approach, or myth | Q3 |
| `enemy_description` | What keeps creating problems for the customer | Q0 |
| `enemy_cost` | Emotional, financial, time, and opportunity costs | Q0 |
| `enemy_false_promises` | What the failed approach promises vs. delivers | Q1 |
| `icp_tactic_trap` | Shiny objects the market keeps chasing | Q2 |

> **Important:** The enemy is NEVER a specific competitor — it's a way of thinking, a broken system, or a false belief.

---

### Phase 4: Offer & Lead Magnet

| Field | Value |
|-------|-------|
| Expert Agent | Alex Hormozi (Offer Architect) |
| Estimated Time | 30 minutes |
| Questions | 11 |
| Output Variables | 19 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | What core problem does your offer solve? |
| 1 | What specific outcome are you responsible for delivering? |
| 2 | What is included in the offer, and what is explicitly excluded? |
| 3 | What is the transformation? Name the offer and create a tagline. |
| 4 | What type of lead magnet best fits? (Checklist, guide, quiz, template, mini-course) What does it promise? |
| 5 | Outline the lead magnet content — sections, key takeaways, and how it connects to the main offer. |
| 6 | What is the pricing structure? (Tier name, displayed price, billing frequency) |
| 7 | What are the top 3 objections prospects raise, and what is your ideal response to each? |
| 8 | What must be true about a prospect before they can get results from your offer? |
| 9 | Do you offer implementation services — done-for-you, done-with-you, or community support? |
| 10 | What complementary tools, products, or affiliate offerings do you recommend alongside your core offer? |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `offer_problem` | Core problem solved | Q0 |
| `offer_outcome` | Specific outcome delivered | Q1 |
| `offer_inclusions` | What's included in the offer | Q2 |
| `offer_exclusions` | What's explicitly NOT included | Q2 |
| `offer_name` | Name of the offer | Q3 |
| `offer_tagline` | Memorable tagline | Q3 |
| `offer_transformation_before` | Before state | Q3 |
| `offer_transformation_after` | After state | Q3 |
| `lead_magnet_type` | Checklist, guide, quiz, template, mini-course, etc. | Q4 |
| `lead_magnet_title` | Title of the lead magnet | Q4 |
| `lead_magnet_promise` | What the lead magnet promises | Q4 |
| `lead_magnet_content_outline` | Sections and key takeaways | Q5 |
| `offer_price_display` | Displayed price (e.g., "R5,000/month") | Q6 |
| `offer_billing_frequency` | once-off, monthly, quarterly, or annual | Q6 |
| `offer_tier` | Tier name (e.g., "Premium", "Starter") | Q6 |
| `offer_objections` | Structured list of {objection, response} pairs | Q7 |
| `offer_qualification_criteria` | Prerequisites for client success | Q8 |
| `offer_implementation_services` | Hands-on service model (DFY/DWY/community) | Q9 |
| `offer_affiliate_tools` | Recommended complementary tools | Q10 |

---

### Phase 5: Market Positioning

| Field | Value |
|-------|-------|
| Expert Agent | April Dunford (Positioning Strategist) |
| Estimated Time | 20 minutes |
| Questions | 5 |
| Output Variables | 7 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Why does this offer exist? Complete: "For [ICP] who [need], [Brand] is the [category] that [differentiation] because [proof]." |
| 1 | Why do alternatives fail? What do competitors, DIY, and doing nothing get wrong? |
| 2 | What is your unique mechanism — the thing you do that no one else does? |
| 3 | Let's extract your category through conversation. (7-exchange extraction flow that identifies the category the brand owns or creates, then refines a one-liner) |
| 4 | Map the competitive landscape — who else serves this ICP, what they get right/miss, and your strategic advantage. |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `positioning_statement` | "For X who Y, we are Z that..." statement | Q0 |
| `differentiation_statement` | Unique mechanism and why it matters | Q2 |
| `category` | Market category owned or created | Q3 |
| `category_name` | Named category the brand owns | Q3 |
| `category_claim` | Why the brand owns this category | Q3 |
| `one_liner` | Dinner-party answer to "What do you do?" | Q3 |
| `competitive_landscape` | Competitive alternatives, strengths/weaknesses, strategic advantage | Q4 |

---

### Phase 6: Brand Voice & Messaging

| Field | Value |
|-------|-------|
| Expert Agents | Kay Putnam (Q0-Q2) + Donald Miller (Q3-Q4) |
| Estimated Time | 20 minutes |
| Questions | 5 |
| Output Variables | 7 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | What words and phrases should the brand ALWAYS use? Include context for when and how to use each. |
| 1 | What words should the brand NEVER use? Include WHY each is avoided and what message it sends. |
| 2 | What tone describes the brand, and which industry terms do you embrace or reject? |
| 3 | What is the ONE core message? If people remember one thing about this brand, what is it? |
| 4 | What 3-4 supporting message pillars reinforce the core message? Each needs statement, evidence, ICP pain connection, and content themes. |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `vocabulary_preferred` | Words and phrases to always use with context | Q0 |
| `vocabulary_avoided` | Words to never use with WHY and alternatives | Q1 |
| `tone_descriptors` | Default tone and how it shifts per context | Q2 |
| `industry_terms_embrace` | Jargon that signals expertise | Q2 |
| `industry_terms_reject` | Jargon that alienates | Q2 |
| `message_core` | The single thing people remember | Q3 |
| `message_pillars` | 3-4 pillars with statement, evidence, ICP connection, content themes | Q4 |

---

### Phase 7: Visual Identity

| Field | Value |
|-------|-------|
| Expert Agent | Chris Do (Visual Brand Strategist) |
| Estimated Time | 20 minutes |
| Questions | 5 |
| Output Variables | 15 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Upload your brand assets — primary logo, logo variants (dark/light/icon), mood board images, and patterns. |
| 1 | Define your brand colors using the color palette picker. Generate AI suggestions or pick your own. |
| 2 | Set your brand typography — choose fonts for headings, body text, and accents. |
| 3 | What visual mood and imagery direction fits your brand? (Photography style, illustrations, icons) |
| 4 | Define brand elements (icons, shapes, graphic devices), visual guidelines (logo spacing, do's & don'ts), and brand inspirations. |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `brand_logo_primary` | Primary logo file | Q0 |
| `brand_logo_dark` | Logo for dark backgrounds | Q0 |
| `brand_logo_light` | Logo for light backgrounds | Q0 |
| `brand_logo_icon` | Logo icon/favicon | Q0 |
| `brand_mood_board` | Mood board images array | Q0 |
| `brand_patterns` | Patterns and textures array | Q0 |
| `brand_color_palette` | `{name, primary, dark_base, accent, light, neutral}` | Q1 |
| `brand_typography` | `{heading_font, heading_weight, body_font, body_weight, accent_font, accent_weight}` | Q2 |
| `visual_mood` | Visual mood (e.g., Premium, Bold, Minimal, Warm) | Q3 |
| `imagery_direction` | Photography style, illustrations, icons | Q3 |
| `brand_tagline` | Short memorable phrase capturing brand essence | Q3 |
| `brand_elements` | Graphic devices, shapes, icons | Q4 |
| `visual_inspirations` | Reference brands and what to draw from each | Q4 |
| `brand_visual_guidelines` | Logo usage rules, color hierarchy, spacing, restrictions | Q4 |
| `brand_visual_assets_summary` | Summary of all visual assets uploaded | Q4 |

**Interactive UI tools:** Coolors-style color picker (5 swatches, lock/unlock, AI generate, randomize), Google Fonts typography picker (~40 fonts with live preview), drag-drop logo uploader with AI generation (DALL-E 3).

---

### Phase 8: Design System

| Field | Value |
|-------|-------|
| Expert Agent | Chris Do (Visual Brand Strategist — Systems variant) |
| Estimated Time | 15 minutes |
| Questions | 3 |
| Output Variables | 4 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Let's expand your Phase 7 color palette into a full color system with roles, tints, and usage rules. |
| 1 | Let's define your typography scale — sizes, weights, and line heights for headings, body, and UI elements. |
| 2 | Define component design patterns and any animation/motion preferences. |

**Output Variables:**

| Variable Key | Description | Data Shape |
|-------------|-------------|------------|
| `design_system_colors` | Full color system | `{primary, dark_base, accent, light, neutral}` each with `{hex, rgb, role}` |
| `design_system_typography` | Typography scale | `{display, heading, subheading, body, small, caption}` each with `{font, size, weight, line_height}` |
| `design_system_components` | Component specs | Button styles, card patterns, form elements, spacing system |
| `design_system_animations` | Motion specs | Transitions, scroll animations, loading states |

> **Critical behavior:** Unlike other phases, the Phase 8 agent **proposes the full system upfront** based on all prior phases — it doesn't ask the user to build it. User approves/adjusts.

---

### Phase 9: Website Strategy & Copy

| Field | Value |
|-------|-------|
| Expert Agent | Russell Brunson (Funnel Architect) |
| Estimated Time | 45 minutes |
| Questions | 11 |
| Output Variables | 32 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | What is the primary role of the website? (Generate leads, sell directly, build authority) |
| 1 | What are the primary and secondary conversion actions? |
| 2 | How will people find this site, what pages do you need, and what is the user journey? |
| 3 | What content themes, pillars, and beliefs do you need to teach your market? |
| 4 | Let's write the homepage — hero section, problem statement, solution, and who you help. |
| 5 | Continue the homepage — proof, why choose us, and final CTA. |
| 6 | Sales page opening — hero, story/pain narrative, and turning point where you name the enemy. |
| 7 | Sales page close — value stack, transformation, proof, FAQ, and final CTA. |
| 8 | Supporting pages — about page, problems page, and results page. |
| 9 | Conversion pages — application/booking page, form fields, CTA, and reassurance copy. |
| 10 | Lead magnet page — headline, supporting copy, and CTA. |

**Output Variables:**

| Variable Key | Description |
|-------------|-------------|
| `website_role` | Primary role (leads, direct sales, authority, hybrid) |
| `primary_conversion` | Main CTA (book call, apply, download, purchase) |
| `secondary_conversion` | Supporting action (newsletter, follow, lead magnet) |
| `traffic_sources` | How people find/will find the site |
| `website_sitemap` | List of pages needed |
| `user_journey` | Path from landing to conversion |
| `content_themes` | Topics with authority |
| `content_pillars` | Key themes reinforcing core message |
| `beliefs_to_teach` | Beliefs market needs to shift before buying |
| `homepage_hero` | Headline, subheadline, hook, CTA |
| `homepage_problem` | Problem section copy |
| `homepage_solution` | Solution section copy |
| `homepage_who_we_help` | Who we help section |
| `homepage_proof` | Social proof section |
| `homepage_why_us` | Why choose us section |
| `homepage_final_cta` | Final call-to-action |
| `sales_page_hero` | Sales page headline, subheadline, hook |
| `sales_page_story_pain` | Pain narrative |
| `sales_page_turn_enemy` | Enemy naming / StoryBrand turning point |
| `sales_page_value_stack` | Value stack breakdown |
| `sales_page_transformation` | Before/after transformation |
| `sales_page_proof` | Proof section |
| `sales_page_faq` | FAQ addressing objections |
| `sales_page_final_cta` | Sales page final CTA |
| `about_page_copy` | About page (founder as guide, origin story) |
| `problems_page_copy` | Problems page (ICP problems from Phase 2) |
| `results_page_copy` | Results page (proof-focused) |
| `apply_page_copy` | Application/booking page copy |
| `form_fields` | Form fields list with labels |
| `form_cta` | Form submission CTA |
| `reassurance` | Reassurance copy (addresses purchase anxiety) |
| `lead_page_headline` | Lead magnet page headline |
| `lead_page_copy` | Lead magnet page supporting copy |
| `lead_page_cta` | Lead magnet page CTA |

---

### Phase 10: Growth Engine

| Field | Value |
|-------|-------|
| Expert Agent | Daniel Priestley (Authority & Growth Strategist) |
| Estimated Time | 30 minutes |
| Questions | 6 |
| Output Variables | 9 |

**Questions:**

| Q# | Question |
|----|----------|
| 0 | Perfect your pitch — refine your one-liner (from Phase 5), elevator pitch, and signature talk title. |
| 1 | What will you publish, where, and how often? (Book, podcast, newsletter, blog, social) |
| 2 | Map your product ecosystem — from free lead magnet through core offer to premium tier. |
| 3 | Build your profile and PR plan — media targets, speaking opportunities, awards, thought leadership. |
| 4 | Define strategic partnerships — who to partner with, why, and how. |
| 5 | Based on EVERYTHING we've built, what is the best conversion model for THIS specific business? |

**Output Variables:**

| Variable Key | Description | Mapped From |
|-------------|-------------|-------------|
| `authority_pitch` | One-liner, 60-second elevator pitch, signature talk title | Q0 |
| `authority_publish_plan` | Publishing strategy with frequency | Q1 |
| `authority_product_ecosystem` | Product/service tiers from free to premium | Q2 |
| `authority_profile_plan` | Media targets, speaking, awards, thought leadership | Q3 |
| `authority_partnerships` | Strategic partners, collaboration models, outcomes | Q4 |
| `conversion_business_type` | Classification (course, consulting, SaaS, product) | Q5 |
| `conversion_strategy` | Approach (VSL, application funnel, community, event, direct, hybrid) | Q5 |
| `conversion_funnel` | Specific path from prospect to customer | Q5 |
| `conversion_metrics` | Key metrics to track at each funnel stage | Q5 |

---

## 3. Complete Variable Reference

### All Variables by Phase (123)

#### Phase 1 — Brand Foundation (10 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 1 | `brand_purpose` | Brand Purpose |
| 2 | `brand_mission` | Brand Mission |
| 3 | `brand_vision` | Brand Vision |
| 4 | `brand_values` | Brand Values |
| 5 | `brand_characteristics` | Brand Characteristics |
| 6 | `brand_archetype` | Brand Archetype |
| 7 | `brand_non_negotiables` | Brand Non-Negotiables |
| 8 | `brand_faith_positioning` | Faith/Philosophy Positioning |
| 9 | `brand_origin_story` | Origin Story |
| 10 | `founder_story` | Founder Story |

#### Phase 2 — Ideal Customer (12 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 11 | `icp_demographics` | ICP Demographics |
| 12 | `icp_pains` | ICP Pain Points |
| 13 | `icp_desires` | ICP Desires |
| 14 | `icp_emotional_triggers` | Emotional Triggers |
| 15 | `icp_internal_dialogue` | Internal Dialogue |
| 16 | `icp_psychographics` | Psychographics |
| 17 | `icp_objections` | Common Objections |
| 18 | `icp_buying_triggers` | Buying Triggers |
| 19 | `customer_journey_stages` | Customer Journey |
| 20 | `icp_right_client_traits` | Right Client Traits |
| 21 | `icp_values_alignment` | Values Alignment |
| 22 | `icp_wrong_client_flags` | Wrong Client Red Flags |

#### Phase 3 — Market Enemy (6 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 23 | `enemy_name` | Enemy Name |
| 24 | `enemy_type` | Enemy Type |
| 25 | `enemy_description` | Enemy Description |
| 26 | `enemy_cost` | Cost of the Enemy |
| 27 | `enemy_false_promises` | False Promises |
| 28 | `icp_tactic_trap` | Tactic Trap |

#### Phase 4 — Offer & Lead Magnet (19 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 29 | `offer_problem` | Problem Solved |
| 30 | `offer_outcome` | Outcome Delivered |
| 31 | `offer_inclusions` | What's Included |
| 32 | `offer_exclusions` | What's Excluded |
| 33 | `offer_name` | Offer Name |
| 34 | `offer_tagline` | Offer Tagline |
| 35 | `offer_transformation_before` | Before State |
| 36 | `offer_transformation_after` | After State |
| 37 | `lead_magnet_type` | Lead Magnet Type |
| 38 | `lead_magnet_title` | Lead Magnet Title |
| 39 | `lead_magnet_promise` | Lead Magnet Promise |
| 40 | `lead_magnet_content_outline` | Lead Magnet Outline |
| 41 | `offer_price_display` | Price Display |
| 42 | `offer_billing_frequency` | Billing Frequency |
| 43 | `offer_tier` | Offer Tier |
| 44 | `offer_objections` | Objection Handling |
| 45 | `offer_qualification_criteria` | Qualification Criteria |
| 46 | `offer_implementation_services` | Implementation Services |
| 47 | `offer_affiliate_tools` | Affiliate Tools |

#### Phase 5 — Market Positioning (7 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 48 | `positioning_statement` | Positioning Statement |
| 49 | `differentiation_statement` | Differentiation Statement |
| 50 | `category` | Category |
| 51 | `category_name` | Category Name |
| 52 | `category_claim` | Category Claim |
| 53 | `one_liner` | One-Liner |
| 54 | `competitive_landscape` | Competitive Landscape |

#### Phase 6 — Brand Voice & Messaging (7 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 55 | `vocabulary_preferred` | Preferred Vocabulary |
| 56 | `vocabulary_avoided` | Avoided Vocabulary |
| 57 | `tone_descriptors` | Tone Descriptors |
| 58 | `industry_terms_embrace` | Industry Terms (Embrace) |
| 59 | `industry_terms_reject` | Industry Terms (Reject) |
| 60 | `message_core` | Core Message |
| 61 | `message_pillars` | Message Pillars |

#### Phase 7 — Visual Identity (15 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 62 | `brand_logo_primary` | Primary Logo |
| 63 | `brand_logo_dark` | Logo (Dark BG) |
| 64 | `brand_logo_light` | Logo (Light BG) |
| 65 | `brand_logo_icon` | Logo Icon |
| 66 | `brand_mood_board` | Mood Board |
| 67 | `brand_patterns` | Patterns |
| 68 | `brand_color_palette` | Color Palette |
| 69 | `brand_typography` | Typography |
| 70 | `visual_mood` | Visual Mood |
| 71 | `imagery_direction` | Imagery Direction |
| 72 | `brand_tagline` | Brand Tagline |
| 73 | `brand_elements` | Brand Elements |
| 74 | `visual_inspirations` | Visual Inspirations |
| 75 | `brand_visual_guidelines` | Visual Guidelines |
| 76 | `brand_visual_assets_summary` | Visual Assets Summary |

#### Phase 8 — Design System (4 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 77 | `design_system_colors` | Design System Colors |
| 78 | `design_system_typography` | Design System Typography |
| 79 | `design_system_components` | Design System Components |
| 80 | `design_system_animations` | Design System Animations |

#### Phase 9 — Website Strategy & Copy (32 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 81 | `website_role` | Website Role |
| 82 | `primary_conversion` | Primary Conversion |
| 83 | `secondary_conversion` | Secondary Conversion |
| 84 | `traffic_sources` | Traffic Sources |
| 85 | `website_sitemap` | Website Sitemap |
| 86 | `user_journey` | User Journey |
| 87 | `content_themes` | Content Themes |
| 88 | `content_pillars` | Content Pillars |
| 89 | `beliefs_to_teach` | Beliefs to Teach |
| 90 | `homepage_hero` | Homepage Hero |
| 91 | `homepage_problem` | Homepage Problem |
| 92 | `homepage_solution` | Homepage Solution |
| 93 | `homepage_who_we_help` | Homepage Who We Help |
| 94 | `homepage_proof` | Homepage Proof |
| 95 | `homepage_why_us` | Homepage Why Us |
| 96 | `homepage_final_cta` | Homepage Final CTA |
| 97 | `sales_page_hero` | Sales Page Hero |
| 98 | `sales_page_story_pain` | Sales Page Story/Pain |
| 99 | `sales_page_turn_enemy` | Sales Page Enemy Turn |
| 100 | `sales_page_value_stack` | Sales Page Value Stack |
| 101 | `sales_page_transformation` | Sales Page Transformation |
| 102 | `sales_page_proof` | Sales Page Proof |
| 103 | `sales_page_faq` | Sales Page FAQ |
| 104 | `sales_page_final_cta` | Sales Page Final CTA |
| 105 | `about_page_copy` | About Page Copy |
| 106 | `problems_page_copy` | Problems Page Copy |
| 107 | `results_page_copy` | Results Page Copy |
| 108 | `apply_page_copy` | Apply Page Copy |
| 109 | `form_fields` | Form Fields |
| 110 | `form_cta` | Form CTA |
| 111 | `reassurance` | Reassurance Copy |
| 112 | `lead_page_headline` | Lead Page Headline |
| 113 | `lead_page_copy` | Lead Page Copy |
| 114 | `lead_page_cta` | Lead Page CTA |

#### Phase 10 — Growth Engine (9 vars)

| # | Variable Key | Display Name |
|---|-------------|-------------|
| 115 | `authority_pitch` | Authority Pitch |
| 116 | `authority_publish_plan` | Publishing Plan |
| 117 | `authority_product_ecosystem` | Product Ecosystem |
| 118 | `authority_profile_plan` | Profile & PR Plan |
| 119 | `authority_partnerships` | Strategic Partnerships |
| 120 | `conversion_business_type` | Business Type |
| 121 | `conversion_strategy` | Conversion Strategy |
| 122 | `conversion_funnel` | Conversion Funnel |
| 123 | `conversion_metrics` | Key Metrics |

---

## 4. Variable Categories & Content Generation

### 8 Variable Categories

Used by the Content Engine to organize and select brand variables for AI content generation.

| Category | Label | Variable Count | Variables |
|----------|-------|---------------|-----------|
| `icp` | Ideal Client Profile | 13 | icp_demographics, icp_pains, icp_desires, icp_emotional_triggers, icp_internal_dialogue, icp_objections, icp_psychographics, icp_buying_triggers, customer_journey_stages, icp_right_client_traits, icp_wrong_client_flags, icp_values_alignment, icp_tactic_trap |
| `brand` | Brand Identity | 10 | brand_archetype, brand_characteristics, brand_purpose, brand_values, brand_origin_story, founder_story, brand_tagline, brand_visual_assets_summary, category, brand_faith_positioning |
| `enemy` | Enemy & Market | 4 | enemy_name, enemy_description, enemy_cost, enemy_false_promises |
| `offer` | Offer & Lead Magnet | 17 | offer_name, offer_tagline, offer_problem, offer_outcome, offer_transformation_before, offer_transformation_after, offer_inclusions, offer_price_display, offer_billing_frequency, offer_tier, offer_objections, lead_magnet_type, lead_magnet_title, lead_magnet_promise, lead_magnet_content_outline, offer_qualification_criteria, offer_implementation_services |
| `voice` | Brand Voice | 3 | tone_descriptors, vocabulary_preferred, vocabulary_avoided |
| `messaging` | Messaging & Positioning | 9 | message_core, message_pillars, positioning_statement, differentiation_statement, competitive_landscape, beliefs_to_teach, category_name, category_claim, one_liner |
| `content` | Content Strategy | 2 | content_themes, content_pillars |
| `growth` | Growth Engine | 10 | authority_pitch, authority_publish_plan, authority_product_ecosystem, authority_profile_plan, authority_partnerships, conversion_business_type, conversion_strategy, conversion_funnel, conversion_metrics, offer_affiliate_tools |

### Strategic Variable Selection for Content Generation

Each content item receives **13 variables** (not all 123):

**8 CORE variables (always included):**

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

**5 STRATEGIC variables** selected based on `funnel_stage × storybrand_stage`:

| Funnel Stage | StoryBrand Stages |
|-------------|-------------------|
| `awareness` | character, external_problem, internal_problem, philosophical_problem, guide, plan, call_to_action, failure, success |
| `consideration` | character, external_problem, internal_problem, philosophical_problem, guide, plan, call_to_action, failure, success |
| `conversion` | character, external_problem, internal_problem, philosophical_problem, guide, plan, call_to_action, failure, success |

**27 total combinations**, each mapping to 5 curated variables. Example:

| Combo | Strategic Variables |
|-------|-------------------|
| `awareness_character` | icp_pains, icp_desires, icp_emotional_triggers, enemy_name, brand_origin_story, icp_tactic_trap, icp_right_client_traits |
| `consideration_guide` | founder_story, brand_origin_story, competitive_landscape, differentiation_statement, message_pillars, brand_faith_positioning, one_liner |
| `conversion_call_to_action` | offer_name, offer_outcome, offer_inclusions, lead_magnet_title, conversion_strategy, offer_qualification_criteria, icp_right_client_traits |

This ensures consistent brand voice while varying messaging angle per post.

### Essential Content Variables (14 total)

Used as fallback when no funnel/storybrand stage is specified:

```
tone_descriptors, vocabulary_preferred, vocabulary_avoided, brand_archetype,
brand_characteristics, brand_values, message_core, icp_pains, icp_desires,
enemy_name, enemy_description, message_pillars, positioning_statement,
content_themes, offer_name, offer_outcome
```

---

## 5. The 12 Brand Archetypes

Each archetype has ~24 profile fields including: name, motto, core desire, goal, greatest fear, strategy, weakness, talent, brand voice traits, message themes, customer experience, customer promise, brand culture, color associations, visual style, content approach, shadow traits, complementary archetypes, real-world examples, StoryBrand guide style, differentiation angle, emotional hook, content pillars, and sales approach.

| # | Archetype | Motto | Core Desire | Sales Approach | Examples |
|---|-----------|-------|-------------|----------------|----------|
| 1 | **The Sage** | "The truth will set you free" | Find truth and understanding | Educate to convert | Google, TED, Harvard, McKinsey |
| 2 | **The Hero** | "Where there is a will, there is a way" | Prove worth through courageous action | Challenge to convert | Nike, Under Armour, FedEx |
| 3 | **The Creator** | "If you can imagine it, it can be made" | Create something of enduring value | Inspire to convert | Apple, Adobe, LEGO, Canva |
| 4 | **The Explorer** | "Do not fence me in" | Freedom to discover | Invite to convert | Patagonia, Jeep, Airbnb |
| 5 | **The Rebel** | "Rules are meant to be broken" | Revolution — overthrow what's broken | Provoke to convert | Harley-Davidson, Virgin, BrewDog |
| 6 | **The Magician** | "I make things happen" | Create transformation | Transform to convert | Disney, Tesla, Dyson |
| 7 | **The Ruler** | "Power is not everything — it is the only thing" | Control and order | Command to convert | Rolex, Mercedes-Benz, Bloomberg |
| 8 | **The Caregiver** | "Love your neighbor as yourself" | Protect and care for others | Nurture to convert | Volvo, Dove, UNICEF |
| 9 | **The Innocent** | "Free to be you and me" | Experience happiness | Simplify to convert | Coca-Cola, Whole Foods |
| 10 | **The Lover** | "You are the only one" | Attain intimacy and connection | Seduce to convert | Chanel, Godiva, Hallmark |
| 11 | **The Jester** | "You only live once" | Live in the moment | Entertain to convert | Old Spice, Dollar Shave Club, Mailchimp |
| 12 | **The Everyman** | "All people are created equal" | Connection and belonging | Relate to convert | IKEA, Target, eBay |

Archetype selection happens in Phase 1, Q4. The selected archetype influences:
- Brand voice and tone (Phase 6)
- Color palette suggestions (Phase 7)
- Visual mood direction (Phase 7)
- Content generation throughout the Content Engine

---

## 6. Database Schema

### brand_phases

Tracks each organization's progress through the 10 phases.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
phase_number          TEXT ('1' through '10')
phase_name            TEXT
status                PhaseStatus: not_started | in_progress | completed | locked
started_at            TIMESTAMPTZ | NULL
completed_at          TIMESTAMPTZ | NULL
locked_at             TIMESTAMPTZ | NULL
locked_by             UUID (FK → users) | NULL
sort_order            INTEGER (1-10)
current_question_index INTEGER (0-indexed)
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### brand_outputs

Stores all brand variable values. One row per variable per organization.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
phase_id              UUID (FK → brand_phases)
output_key            TEXT (e.g., 'brand_purpose', 'icp_pains')
output_value          JSONB (flexible — string, object, array, or structured data)
version               INTEGER (default 1)
is_locked             BOOLEAN (default false)
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### brand_conversations

Stores chat history between users and expert agents per phase.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
phase_id              UUID (FK → brand_phases)
user_id               UUID (FK → users) | NULL
messages              JSONB (array of {role, content, files?})
ai_model              TEXT (e.g., 'claude-opus-4.6')
tokens_used           INTEGER
credits_used          INTEGER
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### brand_visual_assets

Stores uploaded visual assets (logos, patterns, mood boards).

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
asset_type            TEXT (primary_logo | logo_dark | logo_light | logo_icon | pattern | mood_board)
file_url              TEXT (Supabase storage path)
file_name             TEXT
sort_order            INTEGER
created_at            TIMESTAMPTZ
```

### brand_playbooks

Tracks generated playbook exports.

```
id                    UUID (PK)
organization_id       UUID (FK → organizations)
version               INTEGER (auto-increment)
generated_by          UUID (FK → users) | NULL
file_url              TEXT | NULL
file_size             INTEGER | NULL
includes_phases       TEXT[] (e.g., ['1', '2', '3'])
created_at            TIMESTAMPTZ
```

### organizations (brand-related fields)

```
brand_engine_status   BrandEngineStatus: not_started | in_progress | completed
playbook_share_token  TEXT | NULL (public share token for playbook)
```

### Storage

- **Bucket:** `org-logos` (public, with RLS policies)
- Used for logo uploads and AI-generated logos

### Key Types

```typescript
type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'locked';
type BrandEngineStatus = 'not_started' | 'in_progress' | 'completed';

interface ColorPalette {
  name: string;
  primary: string;
  dark_base: string;
  accent: string;
  light: string;
  neutral: string;
}

interface Typography {
  heading_font: string;
  heading_weight: string;
  body_font: string;
  body_weight: string;
  accent_font: string;
  accent_weight: string;
}
```

---

## 7. Expert AI Agents

Each phase has a named expert with a detailed persona injected into the system prompt via `formatAgentForPrompt()`.

### Agent Persona Structure

Each agent has:
- **openingStyle** — How they introduce the phase
- **communicationTraits** — Array of characteristic behaviors
- **signaturePhrases** — Memorable phrases they use
- **methodology** — Core framework they apply
- **pushbackStyle** — How they challenge weak answers
- **closingStyle** — How they present final outputs

### Phase → Agent Mapping

| Phase | Agent | Title | Methodology |
|-------|-------|-------|-------------|
| 1 | Tony Robbins | Peak Performance Strategist | RPM (Results, Purpose, Massive Action Plan) |
| 2 | Ryan Levesque | Customer Intelligence Expert | ASK Method |
| 3 | Seth Godin | Marketing Philosopher | Purple Cow + Tribes |
| 4 | Alex Hormozi | Offer Architect | Grand Slam Offer (Value Equation) |
| 5 | April Dunford | Positioning Strategist | Obviously Awesome (5-component positioning) |
| 6 (Q0-2) | Kay Putnam | Brand Psychologist | Brand Therapist (archetype psychology) |
| 6 (Q3-4) | Donald Miller | StoryBrand Expert | StoryBrand 7-part framework |
| 7 | Chris Do | Visual Brand Strategist | The Futur (design serves strategy) |
| 8 | Chris Do | Visual Brand Strategist (Systems) | The Futur (design systems) |
| 9 | Russell Brunson | Funnel Architect | DotCom Secrets (Hook-Story-Offer) |
| 10 | Daniel Priestley | Authority & Growth Strategist | Key Person of Influence 5P |

---

## 8. API Routes

All routes under `app/api/brand/`:

### Core Chat & Navigation

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/brand/chat` | Main expert chat (supports text + file uploads, streaming) |
| POST | `/api/brand/navigate-question` | Jump to specific question index |
| POST | `/api/brand/lock-answer` | Lock question outputs (optional `force: true` to skip missing) |
| POST | `/api/brand/unlock` | Unlock a locked answer |

### Output Management

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/brand/variable` | Save/update individual brand output variable |
| POST | `/api/brand/lock` | Lock question outputs + transition to next question |
| POST | `/api/brand/clear` | Clear all outputs (reset brand engine) |

### Visual Assets

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/brand/assets` | Upload brand visual assets |
| GET | `/api/brand/assets` | Retrieve visual assets for organization |
| POST | `/api/brand/generate-logo` | AI logo generation (DALL-E 3) |
| POST | `/api/brand/generate-colors` | AI color palette generation from archetype context |

### Playbook & Export

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/brand/playbook/export` | Open playbook as browsable HTML |
| GET | `/api/brand/visual-guide/[slug]` | View visual identity guide sections |

### Import

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/brand/import` | Import brand from PDF analysis (Claude) |

---

## 9. Key Components

All under `components/brand/`:

| Component | Purpose |
|-----------|---------|
| `phase-nav-dropdown.tsx` | Phase selector dropdown |
| `progress-tracker.tsx` | Visual progress through phases (status, completion %) |
| `progress-sidebar.tsx` | Sidebar showing phase list and statuses |
| `question-stepper.tsx` | Question stepper (Q1 of 7, etc.) |
| `question-panel.tsx` | Main question display with instructions |
| `question-banner.tsx` | Banner showing current question summary |
| `chat-interface.tsx` | Expert chat UI with message history |
| `expert-chat-panel.tsx` | Expert persona display + chat |
| `logo-upload.tsx` | Drag-drop logo upload + AI generate button |
| `color-palette-picker.tsx` | Coolors-style 5-swatch color picker (lock, randomize, AI) |
| `typography-picker.tsx` | Font selector from ~40 Google Fonts with live preview |
| `brand-assets-upload.tsx` | Multi-file uploader for mood boards, patterns, elements |
| `brand-elements-upload.tsx` | Specialized uploader for graphic elements |
| `phase-outputs.tsx` | Display locked outputs from current phase |
| `variable-preview-card.tsx` | Single variable preview card with lock/unlock |
| `import-drop-zone.tsx` | Drop zone for brand playbook PDF import |
| `import-playbook-modal.tsx` | Modal for playbook import process |

---

## 10. Playbook System

The Brand Playbook is a styled HTML document that presents all brand outputs in a browsable, printable format — themed with the user's own brand colors and typography.

### Key Files

| File | Purpose |
|------|---------|
| `lib/playbook/parse-brand-outputs.ts` | Parse raw outputs to `ParsedBrandData` structure |
| `lib/playbook/playbook-theme.ts` | Styling system using brand colors/typography |
| `components/playbook/` | 13 section components |
| `app/brand/playbook/page.tsx` | Playbook viewing page |
| `app/brand/playbook/playbook.css` | Print CSS (A4, force bg colors, page breaks) |

### Key Functions

| Function | Purpose |
|----------|---------|
| `parseBrandOutputs(outputs)` | Convert raw `brand_outputs` rows to structured `ParsedBrandData` |
| `groupOutputsByPhase(outputs, phases)` | Group outputs by phase number for display |
| `formatOutputKey(key)` | Convert variable key to human display name |
| `formatOutputValueText(value)` | Format any JSON value as readable string |

### Export Behavior

- `handleExportPlaybook()` opens playbook in new browser tab
- URL: `/brand/playbook?organizationId=xxx`
- Print CSS ensures clean A4 output with forced background colors and page breaks

---

## 11. Architecture & Design Decisions

### Sequential Phase Progression
Users must complete phases in order (enforced server-side). Each phase builds on prior phase outputs. Earlier answers are injected into later phase system prompts.

### Question-by-Question Conversation
Users answer one question at a time with expert guidance — not form filling. The AI validates, refines, and structures responses.

### Expert Personas (Not Faceless AI)
Named experts (Tony Robbins, Seth Godin, etc.) with rich personas make the experience feel like working with a strategist. Each persona has specific methodology, communication traits, and pushback style.

### YAML for Structured Output
Variables are presented as YAML blocks for clarity and parseability. The parser handles both YAML and JSON.

### Lock/Unlock Model
Once confirmed, answers are locked (immutable unless unlocked). Later phases reference locked outputs from earlier phases. Force-advance (`force: true`) allows skipping missing outputs mid-phase.

### Design System = Proposal, Not Collaboration
Phase 8 breaks the conversational pattern — the agent proposes the full design system upfront based on all prior phases, because most users aren't designers.

### Strategic Variable Selection
Content Engine uses 13 variables per content piece (8 core + 5 strategic) instead of all 123. This maintains consistency while creating messaging variety through the funnel × storybrand stage matrix.

### Migration 025 Consolidation
18 original phases were consolidated to 10 clean phases. Key merges:
- Phases 2 + 2A → 2 + 3
- Phases 6A + 6B → 6
- Phases 7 + 8F → 7 + 8
- Phases 8 + 8A-8E → 9
- Phases 9 + 10 → 10

---

## 12. File Reference

### Configuration

| File | Lines | Content |
|------|-------|---------|
| `config/phases.ts` | ~689 | `PHASE_TEMPLATES` — 10 phases with questions, outputs, question-output maps, instructions |
| `config/phase-agents.ts` | ~488 | 10 agent definitions with detailed personas |
| `lib/brand/archetype-profiles.ts` | ~393 | 12 archetype profiles with ~24 fields each |
| `lib/content-engine/brand-variable-categories.ts` | 319 | 8 categories, variable display names, strategic variable selection |

### Services

| File | Purpose |
|------|---------|
| `lib/playbook/parse-brand-outputs.ts` | Output parsing and formatting |
| `lib/playbook/playbook-theme.ts` | Playbook styling from brand data |

### Types

| File | Relevant Tables |
|------|-----------------|
| `types/database.ts` | brand_phases, brand_outputs, brand_conversations, brand_visual_assets, brand_playbooks |

### Migrations

| Migration | Purpose |
|-----------|---------|
| 016 | `org-logos` storage bucket, logo-related brand variables |
| 025 | Phase restructure (18 → 10 phases), data migration, new trigger |
| 072 | V3 phase reorder (sort_order swap, phase_number unchanged) |

---

## V3 Changelog

### Phase Reorder
- Market Enemy moved to position 1 (sort_order), Brand Foundation to position 4, Offer to position 3
- phase_number unchanged, only sort_order differs
- Migration: 072_v3_phase_reorder.sql

### New Variables (11 total)

| Variable | Phase | Description |
|---|---|---|
| brand_faith_positioning | 1 - Brand Foundation | Faith/philosophy positioning level |
| icp_right_client_traits | 2 - Ideal Customer | Traits of ideal-fit clients |
| icp_wrong_client_flags | 2 - Ideal Customer | Red flags for wrong-fit clients |
| icp_values_alignment | 2 - Ideal Customer | Shared values between brand and ICP |
| icp_tactic_trap | 3 - Market Enemy | Shiny objects market keeps chasing |
| offer_qualification_criteria | 4 - Offer | Prerequisites for client success |
| offer_implementation_services | 4 - Offer | Hands-on service model |
| offer_affiliate_tools | 4 - Offer | Recommended complementary tools |
| category_name | 5 - Market Positioning | Named category the brand owns |
| category_claim | 5 - Market Positioning | Why the brand owns this category |
| one_liner | 5 - Market Positioning | Dinner-party answer to "What do you do?" |

### Total Variables: 123 (was 112)
### Core Content Variables: 8 (was 7) — added one_liner

### Strategic Variable Map Updates
- `awareness_character`: added `icp_tactic_trap`, `icp_right_client_traits`
- `awareness_external_problem`: added `icp_tactic_trap`
- `consideration_guide`: added `brand_faith_positioning`, `one_liner`
- `consideration_plan`: added `offer_qualification_criteria`, `category_name`
- `conversion_call_to_action`: added `offer_qualification_criteria`, `icp_right_client_traits`
