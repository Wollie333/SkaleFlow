'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DirectoryContactProfile, type DirectoryContactProfileData } from '@/components/authority/directory/directory-contact-profile';
import { DirectoryReachOutModal } from '@/components/authority/directory/directory-reach-out-modal';
import { DirectoryFlagModal } from '@/components/authority/directory/directory-flag-modal';
import { EmailComposeModal } from '@/components/authority/contact-detail/email-compose-modal';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { PRDirectoryCategory, PRDirectoryFlagReason } from '@/types/database';

export default function DirectoryContactPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [contact, setContact] = useState<DirectoryContactProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Modal state
  const [showReachOut, setShowReachOut] = useState(false);
  const [showFlag, setShowFlag] = useState(false);
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [emailComposeData, setEmailComposeData] = useState<{
    contactId: string;
    contactEmail: string | null;
    contactName: string;
    cardId: string;
  } | null>(null);

  // Get org
  useEffect(() => {
    async function getOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (data?.organization_id) setOrganizationId(data.organization_id);
    }
    getOrg();
  }, []);

  // Fetch contact
  useEffect(() => {
    async function fetchContact() {
      setLoading(true);
      try {
        const res = await fetch(`/api/authority/directory/${contactId}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setContact(data);
      } catch {
        setContact(null);
      } finally {
        setLoading(false);
      }
    }
    fetchContact();
  }, [contactId]);

  const toggleSave = async () => {
    if (!contact) return;
    if (contact.is_saved) {
      await fetch(`/api/authority/directory/${contactId}/save`, { method: 'DELETE' });
    } else {
      await fetch(`/api/authority/directory/${contactId}/save`, { method: 'POST' });
    }
    setContact({ ...contact, is_saved: !contact.is_saved });
  };

  const handleFlag = async (reason: PRDirectoryFlagReason, details: string) => {
    const res = await fetch(`/api/authority/directory/${contactId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, details }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to flag contact');
    }
  };

  const handleReachOutConfirm = async (data: { category: string; opportunityName: string }) => {
    if (!organizationId || !contact) return;

    const res = await fetch(`/api/authority/directory/${contactId}/reach-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        category: data.category,
        opportunityName: data.opportunityName,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to create opportunity');
      return;
    }

    const result = await res.json();
    setShowReachOut(false);

    // Open email composer
    setEmailComposeData({
      contactId: result.contact.id,
      contactEmail: result.contact.email,
      contactName: contact.full_name,
      cardId: result.card.id,
    });
    setShowEmailCompose(true);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex gap-6">
              <div className="h-24 w-24 rounded-full bg-gray-200" />
              <div className="space-y-3 flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center">
        <p className="text-gray-500">Contact not found</p>
        <button
          onClick={() => router.push('/authority/directory')}
          className="mt-4 text-teal-600 text-sm hover:underline"
        >
          Back to directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push('/authority/directory')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to PR Directory
      </button>

      {/* Profile */}
      <DirectoryContactProfile
        contact={contact}
        onReachOut={() => setShowReachOut(true)}
        onToggleSave={toggleSave}
        onFlag={() => setShowFlag(true)}
      />

      {/* Reach Out Modal */}
      <DirectoryReachOutModal
        isOpen={showReachOut}
        onClose={() => setShowReachOut(false)}
        contactName={contact.full_name}
        contactCategory={contact.category as PRDirectoryCategory}
        onConfirm={handleReachOutConfirm}
      />

      {/* Flag Modal */}
      <DirectoryFlagModal
        isOpen={showFlag}
        onClose={() => setShowFlag(false)}
        contactName={contact.full_name}
        onSubmit={handleFlag}
      />

      {/* Email Compose Modal */}
      {showEmailCompose && emailComposeData && organizationId && (
        <EmailComposeModal
          isOpen={showEmailCompose}
          onClose={() => {
            setShowEmailCompose(false);
            setEmailComposeData(null);
          }}
          organizationId={organizationId}
          contactId={emailComposeData.contactId}
          contactEmail={emailComposeData.contactEmail}
          contactName={emailComposeData.contactName}
          cardId={emailComposeData.cardId}
        />
      )}
    </div>
  );
}
