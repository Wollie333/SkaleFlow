'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { VariableTextarea, VariableInput } from '@/components/content/variable-field';
import { useBrandVariables } from '@/hooks/useBrandVariables';
import { PLATFORM_CHARACTER_LIMITS } from '@/config/creative-specs';

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
  const { categories: brandCategories, flatVariables: brandFlatVariables } = useBrandVariables(organizationId || null);

  const tabs = ['universal', ...platforms];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-stone/5 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors',
              activeTab === tab
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-stone hover:text-charcoal'
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
          <VariableInput
            label="Hashtags"
            value={universalHashtags.join(' ')}
            onValueChange={v => onUniversalChange(universalCaption, v.split(/\s+/).filter(Boolean))}
            placeholder="#hashtag1 #hashtag2 (~ for brand variables)"
            brandFlatVariables={brandFlatVariables}
            brandCategories={brandCategories}
          />
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
            <VariableInput
              label="Hashtags"
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
    </div>
  );
}
