'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { PlusIcon, FunnelIcon, UsersIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';
import { CreatePipelineModal } from '@/components/pipeline/create-pipeline-modal';
import type { Database } from '@/types/database';

const MAX_PIPELINES = 2;

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  contact_count: number;
  pipeline_stages: Array<{
    id: string;
    name: string;
    color: string;
    sort_order: number;
  }>;
}

export default function PipelineListPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return;
    setOrganizationId(membership.organization_id);

    const response = await fetch(`/api/pipeline?organizationId=${membership.organization_id}`);
    if (response.ok) {
      const data = await response.json();
      setPipelines(data);
    }
    setLoading(false);
  };

  const handleCreate = async (data: { name: string; description: string; template: string }) => {
    if (!organizationId) return;
    const response = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, ...data }),
    });

    if (response.ok) {
      const pipeline = await response.json();
      router.push(`/pipeline/${pipeline.id}`);
    } else {
      const err = await response.json();
      alert(err.error || 'Failed to create pipeline');
    }
  };

  const handleDelete = async (e: React.MouseEvent, pipelineId: string, pipelineName: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${pipelineName}"? All contacts, stages, and automations in this pipeline will be permanently removed.`)) return;

    setDeleting(pipelineId);
    try {
      const res = await fetch(`/api/pipeline/${pipelineId}`, { method: 'DELETE' });
      if (res.ok) {
        setPipelines(prev => prev.filter(p => p.id !== pipelineId));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete pipeline');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const atLimit = pipelines.length >= MAX_PIPELINES;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pipelines"
        icon={FunnelIcon}
        subtitle={`Manage your sales pipelines and contacts (${pipelines.length}/${MAX_PIPELINES})`}
        action={
          <button
            onClick={() => setShowCreate(true)}
            disabled={atLimit}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-dark bg-gold hover:bg-gold/90 rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title={atLimit ? `Maximum of ${MAX_PIPELINES} pipelines reached` : undefined}
          >
            <PlusIcon className="w-4 h-4" />
            New Pipeline
          </button>
        }
        className="mb-8"
      />

      {pipelines.length === 0 ? (
        <div className="text-center py-20 bg-cream-warm rounded-xl border border-stone/10">
          <FunnelIcon className="w-14 h-14 text-stone/20 mx-auto mb-4" />
          <h3 className="font-serif text-lg font-semibold text-charcoal mb-2">No pipelines yet</h3>
          <p className="text-sm text-stone mb-6 max-w-sm mx-auto">Create your first pipeline to start managing contacts and deals.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-dark bg-gold hover:bg-gold/90 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Create Pipeline
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              onClick={() => router.push(`/pipeline/${pipeline.id}`)}
              className="text-left bg-cream-warm rounded-xl border border-stone/10 p-5 hover:border-teal/20 hover:shadow-md transition-all group cursor-pointer relative"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif font-semibold text-charcoal group-hover:text-teal transition-colors">{pipeline.name}</h3>
                  {pipeline.description && (
                    <p className="text-sm text-stone mt-1 line-clamp-2">{pipeline.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <button
                    onClick={(e) => handleDelete(e, pipeline.id, pipeline.name)}
                    disabled={deleting === pipeline.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 text-stone hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                    title="Delete pipeline"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
                    <FunnelIcon className="w-4 h-4 text-teal" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-stone">
                  <UsersIcon className="w-3.5 h-3.5" />
                  <span className="font-medium text-charcoal">{pipeline.contact_count}</span> contacts
                </div>
                <div className="text-xs text-stone">
                  <span className="font-medium text-charcoal">{pipeline.pipeline_stages?.length || 0}</span> stages
                </div>
              </div>

              {pipeline.pipeline_stages && pipeline.pipeline_stages.length > 0 && (
                <div className="flex gap-1 mt-3">
                  {[...pipeline.pipeline_stages]
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((stage) => (
                      <div
                        key={stage.id}
                        className="h-1.5 flex-1 rounded-full"
                        style={{ backgroundColor: stage.color }}
                        title={stage.name}
                      />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreatePipelineModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
