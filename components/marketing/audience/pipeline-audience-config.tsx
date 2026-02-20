'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface PipelineAudienceConfigProps {
  organizationId: string;
  onCreateAudience: (data: any) => void;
}

interface Pipeline {
  id: string;
  name: string;
}

interface Stage {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export function PipelineAudienceConfig({
  organizationId,
  onCreateAudience,
}: PipelineAudienceConfigProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [platform, setPlatform] = useState<'meta' | 'tiktok'>('meta');
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [audienceName, setAudienceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minAudienceSize = platform === 'meta' ? 100 : 1000;

  // Fetch pipelines
  useEffect(() => {
    async function fetchPipelines() {
      try {
        const res = await fetch('/api/pipeline');
        if (res.ok) {
          const data = await res.json();
          setPipelines(data.pipelines || data || []);
        }
      } catch (err) {
        console.error('Failed to fetch pipelines:', err);
      }
    }
    fetchPipelines();
  }, []);

  // Fetch stages and tags when pipeline changes
  useEffect(() => {
    if (!selectedPipelineId) {
      setStages([]);
      setTags([]);
      setSelectedStages([]);
      setSelectedTags([]);
      setEstimatedSize(null);
      return;
    }

    async function fetchPipelineData() {
      setIsLoading(true);
      try {
        const [stagesRes, tagsRes] = await Promise.all([
          fetch(`/api/pipeline/${selectedPipelineId}/stages`),
          fetch('/api/pipeline/tags'),
        ]);

        if (stagesRes.ok) {
          const stagesData = await stagesRes.json();
          setStages(stagesData.stages || stagesData || []);
        }
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData.tags || tagsData || []);
        }
      } catch (err) {
        console.error('Failed to fetch pipeline data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPipelineData();
  }, [selectedPipelineId]);

  // Estimate audience size when selections change
  useEffect(() => {
    if (!selectedPipelineId) {
      setEstimatedSize(null);
      return;
    }

    async function estimateSize() {
      try {
        const params = new URLSearchParams({
          pipelineId: selectedPipelineId,
        });
        if (selectedStages.length > 0) {
          params.set('stageIds', selectedStages.join(','));
        }
        if (selectedTags.length > 0) {
          params.set('tagIds', selectedTags.join(','));
        }
        const res = await fetch(`/api/pipeline/${selectedPipelineId}/contacts?${params.toString()}&countOnly=true`);
        if (res.ok) {
          const data = await res.json();
          setEstimatedSize(data.count || data.total || 0);
        }
      } catch {
        setEstimatedSize(null);
      }
    }
    estimateSize();
  }, [selectedPipelineId, selectedStages, selectedTags]);

  const toggleStage = (stageId: string) => {
    setSelectedStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const data = {
        name: audienceName,
        organization_id: organizationId,
        platform,
        audience_type: 'custom',
        source: 'pipeline',
        pipeline_id: selectedPipelineId,
        stage_ids: selectedStages.length > 0 ? selectedStages : null,
        tag_ids: selectedTags.length > 0 ? selectedTags : null,
        approximate_size: estimatedSize,
      };
      onCreateAudience(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create audience');
    } finally {
      setIsCreating(false);
    }
  };

  const belowMinimum = estimatedSize !== null && estimatedSize < minAudienceSize;

  return (
    <div className="bg-cream-warm rounded-xl border border-teal/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone/10 bg-cream-warm/20">
        <h3 className="text-sm font-semibold text-charcoal">
          Create Audience from Pipeline
        </h3>
        <p className="text-xs text-stone mt-1">
          Build a custom audience using your sales pipeline contacts.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Audience Name */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Audience Name
          </label>
          <input
            type="text"
            value={audienceName}
            onChange={(e) => setAudienceName(e.target.value)}
            placeholder="e.g., Hot Leads Q1 2026"
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-cream-warm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'placeholder:text-stone/60 border-stone/20 hover:border-stone/40'
            )}
          />
        </div>

        {/* Pipeline Selector */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Pipeline
          </label>
          <select
            value={selectedPipelineId}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-cream-warm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'border-stone/20 hover:border-stone/40 text-charcoal'
            )}
          >
            <option value="">Select a pipeline...</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stages */}
        {selectedPipelineId && stages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Filter by Stage
            </label>
            <div className="flex flex-wrap gap-2">
              {stages.map((stage) => {
                const isSelected = selectedStages.includes(stage.id);
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => toggleStage(stage.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200',
                      isSelected
                        ? 'border-teal bg-teal/10 text-teal'
                        : 'border-stone/20 bg-cream-warm text-stone hover:border-stone/40'
                    )}
                  >
                    {stage.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-stone mt-1">
              Leave empty to include contacts from all stages.
            </p>
          </div>
        )}

        {/* Tags */}
        {selectedPipelineId && tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Filter by Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200',
                      isSelected
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-stone/20 bg-cream-warm text-stone hover:border-stone/40'
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Estimated Size */}
        {selectedPipelineId && estimatedSize !== null && (
          <div
            className={cn(
              'rounded-xl p-4 border',
              belowMinimum
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-teal/5 border-teal/20'
            )}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className={cn('w-5 h-5', belowMinimum ? 'text-yellow-600' : 'text-teal')} />
              <div>
                <p className={cn('text-sm font-semibold', belowMinimum ? 'text-yellow-800' : 'text-charcoal')}>
                  ~{estimatedSize.toLocaleString()} contacts
                </p>
                <p className={cn('text-xs', belowMinimum ? 'text-yellow-600' : 'text-stone')}>
                  Estimated audience size
                </p>
              </div>
            </div>
            {belowMinimum && (
              <div className="flex items-start gap-1.5 mt-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  {platform === 'meta' ? 'Meta' : 'TikTok'} requires a minimum of{' '}
                  {minAudienceSize.toLocaleString()} contacts for custom audiences.
                  Add more contacts or broaden your filters.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Platform Selector */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Target Platform
          </label>
          <div className="flex gap-3">
            {(['meta', 'tiktok'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200',
                  platform === p
                    ? 'border-teal bg-teal/5 ring-1 ring-teal/20'
                    : 'border-stone/20 bg-cream-warm hover:border-stone/40'
                )}
              >
                <PlatformIcon platform={p} size="sm" />
                <span
                  className={cn(
                    'text-sm font-medium capitalize',
                    platform === p ? 'text-teal' : 'text-charcoal'
                  )}
                >
                  {p === 'meta' ? 'Meta' : 'TikTok'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-stone">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading pipeline data...</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone/10 bg-cream-warm/10 flex items-center justify-end">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreate}
          isLoading={isCreating}
          disabled={
            !selectedPipelineId ||
            !audienceName.trim() ||
            belowMinimum ||
            estimatedSize === 0
          }
        >
          <UsersIcon className="w-4 h-4 mr-1" />
          Create Audience
        </Button>
      </div>
    </div>
  );
}
