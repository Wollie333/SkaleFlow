'use client';

import { Input } from '@/components/ui/input';
import type { VisualIdentityData } from '@/lib/brand-audit/types';

interface Props {
  data: VisualIdentityData;
  onChange: (data: VisualIdentityData) => void;
}

export function VisualIdentityForm({ data, onChange }: Props) {
  const update = (field: keyof VisualIdentityData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Professional Logo?</label>
          <select value={data.has_professional_logo === true ? 'yes' : data.has_professional_logo === false ? 'no' : ''} onChange={(e) => update('has_professional_logo', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Brand Guidelines Exist?</label>
          <select value={data.brand_guidelines_exist === true ? 'yes' : data.brand_guidelines_exist === false ? 'no' : ''} onChange={(e) => update('brand_guidelines_exist', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Logo Quality Notes</label>
        <textarea value={data.logo_quality_notes || ''} onChange={(e) => update('logo_quality_notes', e.target.value)} placeholder="Notes about logo design quality, versatility, etc." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Primary Colours</label>
          <Input value={(data.primary_colors || []).join(', ')} onChange={(e) => update('primary_colors', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="e.g. #0F1F1D, #C9A84C" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Secondary Colours</label>
          <Input value={(data.secondary_colors || []).join(', ')} onChange={(e) => update('secondary_colors', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="e.g. #F5F3EE, #1A3A36" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Typography Notes</label>
        <Input value={data.typography_notes || ''} onChange={(e) => update('typography_notes', e.target.value)} placeholder="e.g. Uses Montserrat for headings, Inter for body" />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Visual Consistency Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => update('consistency_rating', n)} className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${data.consistency_rating === n ? 'border-teal bg-teal/10 text-teal' : 'border-stone/20 text-stone hover:border-stone/40'}`}>
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone mt-1">1 = Very inconsistent, 5 = Perfectly consistent</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Additional Notes</label>
        <textarea value={data.visual_identity_notes || ''} onChange={(e) => update('visual_identity_notes', e.target.value)} placeholder="Any other visual identity observations..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
      </div>
    </div>
  );
}
