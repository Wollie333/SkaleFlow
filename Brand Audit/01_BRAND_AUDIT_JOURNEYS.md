# SkaleFlow Brand Audit — User Journeys

> **Feature:** Brand Audit
> **Version:** 1.0
> **Date:** 2026-02-20
> **Integrates with:** CRM Contacts, Brand Engine, Call System, PDF Generator

---

## Table of Contents

1. [Overview](#overview)
2. [Actors & Roles](#actors--roles)
3. [Entry Points Summary](#entry-points-summary)
4. [Journey 1: Manual Brand Audit (Wizard Flow)](#journey-1-manual-brand-audit-wizard-flow)
5. [Journey 2: Call-Based Brand Audit](#journey-2-call-based-brand-audit)
6. [Journey 3: Hybrid Flow (Call + Manual Completion)](#journey-3-hybrid-flow)
7. [Journey 4: Report Generation & Delivery](#journey-4-report-generation--delivery)
8. [Journey 5: CRM Contact Integration](#journey-5-crm-contact-integration)
9. [Journey 6: Re-Audit (Existing Client)](#journey-6-re-audit-existing-client)
10. [Prospect Journey: Receiving the Brand Audit Report](#prospect-journey-receiving-the-brand-audit-report)
11. [State Machine: Audit Lifecycle](#state-machine-audit-lifecycle)

---

## Overview

The Brand Audit feature allows SkaleFlow users to run a structured brand diagnostic on their clients or prospects. The audit can be initiated through two entry points (manual wizard or guided call) and produces a white-labelled, on-brand PDF report. All audit data lives on the CRM contact record, creating a persistent history of brand health over time.

The audit evaluates six categories:
1. **Brand Foundation** — Positioning clarity, ICP definition, value proposition, brand purpose
2. **Message Consistency** — Cross-channel alignment, customer-centric language, CTA clarity
3. **Visual Identity** — Logo consistency, colour/font cohesion, quality vs price point match
4. **Digital Presence** — Website performance, SEO/search visibility, social media health
5. **Customer Perception** — Review sentiment, testimonial alignment, reputation gap
6. **Competitive Differentiation** — Market positioning, uniqueness, competitor comparison

Each category is scored as **Red** (broken/critical), **Amber** (weak/needs improvement), or **Green** (solid/strong).

---

## Actors & Roles

| Actor | Description |
|-------|-------------|
| **User (Founder/Marketer)** | The SkaleFlow account holder running the audit for their client or prospect |
| **Prospect/Client** | The person whose brand is being audited. They participate in a call OR the user gathers info independently |
| **AI Engine** | Claude API — processes inputs, scores categories, generates analysis and report copy |
| **PDF Generator** | System component that produces the white-labelled report using the user's brand profile |
| **CRM System** | SkaleFlow CRM where the contact and audit record are stored |

---

## Entry Points Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     BRAND AUDIT ENTRY POINTS                │
├─────────────────────┬───────────────────┬───────────────────┤
│   ENTRY POINT A     │   ENTRY POINT B   │   ENTRY POINT C   │
│   Manual Wizard     │   Guided Call      │   CRM Contact     │
│                     │                   │   (shortcut)       │
│   User fills in     │   Call template   │   User clicks      │
│   sections via      │   guides convo,   │   "New Audit" on   │
│   stepped wizard    │   AI extracts     │   a contact card   │
│   (Brand Engine     │   data from       │   → routes to A    │
│   style UI)         │   transcript      │   or B             │
└─────────┬───────────┴─────────┬─────────┴─────────┬─────────┘
          │                     │                   │
          ▼                     ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│              UNIFIED BRAND AUDIT DATA OBJECT                │
│         (same structure regardless of entry point)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              AI SCORING & ANALYSIS ENGINE                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          WHITE-LABEL PDF REPORT (User's Brand)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           STORED ON CRM CONTACT RECORD                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Journey 1: Manual Brand Audit (Wizard Flow)

### Prerequisites
- User has an active SkaleFlow account with sufficient credits
- User's brand profile is configured (logo, colours, agency name) — required for PDF generation
- A CRM contact exists OR will be created during the flow

### Trigger Points
- User clicks "New Brand Audit" from the Brand Audit section in the sidebar
- User clicks "New Brand Audit" from a CRM contact card (pre-links the contact)
- User selects "Brand Audit" from the quick-actions menu

### Step-by-Step Flow

```
1. INITIATE AUDIT
   ├── System shows: "Start New Brand Audit" modal
   ├── User selects: Existing CRM contact OR creates new contact
   │   ├── If existing: Contact name, company, basic info pre-populated
   │   └── If new: Minimal fields — name, company, email (contact created in CRM)
   ├── Audit record created in database with status: "draft"
   └── System navigates to: Brand Audit Wizard

2. WIZARD — SECTION 1: CLIENT OVERVIEW
   ├── Layout: Same look and feel as Brand Engine wizard
   ├── Pre-populated fields (from CRM contact if available):
   │   ├── Business name
   │   ├── Industry / sector
   │   ├── Years in operation
   │   ├── Team size
   │   ├── Website URL
   │   └── Social media links
   ├── Additional fields:
   │   ├── Annual revenue range (dropdown)
   │   ├── Current marketing budget range (dropdown)
   │   └── Primary service/product description (text area)
   ├── AI assist: If website URL provided, AI can auto-pull business description
   ├── User clicks: "Save & Continue"
   └── Section status: complete

3. WIZARD — SECTION 2: TARGET MARKET
   ├── Guided questions (AI-assisted, conversational):
   │   ├── "Who is your client's ideal customer?"
   │   ├── "What specific problem do they solve for this customer?"
   │   ├── "How do their customers currently find them?"
   │   ├── "What does the customer's buying journey look like?"
   │   └── "What's the average deal value / transaction size?"
   ├── AI assist: User types rough answers, AI refines into structured format
   ├── User can edit AI refinements
   ├── User clicks: "Save & Continue"
   └── Section status: complete

4. WIZARD — SECTION 3: CURRENT BRAND & MESSAGING
   ├── Guided questions:
   │   ├── "What's their current tagline or value proposition?" (text)
   │   ├── "How do they describe their business in one sentence?" (text)
   │   ├── "Is their messaging consistent across website, social, and collateral?" (rating: 1-5)
   │   ├── "Does their messaging focus on the customer's problem or on themselves?" (select: customer-focused / self-focused / mixed)
   │   └── "Is there a clear call-to-action across their materials?" (yes/no/inconsistent)
   ├── Optional: Paste in or upload examples of current messaging
   ├── AI assist: If website URL provided in Section 1, AI analyses homepage copy and provides initial assessment
   ├── User clicks: "Save & Continue"
   └── Section status: complete

5. WIZARD — SECTION 4: VISUAL IDENTITY
   ├── Guided questions:
   │   ├── "Is their logo used consistently across all platforms?" (yes/no/partially)
   │   ├── "Do they have a defined colour palette and stick to it?" (yes/no/partially)
   │   ├── "Does their visual quality match the price point they charge?" (yes/no/unclear)
   │   ├── "Rate the overall visual cohesion of their brand" (1-5 scale)
   │   └── "Any specific visual issues you've noticed?" (text, optional)
   ├── Optional: Upload screenshots of current visual assets
   ├── User clicks: "Save & Continue"
   └── Section status: complete

6. WIZARD — SECTION 5: DIGITAL PRESENCE
   ├── Guided questions:
   │   ├── "Rate their website's speed, design, and mobile experience" (1-5 scale)
   │   ├── "Can a visitor understand what they do and take action within 5 seconds?" (yes/no/unclear)
   │   ├── "Are they active on social media?" (very active / occasional / inactive / no presence)
   │   ├── "What comes up when you Google their business name?" (text)
   │   ├── "Do they have a Google Business profile?" (yes/no/unclaimed)
   │   └── "Rate their overall digital presence" (1-5 scale)
   ├── AI assist: If website URL provided, AI can run basic checks (load time, mobile responsiveness) using web fetch
   ├── User clicks: "Save & Continue"
   └── Section status: complete

7. WIZARD — SECTION 6: CUSTOMER PERCEPTION
   ├── Guided questions:
   │   ├── "How does the client want customers to describe them?" (text)
   │   ├── "What do their actual reviews/testimonials say?" (text / paste reviews)
   │   ├── "Is there a gap between desired perception and actual perception?" (yes/no/unsure)
   │   ├── "What's their average review rating?" (number / not applicable)
   │   └── "What's the most common complaint or praise?" (text)
   ├── User clicks: "Save & Continue"
   └── Section status: complete

8. WIZARD — SECTION 7: COMPETITIVE LANDSCAPE
   ├── Guided questions:
   │   ├── "Name 2-3 top competitors" (text fields for each)
   │   ├── "What do these competitors do better than your client?" (text)
   │   ├── "Where does your client stand out (if anywhere)?" (text)
   │   ├── "If you swapped logos, would anyone notice?" (yes/no/partially)
   │   └── "What's the primary way the client competes?" (select: price / quality / service / speed / specialisation / not differentiated)
   ├── User clicks: "Save & Continue"
   └── Section status: complete

9. WIZARD — SECTION 8: GOALS & PAIN POINTS
   ├── Guided questions:
   │   ├── "What's the client's biggest frustration with their brand/marketing?" (text)
   │   ├── "What would success look like in 90 days?" (text)
   │   ├── "If they could fix one thing immediately, what would it be?" (text)
   │   ├── "What have they already tried that didn't work?" (text)
   │   └── "What's their appetite for change?" (select: ready to overhaul / open to changes / cautious / resistant)
   ├── User clicks: "Complete Audit Input"
   └── Section status: complete

10. REVIEW & GENERATE
    ├── System shows: Summary view of all sections with completion status
    ├── User can: Click any section to edit before generating
    ├── Minimum requirement: At least 5 of 8 sections must be complete
    ├── Credit cost displayed: "This audit will use [X] credits"
    ├── User clicks: "Generate Brand Audit"
    ├── System: AI processes all inputs
    │   ├── Scores each of the 6 audit categories (Red/Amber/Green)
    │   ├── Generates analysis copy for each category
    │   ├── Generates executive summary
    │   ├── Matches gaps to user's Brand Engine offers (see Priority Roadmap logic)
    │   └── Generates priority roadmap
    ├── Audit status changes: "draft" → "processing" → "complete"
    ├── Credits deducted from user's balance
    └── System navigates to: Audit Results view

11. AUDIT RESULTS VIEW
    ├── Dashboard showing: Overall score, category breakdown (traffic light)
    ├── User can: Read through each category analysis
    ├── User can: Edit/adjust any AI-generated content before PDF generation
    ├── User clicks: "Generate Report"
    └── Routes to: Journey 4 (Report Generation)
```

### Save & Resume Behaviour
- Each section saves independently when "Save & Continue" is clicked
- User can leave the wizard at any time and return later
- Progress is shown in the sidebar (completed sections get a green check)
- Incomplete audits show in a "Drafts" section of the Brand Audit list view
- Drafts auto-delete after 90 days of inactivity (with email reminder at 60 days)

---

## Journey 2: Call-Based Brand Audit

### Prerequisites
- User has an active SkaleFlow account with sufficient credits
- User's brand profile is configured
- Call system is available (WebRTC infrastructure)
- "Brand Audit" call template exists in the system (pre-built by SkaleFlow)

### Trigger Points
- User selects "Brand Audit Call" when creating a new call
- User selects "Brand Audit" template during pre-call setup
- From CRM contact card: "Run Brand Audit Call"

### Step-by-Step Flow

```
1. PRE-CALL SETUP
   ├── User creates new call (or uses scheduled booking)
   ├── Call type selected: "Brand Audit" (or "Discovery" with Brand Audit template)
   ├── Template assigned: "Brand Audit Discovery" template (auto-selected, user can change)
   ├── CRM contact linked: Existing contact OR new one created
   ├── System creates: Brand audit record with status "draft" and source "call"
   ├── System creates: Link between call record and audit record
   └── User enters call room

2. CALL IN PROGRESS — AI-GUIDED CONVERSATION
   ├── Call template visible on screen (Panel B — AI Help)
   ├── Template sections displayed as collapsible conversation guide:
   │
   ├── TEMPLATE SECTION 1: OPENING & CONTEXT (2-3 min)
   │   ├── Suggested questions:
   │   │   ├── "Tell me about your business — what do you do and who do you serve?"
   │   │   ├── "How long have you been operating?"
   │   │   └── "What made you reach out / agree to this conversation?"
   │   ├── AI listens: Extracts → business name, industry, years operating, team size
   │   └── AI maps to: Section 1 (Client Overview) of audit data object
   │
   ├── TEMPLATE SECTION 2: TARGET MARKET (3-5 min)
   │   ├── Suggested questions:
   │   │   ├── "Who's your ideal customer? Describe them."
   │   │   ├── "What's the main problem you solve for them?"
   │   │   ├── "How do most of your customers find you right now?"
   │   │   └── "What does a typical deal look like — size, timeline?"
   │   ├── AI listens: Extracts → ICP description, core problem, acquisition channels
   │   └── AI maps to: Section 2 (Target Market) of audit data object
   │
   ├── TEMPLATE SECTION 3: BRAND & MESSAGING (5-7 min)
   │   ├── Suggested questions:
   │   │   ├── "If I asked your best customer to describe what you do, what would they say?"
   │   │   ├── "Now how do YOU describe what you do?"
   │   │   ├── "Is that message the same everywhere — website, social, when you pitch?"
   │   │   └── "What's the one thing you want people to remember about your brand?"
   │   ├── AI listens: Extracts → messaging clarity, consistency assessment, perception gap
   │   ├── AI flags: If prospect's answer differs significantly from their website copy (if URL was provided)
   │   └── AI maps to: Section 3 (Current Brand & Messaging) of audit data object
   │
   ├── TEMPLATE SECTION 4: VISUAL & DIGITAL (3-5 min)
   │   ├── Suggested questions:
   │   │   ├── "How do you feel about your current website?"
   │   │   ├── "Are you active on social media? What's working, what's not?"
   │   │   ├── "When someone Googles your business, are you happy with what they find?"
   │   │   └── "Does your visual brand — logo, colours, overall look — represent who you actually are?"
   │   ├── AI listens: Extracts → website satisfaction, social activity level, visual identity assessment
   │   └── AI maps to: Sections 4 & 5 (Visual Identity + Digital Presence) of audit data object
   │
   ├── TEMPLATE SECTION 5: REPUTATION & COMPETITION (3-5 min)
   │   ├── Suggested questions:
   │   │   ├── "What do your reviews and testimonials say about you?"
   │   │   ├── "Who do you lose deals to? What do they do differently?"
   │   │   ├── "What makes you different from those competitors — honestly?"
   │   │   └── "If I put your website next to theirs and removed the logos, could I tell them apart?"
   │   ├── AI listens: Extracts → competitor names, differentiation level, reputation gap
   │   └── AI maps to: Sections 6 & 7 (Customer Perception + Competitive Landscape) of audit data object
   │
   ├── TEMPLATE SECTION 6: PAIN POINTS & GOALS (3-5 min)
   │   ├── Suggested questions:
   │   │   ├── "What's your biggest frustration with your marketing right now?"
   │   │   ├── "What have you tried before that didn't work?"
   │   │   ├── "If we could fix one thing in the next 90 days, what would move the needle?"
   │   │   └── "What does success look like for you?"
   │   ├── AI listens: Extracts → pain points, failed attempts, goals, success metrics
   │   └── AI maps to: Section 8 (Goals & Pain Points) of audit data object
   │
   └── TEMPLATE SECTION 7: CLOSE & NEXT STEPS (2-3 min)
       ├── Suggested prompts:
       │   ├── "Based on everything you've shared, I'm going to put together a brand audit report."
       │   ├── "You'll have it within [24/48 hours] — it'll show exactly where things stand and what to prioritise."
       │   └── "Any questions before we wrap up?"
       ├── AI generates: Real-time suggested close based on what was discussed
       └── No data extraction needed — this is the wrap-up

3. DURING CALL — AI EXTRACTION BEHAVIOUR
   ├── Transcript flows in real-time (Panel C)
   ├── AI processes conversational turns (not every sentence)
   ├── For each template section, AI:
   │   ├── Identifies relevant statements from the prospect
   │   ├── Extracts structured data points
   │   ├── Tags confidence level (high/medium/low) per extraction
   │   ├── Maps to the corresponding audit data section
   │   └── Generates next suggested question if the section needs more info
   ├── User sees on-screen: Which audit sections have been populated (progress indicator)
   └── AI adapts: If conversation naturally moves to a different section, AI follows rather than forcing the template order

4. POST-CALL PROCESSING
   ├── Call ends → standard post-call pipeline triggers
   ├── ADDITIONAL brand audit processing:
   │   ├── AI reviews ALL extracted data for completeness
   │   ├── AI identifies: Which audit sections are fully populated, partially populated, or empty
   │   ├── AI generates: Confidence score per section
   │   ├── Audit status: "draft" → "call_complete"
   │   └── Audit data object: Pre-populated with extracted data
   ├── User sees: "Brand Audit Data Captured" notification
   ├── System shows: Pre-populated audit review screen
   │   ├── Each section shows: AI-extracted data with confidence indicators
   │   ├── User can: Edit, supplement, or override any extracted data
   │   ├── Incomplete sections: Highlighted with "Needs more info" badge
   │   └── User can: Switch to manual wizard to fill gaps (Journey 3)
   ├── When satisfied, user clicks: "Generate Audit"
   └── Routes to: Journey 4 (Report Generation) — same as manual flow from step 10 onwards

5. CALL RECORDING & TRANSCRIPT STORAGE
   ├── Call recording: Stored in Supabase Storage, linked to call record AND audit record
   ├── Full transcript: Stored in call_transcripts, searchable
   ├── Both accessible from:
   │   ├── CRM contact record
   │   ├── Call history
   │   └── Brand audit record
   └── AI extraction mappings: Stored so user can see "where did this data come from" and reference the transcript
```

### Brand Audit Call Template — AI Extraction Rules

Each template section has defined extraction rules that tell the AI what to listen for:

| Template Section | Listens For | Maps To Audit Field | Example Trigger Phrases |
|-----------------|-------------|---------------------|------------------------|
| Opening & Context | Business basics, motivation | client_overview | "We've been in business for...", "We do...", "We serve..." |
| Target Market | Customer description, problems solved | target_market | "Our ideal customer is...", "The main problem...", "They usually find us through..." |
| Brand & Messaging | Self-description vs customer description, consistency | current_messaging | "We describe ourselves as...", "Customers would say...", "Our tagline is..." |
| Visual & Digital | Website feelings, social activity, visual satisfaction | visual_identity, digital_presence | "Our website is...", "We post on...", "When you Google us..." |
| Reputation & Competition | Reviews, competitors, differentiation | customer_perception, competitive_landscape | "Our reviews say...", "We compete with...", "What makes us different is..." |
| Pain Points & Goals | Frustrations, past failures, success vision | goals_pain_points | "Our biggest frustration is...", "We tried... but...", "Success would be..." |

---

## Journey 3: Hybrid Flow (Call + Manual Completion)

### When This Happens
- A call didn't cover all audit sections (common — some prospects talk more about some areas than others)
- A call was cut short
- User wants to supplement call data with their own observations

### Flow

```
1. CALL COMPLETES (Journey 2 up to step 4)
   ├── Audit data partially populated from call extraction
   └── Some sections marked as incomplete or low confidence

2. USER REVIEWS EXTRACTED DATA
   ├── System shows: Audit review screen with call-populated data
   ├── Incomplete sections highlighted: "Section needs more info"
   ├── User clicks: "Complete Manually" on any incomplete section
   └── System opens: That section in wizard mode (same UI as Journey 1)

3. USER FILLS GAPS
   ├── Pre-populated fields: Keep call-extracted data (editable)
   ├── Empty fields: User fills in manually
   ├── AI assist: Same as manual wizard — AI refines rough inputs
   └── User saves each section as they complete it

4. COMPLETION
   ├── All required sections now populated (mix of call-extracted + manual)
   ├── User clicks: "Generate Audit"
   ├── Audit source recorded as: "hybrid"
   └── Routes to: Report generation (same as step 10 in Journey 1)
```

---

## Journey 4: Report Generation & Delivery

### Prerequisites
- Audit data complete (minimum 5 of 8 sections)
- AI scoring complete
- User's brand profile configured (logo, colours, agency name)

### Flow

```
1. AI SCORING & ANALYSIS
   ├── AI processes all audit section data
   ├── For each of the 6 audit categories:
   │   ├── Assigns score: Red (0-39) / Amber (40-69) / Green (70-100)
   │   ├── Generates: 2-3 paragraph analysis (what was found, why it matters)
   │   └── Generates: Specific actionable insight
   ├── Generates: Overall brand health score (weighted average)
   ├── Generates: Executive summary (3-5 key findings)
   └── Generates: Priority roadmap (see Roadmap Logic below)

2. PRIORITY ROADMAP — OFFER MATCHING LOGIC
   ├── System loads: User's Brand Engine offers (from brand_offers table)
   │   ├── Each offer has: name, description, deliverables, pricing, service_tags
   │   └── Service tags: ["branding", "messaging", "content", "digital", "design", "strategy", "website"]
   ├── System matches: Audit gaps → User's offers based on service tags
   │   ├── Red gaps → matched offers listed as "Priority 1: Critical"
   │   ├── Amber gaps → matched offers listed as "Priority 2: Improvement"
   │   └── Green gaps with room for improvement → "Priority 3: Optimisation"
   ├── For each matched offer:
   │   ├── Show: Offer name (from user's Brand Engine)
   │   ├── Show: Brief description of how it addresses the gap
   │   ├── Show: Key deliverables relevant to this gap
   │   └── Optionally show: Price (user configures whether pricing appears on reports)
   ├── Unmatched gaps (no corresponding offer):
   │   ├── Listed under: "Additional Areas Identified"
   │   ├── Framed as: "May require specialist support" or "Discuss with your strategist"
   │   └── Does NOT recommend services the user doesn't offer
   └── User can: Review and edit the roadmap before PDF generation

3. REPORT PREVIEW
   ├── System renders: HTML preview of the full report
   ├── User's brand applied:
   │   ├── Primary colour → headers, accent bars, chart fills, cover background
   │   ├── Secondary colour → subheadings, highlights
   │   ├── Logo → cover page, header on every page
   │   ├── Font (if custom, otherwise clean default)
   │   └── Agency name & contact → footer, cover, about page
   ├── Report pages:
   │   ├── Page 1: Cover — Logo, "Brand Audit Report", client name, date, prepared by
   │   ├── Page 2: Executive Summary — Overall score gauge, 3-5 key findings
   │   ├── Page 3: Scoring Dashboard — All 6 categories, visual traffic light display
   │   ├── Pages 4-9: Category Deep Dives — One page per category (score, findings, insight)
   │   ├── Page 10: Competitive Snapshot — Client vs competitors overview
   │   ├── Page 11: Priority Roadmap — Matched to user's offers (see step 2 above)
   │   └── Page 12: About / Next Steps — User's agency info, services, how to get started
   ├── User can: Edit any section content in the preview
   ├── User can: Toggle pricing visibility on/off for the roadmap page
   └── User can: Customise the "About / Next Steps" page (saved as default for future reports)

4. PDF GENERATION
   ├── User clicks: "Generate PDF"
   ├── System: Renders HTML → PDF using Puppeteer/Playwright
   │   ├── CSS variables swap in user's brand colours
   │   ├── Logo image embedded
   │   ├── Charts/gauges rendered as SVG
   │   └── PDF optimised for print and screen
   ├── Credits deducted: PDF generation cost
   ├── PDF stored: Supabase Storage
   ├── PDF linked to: audit record AND CRM contact record
   ├── Audit status: "complete" → "report_generated"
   └── User sees: Download button + preview

5. DELIVERY OPTIONS
   ├── Download PDF: Direct download to user's device
   ├── Email to client: (if email feature available)
   │   ├── System generates: Professional cover email (AI-written, editable)
   │   ├── PDF attached
   │   ├── Sent from: User's configured email or SkaleFlow system email
   │   └── Email tracked: Open/click tracking if available
   ├── Copy link: Shareable link to a hosted version of the report
   │   ├── Hosted on: SkaleFlow subdomain or custom domain
   │   ├── Link expires: Configurable (30 days default)
   │   └── View tracking: User notified when prospect opens the report
   └── All delivery actions logged on the CRM contact timeline
```

### About Page Configuration (One-Time Setup)

The user configures the "About / Next Steps" page once in their Brand Audit settings:

- Agency name and logo (pulled from brand profile)
- Brief agency description (2-3 sentences)
- Services overview (pulled from Brand Engine offers, user selects which to feature)
- Contact information (email, phone, website)
- Call-to-action text (e.g., "Ready to fix your brand? Book a strategy call.")
- CTA link (e.g., booking page URL)

This auto-populates on every future report. User can override per-report if needed.

---

## Journey 5: CRM Contact Integration

### How The Audit Lives on the Contact

```
1. CRM CONTACT CARD — BRAND AUDIT WIDGET
   ├── Location: Visible on the contact detail page (alongside activity, deals, calls)
   ├── Widget shows:
   │   ├── Current audit status badge (if one exists): "Audit: Green | Last: Feb 2026"
   │   ├── Overall score: Visual gauge or number
   │   ├── Category breakdown: Mini traffic-light display (6 dots, coloured)
   │   ├── Last audit date
   │   └── Quick actions:
   │       ├── "View Latest Audit" → opens audit detail
   │       ├── "New Brand Audit" → starts Journey 1 with contact pre-linked
   │       ├── "Brand Audit Call" → starts Journey 2 with contact pre-linked
   │       └── "View History" → shows all past audits for this contact

2. AUDIT HISTORY ON CONTACT
   ├── List view: All audits for this contact, newest first
   ├── Each entry shows: Date, overall score, source (manual/call/hybrid), status
   ├── Compare view: Side-by-side of two audits (before/after)
   │   ├── Shows: Score changes per category
   │   ├── Highlights: Improvements (red→amber, amber→green)
   │   ├── Highlights: Regressions (green→amber, etc.)
   │   └── Great for: Retention conversations, re-engagement
   └── PDF reports: All downloadable from audit history

3. CONTACT TIMELINE INTEGRATION
   ├── Audit events appear on the contact timeline:
   │   ├── "Brand Audit started" (with source: manual/call)
   │   ├── "Brand Audit completed — Overall Score: 45/100"
   │   ├── "Brand Audit Report generated"
   │   ├── "Brand Audit Report sent to [email]"
   │   └── "Brand Audit Report viewed by recipient" (if link tracking)
   └── Audit linked to: Associated call record (if call-based), associated deal (if applicable)

4. CRM FILTERING & SEGMENTATION
   ├── Filter contacts by: Has brand audit (yes/no)
   ├── Filter contacts by: Audit score range (e.g., 0-40 = cold leads needing help)
   ├── Filter contacts by: Specific category score (e.g., "Red on messaging")
   ├── Filter contacts by: Audit date (e.g., "audits older than 6 months" = re-engagement)
   └── Use in: Smart lists, email campaigns, follow-up workflows
```

---

## Journey 6: Re-Audit (Existing Client)

### When This Happens
- 6-12 months after initial audit
- Client has implemented changes and wants to measure progress
- User wants to demonstrate ROI of their services

### Flow

```
1. USER INITIATES RE-AUDIT
   ├── From CRM contact: Clicks "New Brand Audit"
   ├── System detects: Previous audit exists
   ├── System prompts: "This contact has a previous audit from [date]. Would you like to:"
   │   ├── Option A: "Start fresh" — blank audit, no pre-population
   │   ├── Option B: "Use previous audit as baseline" — pre-populates from last audit
   │   └── Option C: "Quick re-score" — same data, just re-evaluate scores (fastest, cheapest)
   └── User selects and proceeds

2. IF OPTION B (most common):
   ├── Wizard opens with all fields pre-populated from previous audit
   ├── User updates: Only the fields that have changed
   ├── AI compares: New inputs vs previous audit data
   ├── AI highlights: What's improved, what's declined, what's unchanged
   └── Generates: Comparison report (see below)

3. COMPARISON REPORT (in addition to standard report):
   ├── Additional page: "Progress Since Last Audit"
   │   ├── Score comparison: Before vs After per category
   │   ├── Visual: Arrow indicators (↑ improved, ↓ declined, → unchanged)
   │   ├── Narrative: AI-generated summary of progress
   │   └── Highlights: Specific wins attributable to work done
   ├── Roadmap updated: Reflects current state, not original gaps
   └── Powerful for: Client retention, upselling, demonstrating value

4. AUDIT HISTORY UPDATED
   ├── New audit added to contact's history
   ├── Comparison view available between any two audits
   └── Trend line: If 3+ audits exist, show score trend over time
```

---

## Prospect Journey: Receiving the Brand Audit Report

### From the Prospect/Client's Perspective

```
1. THE CALL (if call-based)
   ├── Prospect has a natural conversation (they don't know it's a structured audit)
   ├── Questions feel like a genuine discovery call
   ├── Prospect feels: "This person really listened and asked great questions"
   └── Call ends with: "I'll send you a brand audit report within 24-48 hours"

2. RECEIVING THE REPORT
   ├── Prospect receives: Professional email with PDF attached (or link)
   ├── First impression: "This looks like it came from a serious agency"
   ├── Cover page: Clean, branded, professional
   └── Prospect opens and reads...

3. READING THE REPORT
   ├── Executive Summary: "Oh wow, they really captured where we are"
   ├── Scoring Dashboard: "Visual — I can see exactly where we're weak"
   ├── Category Deep Dives: "This is specific to MY business, not generic"
   ├── Competitive Snapshot: "They even looked at my competitors"
   ├── Priority Roadmap: "Here's what to fix and... oh, they offer exactly this"
   └── About / Next Steps: "I should book a follow-up call"

4. POST-REPORT ACTIONS
   ├── Prospect shares report with: Business partner, team, spouse
   ├── The report sells on the user's behalf (it's a leave-behind that does the work)
   ├── Prospect books: Follow-up call / strategy session
   └── Conversion point: The audit turns a prospect into a client

5. RETENTION (for existing clients, re-audit)
   ├── Client receives: Updated audit showing improvement
   ├── Client sees: Concrete evidence of ROI
   ├── Client feels: "This investment was worth it"
   └── Client action: Renews, upsells, or refers
```

---

## State Machine: Audit Lifecycle

```
                    ┌──────────┐
                    │  draft   │ ← Initial state (manual or call-initiated)
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
      ┌──────────────┐    ┌─────────────────┐
      │  in_progress  │    │  call_in_progress│
      │  (wizard)     │    │  (live call)     │
      └──────┬───────┘    └────────┬─────────┘
              │                     │
              │                     ▼
              │            ┌─────────────────┐
              │            │  call_complete   │
              │            │  (extraction     │
              │            │   done)          │
              │            └────────┬─────────┘
              │                     │
              │         ┌───────────┴────────────┐
              │         │                        │
              │         ▼                        ▼
              │  ┌──────────────┐    ┌───────────────────┐
              │  │  ready       │    │  hybrid_in_progress│
              │  │  (all data   │    │  (filling gaps     │
              │  │   present)   │    │   manually)        │
              │  └──────┬───────┘    └────────┬───────────┘
              │         │                     │
              ▼         ▼                     ▼
      ┌─────────────────────────────────────────────┐
      │                 processing                   │
      │        (AI scoring & analysis running)       │
      └──────────────────────┬──────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   complete     │
                    │   (scored,     │
                    │    analysed)   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ report_generated│
                    │ (PDF created)   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  delivered     │
                    │  (sent to      │
                    │   prospect)    │
                    └────────────────┘

  Side transitions:
  - Any state → "archived" (user manually archives)
  - "draft" → "abandoned" (auto after 90 days inactivity)
```
