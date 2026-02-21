'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SECTION_ORDER, SECTION_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditSectionKey } from '@/types/database';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  LockClosedIcon,
  LockOpenIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

/** Describes a single audit field in a section */
export interface AuditFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'list' | 'rating' | 'object';
}

/** Maps section keys → field definitions */
export const SECTION_FIELDS: Record<BrandAuditSectionKey, AuditFieldDef[]> = {
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

// ---- Helper: check if a field value is "filled"
function isFieldFilled(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

// ---- Section completion info
interface SectionInfo {
  section_key: BrandAuditSectionKey;
  is_complete: boolean;
  data: Record<string, unknown>;
}

interface AuditVariablePanelProps {
  sections: SectionInfo[];
  activeSection: BrandAuditSectionKey;
  onSectionChange: (key: BrandAuditSectionKey) => void;
  sectionData: Record<string, unknown>;
  onFieldUpdate?: (key: string, value: unknown) => void;
  /** Locked fields map — key is field key, value is whether it's locked */
  lockedFields?: Record<string, boolean>;
  onLockField?: (fieldKey: string) => void;
  onUnlockField?: (fieldKey: string) => void;
}

export function AuditVariablePanel({
  sections,
  activeSection,
  onSectionChange,
  sectionData,
  onFieldUpdate,
  lockedFields = {},
  onLockField,
  onUnlockField,
}: AuditVariablePanelProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sectionMap = new Map(sections.map(s => [s.section_key, s]));
  const currentIdx = SECTION_ORDER.indexOf(activeSection);
  const fields = SECTION_FIELDS[activeSection] || [];

  // Count filled fields for current section
  const filledCount = fields.filter(f => isFieldFilled(sectionData[f.key])).length;

  // Overall progress
  const totalFields = SECTION_ORDER.reduce((sum, key) => sum + (SECTION_FIELDS[key]?.length || 0), 0);
  const totalFilled = SECTION_ORDER.reduce((sum, key) => {
    const sec = sectionMap.get(key);
    const secData = sec?.data || {};
    const secFields = SECTION_FIELDS[key] || [];
    return sum + secFields.filter(f => isFieldFilled(secData[f.key])).length;
  }, 0);

  const handleStartEdit = (fieldKey: string) => {
    setEditValue(formatFieldValue(sectionData[fieldKey]));
    setEditingField(fieldKey);
  };

  const handleSaveEdit = (fieldKey: string) => {
    if (onFieldUpdate) {
      onFieldUpdate(fieldKey, editValue);
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section nav dropdown */}
      <div className="mb-4">
        <div className="relative">
          <select
            value={activeSection}
            onChange={(e) => onSectionChange(e.target.value as BrandAuditSectionKey)}
            className="w-full appearance-none bg-white border border-stone/20 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            {SECTION_ORDER.map((key, idx) => {
              const sec = sectionMap.get(key);
              const complete = sec?.is_complete || false;
              return (
                <option key={key} value={key}>
                  {idx + 1}. {SECTION_LABELS[key]} {complete ? '\u2713' : ''}
                </option>
              );
            })}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
        </div>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center justify-between text-xs text-stone mb-3">
        <span>Section {currentIdx + 1} of {SECTION_ORDER.length}</span>
        <span>{totalFilled}/{totalFields} fields</span>
      </div>
      <div className="h-1.5 bg-stone/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-teal rounded-full transition-all duration-300"
          style={{ width: totalFields > 0 ? `${(totalFilled / totalFields) * 100}%` : '0%' }}
        />
      </div>

      {/* Current section card */}
      <div className="border-l-4 border-teal bg-teal/5 rounded-r-lg p-3 mb-4">
        <h3 className="text-sm font-semibold text-charcoal">{SECTION_LABELS[activeSection]}</h3>
        <p className="text-xs text-stone mt-0.5">
          {filledCount}/{fields.length} fields completed
        </p>
      </div>

      {/* Variable cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {fields.map((field) => {
          const value = sectionData[field.key];
          const filled = isFieldFilled(value);
          const locked = lockedFields[field.key] || false;
          const isEditing = editingField === field.key;

          return (
            <div
              key={field.key}
              className={cn(
                'rounded-lg p-3 transition-all duration-200',
                isEditing
                  ? 'bg-cream-warm border border-teal/20'
                  : !filled
                    ? 'border border-dashed border-stone/20 bg-cream-warm'
                    : locked
                      ? 'bg-teal/5 border border-teal/15'
                      : 'bg-cream-warm border border-stone/10'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-charcoal">{field.label}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(field.key)}
                        className="p-1 rounded text-teal hover:bg-teal/10 transition-colors"
                        title="Save"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 rounded text-stone hover:bg-stone/10 transition-colors"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : locked ? (
                    onUnlockField && (
                      <button
                        onClick={() => onUnlockField(field.key)}
                        className="p-1 rounded text-teal hover:bg-teal/10 transition-colors"
                        title="Unlock"
                      >
                        <LockClosedIcon className="w-3.5 h-3.5" />
                      </button>
                    )
                  ) : (
                    <>
                      {filled && onFieldUpdate && (
                        <button
                          onClick={() => handleStartEdit(field.key)}
                          className="p-1 rounded text-stone hover:text-teal hover:bg-teal/10 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {filled && onLockField && (
                        <button
                          onClick={() => onLockField(field.key)}
                          className="p-1 rounded text-stone hover:text-charcoal hover:bg-stone/10 transition-colors"
                          title="Lock"
                        >
                          <LockOpenIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-stone/15 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-teal/30 bg-cream-warm"
                    autoFocus
                  />
                </div>
              ) : !filled ? (
                <p className="text-xs text-stone/50 mt-1.5 italic">Awaiting input</p>
              ) : (
                <p className="text-xs text-charcoal/70 mt-1.5 line-clamp-2 whitespace-pre-wrap">
                  {formatFieldValue(value)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom section completion */}
      <div className="pt-3 mt-3 border-t border-stone/10 flex items-center gap-2 text-xs text-stone">
        {sectionMap.get(activeSection)?.is_complete ? (
          <>
            <CheckCircleSolid className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium">Section complete</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="w-4 h-4" />
            <span>{filledCount} of {fields.length} fields filled</span>
          </>
        )}
      </div>
    </div>
  );
}
