'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FORMAT_LABELS, type ContentFormat, getFormatCategory } from '@/config/script-frameworks';
import type { ContentStatus, FunnelStage, StoryBrandStage } from '@/types/database';

export interface ContentFilters {
  status: ContentStatus | '';
  funnel: FunnelStage | '';
  storybrand: StoryBrandStage | '';
  formatCategory: string; // 'short' | 'medium' | 'long' | 'carousel' | 'static' | ''
  platform: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: ContentFilters = {
  status: '',
  funnel: '',
  storybrand: '',
  formatCategory: '',
  platform: '',
  dateFrom: '',
  dateTo: '',
};

const STATUSES: Array<{ value: ContentStatus; label: string }> = [
  { value: 'idea', label: 'Idea' },
  { value: 'scripted', label: 'Scripted' },
  { value: 'pending_review', label: 'In Review' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'filming', label: 'Filming' },
  { value: 'filmed', label: 'Filmed' },
  { value: 'designing', label: 'Designing' },
  { value: 'designed', label: 'Designed' },
  { value: 'editing', label: 'Editing' },
  { value: 'edited', label: 'Edited' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
];

const FORMAT_CATEGORIES = [
  { value: 'short', label: 'Short Video' },
  { value: 'medium', label: 'Medium Video' },
  { value: 'long', label: 'Long Video' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'static', label: 'Static' },
];

const PLATFORMS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];

const FUNNELS: Array<{ value: FunnelStage; label: string }> = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'consideration', label: 'Consideration' },
  { value: 'conversion', label: 'Conversion' },
];

const STORYBRAND_STAGES: Array<{ value: StoryBrandStage; label: string }> = [
  { value: 'character', label: 'Character' },
  { value: 'external_problem', label: 'External Problem' },
  { value: 'internal_problem', label: 'Internal Problem' },
  { value: 'philosophical_problem', label: 'Philosophical Problem' },
  { value: 'guide', label: 'Guide' },
  { value: 'plan', label: 'Plan' },
  { value: 'call_to_action', label: 'Call to Action' },
  { value: 'failure', label: 'Failure' },
  { value: 'success', label: 'Success' },
];

interface ContentFilterBarProps {
  filters: ContentFilters;
  onChange: (filters: ContentFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export function ContentFilterBar({ filters, onChange, totalCount, filteredCount }: ContentFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    filters.status,
    filters.funnel,
    filters.storybrand,
    filters.formatCategory,
    filters.platform,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const hasFilters = activeFilterCount > 0;

  const update = (partial: Partial<ContentFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const clearAll = () => {
    onChange(EMPTY_FILTERS);
  };

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10">
      {/* Toggle bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              showFilters || hasFilters ? 'bg-teal/10 text-teal' : 'text-stone hover:bg-cream'
            )}
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-teal text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasFilters && (
            <>
              <span className="text-xs text-stone">
                Showing {filteredCount} of {totalCount} posts
              </span>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
              >
                <XMarkIcon className="w-3 h-3" />
                Clear all
              </button>
            </>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.status && (
              <FilterChip
                label={STATUSES.find(s => s.value === filters.status)?.label || filters.status}
                onRemove={() => update({ status: '' })}
              />
            )}
            {filters.funnel && (
              <FilterChip
                label={FUNNELS.find(f => f.value === filters.funnel)?.label || filters.funnel}
                onRemove={() => update({ funnel: '' })}
              />
            )}
            {filters.storybrand && (
              <FilterChip
                label={STORYBRAND_STAGES.find(s => s.value === filters.storybrand)?.label || filters.storybrand}
                onRemove={() => update({ storybrand: '' })}
              />
            )}
            {filters.formatCategory && (
              <FilterChip
                label={FORMAT_CATEGORIES.find(f => f.value === filters.formatCategory)?.label || filters.formatCategory}
                onRemove={() => update({ formatCategory: '' })}
              />
            )}
            {filters.platform && (
              <FilterChip
                label={filters.platform}
                onRemove={() => update({ platform: '' })}
              />
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <FilterChip
                label={`${filters.dateFrom || '...'} to ${filters.dateTo || '...'}`}
                onRemove={() => update({ dateFrom: '', dateTo: '' })}
              />
            )}
          </div>
        )}
      </div>

      {/* Filter controls */}
      {showFilters && (
        <div className="px-4 py-3 border-t border-stone/10 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-stone mb-1">Status</label>
            <select
              value={filters.status}
              onChange={e => update({ status: e.target.value as ContentStatus | '' })}
              className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm bg-cream-warm min-w-[140px]"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone mb-1">Funnel Stage</label>
            <select
              value={filters.funnel}
              onChange={e => update({ funnel: e.target.value as FunnelStage | '' })}
              className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm bg-cream-warm min-w-[140px]"
            >
              <option value="">All Stages</option>
              {FUNNELS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone mb-1">StoryBrand Stage</label>
            <select
              value={filters.storybrand}
              onChange={e => update({ storybrand: e.target.value as StoryBrandStage | '' })}
              className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm bg-cream-warm min-w-[140px]"
            >
              <option value="">All StoryBrand</option>
              {STORYBRAND_STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone mb-1">Content Type</label>
            <select
              value={filters.formatCategory}
              onChange={e => update({ formatCategory: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm bg-cream-warm min-w-[140px]"
            >
              <option value="">All Types</option>
              {FORMAT_CATEGORIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone mb-1">Platform</label>
            <select
              value={filters.platform}
              onChange={e => update({ platform: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm bg-cream-warm min-w-[140px]"
            >
              <option value="">All Platforms</option>
              {PLATFORMS.map(p => (
                <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => update({ dateFrom: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm bg-cream-warm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => update({ dateTo: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm bg-cream-warm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal/10 text-teal text-xs font-medium capitalize">
      {label}
      <button onClick={onRemove} className="hover:text-teal/70">
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  );
}

// Helper function to apply filters to items
export function applyContentFilters<T extends {
  status: string;
  funnel_stage: string;
  storybrand_stage: string;
  format: string;
  platforms: string[];
  scheduled_date: string;
}>(items: T[], filters: ContentFilters): T[] {
  let result = items;

  if (filters.status) {
    result = result.filter(i => i.status === filters.status);
  }

  if (filters.funnel) {
    result = result.filter(i => i.funnel_stage === filters.funnel);
  }

  if (filters.storybrand) {
    result = result.filter(i => i.storybrand_stage === filters.storybrand);
  }

  if (filters.formatCategory) {
    result = result.filter(i => {
      try {
        return getFormatCategory(i.format as ContentFormat) === filters.formatCategory;
      } catch {
        return false;
      }
    });
  }

  if (filters.platform) {
    result = result.filter(i => i.platforms.includes(filters.platform));
  }

  if (filters.dateFrom) {
    result = result.filter(i => i.scheduled_date >= filters.dateFrom);
  }

  if (filters.dateTo) {
    result = result.filter(i => i.scheduled_date <= filters.dateTo);
  }

  return result;
}

export { EMPTY_FILTERS };
