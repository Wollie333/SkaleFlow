/**
 * Field registry — maps all audit fields across 8 sections.
 * Used by copilot extraction and progress tracking.
 */

import type { BrandAuditSectionKey } from '@/types/database';
import { SECTION_ORDER } from './types';

export interface AuditFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'list' | 'rating' | 'object';
}

export const AUDIT_FIELD_REGISTRY: Record<BrandAuditSectionKey, AuditFieldDef[]> = {
  company_overview: [
    { key: 'business_name', label: 'Business Name', type: 'text' },
    { key: 'industry', label: 'Industry', type: 'text' },
    { key: 'years_in_business', label: 'Years in Business', type: 'number' },
    { key: 'business_model', label: 'Business Model', type: 'text' },
    { key: 'target_market', label: 'Target Market', type: 'text' },
    { key: 'employee_count', label: 'Employee Count', type: 'select' },
    { key: 'annual_revenue_range', label: 'Annual Revenue Range', type: 'select' },
    { key: 'website_url', label: 'Website URL', type: 'text' },
    { key: 'social_media_links', label: 'Social Media Links', type: 'object' },
  ],
  brand_foundation: [
    { key: 'mission_statement', label: 'Mission Statement', type: 'textarea' },
    { key: 'vision_statement', label: 'Vision Statement', type: 'textarea' },
    { key: 'core_values', label: 'Core Values', type: 'list' },
    { key: 'brand_personality', label: 'Brand Personality', type: 'list' },
    { key: 'brand_promise', label: 'Brand Promise', type: 'textarea' },
    { key: 'brand_archetype', label: 'Brand Archetype', type: 'text' },
    { key: 'unique_value_proposition', label: 'Unique Value Proposition', type: 'textarea' },
  ],
  visual_identity: [
    { key: 'has_professional_logo', label: 'Professional Logo', type: 'boolean' },
    { key: 'logo_quality_notes', label: 'Logo Quality Notes', type: 'textarea' },
    { key: 'primary_colors', label: 'Primary Colors', type: 'list' },
    { key: 'secondary_colors', label: 'Secondary Colors', type: 'list' },
    { key: 'typography_notes', label: 'Typography Notes', type: 'textarea' },
    { key: 'brand_guidelines_exist', label: 'Brand Guidelines Exist', type: 'boolean' },
    { key: 'consistency_rating', label: 'Visual Consistency', type: 'rating' },
    { key: 'visual_identity_notes', label: 'Visual Identity Notes', type: 'textarea' },
  ],
  messaging: [
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'elevator_pitch', label: 'Elevator Pitch', type: 'textarea' },
    { key: 'key_messages', label: 'Key Messages', type: 'list' },
    { key: 'tone_of_voice', label: 'Tone of Voice', type: 'text' },
    { key: 'brand_story', label: 'Brand Story', type: 'textarea' },
    { key: 'messaging_consistency_notes', label: 'Messaging Consistency Notes', type: 'textarea' },
  ],
  digital_presence: [
    { key: 'website_quality', label: 'Website Quality', type: 'rating' },
    { key: 'website_last_updated', label: 'Website Last Updated', type: 'text' },
    { key: 'seo_rating', label: 'SEO Rating', type: 'rating' },
    { key: 'social_platforms', label: 'Social Platforms', type: 'list' },
    { key: 'social_engagement_notes', label: 'Social Engagement Notes', type: 'textarea' },
    { key: 'content_strategy_exists', label: 'Content Strategy Exists', type: 'boolean' },
    { key: 'paid_advertising', label: 'Paid Advertising', type: 'boolean' },
    { key: 'advertising_notes', label: 'Advertising Notes', type: 'textarea' },
    { key: 'email_marketing', label: 'Email Marketing', type: 'boolean' },
  ],
  customer_experience: [
    { key: 'customer_journey_defined', label: 'Customer Journey Defined', type: 'boolean' },
    { key: 'customer_journey_notes', label: 'Customer Journey Notes', type: 'textarea' },
    { key: 'feedback_collection_method', label: 'Feedback Collection Method', type: 'text' },
    { key: 'nps_score', label: 'NPS Score', type: 'number' },
    { key: 'review_rating', label: 'Review Rating', type: 'rating' },
    { key: 'review_count', label: 'Review Count', type: 'number' },
    { key: 'complaint_handling_process', label: 'Complaint Handling Process', type: 'textarea' },
    { key: 'customer_retention_notes', label: 'Customer Retention Notes', type: 'textarea' },
  ],
  competitive_landscape: [
    { key: 'competitors', label: 'Competitors', type: 'object' },
    { key: 'competitive_advantages', label: 'Competitive Advantages', type: 'list' },
    { key: 'market_position', label: 'Market Position', type: 'textarea' },
    { key: 'industry_trends', label: 'Industry Trends', type: 'textarea' },
    { key: 'threats', label: 'Threats', type: 'textarea' },
    { key: 'opportunities', label: 'Opportunities', type: 'textarea' },
  ],
  goals_challenges: [
    { key: 'short_term_goals', label: 'Short-Term Goals', type: 'list' },
    { key: 'long_term_goals', label: 'Long-Term Goals', type: 'list' },
    { key: 'biggest_challenge', label: 'Biggest Challenge', type: 'textarea' },
    { key: 'budget_range', label: 'Budget Range', type: 'text' },
    { key: 'timeline', label: 'Timeline', type: 'text' },
    { key: 'additional_notes', label: 'Additional Notes', type: 'textarea' },
  ],
};

