'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Textarea } from '@/components/ui';
import { XMarkIcon, ChevronDownIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
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
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['icp', 'brand']));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !organizationId) return;
    loadVariables();
  }, [isOpen, organizationId]);

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

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-stone/10 overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone/10 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-heading-md text-charcoal">Brand DNA</h2>
          <p className="text-xs text-stone">Variables used in AI content generation</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-cream-warm rounded-lg transition-colors">
          <XMarkIcon className="w-5 h-5 text-stone" />
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-stone">Loading brand variables...</div>
      ) : (
        <div className="divide-y divide-stone/5">
          {categories.map(cat => (
            <div key={cat.key}>
              <button
                onClick={() => toggleCategory(cat.key)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-cream-warm/50 transition-colors"
              >
                <span className="text-sm font-medium text-charcoal">{cat.label}</span>
                <ChevronDownIcon className={cn(
                  'w-4 h-4 text-stone transition-transform',
                  expandedCats.has(cat.key) && 'rotate-180'
                )} />
              </button>

              {expandedCats.has(cat.key) && (
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
  );
}
