'use client';

import { cn } from '@/lib/utils';
import { CalendarDaysIcon, TableCellsIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

type ViewMode = 'calendar' | 'table' | 'kanban';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-stone/20 overflow-hidden">
      <button
        onClick={() => onChange('calendar')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
          mode === 'calendar'
            ? 'bg-teal text-white'
            : 'bg-cream-warm text-stone hover:bg-cream-warm'
        )}
      >
        <CalendarDaysIcon className="w-4 h-4" />
        Calendar
      </button>
      <button
        onClick={() => onChange('table')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
          mode === 'table'
            ? 'bg-teal text-white'
            : 'bg-cream-warm text-stone hover:bg-cream-warm'
        )}
      >
        <TableCellsIcon className="w-4 h-4" />
        Table
      </button>
      <button
        onClick={() => onChange('kanban')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
          mode === 'kanban'
            ? 'bg-teal text-white'
            : 'bg-cream-warm text-stone hover:bg-cream-warm'
        )}
      >
        <ViewColumnsIcon className="w-4 h-4" />
        Kanban
      </button>
    </div>
  );
}

export type { ViewMode };
