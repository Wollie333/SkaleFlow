'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import type { SocialPlatform, ContentStatus, FunnelStage } from '@/types/database';

export interface CalendarFilters {
  platforms: SocialPlatform[];
  status: ContentStatus[];
  funnelStage: FunnelStage[];
  assignedTo: string[];
  campaign: string | null;
  tags: string[];
  searchQuery: string;
}

interface CalendarFilterBarProps {
  filters: CalendarFilters;
  onChange: (filters: CalendarFilters) => void;
  campaigns?: Array<{ id: string; name: string }>;
  teamMembers?: Array<{ id: string; name: string }>;
  availableTags?: string[];
}

const PLATFORMS: Array<{ value: SocialPlatform; label: string }> = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
];

const STATUSES: Array<{ value: ContentStatus; label: string }> = [
  { value: 'idea', label: 'Idea' },
  { value: 'scripted', label: 'Scripted' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
];

const FUNNEL_STAGES: Array<{ value: FunnelStage; label: string; color: string }> = [
  { value: 'awareness', label: 'Awareness', color: 'bg-green-500/10 text-green-400 border-green-200' },
  { value: 'consideration', label: 'Consideration', color: 'bg-blue-500/10 text-blue-400 border-blue-200' },
  { value: 'conversion', label: 'Conversion', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

export function CalendarFilterBar({
  filters,
  onChange,
  campaigns = [],
  teamMembers = [],
  availableTags = [],
}: CalendarFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const togglePlatform = (platform: SocialPlatform) => {
    const next = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform];
    onChange({ ...filters, platforms: next });
  };

  const toggleStatus = (status: ContentStatus) => {
    const next = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onChange({ ...filters, status: next });
  };

  const toggleFunnelStage = (stage: FunnelStage) => {
    const next = filters.funnelStage.includes(stage)
      ? filters.funnelStage.filter(s => s !== stage)
      : [...filters.funnelStage, stage];
    onChange({ ...filters, funnelStage: next });
  };

  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onChange({ ...filters, tags: next });
  };

  const clearAllFilters = () => {
    onChange({
      platforms: [],
      status: [],
      funnelStage: [],
      assignedTo: [],
      campaign: null,
      tags: [],
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filters.platforms.length > 0 ||
    filters.status.length > 0 ||
    filters.funnelStage.length > 0 ||
    filters.assignedTo.length > 0 ||
    filters.campaign ||
    filters.tags.length > 0 ||
    filters.searchQuery;

  const activeFilterCount =
    filters.platforms.length +
    filters.status.length +
    filters.funnelStage.length +
    filters.assignedTo.length +
    (filters.campaign ? 1 : 0) +
    filters.tags.length +
    (filters.searchQuery ? 1 : 0);

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FunnelIcon className="w-5 h-5 text-teal" />
          <span className="font-medium text-charcoal">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-teal/10 text-teal text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
        </div>
        <span className="text-sm text-stone">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {/* Filter Options */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-stone/10 pt-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by topic, caption, or keywords..."
              value={filters.searchQuery}
              onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => togglePlatform(value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                    filters.platforms.includes(value)
                      ? 'bg-teal text-white border-teal'
                      : 'bg-cream-warm text-stone border-stone/20 hover:border-teal hover:text-teal'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleStatus(value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                    filters.status.includes(value)
                      ? 'bg-teal text-white border-teal'
                      : 'bg-cream-warm text-stone border-stone/20 hover:border-teal hover:text-teal'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Funnel Stage */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Funnel Stage
            </label>
            <div className="flex flex-wrap gap-2">
              {FUNNEL_STAGES.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => toggleFunnelStage(value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                    filters.funnelStage.includes(value)
                      ? 'ring-2 ring-teal ring-offset-2'
                      : '',
                    color
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign */}
          {campaigns.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Campaign
              </label>
              <select
                value={filters.campaign || ''}
                onChange={(e) => onChange({ ...filters, campaign: e.target.value || null })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              >
                <option value="">All Campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      filters.tags.includes(tag)
                        ? 'bg-teal text-white border-teal'
                        : 'bg-cream-warm text-stone border-stone/20 hover:border-teal hover:text-teal'
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear All */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-stone/10">
              <button
                onClick={clearAllFilters}
                className="text-sm text-teal hover:text-teal-dark font-medium flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filter Chips (always visible when filters applied) */}
      {hasActiveFilters && !isExpanded && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {filters.platforms.map((platform) => (
            <span
              key={platform}
              className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal text-xs rounded-full"
            >
              {PLATFORMS.find(p => p.value === platform)?.label}
              <button
                onClick={() => togglePlatform(platform)}
                className="hover:bg-teal/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          {filters.status.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal text-xs rounded-full"
            >
              {STATUSES.find(s => s.value === status)?.label}
              <button
                onClick={() => toggleStatus(status)}
                className="hover:bg-teal/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          {filters.funnelStage.map((stage) => (
            <span
              key={stage}
              className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal text-xs rounded-full"
            >
              {FUNNEL_STAGES.find(s => s.value === stage)?.label}
              <button
                onClick={() => toggleFunnelStage(stage)}
                className="hover:bg-teal/20 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
