'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Phase {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  questions: string[];
  transitionTriggers: string[];
  aiInstructions: string;
}

const CALL_TYPES = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'sales', label: 'Sales' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'custom', label: 'Custom' },
];

function newPhase(): Phase {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    durationMinutes: 5,
    questions: [''],
    transitionTriggers: [],
    aiInstructions: '',
  };
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [callType, setCallType] = useState('custom');
  const [openingScript, setOpeningScript] = useState('');
  const [closingScript, setClosingScript] = useState('');
  const [phases, setPhases] = useState<Phase[]>([newPhase()]);
  const [objectionBank, setObjectionBank] = useState<Array<{ objection: string; response: string }>>([]);

  const updatePhase = (idx: number, updates: Partial<Phase>) => {
    setPhases(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const addQuestion = (phaseIdx: number) => {
    setPhases(prev => prev.map((p, i) =>
      i === phaseIdx ? { ...p, questions: [...p.questions, ''] } : p
    ));
  };

  const updateQuestion = (phaseIdx: number, qIdx: number, value: string) => {
    setPhases(prev => prev.map((p, i) =>
      i === phaseIdx ? { ...p, questions: p.questions.map((q, qi) => qi === qIdx ? value : q) } : p
    ));
  };

  const removeQuestion = (phaseIdx: number, qIdx: number) => {
    setPhases(prev => prev.map((p, i) =>
      i === phaseIdx ? { ...p, questions: p.questions.filter((_, qi) => qi !== qIdx) } : p
    ));
  };

  const handleSave = async () => {
    if (!name.trim()) { alert('Template name is required'); return; }
    setSaving(true);

    try {
      const cleanPhases = phases
        .filter(p => p.name.trim())
        .map(p => ({ ...p, questions: p.questions.filter(q => q.trim()) }));

      const cleanObjections = objectionBank.filter(o => o.objection.trim() && o.response.trim());

      const res = await fetch('/api/calls/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          callType,
          phases: cleanPhases,
          openingScript: openingScript.trim() || null,
          closingScript: closingScript.trim() || null,
          objectionBank: cleanObjections,
        }),
      });

      if (res.ok) {
        const template = await res.json();
        router.push(`/calls/templates/${template.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create template');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-sm text-teal hover:underline">
          &larr; Back to Templates
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90 disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Template'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone/10 p-6 space-y-6">
        <h2 className="font-serif text-xl font-bold text-charcoal">New Call Template</h2>

        {/* Name & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Discovery Call Framework"
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Call Type</label>
            <select
              value={callType}
              onChange={e => setCallType(e.target.value)}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white"
            >
              {CALL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Briefly describe what this template is for..."
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            rows={2}
          />
        </div>

        {/* Opening Script */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Opening Script</label>
          <textarea
            value={openingScript}
            onChange={e => setOpeningScript(e.target.value)}
            placeholder="How should the call begin..."
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            rows={3}
          />
        </div>

        {/* Phases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-charcoal">Phases</h3>
            <button
              onClick={() => setPhases(prev => [...prev, newPhase()])}
              className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Add Phase
            </button>
          </div>
          <div className="space-y-4">
            {phases.map((phase, idx) => (
              <div key={phase.id} className="border border-stone/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal/10 text-teal text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={phase.name}
                    onChange={e => updatePhase(idx, { name: e.target.value })}
                    placeholder="Phase name"
                    className="flex-1 px-2 py-1 border border-stone/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <input
                    type="number"
                    value={phase.durationMinutes}
                    onChange={e => updatePhase(idx, { durationMinutes: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 border border-stone/15 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal/30"
                    min={1}
                  />
                  <span className="text-xs text-stone">min</span>
                  {phases.length > 1 && (
                    <button
                      onClick={() => setPhases(prev => prev.filter((_, i) => i !== idx))}
                      className="text-stone hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <textarea
                  value={phase.description}
                  onChange={e => updatePhase(idx, { description: e.target.value })}
                  placeholder="Phase description..."
                  className="w-full px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
                  rows={2}
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-charcoal">Questions</span>
                    <button onClick={() => addQuestion(idx)} className="text-xs text-teal hover:text-teal/80">
                      + Add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {phase.questions.map((q, qi) => (
                      <div key={qi} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={q}
                          onChange={e => updateQuestion(idx, qi, e.target.value)}
                          placeholder="Question..."
                          className="flex-1 px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30"
                        />
                        {phase.questions.length > 1 && (
                          <button onClick={() => removeQuestion(idx, qi)} className="text-stone hover:text-red-500">
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-charcoal">AI Instructions</span>
                  <textarea
                    value={phase.aiInstructions}
                    onChange={e => updatePhase(idx, { aiInstructions: e.target.value })}
                    placeholder="Instructions for the AI during this phase..."
                    className="w-full mt-1 px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Script */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Closing Script</label>
          <textarea
            value={closingScript}
            onChange={e => setClosingScript(e.target.value)}
            placeholder="How should the call wrap up..."
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            rows={3}
          />
        </div>

        {/* Objection Bank */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-charcoal">Objection Bank</h3>
            <button
              onClick={() => setObjectionBank(prev => [...prev, { objection: '', response: '' }])}
              className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Add Objection
            </button>
          </div>
          {objectionBank.length === 0 ? (
            <p className="text-xs text-stone/60">No objections added yet. Add common objections and ideal responses.</p>
          ) : (
            <div className="space-y-3">
              {objectionBank.map((obj, i) => (
                <div key={i} className="border border-stone/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={obj.objection}
                      onChange={e => setObjectionBank(prev => prev.map((o, oi) => oi === i ? { ...o, objection: e.target.value } : o))}
                      placeholder="Objection..."
                      className="flex-1 px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30"
                    />
                    <button
                      onClick={() => setObjectionBank(prev => prev.filter((_, oi) => oi !== i))}
                      className="text-stone hover:text-red-500 mt-0.5"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={obj.response}
                    onChange={e => setObjectionBank(prev => prev.map((o, oi) => oi === i ? { ...o, response: e.target.value } : o))}
                    placeholder="Ideal response..."
                    className="w-full px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
