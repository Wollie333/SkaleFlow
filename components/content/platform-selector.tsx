'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';
import { canPublishToPlatform } from '@/lib/social/formatters';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Connection {
  id: string;
  platform: SocialPlatform;
  platform_username: string | null;
  platform_page_name: string | null;
  platform_page_id: string | null;
  account_type: string;
  is_active: boolean;
}

interface ContentItem {
  media_urls: string[] | null;
}

interface PlatformSelectorProps {
  selectedPlatforms: SocialPlatform[];
  onSelectionChange: (platforms: SocialPlatform[]) => void;
  selectedConnectionIds?: string[];
  onConnectionIdsChange?: (connectionIds: string[]) => void;
  contentItem?: ContentItem;
}

const ALL_PLATFORMS: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

export function PlatformSelector({
  selectedPlatforms,
  onSelectionChange,
  selectedConnectionIds = [],
  onConnectionIdsChange,
  contentItem
}: PlatformSelectorProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<SocialPlatform>>(new Set());

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
    const platformConnections = connections.filter(c => c.platform === platform && c.is_active);

    if (selectedPlatforms.includes(platform)) {
      // Deselect platform and remove all its connections
      onSelectionChange(selectedPlatforms.filter(p => p !== platform));
      if (onConnectionIdsChange) {
        const remainingIds = selectedConnectionIds.filter(
          id => !platformConnections.some(c => c.id === id)
        );
        onConnectionIdsChange(remainingIds);
      }
    } else {
      // Select platform and auto-select all its connections
      onSelectionChange([...selectedPlatforms, platform]);
      if (onConnectionIdsChange) {
        const newIds = platformConnections.map(c => c.id);
        onConnectionIdsChange([...selectedConnectionIds, ...newIds]);
      }
    }
  };

  const toggleConnection = (connectionId: string, platform: SocialPlatform) => {
    if (!onConnectionIdsChange) return;

    const platformConnections = connections.filter(c => c.platform === platform && c.is_active);

    if (selectedConnectionIds.includes(connectionId)) {
      // Deselect this connection
      const newIds = selectedConnectionIds.filter(id => id !== connectionId);
      onConnectionIdsChange(newIds);

      // If no connections left for this platform, deselect the platform
      const remainingPlatformConnections = newIds.filter(
        id => platformConnections.some(c => c.id === id)
      );
      if (remainingPlatformConnections.length === 0) {
        onSelectionChange(selectedPlatforms.filter(p => p !== platform));
      }
    } else {
      // Select this connection
      onConnectionIdsChange([...selectedConnectionIds, connectionId]);

      // Ensure platform is selected
      if (!selectedPlatforms.includes(platform)) {
        onSelectionChange([...selectedPlatforms, platform]);
      }
    }
  };

  const toggleExpanded = (platform: SocialPlatform) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platform)) {
      newExpanded.delete(platform);
    } else {
      newExpanded.add(platform);
    }
    setExpandedPlatforms(newExpanded);
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

  const getConnectionLabel = (conn: Connection) => {
    if (conn.account_type === 'page') {
      return conn.platform_page_name || conn.platform_page_id || 'Page';
    }
    return conn.platform_username || 'Profile';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-charcoal">
        Publish to
      </label>

      <div className="space-y-2">
        {ALL_PLATFORMS.map(platform => {
          const config = PLATFORM_CONFIG[platform];
          const platformConnections = connections.filter(c => c.platform === platform && c.is_active);
          const isConnected = platformConnections.length > 0;
          const isSelected = selectedPlatforms.includes(platform);
          const isExpanded = expandedPlatforms.has(platform);
          const publishCheck = contentItem
            ? canPublishToPlatform(platform, contentItem)
            : { canPublish: true };

          const selectedCount = platformConnections.filter(c => selectedConnectionIds.includes(c.id)).length;
          const hasMultipleConnections = platformConnections.length > 1;

          return (
            <div key={platform} className="space-y-1">
              {/* Main platform button */}
              <div className="flex items-center gap-2">
                <button
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
                    'flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                    isSelected && isConnected
                      ? 'border-teal bg-teal/10 text-teal'
                      : isConnected
                        ? 'border-stone/20 bg-cream-warm text-charcoal hover:border-teal/50'
                        : 'border-stone/10 bg-stone/5 text-stone/40 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isConnected ? 'bg-teal' : 'bg-stone/20'
                      )}
                    />
                    {config.name}
                    {isSelected && hasMultipleConnections && onConnectionIdsChange && (
                      <span className="text-xs opacity-70">
                        ({selectedCount}/{platformConnections.length})
                      </span>
                    )}
                  </div>
                  {hasMultipleConnections && isConnected && onConnectionIdsChange && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(platform);
                      }}
                      className="p-1 hover:bg-teal/10 rounded"
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </button>
              </div>

              {/* Connection selector dropdown */}
              {isExpanded && hasMultipleConnections && isConnected && onConnectionIdsChange && (
                <div className="ml-6 space-y-1 p-2 bg-cream-warm/50 rounded-lg border border-stone/10">
                  {platformConnections.map(conn => (
                    <label
                      key={conn.id}
                      className="flex items-center gap-2 p-2 hover:bg-cream-warm rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedConnectionIds.includes(conn.id)}
                        onChange={() => toggleConnection(conn.id, platform)}
                        className="h-4 w-4 rounded border-stone/30 text-teal focus:ring-teal"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-charcoal">{getConnectionLabel(conn)}</p>
                        {conn.account_type === 'page' && conn.platform_page_id && (
                          <p className="text-xs text-stone">Page ID: {conn.platform_page_id}</p>
                        )}
                      </div>
                      {selectedConnectionIds.includes(conn.id) && (
                        <CheckIcon className="w-4 h-4 text-teal" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
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
