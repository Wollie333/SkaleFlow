'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { TrashIcon, PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';
import { TagManager } from '@/components/pipeline/tag-manager';
import type { Database } from '@/types/database';

interface Stage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_win_stage: boolean;
  is_loss_stage: boolean;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function PipelineSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.pipelineId as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadPipeline = useCallback(async () => {
    const response = await fetch(`/api/pipeline/${pipelineId}`);
    if (response.ok) {
      const data = await response.json();
      setName(data.name);
      setDescription(data.description || '');
      setStages(
        [...(data.pipeline_stages || [])].sort((a: Stage, b: Stage) => a.sort_order - b.sort_order)
      );
      setOrganizationId(data.organization_id);
    }
    setLoading(false);
  }, [pipelineId]);

  const loadTags = useCallback(async () => {
    if (!organizationId) return;
    const response = await fetch(`/api/pipeline/tags?organizationId=${organizationId}`);
    if (response.ok) {
      const data = await response.json();
      setTags(data);
    }
  }, [organizationId]);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);
  useEffect(() => { if (organizationId) loadTags(); }, [organizationId, loadTags]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/pipeline/${pipelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      // Save stages
      await fetch(`/api/pipeline/${pipelineId}/stages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages }),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePipeline = async () => {
    if (!confirm('Are you sure you want to delete this pipeline? This cannot be undone.')) return;
    await fetch(`/api/pipeline/${pipelineId}`, { method: 'DELETE' });
    router.push('/pipeline');
  };

  const handleAddStage = async () => {
    const response = await fetch(`/api/pipeline/${pipelineId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Stage', sort_order: stages.length }),
    });
    if (response.ok) {
      await loadPipeline();
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    const response = await fetch(`/api/pipeline/${pipelineId}/stages?stageId=${stageId}`, { method: 'DELETE' });
    if (response.ok) {
      await loadPipeline();
    } else {
      const data = await response.json();
      alert(data.error);
    }
  };

  // Tag handlers
  const handleCreateTag = async (tagName: string, color: string) => {
    await fetch('/api/pipeline/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, name: tagName, color }),
    });
    await loadTags();
  };

  const handleUpdateTag = async (id: string, tagName: string, color: string) => {
    await fetch('/api/pipeline/tags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: tagName, color }),
    });
    await loadTags();
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    await fetch(`/api/pipeline/tags?tagId=${id}`, { method: 'DELETE' });
    await loadTags();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Pipeline Settings"
        icon={Cog6ToothIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: 'Settings' },
        ]}
        className="mb-6"
      />

      <div className="space-y-8">
        {/* General */}
        <section className="bg-white rounded-xl border border-stone/10 p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
            </div>
          </div>
        </section>

        {/* Stages */}
        <section className="bg-white rounded-xl border border-stone/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal">Stages</h2>
            <button onClick={handleAddStage} className="flex items-center gap-1 text-xs text-teal hover:text-teal/80">
              <PlusIcon className="w-3.5 h-3.5" /> Add Stage
            </button>
          </div>
          <div className="space-y-2">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cream group">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) => {
                    const updated = [...stages];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setStages(updated);
                  }}
                  className="flex-1 text-sm bg-transparent border-none focus:outline-none"
                />
                <input
                  type="color"
                  value={stage.color}
                  onChange={(e) => {
                    const updated = [...stages];
                    updated[idx] = { ...updated[idx], color: e.target.value };
                    setStages(updated);
                  }}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
                <button onClick={() => handleDeleteStage(stage.id)} className="opacity-0 group-hover:opacity-100 text-stone hover:text-red-500">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Tags */}
        <section className="bg-white rounded-xl border border-stone/10 p-6">
          <TagManager tags={tags} onCreate={handleCreateTag} onUpdate={handleUpdateTag} onDelete={handleDeleteTag} />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={handleDeletePipeline}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg">
            Delete Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}
