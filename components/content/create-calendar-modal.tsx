'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { SparklesIcon, BoltIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useModelPreference } from '@/hooks/useModelPreference';
import { cn } from '@/lib/utils';

/** Estimated post counts per frequency */
const FREQUENCY_EST_POSTS: Record<string, number> = {
  aggressive: 100,
  moderate: 50,
  light: 30,
};

/** 1 credit = 1 ZAR cent → 100 credits = R1.00 */
function creditsToRand(credits: number): string {
  return `R${(credits / 100).toFixed(2)}`;
}

interface CreateCalendarModalProps {
  onClose: () => void;
  onCreate: (campaignName: string, startDate: string, endDate: string, frequency: 'aggressive' | 'moderate' | 'light', platforms?: string[], modelOverride?: string) => void;
  isLoading: boolean;
  organizationId: string | null;
  isSuperAdmin?: boolean;
}

export function CreateCalendarModal({
  onClose,
  onCreate,
  isLoading,
  organizationId,
  isSuperAdmin: superAdmin = false,
}: CreateCalendarModalProps) {
  const [campaignName, setCampaignName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<'aggressive' | 'moderate' | 'light'>('aggressive');
  const [platforms, setPlatforms] = useState<string[]>(['linkedin', 'facebook', 'instagram']);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const { models } = useAvailableModels('content_generation');
  const { selectedModel: orgDefault } = useModelPreference(organizationId, 'content_generation');
  const { balance, isLoading: balanceLoading } = useCreditBalance(organizationId);

  const effectiveModelId = selectedModelId || orgDefault || null;
  const selectedModel = effectiveModelId ? models.find(m => m.id === effectiveModelId) : null;

  const estPosts = FREQUENCY_EST_POSTS[frequency] || 50;
  const estimatedCredits = selectedModel
    ? selectedModel.isFree ? 0 : selectedModel.estimatedCreditsPerMessage * estPosts
    : 0;
  const hasEnoughCredits = superAdmin || !selectedModel || selectedModel.isFree || (balance != null && balance.totalRemaining >= estimatedCredits);

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !startDate || !endDate) return;
    onCreate(campaignName.trim(), startDate, endDate, frequency, platforms, effectiveModelId || undefined);
  };

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-cream-warm rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-heading-lg text-charcoal mb-6">Create Campaign</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. February Launch Campaign"
              required
              className="w-full px-4 py-3 rounded-xl border border-stone/20 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone/20 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone/20 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Posting Frequency</label>
            <div className="space-y-2">
              {[
                { value: 'aggressive' as const, label: 'Aggressive', desc: '3-4 posts/day + medium/long-form videos' },
                { value: 'moderate' as const, label: 'Moderate', desc: '1-2 posts/day + medium videos + bi-weekly long-form' },
                { value: 'light' as const, label: 'Light', desc: '~1 post/day + medium videos + monthly long-form' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    frequency === opt.value ? 'border-teal bg-teal/5' : 'border-stone/20 hover:border-stone/40'
                  }`}
                >
                  <input type="radio" name="frequency" value={opt.value} checked={frequency === opt.value} onChange={() => setFrequency(opt.value)} className="sr-only" />
                  <div>
                    <p className="font-medium text-charcoal">{opt.label}</p>
                    <p className="text-xs text-stone">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Default Platforms</label>
            <div className="flex flex-wrap gap-2">
              {['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    platforms.includes(p) ? 'bg-teal text-white' : 'bg-stone/5 text-stone hover:bg-stone/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">AI Model</label>
            <div className="space-y-2">
              {models.map(model => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border-2 transition-all',
                    effectiveModelId === model.id
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
                      {effectiveModelId === model.id && (
                        <CheckCircleIcon className="w-5 h-5 text-teal shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cost Estimate */}
          {selectedModel && (
            <div className="bg-cream-warm rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone">Estimated posts</span>
                <span className="font-semibold text-charcoal">~{estPosts}</span>
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
                <div className="border-t border-stone/10 pt-2 flex items-center justify-between text-xs">
                  <span className="text-stone">Your balance</span>
                  <span className={hasEnoughCredits ? 'font-medium text-teal' : 'font-medium text-red-500'}>
                    {balance.totalRemaining.toLocaleString()} credits ({creditsToRand(balance.totalRemaining)})
                  </span>
                </div>
              )}
            </div>
          )}

          {!hasEnoughCredits && selectedModel && !selectedModel.isFree && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              Insufficient credits. Choose a free model or top up your balance.
            </p>
          )}

          <div className="flex gap-3">
            <Button type="button" onClick={onClose} variant="ghost" className="flex-1">Cancel</Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="flex-1"
              disabled={!campaignName.trim() || !startDate || !endDate || platforms.length === 0 || !effectiveModelId || (!hasEnoughCredits && selectedModel != null && !selectedModel.isFree)}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Create &amp; Generate All Content
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