/** Get fields for a specific section */
export function getFieldsForSection(sectionKey: BrandAuditSectionKey): AuditFieldDef[] {
  return AUDIT_FIELD_REGISTRY[sectionKey] || [];
}

/** Get all field keys across all sections */
export function getAllFieldKeys(): string[] {
  const keys: string[] = [];
  for (const sectionKey of SECTION_ORDER) {
    for (const field of AUDIT_FIELD_REGISTRY[sectionKey]) {
      keys.push(`${sectionKey}.${field.key}`);
    }
  }
  return keys;
}

/** Check if a value is considered "filled" */
function isFieldFilled(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

interface SectionData {
  section_key: BrandAuditSectionKey;
  data: Record<string, unknown>;
}

interface AuditProgress {
  filled: number;
  total: number;
  bySection: Record<BrandAuditSectionKey, { filled: number; total: number }>;
}

/** Calculate progress across all audit sections */
export function getProgressForAudit(sections: SectionData[]): AuditProgress {
  const sectionMap = new Map(sections.map(s => [s.section_key, s]));
  let filled = 0;
  let total = 0;
  const bySection = {} as Record<BrandAuditSectionKey, { filled: number; total: number }>;

  for (const sectionKey of SECTION_ORDER) {
    const fields = AUDIT_FIELD_REGISTRY[sectionKey];
    const sectionData = sectionMap.get(sectionKey)?.data || {};
    const sectionFilled = fields.filter(f => isFieldFilled(sectionData[f.key])).length;

    bySection[sectionKey] = { filled: sectionFilled, total: fields.length };
    filled += sectionFilled;
    total += fields.length;
  }

  return { filled, total, bySection };
}

/** Get unfilled fields for a section — useful for copilot guidance */
export function getUnfilledFields(sectionKey: BrandAuditSectionKey, data: Record<string, unknown>): AuditFieldDef[] {
  const fields = AUDIT_FIELD_REGISTRY[sectionKey];
  return fields.filter(f => !isFieldFilled(data[f.key]));
}

/** Find which section a field key belongs to */
export function findSectionForField(fieldKey: string): BrandAuditSectionKey | null {
  for (const sectionKey of SECTION_ORDER) {
    const fields = AUDIT_FIELD_REGISTRY[sectionKey];
    if (fields.some(f => f.key === fieldKey)) {
      return sectionKey;
    }
  }
  return null;
}
