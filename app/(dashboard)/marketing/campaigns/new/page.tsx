'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, Button, Input, Badge, PageHeader } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckIcon,
  MegaphoneIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { AdPlatform } from '@/lib/marketing/types';

interface AdAccount {
  id: string;
  platform: string;
  account_name: string;
  platform_account_id: string;
  is_active: boolean;
}

const OBJECTIVES: Record<string, { label: string; description: string }[]> = {
  meta: [
    { label: 'OUTCOME_AWARENESS', description: 'Reach people who are more likely to remember your ads' },
    { label: 'OUTCOME_TRAFFIC', description: 'Send people to a destination like a website or app' },
    { label: 'OUTCOME_ENGAGEMENT', description: 'Get more messages, video views, post engagement, or event responses' },
    { label: 'OUTCOME_LEADS', description: 'Collect leads for your business via forms, calls, or messages' },
    { label: 'OUTCOME_APP_PROMOTION', description: 'Get people to install or take action in your app' },
    { label: 'OUTCOME_SALES', description: 'Find people likely to purchase your product or service' },
  ],
  tiktok: [
    { label: 'REACH', description: 'Show your ad to the maximum number of people' },
    { label: 'TRAFFIC', description: 'Send more people to a destination on or off TikTok' },
    { label: 'VIDEO_VIEWS', description: 'Get more people to watch your video content' },
    { label: 'LEAD_GENERATION', description: 'Collect leads from people interested in your business' },
    { label: 'CONVERSIONS', description: 'Drive valuable actions on your website or app' },
    { label: 'APP_PROMOTION', description: 'Get more people to install or re-engage with your app' },
  ],
};

const BUDGET_TYPES = [
  { value: 'daily', label: 'Daily Budget', description: 'Spend up to this amount per day' },
  { value: 'lifetime', label: 'Lifetime Budget', description: 'Spend this total over the campaign duration' },
];

const STEPS = ['Platform & Account', 'Objective', 'Budget & Schedule', 'Review'];

