'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, Button, Badge, PageHeader } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  Cog6ToothIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  TrashIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { AdPlatform } from '@/lib/marketing/types';

interface AdAccount {
  id: string;
  platform: string;
  account_name: string;
  platform_account_id: string;
  is_active: boolean;
  scopes: string[];
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const META_SETUP_STEPS = [
  {
    step: 1,
    title: 'Create a Meta Business Account',
    description: 'Visit business.facebook.com and create a Business account if you don\'t have one yet. This is the hub for managing your business assets on Meta platforms.',
    link: 'https://business.facebook.com',
    linkLabel: 'Go to Meta Business Suite',
  },
  {
    step: 2,
    title: 'Create a Meta App',
    description: 'Go to developers.facebook.com, create a new app of type "Business". This app will handle the OAuth flow for connecting your ad account.',
    link: 'https://developers.facebook.com/apps',
    linkLabel: 'Open Meta Developer Portal',
  },
  {
    step: 3,
    title: 'Add the Marketing API Product',
    description: 'In your app dashboard, add the "Marketing API" product. This gives your app access to the Ads Management APIs needed for campaign management.',
  },
  {
    step: 4,
    title: 'Request Required Permissions',
    description: 'Request the following permissions for your app: ads_management, ads_read, and business_management. These are required to create and manage ad campaigns.',
  },
  {
    step: 5,
    title: 'Submit for App Review',
    description: 'Submit your app for review to get Advanced Access to the required permissions. Meta typically reviews within 1-3 business days. You can use the app in development mode while waiting.',
  },
  {
    step: 6,
    title: 'Connect Your Account',
    description: 'Once your app is approved (or in development mode), click the "Connect Meta Ads" button below to authorize SkaleFlow to manage your ad campaigns.',
  },
];

const TIKTOK_SETUP_STEPS = [
  {
    step: 1,
    title: 'Create a TikTok Business Center Account',
    description: 'Visit business.tiktok.com and set up a Business Center account. This is where you\'ll manage your TikTok ad accounts and business assets.',
    link: 'https://business.tiktok.com',
    linkLabel: 'Go to TikTok Business Center',
  },
  {
    step: 2,
    title: 'Apply for Marketing API Access',
    description: 'Go to business-api.tiktok.com and apply for Marketing API access. You\'ll need to provide details about your business and intended API use.',
    link: 'https://business-api.tiktok.com',
    linkLabel: 'Apply for TikTok API Access',
  },
  {
    step: 3,
    title: 'Create an App and Configure Scopes',
    description: 'Once approved, create a new app in the TikTok developer portal. Request the required scopes for ad management, including campaign creation and audience targeting.',
  },
  {
    step: 4,
    title: 'Get Approval',
    description: 'TikTok typically takes 3-5 business days to approve API access applications. You\'ll receive an email notification once your app is approved.',
  },
  {
    step: 5,
    title: 'Connect Your Account',
    description: 'After approval, click the "Connect TikTok Ads" button below to authorize SkaleFlow to manage your TikTok ad campaigns.',
  },
];

export default function AdAccountSettingsPage() {
  const supabase = createClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<'meta' | 'tiktok' | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;
      setOrganizationId(membership.organization_id);

      // Load ad accounts
      try {
        const res = await fetch(`/api/marketing/accounts?organizationId=${membership.organization_id}`);
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        }
      } catch {
        setError('Failed to load ad accounts');
      }
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  function getAccountForPlatform(platform: AdPlatform): AdAccount | null {
    return accounts.find(a => a.platform === platform && a.is_active) || null;
  }

  async function handleConnect(platform: AdPlatform) {
    if (!organizationId) return;
    // Redirect to the platform auth route
    window.location.href = `/api/marketing/${platform}/auth?organizationId=${organizationId}`;
  }

