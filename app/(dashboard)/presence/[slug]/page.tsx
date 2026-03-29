'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ExpertChatPanel, QuestionBanner, ProgressSidebar } from '@/components/brand';
import { Button } from '@/components/ui';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ForwardIcon,
  SparklesIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TopupModal } from '@/components/billing/topup-modal';
import { getPresencePhaseBySlug, getOutputVariablesForQuestion, PRESENCE_PHASE_TEMPLATES, type PresencePhaseTemplate } from '@/config/presence-phases';
import { getPresenceAgentForQuestion } from '@/config/presence-agents';
import { useModelPreference } from '@/hooks/useModelPreference';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { formatOutputKey } from '@/lib/brand/format-utils';
import type { Json } from '@/types/database';

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

type PresencePhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'locked' | 'skipped';

interface Phase {
  id: string;
  phase_number: string;
  phase_name: string;
  status: PresencePhaseStatus;
  current_question_index: number;
}

function getPhaseWelcomeMessage(phaseTemplate: PresencePhaseTemplate, questionIndex: number): string {
  const phaseIntros: Record<string, string> = {
    '1': `**Welcome to Platform Strategy!**

This phase helps you select and prioritize the right platforms for your brand. We'll analyze your business type, ICP, and brand positioning to recommend where you should focus your presence efforts.

**What we'll accomplish:**
- Identify your priority platforms based on your brand and goals
- Set clear objectives for each platform
- Define your posting commitment and resources
- Establish your "presence north star" - the impression you want to create

${phaseTemplate.description}

**Let's start with question ${questionIndex + 1}:** ${phaseTemplate.questions[questionIndex]}

💬 Use the suggestions below or type your answer to begin the conversation.`,

    '2': `**Welcome to LinkedIn Presence!**

In this phase, we'll craft authority-first LinkedIn profile copy that positions you as a Key Person of Influence in your category. I'll present polished copy options, and you can refine them until they're perfect.

**What we'll build:**
- 3 headline options optimized for authority and searchability
- StoryBrand-structured About section
- Featured items strategy
- Connection strategy and messaging
- Banner copy and profile optimization

${phaseTemplate.description}

**Current question:** ${phaseTemplate.questions[questionIndex]}

💬 Share your thoughts, upload a screenshot, or click the suggestions to get started.`,

    '3': `**Welcome to Facebook Presence!**

Let's optimize your Facebook Business Page for community building and conversions. We'll create page copy, CTA strategy, and community approach tailored to your brand.

**What we'll create:**
- Page name, category, and setup
- Compelling About sections
- Strategic CTA button selection
- Cover image concept and messaging
- Optional: Facebook Group strategy

${phaseTemplate.description}

**Current question:** ${phaseTemplate.questions[questionIndex]}

💬 Ready when you are!`,

    '4': `**Welcome to Instagram Presence!**

Time to create a magnetic Instagram profile! We'll craft scroll-stopping bios, strategic link placements, and a visual direction that attracts your ideal audience.

**What we'll design:**
- 3 bio formula options (authority, problem-led, transformation)
- Link-in-bio strategy
- Story Highlights structure
- Username optimization
- Visual grid aesthetic direction

${phaseTemplate.description}

**Current question:** ${phaseTemplate.questions[questionIndex]}

💬 Let's create your Instagram presence!`,

    '5': `**Welcome to Google My Business!**

We'll optimize your Google Business Profile for local search dominance. This phase focuses on category selection, keyword optimization, and service area setup.

**What we'll optimize:**
- Primary and secondary categories
- Keyword-optimized business description
- Service areas and coverage
- Business hours setup
- Top 5 services with descriptions

${phaseTemplate.description}

**Current question:** ${phaseTemplate.questions[questionIndex]}

💬 Let's get your business found on Google!`,

    '6': `**Welcome to Video Platforms!**

Whether YouTube, TikTok, or both - we'll set up your video presence for consistent content and audience growth.

**What we'll create:**
- Channel/account descriptions
- Name optimization
- Content categories and pillars
- Video intro formulas (hook > identity > value)
- Trailer/pinned video concepts

${phaseTemplate.description}

**Current question:** ${phaseTemplate.questions[questionIndex]}

💬 Ready to build your video presence?`,

    '7': `**Welcome to Presence Audit & Consistency!**

Final phase! We'll audit your cross-platform consistency, identify quick wins, and build a 30-day activation plan.

**What we'll deliver:**
- Full cross-platform consistency audit
- Consistency scores by dimension
- Gap analysis and quick wins
- 30-day activation roadmap
- Universal CTA strategy

${phaseTemplate.description}

**Current question:** ${phaseTemplate.questions[questionIndex]}

💬 Let's bring it all together!`,
  };

  return phaseIntros[phaseTemplate.number] || `**Welcome to ${phaseTemplate.name}!**

${phaseTemplate.description}

**Current question:** ${phaseTemplate.questions[questionIndex]}

💬 Share your thoughts to get started.`;
}

