# SkaleFlow Brand Audit — AI Architecture & Technical Spec

> **Feature:** Brand Audit
> **Version:** 1.0
> **Date:** 2026-02-20
> **AI Provider:** Claude API (Anthropic)
> **PDF Engine:** Puppeteer (HTML → PDF)
> **Integrates with:** Brand Engine, Call System, CRM, Credit System

---

## Table of Contents

1. [System Overview](#system-overview)
2. [AI Prompt Chains](#ai-prompt-chains)
3. [Call Extraction Pipeline](#call-extraction-pipeline)
4. [Scoring Engine](#scoring-engine)
5. [Report Content Generation](#report-content-generation)
6. [Offer Matching Engine](#offer-matching-engine)
7. [PDF Generation Architecture](#pdf-generation-architecture)
8. [API Endpoints](#api-endpoints)
9. [Credit Consumption Model](#credit-consumption-model)
10. [Integration Points with Existing SkaleFlow](#integration-points-with-existing-skaleflow)
11. [Build Sequence & Phases](#build-sequence--phases)

---

## System Overview

The Brand Audit feature has four AI-powered subsystems:

```
┌────────────────────────────────────────────────────────────────────┐
│                    BRAND AUDIT AI ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. INPUT ASSISTANCE          2. CALL EXTRACTION                    │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │ AI helps user     │         │ AI listens to     │                  │
│  │ refine manual     │         │ call transcript    │                  │
│  │ inputs in wizard  │         │ and extracts       │                  │
│  └────────┬─────────┘         │ structured data    │                  │
│           │                    └────────┬─────────┘                  │
│           │                             │                            │
│           ▼                             ▼                            │
│  ┌──────────────────────────────────────────────────┐               │
│  │              UNIFIED AUDIT DATA OBJECT            │               │
│  └──────────────────────┬───────────────────────────┘               │
│                          │                                           │
│                          ▼                                           │
│  3. SCORING & ANALYSIS                                              │
│  ┌──────────────────────────────────────────────────┐               │
│  │ AI scores 6 categories, generates analysis,       │               │
│  │ executive summary, and priority roadmap            │               │
│  └──────────────────────┬───────────────────────────┘               │
│                          │                                           │
│                          ▼                                           │
│  4. REPORT GENERATION                                               │
│  ┌──────────────────────────────────────────────────┐               │
│  │ AI content + user brand + template → branded PDF  │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## AI Prompt Chains

### Chain 1: Input Assistance (Manual Wizard)

Used during the manual wizard flow. When a user enters rough text, AI refines it into structured, useful data.

**Trigger:** User completes a wizard section and clicks "Save & Continue"
**Model:** claude-sonnet (fast, cost-effective for refinement tasks)
**Token budget:** ~500 tokens per section

```
SYSTEM PROMPT — INPUT REFINEMENT

You are a brand strategist assistant inside SkaleFlow. The user is conducting a brand audit on their client. They have entered rough notes for a section of the audit. Your job is to:

1. Refine their rough input into clear, structured language
2. Identify any critical gaps in their response (missing info that would affect scoring)
3. Suggest follow-up questions if the input is too vague

Context:
- Organization: {organization_name}
- Client being audited: {contact_name} at {contact_company}
- Section: {section_key} ({section_title})
- Previous sections already completed: {completed_sections_summary}

Section schema (what fields we need):
{section_data_schema}

User's raw input:
{user_input}

Respond with:
1. REFINED: A refined version of each field the user has filled in
2. GAPS: Any required fields that are missing or too vague
3. SUGGESTIONS: 1-2 follow-up questions the user could ask their client to fill gaps
```

**Example for Target Market section:**

```
User input: "they sell to medium businesses, mainly in construction. they help them get more projects"

AI refined output:
{
  "refined": {
    "ideal_customer_description": "Medium-sized construction companies seeking to increase their project pipeline and win more tenders.",
    "core_problem_solved": "Difficulty acquiring new construction projects and standing out in a competitive tender process."
  },
  "gaps": [
    "How do customers currently find them? (acquisition channels)",
    "Average deal value or project size"
  ],
  "suggestions": [
    "Ask the client: 'How do most of your construction clients hear about you — referrals, Google, industry events?'",
    "Ask the client: 'What's the typical project value you're going after?'"
  ]
}
```

---

### Chain 2: Website Analysis (Auto-Enrichment)

When a user provides a website URL in Section 1, the system can auto-analyse the website to pre-populate several audit fields.

**Trigger:** Website URL entered in client_overview section
**Model:** claude-sonnet
**Token budget:** ~1000 tokens
**Dependency:** web_fetch function to retrieve the website HTML

```
SYSTEM PROMPT — WEBSITE ANALYSIS

You are analysing a business website as part of a brand audit. Given the website content, extract and assess the following:

Website content:
{fetched_website_html_text}

Provide your analysis as JSON:
{
  "business_description": "What this business does in 1-2 sentences",
  "apparent_target_market": "Who the website seems to be targeting",
  "current_tagline": "The tagline or main headline (exact text)",
  "messaging_assessment": {
    "customer_focused": true/false,
    "has_clear_cta": "yes/no/inconsistent",
    "consistency_notes": "Any messaging issues observed"
  },
  "visual_assessment": {
    "professional_quality": "high/medium/low",
    "brand_cohesion": "strong/moderate/weak",
    "notes": "Visual observations"
  },
  "digital_assessment": {
    "mobile_optimised": "likely/unlikely/unclear",
    "load_speed_impression": "fast/moderate/slow",
    "seo_basics": "present/missing/partial"
  },
  "key_issues": ["issue 1", "issue 2"],
  "key_strengths": ["strength 1", "strength 2"]
}

Be honest and specific. This data will be used for scoring.
Do not guess if information is not present — mark as "not found".
```

---

### Chain 3: Call Extraction (Real-Time)

Used during a Brand Audit call. Processes conversational turns from the transcript and extracts structured data mapped to audit sections.

**Trigger:** Speaker turn detected (speaker change or 2+ second silence)
**Model:** claude-sonnet (speed priority for real-time)
**Token budget:** ~300 tokens per turn
**Context window management:** Rolling window of last 10 conversational turns + full current template section context

```
SYSTEM PROMPT — CALL EXTRACTION

You are an AI assistant monitoring a Brand Audit discovery call inside SkaleFlow. Your role is to:

1. Extract structured data from the prospect's responses
2. Map extracted data to the correct audit section fields
3. Assess confidence in each extraction
4. Suggest the next question if the current section needs more data

Context:
- Call type: Brand Audit Discovery
- Template section currently active: {current_section.title}
- Fields needed for this section: {current_section.extraction_rules.listen_for}
- Fields already captured: {already_extracted_fields}
- Fields still missing: {missing_fields}

Previous conversation context:
{last_10_turns}

Latest conversational turn:
Speaker: {speaker_label} (host/prospect)
Text: {transcript_text}

Respond as JSON:
{
  "extractions": [
    {
      "field": "field_name",
      "value": "extracted value",
      "confidence": 0.0-1.0,
      "source_quote": "relevant quote from transcript"
    }
  ],
  "section_completeness": 0.0-1.0,
  "next_suggested_question": "string or null if section is complete",
  "should_transition": true/false,
  "transition_reason": "string or null",
  "notes": "any observations about tone, hesitation, or important signals"
}

Rules:
- Only extract from PROSPECT speech, not host speech
- Confidence below 0.5 = mark as "needs_review"
- If the prospect gives conflicting info, flag it in notes
- Do NOT extract if the statement is ambiguous — wait for clarification
- If the conversation naturally moves to a different section, set should_transition=true
```

---

### Chain 4: Post-Call Comprehensive Extraction

After the call ends, a second pass processes the FULL transcript to catch anything missed during real-time extraction and to refine confidence scores.

**Trigger:** Call ends → post-call processing pipeline
**Model:** claude-sonnet (can be slower, accuracy priority)
**Token budget:** ~2000 tokens

```
SYSTEM PROMPT — POST-CALL EXTRACTION

You are reviewing a complete Brand Audit call transcript. Real-time extraction has already captured some data. Your job is to:

1. Review the full transcript and fill in any data points missed during real-time extraction
2. Verify and refine confidence scores on existing extractions
3. Identify contradictions or inconsistencies in the prospect's statements
4. Flag any notable insights beyond the audit framework (opportunities, red flags, buying signals)

Full transcript:
{full_transcript}

Real-time extractions already captured:
{existing_extractions_by_section}

Audit sections and their required fields:
{all_section_schemas}

Respond as JSON:
{
  "refined_extractions": {
    "client_overview": {
      "field_name": {"value": "...", "confidence": 0.95, "source_timestamp": "00:02:34"}
    },
    "target_market": { ... },
    ...
  },
  "new_extractions": {
    // Data points not captured during real-time
  },
  "contradictions": [
    {"field": "...", "statement_1": "...", "statement_2": "...", "timestamp_1": "...", "timestamp_2": "..."}
  ],
  "additional_insights": [
    {"type": "buying_signal/red_flag/opportunity", "observation": "...", "timestamp": "..."}
  ],
  "sections_completeness": {
    "client_overview": 0.9,
    "target_market": 0.7,
    "current_messaging": 0.85,
    "visual_identity": 0.3,
    "digital_presence": 0.4,
    "customer_perception": 0.6,
    "competitive_landscape": 0.5,
    "goals_pain_points": 0.95
  }
}
```

---

## Scoring Engine

### Chain 5: Category Scoring

Processes all audit section data and generates scores, analysis, and insights for each of the 6 audit categories.

**Trigger:** User clicks "Generate Audit" (all sections marked ready)
**Model:** claude-sonnet
**Token budget:** ~3000 tokens (this is the main analysis)

```
SYSTEM PROMPT — BRAND AUDIT SCORING

You are a senior brand strategist conducting a brand audit analysis. You have been provided with structured data about a business across multiple audit sections. Your task is to:

1. Score each of 6 brand categories on a 0-100 scale
2. Assign a rating: Red (0-39), Amber (40-69), Green (70-100)
3. Write a 2-3 paragraph analysis for each category
4. Identify the single most important finding per category
5. Provide one specific, actionable insight per category
6. Write an executive summary covering the top 3-5 findings
7. Calculate an overall weighted score

Audit data:
{all_section_data_as_json}

Category weights:
- Brand Foundation: 20%
- Message Consistency: 20%
- Visual Identity: 15%
- Digital Presence: 15%
- Customer Perception: 15%
- Competitive Differentiation: 15%

Scoring guidelines:
- RED (0-39): Fundamental problems. Missing basics. Actively hurting the business.
- AMBER (40-69): Functional but weak. Room for significant improvement. Not a competitive advantage.
- GREEN (70-100): Strong. Clear, consistent, and effective. Competitive advantage territory.

Be honest and direct in your analysis. Avoid generic platitudes. Reference specific data from the audit sections to support your scores. The business owner will read this — make it insightful, not insulting.

Respond as JSON:
{
  "categories": [
    {
      "category": "brand_foundation",
      "score": 45,
      "rating": "amber",
      "analysis_summary": "Two to three paragraphs of analysis...",
      "key_finding": "The most important finding for this category...",
      "actionable_insight": "Specific action to take...",
      "source_sections": ["client_overview", "target_market", "goals_pain_points"]
    },
    // ... 5 more categories
  ],
  "overall_score": 42,
  "overall_rating": "amber",
  "executive_summary": "3-5 key findings paragraph...",
  "competitive_snapshot": {
    "summary": "How the client compares to named competitors...",
    "position": "behind/level/ahead",
    "key_competitive_gaps": ["gap 1", "gap 2"]
  }
}

Critical rules:
- Every score must be justified by specific data from the audit
- Do not inflate scores to be nice — accuracy builds trust
- If a section has insufficient data, note this in the analysis and score conservatively
- Competitive Differentiation should score low if the "logo swap test" would pass (they blend in)
- Customer Perception should score low if there is a significant gap between desired and actual perception
```

---

## Report Content Generation

### Chain 6: Priority Roadmap Generation

Generates the priority roadmap with offer matching. This is separate from scoring because it requires the user's Brand Engine offer data.

**Trigger:** After scoring completes, before report preview
**Model:** claude-sonnet
**Token budget:** ~1500 tokens

```
SYSTEM PROMPT — PRIORITY ROADMAP WITH OFFER MATCHING

You are generating a priority roadmap for a brand audit report. The roadmap must:

1. List gaps in priority order (critical → improvement → optimisation)
2. Match each gap to the user's actual service offerings where possible
3. For unmatched gaps, note them separately without recommending services the user does not offer
4. Write compelling but honest descriptions of how each offer addresses each gap

Audit scores:
{category_scores_with_ratings}

User's service offerings:
{brand_offers_with_tags}
// Each offer has: id, name, description, deliverables, pricing, service_tags

Tag-to-category mapping:
{
  "brand_foundation": ["branding", "strategy", "consulting"],
  "message_consistency": ["messaging", "branding", "content"],
  "visual_identity": ["design", "branding"],
  "digital_presence": ["website", "digital", "seo", "social"],
  "customer_perception": ["content", "social", "consulting"],
  "competitive_differentiation": ["strategy", "branding", "messaging"]
}

User's preference: Show pricing = {show_pricing: true/false}

Respond as JSON:
{
  "roadmap_items": [
    {
      "priority_order": 1,
      "priority_level": "critical",
      "category": "message_consistency",
      "gap_description": "Your messaging is inconsistent across platforms, creating confusion for potential customers...",
      "matched_offer": {
        "offer_id": "uuid",
        "offer_name": "Brand Strategy Package",
        "relevance_description": "This package includes a complete messaging framework that will align your brand voice across all touchpoints...",
        "key_deliverables": ["Messaging framework", "Brand voice guide", "Channel-specific copy templates"],
        "pricing": "R15,000" // only if show_pricing = true
      },
      "is_unmatched": false
    },
    {
      "priority_order": 5,
      "priority_level": "optimisation",
      "category": "digital_presence",
      "gap_description": "SEO basics are missing, limiting organic discoverability...",
      "matched_offer": null,
      "is_unmatched": true,
      "unmatched_note": "This area may require specialist SEO support. Discuss options with your strategist."
    }
  ]
}

Rules:
- Only match offers that genuinely address the gap (at least one service_tag overlap)
- If multiple offers match, select the most relevant one (most tag overlaps + best fit)
- Never fabricate offers or suggest services the user does not provide
- Unmatched gaps are OK — they demonstrate honesty and build trust
- Write offer relevance descriptions that sound natural, not salesy
- Order: Red categories first, then Amber, then Green items that could improve
```

---

## Offer Matching Engine

### Matching Algorithm (Server-Side Logic)

This runs before the AI prompt to pre-filter which offers could match which categories:

```javascript
// Pseudocode for offer matching pre-filter

const TAG_CATEGORY_MAP = {
  brand_foundation: ['branding', 'strategy', 'consulting'],
  message_consistency: ['messaging', 'branding', 'content'],
  visual_identity: ['design', 'branding'],
  digital_presence: ['website', 'digital', 'seo', 'social'],
  customer_perception: ['content', 'social', 'consulting'],
  competitive_differentiation: ['strategy', 'branding', 'messaging']
};

function findMatchingOffers(category, offers) {
  const relevantTags = TAG_CATEGORY_MAP[category];

  const matches = offers
    .map(offer => {
      const overlap = offer.service_tags.filter(tag => relevantTags.includes(tag));
      return {
        ...offer,
        relevance_score: overlap.length,
        matching_tags: overlap
      };
    })
    .filter(offer => offer.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score);

  return matches[0] || null; // Best match or null
}

// Run for each category that scored Red or Amber
function generateOfferMatches(auditScores, userOffers) {
  const matches = [];

  auditScores
    .sort((a, b) => a.score - b.score) // Worst first
    .forEach((categoryScore, index) => {
      const bestOffer = findMatchingOffers(categoryScore.category, userOffers);

      matches.push({
        priority_order: index + 1,
        priority_level: categoryScore.rating === 'red' ? 'critical' :
                        categoryScore.rating === 'amber' ? 'improvement' : 'optimisation',
        audit_category: categoryScore.category,
        offer_id: bestOffer?.id || null,
        is_unmatched: !bestOffer
      });
    });

  return matches;
}
```

---

## PDF Generation Architecture

### Technology Stack

- **Template engine:** HTML + CSS with dynamic variables
- **Renderer:** Puppeteer (headless Chromium) → PDF
- **Charts:** SVG rendered server-side (or Chart.js rendered in Puppeteer)
- **Storage:** Supabase Storage (PDF uploaded after generation)

### Brand Theming System

The PDF template uses CSS custom properties that are injected per-user:

```css
:root {
  /* Injected from user's brand profile */
  --brand-primary: {{primary_color}};
  --brand-secondary: {{secondary_color}};
  --brand-primary-light: {{primary_color_10_percent}};
  --brand-primary-dark: {{primary_color_darkened}};
  --brand-font-heading: {{font_heading}};
  --brand-font-body: {{font_body}};

  /* Fixed report styles */
  --report-bg: #FFFFFF;
  --report-text: #1A1A2E;
  --report-text-light: #6B7280;
  --report-border: #E5E7EB;
  --score-red: #EF4444;
  --score-amber: #F59E0B;
  --score-green: #10B981;
}
```

### Report Page Templates

Each page of the report is a separate HTML partial that gets assembled:

```
/templates/brand-audit-report/
├── _layout.html           # Base layout (header, footer, page numbers)
├── 01_cover.html           # Cover page
├── 02_executive_summary.html
├── 03_scoring_dashboard.html
├── 04_category_brand_foundation.html
├── 05_category_message_consistency.html
├── 06_category_visual_identity.html
├── 07_category_digital_presence.html
├── 08_category_customer_perception.html
├── 09_category_competitive_diff.html
├── 10_competitive_snapshot.html
├── 11_priority_roadmap.html
├── 12_about_next_steps.html
├── _components/
│   ├── score_gauge.html    # Circular score gauge (SVG)
│   ├── traffic_light.html  # Red/Amber/Green indicator
│   ├── radar_chart.html    # 6-axis radar chart (SVG)
│   ├── comparison_bar.html # Before/After comparison bar
│   └── offer_card.html     # Service offer card for roadmap
└── _styles/
    ├── report.css          # Core report styles
    ├── charts.css          # Chart/gauge styles
    └── print.css           # Print-specific overrides
```

### PDF Generation Pipeline

```javascript
// Pseudocode for PDF generation

async function generateBrandAuditPDF(auditId, userId) {
  // 1. Gather all data
  const audit = await getAuditWithScores(auditId);
  const contact = await getContact(audit.contact_id);
  const user = await getUser(userId);
  const brandProfile = await getBrandProfile(user.organization_id);
  const offers = await getOfferMatches(auditId);
  const reportSettings = audit.report_settings;

  // 2. Assemble template variables
  const templateVars = {
    // Brand theming
    primary_color: brandProfile.primary_color,
    secondary_color: brandProfile.secondary_color,
    logo_url: brandProfile.logo_url,
    font_heading: brandProfile.font_heading || 'Inter',
    font_body: brandProfile.font_body || 'Inter',
    agency_name: brandProfile.agency_name,
    agency_email: brandProfile.contact_email,
    agency_phone: brandProfile.contact_phone,
    agency_website: brandProfile.website_url,

    // Report content
    client_name: contact.company || `${contact.first_name} ${contact.last_name}`,
    report_date: formatDate(new Date()),
    prepared_by: user.full_name,
    overall_score: audit.overall_score,
    overall_rating: audit.overall_rating,
    executive_summary: audit.executive_summary,
    category_scores: audit.scores,
    roadmap_items: offers,
    show_pricing: reportSettings.show_pricing || false,

    // About page
    about_text: reportSettings.custom_about_text || brandProfile.default_about_text,
    cta_text: reportSettings.custom_cta_text || brandProfile.default_cta_text,
    cta_url: reportSettings.custom_cta_url || brandProfile.default_cta_url,

    // Comparison (if re-audit)
    is_reaudit: audit.is_reaudit,
    comparison_data: audit.comparison_data
  };

  // 3. Render HTML
  const html = await renderReportTemplate(templateVars);

  // 4. Generate PDF via Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await browser.close();

  // 5. Upload to Supabase Storage
  const filePath = `brand-audits/${audit.organization_id}/${auditId}/report-v${version}.pdf`;
  const { data: uploadData } = await supabase.storage
    .from('reports')
    .upload(filePath, pdfBuffer, { contentType: 'application/pdf' });

  // 6. Create report record
  const reportRecord = await supabase
    .from('brand_audit_reports')
    .insert({
      audit_id: auditId,
      organization_id: audit.organization_id,
      generated_by: userId,
      file_url: uploadData.path,
      file_size: pdfBuffer.length,
      page_count: estimatePageCount(templateVars),
      version: version,
      brand_snapshot: {
        primary_color: brandProfile.primary_color,
        secondary_color: brandProfile.secondary_color,
        logo_url: brandProfile.logo_url,
        // ... full snapshot
      },
      report_content: templateVars,
      credits_used: REPORT_GENERATION_CREDIT_COST
    });

  return reportRecord;
}
```

---

## API Endpoints

### Brand Audit CRUD

```
POST   /api/brand-audits                    # Create new audit
GET    /api/brand-audits                    # List audits (with filters)
GET    /api/brand-audits/:id               # Get audit with sections & scores
PATCH  /api/brand-audits/:id               # Update audit (status, settings)
DELETE /api/brand-audits/:id               # Soft delete (archive)

POST   /api/brand-audits/:id/sections      # Create/update a section
GET    /api/brand-audits/:id/sections      # Get all sections for an audit
PATCH  /api/brand-audits/:id/sections/:key # Update specific section

POST   /api/brand-audits/:id/generate      # Trigger AI scoring & analysis
GET    /api/brand-audits/:id/scores        # Get scores after generation

POST   /api/brand-audits/:id/report        # Generate PDF report
GET    /api/brand-audits/:id/reports       # List all report versions
GET    /api/brand-audits/:id/reports/:rid  # Get specific report (download URL)

POST   /api/brand-audits/:id/deliver       # Send report (email/link)
```

### Call Integration

```
POST   /api/calls/:callId/brand-audit      # Link a call to a brand audit
GET    /api/calls/:callId/extractions      # Get real-time extractions for a call
POST   /api/calls/:callId/extractions/process  # Trigger post-call extraction
```

### CRM Integration

```
GET    /api/contacts/:contactId/audits     # Get all audits for a contact
GET    /api/contacts/:contactId/audit-summary  # Get latest audit summary (widget data)
POST   /api/contacts/:contactId/audits/compare # Compare two audits
```

### Templates

```
GET    /api/brand-audit-templates          # List all available templates
GET    /api/brand-audit-templates/:id      # Get template details
POST   /api/brand-audit-templates          # Create custom template
PATCH  /api/brand-audit-templates/:id      # Update custom template
```

---

## Credit Consumption Model

| Action | Credits | When Consumed |
|--------|---------|---------------|
| Manual audit — input assistance (per section) | 5 | On "Save & Continue" with AI refinement |
| Website auto-analysis | 10 | When URL is submitted and analysis runs |
| Call-based extraction (real-time) | Included in call credits | During the call |
| Post-call extraction (comprehensive) | 15 | After call ends |
| AI scoring & analysis | 30 | On "Generate Audit" |
| Priority roadmap generation | 10 | After scoring, before preview |
| PDF report generation | 15 | On "Generate Report" |
| Report re-generation (after edits) | 10 | On subsequent "Generate Report" |

### Typical Total Costs

| Flow | Estimated Credits |
|------|-------------------|
| Manual audit (full wizard + scoring + report) | 80-100 |
| Call-based audit (call + extraction + scoring + report) | Call credits + 70-80 |
| Hybrid (call + manual gaps + scoring + report) | Call credits + 90-110 |
| Re-audit (using previous as baseline) | 60-80 |
| Report re-generation only (after edits) | 10 |

---

## Integration Points with Existing SkaleFlow

### Brand Engine Integration

| Integration | Direction | Description |
|-------------|-----------|-------------|
| **brand_offers** | Brand Engine → Audit | Audit reads offers + service_tags for roadmap matching |
| **brand_outputs** | Brand Engine → Audit | If the user has completed their own Brand Engine, the AI can reference their positioning/messaging framework when analysing audit results |
| **service_tags** (new column) | Audit → Brand Engine | User tags their offers in Brand Engine; tags used by audit matching |

### Call System Integration

| Integration | Direction | Description |
|-------------|-----------|-------------|
| **calls** table | Call → Audit | Audit links to call record via `call_id` |
| **call_templates** | Call → Audit | Brand Audit template stored in `brand_audit_templates` but follows same structure as existing `call_templates` |
| **call_transcripts** | Call → Audit | Transcript used for extraction; linked from audit for reference |
| **call_recordings** | Call → Audit | Recording accessible from audit record |
| **AI co-pilot** | Call ↔ Audit | During Brand Audit calls, the AI co-pilot uses the Brand Audit extraction rules instead of standard sales framework guidance |

### CRM Integration

| Integration | Direction | Description |
|-------------|-----------|-------------|
| **contacts** | CRM → Audit | Every audit links to a contact; contact data pre-populates Section 1 |
| **contact timeline** | Audit → CRM | Audit events appear on contact timeline |
| **contact card widget** | Audit → CRM | Latest audit summary displayed on contact card |
| **contact filters** | Audit → CRM | Filter contacts by audit score, rating, date |
| **crm_deals** | Audit → CRM | Audit can be linked to a deal (optional) for pipeline tracking |

### Credit System Integration

| Integration | Direction | Description |
|-------------|-----------|-------------|
| **credit balance** | System → Audit | Check sufficient credits before processing |
| **credit transactions** | Audit → System | Deduct credits at each consumption point |
| **credit history** | Audit → System | Log each deduction with audit_id reference |

---

## Build Sequence & Phases

### Phase 1: Foundation (Week 1-2)
- Database migrations (all tables, RLS, views)
- Brand audit CRUD API endpoints
- Manual wizard UI (same pattern as Brand Engine)
- Section save/resume functionality
- Link audit to CRM contact
- CRM contact card widget (basic — shows if audit exists)

### Phase 2: AI Scoring (Week 3)
- Input assistance prompts (Chain 1)
- Scoring engine prompts (Chain 5)
- AI scoring API endpoint
- Audit results view (scores, analysis, traffic lights)
- Credit deduction integration

### Phase 3: PDF Generation (Week 4)
- HTML report templates (all 12 pages)
- Brand theming system (CSS variables)
- Puppeteer PDF generation pipeline
- Report storage (Supabase)
- Report preview, generate, download flow
- About page configuration (one-time setup)

### Phase 4: Offer Matching (Week 5)
- Add service_tags to brand_offers
- Offer matching algorithm
- Priority roadmap AI prompt (Chain 6)
- Roadmap page in PDF template
- User override for offer matches

### Phase 5: Call Integration (Week 6-7)
- Brand Audit call template (seed data)
- Real-time extraction prompt (Chain 3)
- Post-call extraction prompt (Chain 4)
- Pre-populated audit review after call
- Hybrid flow (call + manual gap-filling)
- Call-to-audit linking

### Phase 6: Advanced Features (Week 8)
- Re-audit flow (comparison, before/after)
- Comparison page in PDF template
- Website auto-analysis (Chain 2)
- Report delivery (email, shareable link)
- Link view tracking
- CRM filtering by audit data

### Phase 7: Polish & Testing (Week 9-10)
- End-to-end testing (both entry points → report)
- PDF template refinement and design polish
- Credit model tuning
- Performance optimisation
- Edge case handling (incomplete data, failed AI calls, retry logic)

---

## Error Handling & Edge Cases

### AI Processing Failures

```javascript
// Retry logic for AI calls
const AI_RETRY_CONFIG = {
  maxRetries: 3,
  backoffMs: [1000, 3000, 5000],
  onFailure: 'partial_results' // Return whatever was processed
};

// If scoring fails mid-way:
// - Save completed category scores
// - Mark incomplete categories as "scoring_failed"
// - Allow user to retry scoring without re-entering data
// - Do NOT charge credits for failed scoring
```

### Insufficient Data

- If fewer than 5 sections are complete, scoring is blocked
- AI scoring prompt handles sparse data by scoring conservatively and noting data gaps
- PDF report includes a note: "This audit was completed with limited data in [X] categories. Re-running with more complete information may adjust scores."

### Brand Profile Not Configured

- If user hasn't set up their brand profile (logo, colours), block PDF generation
- Show: "Set up your brand profile to generate white-labelled reports"
- Link to brand profile settings
- Allow audit data entry and scoring without brand profile — only PDF requires it

### Concurrent Editing

- Section-level locking: If two team members edit the same audit, last-write-wins per section
- Audit-level locking during processing: While AI is scoring, no edits allowed
- Optimistic UI: Show "processing" state, disable edit buttons until complete
