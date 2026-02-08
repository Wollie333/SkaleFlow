'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlusIcon, BoltIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';
import { WorkflowList } from '@/components/automations/workflow-list';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  created_at: string;
  updated_at: string;
}

export default function AutomationsListPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.pipelineId as string;

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadWorkflows = useCallback(async () => {
    const response = await fetch(`/api/automations/workflows?pipelineId=${pipelineId}`);
    if (response.ok) {
      const data = await response.json();
      setWorkflows(data);
    }
    setLoading(false);
  }, [pipelineId]);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const handleCreate = async () => {
    setCreating(true);
    const response = await fetch('/api/automations/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pipelineId,
        name: 'New Workflow',
        trigger_type: 'stage_changed',
      }),
    });
    if (response.ok) {
      const wf = await response.json();
      router.push(`/pipeline/${pipelineId}/automations/${wf.id}`);
    }
    setCreating(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await fetch(`/api/automations/workflows/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: active }),
    });
    await loadWorkflows();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    await fetch(`/api/automations/workflows/${id}`, { method: 'DELETE' });
    await loadWorkflows();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Automations"
        icon={BoltIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: 'Automations' },
        ]}
        subtitle="Create workflows to automate pipeline actions"
        action={
          <button onClick={handleCreate} disabled={creating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50">
            <PlusIcon className="w-4 h-4" />
            New Workflow
          </button>
        }
        className="mb-6"
      />

      {workflows.length === 0 ? (
        <div className="text-center py-16">
          <BoltIcon className="w-12 h-12 text-stone/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-charcoal mb-2">No automations yet</h3>
          <p className="text-sm text-stone mb-6">Create your first workflow to automate pipeline actions.</p>
          <button onClick={handleCreate} disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50">
            <PlusIcon className="w-4 h-4" /> Create Workflow
          </button>
        </div>
      ) : (
        <>
          <WorkflowList workflows={workflows} onEdit={(id) => router.push(`/pipeline/${pipelineId}/automations/${id}`)} onToggle={handleToggle} onDelete={handleDelete} />
          <button onClick={() => router.push(`/pipeline/${pipelineId}/automations/${workflows[0]?.id}/runs`)}
            className="mt-4 text-sm text-teal hover:text-teal/80">
            View execution history →
          </button>
        </>
      )}
    </div>
  );
}
