'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { parsePresenceOutputs, type ParsedPresencePlaybook, type ParsedPlatformProfile } from '@/lib/playbook/parse-presence-outputs';
import { PLATFORM_CONFIGS } from '@/config/platform-configs';
import type { PlatformKey } from '@/types/presence';

export default function PresencePlaybookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [playbook, setPlaybook] = useState<ParsedPresencePlaybook | null>(null);
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const orgId = searchParams.get('organizationId');
        let organizationId = orgId;

        if (!organizationId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: membership } = await supabase
            .from('org_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

          if (!membership?.organization_id) return;
          organizationId = membership.organization_id;
        }

        // Get org name
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single();

        setOrgName(org?.name || 'Your Organization');

        // Get all presence outputs
        const { data: outputs } = await supabase
          .from('presence_outputs')
          .select('output_key, output_value')
          .eq('organization_id', organizationId);

        if (outputs) {
          setPlaybook(parsePresenceOutputs(outputs));
        }
      } catch (error) {
        console.error('Failed to load playbook:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading playbook...</div>
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <p className="text-stone-500">No presence data found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 print:bg-white">
      {/* Header (hidden in print) */}
      <div className="print:hidden bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/presence')} className="text-stone-400 hover:text-stone-600">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-dark-900">Presence Playbook</h1>
          </div>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4 mr-1.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Playbook content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Cover */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-2xl p-10 text-white text-center print:break-after-page">
          <GlobeAltIcon className="h-12 w-12 text-teal-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">{orgName}</h1>
          <h2 className="text-xl text-teal-400 mb-4">Presence Engine Playbook</h2>
          <p className="text-stone-300 max-w-lg mx-auto">
            Your complete platform presence guide — optimised profiles, consistent messaging, and a clear activation plan.
          </p>
          {playbook.audit.consistencyScore > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-teal-500/20 text-teal-400 px-4 py-2 rounded-full">
              <CheckCircleIcon className="h-5 w-5" />
              Consistency Score: {playbook.audit.consistencyScore}/100
            </div>
          )}
        </div>

        {/* Strategy Summary */}
        <section className="bg-white rounded-xl border border-stone-200 p-8 print:break-after-page">
          <h2 className="text-xl font-semibold text-dark-900 mb-4">Platform Strategy</h2>

          {playbook.strategy.northStar && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-teal-800 mb-1">North Star</h3>
              <p className="text-teal-900">{playbook.strategy.northStar}</p>
            </div>
          )}

          {playbook.strategy.strategySummary && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-dark-800 mb-2">Strategy Summary</h3>
              <p className="text-stone-600 whitespace-pre-wrap">{playbook.strategy.strategySummary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-dark-800 mb-2">Active Platforms</h3>
              <div className="space-y-1">
                {playbook.strategy.activePlatforms.map((p, i) => (
                  <div key={p} className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="text-teal-600 font-medium">{i + 1}.</span>
                    {PLATFORM_CONFIGS[p as PlatformKey]?.name || p}
                    {playbook.strategy.platformGoals[p] && (
                      <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                        {playbook.strategy.platformGoals[p]?.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {playbook.strategy.timeCommitment && (
              <div>
                <h3 className="text-sm font-medium text-dark-800 mb-2">Time Commitment</h3>
                <p className="text-sm text-stone-600">{playbook.strategy.timeCommitment}</p>
              </div>
            )}
          </div>
        </section>

        {/* Platform profiles */}
        {Object.entries(playbook.platforms).map(([key, profile]) => (
          <PlatformSection key={key} profile={profile} />
        ))}

        {/* Audit & Activation */}
        {playbook.audit.gapSummary && (
          <section className="bg-white rounded-xl border border-stone-200 p-8 print:break-after-page">
            <h2 className="text-xl font-semibold text-dark-900 mb-4">Audit & Activation Plan</h2>

            {playbook.audit.gapSummary && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-dark-800 mb-2">Gap Summary</h3>
                <p className="text-stone-600 whitespace-pre-wrap">{playbook.audit.gapSummary}</p>
              </div>
            )}

            {playbook.audit.universalCta && (
              <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gold-800 mb-1">Universal CTA</h3>
                <p className="text-gold-900">{playbook.audit.universalCta}</p>
              </div>
            )}

            {playbook.audit.thirtyDayPlan && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-dark-800 mb-2">30-Day Activation Plan</h3>
                <div className="text-stone-600 whitespace-pre-wrap text-sm">{playbook.audit.thirtyDayPlan}</div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function PlatformSection({ profile }: { profile: ParsedPlatformProfile }) {
  const config = PLATFORM_CONFIGS[profile.platformKey];

  return (
    <section className="bg-white rounded-xl border border-stone-200 p-8 print:break-after-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dark-900">{profile.platformName}</h2>
        {profile.completionScore !== null && (
          <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
            profile.completionScore >= 80 ? 'bg-green-100 text-green-700' :
            profile.completionScore >= 60 ? 'bg-gold-100 text-gold-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            Score: {profile.completionScore}/100
          </span>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(profile.fields).map(([fieldKey, value]) => {
          if (fieldKey === 'completion_score') return null;
          const label = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          return (
            <div key={fieldKey}>
              <h3 className="text-sm font-medium text-dark-800 mb-1">{label}</h3>
              <div className="text-sm text-stone-600 bg-stone-50 rounded-lg p-3 whitespace-pre-wrap">
                {typeof value === 'string'
                  ? value
                  : typeof value === 'object'
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
