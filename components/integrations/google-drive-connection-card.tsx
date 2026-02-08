'use client';

import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { LinkIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DriveConnection {
  id: string;
  drive_email: string | null;
  is_active: boolean;
  connected_at: string;
  token_expires_at: string | null;
}

interface GoogleDriveConnectionCardProps {
  connection: DriveConnection | null;
  onDisconnect: (connectionId: string) => Promise<void>;
}

export function GoogleDriveConnectionCard({ connection, onDisconnect }: GoogleDriveConnectionCardProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isExpired = connection?.token_expires_at
    ? new Date(connection.token_expires_at) < new Date()
    : false;

  const handleConnect = () => {
    window.location.href = '/api/integrations/google-drive/auth';
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    if (!confirm('Disconnect Google Drive? You will no longer be able to import files from Drive.')) return;
    setIsDisconnecting(true);
    try {
      await onDisconnect(connection.id);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-stone/10">
          <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
            <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L0.65 49.55c-.75 1.35-1.15 2.85-1.15 4.45h27.5z" fill="#00AC47"/>
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3L79 70.05 86.1 58c.8-1.4 1.2-2.95 1.2-4.5H59.8l6.35 11.2z" fill="#EA4335"/>
            <path d="M43.65 25L57.4 1.2c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D"/>
            <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2H69.1c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC"/>
            <path d="M73.4 26.5L60.1 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-charcoal">Google Drive</h3>
          {connection ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-stone">
                {connection.drive_email || 'Connected'}
              </p>
              {isExpired && (
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" title="Token expired" />
              )}
            </div>
          ) : (
            <p className="text-sm text-stone">Import files from Google Drive</p>
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
  );
}
