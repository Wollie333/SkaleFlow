'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  description: string | null;
  call_type: string;
  is_system: boolean;
}

export default function NewCallPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [callType, setCallType] = useState('discovery');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [objective, setObjective] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/calls/templates')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  }, []);

  const callTypes = [
    { value: 'discovery', label: 'Discovery Call' },
    { value: 'sales', label: 'Sales Call' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'custom', label: 'Custom' },
  ];

  async function handleCreate() {
    if (!title) return;
    setCreating(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          callType,
          templateId: templateId || undefined,
          callObjective: objective || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create call');
      const data = await res.json();
      router.push(`/calls/${data.room_code}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-charcoal mb-6">New Call</h1>

      <div className="bg-cream-warm rounded-xl border border-stone/10 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Call Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            placeholder="e.g. Discovery call with John"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Call Type</label>
          <div className="flex flex-wrap gap-2">
            {callTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setCallType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  callType === t.value
                    ? 'bg-teal text-white'
                    : 'bg-cream text-charcoal hover:bg-stone/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Framework Template</label>
            <select
              value={templateId || ''}
              onChange={(e) => setTemplateId(e.target.value || null)}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            >
              <option value="">No template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} {t.is_system ? '(System)' : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Call Objective</label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            rows={3}
            placeholder="What do you want to achieve in this call?"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={!title || creating}
          className="w-full py-3 rounded-lg bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create & Enter Call Room'}
        </button>
      </div>
    </div>
  );
}
