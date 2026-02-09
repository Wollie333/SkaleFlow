'use client';

import { useState, useCallback, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { FunnelStage, StoryBrandStage } from '@/types/database';
import { type ContentFormat, FORMAT_LABELS } from '@/config/script-frameworks';

export interface ContentConfig {
  format: ContentFormat;
  funnelStage: FunnelStage;
  storybrandStage: StoryBrandStage;
  angleId: string | null;
}

interface ContentAngle {
  id: string;
  name: string;
  emotional_target: string | null;
}

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ContentConfig;
  onSave: (config: ContentConfig) => void;
  angles: ContentAngle[];
}

const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS) as Array<[ContentFormat, string]>;

const FUNNEL_STAGES: Array<{ value: FunnelStage; label: string }> = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'consideration', label: 'Consideration' },
  { value: 'conversion', label: 'Conversion' },
];

const STORYBRAND_STAGES: Array<{ value: StoryBrandStage; label: string }> = [
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

export default function ConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
  angles,
}: ConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<ContentConfig>({ ...config });

  useEffect(() => {
    if (isOpen) setLocalConfig({ ...config });
  }, [isOpen, config]);

  const handleSave = useCallback(() => {
    onSave(localConfig);
    onClose();
  }, [localConfig, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-charcoal-900">Content Configuration</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-stone-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Format</label>
            <select
              value={localConfig.format}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, format: e.target.value as ContentFormat }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {FORMAT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Funnel Stage */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Funnel Stage</label>
            <div className="flex gap-2">
              {FUNNEL_STAGES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocalConfig(prev => ({ ...prev, funnelStage: value }))}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    localConfig.funnelStage === value
                      ? 'bg-teal-50 text-teal-700 border-teal-300'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* StoryBrand Stage */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">StoryBrand Stage</label>
            <select
              value={localConfig.storybrandStage}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, storybrandStage: e.target.value as StoryBrandStage }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {STORYBRAND_STAGES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Content Angle */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Content Angle</label>
            <select
              value={localConfig.angleId || ''}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, angleId: e.target.value || null }))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">No specific angle</option>
              {angles.map((angle) => (
                <option key={angle.id} value={angle.id}>
                  {angle.name}
                  {angle.emotional_target ? ` — ${angle.emotional_target}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfigSummaryChip({ config, angles }: { config: ContentConfig; angles: ContentAngle[] }) {
  const formatLabel = FORMAT_LABELS[config.format] || config.format;
  const funnelLabel = config.funnelStage.charAt(0).toUpperCase() + config.funnelStage.slice(1);
  const sbLabel = STORYBRAND_STAGES.find(s => s.value === config.storybrandStage)?.label || config.storybrandStage;
  const angleLabel = config.angleId ? angles.find(a => a.id === config.angleId)?.name : null;

  const parts = [formatLabel, funnelLabel, sbLabel];
  if (angleLabel) parts.push(angleLabel);

  return (
    <span className="inline-flex items-center px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md text-xs">
      {parts.join(' | ')}
    </span>
  );
}
