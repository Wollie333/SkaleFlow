'use client';

import { useState } from 'react';
import { CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  is_completed: boolean;
  completed_at: string | null;
  display_order: number;
  is_custom: boolean;
}

interface ChecklistSectionProps {
  items: ChecklistItem[];
  cardId: string;
  onToggle: (itemId: string, completed: boolean) => Promise<void>;
  onAdd: (label: string) => Promise<void>;
}

export function ChecklistSection({ items, cardId, onToggle, onAdd }: ChecklistSectionProps) {
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const completed = items.filter((i) => i.is_completed).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await onAdd(newLabel.trim());
      setNewLabel('');
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone font-medium">{completed} of {total} complete</span>
            <span className="text-stone font-semibold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone/10 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                progress === 100 ? 'bg-green-500' : 'bg-teal'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items
          .sort((a, b) => a.display_order - b.display_order)
          .map((item) => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id, !item.is_completed)}
              className={cn(
                'w-full flex items-start gap-2 px-2 py-1.5 rounded-lg text-left transition-colors group',
                'hover:bg-cream/60'
              )}
            >
              {item.is_completed ? (
                <CheckCircleSolidIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 text-stone/40 flex-shrink-0 mt-0.5 group-hover:text-teal" />
              )}
              <span
                className={cn(
                  'text-xs leading-relaxed',
                  item.is_completed ? 'text-stone line-through' : 'text-charcoal'
                )}
              >
                {item.label}
              </span>
            </button>
          ))}
      </div>

      {/* Add Custom Item */}
      {showAdd ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Checklist item..."
            className="flex-1 px-2 py-1.5 border border-stone/20 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal/30"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newLabel.trim()}
            className="px-2 py-1.5 text-xs text-white bg-teal rounded-lg hover:bg-teal-dark disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAdd(false); setNewLabel(''); }}
            className="px-2 py-1.5 text-xs text-stone hover:text-charcoal"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-stone hover:text-teal transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add custom item
        </button>
      )}
    </div>
  );
}
