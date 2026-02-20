'use client';

import { BoltIcon, PlayIcon, PauseIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowListProps {
  workflows: Workflow[];
  onEdit: (id: string) => void;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const triggerLabels: Record<string, string> = {
  stage_changed: 'Stage Changed',
  contact_created: 'Contact Created',
  tag_added: 'Tag Added',
  tag_removed: 'Tag Removed',
};

export function WorkflowList({ workflows, onEdit, onToggle, onDelete }: WorkflowListProps) {
  return (
    <div className="space-y-3">
      {workflows.map((wf) => (
        <div key={wf.id} className="bg-cream-warm rounded-xl border border-stone/10 p-4 flex items-center gap-4">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', wf.is_active ? 'bg-teal/10' : 'bg-stone/10')}>
            <BoltIcon className={cn('w-4 h-4', wf.is_active ? 'text-teal' : 'text-stone')} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-charcoal">{wf.name}</h3>
            <p className="text-xs text-stone mt-0.5">
              {triggerLabels[wf.trigger_type] || wf.trigger_type}
              {wf.description && ` — ${wf.description}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', wf.is_active ? 'bg-teal/10 text-teal' : 'bg-stone/10 text-stone')}>
              {wf.is_active ? 'Active' : 'Draft'}
            </span>
            <button onClick={() => onToggle(wf.id, !wf.is_active)} className="text-stone hover:text-charcoal p-1">
              {wf.is_active ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </button>
            <button onClick={() => onEdit(wf.id)} className="text-stone hover:text-charcoal p-1">
              <PencilIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(wf.id)} className="text-stone hover:text-red-500 p-1">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