  async function handleDisconnect(accountId: string) {
    if (!confirm('Are you sure you want to disconnect this ad account? Active campaigns will stop syncing.')) return;
    setIsDisconnecting(accountId);

    try {
      const res = await fetch(`/api/marketing/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to disconnect');
      }

      setAccounts(prev => prev.filter(a => a.id !== accountId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDisconnecting(null);
    }
  }

  function isTokenExpiring(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return expiry.getTime() - now.getTime() < sevenDaysMs;
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-stone/10 rounded animate-pulse" />
        <div className="h-64 bg-stone/10 rounded-xl animate-pulse" />
        <div className="h-64 bg-stone/10 rounded-xl animate-pulse" />
      </div>
    );
  }

  const metaAccount = getAccountForPlatform('meta');
  const tiktokAccount = getAccountForPlatform('tiktok');

  function renderPlatformSection(
    platform: AdPlatform,
    platformLabel: string,
    account: AdAccount | null,
    setupSteps: typeof META_SETUP_STEPS
  ) {
    const isExpanded = expandedGuide === platform;
    const tokenExpiring = account ? isTokenExpiring(account.token_expires_at) : false;

    return (
      <Card key={platform}>
        {/* Platform Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={platform} size="lg" />
            <div>
              <h2 className="text-heading-md text-charcoal">{platformLabel} Ads</h2>
              <p className="text-sm text-stone">
                {account
                  ? 'Connected and ready to manage campaigns'
                  : `Connect your ${platformLabel} ad account to create and manage campaigns`
                }
              </p>
            </div>
          </div>

          {account ? (
            <Badge variant="success">
              <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="default">
              <XCircleIcon className="w-3.5 h-3.5 mr-1" />
              Not Connected
            </Badge>
          )}
        </div>

        {/* Connected State */}
        {account && (
          <div className="space-y-3">
            <div className="p-4 bg-cream-warm/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">{account.account_name}</p>
                  <p className="text-xs text-stone">ID: {account.platform_account_id}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-400 font-medium">Active</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-stone">
                <span>
                  Connected {new Date(account.created_at).toLocaleDateString('en-ZA', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {account.token_expires_at && (
                  <span className={tokenExpiring ? 'text-yellow-600 font-medium' : ''}>
                    Token expires {new Date(account.token_expires_at).toLocaleDateString('en-ZA', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {account.scopes && account.scopes.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-stone" />
                  {account.scopes.map(scope => (
                    <span key={scope} className="text-[10px] px-1.5 py-0.5 bg-stone/10 rounded-full text-stone">
                      {scope}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Token Expiry Warning */}
            {tokenExpiring && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gold">Token expiring soon</p>
                  <p className="text-xs text-gold mt-0.5">
                    Reconnect your account to refresh the access token and prevent campaign sync interruption.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              {tokenExpiring && (
                <Button
                  size="sm"
                  onClick={() => handleConnect(platform)}
                >
                  <LinkIcon className="w-4 h-4" />
                  Reconnect
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDisconnect(account.id)}
                disabled={isDisconnecting === account.id}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                {isDisconnecting === account.id ? (
                  'Disconnecting...'
                ) : (
                  <>
                    <TrashIcon className="w-4 h-4" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Not Connected State */}
        {!account && (
          <div className="space-y-4">
            {/* Setup Guide Toggle */}
            <button
              onClick={() => setExpandedGuide(isExpanded ? null : platform)}
              className="w-full flex items-center justify-between p-3 bg-cream-warm/50 rounded-lg hover:bg-cream-warm transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-teal" />
                <span className="text-sm font-medium text-charcoal">
                  Setup Guide: How to connect {platformLabel} Ads
                </span>
              </div>
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4 text-stone" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-stone" />
              )}
            </button>

            {/* Setup Steps */}
            {isExpanded && (
              <div className="pl-4 border-l-2 border-teal/20 space-y-4">
                {setupSteps.map((item) => (
                  <div key={item.step} className="relative">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-bold">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-charcoal">{item.title}</p>
                        <p className="text-xs text-stone mt-1">{item.description}</p>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal font-medium mt-1.5 hover:text-teal-light transition-colors"
                          >
                            {item.linkLabel}
                            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Connect Button */}
            <Button
              onClick={() => handleConnect(platform)}
            >
              <LinkIcon className="w-4 h-4" />
              Connect {platformLabel} Ads
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb + Header */}
      <PageHeader
        title="Ad Account Settings"
        icon={Cog6ToothIcon}
        subtitle="Connect and manage your advertising platform accounts"
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing' },
          { label: 'Settings' },
        ]}
      />

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-400 font-medium underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Meta Ads Section */}
      {renderPlatformSection('meta', 'Meta', metaAccount, META_SETUP_STEPS)}

      {/* TikTok Ads Section */}
      {renderPlatformSection('tiktok', 'TikTok', tiktokAccount, TIKTOK_SETUP_STEPS)}

      {/* Help Note */}
      <Card className="bg-cream-warm/30">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-charcoal">Need help connecting?</p>
            <p className="text-xs text-stone mt-1">
              If you&apos;re having trouble connecting your ad accounts, make sure you have the correct permissions
              and that your business accounts are properly verified. The connection process uses OAuth 2.0 for secure
              authorization without sharing your password.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
