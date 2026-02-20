'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { VariableTextarea, VariableInput } from '@/components/content/variable-field';
import { useBrandVariables } from '@/hooks/useBrandVariables';
import { PLATFORM_CHARACTER_LIMITS } from '@/config/creative-specs';
import { HashtagPickerModal } from '@/components/social/hashtag-picker-modal';
import { BookmarkIcon } from '@heroicons/react/24/outline';

interface PlatformOverrideTabsProps {
  platforms: string[];
  universalCaption: string;
  universalHashtags: string[];
  platformSpecs: Record<string, { caption?: string; hashtags?: string[]; customized?: boolean }>;
  onUniversalChange: (caption: string, hashtags: string[]) => void;
  onPlatformChange: (platform: string, caption: string, hashtags: string[]) => void;
  organizationId?: string | null;
}

export function PlatformOverrideTabs({
  platforms,
  universalCaption,
  universalHashtags,
  platformSpecs,
  onUniversalChange,
  onPlatformChange,
  organizationId,
}: PlatformOverrideTabsProps) {
  const [activeTab, setActiveTab] = useState('universal');
  const [showHashtagPicker, setShowHashtagPicker] = useState(false);
  const { categories: brandCategories, flatVariables: brandFlatVariables } = useBrandVariables(organizationId || null);

  const tabs = ['universal', ...platforms];

  const handleHashtagSelect = (hashtags: string[]) => {
    if (activeTab === 'universal') {
      // Merge with existing hashtags, avoiding duplicates
      const existingHashtags = universalHashtags;
      const newHashtags = [...new Set([...existingHashtags, ...hashtags])];
      onUniversalChange(universalCaption, newHashtags);
    } else {
      // Platform-specific hashtags
      const existingHashtags = platformSpecs[activeTab]?.hashtags ?? universalHashtags;
      const newHashtags = [...new Set([...existingHashtags, ...hashtags])];
      onPlatformChange(
        activeTab,
        platformSpecs[activeTab]?.caption ?? universalCaption,
        newHashtags
      );
    }
    setShowHashtagPicker(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-4 border-b border-stone/10">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-2 px-1 text-xs font-medium capitalize border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'universal' ? (
        <div className="space-y-3">
          <VariableTextarea
            label="Universal Caption"
            value={universalCaption}
            onValueChange={v => onUniversalChange(v, universalHashtags)}
            rows={3}
            placeholder="Caption for all platforms... (~ for brand variables)"
            brandFlatVariables={brandFlatVariables}
            brandCategories={brandCategories}
          />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-charcoal">Hashtags</label>
              {organizationId && (
                <button
                  onClick={() => setShowHashtagPicker(true)}
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal hover:text-teal-dark border border-teal/20 hover:border-teal rounded-lg transition-colors"
                >
                  <BookmarkIcon className="w-3.5 h-3.5" />
                  Insert from Vault
                </button>
              )}
            </div>
            <VariableInput
              value={universalHashtags.join(' ')}
              onValueChange={v => onUniversalChange(universalCaption, v.split(/\s+/).filter(Boolean))}
              placeholder="#hashtag1 #hashtag2 (~ for brand variables)"
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <VariableTextarea
            label={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Caption`}
            value={platformSpecs[activeTab]?.caption ?? universalCaption}
            onValueChange={v => onPlatformChange(activeTab, v, platformSpecs[activeTab]?.hashtags ?? universalHashtags)}
            rows={3}
            hint={`Max ${PLATFORM_CHARACTER_LIMITS[activeTab]?.caption || '?'} characters`}
            brandFlatVariables={brandFlatVariables}
            brandCategories={brandCategories}
          />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-charcoal">Hashtags</label>
              {organizationId && (
                <button
                  onClick={() => setShowHashtagPicker(true)}
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal hover:text-teal-dark border border-teal/20 hover:border-teal rounded-lg transition-colors"
                >
                  <BookmarkIcon className="w-3.5 h-3.5" />
                  Insert from Vault
                </button>
              )}
            </div>
            <VariableInput
              value={(platformSpecs[activeTab]?.hashtags ?? universalHashtags).join(' ')}
              onValueChange={v => onPlatformChange(activeTab, platformSpecs[activeTab]?.caption ?? universalCaption, v.split(/\s+/).filter(Boolean))}
              placeholder="#hashtag1 #hashtag2 (~ for brand variables)"
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
            <p className="text-xs text-stone mt-1">Max {PLATFORM_CHARACTER_LIMITS[activeTab]?.hashtags || '?'} hashtags</p>
          </div>
          {platformSpecs[activeTab]?.customized && (
            <p className="text-xs text-teal">Custom content for this platform</p>
          )}
        </div>
      )}

      {/* Hashtag Picker Modal */}
      {showHashtagPicker && organizationId && (
        <HashtagPickerModal
          onSelect={handleHashtagSelect}
          onClose={() => setShowHashtagPicker(false)}
          organizationId={organizationId}
          selectedPlatforms={activeTab === 'universal' ? platforms : [activeTab]}
        />
      )}
    </div>
  );
}
