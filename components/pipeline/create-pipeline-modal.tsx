'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreatePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; template: string }) => Promise<void>;
}

export function CreatePipelineModal({ isOpen, onClose, onCreate }: CreatePipelineModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('sales');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), template });
      setName('');
      setDescription('');
      setTemplate('sales');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    { id: 'sales', name: 'Sales Pipeline', desc: 'New Lead → Contacted → Qualified → Proposal → Negotiation → Won/Lost' },
    { id: 'onboarding', name: 'Customer Onboarding', desc: 'Signed Up → Welcome → Onboarding Call → Complete → Active' },
    { id: 'blank', name: 'Blank Pipeline', desc: 'Start with basic stages: New → In Progress → Done' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-semibold text-charcoal">Create Pipeline</h2>
          <button onClick={onClose} className="text-stone hover:text-charcoal">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Pipeline Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sales Pipeline"
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this pipeline for?"
              rows={2}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Template</label>
            <div className="space-y-2">
              {templates.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    template === t.id
                      ? 'border-teal bg-teal/5'
                      : 'border-stone/20 hover:border-stone/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={template === t.id}
                    onChange={() => setTemplate(t.id)}
                    className="mt-0.5 accent-teal"
                  />
                  <div>
                    <p className="text-sm font-medium text-charcoal">{t.name}</p>
                    <p className="text-xs text-stone mt-0.5">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
