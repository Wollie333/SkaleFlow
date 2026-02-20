'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PlusIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilSquareIcon,
  LinkIcon,
  CodeBracketIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';

interface FormField {
  id: string;
  label: string;
  field_type: string;
  mapping: string;
  sort_order: number;
}

interface PipelineForm {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  stage_id: string;
  submit_button_text: string;
  success_message: string;
  pipeline_form_fields: FormField[];
  created_at: string;
}

export default function PipelineFormsPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.pipelineId as string;

  const [forms, setForms] = useState<PipelineForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pipelineName, setPipelineName] = useState('');

  const loadForms = useCallback(async () => {
    const res = await fetch(`/api/pipeline/${pipelineId}/forms`);
    if (res.ok) {
      const data = await res.json();
      setForms(data);
    }
    setLoading(false);
  }, [pipelineId]);

  const loadPipeline = useCallback(async () => {
    const res = await fetch(`/api/pipeline/${pipelineId}`);
    if (res.ok) {
      const data = await res.json();
      setPipelineName(data.name);
    }
  }, [pipelineId]);

  useEffect(() => {
    loadForms();
    loadPipeline();
  }, [loadForms, loadPipeline]);

  const handleCreate = async () => {
    // Fetch stages to get default
    const stagesRes = await fetch(`/api/pipeline/${pipelineId}`);
    if (!stagesRes.ok) return;
    const pipelineData = await stagesRes.json();
    const stages = pipelineData.pipeline_stages || [];
    if (stages.length === 0) return;

    const sortedStages = [...stages].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    const firstStage = sortedStages[0];

    setCreating(true);
    const res = await fetch(`/api/pipeline/${pipelineId}/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Form',
        stage_id: firstStage.id,
      }),
    });

    if (res.ok) {
      const form = await res.json();
      router.push(`/pipeline/${pipelineId}/forms/${form.id}`);
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to create form');
    }
    setCreating(false);
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Delete this form? This cannot be undone.')) return;

    const res = await fetch(`/api/pipeline/${pipelineId}/forms/${formId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setForms((prev) => prev.filter((f) => f.id !== formId));
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch {
      // Fallback
      prompt(`Copy this ${label}:`, text);
    }
  };

  const getFormUrl = (slug: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/f/${slug}`;
  };

  const getEmbedCode = (slug: string) => {
    const url = getFormUrl(slug);
    return `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`;
  };

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
        title="Forms"
        icon={DocumentDuplicateIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: pipelineName || 'Pipeline', href: `/pipeline/${pipelineId}` },
          { label: 'Forms' },
        ]}
        subtitle="Create embeddable forms that feed submissions into your pipeline"
        action={
          <button
            onClick={handleCreate}
            disabled={creating || forms.length >= 2}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            {creating ? 'Creating...' : 'Create Form'}
          </button>
        }
        className="mb-6"
      />

      {forms.length >= 2 && (
        <p className="text-sm text-stone mb-4">Maximum 2 forms per pipeline reached.</p>
      )}

      {forms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-cream-warm">
          <DocumentDuplicateIcon className="w-12 h-12 mx-auto text-stone/40 mb-4" />
          <h3 className="text-lg font-semibold text-charcoal mb-2">No forms yet</h3>
          <p className="text-stone mb-6">Create a form to start collecting submissions into this pipeline.</p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal/90 disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" />
            Create Form
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-xl border border-cream-warm p-6 hover:border-teal/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">{form.name}</h3>
                  {form.description && (
                    <p className="text-sm text-stone mt-1">{form.description}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                    form.is_published
                      ? 'bg-teal/10 text-teal'
                      : 'bg-stone/10 text-stone'
                  }`}
                >
                  <GlobeAltIcon className="w-3 h-3" />
                  {form.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              <p className="text-xs text-stone mb-4">
                {form.pipeline_form_fields?.length || 0} fields
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => router.push(`/pipeline/${pipelineId}/forms/${form.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal bg-teal/10 rounded-md hover:bg-teal/20 transition-colors"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                  Edit
                </button>

                {form.is_published && (
                  <>
                    <button
                      onClick={() => copyToClipboard(getFormUrl(form.slug), 'Form link')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-charcoal bg-cream-warm rounded-md hover:bg-cream-warm/80 transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Copy Link
                    </button>
                    <button
                      onClick={() => copyToClipboard(getEmbedCode(form.slug), 'Embed code')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-charcoal bg-cream-warm rounded-md hover:bg-cream-warm/80 transition-colors"
                    >
                      <CodeBracketIcon className="w-3.5 h-3.5" />
                      Embed
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(form.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors ml-auto"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
