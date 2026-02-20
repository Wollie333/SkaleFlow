'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Cog6ToothIcon,
  BoltIcon,
  ChartBarIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';
import { PipelineBoard } from '@/components/pipeline/pipeline-board';
import { CreateContactModal } from '@/components/pipeline/create-contact-modal';
import { ContactDetailPanel } from '@/components/pipeline/contact-detail-panel';
import type { Database } from '@/types/database';

interface Stage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_win_stage: boolean;
  is_loss_stage: boolean;
}

interface ContactTag {
  tag_id: string;
  pipeline_tags: { id: string; name: string; color: string } | null;
}

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  value_cents: number;
  stage_id: string;
  assigned_to: string | null;
  notes: string | null;
  pipeline_contact_tags?: ContactTag[];
  created_at: string;
  activity?: Array<{
    id: string;
    event_type: string;
    from_stage_id: string | null;
    to_stage_id: string | null;
    metadata: Record<string, unknown>;
    performed_by: string | null;
    created_at: string;
  }>;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface PipelineData {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  pipeline_stages: Stage[];
}

export default function PipelineBoardPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.pipelineId as string;

  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [createStageId, setCreateStageId] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadPipeline = useCallback(async () => {
    const response = await fetch(`/api/pipeline/${pipelineId}`);
    if (response.ok) {
      const data = await response.json();
      setPipeline(data);
    }
  }, [pipelineId]);

  const loadContacts = useCallback(async () => {
    const response = await fetch(`/api/pipeline/${pipelineId}/contacts`);
    if (response.ok) {
      const data = await response.json();
      setContacts(data);
    }
  }, [pipelineId]);

  const loadTags = useCallback(async () => {
    if (!pipeline?.organization_id) return;
    const response = await fetch(`/api/pipeline/tags?organizationId=${pipeline.organization_id}`);
    if (response.ok) {
      const data = await response.json();
      setTags(data);
    }
  }, [pipeline?.organization_id]);

  useEffect(() => {
    const init = async () => {
      await loadPipeline();
      await loadContacts();
      setLoading(false);
    };
    init();
  }, [loadPipeline, loadContacts]);

  useEffect(() => {
    if (pipeline?.organization_id) {
      loadTags();
    }
  }, [pipeline?.organization_id, loadTags]);

  const handleContactMove = async (contactId: string, newStageId: string) => {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, stage_id: newStageId } : c))
    );

    await fetch(`/api/pipeline/${pipelineId}/contacts/${contactId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: newStageId }),
    });
  };

  const handleContactClick = async (contact: Contact) => {
    // Load full contact detail with activity
    const response = await fetch(`/api/pipeline/${pipelineId}/contacts/${contact.id}`);
    if (response.ok) {
      const data = await response.json();
      setSelectedContact(data);
    } else {
      setSelectedContact(contact);
    }
  };

  const handleAddContact = (stageId: string) => {
    setCreateStageId(stageId);
    setShowCreateContact(true);
  };

  const handleCreateContact = async (data: {
    full_name: string;
    email: string;
    phone: string;
    company: string;
    value_cents: number;
    stage_id: string;
  }) => {
    const response = await fetch(`/api/pipeline/${pipelineId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await loadContacts();
    }
  };

  const handleUpdateContact = async (contactId: string, data: Record<string, unknown>) => {
    await fetch(`/api/pipeline/${pipelineId}/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await loadContacts();
  };

  const handleAddTag = async (contactId: string, tagId: string) => {
    await fetch(`/api/pipeline/${pipelineId}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId }),
    });
    await loadContacts();
    // Refresh selected contact
    if (selectedContact?.id === contactId) {
      handleContactClick(selectedContact);
    }
  };

  const handleRemoveTag = async (contactId: string, tagId: string) => {
    await fetch(`/api/pipeline/${pipelineId}/contacts/${contactId}/tags?tagId=${tagId}`, {
      method: 'DELETE',
    });
    await loadContacts();
    if (selectedContact?.id === contactId) {
      handleContactClick(selectedContact);
    }
  };

  const handleSendEmail = (contactId: string) => {
    router.push(`/pipeline/templates?contactId=${contactId}&pipelineId=${pipelineId}`);
  };

  const createStageName = pipeline?.pipeline_stages?.find((s) => s.id === createStageId)?.name || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="text-center py-16">
        <p className="text-stone">Pipeline not found</p>
      </div>
    );
  }

  const stages = [...(pipeline.pipeline_stages || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={pipeline.name}
        icon={ViewColumnsIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: pipeline.name },
        ]}
        subtitle={pipeline.description || undefined}
        action={
          <div className="flex items-center gap-1 bg-cream-warm rounded-lg p-1">
            <button
              onClick={() => router.push(`/pipeline/${pipelineId}/automations`)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone hover:text-teal hover:bg-cream-warm rounded-md transition-all"
            >
              <BoltIcon className="w-4 h-4" />
              Automations
            </button>
            <button
              onClick={() => router.push(`/pipeline/${pipelineId}/analytics`)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone hover:text-teal hover:bg-cream-warm rounded-md transition-all"
            >
              <ChartBarIcon className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => router.push(`/pipeline/${pipelineId}/settings`)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone hover:text-teal hover:bg-cream-warm rounded-md transition-all"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Settings
            </button>
          </div>
        }
        className="mb-6"
      />

      {/* Board */}
      <PipelineBoard
        pipelineId={pipelineId}
        stages={stages}
        contacts={contacts}
        onContactMove={handleContactMove}
        onContactClick={handleContactClick}
        onAddContact={handleAddContact}
      />

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={showCreateContact}
        stageId={createStageId}
        stageName={createStageName}
        onClose={() => setShowCreateContact(false)}
        onCreate={handleCreateContact}
      />

      {/* Contact Detail Panel */}
      <ContactDetailPanel
        contact={selectedContact}
        stages={stages}
        availableTags={tags}
        pipelineId={pipelineId}
        onClose={() => setSelectedContact(null)}
        onUpdate={handleUpdateContact}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onSendEmail={handleSendEmail}
      />
    </div>
  );
}
