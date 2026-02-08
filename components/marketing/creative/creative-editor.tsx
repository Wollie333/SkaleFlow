'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { AdFormatSelector } from '@/components/marketing/shared/ad-format-selector';
import { ComplianceIssuesPanel } from './compliance-issues-panel';
import {
  PhotoIcon,
  ArrowPathIcon,
  LinkIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface CreativeEditorProps {
  creative?: any;
  platform: 'meta' | 'tiktok';
  campaignId?: string;
  adSetId?: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const CTA_TYPES = [
  { value: 'learn_more', label: 'Learn More' },
  { value: 'shop_now', label: 'Shop Now' },
  { value: 'sign_up', label: 'Sign Up' },
  { value: 'book_now', label: 'Book Now' },
  { value: 'contact_us', label: 'Contact Us' },
  { value: 'download', label: 'Download' },
  { value: 'get_offer', label: 'Get Offer' },
  { value: 'get_quote', label: 'Get Quote' },
  { value: 'subscribe', label: 'Subscribe' },
  { value: 'watch_more', label: 'Watch More' },
  { value: 'apply_now', label: 'Apply Now' },
  { value: 'order_now', label: 'Order Now' },
];

export function CreativeEditor({
  creative,
  platform,
  campaignId,
  adSetId,
  onSave,
  onCancel,
}: CreativeEditorProps) {
  const [name, setName] = useState(creative?.name || '');
  const [adFormat, setAdFormat] = useState(creative?.ad_format || '');
  const [primaryText, setPrimaryText] = useState(creative?.primary_text || '');
  const [headline, setHeadline] = useState(creative?.headline || '');
  const [description, setDescription] = useState(creative?.description || '');
  const [ctaType, setCtaType] = useState(creative?.cta_type || 'learn_more');
  const [targetUrl, setTargetUrl] = useState(creative?.target_url || '');
  const [displayLink, setDisplayLink] = useState(creative?.display_link || '');
  const [utmSource, setUtmSource] = useState(creative?.utm_parameters?.utm_source || '');
  const [utmMedium, setUtmMedium] = useState(creative?.utm_parameters?.utm_medium || '');
  const [utmCampaign, setUtmCampaign] = useState(creative?.utm_parameters?.utm_campaign || '');
  const [utmContent, setUtmContent] = useState(creative?.utm_parameters?.utm_content || '');
  const [mediaUrls, setMediaUrls] = useState<string[]>(creative?.media_urls || []);
  const [complianceIssues, setComplianceIssues] = useState<any[]>(creative?.compliance_issues || []);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Character limits
  const primaryTextLimit = platform === 'meta' ? 125 : 150;
  const primaryTextMaxLimit = platform === 'meta' ? 475 : 300;
  const headlineLimit = platform === 'meta' ? 40 : 60;
  const descriptionLimit = platform === 'meta' ? 30 : 100;

  const autoGenerateUtm = () => {
    setUtmSource(platform === 'meta' ? 'facebook' : 'tiktok');
    setUtmMedium('paid_social');
    setUtmCampaign(name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'campaign');
    setUtmContent(adFormat || 'ad');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // In a real implementation, this would upload the files
    // For now, we create object URLs for preview
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (imageFiles.length > 0) {
      const urls = imageFiles.map((f) => URL.createObjectURL(f));
      setMediaUrls((prev) => [...prev, ...urls]);
    }
  }, []);

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/marketing/creatives/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          ad_format: adFormat,
          primary_text: primaryText,
          headline,
          description,
          target_url: targetUrl,
          media_urls: mediaUrls,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComplianceIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        name,
        ad_format: adFormat,
        primary_text: primaryText,
        headline,
        description,
        cta_type: ctaType,
        target_url: targetUrl,
        display_link: displayLink || null,
        utm_parameters: {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
        },
        media_urls: mediaUrls,
        campaign_id: campaignId,
        ad_set_id: adSetId,
        compliance_issues: complianceIssues,
      };
      onSave(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-teal/8 overflow-hidden">
      <div className="p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Creative Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Summer Sale - Video Ad"
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'placeholder:text-stone/60 border-stone/20 hover:border-stone/40'
            )}
          />
        </div>

        {/* Format */}
        <AdFormatSelector
          platform={platform}
          value={adFormat}
          onChange={setAdFormat}
        />

        {/* Primary Text */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-charcoal">
              Primary Text
            </label>
            <span
              className={cn(
                'text-xs font-medium',
                primaryText.length > primaryTextMaxLimit
                  ? 'text-red-500'
                  : primaryText.length > primaryTextLimit
                  ? 'text-yellow-600'
                  : 'text-stone'
              )}
            >
              {primaryText.length}/{primaryTextLimit}
              {primaryText.length > primaryTextLimit && ` (max ${primaryTextMaxLimit})`}
            </span>
          </div>
          <textarea
            value={primaryText}
            onChange={(e) => setPrimaryText(e.target.value)}
            rows={4}
            placeholder="Write your ad copy here..."
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'placeholder:text-stone/60',
              primaryText.length > primaryTextMaxLimit
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-stone/20 hover:border-stone/40'
            )}
          />
          {primaryText.length > primaryTextLimit && primaryText.length <= primaryTextMaxLimit && (
            <p className="text-xs text-yellow-600 mt-1">
              Text above {primaryTextLimit} chars will be truncated with &quot;See More&quot; on {platform === 'meta' ? 'Meta' : 'TikTok'}.
            </p>
          )}
        </div>

        {/* Headline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-charcoal">Headline</label>
            <span
              className={cn(
                'text-xs font-medium',
                headline.length > headlineLimit ? 'text-red-500' : 'text-stone'
              )}
            >
              {headline.length}/{headlineLimit}
            </span>
          </div>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Short compelling headline"
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'placeholder:text-stone/60',
              headline.length > headlineLimit
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-stone/20 hover:border-stone/40'
            )}
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-charcoal">Description</label>
            <span
              className={cn(
                'text-xs font-medium',
                description.length > descriptionLimit ? 'text-red-500' : 'text-stone'
              )}
            >
              {description.length}/{descriptionLimit}
            </span>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={platform === 'meta' ? 'Short description (optional)' : 'Ad description'}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'placeholder:text-stone/60',
              description.length > descriptionLimit
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-stone/20 hover:border-stone/40'
            )}
          />
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
            {CTA_TYPES.map((cta) => (
              <option key={cta.value} value={cta.value}>
                {cta.label}
              </option>
            ))}
          </select>
        </div>

        {/* Target URL */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Target URL
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://yoursite.com/landing-page"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border bg-white transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                'placeholder:text-stone/60 border-stone/20 hover:border-stone/40'
              )}
            />
          </div>
        </div>

        {/* UTM Parameters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-charcoal">
              UTM Parameters
            </label>
            <button
              type="button"
              onClick={autoGenerateUtm}
              className="text-xs text-teal hover:text-teal-light font-medium transition-colors"
            >
              Auto-generate
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-stone mb-1">Source</label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="facebook"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-white transition-all duration-200 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                  'placeholder:text-stone/60 border-stone/20'
                )}
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone mb-1">Medium</label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="paid_social"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-white transition-all duration-200 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                  'placeholder:text-stone/60 border-stone/20'
                )}
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone mb-1">Campaign</label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="summer_sale"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-white transition-all duration-200 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                  'placeholder:text-stone/60 border-stone/20'
                )}
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone mb-1">Content</label>
              <input
                type="text"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="video_ad"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-white transition-all duration-200 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                  'placeholder:text-stone/60 border-stone/20'
                )}
              />
            </div>
          </div>
        </div>

        {/* Display Link (Meta only) */}
        {platform === 'meta' && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Display Link <span className="text-stone font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={displayLink}
              onChange={(e) => setDisplayLink(e.target.value)}
              placeholder="yoursite.com"
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                'placeholder:text-stone/60 border-stone/20 hover:border-stone/40'
              )}
            />
            <p className="text-xs text-stone mt-1">
              Shortened URL shown in the ad. Must match your target URL domain.
            </p>
          </div>
        )}

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Media
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200',
              isDragging
                ? 'border-teal bg-teal/5'
                : 'border-stone/20 hover:border-stone/40 bg-cream-warm/10'
            )}
          >
            <PhotoIcon className="w-10 h-10 text-stone/40 mx-auto mb-2" />
            <p className="text-sm text-stone">
              Drag and drop images or videos here
            </p>
            <p className="text-xs text-stone/60 mt-1">
              Supported: JPG, PNG, MP4, MOV (max 100MB)
            </p>
          </div>

          {/* Media previews */}
          {mediaUrls.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-stone/20 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Media ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance Validation */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            isLoading={isValidating}
            className="border-stone/20 text-charcoal hover:bg-cream-warm/20"
          >
            <ShieldCheckIcon className="w-4 h-4 mr-1.5" />
            Validate Compliance
          </Button>

          {complianceIssues.length > 0 && (
            <ComplianceIssuesPanel
              issues={complianceIssues}
              onRevalidate={handleValidate}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone/10 bg-cream-warm/10 flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!name.trim() || !adFormat || !primaryText.trim()}
        >
          {creative ? 'Update Creative' : 'Save Creative'}
        </Button>
      </div>
    </div>
  );
}
