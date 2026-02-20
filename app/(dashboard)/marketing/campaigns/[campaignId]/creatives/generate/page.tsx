'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, Button, Input, Badge, PageHeader } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import { AdFormatSelector } from '@/components/marketing/shared/ad-format-selector';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon,
  CheckIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { AdPlatform } from '@/lib/marketing/types';

interface CampaignBrief {
  id: string;
  name: string;
  platform: string;
  objective: string;
  organization_id: string;
  special_ad_category: string | null;
}

interface GeneratedCreative {
  name: string;
  primaryText: string;
  headline: string;
  description: string;
  ctaType: string;
  format: string;
}

const CTA_OPTIONS: Record<string, string[]> = {
  meta: [
    'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'BOOK_NOW', 'DOWNLOAD',
    'GET_OFFER', 'CONTACT_US', 'SUBSCRIBE', 'APPLY_NOW', 'WATCH_MORE',
  ],
  tiktok: [
    'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'DOWNLOAD', 'CONTACT_US',
    'APPLY_NOW', 'BOOK_NOW', 'GET_QUOTE',
  ],
};

const FUNNEL_STAGES = [
  { value: 'awareness', label: 'Awareness', description: 'Introduce your brand to new audiences' },
  { value: 'consideration', label: 'Consideration', description: 'Educate and engage interested prospects' },
  { value: 'conversion', label: 'Conversion', description: 'Drive specific actions and purchases' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'playful', label: 'Playful' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
];

export default function GenerateCreativesPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const supabase = createClient();

  const [campaign, setCampaign] = useState<CampaignBrief | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation config
  const [format, setFormat] = useState('');
  const [funnelStage, setFunnelStage] = useState('awareness');
  const [tone, setTone] = useState('professional');
  const [targetUrl, setTargetUrl] = useState('');
  const [ctaType, setCtaType] = useState('LEARN_MORE');
  const [variationCount, setVariationCount] = useState(3);
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  // Generated results
  const [generatedCreatives, setGeneratedCreatives] = useState<GeneratedCreative[]>([]);
  const [selectedCreatives, setSelectedCreatives] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check super admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      setIsSuperAdmin(userData?.role === 'super_admin');

      // Load campaign
      try {
        const res = await fetch(`/api/marketing/campaigns/${campaignId}`);
        if (!res.ok) throw new Error('Campaign not found');
        const data = await res.json();
        setCampaign({
          id: data.id,
          name: data.name,
          platform: data.platform,
          objective: data.objective,
          organization_id: data.organization_id,
          special_ad_category: data.special_ad_category,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load campaign');
      }
      setIsLoading(false);
    }
    loadData();
  }, [supabase, campaignId]);

  async function handleGenerate() {
    if (!campaign || !format || !targetUrl.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedCreatives([]);
    setSelectedCreatives(new Set());

    try {
      const res = await fetch('/api/marketing/creatives/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          organizationId: campaign.organization_id,
          platform: campaign.platform,
          objective: campaign.objective,
          format,
          funnelStage,
          tone,
          targetUrl: targetUrl.trim(),
          ctaType,
          variationCount,
          additionalPrompt: additionalPrompt.trim() || undefined,
          specialAdCategory: campaign.special_ad_category,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate creatives');
      }

      const data = await res.json();
      setGeneratedCreatives(data.creatives || []);
      // Select all by default
      const allIndices = new Set<number>();
      (data.creatives || []).forEach((_: GeneratedCreative, i: number) => allIndices.add(i));
      setSelectedCreatives(allIndices);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }

  function toggleCreativeSelection(index: number) {
    setSelectedCreatives(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function handleSaveSelected() {
    if (!campaign || selectedCreatives.size === 0) return;
    setIsSaving(true);
    setError(null);

    try {
      const toSave = Array.from(selectedCreatives).map(i => generatedCreatives[i]);

      for (const creative of toSave) {
        const res = await fetch('/api/marketing/creatives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: campaign.id,
            organizationId: campaign.organization_id,
            name: creative.name,
            format: creative.format || format,
            primaryText: creative.primaryText,
            headline: creative.headline,
            description: creative.description,
            ctaType: creative.ctaType || ctaType,
            targetUrl: targetUrl.trim(),
            aiGenerated: true,
            funnelStage,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save creative');
        }
      }

      router.push(`/marketing/campaigns/${campaignId}?tab=creatives`);
    } catch (err: any) {
      setError(err.message || 'Failed to save creatives');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-64 bg-stone/10 rounded animate-pulse" />
        <div className="h-8 w-48 bg-stone/10 rounded animate-pulse" />
        <div className="h-96 bg-stone/10 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <div className="py-8 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error || 'Campaign not found'}</p>
            <Link href="/marketing/campaigns" className="mt-3 text-sm font-medium text-red-700 underline">
              Back to campaigns
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const platform = campaign.platform as AdPlatform;
  const ctaOptions = CTA_OPTIONS[platform] || CTA_OPTIONS.meta;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb + Header */}
      <PageHeader
        title="Generate Ad Creatives"
        icon={SparklesIcon}
        subtitle="AI-powered creative generation using your brand guidelines"
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing' },
          { label: 'Campaigns', href: '/marketing/campaigns' },
          { label: campaign.name, href: `/marketing/campaigns/${campaignId}` },
          { label: 'Generate Creatives' },
        ]}
      />

      {/* Campaign Context */}
      <Card className="bg-cream-warm/50">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={platform} size="sm" />
          <div>
            <p className="text-sm font-medium text-charcoal">{campaign.name}</p>
            <p className="text-xs text-stone capitalize">
              {campaign.objective.replace(/_/g, ' ').replace(/^OUTCOME /, '')}
              {campaign.special_ad_category && <> &middot; {campaign.special_ad_category.replace(/_/g, ' ')}</>}
            </p>
          </div>
        </div>
      </Card>

      {/* Generation Config */}
      {generatedCreatives.length === 0 && (
        <Card>
          <h2 className="text-heading-md text-charcoal mb-4">Creative Configuration</h2>

          <div className="space-y-5">
            {/* Format */}
            <AdFormatSelector
              platform={platform}
              value={format}
              onChange={setFormat}
            />

            {/* Funnel Stage */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Funnel Stage</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FUNNEL_STAGES.map(stage => (
                  <button
                    key={stage.value}
                    onClick={() => setFunnelStage(stage.value)}
                    className={cn(
                      'text-left p-3 rounded-xl border-2 transition-all duration-200',
                      funnelStage === stage.value
                        ? 'border-teal bg-teal/5'
                        : 'border-stone/10 hover:border-stone/30'
                    )}
                  >
                    <p className="text-sm font-medium text-charcoal">{stage.label}</p>
                    <p className="text-xs text-stone mt-0.5">{stage.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      tone === t.value
                        ? 'bg-teal text-white'
                        : 'bg-cream-warm text-stone hover:text-charcoal'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Target URL</label>
              <Input
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://example.com/landing-page"
                type="url"
              />
            </div>

            {/* CTA */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Call to Action</label>
              <select
                value={ctaType}
                onChange={e => setCtaType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
              >
                {ctaOptions.map(cta => (
                  <option key={cta} value={cta}>
                    {cta.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Variation Count */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Number of Variations
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setVariationCount(n)}
                    className={cn(
                      'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                      variationCount === n
                        ? 'bg-teal text-white'
                        : 'bg-cream-warm text-stone hover:text-charcoal'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Prompt */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Additional Instructions (optional)
              </label>
              <textarea
                value={additionalPrompt}
                onChange={e => setAdditionalPrompt(e.target.value)}
                rows={3}
                placeholder="E.g. Focus on our new product launch, use social proof, mention limited time offer..."
                className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm resize-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone/10">
            <Link
              href={`/marketing/campaigns/${campaignId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-stone hover:text-charcoal transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back to Campaign
            </Link>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !format || !targetUrl.trim()}
              isLoading={isGenerating}
            >
              <SparklesIcon className="w-4 h-4" />
              Generate {variationCount} Creative{variationCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </Card>
      )}

      {/* Generated Results */}
      {generatedCreatives.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-md text-charcoal">
              Generated Creatives ({generatedCreatives.length})
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGeneratedCreatives([]);
                  setSelectedCreatives(new Set());
                }}
              >
                <ArrowPathIcon className="w-4 h-4" />
                Regenerate
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedCreatives.map((creative, index) => (
              <Card
                key={index}
                hover
                onClick={() => toggleCreativeSelection(index)}
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  selectedCreatives.has(index) && 'ring-2 ring-teal bg-teal/5'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-stone" />
                    <h3 className="text-sm font-semibold text-charcoal">{creative.name}</h3>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    selectedCreatives.has(index)
                      ? 'border-teal bg-teal'
                      : 'border-stone/30'
                  )}>
                    {selectedCreatives.has(index) && (
                      <CheckIcon className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-stone uppercase tracking-wider mb-1">Primary Text</p>
                    <p className="text-sm text-charcoal">{creative.primaryText}</p>
                  </div>
                  {creative.headline && (
                    <div>
                      <p className="text-xs font-medium text-stone uppercase tracking-wider mb-1">Headline</p>
                      <p className="text-sm font-medium text-charcoal">{creative.headline}</p>
                    </div>
                  )}
                  {creative.description && (
                    <div>
                      <p className="text-xs font-medium text-stone uppercase tracking-wider mb-1">Description</p>
                      <p className="text-xs text-stone">{creative.description}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-2">
                    <Badge variant="default" size="sm">{(creative.format || format).replace(/_/g, ' ')}</Badge>
                    <Badge variant="primary" size="sm">{(creative.ctaType || ctaType).replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <p className="text-sm text-red-600">{error}</p>
            </Card>
          )}

          {/* Save Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-stone/10">
            <p className="text-sm text-stone">
              {selectedCreatives.size} of {generatedCreatives.length} selected
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={`/marketing/campaigns/${campaignId}`}
                className="text-sm font-medium text-stone hover:text-charcoal transition-colors"
              >
                Cancel
              </Link>
              <Button
                onClick={handleSaveSelected}
                disabled={isSaving || selectedCreatives.size === 0}
                isLoading={isSaving}
              >
                Save {selectedCreatives.size} Creative{selectedCreatives.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
