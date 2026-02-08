'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { QuestionPanel, ExpertChatPanel, MobileTabToggle, ImportPlaybookModal } from '@/components/brand';
import type { MobileTab } from '@/components/brand';
import { Button } from '@/components/ui';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { TopupModal } from '@/components/billing/topup-modal';
import { getPhaseTemplate } from '@/config/phases';
import { isPhaseAccessible } from '@/lib/phase-access';
import { getAgentForQuestion } from '@/config/phase-agents';
import { useModelPreference } from '@/hooks/useModelPreference';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import type { PhaseStatus, Json } from '@/types/database';

const SAVE_INTENT_PATTERNS = [
  /^(save|lock|confirm|done|approved?)[\s.!]*$/i,
  /^(yes|yep|yeah|ok|okay)[\s.!]*$/i,
  /^(perfect|great|good|nice|awesome)[\s.!]*$/i,
  /^looks?\s*good[\s.!]*$/i,
  /^that'?s?\s*(good|perfect|great|fine|it)[\s.!]*$/i,
  /^(save|lock)\s*(it|this|that)[\s.!]*$/i,
  /^i'?m?\s*(happy|done|satisfied)[\s.!]*$/i,
];

function hasSaveIntent(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length > 60) return false;
  return SAVE_INTENT_PATTERNS.some(p => p.test(trimmed));
}

interface Phase {
  id: string;
  phase_number: string;
  phase_name: string;
  status: PhaseStatus;
  current_question_index: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: { name: string; type: string; size: number }[];
  modelName?: string;
}

interface BrandOutput {
  id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
}

