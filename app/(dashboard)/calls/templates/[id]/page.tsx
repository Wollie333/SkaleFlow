'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface Phase {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  questions: string[];
  transitionTriggers: string[];
  aiInstructions: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  call_type: string;
  is_system: boolean;
  phases: Phase[];
  opening_script: string | null;
  closing_script: string | null;
  objection_bank: Array<{ objection: string; response: string }>;
}

export default function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetch(`/api/calls/templates/${id}`)
      .then(r => r.json())
      .then(data => { setTemplate(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!template || template.is_system) return;
    setSaving(true);
    await fetch(`/api/calls/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        description: template.description,
        call_type: template.call_type,
        phases: template.phases,
        opening_script: template.opening_script,
        closing_script: template.closing_script,
        objection_bank: template.objection_bank,
      }),
    });
    setSaving(false);
  }

  async function handleClone() {
    if (!template) return;
    setCloning(true);
    try {
      const res = await fetch(`/api/calls/templates/${id}/clone`, { method: 'POST' });
      if (res.ok) {
        const clone = await res.json();
        router.push(`/calls/templates/${clone.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to clone template');
      }
    } catch {
      alert('Network error');
    } finally {
      setCloning(false);
    }
  }

  if (loading) return <div className="p-8 text-stone">Loading...</div>;
  if (!template) return <div className="p-8 text-stone">Template not found</div>;

  const isReadOnly = template.is_system;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-sm text-teal hover:underline">
          &larr; Back to Templates
        </button>
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <button
              onClick={handleClone}
              disabled={cloning}
              className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal/90 disabled:opacity-50"
            >
              {cloning ? 'Cloning...' : 'Clone Template'}
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-cream-warm rounded-xl border border-stone/10 p-6 space-y-6">
        {isReadOnly && (
          <div className="px-3 py-2 bg-teal/5 border border-teal/10 rounded-lg text-xs text-teal">
            System template (read-only). Duplicate to customise.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
          <input
            type="text"
            value={template.name}
            onChange={e => !isReadOnly && setTemplate({ ...template, name: e.target.value })}
            readOnly={isReadOnly}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
          <textarea
            value={template.description || ''}
            onChange={e => !isReadOnly && setTemplate({ ...template, description: e.target.value })}
            readOnly={isReadOnly}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm"
            rows={2}
          />
        </div>

        {/* Phases */}
        <div>
          <h3 className="text-sm font-semibold text-charcoal mb-3">Phases ({template.phases.length})</h3>
          <div className="space-y-4">
            {template.phases.map((phase, idx) => (
              <div key={phase.id} className="border border-stone/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-teal/10 text-teal text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <h4 className="font-medium text-charcoal text-sm">{phase.name}</h4>
                  <span className="text-xs text-stone ml-auto">{phase.durationMinutes} min</span>
                </div>
                <p className="text-xs text-stone mb-2">{phase.description}</p>
                {phase.questions.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-charcoal">Questions:</span>
                    <ul className="mt-1 space-y-1">
                      {phase.questions.map((q, qi) => (
                        <li key={qi} className="text-xs text-stone pl-3 before:content-['•'] before:mr-1 before:text-teal">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-xs text-stone/70 italic">{phase.aiInstructions}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Opening/Closing Scripts */}
        {template.opening_script && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Opening Script</label>
            <div className="px-3 py-2 bg-cream rounded-lg text-sm text-charcoal">{template.opening_script}</div>
          </div>
        )}
        {template.closing_script && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Closing Script</label>
            <div className="px-3 py-2 bg-cream rounded-lg text-sm text-charcoal">{template.closing_script}</div>
          </div>
        )}

        {/* Objection Bank */}
        {template.objection_bank.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-charcoal mb-3">Objection Bank ({template.objection_bank.length})</h3>
            <div className="space-y-3">
              {template.objection_bank.map((obj, i) => (
                <div key={i} className="border border-stone/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-600 mb-1">&ldquo;{obj.objection}&rdquo;</p>
                  <p className="text-sm text-charcoal">{obj.response}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
