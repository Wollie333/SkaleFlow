'use client';

import { cn } from '@/lib/utils';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface StepLog {
  id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown>;
  retry_count: number;
  automation_steps: {
    step_type: string;
    config: Record<string, unknown>;
  } | null;
}

interface RunDetailProps {
  run: {
    id: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    error_message: string | null;
    pipeline_contacts: { full_name: string; email: string | null } | null;
    step_logs: StepLog[];
  };
  onClose: () => void;
}

const stepTypeLabels: Record<string, string> = {
  send_email: 'Send Email',
  move_stage: 'Move Stage',
  add_tag: 'Add Tag',
  remove_tag: 'Remove Tag',
  webhook: 'Webhook',
  delay: 'Delay',
  condition: 'Condition',
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'failed': return <XCircleIcon className="w-5 h-5 text-red-500" />;
    case 'waiting': return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    case 'running': return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
    default: return <ClockIcon className="w-5 h-5 text-stone" />;
  }
};

export function RunDetail({ run, onClose }: RunDetailProps) {
  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">
            Run for {run.pipeline_contacts?.full_name || 'Unknown'}
          </h3>
          <p className="text-xs text-stone mt-0.5">
            Started: {new Date(run.started_at).toLocaleString('en-ZA')}
            {run.completed_at && ` — Completed: ${new Date(run.completed_at).toLocaleString('en-ZA')}`}
          </p>
        </div>
        <button onClick={onClose} className="text-sm text-stone hover:text-charcoal">Close</button>
      </div>

      {run.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{run.error_message}</p>
        </div>
      )}

      {/* Step Timeline */}
      <div className="space-y-0">
        {run.step_logs.map((log, idx) => (
          <div key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StatusIcon status={log.status} />
              {idx < run.step_logs.length - 1 && (
                <div className="w-0.5 flex-1 bg-stone/20 my-1" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-charcoal">
                  {stepTypeLabels[log.automation_steps?.step_type || ''] || log.automation_steps?.step_type || 'Unknown'}
                </p>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                  log.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                  log.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                  log.status === 'waiting' ? 'bg-yellow-100 text-gold' :
                  'bg-stone/10 text-stone'
                )}>
                  {log.status}
                </span>
                {log.retry_count > 0 && (
                  <span className="text-[10px] text-stone">Retries: {log.retry_count}</span>
                )}
              </div>
              {log.started_at && (
                <p className="text-xs text-stone mt-0.5">
                  {new Date(log.started_at).toLocaleTimeString('en-ZA')}
                  {log.completed_at && ` → ${new Date(log.completed_at).toLocaleTimeString('en-ZA')}`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
