'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ContactOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  crm_companies?: { id: string; name: string } | null;
}

interface ContactPickerProps {
  organizationId: string;
  value: string | null;
  onChange: (contactId: string | null, contact?: ContactOption) => void;
  label?: string;
  className?: string;
}

export function ContactPicker({ organizationId, value, onChange, label = 'Contact', className }: ContactPickerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ContactOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<ContactOption | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value && !selected) {
      fetch(`/api/crm/contacts/${value}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id) setSelected(data);
        })
        .catch(() => {});
    }
  }, [value, selected]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/crm/contacts?organizationId=${organizationId}&search=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setResults(data.contacts || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  };

  return (
    <div ref={wrapperRef} className={className}>
      {label && <label className="block text-sm font-medium text-charcoal mb-1">{label}</label>}
      {selected ? (
        <div className="flex items-center justify-between bg-cream-warm rounded-lg px-3 py-2 border border-gray-200">
          <span className="text-sm text-charcoal">
            {selected.first_name} {selected.last_name}
            {selected.email && <span className="text-stone ml-1">({selected.email})</span>}
          </span>
          <button
            type="button"
            onClick={() => { setSelected(null); onChange(null); setSearch(''); }}
            className="text-stone hover:text-red-500 text-xs ml-2"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>
          {isOpen && (search.trim() || results.length > 0) && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-2 text-sm text-stone">Searching...</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-sm text-stone">No contacts found</div>
              ) : (
                results.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      onChange(c.id, c);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-cream-warm text-sm transition-colors"
                  >
                    <span className="font-medium text-charcoal">{c.first_name} {c.last_name}</span>
                    {c.email && <span className="text-stone ml-1">- {c.email}</span>}
                    {c.crm_companies && <span className="text-stone/60 ml-1">({c.crm_companies.name})</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
