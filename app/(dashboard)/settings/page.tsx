'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Input, Badge } from '@/components/ui';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

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

  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
        setFormData(prev => ({ ...prev, fullName: userData.full_name || '' }));
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
      }

      setIsLoading(false);
    }

    loadData();
  }, [supabase]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-display-md text-charcoal">Settings</h1>
        <p className="text-body-lg text-stone mt-1">
          Manage your account and subscription
        </p>
      </header>

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
