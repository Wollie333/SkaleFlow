'use client';

import { useState } from 'react';

interface ActionItem {
  id: string;
  description: string;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
}

export function ActionItemsList({ items, roomCode }: { items: ActionItem[]; roomCode: string }) {
  const [actionItems, setActionItems] = useState(items);

  async function toggleStatus(itemId: string, currentStatus: string) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const res = await fetch(`/api/calls/${roomCode}/action-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setActionItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
    }
  }

  if (actionItems.length === 0) {
    return <p className="text-stone text-sm text-center py-8">No action items from this call.</p>;
  }

  return (
    <div className="space-y-2">
      {actionItems.map(item => (
        <div
          key={item.id}
          className={`bg-cream-warm rounded-xl border border-stone/10 p-4 flex items-start gap-3 ${
            item.status === 'completed' ? 'opacity-60' : ''
          }`}
        >
          <button
            onClick={() => toggleStatus(item.id, item.status)}
            className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              item.status === 'completed'
                ? 'bg-teal border-teal text-white'
                : 'border-stone/30 hover:border-teal'
            }`}
          >
            {item.status === 'completed' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <p className={`text-sm text-charcoal ${item.status === 'completed' ? 'line-through' : ''}`}>
              {item.description}
            </p>
            {item.due_date && (
              <span className="text-xs text-stone mt-1 block">Due: {item.due_date}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
