'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CONFIRMED_FORMATS } from '@/lib/authority/constants';

interface StoryAngle {
  id: string;
  title: string;
  description: string | null;
  target_outlets: string | null;
  recommended_format: string | null;
  created_at: string;
}

interface StoryAngleManagerProps {
  angles: StoryAngle[];
  organizationId: string;
  onRefresh: () => void;
}

export function StoryAngleManager({ angles, organizationId, onRefresh }: StoryAngleManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ title: string; description: string; target_outlets: string; recommended_format: string }> | null>(null);
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

  const handleSuggest = async () => {
    setSuggesting(true);
    setSuggestions(null);
    try {
      const res = await fetch('/api/authority/story-angles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        setSuggestions(await res.json());
      }
    } finally {
      setSuggesting(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: { title: string; description: string; target_outlets: string; recommended_format: string }) => {
    await fetch('/api/authority/story-angles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, ...suggestion }),
    });
    setSuggestions((prev) => prev?.filter((s) => s.title !== suggestion.title) || null);
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
            onClick={handleSuggest}
            disabled={suggesting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gold border border-gold/30 rounded-lg hover:bg-gold/5 transition-colors disabled:opacity-50"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            {suggesting ? 'Generating...' : 'AI Suggest'}
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

      {/* AI Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gold">AI Suggestions — click to add</p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-3 p-3 bg-white rounded-lg border border-stone/10">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{s.title}</p>
                <p className="text-xs text-stone mt-0.5">{s.description}</p>
                {s.target_outlets && <p className="text-[10px] text-stone/60 mt-1">Outlets: {s.target_outlets}</p>}
              </div>
              <button
                onClick={() => handleAcceptSuggestion(s)}
                className="flex-shrink-0 p-1.5 text-green-500 hover:bg-green-50 rounded-lg"
                title="Accept"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setSuggestions(null)}
            className="text-xs text-stone hover:text-charcoal"
          >
            Dismiss all
          </button>
        </div>
      )}

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
    </div>
  );
}
