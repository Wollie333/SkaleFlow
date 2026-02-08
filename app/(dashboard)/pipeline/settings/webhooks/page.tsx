'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { PlusIcon, LinkIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';
import { WebhookList } from '@/components/pipeline/webhooks/webhook-list';
import { WebhookForm } from '@/components/pipeline/webhooks/webhook-form';
import type { Database } from '@/types/database';

interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

export default function WebhookSettingsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase.from('org_members').select('organization_id').eq('user_id', user.id).single();
    if (!membership) return;
    setOrganizationId(membership.organization_id);

    const response = await fetch(`/api/pipeline/webhooks?organizationId=${membership.organization_id}`);
    if (response.ok) {
      const data = await response.json();
      setEndpoints(data.map((e: Record<string, unknown>) => ({ ...e, headers: (e.headers || {}) as Record<string, string> })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: { name: string; url: string; method: string; headers: Record<string, string> }) => {
    if (editingEndpoint) {
      await fetch(`/api/pipeline/webhooks/${editingEndpoint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/pipeline/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, ...data }),
      });
    }
    setEditingEndpoint(null);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this endpoint?')) return;
    await fetch(`/api/pipeline/webhooks/${id}`, { method: 'DELETE' });
    await loadData();
  };

  const handleTest = async (id: string) => {
    const response = await fetch(`/api/pipeline/webhooks/${id}/test`, { method: 'POST' });
    const data = await response.json();
    alert(data.success ? `Test successful! Status: ${data.statusCode}` : `Test failed: ${data.error || data.statusText}`);
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
        title="Webhooks"
        icon={LinkIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: 'Webhooks' },
        ]}
        action={
          <button onClick={() => { setEditingEndpoint(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg">
            <PlusIcon className="w-4 h-4" /> Add Endpoint
          </button>
        }
        className="mb-6"
      />

      <WebhookList endpoints={endpoints}
        onEdit={(ep) => { setEditingEndpoint(ep); setShowForm(true); }}
        onDelete={handleDelete} onTest={handleTest} />

      <WebhookForm isOpen={showForm} endpoint={editingEndpoint}
        onClose={() => { setShowForm(false); setEditingEndpoint(null); }} onSave={handleSave} />
    </div>
  );
}
