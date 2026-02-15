'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ContactList } from '@/components/crm/contact-list';
import { ContactFormModal } from '@/components/crm/contact-form-modal';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function ContactsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  if (!organizationId) return <div className="p-6"><div className="animate-pulse bg-gray-100 rounded-xl h-96" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Contacts</h1>
          <p className="text-sm text-stone mt-1">Manage your contacts and relationships</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Contact
        </Button>
      </div>

      <ContactList organizationId={organizationId} onCreateClick={() => setShowCreateModal(true)} />

      {showCreateModal && (
        <ContactFormModal
          isOpen={showCreateModal}
          organizationId={organizationId}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
