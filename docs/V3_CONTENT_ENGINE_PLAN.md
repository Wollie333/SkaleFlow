# V3 Content Engine — Implementation Plan

> Meta Ads Manager-style redesign: Campaign → Ad Set → Post hierarchy
> Replaces V2 flat calendar + StoryBrand/Funnel with 7 Content Types × 18 Objectives

---

## Phase 1: Foundation (Config + Types + Migration)

### Task 1.1: Campaign Objectives Config
- **File**: `config/campaign-objectives.ts`
- Define 18 objectives across 5 categories (growth, revenue, launch, brand, community)
- Each objective: id, name, category, description, defaultContentTypeRatios (T1–T7), primaryMetrics, sequenceNext
- Export `CAMPAIGN_OBJECTIVES` map + `OBJECTIVE_CATEGORIES`

### Task 1.2: Content Types Config
- **File**: `config/content-types.ts`
- 7 content types on a spectrum (Decision Makers ← → Practitioners)
  1. Outcome Oriented — proof, KPIs, case studies
  2. Point of View — contrarian takes, beliefs, values
  3. Strategic — high-level process, big picture
  4. Frameworks — decision matrices, thinking tools
  5. Step-by-Step Guides — action plans, roadmaps
  6. Tactics — tips, tools, checklists
  7. Micro Execution — do's/don'ts, templates, hacks
- Each type: id, name, description, examples, primaryOutcome, bestFormats

### Task 1.3: Platform Defaults Config
- **File**: `config/platform-defaults.ts`
- Per-platform: format ratios, default posting schedule (days + times), posting limits (max/day, max/week)
- Aggressiveness tiers: Focused (3/wk), Committed (5/wk), Aggressive (7–10/wk)
- Format specs: dimensions, duration limits per platform

### Task 1.4: Database Migration 090
- **File**: `supabase/migrations/090_v3_content_engine.sql`
- Tables: `campaigns`, `campaign_adsets`, `content_posts`, `campaign_adjustments`, `winner_pool`, `brand_intelligence_reports`
- Org fields: `content_engine_status`, `brand_voice_learned`, `active_campaign_count`
- Indexes + RLS policies

### Task 1.5: TypeScript Types
- **File**: `types/database.ts` — add Row/Insert/Update/Relationships for all new tables
- **File**: `types/content.ts` — new type aliases: CampaignObjective, CampaignStatus, Aggressiveness, ContentType, ContentFormat, WinnerCategory, etc.

---

## Phase 2: Core Library Logic

### Task 2.1: Ratio Calculator
- **File**: `lib/content-engine/ratio-calculator.ts`
- `calculatePostDistribution(objective, adsets, dateRange)` → slot array
- Distributes content types by ratio, assigns formats, schedules across date range
- Conflict avoidance using existing `findAvailableTime` pattern

### Task 2.2: V3 Content Generation
- **File**: `lib/content-engine/generate-content-v3.ts`
- Content type-based prompting (replaces StoryBrand/Funnel logic)
- Generates per post: 3 hook_variations, body, cta, visual_brief, shot_suggestions, slide_content, on_screen_text, platform_variations
- Brand voice score calculation
- Reuses credit check/deduct + retry/validation patterns

### Task 2.3: Queue Service V3 Extension
- **File**: `lib/content-engine/queue-service.ts` (extend)
- `enqueueCampaignBatch()` — creates batch + queue rows for content_posts
- `processOneCampaignItem()` — calls V3 generation logic
- Client-driven polling pattern preserved

---

## Phase 3: Campaign CRUD API Routes

### Task 3.1: Campaign CRUD
- `app/api/content/campaigns/route.ts` — GET list, POST create
- `app/api/content/campaigns/[id]/route.ts` — GET detail, PATCH update, DELETE archive

### Task 3.2: Ad Set CRUD
- `app/api/content/campaigns/[id]/adsets/route.ts` — GET list, POST add
- `app/api/content/campaigns/[id]/adsets/[adsetId]/route.ts` — PATCH, DELETE

### Task 3.3: Campaign Post Generation
- `app/api/content/campaigns/[id]/generate/route.ts` — POST
- Calls ratio calculator → creates content_posts → enqueues batch

### Task 3.4: Sequence Recommendation
- `app/api/content/campaigns/sequence-recommendation/route.ts` — GET
- AI-recommended next campaign based on objective + performance

