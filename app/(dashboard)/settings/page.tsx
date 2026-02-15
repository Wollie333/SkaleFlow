'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Input, Badge, PageHeader } from '@/components/ui';
import { ConfirmDialog, AlertDialog } from '@/components/ui/dialog';
import { CheckCircleIcon, SparklesIcon, LinkIcon, XMarkIcon, ChevronUpDownIcon, ShieldCheckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { getApprovalSettings, DEFAULT_APPROVAL_SETTINGS, type ApprovalSettings } from '@/config/approval-settings';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { SocialConnectionCard } from '@/components/integrations/social-connection-card';
import type { SocialConnectionRow } from '@/components/integrations/social-connection-card';
import { PageSelectionModal } from '@/components/integrations/page-selection-modal';
import { GoogleDriveConnectionCard } from '@/components/integrations/google-drive-connection-card';
import { CanvaConnectionCard } from '@/components/integrations/canva-connection-card';
import { GmailConnectionCard } from '@/components/integrations/gmail-connection-card';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import type { SocialPlatform, Json } from '@/types/database';
import { AiBetaTab } from '@/components/settings/ai-beta-tab';

interface Organization {
  id: string;
  name: string;
  slug: string;
  brand_engine_enabled: boolean;
  content_engine_enabled: boolean;
}

interface Subscription {
  id: string;
  status: string;
  current_period_end: string | null;
  tier: {
    name: string;
    price_monthly: number;
    features: Record<string, unknown>;
  };
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

type SettingsTab = 'profile' | 'plan' | 'integrations' | 'workflow' | 'ai-beta';

export default function SettingsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);
  const [socialConnections, setSocialConnections] = useState<SocialConnectionRow[]>([]);
  const [socialStatus, setSocialStatus] = useState<string | null>(null);
  const [pageSelectPlatform, setPageSelectPlatform] = useState<SocialPlatform | null>(null);
  const [driveConnection, setDriveConnection] = useState<{ id: string; drive_email: string | null; is_active: boolean; connected_at: string; token_expires_at: string | null } | null>(null);
  const [driveStatus, setDriveStatus] = useState<string | null>(null);
  const [canvaConnection, setCanvaConnection] = useState<{ id: string; canva_user_id: string | null; is_active: boolean; connected_at: string; token_expires_at: string | null } | null>(null);
  const [canvaStatus, setCanvaStatus] = useState<string | null>(null);
  const [gmailConnection, setGmailConnection] = useState<{ id: string; email_address: string; is_active: boolean; connected_at: string; token_expires_at: string | null } | null>(null);
  const [gmailStatus, setGmailStatus] = useState<string | null>(null);
  const [gmailErrorMessage, setGmailErrorMessage] = useState<string | null>(null);
  const [orgRole, setOrgRole] = useState<string>('');
  const [aiBetaEnabled, setAiBetaEnabled] = useState(false);
  const [googleCalendars, setGoogleCalendars] = useState<{ id: string; summary: string; primary: boolean }[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [approvalSettings, setApprovalSettings] = useState<ApprovalSettings>(DEFAULT_APPROVAL_SETTINGS);
  const [isSavingApproval, setIsSavingApproval] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    orgName: '',
  });
  const [disconnectModal, setDisconnectModal] = useState<{
    isOpen: boolean;
    type: 'social' | 'google' | 'drive';
    connectionId?: string;
    platformName?: string;
  }>({
    isOpen: false,
    type: 'social',
  });
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const loadData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get user profile
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url, ai_beta_enabled')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(userData);
        setUserRole(userData.role || '');
        setAiBetaEnabled(userData.ai_beta_enabled === true);
        setFormData(prev => ({ ...prev, fullName: userData.full_name || '' }));

        // Check Google Calendar connection (admin only)
        if (userData.role === 'super_admin') {
          const { data: googleIntegration } = await supabase
            .from('google_integrations')
            .select('id')
            .eq('user_id', authUser.id)
            .single();
          setGoogleConnected(!!googleIntegration);
        }
      }

      // Get organization
      const { data: membership } = await supabase
        .from('org_members')
        .select(`
          organization_id,
          organizations(*)
        `)
        .eq('user_id', authUser.id)
        .single();

      if (membership?.organizations) {
        const org = membership.organizations as unknown as Organization;
        setOrganization(org);
        setFormData(prev => ({ ...prev, orgName: org.name }));

        // Load approval settings from org settings
        const { data: orgFull } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', org.id)
          .single();
        if (orgFull?.settings) {
          setApprovalSettings(getApprovalSettings(orgFull.settings as Record<string, unknown>));
        }

        // Get org member role
        const { data: memberRole } = await supabase
          .from('org_members')
          .select('role')
          .eq('user_id', authUser.id)
          .eq('organization_id', org.id)
          .single();
        if (memberRole) setOrgRole(memberRole.role);

        // Get subscription (may not exist)
        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .select(`
            *,
            tier:subscription_tiers!tier_id(name, price_monthly, features)
          `)
          .eq('organization_id', org.id)
          .maybeSingle();

        if (sub && !subError) {
          setSubscription(sub as unknown as Subscription);
        }

        // Load social media connections
        const { data: connections } = await supabase
          .from('social_media_connections')
          .select('id, platform, platform_username, platform_page_name, platform_page_id, account_type, is_active, connected_at, token_expires_at, metadata')
          .eq('organization_id', org.id);

        if (connections) {
          // Strip tokens from metadata before storing in state (only keep pages array structure)
          const safeConnections = connections.map(c => {
            const meta = c.metadata as Record<string, unknown> | null;
            const pages = (meta?.pages as Array<Record<string, unknown>>) || [];
            return {
              ...c,
              metadata: pages.length > 0
                ? { pages: pages.map(p => ({ id: p.id, name: p.name, category: p.category })) }
                : null,
            };
          });
          setSocialConnections(safeConnections as SocialConnectionRow[]);
        }

        // Load Google Drive connection (table may not exist yet)
        try {
          const { data: driveConn } = await supabase
            .from('google_drive_connections')
            .select('id, drive_email, is_active, connected_at, token_expires_at')
            .eq('organization_id', org.id)
            .eq('is_active', true)
            .maybeSingle();

          if (driveConn) {
            setDriveConnection(driveConn);
          }
        } catch {
          // Table doesn't exist yet — skip silently
        }

        // Load Canva connection
        try {
          const { data: canvaConn } = await supabase
            .from('canva_connections')
            .select('id, canva_user_id, is_active, connected_at, token_expires_at')
            .eq('organization_id', org.id)
            .eq('is_active', true)
            .maybeSingle();

          if (canvaConn) {
            setCanvaConnection(canvaConn);
          }
        } catch {
          // Table doesn't exist yet — skip silently
        }

        // Load Gmail connection for current user (per-user, not per-org)
        try {
          const { data: gmailConn } = await supabase
            .from('authority_email_connections')
            .select('id, email_address, is_active, connected_at, token_expires_at')
            .eq('user_id', authUser.id)
            .eq('provider', 'gmail')
            .eq('is_active', true)
            .maybeSingle();

          if (gmailConn) {
            setGmailConnection(gmailConn);
          }
        } catch {
          // Table doesn't exist yet — skip silently
        }
      }

      setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Sync tab from URL
    const tabParam = searchParams.get('tab') as SettingsTab | null;
    if (tabParam && ['profile', 'plan', 'integrations', 'workflow', 'ai-beta'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // Check for Google OAuth callback status
    const googleParam = searchParams.get('google');
    if (googleParam) {
      setGoogleStatus(googleParam);
      if (googleParam === 'connected') setGoogleConnected(true);
    }

    // Check for social OAuth callback status
    const socialParam = searchParams.get('social');
    if (socialParam) {
      setSocialStatus(socialParam);
      // Auto-switch to integrations tab and open page selector
      setActiveTab('integrations');
      if (socialParam === 'select') {
        const platformParam = searchParams.get('platform') as SocialPlatform | null;
        if (platformParam) {
          setPageSelectPlatform(platformParam);
        }
      }
    }

    // Check for Google Drive callback status
    const gdriveParam = searchParams.get('gdrive');
    if (gdriveParam) {
      setDriveStatus(gdriveParam);
      setActiveTab('integrations');
    }

    // Check for Canva OAuth callback status
    const canvaParam = searchParams.get('canva');
    if (canvaParam) {
      setCanvaStatus(canvaParam);
      setActiveTab('integrations');
    }

    // Check for Gmail callback status
    const gmailParam = searchParams.get('gmail');
    if (gmailParam) {
      setGmailStatus(gmailParam);
      const gmailMsg = searchParams.get('message');
      if (gmailMsg) setGmailErrorMessage(gmailMsg);
      setActiveTab('integrations');
    }

    if (googleParam) {
      setActiveTab('integrations');
    }

    // Strip OAuth callback params from URL to prevent modal re-opening on refresh
    if (socialParam || googleParam || gdriveParam || canvaParam || gmailParam) {
      window.history.replaceState({}, '', '/settings');
    }
  }, [supabase, searchParams]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error: userError } = await supabase
      .from('users')
      .update({ full_name: formData.fullName })
      .eq('id', user.id);

    if (organization) {
      await supabase
        .from('organizations')
        .update({ name: formData.orgName })
        .eq('id', organization.id);
    }

    if (!userError) {
      setUser(prev => prev ? { ...prev, full_name: formData.fullName } : null);
      setOrganization(prev => prev ? { ...prev, name: formData.orgName } : null);
    }

    setIsSaving(false);
  };

  const handleUpgrade = async () => {
    // For MVP, redirect to checkout with the Growth plan
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode: 'growth-monthly' }), // Set your plan code
      });

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Checkout Error',
          message: 'Failed to initialize checkout. Please try again or contact support.',
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Checkout Error',
        message: 'An unexpected error occurred. Please try again or contact support.',
      });
    }
  };

  const handleDisconnectGoogle = () => {
    setDisconnectModal({
      isOpen: true,
      type: 'google',
      platformName: 'Google Calendar',
    });
  };

  const handleDisconnectSocial = async (connectionId: string) => {
    const conn = socialConnections.find(c => c.id === connectionId);
    const platformName = conn?.platform_page_name || conn?.platform_username || conn?.platform || 'this account';
    setDisconnectModal({
      isOpen: true,
      type: 'social',
      connectionId,
      platformName: `${conn?.platform ? conn.platform.charAt(0).toUpperCase() + conn.platform.slice(1) : ''} (${platformName})`,
    });
  };

  const handleDisconnectDrive = async (connectionId: string) => {
    const driveName = driveConnection?.drive_email || 'Google Drive';
    setDisconnectModal({
      isOpen: true,
      type: 'drive',
      connectionId,
      platformName: driveName,
    });
  };

  const handleDisconnectCanva = async () => {
    try {
      const res = await fetch('/api/integrations/canva/disconnect', { method: 'POST' });
      if (!res.ok) {
        setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to disconnect Canva. Please try again.' });
      } else {
        setCanvaConnection(null);
        setCanvaStatus(null);
      }
    } catch {
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to disconnect Canva.' });
    }
  };

  const handleSyncCanvaBrand = async () => {
    const res = await fetch('/api/canva/sync-brand', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Brand sync failed');
  };

  const handleDisconnectGmail = async () => {
    try {
      const res = await fetch('/api/integrations/gmail/disconnect', { method: 'POST' });
      if (!res.ok) {
        setAlertDialog({
          isOpen: true,
          title: 'Error',
          message: 'Failed to disconnect Gmail. Please try again.',
        });
      } else {
        setGmailConnection(null);
        setGmailStatus(null);
      }
    } catch {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const confirmDisconnect = async () => {
    const { type, connectionId } = disconnectModal;
    setIsDisconnecting(true);

    try {
      if (type === 'google') {
        if (!user) return;
        const { error } = await supabase
          .from('google_integrations')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: 'Failed to disconnect Google Calendar. Please try again.',
          });
        } else {
          setGoogleConnected(false);
          setGoogleStatus(null);
          await loadData();
        }
      } else if (type === 'social' && connectionId) {
        const conn = socialConnections.find(c => c.id === connectionId);
        const res = await fetch(`/api/integrations/social/connections/${connectionId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: 'Failed to disconnect account. Please try again.',
          });
        } else {
          setSocialConnections(prev => {
            let updated = prev.filter(c => c.id !== connectionId);
            // If disconnecting a profile, also remove its page connections
            if (conn?.account_type === 'profile') {
              updated = updated.filter(c => !(c.platform === conn.platform && c.account_type === 'page'));
            }
            return updated;
          });
          await loadData();
        }
      } else if (type === 'drive' && connectionId) {
        const { error } = await supabase
          .from('google_drive_connections')
          .update({ is_active: false })
          .eq('id', connectionId);

        if (error) {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: 'Failed to disconnect Google Drive. Please try again.',
          });
        } else {
          setDriveConnection(null);
          setDriveStatus(null);
          await loadData();
        }
      }
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsDisconnecting(false);
      setDisconnectModal({ isOpen: false, type: 'social' });
    }
  };

  const handleSaveApproval = async (settings: ApprovalSettings) => {
    if (!organization) return;
    setIsSavingApproval(true);

    try {
      // Get current org settings, then merge
      const { data: orgData } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single();

      const currentSettings = (orgData?.settings || {}) as Record<string, unknown>;
      const updatedSettings = { ...currentSettings, approval_settings: settings } as unknown as Record<string, Json>;

      await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', organization.id);

      setApprovalSettings(settings);
    } catch (error) {
      console.error('Failed to save approval settings:', error);
    }

    setIsSavingApproval(false);
  };

  const fetchCalendars = async () => {
    setIsLoadingCalendars(true);
    try {
      const res = await fetch('/api/auth/google/calendars');
      if (res.ok) {
        const data = await res.json();
        setGoogleCalendars(data.calendars || []);
        setSelectedCalendarId(data.selectedCalendarId || 'primary');
      }
    } catch (err) {
      console.error('Failed to fetch calendars:', err);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleCalendarChange = async (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    try {
      await fetch('/api/auth/google/calendars', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId }),
      });
    } catch (err) {
      console.error('Failed to save calendar selection:', err);
    }
  };

  // Fetch calendars when Google is connected
  useEffect(() => {
    if (googleConnected && userRole === 'super_admin') {
      fetchCalendars();
    }
  }, [googleConnected, userRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  // Build visible tabs based on user role
  const isOwnerOrAdmin = ['owner', 'admin'].includes(orgRole);
  const showIntegrations = true; // All users can see integrations (Gmail is per-user)
  const showWorkflow = isOwnerOrAdmin && !!organization?.content_engine_enabled;

  const visibleTabs: { key: SettingsTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'plan', label: 'Plan' },
    ...(showIntegrations ? [{ key: 'integrations' as SettingsTab, label: 'Integrations' }] : []),
    ...(showWorkflow ? [{ key: 'workflow' as SettingsTab, label: 'Workflow' }] : []),
    ...(aiBetaEnabled ? [{ key: 'ai-beta' as SettingsTab, label: 'AI Beta' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <PageHeader
          icon={Cog6ToothIcon}
          title="Settings"
          subtitle="Manage your account and preferences"
        />
      </div>

      {/* Tab Bar */}
      <div className="mb-4 flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {visibleTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.key
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-3xl">
            <Card>
              <h2 className="text-heading-md text-charcoal mb-6">Profile</h2>

              <div className="space-y-6">
                {user && (
                  <AvatarUpload
                    userId={user.id}
                    currentAvatarUrl={user.avatar_url}
                    onUploadComplete={(url) => setUser(prev => prev ? { ...prev, avatar_url: url } : null)}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Email
                  </label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-cream-warm"
                  />
                  <p className="text-xs text-stone mt-1">Email cannot be changed</p>
                </div>

                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Your full name"
                />

                <Input
                  label="Organization Name"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  placeholder="Your company name"
                />

                <Button onClick={handleSaveProfile} isLoading={isSaving}>
                  Save Changes
                </Button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <h2 className="text-heading-md text-red-600 mb-4">Danger Zone</h2>
              <p className="text-stone mb-4">
                Contact support to cancel your subscription or delete your account.
              </p>
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={() => window.location.href = 'mailto:support@manamarketing.co.za'}
              >
                Contact Support
              </Button>
            </Card>
          </div>
        )}

        {/* ── Plan Tab ── */}
        {activeTab === 'plan' && (
          <div className="space-y-6 max-w-3xl">
            {/* Subscription Section */}
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-heading-md text-charcoal">Subscription</h2>
                  <p className="text-stone text-sm mt-1">
                    Manage your billing and plan
                  </p>
                </div>
                {subscription && (
                  <Badge variant={subscription.status === 'active' ? 'awareness' : 'conversion'}>
                    {subscription.status}
                  </Badge>
                )}
              </div>

              {subscription ? (
                <div className="space-y-4">
                  <div className="p-4 bg-cream-warm rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <SparklesIcon className="w-5 h-5 text-teal" />
                      <span className="font-semibold text-charcoal">
                        {subscription.tier.name}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-charcoal">
                      R{subscription.tier.price_monthly.toLocaleString()}
                      <span className="text-sm font-normal text-stone">/month</span>
                    </p>
                    {subscription.current_period_end && (
                      <p className="text-sm text-stone mt-2">
                        Next billing date: {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-charcoal">Plan Features</h3>
                    <ul className="space-y-2">
                      {[
                        'Brand Engine (10-phase AI brand strategy)',
                        'Content Engine with AI generation & scheduling',
                        'Authority Engine (PR pipeline & newsroom)',
                        'Social media publishing (LinkedIn, Facebook, Instagram, X, TikTok)',
                        'Campaign-based content calendars',
                        'Content approval workflow',
                        'Brand playbook export',
                        'Credit system & billing management',
                        'Google Drive & Calendar integrations',
                        'Email support',
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-stone">
                          <CheckCircleIcon className="w-4 h-4 text-teal" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <SparklesIcon className="w-12 h-12 mx-auto text-stone/30 mb-4" />
                  <h3 className="text-heading-md text-charcoal mb-2">No Active Subscription</h3>
                  <p className="text-stone mb-6">
                    Subscribe to unlock the full Brand Engine and Content Engine.
                  </p>
                  <Button onClick={handleUpgrade}>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </Button>
                </div>
              )}
            </Card>

            {/* Feature Access */}
            <Card>
              <h2 className="text-heading-md text-charcoal mb-6">Features</h2>

              <div className="space-y-3">
                {/* SkaleFlow Engines */}
                <p className="text-xs font-semibold text-teal-dark uppercase tracking-wider px-1">SkaleFlow Engines</p>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Brand Engine</h3>
                    <p className="text-sm text-stone">10-phase AI-guided brand strategy system</p>
                  </div>
                  <Badge variant={organization?.brand_engine_enabled ? 'awareness' : 'conversion'}>
                    {organization?.brand_engine_enabled ? 'Enabled' : 'Locked'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Content Engine</h3>
                    <p className="text-sm text-stone">AI content generation, calendar & publishing</p>
                  </div>
                  <Badge variant={organization?.content_engine_enabled ? 'awareness' : 'conversion'}>
                    {organization?.content_engine_enabled ? 'Enabled' : 'Locked'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Authority Engine</h3>
                    <p className="text-sm text-stone">PR pipeline, media contacts & public newsroom</p>
                  </div>
                  <Badge variant={(isOwnerOrAdmin || userRole === 'super_admin') ? 'awareness' : 'conversion'}>
                    {(isOwnerOrAdmin || userRole === 'super_admin') ? 'Enabled' : 'Locked'}
                  </Badge>
                </div>

                {/* Content & Publishing */}
                <p className="text-xs font-semibold text-teal-dark uppercase tracking-wider px-1 mt-4">Content & Publishing</p>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Content Calendar</h3>
                    <p className="text-sm text-stone">Campaign-based scheduling with conflict prevention</p>
                  </div>
                  <Badge variant="awareness">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Social Media Publishing</h3>
                    <p className="text-sm text-stone">Direct publishing to LinkedIn, Facebook, Instagram, X & TikTok</p>
                  </div>
                  <Badge variant="awareness">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Content Approval Workflow</h3>
                    <p className="text-sm text-stone">Role-based review and approval for content</p>
                  </div>
                  <Badge variant="awareness">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Brand Playbook</h3>
                    <p className="text-sm text-stone">Exportable brand guide styled with your identity</p>
                  </div>
                  <Badge variant="awareness">Enabled</Badge>
                </div>

                {/* AI & Credits */}
                <p className="text-xs font-semibold text-teal-dark uppercase tracking-wider px-1 mt-4">AI & Credits</p>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">AI Content Generation</h3>
                    <p className="text-sm text-stone">Queue-based batch generation with model selection</p>
                  </div>
                  <Badge variant="awareness">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Credit System & Billing</h3>
                    <p className="text-sm text-stone">Monthly credits, top-up packs & invoice management</p>
                  </div>
                  <Badge variant="awareness">Enabled</Badge>
                </div>

                {/* Integrations */}
                <p className="text-xs font-semibold text-teal-dark uppercase tracking-wider px-1 mt-4">Integrations</p>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Google Drive</h3>
                    <p className="text-sm text-stone">Import creative assets directly into content</p>
                  </div>
                  <Badge variant="awareness">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Google Calendar</h3>
                    <p className="text-sm text-stone">Meeting booking with applicants</p>
                  </div>
                  <Badge variant="awareness">Enabled</Badge>
                </div>

                {/* Coming Soon */}
                <p className="text-xs font-semibold text-teal-dark uppercase tracking-wider px-1 mt-4">Coming Soon</p>

                <div className="flex items-center justify-between p-4 bg-stone/5 rounded-xl opacity-60">
                  <div>
                    <h3 className="font-medium text-charcoal">Social Inbox</h3>
                    <p className="text-sm text-stone">Unified inbox for comments, DMs & mentions</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone bg-stone/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-stone/5 rounded-xl opacity-60">
                  <div>
                    <h3 className="font-medium text-charcoal">Social Listening</h3>
                    <p className="text-sm text-stone">Brand mentions, trends & competitive reports</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone bg-stone/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-stone/5 rounded-xl opacity-60">
                  <div>
                    <h3 className="font-medium text-charcoal">Social Analytics</h3>
                    <p className="text-sm text-stone">Post performance, audience insights & benchmarks</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone bg-stone/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-stone/5 rounded-xl opacity-60">
                  <div>
                    <h3 className="font-medium text-charcoal">Media Library</h3>
                    <p className="text-sm text-stone">Hashtag vault, saved replies & competitor tracking</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone bg-stone/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-stone/5 rounded-xl opacity-60">
                  <div>
                    <h3 className="font-medium text-charcoal">Marketing Ads</h3>
                    <p className="text-sm text-stone">Ad campaigns, audiences & creative library</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone bg-stone/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-stone/5 rounded-xl opacity-60">
                  <div>
                    <h3 className="font-medium text-charcoal">Sales Pipeline</h3>
                    <p className="text-sm text-stone">CRM pipeline with automation workflows</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone bg-stone/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
              </div>

              {!organization?.content_engine_enabled && (
                <p className="text-sm text-stone mt-4">
                  Complete all Brand Engine phases to unlock the Content Engine.
                </p>
              )}
            </Card>
          </div>
        )}

        {/* ── Integrations Tab ── */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* Social Media Accounts (org owners/admins) */}
            {isOwnerOrAdmin && (
              <Card>
                <h2 className="text-heading-md text-charcoal mb-2">Social Media Accounts</h2>
                <p className="text-stone text-sm mb-6">
                  Connect your social accounts to publish content directly from SkaleFlow.
                </p>

                {socialStatus === 'connected' && (
                  <div className="mb-4 p-3 bg-teal/10 border border-teal/20 rounded-lg text-sm text-teal font-medium">
                    Social account connected successfully!
                  </div>
                )}
                {socialStatus === 'select' && (
                  <div className="mb-4 p-3 bg-teal/10 border border-teal/20 rounded-lg text-sm text-teal font-medium">
                    Account connected! Select which pages to connect below.
                  </div>
                )}
                {socialStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    Failed to connect social account. Please try again.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'] as SocialPlatform[]).map(platform => (
                    <SocialConnectionCard
                      key={platform}
                      platform={platform}
                      connections={socialConnections.filter(c => c.platform === platform)}
                      onDisconnect={handleDisconnectSocial}
                      onManagePages={(p) => setPageSelectPlatform(p)}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Google Drive Integration (org owners/admins) */}
            {isOwnerOrAdmin && (
              <Card>
                <h2 className="text-heading-md text-charcoal mb-2">Google Drive</h2>
                <p className="text-stone text-sm mb-6">
                  Connect Google Drive to import creative assets directly into your content.
                </p>

                {driveStatus === 'connected' && (
                  <div className="mb-4 p-3 bg-teal/10 border border-teal/20 rounded-lg text-sm text-teal font-medium">
                    Google Drive connected successfully!
                  </div>
                )}
                {driveStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    Failed to connect Google Drive. Please try again.
                  </div>
                )}

                <GoogleDriveConnectionCard
                  connection={driveConnection}
                  onDisconnect={handleDisconnectDrive}
                />
              </Card>
            )}

            {/* Canva Integration (owner/admin only) */}
            {['owner', 'admin'].includes(orgRole) && (
              <Card>
                <h2 className="text-heading-md text-charcoal mb-2">Canva</h2>
                <p className="text-stone text-sm mb-6">
                  Connect Canva to create and import designs directly from your content editor.
                </p>

                {canvaStatus === 'connected' && (
                  <div className="mb-4 p-3 bg-teal/10 border border-teal/20 rounded-lg text-sm text-teal font-medium">
                    Canva connected successfully!
                  </div>
                )}
                {canvaStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    Failed to connect Canva. {searchParams.get('message') || 'Please try again.'}
                  </div>
                )}

                <CanvaConnectionCard
                  connection={canvaConnection}
                  onDisconnect={handleDisconnectCanva}
                  onSyncBrand={handleSyncCanvaBrand}
                />
              </Card>
            )}

            {/* Gmail Integration (all team members — per-user connection) */}
            <Card>
              <h2 className="text-heading-md text-charcoal mb-2">Email Integration</h2>
              <p className="text-stone text-sm mb-6">
                Connect your Gmail to send and sync emails with media contacts in the Authority Engine.
              </p>

              {gmailStatus === 'connected' && (
                <div className="mb-4 p-3 bg-teal/10 border border-teal/20 rounded-lg text-sm text-teal font-medium">
                  Gmail connected successfully!
                </div>
              )}
              {gmailStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  Failed to connect Gmail. {gmailErrorMessage && <span className="block mt-1 text-xs text-red-500">{gmailErrorMessage}</span>}
                </div>
              )}

              <GmailConnectionCard
                connection={gmailConnection}
                onDisconnect={handleDisconnectGmail}
              />
            </Card>

            {/* Google Calendar Integration (super_admin only) */}
            {userRole === 'super_admin' && (
              <Card>
                <h2 className="text-heading-md text-charcoal mb-6">Google Calendar</h2>

                {googleStatus === 'connected' && (
                  <div className="mb-4 p-3 bg-teal/10 border border-teal/20 rounded-lg text-sm text-teal font-medium">
                    Google Calendar connected successfully!
                  </div>
                )}
                {googleStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    Failed to connect Google Calendar. Please try again.
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-stone/10">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1967D2"/>
                        <path d="M5.684 18.316V5.684h12.632v12.632H5.684z" fill="#fff"/>
                        <path d="M5.684 5.684H0v12.632h5.684V5.684z" fill="#4285F4"/>
                        <path d="M18.316 18.316H5.684V24h12.632v-5.684z" fill="#34A853"/>
                        <path d="M18.316 0H5.684v5.684h12.632V0z" fill="#EA4335"/>
                        <path d="M18.316 5.684H24V0h-5.684v5.684z" fill="#188038"/>
                        <path d="M18.316 18.316H24V24h-5.684v-5.684z" fill="#1967D2"/>
                        <path d="M0 18.316h5.684V24H0v-5.684z" fill="#1967D2"/>
                        <path d="M0 0h5.684v5.684H0V0z" fill="#FBBC04"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-charcoal">Google Calendar</h3>
                      <p className="text-sm text-stone">Required for meeting booking with applicants</p>
                    </div>
                  </div>
                  {googleConnected ? (
                    <div className="flex items-center gap-3">
                      <Badge variant="awareness">Connected</Badge>
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 text-sm"
                        onClick={handleDisconnectGoogle}
                      >
                        <XMarkIcon className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => window.location.href = '/api/auth/google'}
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>

                {googleConnected && (
                  <div className="mt-4 p-4 bg-cream-warm rounded-xl">
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Booking Calendar
                    </label>
                    <p className="text-xs text-stone mb-3">
                      New meeting bookings will be created on this calendar.
                    </p>
                    {isLoadingCalendars ? (
                      <div className="flex items-center gap-2 text-sm text-stone">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-teal" />
                        Loading calendars…
                      </div>
                    ) : googleCalendars.length > 0 ? (
                      <div className="relative">
                        <select
                          value={selectedCalendarId}
                          onChange={(e) => handleCalendarChange(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-stone/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                        >
                          {googleCalendars.map((cal) => (
                            <option key={cal.id} value={cal.id}>
                              {cal.summary}{cal.primary ? ' (Primary)' : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronUpDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                      </div>
                    ) : (
                      <p className="text-sm text-stone">No calendars found.</p>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ── Workflow Tab ── */}
        {activeTab === 'workflow' && (
          <div className="space-y-6 max-w-3xl">
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheckIcon className="w-6 h-6 text-teal" />
                <div>
                  <h2 className="text-heading-md text-charcoal">Content Workflow</h2>
                  <p className="text-stone text-sm">Configure content approval requirements for your team.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h3 className="font-medium text-charcoal">Require Content Approval</h3>
                    <p className="text-sm text-stone">
                      When enabled, content must be approved before it can be scheduled or published.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSaveApproval({ ...approvalSettings, approval_required: !approvalSettings.approval_required })}
                    disabled={isSavingApproval}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                      approvalSettings.approval_required ? 'bg-teal' : 'bg-stone/20'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      approvalSettings.approval_required ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>

                {approvalSettings.approval_required && (
                  <>
                    <div className="p-4 bg-cream-warm rounded-xl">
                      <h4 className="font-medium text-charcoal text-sm mb-2">Roles that need approval</h4>
                      <p className="text-xs text-stone mb-3">Content from these roles must be reviewed before publishing.</p>
                      <div className="flex flex-wrap gap-2">
                        {(['member', 'viewer'] as const).map(role => {
                          const isSelected = approvalSettings.roles_requiring_approval.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => {
                                const newRoles = isSelected
                                  ? approvalSettings.roles_requiring_approval.filter(r => r !== role)
                                  : [...approvalSettings.roles_requiring_approval, role];
                                handleSaveApproval({ ...approvalSettings, roles_requiring_approval: newRoles });
                              }}
                              disabled={isSavingApproval}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                                isSelected ? 'bg-teal text-white' : 'bg-white text-stone border border-stone/20 hover:border-stone/40'
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-cream-warm rounded-xl">
                      <h4 className="font-medium text-charcoal text-sm mb-2">Roles that can approve</h4>
                      <p className="text-xs text-stone mb-3">These roles can approve or reject content.</p>
                      <div className="flex flex-wrap gap-2">
                        {(['owner', 'admin'] as const).map(role => {
                          const isSelected = approvalSettings.roles_that_can_approve.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => {
                                const newRoles = isSelected
                                  ? approvalSettings.roles_that_can_approve.filter(r => r !== role)
                                  : [...approvalSettings.roles_that_can_approve, role];
                                handleSaveApproval({ ...approvalSettings, roles_that_can_approve: newRoles });
                              }}
                              disabled={isSavingApproval}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                                isSelected ? 'bg-teal text-white' : 'bg-white text-stone border border-stone/20 hover:border-stone/40'
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                      <div>
                        <h4 className="font-medium text-charcoal text-sm">Auto-approve owner content</h4>
                        <p className="text-xs text-stone">Skip approval for content created by org owners.</p>
                      </div>
                      <button
                        onClick={() => handleSaveApproval({ ...approvalSettings, auto_approve_owner: !approvalSettings.auto_approve_owner })}
                        disabled={isSavingApproval}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                          approvalSettings.auto_approve_owner ? 'bg-teal' : 'bg-stone/20'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          approvalSettings.auto_approve_owner ? 'translate-x-6' : ''
                        }`} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ── AI Beta Tab ── */}
        {activeTab === 'ai-beta' && <AiBetaTab />}
      </div>

      {/* Global Modals (rendered outside tabs so they work regardless of active tab) */}
      {pageSelectPlatform && (
        <PageSelectionModal
          platform={pageSelectPlatform}
          isOpen={!!pageSelectPlatform}
          onClose={() => setPageSelectPlatform(null)}
          onPagesAdded={async () => {
            if (organization) {
              const { data: freshConns } = await supabase
                .from('social_media_connections')
                .select('id, platform, platform_username, platform_page_name, platform_page_id, account_type, is_active, connected_at, token_expires_at, metadata')
                .eq('organization_id', organization.id);
              if (freshConns) {
                const safeConns = freshConns.map(c => {
                  const meta = c.metadata as Record<string, unknown> | null;
                  const pages = (meta?.pages as Array<Record<string, unknown>>) || [];
                  return {
                    ...c,
                    metadata: pages.length > 0
                      ? { pages: pages.map(p => ({ id: p.id, name: p.name, category: p.category })) }
                      : null,
                  };
                });
                setSocialConnections(safeConns as SocialConnectionRow[]);
              }
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={disconnectModal.isOpen}
        onClose={() => setDisconnectModal({ isOpen: false, type: 'social' })}
        onConfirm={confirmDisconnect}
        title="Confirm Disconnect"
        message={`Are you sure you want to disconnect ${disconnectModal.platformName}?\n\n${
          disconnectModal.type === 'google'
            ? 'New meeting bookings will not have availability data.'
            : disconnectModal.type === 'social'
              ? 'You will no longer be able to publish content or view analytics for this account.'
              : 'You will no longer be able to import assets from this Google Drive account.'
        }`}
        confirmText={isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        variant="danger"
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant="danger"
      />
    </div>
  );
}
