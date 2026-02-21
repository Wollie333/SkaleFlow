'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DirectorySearchBar } from '@/components/authority/directory/directory-search-bar';
import { DirectoryFilters } from '@/components/authority/directory/directory-filters';
import { DirectoryContactCard, type DirectoryContactCardData } from '@/components/authority/directory/directory-contact-card';
import { DirectoryReachOutModal } from '@/components/authority/directory/directory-reach-out-modal';
import { EmailComposeModal } from '@/components/authority/contact-detail/email-compose-modal';
import { BookOpenIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function PRDirectoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<DirectoryContactCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);

  // Reach out state
  const [reachOutContactId, setReachOutContactId] = useState<string | null>(null);
  const [reachOutContact, setReachOutContact] = useState<{ full_name: string; category: string; email: string | null } | null>(null);
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [emailComposeData, setEmailComposeData] = useState<{ contactId: string; contactEmail: string | null; contactName: string; cardId: string } | null>(null);

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

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (country) params.set('country', country);
      if (city) params.set('city', city);
      if (selectedIndustries.length > 0) params.set('industry', selectedIndustries[0]);
      if (savedOnly) params.set('savedOnly', 'true');

      const res = await fetch(`/api/authority/directory?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, country, city, selectedIndustries, savedOnly]);

  useEffect(() => {
    const debounce = setTimeout(fetchContacts, 300);
    return () => clearTimeout(debounce);
  }, [fetchContacts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, country, city, selectedIndustries, savedOnly]);

  const toggleSave = async (contactId: string, currentlySaved: boolean) => {
    if (currentlySaved) {
      await fetch(`/api/authority/directory/${contactId}/save`, { method: 'DELETE' });
    } else {
      await fetch(`/api/authority/directory/${contactId}/save`, { method: 'POST' });
    }
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, is_saved: !currentlySaved } : c))
    );
  };

  const handleReachOut = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    setReachOutContactId(contactId);
    setReachOutContact({
      full_name: contact.full_name,
      category: contact.category,
      email: null, // will be fetched in the reach-out call
    });
  };

  const handleReachOutConfirm = async (data: { category: string; opportunityName: string }) => {
    if (!reachOutContactId || !organizationId) return;

    const res = await fetch(`/api/authority/directory/${reachOutContactId}/reach-out`, {
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
    setReachOutContactId(null);
    setReachOutContact(null);

    // Open email composer
    setEmailComposeData({
      contactId: result.contact.id,
      contactEmail: result.contact.email,
      contactName: reachOutContact?.full_name || '',
      cardId: result.card.id,
    });
    setShowEmailCompose(true);
  };

  const activeFilterCount = [category, country, city, savedOnly, selectedIndustries.length > 0]
    .filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpenIcon className="h-7 w-7 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PR Directory</h1>
            <p className="text-sm text-gray-500">{total} contact{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/authority/directory/add')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Search + Filters */}
      <DirectorySearchBar
        search={search}
        onSearchChange={setSearch}
        activeFilterCount={activeFilterCount}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {showFilters && (
        <DirectoryFilters
          category={category}
          onCategoryChange={setCategory}
          country={country}
          onCountryChange={setCountry}
          city={city}
          onCityChange={setCity}
          selectedIndustries={selectedIndustries}
          onIndustriesChange={setSelectedIndustries}
          savedOnly={savedOnly}
          onSavedOnlyChange={setSavedOnly}
        />
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="mt-4 h-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16">
          <BookOpenIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No contacts found</p>
          <p className="text-gray-400 text-xs mt-1">Try adjusting your filters or add a new contact</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <DirectoryContactCard
              key={contact.id}
              contact={contact}
              onToggleSave={toggleSave}
              onReachOut={handleReachOut}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Reach Out Modal */}
      {reachOutContact && (
        <DirectoryReachOutModal
          isOpen={!!reachOutContactId}
          onClose={() => {
            setReachOutContactId(null);
            setReachOutContact(null);
          }}
          contactName={reachOutContact.full_name}
          contactCategory={reachOutContact.category as import('@/types/database').PRDirectoryCategory}
          onConfirm={handleReachOutConfirm}
        />
      )}

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
