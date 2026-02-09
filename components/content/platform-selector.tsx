'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';
import { canPublishToPlatform } from '@/lib/social/formatters';

interface Connection {
  id: string;
  platform: SocialPlatform;
  platform_username: string | null;
  platform_page_name: string | null;
  is_active: boolean;
}

interface ContentItem {
  media_urls: string[] | null;
}

interface PlatformSelectorProps {
  selectedPlatforms: SocialPlatform[];
  onSelectionChange: (platforms: SocialPlatform[]) => void;
  contentItem?: ContentItem;
}

const ALL_PLATFORMS: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

export function PlatformSelector({ selectedPlatforms, onSelectionChange, contentItem }: PlatformSelectorProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConnections() {
      try {
        const res = await fetch('/api/integrations/social');
        const data = await res.json();
        setConnections(data.connections || []);
      } catch {
        setConnections([]);
      }
      setLoading(false);
    }
    loadConnections();
  }, []);

  const togglePlatform = (platform: SocialPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      onSelectionChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onSelectionChange([...selectedPlatforms, platform]);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 w-24 bg-stone/10 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const connectedPlatforms = new Set(connections.filter(c => c.is_active).map(c => c.platform));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-charcoal">
        Publish to
      </label>
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map(platform => {
          const config = PLATFORM_CONFIG[platform];
          const isConnected = connectedPlatforms.has(platform);
          const isSelected = selectedPlatforms.includes(platform);
          const publishCheck = contentItem
            ? canPublishToPlatform(platform, contentItem)
            : { canPublish: true };

          return (
            <button
              key={platform}
              type="button"
              disabled={!isConnected || !publishCheck.canPublish}
              onClick={() => togglePlatform(platform)}
              title={
                !isConnected
                  ? `Connect ${config.name} in Settings`
                  : !publishCheck.canPublish
                    ? publishCheck.reason
                    : config.name
              }
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                isSelected && isConnected
                  ? 'border-teal bg-teal/10 text-teal'
                  : isConnected
                    ? 'border-stone/20 bg-white text-charcoal hover:border-teal/50'
                    : 'border-stone/10 bg-stone/5 text-stone/40 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-teal' : 'bg-stone/20'
                )}
              />
              {config.name}
            </button>
          );
        })}
      </div>
      {connectedPlatforms.size === 0 && (
        <p className="text-xs text-stone">
          No social accounts connected.{' '}
          <a href="/settings" className="text-teal hover:underline">
            Connect in Settings
          </a>
        </p>
      )}
    </div>
  );
}
