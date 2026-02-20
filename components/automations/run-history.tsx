'use client';

import { cn } from '@/lib/utils';

interface Run {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  pipeline_contacts: { full_name: string; email: string | null } | null;
}

interface RunHistoryProps {
  runs: Run[];
  onViewRun: (runId: string) => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  running: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  waiting: 'bg-yellow-100 text-yellow-700',
};

export function RunHistory({ runs, onViewRun }: RunHistoryProps) {
  if (runs.length === 0) {
    return <p className="text-center text-stone py-8 text-sm">No runs yet</p>;
  }

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-cream border-b border-stone/10">
            <th className="text-left px-4 py-3 text-xs font-semibold text-stone uppercase">Contact</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-stone uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-stone uppercase">Started</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-stone uppercase">Duration</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const duration = run.completed_at
              ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
              : null;

            return (
              <tr key={run.id} className="border-b border-stone/5 hover:bg-cream/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-charcoal">{run.pipeline_contacts?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-stone">{run.pipeline_contacts?.email || ''}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[run.status] || 'bg-stone/10 text-stone')}>
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone">
                  {new Date(run.started_at).toLocaleString('en-ZA')}
                </td>
                <td className="px-4 py-3 text-stone">
                  {duration !== null ? `${duration}s` : '—'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onViewRun(run.id)} className="text-xs text-teal hover:text-teal/80">
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