interface Message {
  role: 'user' | 'assistant' | 'separator';
  content: string;
  timestamp: string;
  attachments?: { name: string; type: string; size: number }[];
  modelName?: string;
}

interface PresenceOutput {
  id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
}

export default function PresencePhasePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const slug = params.slug as string;

  const phaseTemplate = getPresencePhaseBySlug(slug);

  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [outputs, setOutputs] = useState<PresenceOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLockingAnswer, setIsLockingAnswer] = useState(false);
  const [forceAdvanceMissingKeys, setForceAdvanceMissingKeys] = useState<string[] | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [phaseCreditsUsed, setPhaseCreditsUsed] = useState<number>(0);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [lockingKey, setLockingKey] = useState<string | null>(null);
  const [autoSavedOutputs, setAutoSavedOutputs] = useState<string[]>([]);
  const [showProgressSidebar, setShowProgressSidebar] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageOperationRef = useRef(false);

  const { selectedModel, updatePreference } = useModelPreference(organizationId, 'brand_chat');
  const { balance: creditBalance, refetch: refetchCredits } = useCreditBalance(organizationId);
  const { statuses: providerStatuses } = useModelStatus();
  const { models: availableModels } = useAvailableModels('brand_chat');

  const fetchOutputsForPhase = useCallback(async (orgId: string, phaseNum: string) => {
    const template = getPresencePhaseBySlug(slug);
    const expectedKeys = template?.outputVariables || [];
    if (expectedKeys.length === 0) return [];
    const { data } = await supabase
      .from('presence_outputs')
      .select('id, output_key, output_value, is_locked')
      .eq('organization_id', orgId)
      .in('output_key', expectedKeys);
    return data || [];
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load phases and find current phase
  useEffect(() => {
    let cancelled = false;

    async function loadData(userId: string) {
      let shouldRedirect = false;

      try {
        const { data: membership } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', userId)
          .single();

        if (!membership?.organization_id || cancelled) return;
        const orgId = membership.organization_id;
        setOrganizationId(orgId);

        let phasesData = (await supabase
          .from('presence_phases')
          .select('id, phase_number, phase_name, status, current_question_index')
          .eq('organization_id', orgId)
          .order('sort_order')).data;

        // Auto-create all 7 phases if none exist yet
        if (!phasesData?.length) {
          const templates = Object.values(PRESENCE_PHASE_TEMPLATES);
          const inserts = templates.map(t => ({
            organization_id: orgId,
            phase_number: t.number,
            phase_name: t.name,
            platform_key: t.platformKey,
            is_conditional: t.isConditional,
            status: 'not_started' as const,
            current_question_index: 0,
            sort_order: parseInt(t.number),
          }));

          const { error: insertError } = await supabase
            .from('presence_phases')
            .insert(inserts);

          if (insertError) {
            console.error('Failed to create presence phases:', insertError);
            return;
          }

          // Re-fetch after creation
          phasesData = (await supabase
            .from('presence_phases')
            .select('id, phase_number, phase_name, status, current_question_index')
            .eq('organization_id', orgId)
            .order('sort_order')).data;
        }

        if (!phasesData?.length || cancelled) return;
        setPhases(phasesData as Phase[]);

        if (!phaseTemplate) {
          router.replace('/presence');
          shouldRedirect = true;
          return;
        }

        const targetPhase = phasesData.find(p => p.phase_number === phaseTemplate.number);
        if (targetPhase) {
          setCurrentPhase(targetPhase as Phase);
        } else {
          console.error('Phase not found:', { phaseNumber: phaseTemplate.number, availablePhases: phasesData.map(p => p.phase_number) });
          router.replace('/presence');
          shouldRedirect = true;
          return;
        }
      } catch (error) {
        console.error('Presence phase: failed to load', error);
      } finally {
        if (!cancelled && !shouldRedirect) setIsLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !cancelled) loadData(user.id);
    });

    return () => { cancelled = true; };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load conversation and outputs when phase is set
  const currentPhaseId = currentPhase?.id;
  useEffect(() => {
    if (!currentPhaseId || !organizationId) return;

    async function loadPhaseData() {
      if (messageOperationRef.current) return;

      const { data: conversation } = await supabase
        .from('presence_conversations')
        .select('messages, credits_used')
        .eq('organization_id', organizationId!)
        .eq('phase_id', currentPhaseId!)
        .single();

      const existingMessages = (conversation?.messages as unknown as Message[]) || [];

      // Always prepend welcome message if no conversation exists yet
      if (phaseTemplate && currentPhase) {
        const hasRealMessages = existingMessages.some(m => m.role !== 'separator');

        if (!hasRealMessages) {
          const welcomeMessage: Message = {
            role: 'separator',
            content: getPhaseWelcomeMessage(phaseTemplate, currentPhase.current_question_index ?? 0),
            timestamp: new Date().toISOString(),
          };
          if (!messageOperationRef.current) {
            setMessages([welcomeMessage, ...existingMessages]);
          }
        } else {
          if (!messageOperationRef.current) {
            setMessages(existingMessages);
          }
        }
      } else {
        if (!messageOperationRef.current) {
          setMessages(existingMessages);
        }
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

  const reloadMessages = useCallback(async () => {
    if (!organizationId || !currentPhase) return;
    const { data: conversation } = await supabase
      .from('presence_conversations')
      .select('messages')
      .eq('organization_id', organizationId)
      .eq('phase_id', currentPhase.id)
      .single();
    setMessages((conversation?.messages as unknown as Message[]) || []);
  }, [organizationId, currentPhase]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (selectedModel) formData.append('modelOverride', selectedModel);
        for (const file of files) formData.append('files', file);
        response = await fetch('/api/presence/chat', { method: 'POST', body: formData, signal: controller.signal });
      } else {
        response = await fetch('/api/presence/chat', {
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
        try { const errData = await response.json(); errMsg = errData.error || errMsg; } catch {}
        if (response.status === 402) {
          setCreditError(errMsg);
          setShowTopupModal(true);
          setMessages(prev => prev.slice(0, -1));
          setIsSending(false);
          return;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (data.phaseCreditsUsed !== undefined) setPhaseCreditsUsed(data.phaseCreditsUsed);
      if (data.autoSavedOutputs?.length > 0) setAutoSavedOutputs(data.autoSavedOutputs);

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        modelName: data.modelName,
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (currentPhase.status === 'not_started') {
        setPhases(prev => prev.map(p =>
          p.id === currentPhase.id ? { ...p, status: 'in_progress' as PresencePhaseStatus } : p
        ));
        setCurrentPhase(prev => prev ? { ...prev, status: 'in_progress' as PresencePhaseStatus } : null);
      }

      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
      refetchCredits();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        }]);
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
      const response = await fetch('/api/presence/lock-answer', {
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
        if (data.canForce) {
          setForceAdvanceMissingKeys(data.missingKeys || []);
          setIsLockingAnswer(false);
          return;
        }
        throw new Error(data.error);
      }

      setForceAdvanceMissingKeys(null);
      const newIndex = data.nextQuestionIndex;
      setCurrentPhase(prev => prev ? { ...prev, current_question_index: newIndex } : null);

      if (data.phaseCompleted) {
        setPhases(prev => prev.map(p =>
          p.id === currentPhase.id ? { ...p, status: 'completed' as PresencePhaseStatus, current_question_index: newIndex } : p
        ));
        setCurrentPhase(prev => prev ? { ...prev, status: 'completed' as PresencePhaseStatus } : null);

        // Navigate to next phase or back to presence dashboard
        const currentIndex = phases.findIndex(p => p.id === currentPhase.id);
        const nextPhase = phases.slice(currentIndex + 1).find(p => p.status !== 'skipped');
        if (nextPhase) {
          const nextTemplate = Object.values(PRESENCE_PHASE_TEMPLATES)
            .find((t) => t.number === nextPhase.phase_number);
          if (nextTemplate) {
            router.push(`/presence/${nextTemplate.slug}`);
          } else {
            router.push('/presence');
          }
        } else {
          router.push('/presence');
        }
        setIsLockingAnswer(false);
        return;
      }

      setPhases(prev => prev.map(p =>
        p.id === currentPhase.id ? { ...p, current_question_index: newIndex } : p
      ));
      await reloadMessages();
      setAutoSavedOutputs([]);
      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    } catch (error) {
      console.error('Lock answer error:', error);
    }
    setIsLockingAnswer(false);
  };

  const handleForceAdvance = async () => {
    if (!currentPhase || !organizationId) return;
    setForceAdvanceMissingKeys(null);
    setIsLockingAnswer(true);

    try {
      const response = await fetch('/api/presence/lock-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId: currentPhase.id,
          questionIndex: currentPhase.current_question_index,
          force: true,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.phaseCompleted) {
        router.push('/presence');
        setIsLockingAnswer(false);
        return;
      }

      const newIndex = data.nextQuestionIndex;
      setCurrentPhase(prev => prev ? { ...prev, current_question_index: newIndex } : null);
      setPhases(prev => prev.map(p =>
        p.id === currentPhase.id ? { ...p, current_question_index: newIndex } : p
      ));
      await reloadMessages();
      setAutoSavedOutputs([]);
    } catch (error) {
      console.error('Force advance error:', error);
    }
    setIsLockingAnswer(false);
  };

  const handleRequestStructure = () => {
    if (!phaseTemplate || !currentPhase) return;
    const keys = getOutputVariablesForQuestion(phaseTemplate.number, currentPhase.current_question_index);
    const prompt = `Based on everything we've discussed, please structure the answers into YAML format for these variables: ${keys.join(', ')}. Use exactly what I told you. Present the structured output now so I can save it.`;
    handleSendMessage(prompt);
  };

  const handleGoBack = async () => {
    if (!currentPhase || !organizationId) return;
    const targetIndex = currentPhase.current_question_index - 1;
    if (targetIndex < 0) return;

    setIsLockingAnswer(true);
    try {
      const response = await fetch('/api/presence/navigate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, phaseId: currentPhase.id, targetQuestionIndex: targetIndex }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCurrentPhase(prev => prev ? { ...prev, current_question_index: targetIndex } : null);
      setPhases(prev => prev.map(p =>
        p.id === currentPhase.id ? { ...p, current_question_index: targetIndex } : p
      ));
      await reloadMessages();
      setAutoSavedOutputs([]);
      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    } catch (error) {
      console.error('Navigate back error:', error);
    }
    setIsLockingAnswer(false);
  };

  const handleSkipQuestion = async () => {
    if (!currentPhase || !organizationId || !phaseTemplate) return;
    const nextIndex = currentPhase.current_question_index + 1;
    if (nextIndex >= phaseTemplate.questions.length) return;

    setIsLockingAnswer(true);
    try {
      const response = await fetch('/api/presence/navigate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, phaseId: currentPhase.id, targetQuestionIndex: nextIndex }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCurrentPhase(prev => prev ? { ...prev, current_question_index: nextIndex } : null);
      setPhases(prev => prev.map(p =>
        p.id === currentPhase.id ? { ...p, current_question_index: nextIndex } : p
      ));
      await reloadMessages();
      setAutoSavedOutputs([]);
      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    } catch (error) {
      console.error('Skip question error:', error);
    }
    setIsLockingAnswer(false);
  };

  const handleAiChat = useCallback((outputKey: string) => {
    if (!currentPhase || !organizationId) return;
    const displayName = formatOutputKey(outputKey);
    const existingOutput = outputs.find(o => o.output_key === outputKey);
    if (existingOutput?.is_locked) return;

    if (existingOutput) {
      const currentValue = typeof existingOutput.output_value === 'string'
        ? existingOutput.output_value
        : JSON.stringify(existingOutput.output_value, null, 2);
      const truncated = currentValue.length > 300 ? currentValue.slice(0, 300) + '...' : currentValue;
      handleSendMessage(`Let's review and improve **${displayName}**. Here's what we have:\n\n${truncated}\n\nHelp me make this better. Present the updated version as YAML with key: ${outputKey}`);
    } else {
      handleSendMessage(`I'd like to work on **${displayName}**. Help me define it based on my brand. Present the structured output as YAML with key: ${outputKey}`);
    }
  }, [currentPhase, organizationId, outputs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualEdit = useCallback(async (outputKey: string, newValue: Json) => {
    if (!currentPhase || !organizationId) return;
    setSavingKey(outputKey);
    try {
      const response = await fetch('/api/presence/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, phaseId: currentPhase.id, outputKey, action: 'update', value: newValue }),
      });
      if (!response.ok) throw new Error('Failed to save');
      const freshOutputs = await fetchOutputsForPhase(organizationId, currentPhase.phase_number);
      setOutputs(freshOutputs);
    } catch (error) {
      console.error('Manual edit error:', error);
      throw error;
    } finally {
      setSavingKey(null);
    }
  }, [currentPhase, organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLockVariable = useCallback(async (outputKey: string) => {
    if (!organizationId) return;
    setLockingKey(outputKey);
    try {
      const response = await fetch('/api/presence/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, outputKey, action: 'lock' }),
      });
      if (!response.ok) throw new Error('Failed to lock');
      setOutputs(prev => prev.map(o => o.output_key === outputKey ? { ...o, is_locked: true } : o));
    } catch (error) {
      console.error('Lock variable error:', error);
    }
    setLockingKey(null);
  }, [organizationId]);

  const handleUnlockVariable = useCallback(async (outputKey: string) => {
    if (!organizationId) return;
    setLockingKey(outputKey);
    try {
      const response = await fetch('/api/presence/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, outputKey, action: 'unlock' }),
      });
      if (!response.ok) throw new Error('Failed to unlock');
      setOutputs(prev => prev.map(o => o.output_key === outputKey ? { ...o, is_locked: false } : o));
    } catch (error) {
      console.error('Unlock variable error:', error);
    }
    setLockingKey(null);
  }, [organizationId]);

  const handleSendMessageRef = useRef(handleSendMessage);
  handleSendMessageRef.current = handleSendMessage;

  const handleSuggestionClick = useCallback((action: string) => {
    if (action === '__help_me_think__') {
      // Phase 1, Question 1: Ask for platform recommendations
      if (phaseTemplate?.number === '1' && currentPhase?.current_question_index === 0) {
        handleSendMessageRef.current("Based on my brand positioning, ICP, and business type, which platforms should I prioritize? Please present a specific platform ranking with your reasoning.");
      } else {
        handleSendMessageRef.current("I'm not sure how to approach this. Please guide me through it step by step - use my brand data to propose something concrete that I can refine.");
      }
    } else if (action === '__i_know_this__') {
      // Focus chat input - handled by ExpertChatPanel
    }
  }, [phaseTemplate, currentPhase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!phaseTemplate) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-stone">
        Phase not found.{' '}
        <button onClick={() => router.push('/presence')} className="text-teal hover:underline ml-1">
          Back to Presence Engine
        </button>
      </div>
    );
  }

  if (!currentPhase) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-stone">
        Phase not initialised.{' '}
        <button onClick={() => router.push('/presence')} className="text-teal hover:underline ml-1">
          Back to Presence Engine
        </button>
      </div>
    );
  }

  // Compute per-question state
  const totalQuestions = phaseTemplate.questions.length;
  const currentQuestionIndex = currentPhase.current_question_index ?? 0;
  const phaseComplete = currentQuestionIndex >= totalQuestions;
  const currentAgent = getPresenceAgentForQuestion(currentPhase.phase_number, currentQuestionIndex);
  const currentOutputKeys = getOutputVariablesForQuestion(phaseTemplate.number, currentQuestionIndex);
  const outputMap = new Map(outputs.map(o => [o.output_key, o]));

  const hasAnswerToLock = currentOutputKeys.length > 0 &&
    currentOutputKeys.some(key => outputs.some(o => o.output_key === key && !o.is_locked));

  const allCurrentOutputsLocked = currentOutputKeys.length > 0 &&
    currentOutputKeys.every(key => {
      const o = outputMap.get(key);
      return o && o.is_locked;
    });

  const realMessages = messages.filter(m => m.role !== 'separator');
  const hasAiResponse = realMessages.length >= 2 && realMessages.some(m => m.role === 'assistant');
  const canRequestStructure = currentOutputKeys.length > 0 && !hasAnswerToLock && hasAiResponse && !isSending;

  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase.id);
  const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < phases.length - 1
    ? phases.slice(currentPhaseIndex + 1).find(p => p.status !== 'skipped')
    : null;

  const handleGoToNextPhase = () => {
    if (!nextPhase) return;
    const nextTemplate = Object.values(require('@/config/presence-phases').PRESENCE_PHASE_TEMPLATES)
      .find((t: { number: string }) => t.number === nextPhase.phase_number) as { slug: string } | undefined;
    if (nextTemplate) {
      router.push(`/presence/${nextTemplate.slug}`);
    }
  };

  const currentQuestionText = phaseTemplate.questions[currentQuestionIndex];

  // Build output status map for QuestionBanner
  const outputStatuses = new Map<string, { filled: boolean; locked: boolean }>();
  for (const key of currentOutputKeys) {
    const o = outputMap.get(key);
    outputStatuses.set(key, { filled: !!o, locked: o?.is_locked ?? false });
  }

  // Convert questionOutputMap keys from string to number for ProgressSidebar
  const numericQuestionOutputMap: Record<number, string[]> = {};
  for (const [k, v] of Object.entries(phaseTemplate.questionOutputMap)) {
    numericQuestionOutputMap[parseInt(k)] = v;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Compact header */}
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/presence')} variant="ghost" className="p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-heading-md text-charcoal">
              Phase {currentPhase.phase_number}: {currentPhase.phase_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalQuestions > 0 && (
            <div className="hidden sm:flex items-center gap-2 mr-2">
              {phaseComplete ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-teal">
                  <CheckIcon className="w-3.5 h-3.5" />
                  Complete
                </span>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < currentQuestionIndex
                            ? 'bg-teal'
                            : i === currentQuestionIndex
                              ? 'bg-teal ring-2 ring-teal/30'
                              : 'bg-stone-light/60'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-charcoal/50 font-medium">
                    {currentQuestionIndex + 1}/{totalQuestions}
                  </span>
                </>
              )}
            </div>
          )}
          <Button
            onClick={() => setShowProgressSidebar(true)}
            variant="secondary"
          >
            <Bars3BottomRightIcon className="w-4 h-4 mr-2" />
            Progress
          </Button>
        </div>
      </header>

      {/* Credit error banner */}
      {creditError && (
        <div className="mx-4 mb-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-shrink-0">
          <p className="text-sm text-red-400 flex-1">{creditError}</p>
          <button onClick={() => setShowTopupModal(true)} className="text-teal hover:text-teal-light text-xs font-semibold mr-2">Top Up</button>
          <button onClick={() => setCreditError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
        </div>
      )}

      {showTopupModal && organizationId && (
        <TopupModal
          organizationId={organizationId}
          message={creditError || undefined}
          onClose={() => { setShowTopupModal(false); setCreditError(null); refetchCredits(); }}
        />
      )}

      {/* Centered single-column chat layout */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-2 space-y-4">
            {/* Question Banner */}
            <QuestionBanner
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={totalQuestions}
              questionText={currentQuestionText}
              outputKeys={currentOutputKeys}
              outputStatuses={outputStatuses}
              agent={currentAgent ? {
                name: currentAgent.name,
                title: currentAgent.title,
                expertise: currentAgent.expertise,
                avatarUrl: currentAgent.avatarUrl,
              } : undefined}
              phaseComplete={phaseComplete}
              onSuggestionClick={handleSuggestionClick}
              isSending={isSending}
              hasMessages={messages.some(m => m.role !== 'separator')}
              onLockVariable={handleLockVariable}
              onUnlockVariable={handleUnlockVariable}
              lockingKey={lockingKey}
            />

            {/* Chat messages */}
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
              selectedModelId={selectedModel}
              onModelChange={updatePreference}
              models={availableModels}
              creditBalance={creditBalance ? { totalRemaining: creditBalance.totalRemaining, hasCredits: creditBalance.hasCredits } : null}
              providerStatuses={providerStatuses}
              phaseCreditsUsed={phaseCreditsUsed}
              autoSavedOutputs={autoSavedOutputs}
              centered
              bottomBar={!phaseComplete ? (
                <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                  {/* Left: Previous */}
                  <div className="flex items-center gap-2">
                    {currentQuestionIndex > 0 && (
                      <button
                        type="button"
                        onClick={handleGoBack}
                        disabled={isLockingAnswer || isSending}
                        className="text-xs text-stone hover:text-charcoal transition-colors py-1 flex items-center gap-1"
                      >
                        <ArrowLeftIcon className="w-3.5 h-3.5" />
                        Previous
                      </button>
                    )}
                  </div>

                  {/* Center: Stepper dots + force advance */}
                  <div className="flex items-center gap-2">
                    {forceAdvanceMissingKeys && forceAdvanceMissingKeys.length > 0 ? (
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-gold/10 border border-gold/30 rounded-md">
                        <span className="text-[11px] text-charcoal">
                          Empty: {forceAdvanceMissingKeys.map(k => formatOutputKey(k)).join(', ')}
                        </span>
                        <button
                          onClick={handleForceAdvance}
                          disabled={isLockingAnswer}
                          className="text-[11px] font-medium text-teal hover:text-teal/80 transition-colors whitespace-nowrap"
                        >
                          Continue Anyway
                        </button>
                        <button
                          onClick={() => setForceAdvanceMissingKeys(null)}
                          className="text-[11px] text-stone hover:text-charcoal transition-colors"
                        >
                          Stay
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalQuestions }, (_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              i < currentQuestionIndex
                                ? 'bg-teal'
                                : i === currentQuestionIndex
                                  ? 'bg-teal w-3'
                                  : 'bg-stone/20'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-stone ml-2">
                          Q{currentQuestionIndex + 1} of {totalQuestions}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {canRequestStructure && !hasAnswerToLock && !allCurrentOutputsLocked && (
                      <Button
                        onClick={handleRequestStructure}
                        disabled={isSending}
                        variant="secondary"
                        className="text-xs px-3 py-1.5"
                      >
                        <SparklesIcon className="w-3.5 h-3.5 mr-1" />
                        Structure
                      </Button>
                    )}
                    {!hasAnswerToLock && !allCurrentOutputsLocked && currentQuestionIndex < totalQuestions - 1 && (
                      <button
                        type="button"
                        onClick={handleSkipQuestion}
                        disabled={isLockingAnswer || isSending}
                        className="text-xs text-stone hover:text-charcoal transition-colors py-1 flex items-center gap-1"
                      >
                        Skip
                        <ForwardIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(hasAnswerToLock || allCurrentOutputsLocked) && (
                      <Button
                        onClick={handleLockAnswer}
                        disabled={isLockingAnswer}
                        className="bg-teal hover:bg-teal/90 text-cream font-medium text-xs px-4 py-1.5"
                      >
                        {allCurrentOutputsLocked ? (
                          <>
                            <ArrowRightIcon className="w-3.5 h-3.5 mr-1" />
                            {isLockingAnswer ? 'Saving...' : 'Next Question'}
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-3.5 h-3.5 mr-1" />
                            {isLockingAnswer ? 'Saving...' : 'Save & Continue'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ) : undefined}
            />
          </div>
        </div>
      </div>

      {/* Progress Sidebar */}
      <ProgressSidebar
        isOpen={showProgressSidebar}
        onClose={() => setShowProgressSidebar(false)}
        phaseName={currentPhase.phase_name}
        phaseNumber={currentPhase.phase_number}
        totalQuestions={totalQuestions}
        currentQuestionIndex={currentQuestionIndex}
        phaseComplete={phaseComplete}
        questionOutputMap={numericQuestionOutputMap}
        questions={phaseTemplate.questions}
        outputs={outputs}
        organizationId={organizationId ?? undefined}
        onAiChat={handleAiChat}
        onManualEdit={handleManualEdit}
        onLockVariable={handleLockVariable}
        onUnlockVariable={handleUnlockVariable}
        savingKey={savingKey}
        lockingKey={lockingKey}
      />
    </div>
  );
}
