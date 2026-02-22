'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { BoltIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';
import { WorkflowBuilder } from '@/components/automations/workflow-builder';
import type { Node, Edge } from '@xyflow/react';
import type { Database } from '@/types/database';

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.pipelineId as string;
  const workflowId = params.workflowId as string;

  const [workflow, setWorkflow] = useState<Record<string, unknown> | null>(null);
  const [stages, setStages] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [endpoints, setEndpoints] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [workflowName, setWorkflowName] = useState('');

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase.from('org_members').select('organization_id').eq('user_id', user.id).single();
    const orgId = membership?.organization_id;

    const [wfRes, stagesRes, tagsRes, templatesRes, endpointsRes] = await Promise.all([
      fetch(`/api/automations/workflows/${workflowId}`),
      fetch(`/api/pipeline/${pipelineId}/stages`),
      orgId ? fetch(`/api/pipeline/tags?organizationId=${orgId}`) : Promise.resolve(null),
      orgId ? fetch(`/api/pipeline/email-templates?organizationId=${orgId}`) : Promise.resolve(null),
      orgId ? fetch(`/api/pipeline/webhooks?organizationId=${orgId}`) : Promise.resolve(null),
    ]);

    if (wfRes.ok) {
      const wfData = await wfRes.json();
      setWorkflow(wfData);
      setWorkflowName(wfData.name || '');
    }
    if (stagesRes.ok) setStages(await stagesRes.json());
    if (tagsRes?.ok) setTags(await tagsRes.json());
    if (templatesRes?.ok) setTemplates(await templatesRes.json());
    if (endpointsRes?.ok) setEndpoints(await endpointsRes.json());

    setLoading(false);
  }, [pipelineId, workflowId, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (graphData: { nodes: Node[]; edges: Edge[] }) => {
    await fetch(`/api/automations/workflows/${workflowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: workflowName, graph_data: graphData }),
    });
  };

  const handleNameChange = (name: string) => {
    setWorkflowName(name);
  };

  const handlePublish = async () => {
    const response = await fetch(`/api/automations/workflows/${workflowId}/publish`, { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      alert(`Published! ${data.steps} steps compiled.`);
    } else {
      const data = await response.json();
      alert(`Error: ${data.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  if (!workflow) {
    return <div className="text-center py-16"><p className="text-stone">Workflow not found</p></div>;
  }

  const graphData = (workflow.graph_data || {}) as { nodes?: Node[]; edges?: Edge[] };

  return (
    <div>
      <PageHeader
        title={workflowName || 'Workflow Builder'}
        icon={BoltIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: 'Automations', href: `/pipeline/${pipelineId}/automations` },
          { label: workflowName || 'Workflow Builder' },
        ]}
        action={
          <input
            type="text"
            value={workflowName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Untitled Workflow"
            className="font-serif text-sm font-bold text-charcoal bg-transparent border border-stone/20 outline-none focus:ring-2 focus:ring-teal/30 hover:bg-cream focus:bg-cream-warm rounded-lg px-3 py-1.5 transition-colors"
          />
        }
        className="mb-4"
      />
      <WorkflowBuilder
        initialNodes={graphData.nodes || []}
        initialEdges={graphData.edges || []}
        stages={stages}
        tags={tags}
        templates={templates}
        endpoints={endpoints}
        workflowName={workflowName}
        onNameChange={handleNameChange}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </div>
  );
}
