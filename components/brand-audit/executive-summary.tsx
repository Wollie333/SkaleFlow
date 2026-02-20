'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ExecutiveSummaryProps {
  summary: string;
  auditId: string;
  editable?: boolean;
  onSave?: (newSummary: string) => void;
}

export function ExecutiveSummary({ summary, auditId, editable = true, onSave }: ExecutiveSummaryProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(summary);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/brand-audits/${auditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive_summary: editText }),
      });
      if (res.ok) {
        setEditing(false);
        onSave?.(editText);
      }
    } catch (error) {
      console.error('Error saving summary:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-stone/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-charcoal">Executive Summary</h3>
        {editable && !editing && (
          <button onClick={() => { setEditing(true); setEditText(summary); }} className="text-stone hover:text-charcoal">
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[200px] rounded-lg border border-stone/20 px-4 py-3 text-sm"
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              <XMarkIcon className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-teal hover:bg-teal-dark text-white">
              <CheckIcon className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-charcoal/80 whitespace-pre-line leading-relaxed">
          {summary || 'No executive summary generated yet.'}
        </div>
      )}
    </div>
  );
}
