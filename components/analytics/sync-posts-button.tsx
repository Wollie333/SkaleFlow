'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SyncPostsButtonProps {
  onSyncComplete?: () => void;
}

export function SyncPostsButton({ onSyncComplete }: SyncPostsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
      const response = await fetch('/api/social/analytics/sync-platform-posts', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus('success');
        setSyncMessage(data.message || 'Posts synced successfully');
        onSyncComplete?.();

        // Reset status after 3 seconds
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncMessage('');
        }, 3000);
      } else {
        setSyncStatus('error');
        setSyncMessage(data.error || 'Failed to sync posts');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setSyncMessage('Network error - please try again');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={syncStatus === 'success' ? 'default' : 'outline'}
        onClick={handleSync}
        disabled={isSyncing}
        className={cn(
          'gap-1.5',
          syncStatus === 'success' && 'bg-emerald-600 hover:bg-emerald-700',
          syncStatus === 'error' && 'border-red-400 text-red-600 hover:bg-red-50'
        )}
      >
        {syncStatus === 'success' ? (
          <CheckCircleIcon className="w-4 h-4" />
        ) : syncStatus === 'error' ? (
          <ExclamationTriangleIcon className="w-4 h-4" />
        ) : (
          <ArrowPathIcon className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
        )}
        <span className="text-xs sm:text-sm">
          {isSyncing ? 'Syncing...' : syncStatus === 'success' ? 'Synced!' : 'Sync Posts'}
        </span>
      </Button>

      {syncMessage && (
        <span className={cn(
          'text-xs sm:text-sm',
          syncStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
        )}>
          {syncMessage}
        </span>
      )}
    </div>
  );
}
