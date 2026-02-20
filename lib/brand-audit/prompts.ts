/**
 * Brand Audit AI prompt chains.
 */

import type { BrandAuditSectionKey, BrandAuditCategory } from '@/types/database';
import { SECTION_LABELS, CATEGORY_LABELS, CATEGORY_WEIGHTS, CATEGORY_SOURCE_SECTIONS } from './types';

/** Chain 1: Input refinement — refines user's rough section data */
export function buildInputRefinementPrompt(
  sectionKey: BrandAuditSectionKey,
  rawData: Record<string, unknown>,
  businessContext: string
): string {
  return `You are a brand strategist reviewing audit data for the "${SECTION_LABELS[sectionKey]}" section.

Business context: ${businessContext}

Raw input data:
${JSON.stringify(rawData, null, 2)}

Your job:
1. Refine and improve the data — fix typos, expand abbreviations, make descriptions more professional
2. Identify any gaps or missing information that would strengthen the audit
3. Suggest 2-3 follow-up questions to gather more detail

Return JSON:
{
  "refined_data": { ...improved version of the input data },
  "gaps": ["list of missing or weak areas"],
  "suggestions": ["follow-up questions to ask"]
}`;
}

/** Chain 2: Website analysis — auto-enrichment from website */
export function buildWebsiteAnalysisPrompt(websiteContent: string, businessContext: string): string {
  return `You are a brand analyst evaluating a business website for a brand audit.

Business context: ${businessContext}

Website content (extracted text):
${websiteContent.slice(0, 8000)}

Analyze the website and extract data that maps to these audit sections:
1. Company Overview — business model, target market, industry signals
2. Brand Foundation — mission, values, brand promise visible on site
3. Visual Identity — logo quality, colour consistency, typography, imagery quality
4. Messaging — tagline, key messages, tone of voice, clarity
5. Digital Presence — website quality (1-5), mobile responsiveness, load speed impression, SEO signals
6. Customer Experience — testimonials, reviews, contact options, support accessibility

Return JSON with section keys mapping to extracted data:
{
  "company_overview": { ... },
  "brand_foundation": { ... },
  "visual_identity": { ... },
  "messaging": { ... },
  "digital_presence": { ... },
  "customer_experience": { ... },
  "overall_website_assessment": "brief 2-3 sentence assessment"
}`;
}

/** Chain 3: Real-time call extraction — per-turn during live call */
export function buildCallExtractionPrompt(
  recentTranscript: string,
  existingSectionData: Record<string, Record<string, unknown>>,
  currentPhase: string
): string {
  return `You are extracting brand audit data from a live discovery call.

Current call phase: ${currentPhase}
Recent dialogue:
${recentTranscript}

Previously extracted data (summarised):
${JSON.stringify(Object.keys(existingSectionData).filter(k => Object.keys(existingSectionData[k]).length > 0))}

Extract any new brand audit data from this dialogue segment. Map to audit sections:
- company_overview, brand_foundation, visual_identity, messaging, digital_presence, customer_experience, competitive_landscape, goals_challenges

Return JSON:
{
  "extractions": [
    {
      "section_key": "...",
      "field": "field_name",
      "value": "extracted value",
      "confidence": 0.0-1.0
    }
  ]
}

Only return data you are confident about. Use confidence < 0.6 for implied/inferred data.`;
}

/** Chain 4: Post-call extraction — comprehensive extraction from full transcript */
export function buildPostCallExtractionPrompt(fullTranscript: string, businessContext: string): string {
  return `You are a brand strategist reviewing a full call transcript to extract brand audit data.

Business context: ${businessContext}

Full call transcript:
${fullTranscript.slice(0, 15000)}

Extract comprehensive data for all 8 brand audit sections. For each section, extract as much data as possible from the conversation.

Return JSON with all 8 section keys:
{
  "company_overview": {
    "business_name": "...", "industry": "...", "years_in_business": N, "business_model": "...",
    "target_market": "...", "employee_count": "...", "annual_revenue_range": "...", "website_url": "..."
  },
  "brand_foundation": {
    "mission_statement": "...", "vision_statement": "...", "core_values": [...],
    "brand_personality": [...], "brand_promise": "...", "unique_value_proposition": "..."
  },
  "visual_identity": {
    "has_professional_logo": true/false, "brand_guidelines_exist": true/false,
    "consistency_rating": 1-5, "visual_identity_notes": "..."
  },
  "messaging": {
    "tagline": "...", "elevator_pitch": "...", "key_messages": [...],
    "tone_of_voice": "...", "brand_story": "..."
  },
  "digital_presence": {
    "website_quality": 1-5, "seo_rating": 1-5, "social_platforms": [...],
    "content_strategy_exists": true/false, "paid_advertising": true/false
  },
  "customer_experience": {
    "customer_journey_defined": true/false, "customer_journey_notes": "...",
    "feedback_collection_method": "...", "review_rating": N, "review_count": N
  },
  "competitive_landscape": {
    "competitors": [{"name": "...", "strengths": "...", "weaknesses": "..."}],
    "competitive_advantages": [...], "market_position": "..."
  },
  "goals_challenges": {
    "short_term_goals": [...], "long_term_goals": [...],
    "biggest_challenge": "...", "budget_range": "...", "timeline": "..."
  },
  "extraction_confidence": {
    "company_overview": 0.0-1.0,
    "brand_foundation": 0.0-1.0,
    ...per section
  }
}

Only include fields where you found relevant data. Leave fields as null if not discussed.`;
}

