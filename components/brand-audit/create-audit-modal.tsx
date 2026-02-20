'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  crm_companies?: { name: string } | null;
}

interface CreateAuditModalProps {
  organizationId: string;
  preselectedContactId?: string;
  onClose: () => void;
  onCreated: (auditId: string) => void;
}

export function CreateAuditModal({ organizationId, preselectedContactId, onClose, onCreated }: CreateAuditModalProps) {
  const [source, setSource] = useState<'manual' | 'call' | 'hybrid'>('manual');
  const [contactSearch, setContactSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [existingAudits, setExistingAudits] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search contacts
  useEffect(() => {
    if (!contactSearch || contactSearch.length < 2) { setContacts([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/crm/contacts?organizationId=${organizationId}&search=${encodeURIComponent(contactSearch)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setContacts(Array.isArray(data) ? data : data.contacts || []);
        }
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [contactSearch, organizationId]);

  // Pre-select contact
  useEffect(() => {
    if (!preselectedContactId) return;
    (async () => {
      try {
        const res = await fetch(`/api/crm/contacts/${preselectedContactId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedContact(data);
        }
      } catch { /* ignore */ }
    })();
  }, [preselectedContactId]);

  // Check for existing audits when contact selected
  useEffect(() => {
    if (!selectedContact) { setExistingAudits(0); return; }
    (async () => {
      try {
        const res = await fetch(`/api/brand-audits?organizationId=${organizationId}&contactId=${selectedContact.id}`);
        if (res.ok) {
          const data = await res.json();
          setExistingAudits(data.filter((a: { status: string }) => a.status !== 'abandoned').length);
        }
      } catch { /* ignore */ }
    })();
  }, [selectedContact, organizationId]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brand-audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          contactId: selectedContact?.id || null,
          source,
        }),
      });
      if (!res.ok) throw new Error('Failed to create audit');
      const audit = await res.json();
      onCreated(audit.id);
    } catch (error) {
      console.error('Error creating audit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone/10">
          <h2 className="text-lg font-semibold text-charcoal">New Brand Audit</h2>
          <button onClick={onClose} className="text-stone hover:text-charcoal">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Source selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Audit Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['manual', 'call', 'hybrid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    source === s
                      ? 'border-teal bg-teal/10 text-teal'
                      : 'border-stone/20 text-stone hover:border-stone/40'
                  }`}
                >
                  {s === 'manual' ? 'Manual Wizard' : s === 'call' ? 'Call-Based' : 'Hybrid'}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone mt-2">
              {source === 'manual' && 'Fill in each section manually through a guided wizard'}
              {source === 'call' && 'Extract audit data from a discovery call recording'}
              {source === 'hybrid' && 'Start with a call, then fill in any gaps manually'}
            </p>
          </div>

          {/* Contact picker */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Link to Contact (optional)</label>
            {selectedContact ? (
              <div className="flex items-center justify-between p-3 bg-cream-warm rounded-lg">
                <div>
                  <div className="font-medium text-sm text-charcoal">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </div>
                  {selectedContact.email && (
                    <div className="text-xs text-stone">{selectedContact.email}</div>
                  )}
                </div>
                <button onClick={() => setSelectedContact(null)} className="text-stone hover:text-charcoal">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                <Input
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="pl-10"
                />
                {contacts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-stone/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {contacts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedContact(c); setContactSearch(''); setContacts([]); }}
                        className="w-full text-left px-4 py-2 hover:bg-cream-warm text-sm"
                      >
                        <div className="font-medium text-charcoal">{c.first_name} {c.last_name}</div>
                        <div className="text-xs text-stone">{c.email} {c.crm_companies?.name ? `• ${c.crm_companies.name}` : ''}</div>
                      </button>
                    ))}
                  </div>
                )}
                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone">Searching...</div>}
              </div>
            )}

            {existingAudits > 0 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                This contact already has {existingAudits} audit{existingAudits > 1 ? 's' : ''}. Creating a new one will enable comparison.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-stone/10">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="bg-teal hover:bg-teal-dark text-white"
          >
            {loading ? 'Creating...' : 'Create Audit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
