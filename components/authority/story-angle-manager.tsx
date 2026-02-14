'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CONFIRMED_FORMATS } from '@/lib/authority/constants';
import { getClientModelsForFeature, type ClientModelOption } from '@/lib/ai/client-models';

interface StoryAngle {
  id: string;
  title: string;
  description: string | null;
  target_outlets: string | null;
  recommended_format: string | null;
  created_at: string;
}

interface Suggestion {
  title: string;
  description: string;
  target_outlets: string;
  recommended_format: string;
}

interface StoryAngleManagerProps {
  angles: StoryAngle[];
  organizationId: string;
  onRefresh: () => void;
  defaultModelId?: string;
}

const AI_MODELS = getClientModelsForFeature('content_generation');

export function StoryAngleManager({ angles, organizationId, onRefresh, defaultModelId }: StoryAngleManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [aiError, setAiError] = useState('');
  const [selectedModel, setSelectedModel] = useState(defaultModelId || AI_MODELS[0]?.id || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Sync when parent changes the model
  useEffect(() => {
    if (defaultModelId) setSelectedModel(defaultModelId);
  }, [defaultModelId]);
  const [formData, setFormData] = useState({ title: '', description: '', target_outlets: '', recommended_format: '' });

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    await fetch('/api/authority/story-angles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, ...formData }),
    });
    setFormData({ title: '', description: '', target_outlets: '', recommended_format: '' });
    setShowAdd(false);
    onRefresh();
  };

  const handleUpdate = async (angleId: string) => {
    await fetch(`/api/authority/story-angles/${angleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (angleId: string) => {
    await fetch(`/api/authority/story-angles/${angleId}`, { method: 'DELETE' });
    onRefresh();
  };

  const openAiModal = () => {
    setShowAiModal(true);
    setAiStatus('idle');
    setAiError('');
    setSuggestions([]);
  };

  const runGeneration = async () => {
    setAiStatus('generating');
    setAiError('');
    setSuggestions([]);
    try {
      const res = await fetch('/api/authority/story-angles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, modelId: selectedModel || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setAiStatus('done');
        } else {
          setAiError('No suggestions generated — try again');
          setAiStatus('error');
        }
      } else {
        const body = await res.json().catch(() => ({}));
        setAiError(body.error || `Generation failed (${res.status})`);
        setAiStatus('error');
      }
    } catch {
      setAiError('Network error — please try again');
      setAiStatus('error');
    }
  };

  const handleAcceptSuggestion = async (suggestion: Suggestion) => {
    await fetch('/api/authority/story-angles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, ...suggestion }),
    });
    setSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title));
    onRefresh();
  };

  const handleAcceptAll = async () => {
    for (const s of suggestions) {
      await fetch('/api/authority/story-angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, ...s }),
      });
    }
    setSuggestions([]);
    setShowAiModal(false);
    onRefresh();
  };

  const startEdit = (angle: StoryAngle) => {
    setEditingId(angle.id);
    setFormData({
      title: angle.title,
      description: angle.description || '',
      target_outlets: angle.target_outlets || '',
      recommended_format: angle.recommended_format || '',
    });
  };

  const getFormatLabel = (format: string | null) => {
    if (!format) return '';
    return CONFIRMED_FORMATS.find((f) => f.value === format)?.label || format;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-semibold text-charcoal">Story Angles</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={openAiModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gold border border-gold/30 rounded-lg hover:bg-gold/5 transition-colors"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            AI Suggest
          </button>
          <button
            onClick={() => { setShowAdd(true); setFormData({ title: '', description: '', target_outlets: '', recommended_format: '' }); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal border border-teal/30 rounded-lg hover:bg-teal/5 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add Angle
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="p-4 bg-cream-warm/40 rounded-xl border border-stone/10 space-y-3">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Story angle title..."
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
            autoFocus
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description..."
            rows={2}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={formData.target_outlets}
              onChange={(e) => setFormData({ ...formData, target_outlets: e.target.value })}
              placeholder="Target outlets (comma-separated)"
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
            />
            <select
              value={formData.recommended_format}
              onChange={(e) => setFormData({ ...formData, recommended_format: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
            >
              <option value="">Format</option>
              {CONFIRMED_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-stone hover:text-charcoal">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!formData.title.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal-dark disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Angles List */}
      {angles.length === 0 && !showAdd ? (
        <p className="text-xs text-stone text-center py-6">No story angles yet. Add one or use AI Suggest.</p>
      ) : (
        <div className="space-y-2">
          {angles.map((angle) => (
            <div key={angle.id} className="p-3 bg-white border border-stone/10 rounded-xl">
              {editingId === angle.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2 py-1.5 border border-stone/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
                  />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 border border-stone/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal/30 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-stone">Cancel</button>
                    <button
                      onClick={() => handleUpdate(angle.id)}
                      className="px-2 py-1 text-xs font-medium text-white bg-teal rounded hover:bg-teal-dark"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal">{angle.title}</p>
                    {angle.description && <p className="text-xs text-stone mt-0.5">{angle.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {angle.recommended_format && (
                        <span className="text-[10px] font-medium text-teal bg-teal/10 px-1.5 py-0.5 rounded-full">
                          {getFormatLabel(angle.recommended_format)}
                        </span>
                      )}
                      {angle.target_outlets && (
                        <span className="text-[10px] text-stone/60">{angle.target_outlets}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(angle)}
                      className="p-1 text-stone hover:text-teal rounded transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(angle.id)}
                      className="p-1 text-stone hover:text-red-500 rounded transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Suggest Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-semibold text-charcoal">AI Story Angles</h3>
              </div>
              {aiStatus !== 'generating' && (
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1.5 text-stone hover:text-charcoal rounded-lg hover:bg-cream-warm transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
              {/* Idle State — Model Selector */}
              {aiStatus === 'idle' && (
                <div className="space-y-5">
                  <p className="text-xs text-stone">
                    AI will analyse your brand profile and suggest 5 compelling story angles for media outreach.
                  </p>

                  {/* Model Selector */}
                  <div>
                    <label className="block text-xs font-medium text-charcoal mb-2">AI Model</label>
                    <div className="space-y-2">
                      {AI_MODELS.map((model) => (
                        <label
                          key={model.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedModel === model.id
                              ? 'border-teal/40 bg-teal/5'
                              : 'border-stone/15 hover:border-stone/30'
                          }`}
                        >
                          <input
                            type="radio"
                            name="ai-model"
                            value={model.id}
                            checked={selectedModel === model.id}
                            onChange={() => setSelectedModel(model.id)}
                            className="w-3.5 h-3.5 text-teal focus:ring-teal/30"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-charcoal">{model.name}</span>
                            <span className="text-[10px] text-stone ml-2">{model.provider}</span>
                          </div>
                          {model.isFree ? (
                            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Free</span>
                          ) : (
                            <span className="text-[10px] font-medium text-stone">~{model.estimatedCreditsPerMessage} credits</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={runGeneration}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gold rounded-lg hover:bg-gold/90 transition-colors"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    Generate Story Angles
                  </button>
                </div>
              )}

              {/* Generating State */}
              {aiStatus === 'generating' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-gold/20" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-gold animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-charcoal">Generating story angles...</p>
                    <p className="text-xs text-stone mt-1">Analysing your brand profile to suggest compelling PR angles</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {aiStatus === 'error' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <XMarkIcon className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-charcoal">Generation failed</p>
                    <p className="text-xs text-red-600 mt-1 max-w-xs">{aiError}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAiModal(false)}
                      className="px-4 py-2 text-xs font-medium text-stone border border-stone/20 rounded-lg hover:bg-cream-warm transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setAiStatus('idle')}
                      className="px-4 py-2 text-xs font-medium text-white bg-gold rounded-lg hover:bg-gold/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Results State */}
              {aiStatus === 'done' && suggestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-stone">
                    {suggestions.length} angle{suggestions.length !== 1 ? 's' : ''} generated. Accept the ones you like.
                  </p>
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-cream-warm/30 rounded-xl border border-stone/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-charcoal">{s.title}</p>
                        <p className="text-xs text-stone mt-1">{s.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {s.recommended_format && (
                            <span className="text-[10px] font-medium text-teal bg-teal/10 px-1.5 py-0.5 rounded-full">
                              {getFormatLabel(s.recommended_format) || s.recommended_format}
                            </span>
                          )}
                          {s.target_outlets && (
                            <span className="text-[10px] text-stone/60">Outlets: {s.target_outlets}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptSuggestion(s)}
                        className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* All accepted */}
              {aiStatus === 'done' && suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckIcon className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-charcoal">All angles added!</p>
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="px-4 py-2 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {aiStatus === 'done' && suggestions.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-stone/10 bg-cream-warm/20">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 text-xs font-medium text-stone border border-stone/20 rounded-lg hover:bg-white transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  Accept All ({suggestions.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
