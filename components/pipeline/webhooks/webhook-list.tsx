'use client';

import { GlobeAltIcon, PencilIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

interface WebhookListProps {
  endpoints: Endpoint[];
  onEdit: (endpoint: Endpoint) => void;
  onDelete: (id: string) => Promise<void>;
  onTest: (id: string) => Promise<void>;
}

export function WebhookList({ endpoints, onEdit, onDelete, onTest }: WebhookListProps) {
  if (endpoints.length === 0) {
    return <p className="text-center text-stone py-8 text-sm">No webhook endpoints configured</p>;
  }

  return (
    <div className="space-y-3">
      {endpoints.map((ep) => (
        <div key={ep.id} className="bg-cream-warm rounded-xl border border-stone/10 p-4 flex items-center gap-4">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', ep.is_active ? 'bg-teal/10' : 'bg-stone/10')}>
            <GlobeAltIcon className={cn('w-4 h-4', ep.is_active ? 'text-teal' : 'text-stone')} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-charcoal">{ep.name}</h3>
            <p className="text-xs text-stone mt-0.5 truncate">
              <span className="font-mono bg-stone/10 px-1 rounded">{ep.method}</span> {ep.url}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onTest(ep.id)} className="text-stone hover:text-teal p-1" title="Test">
              <PlayIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(ep)} className="text-stone hover:text-charcoal p-1">
              <PencilIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(ep.id)} className="text-stone hover:text-red-500 p-1">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