### Task 3.5: Post Management
- `app/api/content/campaigns/[id]/posts/route.ts` — GET list, POST create
- `app/api/content/campaigns/[id]/posts/[postId]/route.ts` — GET, PATCH, DELETE
- `app/api/content/campaigns/[id]/posts/[postId]/review/route.ts` — POST approve/reject/revision

### Task 3.6: Schedule Conflict Check
- `app/api/content/campaigns/[id]/conflicts/route.ts` — GET

---

## Phase 4: Intelligence Systems

### Task 4.1: Winner Detector
- **File**: `lib/content-engine/winner-detector.ts`
- 5 winner categories: awareness, engagement, traffic, conversion, viral
- Threshold: top 10% or 2.5× baseline (4× for viral)

### Task 4.2: Recycling Engine
- **File**: `lib/content-engine/recycling-engine.ts`
- Criteria: top 30%, 90+ days old, not recycled in 180 days
- Generates refreshed version with new hooks

### Task 4.3: Adjustment Engine
- **File**: `lib/content-engine/adjustment-engine.ts`
- Triggers: underperformance, content fatigue, format underperformance, scheduling gap, objective mismatch
- Max 2 recommendations per week per campaign

### Task 4.4: Adjustment API Routes
- `app/api/content/campaigns/[id]/adjustments/route.ts` — GET list
- `app/api/content/campaigns/[id]/adjustments/[adjId]/route.ts` — PATCH approve/dismiss

### Task 4.5: Winner Pool API
- `app/api/content/winners/route.ts` — GET org-wide list
- `app/api/content/winners/[id]/route.ts` — GET detail, POST recycle

---

## Phase 5: Brand Intelligence + Voice Learning

### Task 5.1: Brand Intelligence Reports
- **File**: `lib/content-engine/brand-intelligence.ts`
- Post-campaign AI report: performance analysis, content type effectiveness, recommendations

### Task 5.2: Brand Voice Learner
- **File**: `lib/content-engine/brand-voice-learner.ts`
- Tracks user edits, extracts patterns, updates org's `brand_voice_learned`
- Feeds back into generation prompts

### Task 5.3: Report + Export APIs
- `app/api/content/campaigns/[id]/report/route.ts` — GET/POST
- `app/api/content/campaigns/[id]/export/route.ts` — GET (design briefs, scripts, calendar)

---

## Phase 6: Core UI Components

### Task 6.1: Campaign Manager (List View)
- **File**: `components/content/campaign-manager.tsx`
- Card grid with status badges, objective labels, date ranges, post counts

### Task 6.2: Campaign Wizard (Multi-Step Creation)
- **File**: `components/content/campaign-wizard.tsx`
- Step 1: Name + Dates → Step 2: Objective → Step 3: Platforms + Aggressiveness → Step 4: Review + Generate

### Task 6.3: Ad Set Configurator
- **File**: `components/content/adset-configurator.tsx`
- Per-platform: aggressiveness slider, content type ratios, format ratios, posting schedule

### Task 6.4: Ratio Adjuster
- **File**: `components/content/ratio-adjuster.tsx`
- Visual bar/slider for 7 content type percentages (must sum to 100%)

### Task 6.5: Content Type Explainer
- **File**: `components/content/content-type-explainer.tsx`
- Spectrum visualization: Decision Makers ← → Practitioners

---

## Phase 7: Post-Level UI Components

### Task 7.1: Hook Selector
- **File**: `components/content/hook-selector.tsx`
- 3 hook variations with radio select + regenerate button

### Task 7.2: Campaign Table View (Meta Ads Manager Style)
- **File**: `components/content/campaign-table-view.tsx`
- 3-level drill-down: Campaign → Ad Set → Posts with performance metrics

### Task 7.3: Post Editor V3
- **File**: `components/content/post-editor-v3.tsx`
- Tabs: Content, Visual Brief, Shot Suggestions, Slides, On-Screen Text, Platform Variations

### Task 7.4: Winner Pool Component
- **File**: `components/content/winner-pool.tsx`

### Task 7.5: Adjustment Banner
- **File**: `components/content/adjustment-banner.tsx`

### Task 7.6: Sequence Recommendation Card
- **File**: `components/content/sequence-recommendation-card.tsx`

### Task 7.7: Campaign Report Component
- **File**: `components/content/campaign-report.tsx`

---

## Phase 8: Pages + Routing

