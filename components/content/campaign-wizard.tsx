'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  CAMPAIGN_OBJECTIVES,
  OBJECTIVE_CATEGORIES,
  type CampaignObjectiveId,
  type ObjectiveCategory,
} from '@/config/campaign-objectives';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';
import {
  PLATFORM_DEFAULTS,
  AGGRESSIVENESS_TIERS,
  ALL_CHANNELS,
  type SocialChannel,
  type Aggressiveness,
} from '@/config/platform-defaults';

interface CampaignWizardProps {
  organizationId: string;
  connectedPlatforms?: SocialChannel[];
  onComplete: (campaignId: string) => void;
  onCancel: () => void;
  initialObjective?: CampaignObjectiveId;
}

type WizardStep = 'objective' | 'details' | 'channels' | 'review';

interface ChannelConfig {
  channel: SocialChannel;
  aggressiveness: Aggressiveness;
  enabled: boolean;
  postsPerWeek?: number; // Manual override
}

export function CampaignWizard({
  organizationId,
  connectedPlatforms = [],
  onComplete,
  onCancel,
  initialObjective,
}: CampaignWizardProps) {
  const [step, setStep] = useState<WizardStep>(initialObjective ? 'details' : 'objective');
  const [objective, setObjective] = useState<CampaignObjectiveId | null>(initialObjective || null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [channels, setChannels] = useState<ChannelConfig[]>(
    ALL_CHANNELS.map(ch => ({
      channel: ch,
      aggressiveness: 'focused' as Aggressiveness,
      enabled: connectedPlatforms.includes(ch),
    }))
  );
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ObjectiveCategory | null>(null);
  const [showContentTypeInfo, setShowContentTypeInfo] = useState(false);

  const objectiveConfig = objective ? CAMPAIGN_OBJECTIVES[objective] : null;
  const enabledChannels = channels.filter(c => c.enabled);

  // Calculate total posts
  const weeks = Math.max(1, Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
  ));
  const totalPosts = enabledChannels.reduce((sum, ch) => {
    const postsPerWeek = ch.postsPerWeek ?? AGGRESSIVENESS_TIERS[ch.aggressiveness].postsPerWeek;
    return sum + weeks * postsPerWeek;
  }, 0);

  async function handleCreate() {
    if (!objective || !name || enabledChannels.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/content/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          name,
          objective,
          startDate,
          endDate,
          channels: enabledChannels.map(c => ({
            channel: c.channel,
            aggressiveness: c.aggressiveness,
            postsPerWeek: c.postsPerWeek,
          })),
        }),
      });

      const data = await res.json();
      if (data.campaign?.id) {
        onComplete(data.campaign.id);
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleChannel(channel: SocialChannel) {
    setChannels(prev =>
      prev.map(c =>
        c.channel === channel ? { ...c, enabled: !c.enabled } : c
      )
    );
  }

  function setChannelAggressiveness(channel: SocialChannel, agg: Aggressiveness) {
    setChannels(prev =>
      prev.map(c =>
        c.channel === channel ? { ...c, aggressiveness: agg, postsPerWeek: undefined } : c
      )
    );
  }

  function setChannelPostsPerWeek(channel: SocialChannel, postsPerWeek: number) {
    setChannels(prev =>
      prev.map(c =>
        c.channel === channel ? { ...c, postsPerWeek } : c
      )
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {(['objective', 'details', 'channels', 'review'] as WizardStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-teal text-cream'
                  : i < ['objective', 'details', 'channels', 'review'].indexOf(step)
                  ? 'bg-teal/20 text-teal'
                  : 'bg-stone/10 text-stone'
              }`}
            >
              {i + 1}
            </div>
            {i < 3 && <div className="w-8 h-0.5 bg-stone/10" />}
          </div>
        ))}
      </div>

      {/* Step 1: Objective */}
      {step === 'objective' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-heading-md text-charcoal">What do you want to achieve?</h2>
            <p className="text-body-md text-stone mt-1">Pick your campaign objective. This determines the content mix.</p>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(OBJECTIVE_CATEGORIES) as [ObjectiveCategory, { label: string }][]).map(
              ([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedCategory === key
                      ? 'bg-teal text-cream'
                      : 'bg-stone/5 text-stone hover:bg-stone/10'
                  }`}
                >
                  {cat.label}
                </button>
              )
            )}
          </div>

          {/* Objectives grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.values(CAMPAIGN_OBJECTIVES)
              .filter(o => !selectedCategory || o.category === selectedCategory)
              .map(obj => (
                <Card
                  key={obj.id}
                  hover
                  onClick={() => {
                    setObjective(obj.id);
                    if (!name) setName(`${obj.name} Campaign`);
                    setStep('details');
                  }}
                  className={`cursor-pointer ${
                    objective === obj.id ? 'ring-2 ring-teal' : ''
                  }`}
                >
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-charcoal">{obj.name}</h4>
                        <p className="text-xs text-stone mt-0.5">{obj.description}</p>
                      </div>
                      <Badge variant="default" size="sm">{obj.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-heading-md text-charcoal">Campaign Details</h2>
            <p className="text-body-md text-stone mt-1">Name your campaign and set the date range.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Campaign Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q2 LinkedIn Authority Push"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {objectiveConfig && (
              <Card className="bg-teal/5 border-teal/10">
                <CardContent className="py-3">
                  <p className="text-sm text-charcoal font-medium">
                    Objective: {objectiveConfig.name}
                  </p>
                  <p className="text-xs text-stone mt-1">{objectiveConfig.description}</p>
                  <p className="text-xs text-stone mt-2">
                    Primary metrics: {objectiveConfig.primaryMetrics.join(', ')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('objective')}>Back</Button>
            <Button onClick={() => setStep('channels')} disabled={!name}>
              Next: Select Channels
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Channels + Aggressiveness */}
      {step === 'channels' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-heading-md text-charcoal">Configure Channels</h2>
            <p className="text-body-md text-stone mt-1">
              Select platforms and set how aggressively to post on each.
            </p>
          </div>

          <div className="space-y-3">
            {ALL_CHANNELS.map(ch => {
              const config = channels.find(c => c.channel === ch)!;
              const platformConfig = PLATFORM_DEFAULTS[ch];
              const isConnected = connectedPlatforms.includes(ch);

              return (
                <Card key={ch} className={config.enabled ? 'ring-1 ring-teal/20' : 'opacity-60'}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleChannel(ch)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            config.enabled
                              ? 'bg-teal border-teal text-cream'
                              : 'border-stone/30'
                          }`}
                        >
                          {config.enabled && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className="font-medium text-charcoal">{platformConfig.label}</span>
                        {!isConnected && (
                          <Badge variant="warning" size="sm">Not connected</Badge>
                        )}
                      </div>
                      {config.enabled && (
                        <span className="text-xs text-stone">
                          {(config.postsPerWeek ?? AGGRESSIVENESS_TIERS[config.aggressiveness].postsPerWeek) * weeks} posts
                        </span>
                      )}
                    </div>

                    {config.enabled && (
                      <div className="ml-8 space-y-3">
                        {/* Aggressiveness presets */}
                        <div className="flex gap-2">
                          {(Object.entries(AGGRESSIVENESS_TIERS) as [Aggressiveness, { label: string; postsPerWeek: number; description: string }][]).map(
                            ([key, tier]) => (
                              <button
                                key={key}
                                onClick={() => setChannelAggressiveness(ch, key)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs text-center transition-colors ${
                                  config.aggressiveness === key && !config.postsPerWeek
                                    ? 'bg-teal text-cream'
                                    : 'bg-stone/5 text-stone hover:bg-stone/10'
                                }`}
                              >
                                <div className="font-medium">{tier.label}</div>
                                <div className="mt-0.5 opacity-75">{tier.postsPerWeek}/wk</div>
                              </button>
                            )
                          )}
                        </div>

                        {/* Manual override */}
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-stone whitespace-nowrap">
                            Or set custom:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="14"
                            value={config.postsPerWeek ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val >= 1 && val <= 14) {
                                setChannelPostsPerWeek(ch, val);
                              } else if (e.target.value === '') {
                                setChannelAggressiveness(ch, config.aggressiveness);
                              }
                            }}
                            placeholder={String(AGGRESSIVENESS_TIERS[config.aggressiveness].postsPerWeek)}
                            className="w-20 px-3 py-1.5 text-sm border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none"
                          />
                          <span className="text-xs text-stone">posts/week</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Total summary */}
          <Card className="bg-teal/5 border-teal/10">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal font-medium">Total posts to generate:</span>
                <span className="text-lg font-bold text-teal">{totalPosts}</span>
              </div>
              <p className="text-xs text-stone mt-1">
                Across {enabledChannels.length} channel{enabledChannels.length !== 1 ? 's' : ''} over {weeks} week{weeks !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('details')}>Back</Button>
            <Button onClick={() => setStep('review')} disabled={enabledChannels.length === 0}>
              Next: Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review + Create */}
      {step === 'review' && objectiveConfig && (
        <div className="space-y-6">
          <div>
            <h2 className="text-heading-md text-charcoal">Review & Create</h2>
            <p className="text-body-md text-stone mt-1">Confirm your campaign settings.</p>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-stone">Campaign</span>
                  <p className="font-medium text-charcoal">{name}</p>
                </div>
                <div>
                  <span className="text-stone">Objective</span>
                  <p className="font-medium text-charcoal">{objectiveConfig.name}</p>
                </div>
                <div>
                  <span className="text-stone">Dates</span>
                  <p className="font-medium text-charcoal">{startDate} — {endDate}</p>
                </div>
                <div>
                  <span className="text-stone">Total Posts</span>
                  <p className="font-medium text-teal text-lg">{totalPosts}</p>
                </div>
              </div>

              <div className="border-t border-stone/10 pt-4">
                <span className="text-sm text-stone">Channels</span>
                <div className="mt-2 space-y-2">
                  {enabledChannels.map(ch => {
                    const plt = PLATFORM_DEFAULTS[ch.channel];
                    const agg = AGGRESSIVENESS_TIERS[ch.aggressiveness];
                    return (
                      <div key={ch.channel} className="flex items-center justify-between text-sm">
                        <span className="text-charcoal">{plt.label}</span>
                        <span className="text-stone">
                          {agg.label} — {agg.postsPerWeek * weeks} posts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content type preview */}
              <div className="border-t border-stone/10 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-stone">AI content mix (default ratios)</span>
                  <button
                    onClick={() => setShowContentTypeInfo(true)}
                    className="text-stone/60 hover:text-teal transition-colors"
                  >
                    <InformationCircleIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1 h-6 rounded overflow-hidden">
                  {([1, 2, 3, 4, 5, 6, 7] as ContentTypeId[]).map(t => {
                    const key = `type_${t}` as keyof typeof objectiveConfig.defaultRatio;
                    const pct = objectiveConfig.defaultRatio[key];
                    if (pct === 0) return null;
                    const colors = [
                      '', 'bg-red-400', 'bg-orange-400', 'bg-amber-400',
                      'bg-yellow-400', 'bg-green-400', 'bg-teal', 'bg-blue-400'
                    ];
                    return (
                      <div
                        key={t}
                        className={`${colors[t]} relative group`}
                        style={{ width: `${pct}%` }}
                        title={`T${t} ${CONTENT_TYPES[t].shortName}: ${pct}%`}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-bold opacity-0 group-hover:opacity-100">
                          T{t}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {([1, 2, 3, 4, 5, 6, 7] as ContentTypeId[]).map(t => {
                    const key = `type_${t}` as keyof typeof objectiveConfig.defaultRatio;
                    const pct = objectiveConfig.defaultRatio[key];
                    if (pct === 0) return null;
                    return (
                      <span key={t} className="text-[10px] text-stone">
                        T{t} {CONTENT_TYPES[t].shortName} {pct}%
                      </span>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('channels')}>Back</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={loading}>
              Create Campaign & Generate Content
            </Button>
          </div>
        </div>
      )}

      {/* Content Type Info Modal */}
      {showContentTypeInfo && (
        <div className="fixed inset-0 bg-dark/80 flex items-center justify-center z-50 p-4" onClick={() => setShowContentTypeInfo(false)}>
          <div className="bg-cream-warm rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone/10">
              <h2 className="text-heading-md text-charcoal">Content Type Guide</h2>
              <button
                onClick={() => setShowContentTypeInfo(false)}
                className="text-stone hover:text-charcoal transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone">
                The AI generates content across 7 different types, each serving a specific purpose in your marketing strategy:
              </p>

              {([1, 2, 3, 4, 5, 6, 7] as ContentTypeId[]).map(typeId => {
                const type = CONTENT_TYPES[typeId];
                const colors = [
                  '', 'bg-red-400', 'bg-orange-400', 'bg-amber-400',
                  'bg-yellow-400', 'bg-green-400', 'bg-teal', 'bg-blue-400'
                ];
                return (
                  <div key={typeId} className="flex gap-3 p-3 bg-white rounded-lg border border-stone/10">
                    <div className={`w-8 h-8 rounded-lg ${colors[typeId]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      T{typeId}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-charcoal mb-1">{type.name}</h3>
                      <p className="text-xs text-stone">{type.description}</p>
                    </div>
                  </div>
                );
              })}

              <div className="bg-teal/5 border border-teal/20 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-charcoal mb-2">About the Ratios</h4>
                <p className="text-xs text-stone">
                  The default content mix is optimized for your selected objective ({objectiveConfig?.name}).
                  The AI automatically distributes your posts across these types to create a balanced,
                  engaging feed that achieves your goals. You can customize these ratios later if needed.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-stone/10">
              <Button onClick={() => setShowContentTypeInfo(false)}>Got it</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