export default function CreateCampaignPage() {
  const router = useRouter();
  const supabase = createClient();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<AdPlatform | ''>('');
  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState('');
  const [budgetType, setBudgetType] = useState('daily');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [specialAdCategory, setSpecialAdCategory] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;
      setOrganizationId(membership.organization_id);

      // Fetch ad accounts
      const res = await fetch(`/api/marketing/accounts?organizationId=${membership.organization_id}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  function handleAccountSelect(account: AdAccount) {
    setSelectedAccountId(account.id);
    setSelectedPlatform(account.platform as AdPlatform);
    setObjective(''); // Reset objective when platform changes
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 0: return !!selectedAccountId && !!campaignName.trim();
      case 1: return !!objective;
      case 2: return !!budgetAmount && parseFloat(budgetAmount) > 0;
      case 3: return true;
      default: return false;
    }
  }

  async function handleSubmit() {
    if (!organizationId || !selectedAccountId || !selectedPlatform) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          adAccountId: selectedAccountId,
          name: campaignName.trim(),
          platform: selectedPlatform,
          objective,
          budgetType,
          budgetCents: Math.round(parseFloat(budgetAmount) * 100),
          currency: 'ZAR',
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          specialAdCategory: specialAdCategory || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const campaign = await res.json();
      router.push(`/marketing/campaigns/${campaign.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-stone/10 rounded animate-pulse" />
        <div className="h-96 bg-stone/10 rounded-xl animate-pulse" />
      </div>
    );
  }

  const availableObjectives = selectedPlatform ? (OBJECTIVES[selectedPlatform] || []) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb + Header */}
      <PageHeader
        title="Create Campaign"
        icon={RocketLaunchIcon}
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing' },
          { label: 'Campaigns', href: '/marketing/campaigns' },
          { label: 'New Campaign' },
        ]}
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <button
              onClick={() => { if (index < currentStep) setCurrentStep(index); }}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                index === currentStep
                  ? 'bg-teal text-white'
                  : index < currentStep
                    ? 'bg-teal/10 text-teal cursor-pointer hover:bg-teal/20'
                    : 'bg-stone/10 text-stone'
              )}
            >
              {index < currentStep ? (
                <CheckIcon className="w-3.5 h-3.5" />
              ) : (
                <span className="w-4 text-center">{index + 1}</span>
              )}
              <span className="hidden sm:inline">{step}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className={cn(
                'w-6 h-0.5 rounded-full',
                index < currentStep ? 'bg-teal' : 'bg-stone/10'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* No accounts warning */}
      {accounts.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gold">No ad accounts connected</p>
              <p className="text-sm text-gold mt-1">
                You need to connect at least one ad account before creating a campaign.
              </p>
              <Link
                href="/marketing/settings"
                className="inline-block mt-2 text-sm font-medium text-gold underline hover:text-yellow-900"
              >
                Go to Ad Account Settings
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Step Content */}
      <Card>
        {/* Step 1: Platform & Account */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-heading-md text-charcoal mb-1">Platform & Account</h2>
              <p className="text-sm text-stone">Select which ad account to use and name your campaign.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Campaign Name</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Spring Awareness Campaign"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Ad Account</label>
              {accounts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => handleAccountSelect(account)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200',
                        selectedAccountId === account.id
                          ? 'border-teal bg-teal/5'
                          : 'border-stone/10 hover:border-stone/30'
                      )}
                    >
                      <PlatformIcon platform={account.platform as AdPlatform} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate">{account.account_name}</p>
                        <p className="text-xs text-stone capitalize">{account.platform}</p>
                      </div>
                      {selectedAccountId === account.id && (
                        <CheckIcon className="w-5 h-5 text-teal ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone">No accounts available. Connect one in settings first.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Objective */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-heading-md text-charcoal mb-1">Campaign Objective</h2>
              <p className="text-sm text-stone">
                What do you want to achieve with this campaign?
              </p>
            </div>

            <div className="space-y-3">
              {availableObjectives.map(obj => (
                <button
                  key={obj.label}
                  onClick={() => setObjective(obj.label)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                    objective === obj.label
                      ? 'border-teal bg-teal/5'
                      : 'border-stone/10 hover:border-stone/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-charcoal">
                      {obj.label.replace(/_/g, ' ').replace(/^OUTCOME /, '')}
                    </p>
                    {objective === obj.label && (
                      <CheckIcon className="w-5 h-5 text-teal flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone mt-1">{obj.description}</p>
                </button>
              ))}
            </div>

            {/* Special Ad Category */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Special Ad Category (optional)
              </label>
              <select
                value={specialAdCategory}
                onChange={e => setSpecialAdCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
              >
                <option value="">None</option>
                <option value="CREDIT">Credit</option>
                <option value="EMPLOYMENT">Employment</option>
                <option value="HOUSING">Housing</option>
                <option value="SOCIAL_ISSUES">Social Issues, Elections, or Politics</option>
              </select>
              <p className="text-xs text-stone mt-1">
                Required for ads related to credit, employment, housing, or social/political issues.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Budget & Schedule */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-heading-md text-charcoal mb-1">Budget & Schedule</h2>
              <p className="text-sm text-stone">Set your spending limit and campaign dates.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Budget Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUDGET_TYPES.map(bt => (
                  <button
                    key={bt.value}
                    onClick={() => setBudgetType(bt.value)}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all duration-200',
                      budgetType === bt.value
                        ? 'border-teal bg-teal/5'
                        : 'border-stone/10 hover:border-stone/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-charcoal">{bt.label}</p>
                      {budgetType === bt.value && (
                        <CheckIcon className="w-5 h-5 text-teal" />
                      )}
                    </div>
                    <p className="text-xs text-stone mt-1">{bt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Budget Amount (ZAR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone font-medium">R</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Start Date (optional)
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  End Date (optional)
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-heading-md text-charcoal mb-1">Review Campaign</h2>
              <p className="text-sm text-stone">Review your campaign details before creating.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-cream-warm rounded-xl">
                {selectedPlatform && (
                  <PlatformIcon platform={selectedPlatform} size="md" />
                )}
                <div>
                  <p className="text-base font-semibold text-charcoal">{campaignName}</p>
                  <p className="text-xs text-stone capitalize">{selectedPlatform}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-cream-warm/50 rounded-lg">
                  <p className="text-xs text-stone mb-0.5">Objective</p>
                  <p className="text-sm font-medium text-charcoal">
                    {objective.replace(/_/g, ' ').replace(/^OUTCOME /, '')}
                  </p>
                </div>
                <div className="p-3 bg-cream-warm/50 rounded-lg">
                  <p className="text-xs text-stone mb-0.5">Budget</p>
                  <p className="text-sm font-medium text-charcoal">
                    R{parseFloat(budgetAmount || '0').toFixed(2)} / {budgetType === 'daily' ? 'day' : 'total'}
                  </p>
                </div>
                {startDate && (
                  <div className="p-3 bg-cream-warm/50 rounded-lg">
                    <p className="text-xs text-stone mb-0.5">Start Date</p>
                    <p className="text-sm font-medium text-charcoal">
                      {new Date(startDate).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {endDate && (
                  <div className="p-3 bg-cream-warm/50 rounded-lg">
                    <p className="text-xs text-stone mb-0.5">End Date</p>
                    <p className="text-sm font-medium text-charcoal">
                      {new Date(endDate).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {specialAdCategory && (
                  <div className="p-3 bg-cream-warm/50 rounded-lg col-span-2">
                    <p className="text-xs text-stone mb-0.5">Special Ad Category</p>
                    <p className="text-sm font-medium text-charcoal capitalize">
                      {specialAdCategory.replace(/_/g, ' ').toLowerCase()}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-stone">
                The campaign will be created as a Draft. You can add ad sets and creatives before launching.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone/10">
          <div>
            {currentStep === 0 ? (
              <Link
                href="/marketing/campaigns"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone hover:text-charcoal transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Cancel
              </Link>
            ) : (
              <button
                onClick={() => setCurrentStep(s => s - 1)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone hover:text-charcoal transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(s => s + 1)}
              disabled={!canProceed()}
            >
              Continue
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || accounts.length === 0}
              isLoading={isSubmitting}
            >
              <MegaphoneIcon className="w-4 h-4" />
              Create Campaign
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
