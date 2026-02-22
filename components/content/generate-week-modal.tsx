'use client';

import { useState } from 'react';
import { SparklesIcon, BoltIcon, CheckCircleIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useModelPreference } from '@/hooks/useModelPreference';
import { type ClientModelOption } from '@/lib/ai/client-models';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';

interface GenerateWeekModalProps {
  weekNumber: number;
  /** Number of 'idea' items available to generate */
  itemCount: number;
  /** Total items in the week (including already-generated) */
  totalWeekItems: number;
  organizationId: string;
  isGenerating: boolean;
  onGenerate: (weekNumber: number, modelOverride?: string, limit?: number) => void;
  onClose: () => void;
  /** Super admins bypass credit constraints */
  isSuperAdmin?: boolean;
}

/** 1 credit = 1 ZAR cent → 100 credits = R1.00 */
function creditsToRand(credits: number): string {
  return `R${(credits / 100).toFixed(2)}`;
}

function ModelCard({
  model,
  isSelected,
  onSelect,
}: {
  model: ClientModelOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-xl border-2 transition-all',
        isSelected
          ? 'border-teal bg-teal/5 shadow-sm'
          : 'border-stone/15 hover:border-stone/30 bg-cream-warm'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          {model.isFree ? (
            <BoltIcon className="w-4 h-4 text-teal shrink-0" />
          ) : (
            <SparklesIcon className="w-4 h-4 text-gold shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium text-charcoal">{model.name}</p>
            <p className="text-xs text-stone capitalize">{model.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            model.isFree ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'
          )}>
            {model.isFree ? 'Free' : `~${model.estimatedCreditsPerMessage} cr/post`}
          </span>
          {isSelected && (
            <CheckCircleIcon className="w-5 h-5 text-teal shrink-0" />
          )}
        </div>
      </div>
    </button>
  );
}

export function GenerateWeekModal({
  weekNumber,
  itemCount,
  totalWeekItems,
  organizationId,
  isGenerating,
  onGenerate,
  onClose,
  isSuperAdmin: superAdmin = false,
}: GenerateWeekModalProps) {
  const { models } = useAvailableModels('content_generation');
  const { selectedModel: orgDefault } = useModelPreference(organizationId, 'content_generation');
  const { balance, isLoading: balanceLoading } = useCreditBalance(organizationId);

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(itemCount);

  // Effective model: user selection > org default
  const effectiveModelId = selectedModelId || orgDefault || null;
  const selectedModel = effectiveModelId ? models.find(m => m.id === effectiveModelId) : null;

  const estimatedCredits = selectedModel
    ? selectedModel.isFree ? 0 : selectedModel.estimatedCreditsPerMessage * postCount
    : 0;

  const hasEnoughCredits = superAdmin || !selectedModel || selectedModel.isFree || (balance && balance.totalRemaining >= estimatedCredits);
  const canGenerate = !!selectedModel && hasEnoughCredits && postCount > 0;

  const alreadyGenerated = totalWeekItems - itemCount;

  const handleGenerate = () => {
    if (!effectiveModelId) return;
    // Only pass limit if user chose fewer than all available
    const limit = postCount < itemCount ? postCount : undefined;
    onGenerate(weekNumber, effectiveModelId, limit);
  };

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-cream-warm rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-teal" />
          </div>
          <div>
            <h2 className="text-heading-lg text-charcoal">Generate Week {weekNumber}</h2>
            <p className="text-sm text-stone">
              {totalWeekItems} total posts in this week
              {alreadyGenerated > 0 && (
                <span className="text-teal"> ({alreadyGenerated} already generated)</span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1: Select model */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              1. Select AI Model
            </label>
            <div className="space-y-2">
              {models.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={effectiveModelId === model.id}
                  onSelect={() => setSelectedModelId(model.id)}
                />
              ))}
            </div>
          </div>

          {/* Step 2: Choose post count — only after model selection */}
          {selectedModel && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                2. How many posts to generate?
              </label>
              <div className="bg-cream-warm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone">
                    {itemCount} post{itemCount !== 1 ? 's' : ''} available
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPostCount(Math.max(1, postCount - 1))}
                      disabled={postCount <= 1}
                      className="w-8 h-8 rounded-lg border border-stone/20 flex items-center justify-center hover:bg-cream disabled:opacity-30 transition-colors"
                    >
                      <MinusIcon className="w-4 h-4 text-charcoal" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-charcoal">{postCount}</span>
                    <button
                      onClick={() => setPostCount(Math.min(itemCount, postCount + 1))}
                      disabled={postCount >= itemCount}
                      className="w-8 h-8 rounded-lg border border-stone/20 flex items-center justify-center hover:bg-cream disabled:opacity-30 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 text-charcoal" />
                    </button>
                  </div>
                </div>
                {/* Slider */}
                {itemCount > 1 && (
                  <input
                    type="range"
                    min={1}
                    max={itemCount}
                    value={postCount}
                    onChange={(e) => setPostCount(Number(e.target.value))}
                    className="w-full mt-3 accent-teal h-1.5 cursor-pointer"
                  />
                )}
                <div className="flex justify-between text-xs text-stone mt-1">
                  <span>1 post</span>
                  {itemCount > 1 && <span>All {itemCount} posts</span>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Cost estimate — only after model + count selection */}
          {selectedModel && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                3. Cost Estimate
              </label>
              <div className="bg-cream-warm rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone">Posts to generate</span>
                  <span className="font-semibold text-charcoal">{postCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone">Cost per post</span>
                  <span className="font-medium text-charcoal">
                    {selectedModel.isFree ? (
                      <span className="text-teal flex items-center gap-1">
                        <BoltIcon className="w-3.5 h-3.5" /> Free
                      </span>
                    ) : (
                      `~${selectedModel.estimatedCreditsPerMessage} credits`
                    )}
                  </span>
                </div>
                <div className="border-t border-stone/10 pt-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-charcoal">Estimated total</span>
                  <div className="text-right">
                    <span className="font-semibold text-charcoal block">
                      {selectedModel.isFree ? (
                        <span className="text-teal flex items-center gap-1">
                          <BoltIcon className="w-3.5 h-3.5" /> Free
                        </span>
                      ) : (
                        `~${estimatedCredits.toLocaleString()} credits`
                      )}
                    </span>
                    {!selectedModel.isFree && (
                      <span className="text-xs text-stone">~{creditsToRand(estimatedCredits)}</span>
                    )}
                  </div>
                </div>
                {!selectedModel.isFree && !balanceLoading && balance && (
                  <>
                    <div className="border-t border-stone/10 pt-2 flex items-center justify-between text-xs">
                      <span className="text-stone">Your balance</span>
                      <span className={hasEnoughCredits ? 'font-medium text-teal' : 'font-medium text-red-500'}>
                        {balance.totalRemaining.toLocaleString()} credits ({creditsToRand(balance.totalRemaining)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone">After generation</span>
                      <span className={cn(
                        'font-medium',
                        balance.totalRemaining - estimatedCredits >= 0 ? 'text-charcoal' : 'text-red-500'
                      )}>
                        ~{Math.max(0, balance.totalRemaining - estimatedCredits).toLocaleString()} credits ({creditsToRand(Math.max(0, balance.totalRemaining - estimatedCredits))})
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!hasEnoughCredits && selectedModel && !selectedModel.isFree && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              Insufficient credits. Choose a free model or top up your balance.
            </p>
          )}

          {itemCount === 0 && (
            <p className="text-sm text-stone bg-stone/5 rounded-lg p-3 text-center">
              No posts available to generate — all posts in this week have already been generated.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button onClick={onClose} variant="ghost" className="flex-1" disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            className="flex-1"
            isLoading={isGenerating}
            disabled={isGenerating || !canGenerate}
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            {isGenerating
              ? 'Generating...'
              : selectedModel
                ? `Generate ${postCount} with ${selectedModel.name}`
                : 'Select a model'
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
