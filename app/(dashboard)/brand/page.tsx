'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ImportPlaybookModal } from '@/components/brand';
import { Button } from '@/components/ui';
import {
  CheckCircleIcon,
  PlayCircleIcon,
  ClockIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  PencilSquareIcon,
  ArrowRightIcon,
  BookOpenIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { getPhaseTemplate } from '@/config/phases';
import { isPhaseAccessible } from '@/lib/phase-access';
import { getPrimaryAgent } from '@/config/phase-agents';
import type { PhaseStatus } from '@/types/database';

interface Phase {
  id: string;
  phase_number: string;
  phase_name: string;
  status: PhaseStatus;
  current_question_index: number;
}

export default function BrandEnginePage() {
  const supabase = createClient();
  const router = useRouter();

  const [phases, setPhases] = useState<Phase[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phasesWithData, setPhasesWithData] = useState<Set<string>>(new Set());
  const [phaseCreditMap, setPhaseCreditMap] = useState<Record<string, number>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Load phases and organization
  useEffect(() => {
    let cancelled = false;

    async function loadData(userId: string) {
      try {
        const { data: membership, error: memberError } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', userId)
          .single();

        if (memberError || !membership?.organization_id) return;
        if (cancelled) return;
        setOrganizationId(membership.organization_id);

        const { data: phasesData, error: phasesError } = await supabase
          .from('brand_phases')
          .select('id, phase_number, phase_name, status, current_question_index')
          .eq('organization_id', membership.organization_id)
          .order('sort_order');

        if (phasesError) return;
        if (cancelled) return;

        if (phasesData && phasesData.length > 0) {
          setPhases(phasesData);

          const { data: outputPhases } = await supabase
            .from('brand_outputs')
            .select('phase_id')
            .eq('organization_id', membership.organization_id);

          if (outputPhases) {
            setPhasesWithData(new Set(outputPhases.map(o => o.phase_id)));
          }

          // Load per-phase credit usage
          const { data: creditData } = await supabase
            .from('brand_conversations')
            .select('phase_id, credits_used')
            .eq('organization_id', membership.organization_id);

          if (creditData) {
            const map: Record<string, number> = {};
            for (const row of creditData) {
              if (row.credits_used > 0) {
                map[row.phase_id] = row.credits_used;
              }
            }
            if (!cancelled) setPhaseCreditMap(map);
          }
        }
      } catch (error) {
        console.error('Brand page: failed to load data', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !cancelled) loadData(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !cancelled && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        loadData(session.user.id);
      } else if (!session && !cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadData = useCallback(async () => {
    if (!organizationId) return;

    const { data: phasesData } = await supabase
      .from('brand_phases')
      .select('id, phase_number, phase_name, status, current_question_index')
      .eq('organization_id', organizationId)
      .order('sort_order');

    if (phasesData && phasesData.length > 0) setPhases(phasesData);

    const { data: outputPhases } = await supabase
      .from('brand_outputs')
      .select('phase_id')
      .eq('organization_id', organizationId);

    if (outputPhases) setPhasesWithData(new Set(outputPhases.map(o => o.phase_id)));
  }, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhaseClick = useCallback((phase: Phase) => {
    if (!isPhaseAccessible(phases, phase.id)) return;
    router.push(`/brand/phase-${phase.phase_number}`);
  }, [phases, router]);

  const handleUnlockPhase = async (phaseId: string) => {
    if (!organizationId) return;
    setIsUnlocking(true);

    try {
      const response = await fetch('/api/brand/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, phaseId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to unlock phase');

      setPhases(prev =>
        prev.map(p =>
          p.id === phaseId ? { ...p, status: 'in_progress' as PhaseStatus, current_question_index: 0 } : p
        )
      );

      const phase = phases.find(p => p.id === phaseId);
      if (phase) {
        router.push(`/brand/phase-${phase.phase_number}`);
      }
    } catch (error) {
      console.error('Error unlocking phase:', error);
    }

    setIsUnlocking(false);
  };

  const handleExportPlaybook = () => {
    if (!organizationId) return;
    window.open(`/brand/playbook?organizationId=${organizationId}`, '_blank');
  };

  const handleClearData = async () => {
    if (!organizationId) return;
    setIsClearing(true);

    try {
      const response = await fetch('/api/brand/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to clear data');

      await reloadData();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing data:', error);
    }

    setIsClearing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  // Computed values
  const completedCount = phases.filter(p => p.status === 'locked' || p.status === 'completed').length;
  const progressPercent = phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0;
  const allPhasesComplete = phases.length > 0 && phases.every(p => p.status === 'locked' || p.status === 'completed');
  const recommendedPhase = phases.find(p => p.status === 'in_progress') || phases.find(p => p.status === 'not_started');

  const totalQuestions = phases.reduce((sum, p) => {
    const t = getPhaseTemplate(p.phase_number);
    return sum + (t?.questions.length ?? 0);
  }, 0);

  const totalVariables = phases.reduce((sum, p) => {
    const t = getPhaseTemplate(p.phase_number);
    return sum + (t?.outputVariables.length ?? 0);
  }, 0);

  const totalCreditsUsed = Object.values(phaseCreditMap).reduce((sum, c) => sum + c, 0);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-dark text-cream">
        {/* Background pattern */}
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
                    Your Brand Strategy is Ready
                  </h1>
                  <p className="text-cream/60 text-base leading-relaxed">
                    You&apos;ve built a complete brand foundation across all {phases.length} phases. Your Content Engine is now unlocked.
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
                    Brand Engine
                  </h1>
                  <p className="text-cream/60 text-base leading-relaxed">
                    Build your complete brand strategy with AI-guided expert conversations across {phases.length} strategic phases.
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

            {/* Stats */}
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">{completedCount}<span className="text-lg text-cream/30">/{phases.length}</span></div>
                <div className="text-xs text-cream/40 uppercase tracking-wider mt-1">Phases</div>
              </div>
              <div className="w-px bg-cream/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">{totalQuestions}</div>
                <div className="text-xs text-cream/40 uppercase tracking-wider mt-1">Questions</div>
              </div>
              <div className="w-px bg-cream/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">{totalVariables}</div>
                <div className="text-xs text-cream/40 uppercase tracking-wider mt-1">Variables</div>
              </div>
              {totalCreditsUsed > 0 && (
                <>
                  <div className="w-px bg-cream/10" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gold">{totalCreditsUsed.toLocaleString()}</div>
                    <div className="text-xs text-cream/40 uppercase tracking-wider mt-1">Credits Used</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress bar (only when in progress) */}
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
            onClick={() => router.push('/calendar')}
            className="group relative text-left bg-white rounded-xl border border-stone/10 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-dark/5 hover:border-teal/30"
          >
            <div className="w-11 h-11 rounded-lg bg-teal/10 flex items-center justify-center mb-4 group-hover:bg-teal/15 transition-colors">
              <RocketLaunchIcon className="w-5 h-5 text-teal" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal mb-1">Go to Content Engine</h3>
            <p className="text-xs text-stone leading-relaxed">
              Start generating branded content powered by your complete strategy.
            </p>
            <ArrowRightIcon className="absolute top-6 right-6 w-4 h-4 text-stone/30 group-hover:text-teal transition-colors" />
          </button>

          <button
            onClick={handleExportPlaybook}
            className="group relative text-left bg-white rounded-xl border border-stone/10 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-dark/5 hover:border-gold/30"
          >
            <div className="w-11 h-11 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/15 transition-colors">
              <BookOpenIcon className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal mb-1">View Brand Playbook</h3>
            <p className="text-xs text-stone leading-relaxed">
              Open your complete brand playbook styled with your visual identity.
            </p>
            <ArrowRightIcon className="absolute top-6 right-6 w-4 h-4 text-stone/30 group-hover:text-gold transition-colors" />
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="group relative text-left bg-white rounded-xl border border-stone/10 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-dark/5 hover:border-stone/30"
          >
            <div className="w-11 h-11 rounded-lg bg-stone/10 flex items-center justify-center mb-4 group-hover:bg-stone/15 transition-colors">
              <ArrowUpTrayIcon className="w-5 h-5 text-stone" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal mb-1">Re-import Playbook</h3>
            <p className="text-xs text-stone leading-relaxed">
              Import updated brand data from a PDF or document.
            </p>
            <ArrowRightIcon className="absolute top-6 right-6 w-4 h-4 text-stone/30 group-hover:text-charcoal transition-colors" />
          </button>
        </div>
      )}

      {/* Action bar (when in progress) */}
      {!allPhasesComplete && (
        <div className="flex items-center gap-3">
          {completedCount > 0 && (
            <Button onClick={handleExportPlaybook} variant="secondary">
              <BookOpenIcon className="w-4 h-4 mr-2" />
              View Playbook
            </Button>
          )}
          <Button onClick={() => setShowImportModal(true)} variant="secondary">
            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
            Import Playbook
          </Button>
          {phasesWithData.size > 0 && (
            <Button onClick={() => setShowClearConfirm(true)} variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <TrashIcon className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          )}
        </div>
      )}

      {/* Phase cards grid */}
      {phases.length === 0 ? (
        <div className="flex items-center justify-center h-[40vh] text-stone">
          No phases available. Please contact your administrator.
        </div>
      ) : (
        <div>
          <h2 className="text-heading-sm text-charcoal mb-4">
            {allPhasesComplete ? 'Completed Phases' : 'Phases'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase) => {
              const template = getPhaseTemplate(phase.phase_number);
              const primaryAgent = getPrimaryAgent(phase.phase_number);
              const isCompleted = phase.status === 'locked' || phase.status === 'completed';
              const isInProgress = phase.status === 'in_progress';
              const isRecommended = recommendedPhase?.id === phase.id;
              const accessible = isPhaseAccessible(phases, phase.id);
              const hasImportedData = phasesWithData.has(phase.id);
              const phaseCredits = phaseCreditMap[phase.id] || 0;
              const qTotal = template?.questions.length ?? 0;
              const qDone = phase.current_question_index ?? 0;

              return (
                <button
                  key={phase.id}
                  onClick={() => handlePhaseClick(phase)}
                  disabled={!accessible}
                  className={`relative text-left bg-white rounded-xl border p-5 transition-all duration-200 ${
                    !accessible
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
                      <p className="text-sm text-charcoal/80 font-medium mt-0.5">
                        {phase.phase_name}
                      </p>

                      {template && (
                        <p className="text-xs text-stone mt-1.5 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      {primaryAgent && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <img
                            src={primaryAgent.avatarUrl}
                            alt={primaryAgent.name}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-xs text-stone/70">
                            Guided by {primaryAgent.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {isCompleted && (
                          <>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Complete
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlockPhase(phase.id);
                              }}
                              disabled={isUnlocking}
                              className="inline-flex items-center gap-1 text-xs font-medium text-stone hover:text-teal bg-stone/10 hover:bg-teal/10 px-2 py-0.5 rounded-full transition-colors"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          </>
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
                        {!accessible && hasImportedData && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                            Imported data waiting
                          </span>
                        )}
                        {!accessible && !hasImportedData && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-stone bg-stone/10 px-2 py-0.5 rounded-full">
                            <LockClosedIcon className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                        {phaseCredits > 0 && (
                          <span className="inline-flex items-center text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                            {phaseCredits.toLocaleString()} credits
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
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImportModal && organizationId && (
        <ImportPlaybookModal
          organizationId={organizationId}
          onComplete={() => {
            setShowImportModal(false);
            reloadData();
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Clear data confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-dark/50 backdrop-blur-sm"
            onClick={!isClearing ? () => setShowClearConfirm(false) : undefined}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-charcoal">Clear All Imported Data</h3>
                  <p className="text-xs text-stone mt-0.5">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-stone/5 rounded-lg p-3 space-y-2">
                <p className="text-xs text-charcoal">This will remove:</p>
                <ul className="text-xs text-stone space-y-1 ml-4 list-disc">
                  <li>All unlocked/draft brand outputs across every phase</li>
                </ul>
                <p className="text-xs text-charcoal mt-2">This will NOT affect:</p>
                <ul className="text-xs text-stone space-y-1 ml-4 list-disc">
                  <li>Locked (confirmed) outputs</li>
                  <li>AI conversation history</li>
                  <li>Phase progress and status</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone/10">
              <Button
                onClick={() => setShowClearConfirm(false)}
                variant="ghost"
                disabled={isClearing}
              >
                Cancel
              </Button>
              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
              >
                {isClearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-4 h-4" />
                    Clear All Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
