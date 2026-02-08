'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ClockIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';
import { RunHistory } from '@/components/automations/run-history';
import { RunDetail } from '@/components/automations/run-detail';

export default function AutomationRunsPage() {
  const params = useParams();
  const pipelineId = params.pipelineId as string;
  const workflowId = params.workflowId as string;

  const [runs, setRuns] = useState<Array<{
    id: string; status: string; started_at: string; completed_at: string | null;
    error_message: string | null;
    pipeline_contacts: { full_name: string; email: string | null } | null;
  }>>([]);
  const [selectedRun, setSelectedRun] = useState<{
    id: string; status: string; started_at: string; completed_at: string | null;
    error_message: string | null;
    pipeline_contacts: { full_name: string; email: string | null } | null;
    step_logs: Array<{
      id: string; status: string; started_at: string | null; completed_at: string | null;
      result: Record<string, unknown>; retry_count: number;
      automation_steps: { step_type: string; config: Record<string, unknown> } | null;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRuns = useCallback(async () => {
    const response = await fetch(`/api/automations/runs?workflowId=${workflowId}`);
    if (response.ok) setRuns(await response.json());
    setLoading(false);
  }, [workflowId]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const handleViewRun = async (runId: string) => {
    const response = await fetch(`/api/automations/runs/${runId}`);
    if (response.ok) setSelectedRun(await response.json());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Run History"
        icon={ClockIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: 'Automations', href: `/pipeline/${pipelineId}/automations` },
          { label: 'Workflow', href: `/pipeline/${pipelineId}/automations/${workflowId}` },
          { label: 'Run History' },
        ]}
        className="mb-6"
      />

      {selectedRun ? (
        <RunDetail run={selectedRun} onClose={() => setSelectedRun(null)} />
      ) : (
        <RunHistory runs={runs} onViewRun={handleViewRun} />
      )}
    </div>
  );
}
