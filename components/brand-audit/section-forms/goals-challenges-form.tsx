'use client';

import { Input } from '@/components/ui/input';
import type { GoalsChallengesData } from '@/lib/brand-audit/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  data: GoalsChallengesData;
  onChange: (data: GoalsChallengesData) => void;
}

export function GoalsChallengesForm({ data, onChange }: Props) {
  const update = (field: keyof GoalsChallengesData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const renderListField = (field: 'short_term_goals' | 'long_term_goals', label: string, placeholder: string) => (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1">{label}</label>
      <div className="space-y-2 mb-2">
        {(data[field] || []).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-charcoal bg-cream-warm rounded-lg px-3 py-2">{item}</span>
            <button onClick={() => update(field, (data[field] || []).filter((_, idx) => idx !== i))} className="text-stone hover:text-red-500">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <Input placeholder={placeholder} onKeyDown={(e) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
          update(field, [...(data[field] || []), e.currentTarget.value.trim()]);
          e.currentTarget.value = '';
        }
      }} />
    </div>
  );

  return (
    <div className="space-y-4">
      {renderListField('short_term_goals', 'Short-Term Goals (next 12 months)', 'Add a goal and press Enter...')}
      {renderListField('long_term_goals', 'Long-Term Goals (3-5 years)', 'Add a goal and press Enter...')}

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Biggest Brand Challenge</label>
        <textarea value={data.biggest_challenge || ''} onChange={(e) => update('biggest_challenge', e.target.value)} placeholder="What is the single biggest brand challenge right now?" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[80px]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Budget Range</label>
          <select value={data.budget_range || ''} onChange={(e) => update('budget_range', e.target.value)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="<R10K">Less than R10K/month</option>
            <option value="R10K-R25K">R10K - R25K/month</option>
            <option value="R25K-R50K">R25K - R50K/month</option>
            <option value="R50K-R100K">R50K - R100K/month</option>
            <option value=">R100K">More than R100K/month</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Timeline</label>
          <Input value={data.timeline || ''} onChange={(e) => update('timeline', e.target.value)} placeholder="e.g. Immediate, Q2 2026" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Additional Notes</label>
        <textarea value={data.additional_notes || ''} onChange={(e) => update('additional_notes', e.target.value)} placeholder="Anything else to consider in the audit..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[80px]" />
      </div>
    </div>
  );
}
