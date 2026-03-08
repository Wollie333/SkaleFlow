'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { PLATFORM_CONFIGS } from '@/config/platform-configs';
import type { PlatformKey, PlatformGoal } from '@/types/presence';
import {
  XMarkIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface PlatformSelectorProps {
  organizationId: string;
  existingPlatforms: Array<{
    platform_key: string;
    is_active: boolean;
    primary_goal: string | null;
    priority_order: number;
  }>;
  onClose: () => void;
  onSaved: () => void;
}

interface PlatformSelection {
  key: PlatformKey;
  isActive: boolean;
  goal: PlatformGoal | null;
  priority: number;
}

const GOALS: { value: PlatformGoal; label: string }[] = [
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'brand_awareness', label: 'Brand Awareness' },
  { value: 'community', label: 'Community' },
  { value: 'sales', label: 'Sales' },
  { value: 'seo', label: 'SEO' },
  { value: 'thought_leadership', label: 'Thought Leadership' },
];

const ALL_PLATFORMS: PlatformKey[] = [
  'linkedin', 'facebook', 'instagram', 'google_my_business',
  'tiktok', 'youtube', 'twitter_x', 'pinterest',
];

export function PlatformSelector({ organizationId, existingPlatforms, onClose, onSaved }: PlatformSelectorProps) {
  const [selections, setSelections] = useState<PlatformSelection[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initial = ALL_PLATFORMS.map((key, i) => {
      const existing = existingPlatforms.find(p => p.platform_key === key);
      return {
        key,
        isActive: existing?.is_active ?? false,
        goal: (existing?.primary_goal as PlatformGoal) ?? null,
        priority: existing?.priority_order ?? i,
      };
    });
    setSelections(initial);
  }, [existingPlatforms]);

  function togglePlatform(key: PlatformKey) {
    setSelections(prev => prev.map(s =>
      s.key === key ? { ...s, isActive: !s.isActive } : s
    ));
  }

  function setGoal(key: PlatformKey, goal: PlatformGoal) {
    setSelections(prev => prev.map(s =>
      s.key === key ? { ...s, goal } : s
    ));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const response = await fetch('/api/presence/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'activate',
          platforms: selections.map((s, i) => ({
            key: s.key,
            isActive: s.isActive,
            goal: s.goal,
            priority: i,
          })),
        }),
      });

      if (response.ok) {
        onSaved();
      }
    } catch (error) {
      console.error('Save platforms error:', error);
    } finally {
      setIsSaving(false);
    }
  }

  const activeCount = selections.filter(s => s.isActive).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-dark-900">Select Your Platforms</h2>
            <p className="text-sm text-stone-500 mt-1">
              Choose which platforms to optimise. {activeCount} selected.
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {selections.map((selection) => {
            const config = PLATFORM_CONFIGS[selection.key];
            const isStronglyRec = selection.key === 'linkedin' || selection.key === 'instagram';

            return (
              <div
                key={selection.key}
                className={`border rounded-xl p-4 transition-all ${
                  selection.isActive
                    ? 'border-teal-300 bg-teal-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePlatform(selection.key)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        selection.isActive
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {selection.isActive && <CheckIcon className="h-4 w-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-dark-900">{config.name}</h3>
                        {isStronglyRec && (
                          <span className="inline-flex items-center gap-0.5 text-xs bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded">
                            <StarIcon className="h-3 w-3" /> Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-500">{config.description}</p>
                    </div>
                  </div>
                </div>

                {selection.isActive && (
                  <div className="mt-3 ml-9">
                    <label className="text-xs text-stone-500 mb-1 block">Primary goal:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {GOALS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setGoal(selection.key, g.value)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            selection.goal === g.value
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-stone-600 border-stone-300 hover:border-teal-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-stone-200 flex items-center justify-between">
          <p className="text-sm text-stone-500">
            {activeCount} platform{activeCount !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || activeCount === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSaving ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
