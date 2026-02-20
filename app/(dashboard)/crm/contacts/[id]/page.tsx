'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ContactDetailHeader } from '@/components/crm/contact-detail-header';
import { ContactDetailTabs } from '@/components/crm/contact-detail-tabs';
import { ContactFormModal } from '@/components/crm/contact-form-modal';
import { ContactAuditWidget } from '@/components/brand-audit/contact-audit-widget';

interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  job_title: string | null;
  lifecycle_stage: string;
  lifetime_value_cents: number;
  source: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
  };
  crm_contact_tags?: Array<{ tag_id: string; crm_tags: { id: string; name: string; color: string } }>;
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase.from('org_members').select('organization_id').eq('user_id', user.id).single();
      if (membership) setOrganizationId(membership.organization_id);
    };
    load();
  }, []);

  useEffect(() => {
    if (!contactId) return;

    const fetchContact = async () => {
      try {
        const res = await fetch(`/api/crm/contacts/${contactId}`);
        if (!res.ok) throw new Error('Failed to fetch contact');
        const data = await res.json();
        // Normalize join names from Supabase
        if (data.crm_companies) {
          data.company = data.crm_companies;
        }
        setContact(data);
      } catch (error) {
        console.error('Error fetching contact:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [contactId]);

  if (loading || !organizationId) {
    return <div className="p-6"><div className="animate-pulse bg-gray-100 rounded-xl h-96" /></div>;
  }

  if (!contact) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-stone">Contact not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ContactDetailHeader
        contact={contact as any}
        onEdit={() => setShowEditModal(true)}
        organizationId={organizationId}
      />

      {/* Brand Audit Widget */}
      <div className="mt-4">
        <ContactAuditWidget contactId={contactId} organizationId={organizationId} />
      </div>

      <div className="mt-6">
        <ContactDetailTabs contactId={contactId} organizationId={organizationId} />
      </div>

      {showEditModal && (
        <ContactFormModal
          isOpen={showEditModal}
          organizationId={organizationId}
          contact={contact as any}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
