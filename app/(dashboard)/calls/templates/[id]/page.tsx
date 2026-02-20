'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { templateToMarkdown, markdownToTemplate } from '@/lib/calls/templates/markdown';

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

export default function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch(`/api/calls/templates/${id}`)
      .then(r => r.json())
      .then(data => {
        const { _isSuperAdmin, ...tmpl } = data;
        setTemplate(tmpl);
        if (_isSuperAdmin) setIsSuperAdmin(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const canEdit = !template?.is_system || isSuperAdmin;

  async function handleSave() {
    if (!template) return;
    setSaving(true);
    const res = await fetch(`/api/calls/templates/${id}`, {
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
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to save');
    }
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

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/calls/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/calls/templates');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete');
      }
    } catch {
      alert('Network error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const handleDownload = () => {
    if (!template) return;
    const md = templateToMarkdown({
      name: template.name,
      description: template.description || '',
      call_type: template.call_type,
      opening_script: template.opening_script || '',
      closing_script: template.closing_script || '',
      phases: template.phases,
      objection_bank: template.objection_bank,
    });
    const filename = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImportMd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !template) return;
    try {
      const text = await file.text();
      const parsed = markdownToTemplate(text);
      setTemplate({
        ...template,
        name: parsed.name || template.name,
        description: parsed.description || template.description,
        call_type: parsed.call_type || template.call_type,
        opening_script: parsed.opening_script || template.opening_script,
        closing_script: parsed.closing_script || template.closing_script,
        phases: parsed.phases.length > 0 ? parsed.phases : template.phases,
        objection_bank: parsed.objection_bank.length > 0 ? parsed.objection_bank : template.objection_bank,
      });
    } catch {
      alert('Failed to parse .md file');
    }
    e.target.value = '';
  };

  // Phase editing helpers
  const updatePhase = (idx: number, updates: Partial<Phase>) => {
    if (!template) return;
    setTemplate({
      ...template,
      phases: template.phases.map((p, i) => i === idx ? { ...p, ...updates } : p),
    });
  };

  const addQuestion = (phaseIdx: number) => {
    if (!template) return;
    setTemplate({
      ...template,
      phases: template.phases.map((p, i) =>
        i === phaseIdx ? { ...p, questions: [...p.questions, ''] } : p
      ),
    });
  };

  const updateQuestion = (phaseIdx: number, qIdx: number, value: string) => {
    if (!template) return;
    setTemplate({
      ...template,
      phases: template.phases.map((p, i) =>
        i === phaseIdx ? { ...p, questions: p.questions.map((q, qi) => qi === qIdx ? value : q) } : p
      ),
    });
  };

  const removeQuestion = (phaseIdx: number, qIdx: number) => {
    if (!template) return;
    setTemplate({
      ...template,
      phases: template.phases.map((p, i) =>
        i === phaseIdx ? { ...p, questions: p.questions.filter((_, qi) => qi !== qIdx) } : p
      ),
    });
  };

  if (loading) return <div className="p-8 text-stone">Loading...</div>;
  if (!template) return <div className="p-8 text-stone">Template not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/calls/templates')} className="text-sm text-teal hover:underline">
          &larr; Back to Templates
        </button>
        <div className="flex items-center gap-2">
          {/* Download .md */}
          <button
            onClick={handleDownload}
            className="p-2 text-stone hover:text-teal rounded-lg border border-stone/20 transition-colors"
            title="Download as .md"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          {/* Import .md (overwrites current fields) */}
          {canEdit && (
            <label
              className="p-2 text-stone hover:text-teal rounded-lg border border-stone/20 transition-colors cursor-pointer"
              title="Import .md file (overwrites current content)"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <input type="file" accept=".md,.markdown,.txt" onChange={handleImportMd} className="hidden" />
            </label>
          )}

          {/* Delete */}
          {(isSuperAdmin || !template.is_system) && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-600">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs font-medium text-charcoal bg-cream border border-stone/20 rounded hover:bg-stone/10"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-stone hover:text-red-600 rounded-lg border border-stone/20 transition-colors"
                title="Delete template"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )
          )}

          {/* Clone (for regular users on system templates) */}
          {template.is_system && !isSuperAdmin && (
            <button
              onClick={handleClone}
              disabled={cloning}
              className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal/90 disabled:opacity-50"
            >
              {cloning ? 'Cloning...' : 'Clone Template'}
            </button>
          )}

          {/* Save */}
          {canEdit && (
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
        {template.is_system && isSuperAdmin && (
          <div className="px-3 py-2 bg-gold/10 border border-gold/20 rounded-lg text-xs text-charcoal">
            System template — editing as super admin. Changes affect all organisations.
          </div>
        )}
        {template.is_system && !isSuperAdmin && (
          <div className="px-3 py-2 bg-teal/5 border border-teal/10 rounded-lg text-xs text-teal">
            System template (read-only). Duplicate to customise.
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
            <input
              type="text"
              value={template.name}
              onChange={e => canEdit && setTemplate({ ...template, name: e.target.value })}
              readOnly={!canEdit}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Call Type</label>
            <select
              value={template.call_type}
              onChange={e => canEdit && setTemplate({ ...template, call_type: e.target.value })}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/30"
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
            value={template.description || ''}
            onChange={e => canEdit && setTemplate({ ...template, description: e.target.value })}
            readOnly={!canEdit}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            rows={2}
          />
        </div>

        {/* Opening Script */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Opening Script</label>
          <textarea
            value={template.opening_script || ''}
            onChange={e => canEdit && setTemplate({ ...template, opening_script: e.target.value })}
            readOnly={!canEdit}
            placeholder="How should the call begin..."
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            rows={3}
          />
        </div>

        {/* Phases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-charcoal">Phases ({template.phases.length})</h3>
            {canEdit && (
              <button
                onClick={() => setTemplate({ ...template, phases: [...template.phases, newPhase()] })}
                className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Phase
              </button>
            )}
          </div>
          <div className="space-y-4">
            {template.phases.map((phase, idx) => (
              <div key={phase.id} className="border border-stone/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal/10 text-teal text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {canEdit ? (
                    <input
                      type="text"
                      value={phase.name}
                      onChange={e => updatePhase(idx, { name: e.target.value })}
                      placeholder="Phase name"
                      className="flex-1 px-2 py-1 border border-stone/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                    />
                  ) : (
                    <h4 className="font-medium text-charcoal text-sm">{phase.name}</h4>
                  )}
                  {canEdit ? (
                    <>
                      <input
                        type="number"
                        value={phase.durationMinutes}
                        onChange={e => updatePhase(idx, { durationMinutes: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 border border-stone/15 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal/30"
                        min={1}
                      />
                      <span className="text-xs text-stone">min</span>
                    </>
                  ) : (
                    <span className="text-xs text-stone ml-auto">{phase.durationMinutes} min</span>
                  )}
                  {canEdit && template.phases.length > 1 && (
                    <button
                      onClick={() => setTemplate({ ...template, phases: template.phases.filter((_, i) => i !== idx) })}
                      className="text-stone hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {canEdit ? (
                  <textarea
                    value={phase.description}
                    onChange={e => updatePhase(idx, { description: e.target.value })}
                    placeholder="Phase description..."
                    className="w-full px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
                    rows={2}
                  />
                ) : (
                  <p className="text-xs text-stone">{phase.description}</p>
                )}

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-charcoal">Questions</span>
                    {canEdit && (
                      <button onClick={() => addQuestion(idx)} className="text-xs text-teal hover:text-teal/80">
                        + Add
                      </button>
                    )}
                  </div>
                  {canEdit ? (
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
                  ) : (
                    <ul className="space-y-1">
                      {phase.questions.map((q, qi) => (
                        <li key={qi} className="text-xs text-stone pl-3 before:content-['•'] before:mr-1 before:text-teal">{q}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Transition Triggers */}
                {(canEdit || phase.transitionTriggers.length > 0) && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-charcoal">Transition Triggers</span>
                      {canEdit && (
                        <button
                          onClick={() => updatePhase(idx, { transitionTriggers: [...phase.transitionTriggers, ''] })}
                          className="text-xs text-teal hover:text-teal/80"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                    {canEdit ? (
                      <div className="space-y-1.5">
                        {phase.transitionTriggers.map((t, ti) => (
                          <div key={ti} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={t}
                              onChange={e => {
                                const triggers = [...phase.transitionTriggers];
                                triggers[ti] = e.target.value;
                                updatePhase(idx, { transitionTriggers: triggers });
                              }}
                              placeholder="Trigger..."
                              className="flex-1 px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30"
                            />
                            <button
                              onClick={() => updatePhase(idx, { transitionTriggers: phase.transitionTriggers.filter((_, i) => i !== ti) })}
                              className="text-stone hover:text-red-500"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {phase.transitionTriggers.map((t, ti) => (
                          <li key={ti} className="text-xs text-stone pl-3 before:content-['→'] before:mr-1 before:text-gold">{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* AI Instructions */}
                <div>
                  <span className="text-xs font-medium text-charcoal">AI Instructions</span>
                  {canEdit ? (
                    <textarea
                      value={phase.aiInstructions}
                      onChange={e => updatePhase(idx, { aiInstructions: e.target.value })}
                      placeholder="Instructions for the AI during this phase..."
                      className="w-full mt-1 px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-xs text-stone/70 italic mt-1">{phase.aiInstructions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Script */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Closing Script</label>
          <textarea
            value={template.closing_script || ''}
            onChange={e => canEdit && setTemplate({ ...template, closing_script: e.target.value })}
            readOnly={!canEdit}
            placeholder="How should the call wrap up..."
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            rows={3}
          />
        </div>

        {/* Objection Bank */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-charcoal">Objection Bank ({template.objection_bank.length})</h3>
            {canEdit && (
              <button
                onClick={() => setTemplate({ ...template, objection_bank: [...template.objection_bank, { objection: '', response: '' }] })}
                className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Objection
              </button>
            )}
          </div>
          {template.objection_bank.length === 0 ? (
            <p className="text-xs text-stone/60">No objections added yet.</p>
          ) : canEdit ? (
            <div className="space-y-3">
              {template.objection_bank.map((obj, i) => (
                <div key={i} className="border border-stone/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={obj.objection}
                      onChange={e => setTemplate({
                        ...template,
                        objection_bank: template.objection_bank.map((o, oi) => oi === i ? { ...o, objection: e.target.value } : o),
                      })}
                      placeholder="Objection..."
                      className="flex-1 px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30"
                    />
                    <button
                      onClick={() => setTemplate({
                        ...template,
                        objection_bank: template.objection_bank.filter((_, oi) => oi !== i),
                      })}
                      className="text-stone hover:text-red-500 mt-0.5"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={obj.response}
                    onChange={e => setTemplate({
                      ...template,
                      objection_bank: template.objection_bank.map((o, oi) => oi === i ? { ...o, response: e.target.value } : o),
                    })}
                    placeholder="Ideal response..."
                    className="w-full px-2 py-1 border border-stone/15 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {template.objection_bank.map((obj, i) => (
                <div key={i} className="border border-stone/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-600 mb-1">&ldquo;{obj.objection}&rdquo;</p>
                  <p className="text-sm text-charcoal">{obj.response}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
