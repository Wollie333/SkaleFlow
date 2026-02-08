'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui';
import { XMarkIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';
import { FORMAT_LABELS, type ContentFormat } from '@/config/script-frameworks';
import type { FunnelStage, StoryBrandStage } from '@/types/database';

interface QuickCreateModalProps {
  date: Date;
  onClose: () => void;
  onCreate: (data: {
    scheduled_date: string;
    scheduled_time?: string;
    format: ContentFormat;
    funnel_stage: FunnelStage;
    storybrand_stage: StoryBrandStage;
    platforms: string[];
    generateImmediately: boolean;
  }) => Promise<void>;
}

const FUNNEL_OPTIONS: { value: FunnelStage; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'consideration', label: 'Consideration' },
  { value: 'conversion', label: 'Conversion' },
];

const STORYBRAND_OPTIONS: { value: StoryBrandStage; label: string }[] = [
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

const PLATFORM_OPTIONS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];

const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS).map(([value, label]) => ({ value: value as ContentFormat, label }));

export function QuickCreateModal({ date, onClose, onCreate }: QuickCreateModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>('short_video_30_60');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('awareness');
  const [storybrandStage, setStorybrandStage] = useState<StoryBrandStage>('character');
  const [platforms, setPlatforms] = useState<string[]>(['linkedin']);
  const [scheduledTime, setScheduledTime] = useState(() => {
    const now = new Date();
    const mins = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(mins, 0, 0);
    return format(now, 'HH:mm');
  });
  const [isCreating, setIsCreating] = useState(false);

  const togglePlatform = (p: string) => {
    setPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleCreate = async (generateImmediately: boolean) => {
    setIsCreating(true);
    try {
      await onCreate({
        scheduled_date: format(date, 'yyyy-MM-dd'),
        scheduled_time: scheduledTime,
        format: selectedFormat,
        funnel_stage: funnelStage,
        storybrand_stage: storybrandStage,
        platforms,
        generateImmediately,
      });
      onClose();
    } catch (e) {
      console.error('Create failed:', e);
    }
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-stone/10 flex items-center justify-between">
          <div>
            <h3 className="text-heading-sm text-charcoal">Add Post</h3>
            <p className="text-sm text-stone">{format(date, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cream-warm rounded-lg"><XMarkIcon className="w-5 h-5 text-stone" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Format</label>
            <select value={selectedFormat} onChange={e => setSelectedFormat(e.target.value as ContentFormat)} className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal">
              {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Funnel Stage</label>
            <select value={funnelStage} onChange={e => setFunnelStage(e.target.value as FunnelStage)} className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal">
              {FUNNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">StoryBrand Stage</label>
            <select value={storybrandStage} onChange={e => setStorybrandStage(e.target.value as StoryBrandStage)} className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal">
              {STORYBRAND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(p => (
                <button key={p} onClick={() => togglePlatform(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${platforms.includes(p) ? 'bg-teal text-white' : 'bg-stone/5 text-stone hover:bg-stone/10'}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-stone/10 flex gap-3">
          <Button onClick={() => handleCreate(false)} variant="ghost" className="flex-1" disabled={isCreating || platforms.length === 0}>
            <PlusIcon className="w-4 h-4 mr-1" /> Create Empty
          </Button>
          <Button onClick={() => handleCreate(true)} className="flex-1" disabled={isCreating || platforms.length === 0}>
            <SparklesIcon className="w-4 h-4 mr-1" /> {isCreating ? 'Creating...' : 'Create & Generate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
