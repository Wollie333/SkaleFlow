'use client';

import { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { generateUTMParams, type UTMParams } from '@/lib/utm/generate-utm';

const SOURCE_PRESETS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'newsletter', 'email', 'google'];
const MEDIUM_PRESETS = ['social', 'email', 'cpc', 'banner', 'referral'];

export interface UTMBuilderModalProps {
  open: boolean;
  onClose: () => void;
  baseUrl: string;
  initialParams: UTMParams | null;
  onApply: (params: UTMParams) => void;
  autoGenerateContext?: {
    platform: string;
    funnelStage: string;
    format: string;
    topic: string | null;
    scheduledDate: string;
  };
}

export function UTMBuilderModal({
  open,
  onClose,
  baseUrl,
  initialParams,
  onApply,
  autoGenerateContext,
}: UTMBuilderModalProps) {
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');

  // Populate from initialParams when modal opens
  useEffect(() => {
    if (open && initialParams) {
      setSource(initialParams.utm_source || '');
      setMedium(initialParams.utm_medium || '');
      setCampaign(initialParams.utm_campaign || '');
      setContent(initialParams.utm_content || '');
      setTerm(initialParams.utm_term || '');
    } else if (open && !initialParams) {
      setSource('');
      setMedium('');
      setCampaign('');
      setContent('');
      setTerm('');
    }
  }, [open, initialParams]);

  const handleAutoGenerate = () => {
    if (!autoGenerateContext) return;
    const params = generateUTMParams(autoGenerateContext);
    setSource(params.utm_source);
    setMedium(params.utm_medium);
    setCampaign(params.utm_campaign);
    setContent(params.utm_content);
    setTerm(params.utm_term);
  };

  const trackedUrl = useMemo(() => {
    if (!baseUrl) return '';
    try {
      const url = new URL(baseUrl);
      if (source) url.searchParams.set('utm_source', source);
      if (medium) url.searchParams.set('utm_medium', medium);
      if (campaign) url.searchParams.set('utm_campaign', campaign);
      if (content) url.searchParams.set('utm_content', content);
      if (term) url.searchParams.set('utm_term', term);
      return url.toString();
    } catch {
      const parts = [
        source && `utm_source=${encodeURIComponent(source)}`,
        medium && `utm_medium=${encodeURIComponent(medium)}`,
        campaign && `utm_campaign=${encodeURIComponent(campaign)}`,
        content && `utm_content=${encodeURIComponent(content)}`,
        term && `utm_term=${encodeURIComponent(term)}`,
      ].filter(Boolean).join('&');
      if (!parts) return baseUrl;
      return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${parts}`;
    }
  }, [baseUrl, source, medium, campaign, content, term]);

  const handleApply = () => {
    onApply({
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
      utm_content: content,
      utm_term: term,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cream-warm rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/10">
          <div>
            <h2 className="text-lg font-bold text-charcoal">UTM Parameter Builder</h2>
            <p className="text-xs text-stone mt-0.5">Add tracking parameters to your URL</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone/10 text-stone">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Auto-generate */}
          {autoGenerateContext && (
            <button
              onClick={handleAutoGenerate}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-teal/30 text-teal text-sm font-medium hover:bg-teal/5 transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              Auto-Generate from Post Details
            </button>
          )}

          {/* Campaign Source */}
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1.5">
              Campaign Source <span className="text-stone">(utm_source)</span>
            </label>
            <div className="flex gap-2">
              <select
                value={SOURCE_PRESETS.includes(source) ? source : ''}
                onChange={e => setSource(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
              >
                <option value="">Select or type below...</option>
                {SOURCE_PRESETS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {!SOURCE_PRESETS.includes(source) && (
              <input
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                placeholder="Custom source..."
              />
            )}
          </div>

          {/* Campaign Medium */}
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1.5">
              Campaign Medium <span className="text-stone">(utm_medium)</span>
            </label>
            <div className="flex gap-2">
              <select
                value={MEDIUM_PRESETS.includes(medium) ? medium : ''}
                onChange={e => setMedium(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
              >
                <option value="">Select or type below...</option>
                {MEDIUM_PRESETS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            {!MEDIUM_PRESETS.includes(medium) && (
              <input
                value={medium}
                onChange={e => setMedium(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                placeholder="Custom medium..."
              />
            )}
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1.5">
              Campaign Name <span className="text-stone">(utm_campaign)</span>
            </label>
            <input
              value={campaign}
              onChange={e => setCampaign(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
              placeholder="e.g. spring-sale-2026"
            />
          </div>

          {/* Campaign Content */}
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1.5">
              Campaign Content <span className="text-stone">(utm_content)</span>
            </label>
            <input
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
              placeholder="e.g. hero-banner"
            />
          </div>

          {/* Campaign Term */}
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1.5">
              Campaign Term <span className="text-stone">(utm_term)</span> <span className="text-stone/60">— optional</span>
            </label>
            <input
              value={term}
              onChange={e => setTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
              placeholder="e.g. brand-awareness"
            />
          </div>

          {/* Tracked URL Preview */}
          {baseUrl && (source || medium || campaign || content || term) && (
            <div className="bg-cream-warm rounded-xl p-3">
              <p className="text-xs font-medium text-stone mb-1">Tracked URL Preview</p>
              <p className="text-xs text-charcoal break-all font-mono">
                {trackedUrl}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-stone/10">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
            disabled={!source && !medium && !campaign}
          >
            Apply UTM Parameters
          </Button>
        </div>
      </div>
    </div>
  );
}
