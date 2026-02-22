'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CompanyOption {
  id: string;
  name: string;
  industry: string | null;
}

interface CompanyPickerProps {
  organizationId: string;
  value: string | null;
  onChange: (companyId: string | null, company?: CompanyOption) => void;
  label?: string;
  className?: string;
}

export function CompanyPicker({ organizationId, value, onChange, label = 'Company', className }: CompanyPickerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CompanyOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<CompanyOption | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value && !selected) {
      fetch(`/api/crm/companies/${value}`)
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
        const res = await fetch(`/api/crm/companies?organizationId=${organizationId}&search=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setResults(data.companies || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  };

  return (
    <div ref={wrapperRef} className={className}>
      {label && <label className="block text-sm font-medium text-charcoal mb-1">{label}</label>}
      {selected ? (
        <div className="flex items-center justify-between bg-cream-warm rounded-lg px-3 py-2 border border-stone/10">
          <span className="text-sm text-charcoal">
            {selected.name}
            {selected.industry && <span className="text-stone ml-1">({selected.industry})</span>}
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
              placeholder="Search companies..."
              className="w-full pl-9 pr-3 py-2 border border-stone/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>
          {isOpen && (search.trim() || results.length > 0) && (
            <div className="absolute z-10 mt-1 w-full bg-cream-warm border border-stone/10 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-2 text-sm text-stone">Searching...</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-sm text-stone">No companies found</div>
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
                    className="w-full text-left px-3 py-2 hover:bg-cream text-sm transition-colors"
                  >
                    <span className="font-medium text-charcoal">{c.name}</span>
                    {c.industry && <span className="text-stone ml-1">- {c.industry}</span>}
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
