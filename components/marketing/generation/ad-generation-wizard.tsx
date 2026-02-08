'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { AdFormatSelector } from '@/components/marketing/shared/ad-format-selector';
import { AdBatchTracker } from './ad-batch-tracker';
import { type ClientModelOption } from '@/lib/ai/client-models';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import {
  BRAND_VARIABLE_CATEGORIES,
  VARIABLE_DISPLAY_NAMES,
} from '@/lib/content-engine/brand-variable-categories';
import {
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface AdGenerationWizardProps {
  campaignId?: string;
  adSetId?: string;
  platform: 'meta' | 'tiktok';
  objective?: string;
  onComplete: (creativeIds: string[]) => void;
  onCancel: () => void;
  isSuperAdmin?: boolean;
}

const FUNNEL_STAGES = [
  {
    key: 'awareness',
    label: 'Awareness',
    description: 'Introduce your brand to new audiences',
    color: 'bg-green-100 text-green-800 border-green-200',
    selectedColor: 'bg-green-500 text-white border-green-500',
  },
  {
    key: 'consideration',
    label: 'Consideration',
    description: 'Educate and build interest in your offer',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    selectedColor: 'bg-blue-500 text-white border-blue-500',
  },
  {
    key: 'conversion',
    label: 'Conversion',
    description: 'Drive action and close the sale',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    selectedColor: 'bg-orange-500 text-white border-orange-500',
  },
];

const CTA_OPTIONS = [
  { value: 'learn_more', label: 'Learn More' },
  { value: 'shop_now', label: 'Shop Now' },
  { value: 'sign_up', label: 'Sign Up' },
  { value: 'book_now', label: 'Book Now' },
  { value: 'contact_us', label: 'Contact Us' },
  { value: 'download', label: 'Download' },
  { value: 'get_offer', label: 'Get Offer' },
  { value: 'get_quote', label: 'Get Quote' },
  { value: 'subscribe', label: 'Subscribe' },
  { value: 'apply_now', label: 'Apply Now' },
];

export function AdGenerationWizard({
  campaignId,
  adSetId,
  platform,
  objective,
  onComplete,
  onCancel,
  isSuperAdmin,
}: AdGenerationWizardProps) {
  const [adFormat, setAdFormat] = useState('');
  const [funnelStage, setFunnelStage] = useState('');
  const [variationCount, setVariationCount] = useState(3);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [ctaType, setCtaType] = useState('learn_more');
  const [selectedBrandVars, setSelectedBrandVars] = useState<Set<string>>(() => {
    const all = new Set<string>();
    BRAND_VARIABLE_CATEGORIES.forEach((cat) =>
      cat.outputKeys.forEach((k) => all.add(k))
    );
    return all;
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { models } = useAvailableModels('ad_generation');

  // Set default model when models load
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models, selectedModelId]);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const toggleCategory = (catKey: string) => {
    const next = new Set(expandedCategories);
    if (next.has(catKey)) {
      next.delete(catKey);
    } else {
      next.add(catKey);
    }
    setExpandedCategories(next);
  };

  const toggleBrandVar = (varKey: string) => {
    const next = new Set(selectedBrandVars);
    if (next.has(varKey)) {
      next.delete(varKey);
    } else {
      next.add(varKey);
    }
    setSelectedBrandVars(next);
  };

  const toggleCategoryVars = (cat: { outputKeys: string[] }) => {
    const allSelected = cat.outputKeys.every((k) => selectedBrandVars.has(k));
    const next = new Set(selectedBrandVars);
    cat.outputKeys.forEach((k) => {
      if (allSelected) {
        next.delete(k);
      } else {
        next.add(k);
      }
    });
    setSelectedBrandVars(next);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/marketing/generate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          adSetId,
          platform,
          objective,
          adFormat,
          funnelStage,
          variationCount,
          modelId: selectedModelId,
          ctaType,
          selectedBrandVariables: Array.from(selectedBrandVars),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(data.error || 'Failed to start generation');
      }

      const data = await res.json();
      setBatchId(data.batchId);
    } catch (err: any) {
      setError(err.message || 'Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchComplete = () => {
    onComplete([]);
  };

  const handleBatchCancel = () => {
    setBatchId(null);
  };

  // If batch is running, show tracker
  if (batchId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="w-5 h-5 text-teal" />
          <h3 className="text-sm font-semibold text-charcoal">Generating Ad Creatives</h3>
        </div>
        <AdBatchTracker
          batchId={batchId}
          onComplete={handleBatchComplete}
          onCancel={handleBatchCancel}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-teal/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone/10 bg-cream-warm/20">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-teal" />
          <h3 className="text-sm font-semibold text-charcoal">
            AI Ad Creative Generator
          </h3>
        </div>
        <p className="text-xs text-stone mt-1">
          Generate compelling ad copy using your brand strategy as context.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Platform + Objective display */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone mb-1">Platform</label>
            <p className="text-sm font-semibold text-charcoal capitalize">{platform}</p>
          </div>
          {objective && (
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone mb-1">Objective</label>
              <p className="text-sm font-semibold text-charcoal capitalize">{objective}</p>
            </div>
          )}
        </div>

        {/* Ad Format */}
        <AdFormatSelector platform={platform} value={adFormat} onChange={setAdFormat} />

        {/* Funnel Stage */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-3">
            Funnel Stage
          </label>
          <div className="grid grid-cols-3 gap-3">
            {FUNNEL_STAGES.map((stage) => {
              const isSelected = funnelStage === stage.key;
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => setFunnelStage(stage.key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all duration-200 text-center',
                    isSelected ? stage.selectedColor : stage.color
                  )}
                >
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <span
                    className={cn(
                      'text-[10px] leading-tight',
                      isSelected ? 'text-white/80' : 'opacity-70'
                    )}
                  >
                    {stage.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand Variable Toggles */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Brand Variables
          </label>
          <p className="text-xs text-stone mb-3">
            Select which brand data to include as context for AI generation.
          </p>
          <div className="space-y-1.5">
            {BRAND_VARIABLE_CATEGORIES.map((cat) => {
              const isExpanded = expandedCategories.has(cat.key);
              const selectedCount = cat.outputKeys.filter((k) =>
                selectedBrandVars.has(k)
              ).length;
              const allSelected = selectedCount === cat.outputKeys.length;

              return (
                <div
                  key={cat.key}
                  className="border border-stone/10 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-cream-warm/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleCategoryVars(cat);
                        }}
                        className="w-3.5 h-3.5 rounded border-stone/30 text-teal focus:ring-teal/20"
                      />
                      <span className="text-sm font-medium text-charcoal">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-stone">
                        ({selectedCount}/{cat.outputKeys.length})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-stone" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-stone" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-2.5 space-y-1 border-t border-stone/5">
                      {cat.outputKeys.map((key) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-cream-warm/20 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrandVars.has(key)}
                            onChange={() => toggleBrandVar(key)}
                            className="w-3.5 h-3.5 rounded border-stone/30 text-teal focus:ring-teal/20"
                          />
                          <span className="text-xs text-charcoal">
                            {VARIABLE_DISPLAY_NAMES[key] || key}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Variation Count */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Number of Variations
          </label>
          <input
            type="number"
            min={1}
            max={isSuperAdmin ? 20 : 10}
            value={variationCount}
            onChange={(e) =>
              setVariationCount(
                Math.max(1, Math.min(isSuperAdmin ? 20 : 10, parseInt(e.target.value) || 1))
              )
            }
            className={cn(
              'w-24 px-4 py-3 rounded-xl border bg-white transition-all duration-200 text-center',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'border-stone/20 hover:border-stone/40'
            )}
          />
          <p className="text-xs text-stone mt-1">
            Each variation will have a unique angle and copy (max {isSuperAdmin ? 20 : 10}).
          </p>
        </div>

        {/* AI Model Selector */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            AI Model
          </label>
          <div className="grid grid-cols-2 gap-2">
            {models.map((model: ClientModelOption) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModelId(model.id)}
                className={cn(
                  'flex items-start gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200',
                  selectedModelId === model.id
                    ? 'border-teal bg-teal/5 ring-1 ring-teal/20'
                    : 'border-stone/20 bg-white hover:border-stone/40'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0',
                    selectedModelId === model.id ? 'border-teal' : 'border-stone/30'
                  )}
                >
                  {selectedModelId === model.id && (
                    <div className="w-2 h-2 rounded-full bg-teal" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      selectedModelId === model.id ? 'text-teal' : 'text-charcoal'
                    )}
                  >
                    {model.name}
                  </p>
                  <p className="text-[10px] text-stone">
                    {model.isFree ? 'Free' : `~${model.estimatedCreditsPerMessage} credits/item`}
                    {' - '}
                    {model.provider}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {selectedModel && !selectedModel.isFree && (
            <p className="text-xs text-stone mt-2">
              Estimated cost: ~{selectedModel.estimatedCreditsPerMessage * variationCount} credits for{' '}
              {variationCount} variations
            </p>
          )}
        </div>

        {/* CTA Type */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Call to Action
          </label>
          <select
            value={ctaType}
            onChange={(e) => setCtaType(e.target.value)}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'border-stone/20 hover:border-stone/40 text-charcoal'
            )}
          >
            {CTA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone/10 bg-cream-warm/10 flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerate}
          isLoading={isGenerating}
          disabled={!adFormat || !funnelStage}
        >
          <SparklesIcon className="w-4 h-4 mr-1" />
          Generate {variationCount} {variationCount === 1 ? 'Variation' : 'Variations'}
        </Button>
      </div>
    </div>
  );
}
