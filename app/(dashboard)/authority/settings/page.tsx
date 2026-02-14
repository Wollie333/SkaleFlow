'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Cog6ToothIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface EmailConfig {
  bcc_address: string;
  bcc_enabled: boolean;
}

export default function AuthoritySettingsPage() {
  const supabase = createClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (data?.organization_id) setOrganizationId(data.organization_id);
    }
    init();
  }, []);

  const loadConfig = useCallback(async () => {
    if (!organizationId) return;
    const res = await fetch(`/api/authority/email/config?organizationId=${organizationId}`);
    if (res.ok) setEmailConfig(await res.json());
  }, [organizationId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSetupBcc = async () => {
    if (!organizationId) return;
    setSaving(true);
    const res = await fetch('/api/authority/email/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, bcc_enabled: true }),
    });
    if (res.ok) setEmailConfig(await res.json());
    setSaving(false);
  };

  const handleToggleBcc = async () => {
    if (!organizationId || !emailConfig) return;
    setSaving(true);
    const res = await fetch('/api/authority/email/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, bcc_enabled: !emailConfig.bcc_enabled }),
    });
    if (res.ok) setEmailConfig(await res.json());
    setSaving(false);
  };

  const copyBcc = () => {
    if (emailConfig?.bcc_address) {
      navigator.clipboard.writeText(emailConfig.bcc_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Cog6ToothIcon className="w-6 h-6 text-teal" />
        <h1 className="text-2xl font-serif font-bold text-charcoal">Authority Settings</h1>
      </div>

      {/* BCC Email Capture */}
      <div className="bg-white rounded-xl border border-stone/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <EnvelopeIcon className="w-5 h-5 text-teal" />
          <h2 className="text-sm font-semibold text-charcoal">Email Capture (BCC)</h2>
        </div>
        <p className="text-xs text-stone mb-4">
          Add this BCC address to your PR emails to automatically log correspondence in SkaleFlow.
          Emails matching a known contact will be linked to their pipeline card.
        </p>

        {emailConfig?.bcc_address ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-cream-warm/50 rounded-lg px-3 py-2 text-sm text-charcoal font-mono">
                {emailConfig.bcc_address}
              </div>
              <button
                onClick={copyBcc}
                className="px-3 py-2 text-sm font-medium text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-green-600">Copied to clipboard!</p>}

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailConfig.bcc_enabled}
                  onChange={handleToggleBcc}
                  disabled={saving}
                  className="w-4 h-4 rounded border-stone/20 text-teal focus:ring-teal"
                />
                <span className="text-sm text-charcoal">Enable email capture</span>
              </label>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSetupBcc}
            disabled={saving || !organizationId}
            className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Setting up...' : 'Set Up BCC Address'}
          </button>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl border border-stone/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheckIcon className="w-5 h-5 text-teal" />
          <h2 className="text-sm font-semibold text-charcoal">Notifications</h2>
        </div>
        <p className="text-xs text-stone mb-4">
          SkaleFlow automatically sends reminders for follow-ups, approaching deadlines,
          embargo lifts, and overdue payments. These run daily at 7 AM.
        </p>
        <div className="space-y-2">
          {[
            { label: 'Follow-up reminders', desc: 'Cards with no activity for 7+ days' },
            { label: 'Deadline alerts', desc: 'Submission deadlines within 3 days' },
            { label: 'Embargo lift notices', desc: 'Embargoes lifting within 1 day' },
            { label: 'Payment overdue alerts', desc: 'Invoiced payments past due date' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-2 bg-cream-warm/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div>
                <p className="text-xs font-medium text-charcoal">{item.label}</p>
                <p className="text-[10px] text-stone">{item.desc}</p>
              </div>
              <span className="text-[10px] text-green-600 ml-auto">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
