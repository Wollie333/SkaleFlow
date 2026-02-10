'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button, Textarea } from '@/components/ui';
import { XMarkIcon, ChevronDownIcon, PencilIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { VARIABLE_DISPLAY_NAMES, BRAND_VARIABLE_CATEGORIES } from '@/lib/content-engine/brand-variable-categories';
import type { Json } from '@/types/database';

interface BrandVariable {
  key: string;
  value: Json | null;
  isLocked: boolean;
  updatedAt: string | null;
}

interface BrandCategory {
  key: string;
  label: string;
  outputKeys: string[];
  variables: BrandVariable[];
}

interface BrandVariablesPanelProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatValue(value: Json | null): string {
  if (value === null || value === undefined) return 'Not set';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export function BrandVariablesPanel({ organizationId, isOpen, onClose }: BrandVariablesPanelProps) {
  const [categories, setCategories] = useState<BrandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen || !organizationId) return;
    loadVariables();
  }, [isOpen, organizationId]);

  // Reset search when panel closes
  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const loadVariables = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/brand-variables?organizationId=${organizationId}`);
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error('Failed to load brand variables:', e);
    }
    setLoading(false);
  };

  // Filter categories and variables by search query
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map(cat => {
        const matchedVars = cat.variables.filter(v => {
          const displayName = (VARIABLE_DISPLAY_NAMES[v.key] || v.key).toLowerCase();
          const val = formatValue(v.value).toLowerCase();
          return displayName.includes(q) || val.includes(q) || v.key.toLowerCase().includes(q);
        });
        return { ...cat, variables: matchedVars };
      })
      .filter(cat => cat.variables.length > 0);
  }, [categories, search]);

  // When searching, expand all matched categories
  const effectiveExpanded = useMemo(() => {
    if (search.trim()) {
      return new Set(filteredCategories.map(c => c.key));
    }
    return expandedCats;
  }, [search, filteredCategories, expandedCats]);

  const toggleCategory = (key: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const startEdit = (key: string, value: Json | null) => {
    setEditingKey(key);
    setEditValue(formatValue(value));
  };

  const saveEdit = async () => {
    if (!editingKey) return;
    setSaving(true);
    try {
      await fetch('/api/content/brand-variables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          outputKey: editingKey,
          outputValue: editValue,
        }),
      });
      setEditingKey(null);
      await loadVariables();
    } catch (e) {
      console.error('Failed to save:', e);
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  const totalVars = filteredCategories.reduce((sum, c) => sum + c.variables.length, 0);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div className="fixed inset-y-0 right-0 w-[420px] max-w-[90vw] bg-white shadow-2xl border-l border-stone/10 z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-stone/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-heading-md text-charcoal">Brand DNA</h2>
              <p className="text-xs text-stone">Variables used in AI content generation</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-cream-warm rounded-lg transition-colors">
              <XMarkIcon className="w-5 h-5 text-stone" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search variables..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-cream-warm/50 border border-stone/10 rounded-lg placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-stone/10 rounded"
              >
                <XMarkIcon className="w-3.5 h-3.5 text-stone" />
              </button>
            )}
          </div>
          {search && (
            <p className="text-xs text-stone mt-1.5">
              {totalVars} {totalVars === 1 ? 'variable' : 'variables'} found
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-stone">Loading brand variables...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-stone">No variables match &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <div className="divide-y divide-stone/5">
              {filteredCategories.map(cat => (
                <div key={cat.key}>
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-cream-warm/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal">{cat.label}</span>
                      <span className="text-xs text-stone bg-stone/10 px-1.5 py-0.5 rounded-full">
                        {cat.variables.length}
                      </span>
                    </div>
                    <ChevronDownIcon className={cn(
                      'w-4 h-4 text-stone transition-transform',
                      effectiveExpanded.has(cat.key) && 'rotate-180'
                    )} />
                  </button>

                  {effectiveExpanded.has(cat.key) && (
                    <div className="px-6 pb-4 space-y-3">
                      {cat.variables.map(v => (
                        <div key={v.key} className="group">
                          <div className="flex items-start justify-between gap-2">
                            <label className="text-xs font-medium text-stone">
                              {VARIABLE_DISPLAY_NAMES[v.key] || v.key}
                            </label>
                            {editingKey !== v.key && (
                              <button
                                onClick={() => startEdit(v.key, v.value)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-cream-warm rounded transition-all"
                              >
                                <PencilIcon className="w-3 h-3 text-stone" />
                              </button>
                            )}
                          </div>

                          {editingKey === v.key ? (
                            <div className="mt-1 space-y-1.5">
                              <Textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                rows={3}
                                className="text-xs"
                              />
                              <div className="flex gap-1.5">
                                <Button size="sm" onClick={saveEdit} disabled={saving}>
                                  <CheckIcon className="w-3 h-3 mr-1" />
                                  {saving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className={cn(
                              'text-xs mt-0.5 whitespace-pre-wrap',
                              v.value ? 'text-charcoal' : 'text-stone/50 italic'
                            )}>
                              {formatValue(v.value)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
