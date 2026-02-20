'use client';

import { Input } from '@/components/ui/input';
import type { CompetitiveLandscapeData } from '@/lib/brand-audit/types';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  data: CompetitiveLandscapeData;
  onChange: (data: CompetitiveLandscapeData) => void;
}

export function CompetitiveLandscapeForm({ data, onChange }: Props) {
  const update = (field: keyof CompetitiveLandscapeData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const competitors = data.competitors || [];

  const addCompetitor = () => {
    update('competitors', [...competitors, { name: '', website: '', strengths: '', weaknesses: '' }]);
  };

  const updateCompetitor = (index: number, field: string, value: string) => {
    const updated = competitors.map((c, i) => i === index ? { ...c, [field]: value } : c);
    update('competitors', updated);
  };

  const removeCompetitor = (index: number) => {
    update('competitors', competitors.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Competitors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-charcoal">Competitors</label>
          <button onClick={addCompetitor} className="flex items-center gap-1 text-xs text-teal hover:text-teal-dark">
            <PlusIcon className="w-4 h-4" /> Add Competitor
          </button>
        </div>
        <div className="space-y-3">
          {competitors.map((comp, i) => (
            <div key={i} className="p-3 border border-stone/15 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone">Competitor {i + 1}</span>
                <button onClick={() => removeCompetitor(i)} className="text-stone hover:text-red-500">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={comp.name} onChange={(e) => updateCompetitor(i, 'name', e.target.value)} placeholder="Name" />
                <Input value={comp.website || ''} onChange={(e) => updateCompetitor(i, 'website', e.target.value)} placeholder="Website" />
              </div>
              <Input value={comp.strengths || ''} onChange={(e) => updateCompetitor(i, 'strengths', e.target.value)} placeholder="Their strengths" />
              <Input value={comp.weaknesses || ''} onChange={(e) => updateCompetitor(i, 'weaknesses', e.target.value)} placeholder="Their weaknesses" />
            </div>
          ))}
          {competitors.length === 0 && (
            <p className="text-xs text-stone text-center py-4">No competitors added yet</p>
          )}
        </div>
      </div>

      {/* Competitive Advantages */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Competitive Advantages</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(data.competitive_advantages || []).map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal rounded-full text-xs">
              {v}
              <button onClick={() => update('competitive_advantages', (data.competitive_advantages || []).filter((_, idx) => idx !== i))}><XMarkIcon className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <Input placeholder="Add an advantage and press Enter..." onKeyDown={(e) => {
          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            update('competitive_advantages', [...(data.competitive_advantages || []), e.currentTarget.value.trim()]);
            e.currentTarget.value = '';
          }
        }} />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Market Position</label>
        <Input value={data.market_position || ''} onChange={(e) => update('market_position', e.target.value)} placeholder="e.g. Market leader, challenger, niche player" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Industry Trends</label>
        <textarea value={data.industry_trends || ''} onChange={(e) => update('industry_trends', e.target.value)} placeholder="Key trends affecting the industry..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Threats</label>
          <textarea value={data.threats || ''} onChange={(e) => update('threats', e.target.value)} placeholder="External threats..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Opportunities</label>
          <textarea value={data.opportunities || ''} onChange={(e) => update('opportunities', e.target.value)} placeholder="Growth opportunities..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
        </div>
      </div>
    </div>
  );
}
