'use client';

import { Card } from '@/components/ui';
import { XMarkIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { FORMAT_LABELS, type ContentFormat } from '@/config/script-frameworks';
import type { FunnelStage, StoryBrandStage } from '@/types/database';

export interface VariationSlotConfig {
  id: string;
  funnelStage: FunnelStage;
  storybrandStage: StoryBrandStage;
  format: ContentFormat;
  templateOverride: string | null;
}

const FUNNEL_STAGES: { value: FunnelStage; label: string; short: string }[] = [
  { value: 'awareness', label: 'Awareness', short: 'AWR' },
  { value: 'consideration', label: 'Consideration', short: 'CON' },
  { value: 'conversion', label: 'Conversion', short: 'CVR' },
];

const STORYBRAND_STAGES: { value: StoryBrandStage; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'external_problem', label: 'External Problem' },
  { value: 'internal_problem', label: 'Internal Problem' },
  { value: 'philosophical_problem', label: 'Philosophical Problem' },
  { value: 'guide', label: 'Guide' },
  { value: 'plan', label: 'Plan' },
  { value: 'call_to_action', label: 'Call to Action' },
  { value: 'failure', label: 'Failure' },
  { value: 'success', label: 'Success' },
];

const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS) as [ContentFormat, string][];

const FUNNEL_COLORS: Record<FunnelStage, string> = {
  awareness: 'bg-green-500 text-white',
  consideration: 'bg-blue-500 text-white',
  conversion: 'bg-orange-500 text-white',
};

interface VariationSlotEditorProps {
  slot: VariationSlotConfig;
  onChange: (updated: VariationSlotConfig) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
  index: number;
  templates: Array<{ template_key: string; name: string; category: string; format_category: string | null }>;
}

export function VariationSlotEditor({
  slot,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
  index,
  templates,
}: VariationSlotEditorProps) {
  return (
    <Card className="relative border border-stone/15">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-charcoal">Variation {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            className="p-1.5 rounded-lg hover:bg-stone/10 text-stone hover:text-charcoal transition-colors"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-red-50 text-stone hover:text-red-500 transition-colors"
              title="Remove"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Format */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-stone/60 mb-1">Format</label>
        <select
          value={slot.format}
          onChange={e => onChange({ ...slot, format: e.target.value as ContentFormat })}
          className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
        >
          {FORMAT_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Funnel Stage — chip buttons */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-stone/60 mb-1">Funnel Stage</label>
        <div className="flex gap-1.5">
          {FUNNEL_STAGES.map(f => (
            <button
              key={f.value}
              onClick={() => onChange({ ...slot, funnelStage: f.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                slot.funnelStage === f.value
                  ? FUNNEL_COLORS[f.value]
                  : 'bg-stone/5 text-stone hover:bg-stone/10'
              }`}
            >
              {f.short}
            </button>
          ))}
        </div>
      </div>

      {/* StoryBrand Stage */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-stone/60 mb-1">StoryBrand Stage</label>
        <select
          value={slot.storybrandStage}
          onChange={e => onChange({ ...slot, storybrandStage: e.target.value as StoryBrandStage })}
          className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
        >
          {STORYBRAND_STAGES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Template Override */}
      {templates.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-stone/60 mb-1">Template</label>
          <select
            value={slot.templateOverride || ''}
            onChange={e => onChange({ ...slot, templateOverride: e.target.value || null })}
            className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            <option value="">Auto (AI chooses)</option>
            {templates.map(t => (
              <option key={t.template_key} value={t.template_key}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </Card>
  );
}
