'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Input, Badge, PageHeader } from '@/components/ui';
import { CheckCircleIcon, SparklesIcon, LinkIcon, XMarkIcon, ChevronUpDownIcon, ShieldCheckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { getApprovalSettings, DEFAULT_APPROVAL_SETTINGS, type ApprovalSettings } from '@/config/approval-settings';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { SocialConnectionCard } from '@/components/integrations/social-connection-card';
import { GoogleDriveConnectionCard } from '@/components/integrations/google-drive-connection-card';
import type { SocialPlatform, Json } from '@/types/database';

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
}

export default function SettingsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);
  const [socialConnections, setSocialConnections] = useState<Record<string, { id: string; platform: SocialPlatform; platform_username: string | null; platform_page_name: string | null; is_active: boolean; connected_at: string; token_expires_at: string | null }>>({});
  const [socialStatus, setSocialStatus] = useState<string | null>(null);
  const [driveConnection, setDriveConnection] = useState<{ id: string; drive_email: string | null; is_active: boolean; connected_at: string; token_expires_at: string | null } | null>(null);
  const [driveStatus, setDriveStatus] = useState<string | null>(null);
  const [orgRole, setOrgRole] = useState<string>('');
  const [googleCalendars, setGoogleCalendars] = useState<{ id: string; summary: string; primary: boolean }[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [approvalSettings, setApprovalSettings] = useState<ApprovalSettings>(DEFAULT_APPROVAL_SETTINGS);
  const [isSavingApproval, setIsSavingApproval] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    orgName: '',
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(userData);
        setUserRole(userData.role || '');
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

        // Get subscription
        const { data: sub } = await supabase
          .from('subscriptions')
          .select(`
            *,
            tier:subscription_tiers(name, price_monthly, features)
          `)
          .eq('organization_id', org.id)
          .single();

        if (sub) {
          setSubscription(sub as unknown as Subscription);
        }

        // Load social media connections
        const { data: connections } = await supabase
          .from('social_media_connections')
          .select('id, platform, platform_username, platform_page_name, is_active, connected_at, token_expires_at')
          .eq('organization_id', org.id);

        if (connections) {
          const connMap: typeof socialConnections = {};
          connections.forEach(c => {
            connMap[c.platform] = c as typeof connMap[string];
          });
          setSocialConnections(connMap);
        }

        // Load Google Drive connection (table may not exist yet)
        try {
          const { data: driveConn } = await supabase
            .from('google_drive_connections')
            .select('id, drive_email, is_active, connected_at, token_expires_at')
            .eq('organization_id', org.id)
            .eq('is_active', true)
            .single();

          if (driveConn) {
            setDriveConnection(driveConn);
          }
        } catch {
          // Table doesn't exist yet — skip silently
        }
      }

      setIsLoading(false);
    }

    loadData();

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
    }

    // Check for Google Drive callback status
    const gdriveParam = searchParams.get('gdrive');
    if (gdriveParam) {
      setDriveStatus(gdriveParam);
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
        alert('Failed to initialize checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!user) return;
    if (!confirm('Disconnect Google Calendar? New meeting bookings will not have availability data.')) return;

    const { error } = await supabase
      .from('google_integrations')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setGoogleConnected(false);
      setGoogleStatus(null);
    }
  };

  const handleDisconnectSocial = async (connectionId: string) => {
    const res = await fetch(`/api/integrations/social/connections/${connectionId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSocialConnections(prev => {
        const updated = { ...prev };
        const platform = Object.keys(updated).find(k => updated[k].id === connectionId);
        if (platform) delete updated[platform];
        return updated;
      });
    }
  };

  const handleDisconnectDrive = async (connectionId: string) => {
    const { error } = await supabase
      .from('google_drive_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (!error) {
      setDriveConnection(null);
      setDriveStatus(null);
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

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        icon={Cog6ToothIcon}
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      {/* Profile Section */}
      <Card>
        <h2 className="text-heading-md text-charcoal mb-6">Profile</h2>

        <div className="space-y-4">
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
                  'Brand Engine (all 12+ phases)',
                  'Content Engine with AI generation',
                  'Monthly content calendars',
                  'CSV export',
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

      {/* Features Status */}
      <Card>
        <h2 className="text-heading-md text-charcoal mb-6">Feature Access</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
            <div>
              <h3 className="font-medium text-charcoal">Brand Engine</h3>
              <p className="text-sm text-stone">AI-guided brand strategy system</p>
            </div>
            <Badge variant={organization?.brand_engine_enabled ? 'awareness' : 'conversion'}>
              {organization?.brand_engine_enabled ? 'Enabled' : 'Locked'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
            <div>
              <h3 className="font-medium text-charcoal">Content Engine</h3>
              <p className="text-sm text-stone">AI content generation & calendar</p>
            </div>
            <Badge variant={organization?.content_engine_enabled ? 'awareness' : 'conversion'}>
              {organization?.content_engine_enabled ? 'Enabled' : 'Locked'}
            </Badge>
          </div>
        </div>

        {!organization?.content_engine_enabled && (
          <p className="text-sm text-stone mt-4">
            Complete all Brand Engine phases to unlock the Content Engine.
          </p>
        )}
      </Card>

      {/* Social Media Accounts (org owners/admins) */}
      {['owner', 'admin'].includes(orgRole) && (
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
          {socialStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              Failed to connect social account. {searchParams.get('message') || 'Please try again.'}
            </div>
          )}

          <div className="space-y-3">
            {(['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'] as SocialPlatform[]).map(platform => (
              <SocialConnectionCard
                key={platform}
                platform={platform}
                connection={socialConnections[platform] || null}
                onDisconnect={handleDisconnectSocial}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Google Drive Integration (org owners/admins) */}
      {['owner', 'admin'].includes(orgRole) && (
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

      {/* Google Calendar Integration (admin only) */}
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

          {/* Calendar selector — shown when connected */}
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

      {/* Content Workflow - Approval Settings (org owners/admins) */}
      {['owner', 'admin'].includes(orgRole) && organization?.content_engine_enabled && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheckIcon className="w-6 h-6 text-teal" />
            <div>
              <h2 className="text-heading-md text-charcoal">Content Workflow</h2>
              <p className="text-stone text-sm">Configure content approval requirements for your team.</p>
            </div>
          </div>

          {/* Approval toggle */}
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
                className={`relative w-12 h-6 rounded-full transition-colors ${
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
                {/* Roles requiring approval */}
                <div className="p-4 bg-cream-warm rounded-xl">
                  <h4 className="font-medium text-charcoal text-sm mb-2">Roles that need approval</h4>
                  <p className="text-xs text-stone mb-3">Content from these roles must be reviewed before publishing.</p>
                  <div className="flex gap-2">
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

                {/* Roles that can approve */}
                <div className="p-4 bg-cream-warm rounded-xl">
                  <h4 className="font-medium text-charcoal text-sm mb-2">Roles that can approve</h4>
                  <p className="text-xs text-stone mb-3">These roles can approve or reject content.</p>
                  <div className="flex gap-2">
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

                {/* Auto-approve owner */}
                <div className="flex items-center justify-between p-4 bg-cream-warm rounded-xl">
                  <div>
                    <h4 className="font-medium text-charcoal text-sm">Auto-approve owner content</h4>
                    <p className="text-xs text-stone">Skip approval for content created by org owners.</p>
                  </div>
                  <button
                    onClick={() => handleSaveApproval({ ...approvalSettings, auto_approve_owner: !approvalSettings.auto_approve_owner })}
                    disabled={isSavingApproval}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
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
      )}

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
  );
}
