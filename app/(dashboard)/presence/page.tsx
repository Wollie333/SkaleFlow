'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PlatformSelector, ConsistencyScoreDisplay } from '@/components/presence';
import { PRESENCE_PHASE_TEMPLATES } from '@/config/presence-phases';
import { getCurrentWorkspaceClient } from '@/lib/supabase/workspace-client';
import {
  CheckCircleIcon,
  PlayCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  BookOpenIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import type { PresencePhaseStatus } from '@/types/presence';

interface PresencePhase {
  id: string;
  organization_id: string;
  phase_number: string;
  phase_name: string;
  platform_key: string | null;
  status: PresencePhaseStatus;
  current_question_index: number;
  is_conditional: boolean;
  sort_order: number;
}

interface Platform {
  platform_key: string;
  is_active: boolean;
  primary_goal: string | null;
  priority_order: number;
}

export default function PresenceDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [phases, setPhases] = useState<PresencePhase[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData(userId: string) {
      try {
        const { data: membership } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', userId)
          .single();

        if (!membership?.organization_id || cancelled) return;
        const orgId = membership.organization_id;
        setOrganizationId(orgId);

        // Get current workspace
        const currentWorkspaceId = await getCurrentWorkspaceClient(userId, orgId);
        if (!currentWorkspaceId || cancelled) return;
        setWorkspaceId(currentWorkspaceId);

        // Load phases
        let phasesData = (await supabase
          .from('presence_phases')
          .select('*')
          .eq('workspace_id', currentWorkspaceId)
          .order('sort_order')).data;

        // Auto-create all 7 phases if none exist
        if (!phasesData?.length) {
          const templates = Object.values(PRESENCE_PHASE_TEMPLATES);
          for (const t of templates) {
            await supabase.from('presence_phases').insert({
              organization_id: orgId,
              workspace_id: currentWorkspaceId,
              phase_number: t.number,
              phase_name: t.name,
              platform_key: t.platformKey,
              is_conditional: t.isConditional,
              status: 'not_started',
              current_question_index: 0,
              sort_order: parseInt(t.number),
            });
          }
          phasesData = (await supabase
            .from('presence_phases')
            .select('*')
            .eq('workspace_id', currentWorkspaceId)
            .order('sort_order')).data;
        }

        if (!cancelled && phasesData) setPhases(phasesData);

        // Load platforms
        const platformsRes = await fetch(`/api/presence/platforms?organizationId=${membership.organization_id}&workspaceId=${currentWorkspaceId}`);
        if (platformsRes.ok) {
          const { platforms: platformsData } = await platformsRes.json();
          if (!cancelled) setPlatforms(platformsData || []);
        }

        // Load consistency score
        const { data: org } = await supabase
          .from('organizations')
          .select('presence_consistency_score')
          .eq('id', membership.organization_id)
          .single();

        if (!cancelled && org?.presence_consistency_score != null) {
          setConsistencyScore(org.presence_consistency_score);
        }
      } catch (error) {
        console.error('Presence page: failed to load data', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !cancelled) loadData(user.id);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadData = useCallback(async () => {
    if (!workspaceId || !organizationId) return;

    const { data: phasesData } = await supabase
      .from('presence_phases')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order');

    if (phasesData) setPhases(phasesData);

    const platformsRes = await fetch(`/api/presence/platforms?organizationId=${organizationId}&workspaceId=${workspaceId}`);
    if (platformsRes.ok) {
      const { platforms: platformsData } = await platformsRes.json();
      setPlatforms(platformsData || []);
    }
  }, [workspaceId, organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhaseClick = useCallback((phase: PresencePhase) => {
    if (phase.status === 'skipped' || phase.status === 'locked') return;

    const template = PRESENCE_PHASE_TEMPLATES[phase.phase_number];
    if (!template) return;

    // Check if previous non-skipped phases are completed
    const previousPhases = phases
      .filter(p => p.sort_order < phase.sort_order && p.status !== 'skipped');
    const allPreviousDone = previousPhases.every(
      p => p.status === 'completed' || p.status === 'locked'
    );

    if (!allPreviousDone && phase.status === 'not_started') return;

    router.push(`/presence/${template.slug}`);
  }, [phases, router]);

  const handleExportPlaybook = () => {
    if (!organizationId) return;
    window.open(`/presence/playbook?organizationId=${organizationId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // Computed values
  const activePlatforms = platforms.filter(p => p.is_active);
  const nonSkippedPhases = phases.filter(p => p.status !== 'skipped');
  const completedCount = nonSkippedPhases.filter(
    p => p.status === 'completed' || p.status === 'locked'
  ).length;
  const totalCount = nonSkippedPhases.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allPhasesComplete = totalCount > 0 && completedCount === totalCount;
  const recommendedPhase = nonSkippedPhases.find(p => p.status === 'in_progress')
    || nonSkippedPhases.find(p => p.status === 'not_started');
  const hasStarted = phases.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-dark text-cream">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gold/8 blur-3xl" />

        <div className="relative px-8 py-10 md:px-12 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              {allPhasesComplete ? (
                <>
                  <div className="inline-flex items-center gap-2 bg-teal/20 text-teal-light rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                    <CheckCircleIcon className="w-4 h-4" />
                    All Phases Complete
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-3">
                    Your Presence is Optimised
                  </h1>
                  <p className="text-cream/60 text-base leading-relaxed">
                    You&apos;ve built consistent, strategic profiles across {activePlatforms.length} platform{activePlatforms.length !== 1 ? 's' : ''}.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 bg-cream/10 text-cream/70 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                    {completedCount > 0 ? (
                      <>
                        <PlayCircleIcon className="w-4 h-4" />
                        {progressPercent}% Complete
                      </>
                    ) : (
                      <>
                        <ClockIcon className="w-4 h-4" />
                        Get Started
                      </>
                    )}
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-3">
                    Presence Engine
                  </h1>
                  <p className="text-cream/60 text-base leading-relaxed">
                    Build professional, consistent profiles across all your platforms in 7 guided phases.
                  </p>
                  {recommendedPhase && (
                    <button
                      onClick={() => handlePhaseClick(recommendedPhase)}
                      className="mt-5 inline-flex items-center gap-2 bg-teal hover:bg-teal-light text-cream px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      {completedCount > 0 ? 'Continue' : 'Start'} Phase {recommendedPhase.phase_number}
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="text-center md:text-right">
              <div className="text-4xl font-bold text-gold">
                {completedCount}<span className="text-lg text-cream/50">/{totalCount}</span>
              </div>
              <div className="text-xs text-cream/60 uppercase tracking-wider mt-1">Phases Complete</div>
              {activePlatforms.length > 0 && (
                <div className="text-xs text-cream/60 mt-2">
                  {activePlatforms.length} platform{activePlatforms.length !== 1 ? 's' : ''} active
                </div>
              )}
            </div>
          </div>

          {!allPhasesComplete && completedCount > 0 && (
            <div className="mt-8">
              <div className="w-full bg-cream/10 rounded-full h-2">
                <div
                  className="bg-teal h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action cards (when complete) */}
      {allPhasesComplete && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleExportPlaybook}
            className="group relative text-left bg-cream-warm rounded-xl border border-stone/10 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-dark/5 hover:border-gold/30"
          >
            <div className="w-11 h-11 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/15 transition-colors">
              <BookOpenIcon className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal mb-1">View Presence Playbook</h3>
            <p className="text-xs text-stone leading-relaxed">
              Open your complete presence playbook with all platform profiles.
            </p>
            <ArrowRightIcon className="absolute top-6 right-6 w-4 h-4 text-stone/50 group-hover:text-gold transition-colors" />
          </button>

          <button
            onClick={() => setShowPlatformSelector(true)}
            className="group relative text-left bg-cream-warm rounded-xl border border-stone/10 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-dark/5 hover:border-teal/30"
          >
            <div className="w-11 h-11 rounded-lg bg-teal/10 flex items-center justify-center mb-4 group-hover:bg-teal/15 transition-colors">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-teal" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal mb-1">Edit Platforms</h3>
            <p className="text-xs text-stone leading-relaxed">
              Add, remove, or reprioritise your active platforms.
            </p>
            <ArrowRightIcon className="absolute top-6 right-6 w-4 h-4 text-stone/50 group-hover:text-teal transition-colors" />
          </button>

          <button
            onClick={() => router.push('/calendar')}
            className="group relative text-left bg-cream-warm rounded-xl border border-stone/10 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-dark/5 hover:border-stone/30"
          >
            <div className="w-11 h-11 rounded-lg bg-stone/10 flex items-center justify-center mb-4 group-hover:bg-stone/15 transition-colors">
              <ArrowRightIcon className="w-5 h-5 text-stone" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal mb-1">Go to Content Engine</h3>
            <p className="text-xs text-stone leading-relaxed">
              Start generating content powered by your brand presence.
            </p>
            <ArrowRightIcon className="absolute top-6 right-6 w-4 h-4 text-stone/50 group-hover:text-charcoal transition-colors" />
          </button>
        </div>
      )}

      {/* Consistency Score (when available) */}
      {consistencyScore != null && consistencyScore > 0 && (
        <ConsistencyScoreDisplay score={consistencyScore} />
      )}

      {/* Action bar (when in progress) */}
      {!allPhasesComplete && hasStarted && (
        <div className="flex items-center gap-3">
          {activePlatforms.length > 0 && (
            <Button onClick={() => setShowPlatformSelector(true)} variant="secondary">
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
              Edit Platforms ({activePlatforms.length})
            </Button>
          )}
          {completedCount > 0 && (
            <Button onClick={handleExportPlaybook} variant="secondary">
              <BookOpenIcon className="w-4 h-4 mr-2" />
              View Playbook
            </Button>
          )}
        </div>
      )}

      {/* How it works — first-time onboarding */}
      {!hasStarted && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Select your platforms', desc: 'Choose which social platforms to optimise and set goals for each one.' },
            { step: '2', title: 'AI builds your profiles', desc: 'Expert agents craft professional copy for each platform using your brand.' },
            { step: '3', title: 'Review & go live', desc: 'Refine the AI-generated profiles, run an audit, and get a 30-day plan.' },
          ].map(item => (
            <div key={item.step} className="bg-cream-warm rounded-xl border border-stone/10 p-5">
              <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-sm font-bold text-teal mb-3">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-charcoal mb-1">{item.title}</h3>
              <p className="text-xs text-stone leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Phase cards grid */}
      {phases.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone mb-4">No phases initialised yet.</p>
          <p className="text-xs text-stone">Phases will be created when you select your platforms in Phase 1.</p>
          {!hasStarted && (
            <button
              onClick={() => {
                const template = PRESENCE_PHASE_TEMPLATES['1'];
                if (template) router.push(`/presence/${template.slug}`);
              }}
              className="mt-4 inline-flex items-center gap-2 bg-teal hover:bg-teal-light text-cream px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Start Phase 1: Platform Strategy
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-heading-sm text-charcoal mb-4">
            {allPhasesComplete ? 'Completed Phases' : 'Phases'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase) => {
              const template = PRESENCE_PHASE_TEMPLATES[phase.phase_number];
              const isCompleted = phase.status === 'completed' || phase.status === 'locked';
              const isInProgress = phase.status === 'in_progress';
              const isSkipped = phase.status === 'skipped';
              const isRecommended = recommendedPhase?.id === phase.id;

              // Check accessibility: previous non-skipped phases must be done
              const previousPhases = phases
                .filter(p => p.sort_order < phase.sort_order && p.status !== 'skipped');
              const accessible = !isSkipped && (
                isCompleted || isInProgress ||
                previousPhases.every(p => p.status === 'completed' || p.status === 'locked')
              );

              const qTotal = template?.questions.length ?? 0;
              const qDone = phase.current_question_index ?? 0;

              return (
                <div
                  key={phase.id}
                  role="button"
                  tabIndex={accessible ? 0 : -1}
                  onClick={() => accessible && handlePhaseClick(phase)}
                  onKeyDown={(e) => {
                    if (accessible && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handlePhaseClick(phase);
                    }
                  }}
                  className={`relative text-left bg-cream-warm rounded-xl border p-5 transition-all duration-200 ${
                    isSkipped
                      ? 'opacity-40 cursor-not-allowed'
                      : !accessible
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:-translate-y-1 hover:shadow-lg hover:shadow-dark/5 cursor-pointer'
                  } ${
                    isRecommended && accessible
                      ? 'border-teal ring-2 ring-teal/20'
                      : isCompleted
                        ? 'border-teal/30'
                        : 'border-stone/10'
                  }`}
                >
                  {isRecommended && accessible && (
                    <span className="absolute -top-2.5 left-4 bg-teal text-cream text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Continue here
                    </span>
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                        isCompleted
                          ? 'bg-teal text-cream'
                          : isSkipped
                            ? 'bg-stone/5 text-stone/70'
                            : !accessible
                              ? 'bg-stone/10 text-stone'
                              : isInProgress
                                ? 'bg-teal/15 text-teal'
                                : 'bg-stone/10 text-stone'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="w-5 h-5" />
                      ) : !accessible ? (
                        <LockClosedIcon className="w-4 h-4" />
                      ) : (
                        phase.phase_number
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-charcoal">
                        Phase {phase.phase_number}
                      </h3>
                      <p className="text-sm text-charcoal font-medium mt-0.5">
                        {phase.phase_name}
                      </p>

                      {template && (
                        <p className="text-xs text-stone mt-1.5 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {isSkipped && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-stone bg-stone/5 px-2 py-0.5 rounded-full">
                            Skipped — platform inactive
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Complete
                          </span>
                        )}
                        {accessible && isInProgress && (
                          <>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                              <PlayCircleIcon className="w-3.5 h-3.5" />
                              In Progress
                            </span>
                            {qTotal > 0 && (
                              <span className="text-xs text-stone">
                                {qDone}/{qTotal} questions
                              </span>
                            )}
                          </>
                        )}
                        {accessible && phase.status === 'not_started' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-stone bg-stone/10 px-2 py-0.5 rounded-full">
                            <ClockIcon className="w-3.5 h-3.5" />
                            Not Started
                          </span>
                        )}
                        {!accessible && !isSkipped && (() => {
                          const blocker = phases
                            .filter(p => p.sort_order < phase.sort_order && p.status !== 'skipped')
                            .find(p => p.status !== 'completed' && p.status !== 'locked');
                          return (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-stone bg-stone/10 px-2 py-0.5 rounded-full">
                              <LockClosedIcon className="w-3 h-3" />
                              {blocker ? `Requires Phase ${blocker.phase_number}` : 'Locked'}
                            </span>
                          );
                        })()}
                        {template?.estimatedMinutes && !isCompleted && !isSkipped && (
                          <span className="inline-flex items-center gap-1 text-xs text-stone">
                            <ClockIcon className="w-3 h-3" />
                            ~{template.estimatedMinutes} min
                          </span>
                        )}
                        {phase.is_conditional && phase.platform_key && !isSkipped && (
                          <span className="text-xs text-stone/80">
                            {phase.platform_key.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      {accessible && isInProgress && qTotal > 0 && (
                        <div className="mt-2 w-full bg-stone/10 rounded-full h-1.5">
                          <div
                            className="bg-teal h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(qDone / qTotal) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platform Selector Modal */}
      {showPlatformSelector && organizationId && (
        <PlatformSelector
          organizationId={organizationId}
          existingPlatforms={platforms}
          onClose={() => setShowPlatformSelector(false)}
          onSaved={() => {
            setShowPlatformSelector(false);
            reloadData();
          }}
        />
      )}
    </div>
  );
}
