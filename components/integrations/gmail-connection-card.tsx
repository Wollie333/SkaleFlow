'use client';

import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { LinkIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface GmailConnection {
  id: string;
  email_address: string;
  is_active: boolean;
  connected_at: string;
  token_expires_at: string | null;
}

interface GmailConnectionCardProps {
  connection: GmailConnection | null;
  onDisconnect: () => Promise<void>;
}

export function GmailConnectionCard({ connection, onDisconnect }: GmailConnectionCardProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isExpired = connection?.token_expires_at
    ? new Date(connection.token_expires_at) < new Date()
    : false;

  const handleConnect = () => {
    window.location.href = '/api/integrations/gmail/auth';
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    setIsDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-stone/10">
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-charcoal">Gmail</h3>
          {connection ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-stone">
                {connection.email_address}
              </p>
              {isExpired && (
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" title="Token expired" />
              )}
            </div>
          ) : (
            <p className="text-sm text-stone">Send and sync emails with media contacts</p>
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