### Task 8.1: Campaign List Page — `app/(dashboard)/content/campaigns/page.tsx`
### Task 8.2: Campaign Detail Page — `app/(dashboard)/content/campaigns/[id]/page.tsx`
### Task 8.3: Post Detail Page — `app/(dashboard)/content/campaigns/[id]/posts/[postId]/page.tsx`
### Task 8.4: Winner Pool Page — `app/(dashboard)/content/campaigns/winners/page.tsx`
### Task 8.5: Sidebar Navigation Update

---

## Phase 9: Integration + Polish

### Task 9.1: Publishing Integration — handle content_posts in publish routes
### Task 9.2: Analytics Sync — write performance back to content_posts.performance
### Task 9.3: Notification Integration — campaign lifecycle notifications
### Task 9.4: Approval Workflow — V3 posts use same ContentStatus flow
### Task 9.5: Cron Jobs — adjustment auto-generate (weekly), winner auto-detect (daily)

---

## Phase 10: V2 → V3 Migration

### Task 10.1: Data Migration Script — copy content_items → content_posts, create legacy campaigns
### Task 10.2: Feature Flag — `content_engine_version` on org, conditional UI rendering

---

## Dependency Graph

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──┬──→ Phase 4 ──→ Phase 5
                                   │
                                   └──→ Phase 6 ──→ Phase 7
                                                       │
                                              Phase 8 ←┘
                                                │
                                              Phase 9 ──→ Phase 10
```

Phases 4–5 (backend intelligence) and Phases 6–7 (UI) can run in parallel.

---

## Status Tracker

| Phase | Task | Status |
|-------|------|--------|
| 1.1 | Campaign Objectives Config | ✅ Done |
| 1.2 | Content Types Config | ✅ Done |
| 1.3 | Platform Defaults Config | ✅ Done |
| 1.4 | Database Migration 090 | ✅ Done |
| 1.5 | TypeScript Types | ✅ Done |
| 2.1 | Ratio Calculator | ✅ Done |
| 2.2 | V3 Content Generation | ✅ Done |
| 2.3 | Queue Service Extension | ✅ Done |
| 3.1 | Campaign CRUD | ✅ Done |
| 3.2 | Ad Set CRUD | ✅ Done |
| 3.3 | Campaign Post Generation | ✅ Done |
| 3.4 | Sequence Recommendation | ✅ Done |
| 3.5 | Post Management | ✅ Done |
| 3.6 | Schedule Conflict Check | ✅ Done |
| 4.1 | Winner Detector | ✅ Done |
| 4.2 | Recycling Engine | ✅ Done |
| 4.3 | Adjustment Engine | ✅ Done |
| 4.4 | Adjustment API | ✅ Done |
| 4.5 | Winner Pool API | ✅ Done |
| 5.1 | Brand Intelligence | ✅ Done |
| 5.2 | Brand Voice Learner | ✅ Done |
| 5.3 | Report + Export APIs | ✅ Done |
| 6.1 | Campaign Manager | ✅ Done |
| 6.2 | Campaign Wizard | ✅ Done |
| 6.3 | Ad Set Configurator | ✅ Done |
| 6.4 | Ratio Adjuster | ✅ Done |
| 6.5 | Content Type Explainer | ✅ Done |
| 7.1 | Hook Selector | ✅ Done |
| 7.2 | Campaign Table View | ✅ Done |
| 7.3 | Post Editor V3 | ✅ Done |
| 7.4 | Winner Pool Component | ✅ Done |
| 7.5 | Adjustment Banner | ✅ Done |
| 7.6 | Sequence Recommendation Card | ✅ Done |
| 7.7 | Campaign Report | ✅ Done |
| 8.1 | Campaign List Page | ✅ Done |
| 8.2 | Campaign Detail Page | ✅ Done |
| 8.3 | Post Detail Page | ✅ Done |
| 8.4 | Winner Pool Page | ✅ Done |
| 8.5 | Sidebar Navigation | ✅ Done |
| 9.1 | Publishing Integration | ✅ Done |
| 9.2 | Analytics Sync | ✅ Done |
| 9.3 | Notification Integration | ✅ Done |
| 9.4 | Approval Workflow | ✅ Done |
| 9.5 | Cron Jobs | ✅ Done |
| 10.1 | Data Migration | ⬜ Skipped (no V2 users) |
| 10.2 | Feature Flag | ⬜ Skipped (no V2 users) |
