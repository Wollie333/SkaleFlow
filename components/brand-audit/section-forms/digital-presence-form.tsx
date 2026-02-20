'use client';

import { Input } from '@/components/ui/input';
import type { DigitalPresenceData } from '@/lib/brand-audit/types';

interface Props {
  data: DigitalPresenceData;
  onChange: (data: DigitalPresenceData) => void;
}

export function DigitalPresenceForm({ data, onChange }: Props) {
  const update = (field: keyof DigitalPresenceData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const platforms = ['LinkedIn', 'Facebook', 'Instagram', 'Twitter/X', 'TikTok', 'YouTube'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Website Quality</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => update('website_quality', n)} className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${data.website_quality === n ? 'border-teal bg-teal/10 text-teal' : 'border-stone/20 text-stone hover:border-stone/40'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">SEO Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => update('seo_rating', n)} className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${data.seo_rating === n ? 'border-teal bg-teal/10 text-teal' : 'border-stone/20 text-stone hover:border-stone/40'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Website Last Updated</label>
        <Input value={data.website_last_updated || ''} onChange={(e) => update('website_last_updated', e.target.value)} placeholder="e.g. 2024, Recently, Never" />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Active Social Platforms</label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => {
            const active = (data.social_platforms || []).includes(p);
            return (
              <button key={p} onClick={() => {
                const current = data.social_platforms || [];
                update('social_platforms', active ? current.filter((x) => x !== p) : [...current, p]);
              }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${active ? 'border-teal bg-teal/10 text-teal' : 'border-stone/20 text-stone hover:border-stone/40'}`}>
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Social Engagement Notes</label>
        <textarea value={data.social_engagement_notes || ''} onChange={(e) => update('social_engagement_notes', e.target.value)} placeholder="How engaged is their social media following?" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Content Strategy?</label>
          <select value={data.content_strategy_exists === true ? 'yes' : data.content_strategy_exists === false ? 'no' : ''} onChange={(e) => update('content_strategy_exists', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Paid Advertising?</label>
          <select value={data.paid_advertising === true ? 'yes' : data.paid_advertising === false ? 'no' : ''} onChange={(e) => update('paid_advertising', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Email Marketing?</label>
          <select value={data.email_marketing === true ? 'yes' : data.email_marketing === false ? 'no' : ''} onChange={(e) => update('email_marketing', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Advertising Notes</label>
        <textarea value={data.advertising_notes || ''} onChange={(e) => update('advertising_notes', e.target.value)} placeholder="Details about paid advertising efforts..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
      </div>
    </div>
  );
}
