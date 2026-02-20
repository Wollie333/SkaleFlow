'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DealList from '@/components/crm/deal-list';
import DealFormModal from '@/components/crm/deal-form-modal';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function DealsPage() {
  const searchParams = useSearchParams();
  const initialContactId = searchParams.get('contactId');

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

  if (!organizationId) return <div className="p-6"><div className="animate-pulse bg-cream rounded-xl h-96" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Deals</h1>
        <p className="text-sm text-stone mt-1">Track your sales opportunities</p>
      </div>

      <DealList organizationId={organizationId} onCreateClick={() => setShowCreateModal(true)} initialContactId={initialContactId || undefined} />

      {showCreateModal && (
        <DealFormModal
          isOpen={showCreateModal}
          organizationId={organizationId}
          initialContactId={initialContactId || undefined}
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
