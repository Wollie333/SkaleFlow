'use client';

import { Input } from '@/components/ui/input';
import type { BrandFoundationData } from '@/lib/brand-audit/types';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Props {
  data: BrandFoundationData;
  onChange: (data: BrandFoundationData) => void;
}

export function BrandFoundationForm({ data, onChange }: Props) {
  const update = (field: keyof BrandFoundationData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const addToList = (field: 'core_values' | 'brand_personality', value: string) => {
    if (!value.trim()) return;
    const current = data[field] || [];
    update(field, [...current, value.trim()]);
  };

  const removeFromList = (field: 'core_values' | 'brand_personality', index: number) => {
    const current = data[field] || [];
    update(field, current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Mission Statement</label>
        <textarea value={data.mission_statement || ''} onChange={(e) => update('mission_statement', e.target.value)} placeholder="What is the purpose of this business?" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[80px]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Vision Statement</label>
        <textarea value={data.vision_statement || ''} onChange={(e) => update('vision_statement', e.target.value)} placeholder="What future does this brand aspire to create?" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[80px]" />
      </div>

      {/* Core Values */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Core Values</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(data.core_values || []).map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal rounded-full text-xs">
              {v}
              <button onClick={() => removeFromList('core_values', i)}><XMarkIcon className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add a core value..." onKeyDown={(e) => { if (e.key === 'Enter') { addToList('core_values', e.currentTarget.value); e.currentTarget.value = ''; } }} />
        </div>
      </div>

      {/* Brand Personality */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Brand Personality (3-5 words)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(data.brand_personality || []).map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 text-gold rounded-full text-xs">
              {v}
              <button onClick={() => removeFromList('brand_personality', i)}><XMarkIcon className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add a personality trait..." onKeyDown={(e) => { if (e.key === 'Enter') { addToList('brand_personality', e.currentTarget.value); e.currentTarget.value = ''; } }} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Brand Promise</label>
        <Input value={data.brand_promise || ''} onChange={(e) => update('brand_promise', e.target.value)} placeholder="What do you promise your customers?" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Brand Archetype</label>
        <select value={data.brand_archetype || ''} onChange={(e) => update('brand_archetype', e.target.value)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
          <option value="">Select...</option>
          {['The Hero', 'The Sage', 'The Explorer', 'The Outlaw', 'The Magician', 'The Innocent', 'The Creator', 'The Ruler', 'The Caregiver', 'The Jester', 'The Lover', 'The Everyman'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Unique Value Proposition</label>
        <textarea value={data.unique_value_proposition || ''} onChange={(e) => update('unique_value_proposition', e.target.value)} placeholder="What makes this brand uniquely valuable?" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[80px]" />
      </div>
    </div>
  );
}