/** Chain 5: Category scoring — scores 6 categories */
export function buildScoringPrompt(sectionData: Record<string, Record<string, unknown>>): string {
  const categoryDescriptions = Object.entries(CATEGORY_SOURCE_SECTIONS)
    .map(([cat, sections]) => {
      const catLabel = CATEGORY_LABELS[cat as BrandAuditCategory];
      const weight = CATEGORY_WEIGHTS[cat as BrandAuditCategory];
      const sectionLabels = sections.map(s => SECTION_LABELS[s]).join(', ');
      const relevantData = sections.reduce((acc, s) => {
        if (sectionData[s]) acc[s] = sectionData[s];
        return acc;
      }, {} as Record<string, Record<string, unknown>>);
      return `## ${catLabel} (weight: ${(weight * 100).toFixed(0)}%)
Source sections: ${sectionLabels}
Data: ${JSON.stringify(relevantData, null, 2)}`;
    })
    .join('\n\n');

  return `You are an expert brand auditor scoring a business across 6 categories.

Score each category 0-100 based on the data provided. Be honest and fair.

Scoring guidelines:
- 0-39 = Red (Critical gaps, significant work needed)
- 40-69 = Amber (Some elements present but inconsistent or incomplete)
- 70-100 = Green (Strong, well-established, minor improvements possible)

${categoryDescriptions}

For each category, provide:
1. score (0-100, integer)
2. rating ("red", "amber", or "green")
3. analysis (2-3 paragraphs explaining the score)
4. key_finding (one sentence — the most important observation)
5. actionable_insight (one sentence — the most impactful thing they should do)

Also provide:
- overall_score: weighted average using the weights above
- overall_rating: based on overall_score thresholds
- executive_summary: 3-4 paragraphs summarising the brand's overall health

Return JSON:
{
  "categories": {
    "brand_foundation": { "score": N, "rating": "...", "analysis": "...", "key_finding": "...", "actionable_insight": "..." },
    "message_consistency": { ... },
    "visual_identity": { ... },
    "digital_presence": { ... },
    "customer_perception": { ... },
    "competitive_differentiation": { ... }
  },
  "overall_score": N,
  "overall_rating": "...",
  "executive_summary": "..."
}`;
}

/** Chain 6: Roadmap generation — matches gaps to offers */
export function buildRoadmapPrompt(
  scores: Array<{ category: string; score: number; rating: string; actionable_insight: string | null }>,
  offers: Array<{ id: string; name: string; description: string | null; service_tags: string[]; price_display: string | null }>
): string {
  return `You are creating a prioritised improvement roadmap based on brand audit scores.

Audit scores (sorted by priority — lowest scores first):
${scores.map(s => `- ${CATEGORY_LABELS[s.category as BrandAuditCategory]}: ${s.score}/100 (${s.rating}) — ${s.actionable_insight || 'No specific insight'}`).join('\n')}

Available service offers:
${offers.map(o => `- "${o.name}" [tags: ${o.service_tags.join(', ')}] — ${o.description || 'No description'}`).join('\n')}

For each audit category (prioritised by lowest score first), match the most relevant offer and explain why it addresses the gap.

Return JSON:
{
  "roadmap": [
    {
      "category": "brand_foundation",
      "priority": 1,
      "offer_name": "matching offer name",
      "relevance_description": "2-3 sentences explaining how this service addresses the identified gap"
    },
    ...
  ]
}

Only match offers that genuinely address the gap. If no offer fits a category, set offer_name to null.`;
}
