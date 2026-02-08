'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui';
import { PLATFORM_CHARACTER_LIMITS } from '@/config/creative-specs';

interface PlatformOverrideTabsProps {
  platforms: string[];
  universalCaption: string;
  universalHashtags: string[];
  platformSpecs: Record<string, { caption?: string; hashtags?: string[]; customized?: boolean }>;
  onUniversalChange: (caption: string, hashtags: string[]) => void;
  onPlatformChange: (platform: string, caption: string, hashtags: string[]) => void;
}

export function PlatformOverrideTabs({
  platforms,
  universalCaption,
  universalHashtags,
  platformSpecs,
  onUniversalChange,
  onPlatformChange,
}: PlatformOverrideTabsProps) {
  const [activeTab, setActiveTab] = useState('universal');

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
          <Textarea
            label="Universal Caption"
            value={universalCaption}
            onChange={e => onUniversalChange(e.target.value, universalHashtags)}
            rows={3}
            placeholder="Caption for all platforms..."
          />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Hashtags</label>
            <input
              type="text"
              value={universalHashtags.join(' ')}
              onChange={e => onUniversalChange(universalCaption, e.target.value.split(/\s+/).filter(Boolean))}
              className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              placeholder="#hashtag1 #hashtag2"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            label={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Caption`}
            value={platformSpecs[activeTab]?.caption ?? universalCaption}
            onChange={e => onPlatformChange(activeTab, e.target.value, platformSpecs[activeTab]?.hashtags ?? universalHashtags)}
            rows={3}
            hint={`Max ${PLATFORM_CHARACTER_LIMITS[activeTab]?.caption || '?'} characters`}
          />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Hashtags</label>
            <input
              type="text"
              value={(platformSpecs[activeTab]?.hashtags ?? universalHashtags).join(' ')}
              onChange={e => onPlatformChange(activeTab, platformSpecs[activeTab]?.caption ?? universalCaption, e.target.value.split(/\s+/).filter(Boolean))}
              className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              placeholder="#hashtag1 #hashtag2"
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
