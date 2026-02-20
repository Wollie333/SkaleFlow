'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui';
import type { ContentStatus } from '@/types/database';

interface KanbanItem {
  id: string;
  topic: string | null;
  format: string;
  platforms: string[];
  status: ContentStatus;
  assigned_to: string | null;
  funnel_stage: string;
  scheduled_date: string;
  [key: string]: unknown;
}

interface KanbanViewProps {
  items: KanbanItem[];
  onItemClick: (item: KanbanItem) => void;
  onStatusChange: (itemId: string, newStatus: ContentStatus) => Promise<void>;
}

const KANBAN_COLUMNS: { status: ContentStatus; label: string; color: string }[] = [
  { status: 'idea', label: 'Ideas', color: 'border-stone/20' },
  { status: 'scripted', label: 'Scripted', color: 'border-blue-300' },
  { status: 'pending_review', label: 'In Review', color: 'border-amber-300' },
  { status: 'approved', label: 'Approved', color: 'border-green-300' },
  { status: 'filming', label: 'Filming', color: 'border-purple-300' },
  { status: 'editing', label: 'Editing', color: 'border-orange-300' },
  { status: 'scheduled', label: 'Scheduled', color: 'border-teal' },
  { status: 'published', label: 'Published', color: 'border-green-500' },
];

const FUNNEL_COLORS: Record<string, string> = {
  awareness: 'bg-green-100 text-green-800',
  consideration: 'bg-blue-100 text-blue-800',
  conversion: 'bg-orange-100 text-orange-800',
};

export function KanbanView({ items, onItemClick, onStatusChange }: KanbanViewProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: ContentStatus) => {
    e.preventDefault();
    if (draggedItemId) {
      await onStatusChange(draggedItemId, targetStatus);
      setDraggedItemId(null);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(col => {
        const columnItems = items.filter(i => i.status === col.status);

        return (
          <div
            key={col.status}
            className={`flex-shrink-0 w-64 bg-cream-warm rounded-xl border-t-2 ${col.color}`}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.status)}
          >
            <div className="px-3 py-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wide">{col.label}</h4>
              <span className="text-xs text-stone bg-cream-warm rounded-full w-5 h-5 flex items-center justify-center">
                {columnItems.length}
              </span>
            </div>

            <div className="px-2 pb-2 space-y-2 min-h-[100px]">
              {columnItems.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item.id)}
                  onClick={() => onItemClick(item)}
                  className="bg-cream-warm rounded-lg p-3 shadow-sm border border-stone/5 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <p className="text-sm font-medium text-charcoal line-clamp-2 mb-2">
                    {item.topic || item.format.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className={`text-[10px] px-1.5 py-0.5 ${FUNNEL_COLORS[item.funnel_stage] || ''}`}>
                      {item.funnel_stage}
                    </Badge>
                    <span className="text-[10px] text-stone">
                      {item.platforms.slice(0, 2).map(p => p.slice(0, 2).toUpperCase()).join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