export default function BrandPhaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const slug = params.slug as string;
  const phaseNumber = slug?.replace('phase-', '') || '';

  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [outputs, setOutputs] = useState<BrandOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isLockingAnswer, setIsLockingAnswer] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [phaseImportTarget, setPhaseImportTarget] = useState<{ id: string; name: string } | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [phaseCreditsUsed, setPhaseCreditsUsed] = useState<number>(0);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [lockingKey, setLockingKey] = useState<string | null>(null);
  const [acceptedExtractions, setAcceptedExtractions] = useState<Set<string>>(new Set());
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageOperationRef = useRef(false); // Guard: true when handleSendMessage is in-flight

  const { selectedModel, updatePreference } = useModelPreference(organizationId, 'brand_chat');
  const { balance: creditBalance, refetch: refetchCredits } = useCreditBalance(organizationId);
  const { statuses: providerStatuses } = useModelStatus();
  const { models: availableModels } = useAvailableModels('brand_chat');

  // Helper: fetch outputs by expected variable keys (not phase_id) so we always find
  // variables even if their phase_id is stale from a migration.
  const fetchOutputsForPhase = useCallback(async (orgId: string, phaseNum: string) => {
    const template = getPhaseTemplate(phaseNum);
    const expectedKeys = template?.outputVariables || [];
    if (expectedKeys.length === 0) return [];
    const { data } = await supabase
      .from('brand_outputs')
      .select('id, output_key, output_value, is_locked')
      .eq('organization_id', orgId)
      .in('output_key', expectedKeys);
    return data || [];
  }, []); // supabase is stable; getPhaseTemplate is a pure function // eslint-disable-line react-hooks/exhaustive-deps

  // Load phases and find current phase by URL slug
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

        if (phasesError || !phasesData?.length) return;
        if (cancelled) return;

        setPhases(phasesData);

        const targetPhase = phasesData.find(p => p.phase_number === phaseNumber);
        if (targetPhase && isPhaseAccessible(phasesData, targetPhase.id)) {
          setCurrentPhase(targetPhase);
        } else {
          router.replace('/brand');
          return;
        }
      } catch (error) {
        console.error('Phase detail: failed to load data', error);
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
  }, [phaseNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load conversation and outputs when entering a phase (not on question index changes)
  const currentPhaseId = currentPhase?.id;
  useEffect(() => {
    if (!currentPhaseId || !organizationId) return;

    async function loadPhaseData() {
      // Don't overwrite messages if handleSendMessage is in-flight
      if (messageOperationRef.current) return;

      const { data: conversation, error: convError } = await supabase
        .from('brand_conversations')
        .select('messages, credits_used')
        .eq('organization_id', organizationId!)
        .eq('phase_id', currentPhaseId!)
        .single();

      if (convError && convError.code !== 'PGRST116') {
        console.error('Phase detail: conversation load failed', convError.message);
      }

      // Double-check guard after async operation
      if (!messageOperationRef.current) {
        setMessages((conversation?.messages as unknown as Message[]) || []);
      }

      setPhaseCreditsUsed(conversation?.credits_used ?? 0);

      const phase = phases.find(p => p.id === currentPhaseId);
      const outputsData = phase
        ? await fetchOutputsForPhase(organizationId!, phase.phase_number)
        : [];

      setOutputs(outputsData);
    }

    loadPhaseData();
  }, [currentPhaseId, organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadAfterImport = useCallback(async () => {
    if (!organizationId) return;

    const { data: phasesData } = await supabase
      .from('brand_phases')
      .select('id, phase_number, phase_name, status, current_question_index')
      .eq('organization_id', organizationId)
      .order('sort_order');

    if (phasesData && phasesData.length > 0) {
      setPhases(phasesData);
      if (currentPhase) {
        const updated = phasesData.find(p => p.id === currentPhase.id);
        if (updated) setCurrentPhase(updated);
      }
    }

    if (currentPhase) {
      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    }
  }, [organizationId, currentPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhaseClick = useCallback((phase: { id: string; phase_number: string; phase_name: string; status: PhaseStatus }) => {
    if (!isPhaseAccessible(phases, phase.id)) return;
    router.push(`/brand/phase-${phase.phase_number}`);
  }, [phases, router]);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleSendMessage = async (message: string, files?: File[]) => {
    if (!currentPhase || !organizationId) return;

    if (hasSaveIntent(message) && !files?.length) {
      if (hasAnswerToLock) {
        handleLockAnswer();
        return;
      }
      if (canRequestStructure) {
        handleRequestStructure();
        return;
      }
    }

    setIsSending(true);
    messageOperationRef.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const attachmentMeta = files?.map(f => ({ name: f.name, type: f.type, size: f.size }));

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      attachments: attachmentMeta,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      let response: Response;
      setCreditError(null);

      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append('organizationId', organizationId);
        formData.append('phaseId', currentPhase.id);
        formData.append('message', message);
        if (selectedModel) {
          formData.append('modelOverride', selectedModel);
        }
        for (const file of files) {
          formData.append('files', file);
        }
        response = await fetch('/api/brand/chat', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      } else {
        response = await fetch('/api/brand/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            phaseId: currentPhase.id,
            message,
            modelOverride: selectedModel || undefined,
          }),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        let errMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {
          // Response is not JSON (timeout, 502, etc.)
        }

        if (response.status === 402) {
          setCreditError(errMsg || 'Insufficient credits. Switch to a free model or top up your credits.');
          setShowTopupModal(true);
          setMessages(prev => prev.slice(0, -1));
          setIsSending(false);
          return;
        }

        throw new Error(errMsg);
      }

      const data = await response.json();

      // Update phase credit tracking
      if (data.phaseCreditsUsed !== undefined) {
        setPhaseCreditsUsed(data.phaseCreditsUsed);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        modelName: data.modelName,
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (data.persistenceWarning) {
        const warningMessage: Message = {
          role: 'assistant',
          content: '\u26a0\ufe0f Warning: Your conversation may not have saved correctly. Please try sending another message, or refresh and check if your messages appear.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, warningMessage]);
      }

      if (currentPhase.status === 'not_started') {
        setPhases(prev =>
          prev.map(p =>
            p.id === currentPhase.id ? { ...p, status: 'in_progress' as PhaseStatus } : p
          )
        );
        setCurrentPhase(prev => prev ? { ...prev, status: 'in_progress' as PhaseStatus } : null);
      }

      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);

      refetchCredits();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled — remove the user message
        setMessages(prev => prev.slice(0, -1));
      } else {
        console.error('Error sending message:', error);
        // Show error as assistant message instead of silently removing
        const errorMessage: Message = {
          role: 'assistant',
          content: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }

    abortControllerRef.current = null;
    messageOperationRef.current = false;
    setIsSending(false);
  };

  const handleLockAnswer = async () => {
    if (!currentPhase || !organizationId) return;

    setIsLockingAnswer(true);

    try {
      const response = await fetch('/api/brand/lock-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId: currentPhase.id,
          questionIndex: currentPhase.current_question_index,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Phase-level gate: all variables must be set before completing
      if (data.phaseIncomplete && data.missingByQuestion) {
        const missingByQ = data.missingByQuestion as Record<string, string[]>;
        const questionNums = Object.keys(missingByQ).map(Number).sort((a, b) => a - b);
        const firstMissingQ = questionNums[0];
        const missingVarNames = data.missingKeys.map((k: string) => k.replace(/_/g, ' ')).join(', ');

        setIsLockingAnswer(false);

        // Navigate to the first question with missing variables
        const response2 = await fetch('/api/brand/navigate-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            phaseId: currentPhase.id,
            targetQuestionIndex: firstMissingQ,
          }),
        });
        const navData = await response2.json();
        if (navData.success) {
          setCurrentPhase(prev => prev ? { ...prev, current_question_index: firstMissingQ } : null);
          setPhases(prev =>
            prev.map(p =>
              p.id === currentPhase.id ? { ...p, current_question_index: firstMissingQ } : p
            )
          );
          setMessages([]);
          setAcceptedExtractions(new Set());

          // Reload outputs
          const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
          setOutputs(freshOutputs);

          // Thread stays blank — user initiates conversation
        }
        return;
      }

      if (data.missingKeys && data.missingKeys.length > 0) {
        const missingStr = data.missingKeys.join(', ');
        setIsLockingAnswer(false);
        // Thread stays blank — user initiates conversation
        return;
      }

      const newIndex = data.nextQuestionIndex;
      setCurrentPhase(prev => prev ? { ...prev, current_question_index: newIndex } : null);

      if (data.phaseComplete) {
        setPhases(prev =>
          prev.map(p =>
            p.id === currentPhase.id ? { ...p, status: 'locked' as PhaseStatus, current_question_index: newIndex } : p
          )
        );
        setCurrentPhase(prev => prev ? { ...prev, status: 'locked' as PhaseStatus } : null);

        if (data.allPhasesComplete) {
          setIsLockingAnswer(false);
          router.push('/brand');
          return;
        }

        const currentIndex = phases.findIndex(p => p.id === currentPhase.id);
        if (currentIndex < phases.length - 1) {
          const nextPhase = phases[currentIndex + 1];
          router.push(`/brand/phase-${nextPhase.phase_number}`);
        }

        setIsLockingAnswer(false);
        return;
      } else {
        setPhases(prev =>
          prev.map(p =>
            p.id === currentPhase.id ? { ...p, current_question_index: newIndex } : p
          )
        );

        setMessages([]);
        setAcceptedExtractions(new Set());

        setIsLockingAnswer(false);
        // Thread stays blank — user initiates conversation
        return;
      }
    } catch (error) {
      console.error('Error locking answer:', error);
    }

    setIsLockingAnswer(false);
  };

  const handleRequestStructure = () => {
    if (!phaseTemplate) return;
    const keys = phaseTemplate.questionOutputMap[currentPhase?.current_question_index ?? 0] ?? [];
    const prompt = `Based on everything we've discussed in this conversation, please structure my answers into YAML format for these variables: ${keys.join(', ')}. IMPORTANT: Use exactly what I told you — my specific choices, preferences, and wording. Do not substitute your own recommendations. Present the structured output now so I can lock it.`;
    handleSendMessage(prompt);
  };

  const handleGoBack = async () => {
    if (!currentPhase || !organizationId) return;
    const targetIndex = currentPhase.current_question_index - 1;
    if (targetIndex < 0) return;

    setIsLockingAnswer(true);
    try {
      const response = await fetch('/api/brand/navigate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId: currentPhase.id,
          targetQuestionIndex: targetIndex,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCurrentPhase(prev => prev ? { ...prev, current_question_index: targetIndex } : null);
      setPhases(prev =>
        prev.map(p =>
          p.id === currentPhase.id ? { ...p, current_question_index: targetIndex } : p
        )
      );
      setMessages([]);
      setAcceptedExtractions(new Set());

      // Reload outputs for the target question
      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    } catch (error) {
      console.error('Error navigating back:', error);
    }
    setIsLockingAnswer(false);
  };

  const handleSkipQuestion = async () => {
    if (!currentPhase || !organizationId || !phaseTemplate) return;
    const nextIndex = currentPhase.current_question_index + 1;

    // If this is the last question, can't skip — they need to fill in missing vars
    if (nextIndex >= phaseTemplate.questions.length) return;

    setIsLockingAnswer(true);
    try {
      const response = await fetch('/api/brand/navigate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId: currentPhase.id,
          targetQuestionIndex: nextIndex,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCurrentPhase(prev => prev ? { ...prev, current_question_index: nextIndex } : null);
      setPhases(prev =>
        prev.map(p =>
          p.id === currentPhase.id ? { ...p, current_question_index: nextIndex } : p
        )
      );
      setMessages([]);
      setAcceptedExtractions(new Set());

      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    } catch (error) {
      console.error('Error skipping question:', error);
    }
    setIsLockingAnswer(false);
  };

  const handleLockPhase = async () => {
    if (!currentPhase || !organizationId) return;

    setIsLocking(true);

    try {
      const response = await fetch('/api/brand/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId: currentPhase.id,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setPhases(prev =>
        prev.map(p =>
          p.id === currentPhase.id ? { ...p, status: 'locked' as PhaseStatus } : p
        )
      );

      const currentIndex = phases.findIndex(p => p.id === currentPhase.id);
      if (currentIndex < phases.length - 1) {
        router.push(`/brand/phase-${phases[currentIndex + 1].phase_number}`);
      }

      setOutputs(prev => prev.map(o => ({ ...o, is_locked: true })));
    } catch (error) {
      console.error('Error locking phase:', error);
    }

    setIsLocking(false);
  };

  const handleExportPlaybook = () => {
    if (!organizationId) return;
    window.open(`/brand/playbook?organizationId=${organizationId}`, '_blank');
  };

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

      if (currentPhase?.id === phaseId) {
        setCurrentPhase(prev => prev ? { ...prev, status: 'in_progress' as PhaseStatus, current_question_index: 0 } : null);
        setOutputs(prev => prev.map(o => ({ ...o, is_locked: false })));
      } else {
        const phase = phases.find(p => p.id === phaseId);
        if (phase) {
          router.push(`/brand/phase-${phase.phase_number}`);
        }
      }
    } catch (error) {
      console.error('Error unlocking phase:', error);
    }

    setIsUnlocking(false);
  };

  const handleAiChat = useCallback((outputKey: string) => {
    if (!currentPhase || !organizationId) return;

    const displayName = outputKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const existingOutput = outputs.find(o => o.output_key === outputKey);

    if (existingOutput?.is_locked) return;

    if (existingOutput) {
      const currentValue = typeof existingOutput.output_value === 'string'
        ? existingOutput.output_value
        : JSON.stringify(existingOutput.output_value, null, 2);
      const truncated = currentValue.length > 300 ? currentValue.slice(0, 300) + '...' : currentValue;
      handleSendMessage(`Let's review and improve **${displayName}**. Here's what we have so far:\n\n${truncated}\n\nHelp me make this more comprehensive and strategic. Present the updated version as YAML with key: ${outputKey}`);
    } else {
      handleSendMessage(`I'd like to work on **${displayName}**. Help me define it based on what we've discussed so far. Present the structured output as YAML with key: ${outputKey}`);
    }
    setMobileTab('chat');
  }, [currentPhase, organizationId, outputs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualEdit = useCallback(async (outputKey: string, newValue: string) => {
    if (!currentPhase || !organizationId) return;
    setSavingKey(outputKey);
    try {
      const response = await fetch('/api/brand/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId: currentPhase.id,
          outputKey,
          action: 'update',
          value: newValue,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');

      // Refresh outputs
      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    } catch (error) {
      console.error('Error saving variable:', error);
      setSavingKey(null);
      throw error; // Re-throw so the card can show the error
    }
    setSavingKey(null);
  }, [currentPhase, organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLockVariable = useCallback(async (outputKey: string) => {
    if (!organizationId) return;
    setLockingKey(outputKey);
    try {
      const response = await fetch('/api/brand/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          outputKey,
          action: 'lock',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to lock');

      setOutputs(prev => prev.map(o =>
        o.output_key === outputKey ? { ...o, is_locked: true } : o
      ));
    } catch (error) {
      console.error('Error locking variable:', error);
    }
    setLockingKey(null);
  }, [organizationId]);

  const handleUnlockVariable = useCallback(async (outputKey: string) => {
    if (!organizationId) return;
    setLockingKey(outputKey);
    try {
      const response = await fetch('/api/brand/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          outputKey,
          action: 'unlock',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to unlock');

      setOutputs(prev => prev.map(o =>
        o.output_key === outputKey ? { ...o, is_locked: false } : o
      ));
    } catch (error) {
      console.error('Error unlocking variable:', error);
    }
    setLockingKey(null);
  }, [organizationId]);

  const handleAcceptExtraction = useCallback(async (messageIndex: number, outputKey: string, value: string) => {
    if (!currentPhase || !organizationId) return;
    try {
      const response = await fetch('/api/brand/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId: currentPhase.id,
          outputKey,
          action: 'update',
          value,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to accept extraction');

      // Mark this extraction as accepted
      setAcceptedExtractions(prev => {
        const next = new Set(prev);
        next.add(`${messageIndex}:${outputKey}`);
        return next;
      });

      // Refresh outputs
      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    } catch (error) {
      console.error('Error accepting extraction:', error);
    }
  }, [currentPhase, organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  if (!currentPhase) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-stone">
        Phase not found.{' '}
        <button onClick={() => router.push('/brand')} className="text-teal hover:underline ml-1">
          Back to Brand Engine
        </button>
      </div>
    );
  }

  // Compute per-question state
  const phaseTemplate = getPhaseTemplate(currentPhase.phase_number);
  const totalQuestions = phaseTemplate?.questions.length ?? 0;
  const currentQuestionIndex = currentPhase.current_question_index ?? 0;
  const phaseComplete = currentQuestionIndex >= totalQuestions;

  const currentAgent = getAgentForQuestion(currentPhase.phase_number, currentQuestionIndex);

  const currentOutputKeys = phaseTemplate?.questionOutputMap[currentQuestionIndex] ?? [];
  const hasAnswerToLock = currentOutputKeys.length > 0 &&
    currentOutputKeys.some(key =>
      outputs.some(o => o.output_key === key && !o.is_locked)
    );

  const hasAiResponse = messages.length >= 2 && messages.some(m => m.role === 'assistant');
  const canRequestStructure = currentOutputKeys.length > 0 && !hasAnswerToLock && hasAiResponse && !isSending;

  const allPhasesComplete = phases.every(p => p.status === 'locked' || p.status === 'completed');

  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase.id);
  const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < phases.length - 1
    ? phases[currentPhaseIndex + 1] : null;

  const handleGoToNextPhase = () => {
    if (nextPhase) {
      router.push(`/brand/phase-${nextPhase.phase_number}`);
    }
  };

  const currentQuestionText = phaseTemplate?.questions[currentQuestionIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Compact header */}
      <header className="flex items-center justify-between px-1 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/brand')} variant="ghost" className="p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-heading-md text-charcoal">
              Phase {currentPhase.phase_number}: {currentPhase.phase_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentPhase.status === 'locked' && (
            <Button
              onClick={() => handleUnlockPhase(currentPhase.id)}
              variant="secondary"
              disabled={isUnlocking}
            >
              <PencilSquareIcon className="w-4 h-4 mr-2" />
              {isUnlocking ? 'Unlocking...' : 'Edit Phase'}
            </Button>
          )}
          {currentPhase.status !== 'locked' && (
            <Button
              onClick={() => setPhaseImportTarget({ id: currentPhase.id, name: currentPhase.phase_name })}
              variant="secondary"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
              Import
            </Button>
          )}
          {allPhasesComplete && (
            <Button onClick={handleExportPlaybook} variant="secondary">
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Playbook
            </Button>
          )}
        </div>
      </header>

      {/* Import modal */}
      {phaseImportTarget && organizationId && (
        <ImportPlaybookModal
          organizationId={organizationId}
          phaseId={phaseImportTarget.id}
          phaseName={phaseImportTarget.name}
          onComplete={() => {
            setPhaseImportTarget(null);
            reloadAfterImport();
          }}
          onClose={() => setPhaseImportTarget(null)}
        />
      )}

      {/* Credit error banner */}
      {creditError && (
        <div className="mx-1 mb-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-shrink-0">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{creditError}</p>
          <button
            onClick={() => setShowTopupModal(true)}
            className="text-teal hover:text-teal-light text-xs font-semibold mr-2"
          >
            Top Up
          </button>
          <button
            onClick={() => setCreditError(null)}
            className="text-red-400 hover:text-red-600 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top-up modal */}
      {showTopupModal && organizationId && (
        <TopupModal
          organizationId={organizationId}
          message={creditError || undefined}
          onClose={() => {
            setShowTopupModal(false);
            setCreditError(null);
            refetchCredits();
          }}
        />
      )}

      {/* Mobile tab toggle */}
      <div className="px-1 mb-3 flex-shrink-0">
        <MobileTabToggle
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          hasNewOutputs={outputs.some(o => !o.is_locked && currentOutputKeys.includes(o.output_key))}
        />
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0 px-1 pb-1">
        {/* Left panel — Question & Context (42%) */}
        <div className={`lg:w-[42%] lg:flex-shrink-0 lg:block ${mobileTab === 'question' ? 'block w-full' : 'hidden'} bg-white rounded-xl border border-stone/10 overflow-hidden`}>
          <QuestionPanel
            phases={phases}
            currentPhase={currentPhase}
            onPhaseClick={handlePhaseClick}
            totalQuestions={totalQuestions}
            currentQuestionIndex={currentQuestionIndex}
            currentQuestionText={currentQuestionText}
            currentOutputKeys={currentOutputKeys}
            allOutputKeys={phaseTemplate?.outputVariables || []}
            outputs={outputs}
            agent={currentAgent ? {
              name: currentAgent.name,
              title: currentAgent.title,
              expertise: currentAgent.expertise,
              avatarUrl: currentAgent.avatarUrl,
            } : undefined}
            hasAnswerToLock={hasAnswerToLock}
            isLockingAnswer={isLockingAnswer}
            onLockAnswer={handleLockAnswer}
            canRequestStructure={canRequestStructure}
            onRequestStructure={handleRequestStructure}
            onSkipQuestion={handleSkipQuestion}
            onGoBack={handleGoBack}
            onAiChat={handleAiChat}
            onManualEdit={handleManualEdit}
            onLockVariable={handleLockVariable}
            onUnlockVariable={handleUnlockVariable}
            savingKey={savingKey}
            lockingKey={lockingKey}
            onQuickAnswer={(answer) => {
              handleSendMessage(answer);
              setMobileTab('chat');
            }}
            isSending={isSending}
            organizationId={organizationId || undefined}
            onLogoUploaded={async (url) => {
              if (organizationId && currentPhase) {
                await supabase.from('brand_outputs').upsert({
                  organization_id: organizationId,
                  phase_id: currentPhase.id,
                  output_key: 'brand_logo_url',
                  output_value: url,
                  is_locked: false,
                }, { onConflict: 'organization_id,output_key' });
                const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
                setOutputs(freshOutputs);
                handleSendMessage("I've uploaded my logo. Please take a look at it and share your thoughts on its style, colors, and how it fits our brand direction.");
                setMobileTab('chat');
              }
            }}
            phaseComplete={phaseComplete}
            nextPhase={nextPhase}
            onGoToNextPhase={nextPhase ? handleGoToNextPhase : undefined}
            onViewPlaybook={!nextPhase ? handleExportPlaybook : undefined}
          />
        </div>

        {/* Right panel — Expert Chat (58%) */}
        <div className={`lg:flex-1 lg:block ${mobileTab === 'chat' ? 'block w-full' : 'hidden'}`}>
          <ExpertChatPanel
            messages={messages}
            isLoading={isSending}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            agent={currentAgent ? {
              name: currentAgent.name,
              title: currentAgent.title,
              expertise: currentAgent.expertise,
              avatarUrl: currentAgent.avatarUrl,
              avatarInitials: currentAgent.avatarInitials,
              avatarColor: currentAgent.avatarColor,
            } : undefined}
            phaseComplete={phaseComplete}
            nextPhaseName={nextPhase ? `Phase ${nextPhase.phase_number}: ${nextPhase.phase_name}` : undefined}
            onGoToNextPhase={nextPhase ? handleGoToNextPhase : undefined}
            onViewPlaybook={!nextPhase ? handleExportPlaybook : undefined}
            selectedModelId={selectedModel}
            onModelChange={updatePreference}
            models={availableModels}
            creditBalance={creditBalance ? { totalRemaining: creditBalance.totalRemaining, hasCredits: creditBalance.hasCredits } : null}
            providerStatuses={providerStatuses}
            phaseCreditsUsed={phaseCreditsUsed}
            onAcceptExtraction={handleAcceptExtraction}
            acceptedExtractions={acceptedExtractions}
          />
        </div>
      </div>
    </div>
  );
}
