'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import { AdFormatSelector } from '@/components/marketing/shared/ad-format-selector';
import { ObjectiveSelector } from './objective-selector';
import { BudgetConfig } from './budget-config';
import { TargetingBuilder, type TargetingConfig } from '@/components/marketing/ad-set/targeting-builder';
import { PlacementSelector } from '@/components/marketing/ad-set/placement-selector';
import {
  CheckIcon,
  SparklesIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface CampaignWizardProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
}

const SPECIAL_AD_CATEGORIES = [
  { value: '', label: 'None' },
  { value: 'credit', label: 'Credit' },
  { value: 'employment', label: 'Employment' },
  { value: 'housing', label: 'Housing' },
  { value: 'social_issues', label: 'Social Issues, Elections or Politics' },
];

const BIDDING_STRATEGIES = [
  { value: 'lowest_cost', label: 'Lowest Cost', description: 'Get the most results for your budget' },
  { value: 'cost_cap', label: 'Cost Cap', description: 'Keep average cost per result at or below an amount' },
  { value: 'bid_cap', label: 'Bid Cap', description: 'Set the maximum bid in each auction' },
];

type CreativeMode = 'ai_generate' | 'manual' | 'existing';

export function CampaignWizard({ onComplete, onCancel }: CampaignWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 - Campaign
  const [platform, setPlatform] = useState<'meta' | 'tiktok'>('meta');
  const [objective, setObjective] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [specialAdCategory, setSpecialAdCategory] = useState('');

  // Step 2 - Ad Set
  const [targeting, setTargeting] = useState<TargetingConfig>({
    ageMin: 18,
    ageMax: 65,
    gender: 'all',
    locations: [],
    interests: [],
    customAudiences: [],
  });
  const [placements, setPlacements] = useState<string[]>([]);
  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('daily');
  const [budgetCents, setBudgetCents] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [biddingStrategy, setBiddingStrategy] = useState('lowest_cost');

  // Step 3 - Creatives
  const [creativeMode, setCreativeMode] = useState<CreativeMode>('ai_generate');
  const [adFormat, setAdFormat] = useState('');

  const canProceedStep1 = platform && objective && campaignName.trim().length > 0;
  const canProceedStep2 = budgetCents > 0 && startDate;
  const canProceedStep3 = creativeMode && adFormat;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const campaignData = {
        platform,
        objective,
        name: campaignName,
        special_ad_category: specialAdCategory || null,
        status: 'draft',
      };

      // Create campaign
      const campaignRes = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });

      if (!campaignRes.ok) {
        throw new Error('Failed to create campaign');
      }

      const campaign = await campaignRes.json();

      // Create ad set
      const adSetData = {
        campaign_id: campaign.id,
        name: `${campaignName} - Ad Set 1`,
        targeting_config: targeting,
        placements,
        budget_type: budgetType,
        budget_cents: budgetCents,
        start_date: startDate,
        end_date: endDate || null,
        bidding_strategy: biddingStrategy,
        status: 'draft',
      };

      const adSetRes = await fetch(`/api/marketing/campaigns/${campaign.id}/ad-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adSetData),
      });

      if (!adSetRes.ok) {
        throw new Error('Failed to create ad set');
      }

      const adSet = await adSetRes.json();

      onComplete({
        campaign,
        adSet,
        creativeMode,
        adFormat,
      });
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-teal/8 overflow-hidden">
      {/* Step Indicators */}
      <div className="px-6 py-4 border-b border-stone/10 bg-cream-warm/20">
        <div className="flex items-center justify-center gap-0">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  s < step
                    ? 'bg-teal text-cream'
                    : s === step
                    ? 'bg-teal text-cream ring-4 ring-teal/20'
                    : 'bg-stone/10 text-stone'
                )}
              >
                {s < step ? <CheckIcon className="w-4 h-4" /> : s}
              </div>
              <div className="flex flex-col ml-2 mr-6">
                <span
                  className={cn(
                    'text-xs font-medium',
                    s <= step ? 'text-charcoal' : 'text-stone'
                  )}
                >
                  {s === 1 ? 'Campaign' : s === 2 ? 'Ad Set' : 'Creatives'}
                </span>
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mr-4',
                    s < step ? 'bg-teal' : 'bg-stone/20'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 space-y-6">
        {/* Step 1: Campaign */}
        {step === 1 && (
          <>
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">
                Platform
              </label>
              <div className="flex gap-3">
                {(['meta', 'tiktok'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPlatform(p);
                      setPlacements([]);
                      setAdFormat('');
                    }}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-200',
                      platform === p
                        ? 'border-teal bg-teal/5 ring-2 ring-teal/20'
                        : 'border-stone/20 bg-white hover:border-stone/40'
                    )}
                  >
                    <PlatformIcon platform={p} size="sm" />
                    <span
                      className={cn(
                        'text-sm font-semibold capitalize',
                        platform === p ? 'text-teal' : 'text-charcoal'
                      )}
                    >
                      {p === 'meta' ? 'Meta (Facebook & Instagram)' : 'TikTok'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Objective */}
            <ObjectiveSelector value={objective} onChange={setObjective} />

            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Summer Sale 2026"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                  'placeholder:text-stone/60',
                  'border-stone/20 hover:border-stone/40'
                )}
              />
            </div>

            {/* Special Ad Category (Meta only) */}
            {platform === 'meta' && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Special Ad Category
                </label>
                <select
                  value={specialAdCategory}
                  onChange={(e) => setSpecialAdCategory(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                    'border-stone/20 hover:border-stone/40',
                    'text-charcoal'
                  )}
                >
                  {SPECIAL_AD_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone mt-1">
                  Required if your ads relate to credit, employment, housing, or social issues.
                </p>
              </div>
            )}
          </>
        )}

        {/* Step 2: Ad Set */}
        {step === 2 && (
          <>
            <TargetingBuilder value={targeting} onChange={setTargeting} />

            <PlacementSelector
              platform={platform}
              value={placements}
              onChange={setPlacements}
            />

            <BudgetConfig
              budgetType={budgetType}
              budgetCents={budgetCents}
              currency="ZAR"
              startDate={startDate}
              endDate={endDate}
              onChange={(data) => {
                if (data.budgetType !== undefined) setBudgetType(data.budgetType);
                if (data.budgetCents !== undefined) setBudgetCents(data.budgetCents);
                if (data.startDate !== undefined) setStartDate(data.startDate);
                if (data.endDate !== undefined) setEndDate(data.endDate);
              }}
            />

            {/* Bidding Strategy */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">
                Bidding Strategy
              </label>
              <div className="space-y-2">
                {BIDDING_STRATEGIES.map((strategy) => (
                  <button
                    key={strategy.value}
                    type="button"
                    onClick={() => setBiddingStrategy(strategy.value)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200',
                      biddingStrategy === strategy.value
                        ? 'border-teal bg-teal/5 ring-1 ring-teal/20'
                        : 'border-stone/20 bg-white hover:border-stone/40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0',
                        biddingStrategy === strategy.value
                          ? 'border-teal'
                          : 'border-stone/30'
                      )}
                    >
                      {biddingStrategy === strategy.value && (
                        <div className="w-2 h-2 rounded-full bg-teal" />
                      )}
                    </div>
                    <div>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          biddingStrategy === strategy.value
                            ? 'text-teal'
                            : 'text-charcoal'
                        )}
                      >
                        {strategy.label}
                      </p>
                      <p className="text-xs text-stone">{strategy.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Creatives */}
        {step === 3 && (
          <>
            <AdFormatSelector
              platform={platform}
              value={adFormat}
              onChange={setAdFormat}
            />

            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">
                How would you like to create your ad?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setCreativeMode('ai_generate')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200',
                    creativeMode === 'ai_generate'
                      ? 'border-teal bg-teal/5 ring-2 ring-teal/20'
                      : 'border-stone/20 bg-white hover:border-stone/40'
                  )}
                >
                  <SparklesIcon
                    className={cn(
                      'w-8 h-8',
                      creativeMode === 'ai_generate' ? 'text-teal' : 'text-stone'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      creativeMode === 'ai_generate' ? 'text-teal' : 'text-charcoal'
                    )}
                  >
                    Generate with AI
                  </span>
                  <span className="text-[11px] text-stone text-center">
                    AI writes ad copy using your brand
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreativeMode('manual')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200',
                    creativeMode === 'manual'
                      ? 'border-teal bg-teal/5 ring-2 ring-teal/20'
                      : 'border-stone/20 bg-white hover:border-stone/40'
                  )}
                >
                  <PencilSquareIcon
                    className={cn(
                      'w-8 h-8',
                      creativeMode === 'manual' ? 'text-teal' : 'text-stone'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      creativeMode === 'manual' ? 'text-teal' : 'text-charcoal'
                    )}
                  >
                    Create Manually
                  </span>
                  <span className="text-[11px] text-stone text-center">
                    Write your own ad copy
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreativeMode('existing')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200',
                    creativeMode === 'existing'
                      ? 'border-teal bg-teal/5 ring-2 ring-teal/20'
                      : 'border-stone/20 bg-white hover:border-stone/40'
                  )}
                >
                  <DocumentDuplicateIcon
                    className={cn(
                      'w-8 h-8',
                      creativeMode === 'existing' ? 'text-teal' : 'text-stone'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      creativeMode === 'existing' ? 'text-teal' : 'text-charcoal'
                    )}
                  >
                    Use Existing
                  </span>
                  <span className="text-[11px] text-stone text-center">
                    Reuse content from your library
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-stone/10 bg-cream-warm/10 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={step === 1 ? onCancel : handleBack}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone">Step {step} of 3</span>
          {step < 3 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              isLoading={isSubmitting}
              disabled={!canProceedStep3}
            >
              Create Campaign
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
