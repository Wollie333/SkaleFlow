'use client';

import { Input } from '@/components/ui/input';
import type { MessagingData } from '@/lib/brand-audit/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  data: MessagingData;
  onChange: (data: MessagingData) => void;
}

export function MessagingForm({ data, onChange }: Props) {
  const update = (field: keyof MessagingData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Tagline / Slogan</label>
        <Input value={data.tagline || ''} onChange={(e) => update('tagline', e.target.value)} placeholder="e.g. Just Do It" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Elevator Pitch</label>
        <textarea value={data.elevator_pitch || ''} onChange={(e) => update('elevator_pitch', e.target.value)} placeholder="30-second description of the business..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[80px]" />
      </div>

      {/* Key Messages */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Key Messages</label>
        <div className="space-y-2 mb-2">
          {(data.key_messages || []).map((msg, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-charcoal bg-cream-warm rounded-lg px-3 py-2">{msg}</span>
              <button onClick={() => update('key_messages', (data.key_messages || []).filter((_, idx) => idx !== i))} className="text-stone hover:text-red-500">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Input placeholder="Add a key message and press Enter..." onKeyDown={(e) => {
          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            update('key_messages', [...(data.key_messages || []), e.currentTarget.value.trim()]);
            e.currentTarget.value = '';
          }
        }} />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Tone of Voice</label>
        <Input value={data.tone_of_voice || ''} onChange={(e) => update('tone_of_voice', e.target.value)} placeholder="e.g. Professional, warm, authoritative" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Brand Story</label>
        <textarea value={data.brand_story || ''} onChange={(e) => update('brand_story', e.target.value)} placeholder="The origin story and narrative of the brand..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[100px]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Messaging Consistency Notes</label>
        <textarea value={data.messaging_consistency_notes || ''} onChange={(e) => update('messaging_consistency_notes', e.target.value)} placeholder="How consistent is messaging across channels?" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
      </div>
    </div>
  );
}
