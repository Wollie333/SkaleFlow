'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ContactList, type AuthorityContactListItem } from '@/components/authority/contact-list';
import { CreateContactModal } from '@/components/authority/create-contact-modal';
import { CsvImportModal } from '@/components/authority/csv-import-modal';
import { WARMTH_CONFIG, CONTACT_ROLES } from '@/lib/authority/constants';
import {
  UsersIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import type { AuthorityContactWarmth } from '@/lib/authority/types';

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
}

export default function AuthorityContactsPage() {
  const supabase = createClient();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warmthFilter, setWarmthFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  // Get organization ID
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

  // Load contacts
  const loadContacts = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);

    const params = new URLSearchParams({ organizationId });
    if (search) params.set('search', search);
    if (warmthFilter) params.set('warmth', warmthFilter);
    if (roleFilter) params.set('role', roleFilter);

    const res = await fetch(`/api/authority/contacts?${params}`);
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }, [organizationId, search, warmthFilter, roleFilter]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Create / Edit
  const handleSubmitContact = async (data: Record<string, unknown>) => {
    if (editContact) {
      const res = await fetch(`/api/authority/contacts/${editContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        loadContacts();
        return;
      }
    } else {
      const res = await fetch('/api/authority/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, ...data }),
      });
      if (res.status === 409) {
        const body = await res.json();
        return { duplicates: body.duplicates };
      }
      if (res.ok) {
        loadContacts();
        return;
      }
    }
  };

  const handleContactClick = (contact: AuthorityContactListItem) => {
    // Find the full contact data to open the edit modal
    const fullContact = contacts.find((c) => c.id === contact.id);
    if (!fullContact) return;
    setEditContact(fullContact);
    setShowCreateModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-6 h-6 text-teal" />
          <h1 className="text-2xl font-serif font-bold text-charcoal">Media Contacts</h1>
          {!loading && (
            <span className="text-xs text-stone bg-stone/5 px-2 py-1 rounded-full">
              {contacts.length} contacts
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal border border-stone/20 rounded-lg hover:bg-cream-warm transition-colors"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => { setEditContact(null); setShowCreateModal(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or outlet..."
            className="w-full pl-9 pr-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-stone" />
          <select
            value={warmthFilter}
            onChange={(e) => setWarmthFilter(e.target.value)}
            className="px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
          >
            <option value="">All Warmth</option>
            {Object.entries(WARMTH_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
          >
            <option value="">All Roles</option>
            {CONTACT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse text-stone text-sm">Loading contacts...</div>
        </div>
      ) : (
        <ContactList contacts={contacts} onContactClick={handleContactClick} />
      )}

      {/* Create / Edit Modal */}
      <CreateContactModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditContact(null); }}
        onSubmit={handleSubmitContact}
        editData={editContact}
      />

      {/* Import Modal */}
      {organizationId && (
        <CsvImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          organizationId={organizationId}
          onImportComplete={loadContacts}
        />
      )}
    </div>
  );
}
