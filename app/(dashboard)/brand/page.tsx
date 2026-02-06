'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProgressTracker, ChatInterface, PhaseOutputs } from '@/components/brand';
import { Button } from '@/components/ui';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import type { PhaseStatus, Json } from '@/types/database';

interface Phase {
  id: string;
  phase_number: string;
  phase_name: string;
  status: PhaseStatus;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface BrandOutput {
  id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
}

export default function BrandEnginePage() {
  const supabase = createClient();

  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [outputs, setOutputs] = useState<BrandOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Load phases and organization
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get organization
      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership?.organization_id) return;
      setOrganizationId(membership.organization_id);

      // Get phases
      const { data: phasesData } = await supabase
        .from('brand_phases')
        .select('id, phase_number, phase_name, status')
        .eq('organization_id', membership.organization_id)
        .order('sort_order');

      if (phasesData) {
        setPhases(phasesData);

        // Set current phase (first in_progress or first not_started)
        const inProgress = phasesData.find(p => p.status === 'in_progress');
        const notStarted = phasesData.find(p => p.status === 'not_started');
        const current = inProgress || notStarted || phasesData[0];

        if (current) {
          setCurrentPhase(current);
        }
      }

      setIsLoading(false);
    }

    loadData();
  }, [supabase]);

  // Load conversation and outputs for current phase
  useEffect(() => {
    async function loadPhaseData() {
      if (!currentPhase || !organizationId) return;

      // Get conversation
      const { data: conversation } = await supabase
        .from('brand_conversations')
        .select('messages')
        .eq('organization_id', organizationId)
        .eq('phase_id', currentPhase.id)
        .single();

      setMessages((conversation?.messages as Message[]) || []);

      // Get outputs
      const { data: outputsData } = await supabase
        .from('brand_outputs')
        .select('id, output_key, output_value, is_locked')
        .eq('organization_id', organizationId)
        .eq('phase_id', currentPhase.id);

      setOutputs(outputsData || []);
    }

    loadPhaseData();
  }, [currentPhase, organizationId, supabase]);

  const handlePhaseClick = useCallback((phase: Phase) => {
    setCurrentPhase(phase);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!currentPhase || !organizationId) return;

    setIsSending(true);

    // Add user message to UI immediately
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/brand/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId: currentPhase.id,
          message,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update phase status if it was not_started
      if (currentPhase.status === 'not_started') {
        setPhases(prev =>
          prev.map(p =>
            p.id === currentPhase.id ? { ...p, status: 'in_progress' as PhaseStatus } : p
          )
        );
        setCurrentPhase(prev => prev ? { ...prev, status: 'in_progress' as PhaseStatus } : null);
      }

      // Check for new outputs in response
      if (data.outputs) {
        setOutputs(data.outputs);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    }

    setIsSending(false);
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

      if (data.error) {
        throw new Error(data.error);
      }

      // Update phases
      setPhases(prev =>
        prev.map(p =>
          p.id === currentPhase.id ? { ...p, status: 'locked' as PhaseStatus } : p
        )
      );

      // Move to next phase
      const currentIndex = phases.findIndex(p => p.id === currentPhase.id);
      if (currentIndex < phases.length - 1) {
        const nextPhase = phases[currentIndex + 1];
        setCurrentPhase(nextPhase);
      }

      // Update outputs as locked
      setOutputs(prev => prev.map(o => ({ ...o, is_locked: true })));
    } catch (error) {
      console.error('Error locking phase:', error);
    }

    setIsLocking(false);
  };

  const handleExportPlaybook = async () => {
    // TODO: Implement PDF export
    console.log('Export playbook');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  const allPhasesComplete = phases.every(p => p.status === 'locked' || p.status === 'completed');
  const hasOutputs = outputs.length > 0;
  const canLock = hasOutputs && currentPhase?.status !== 'locked';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md text-charcoal">Brand Engine</h1>
          <p className="text-body-lg text-stone mt-1">
            Build your complete brand strategy with AI guidance
          </p>
        </div>

        {allPhasesComplete && (
          <Button onClick={handleExportPlaybook} variant="secondary">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export Playbook
          </Button>
        )}
      </header>

      <div className="flex gap-6">
        {/* Left sidebar - Progress */}
        <div className="w-80 flex-shrink-0">
          <ProgressTracker
            phases={phases}
            currentPhaseId={currentPhase?.id}
            onPhaseClick={handlePhaseClick}
          />

          {hasOutputs && (
            <PhaseOutputs
              outputs={outputs}
              phaseName={currentPhase?.phase_name || ''}
              onLock={canLock ? handleLockPhase : undefined}
              isLocking={isLocking}
            />
          )}
        </div>

        {/* Main chat area */}
        <div className="flex-1">
          {currentPhase ? (
            <ChatInterface
              phase={currentPhase}
              messages={messages}
              isLoading={isSending}
              onSendMessage={handleSendMessage}
              onLockPhase={handleLockPhase}
              canLock={canLock}
            />
          ) : (
            <div className="flex items-center justify-center h-[60vh] text-stone">
              No phases available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
