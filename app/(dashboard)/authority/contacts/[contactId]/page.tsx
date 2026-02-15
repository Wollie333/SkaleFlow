'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AuthorityContactWarmth } from '@/types/database';
import { ContactHeader } from '@/components/authority/contact-detail/contact-header';
import { ContactOverviewTab } from '@/components/authority/contact-detail/contact-overview-tab';
import { ContactEmailsTab } from '@/components/authority/contact-detail/contact-emails-tab';
import { ContactActivityTab } from '@/components/authority/contact-detail/contact-activity-tab';
import { ContactPipelineTab } from '@/components/authority/contact-detail/contact-pipeline-tab';
import { EmailComposeModal } from '@/components/authority/contact-detail/email-compose-modal';
import { CreateContactModal } from '@/components/authority/create-contact-modal';

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  outlet: string | null;
  role: string | null;
  beat: string | null;
  location: string | null;
  warmth: AuthorityContactWarmth;
  linkedin_url: string | null;
  twitter_url: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  pipeline_cards: PipelineCard[];
  correspondence: CorrespondenceItem[];
}

interface PipelineCard {
  id: string;
  opportunity_name: string;
  category: string;
  created_at: string;
  published_at: string | null;
  authority_pipeline_stages?: { name: string; slug: string; color: string } | null;
}

interface CorrespondenceItem {
  id: string;
  type: string;
  direction: string | null;
  email_subject: string | null;
  summary: string | null;
  occurred_at: string;
}

type Tab = 'overview' | 'emails' | 'activity' | 'pipeline';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.contactId as string;
  const supabase = createClient();

  const [contact, setContact] = useState<Contact | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [hasGmail, setHasGmail] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const loadContact = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/authority/contacts/${contactId}?include=correspondence`);
      if (!res.ok) {
        router.push('/authority/contacts');
        return;
      }
      const data: Contact = await res.json();
      setContact(data);
      setNotes(data.notes || '');
    } catch {
      router.push('/authority/contacts');
    } finally {
      setLoading(false);
    }
  }, [contactId, router]);

  // Get org + check gmail
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (membership) setOrganizationId(membership.organization_id);

      try {
        const { data: gmail } = await supabase
          .from('authority_email_connections')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider', 'gmail')
          .eq('is_active', true)
          .maybeSingle();
        setHasGmail(!!gmail);
      } catch {
        // Table may not exist
      }
    }
    init();
  }, [supabase]);

  useEffect(() => { loadContact(); }, [loadContact]);

  const handleSaveNotes = async () => {
    if (!contactId) return;
    setSavingNotes(true);
    try {
      await fetch(`/api/authority/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEditSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/authority/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowEditModal(false);
      loadContact();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  if (!contact) return null;

  const emailCount = contact.correspondence.filter(c => c.type === 'email').length;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'emails', label: 'Emails', badge: emailCount || undefined },
    { key: 'activity', label: 'Activity', badge: contact.correspondence.length || undefined },
    { key: 'pipeline', label: 'Pipeline Cards', badge: contact.pipeline_cards.length || undefined },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Contact Header */}
      <ContactHeader
        contact={contact}
        hasGmail={hasGmail}
        onSendEmail={() => setShowCompose(true)}
        onEditContact={() => setShowEditModal(true)}
      />

      {/* Tab Bar */}
      <div className="flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="text-[10px] bg-stone/10 text-stone px-1.5 py-0.5 rounded-full">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <ContactOverviewTab
            contact={contact}
            stats={{
              totalEmails: emailCount,
              totalCards: contact.pipeline_cards.length,
              totalCorrespondence: contact.correspondence.length,
            }}
            recentActivity={contact.correspondence.slice(0, 10)}
            notes={notes}
            onNotesChange={setNotes}
            onSaveNotes={handleSaveNotes}
            savingNotes={savingNotes}
          />
        )}

        {activeTab === 'emails' && organizationId && (
          <ContactEmailsTab
            contactId={contact.id}
            contactEmail={contact.email}
            contactName={contact.full_name}
            organizationId={organizationId}
            hasGmail={hasGmail}
          />
        )}

        {activeTab === 'activity' && organizationId && (
          <ContactActivityTab
            contactId={contact.id}
            organizationId={organizationId}
          />
        )}

        {activeTab === 'pipeline' && (
          <ContactPipelineTab cards={contact.pipeline_cards} />
        )}
      </div>

      {/* Compose Modal */}
      {organizationId && (
        <EmailComposeModal
          isOpen={showCompose}
          onClose={() => setShowCompose(false)}
          organizationId={organizationId}
          contactId={contact.id}
          contactEmail={contact.email}
          contactName={contact.full_name}
          onSent={loadContact}
        />
      )}

      {/* Edit Contact Modal */}
      <CreateContactModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        editData={contact}
      />
    </div>
  );
}
