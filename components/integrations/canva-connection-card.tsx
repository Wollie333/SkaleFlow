'use client';

import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import {
  LinkIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface CanvaConnectionData {
  id: string;
  canva_user_id: string | null;
  is_active: boolean;
  connected_at: string;
  token_expires_at: string | null;
}

interface CanvaConnectionCardProps {
  connection: CanvaConnectionData | null;
  onDisconnect: () => Promise<void>;
  onSyncBrand: () => Promise<void>;
}

export function CanvaConnectionCard({ connection, onDisconnect, onSyncBrand }: CanvaConnectionCardProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const isExpired = connection?.token_expires_at
    ? new Date(connection.token_expires_at) < new Date()
    : false;

  const handleConnect = () => {
    window.location.href = '/api/integrations/canva/auth';
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    if (!confirm('Disconnect Canva? You can reconnect anytime.')) return;
    setIsDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncBrand = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await onSyncBrand();
      setSyncMessage('Brand assets synced to Canva!');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Sync failed');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 bg-cream-warm rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-stone/10">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.5 9.5C5.5 7.01 7.51 5 10 5h4c2.49 0 4.5 2.01 4.5 4.5 0 1.41-.65 2.67-1.67 3.5H7.17C6.15 12.17 5.5 10.91 5.5 9.5z" fill="#7D2AE8"/>
              <path d="M7.17 13c-.63.56-1.17 1.24-1.17 2.5C6 17.43 7.57 19 9.5 19c1.1 0 2.07-.51 2.7-1.3" fill="#FF6F61"/>
              <path d="M12.2 17.7c.63.79 1.6 1.3 2.7 1.3 1.93 0 3.5-1.57 3.5-3.5 0-1.26-.54-1.94-1.17-2.5" fill="#00C4CC"/>
              <path d="M12 5V2M12 22v-3M2 12h3M19 12h3" stroke="#7D2AE8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-charcoal">Canva</h3>
            {connection ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-stone">
                  {connection.canva_user_id ? `User: ${connection.canva_user_id}` : 'Connected'}
                </p>
                {isExpired && (
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" title="Token expired" />
                )}
              </div>
            ) : (
              <p className="text-sm text-stone">Create & import designs from Canva</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connection ? (
            <>
              <Badge variant={isExpired ? 'conversion' : 'awareness'}>
                {isExpired ? 'Expired' : 'Connected'}
              </Badge>
              {isExpired && (
                <Button size="sm" onClick={handleConnect}>
                  Reconnect
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Sync brand button — only when connected and not expired */}
      {connection && !isExpired && (
        <div className="flex items-center gap-3 pt-1 border-t border-stone/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSyncBrand}
            disabled={isSyncing}
            className="text-teal hover:bg-teal/10"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Brand Assets'}
          </Button>
          <span className="text-xs text-stone">Push logo + color swatches to Canva uploads</span>
          {syncMessage && (
            <span className={`text-xs ${syncMessage.includes('failed') || syncMessage.includes('Failed') ? 'text-red-500' : 'text-teal'}`}>
              {syncMessage}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
