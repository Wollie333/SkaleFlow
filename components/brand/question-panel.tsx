'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ForwardIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { PhaseNavDropdown } from './phase-nav-dropdown';
import { QuestionStepper } from './question-stepper';
import { VariablePreviewCard } from './variable-preview-card';
import { LogoUpload } from './logo-upload';
import type { PhaseStatus, Json } from '@/types/database';

interface Phase {
  id: string;
  phase_number: string;
  phase_name: string;
  status: PhaseStatus;
  current_question_index: number;
}

interface BrandOutput {
  id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
}

interface AgentInfo {
  name: string;
  title: string;
  expertise: string;
  avatarUrl: string;
}

interface QuestionPanelProps {
  phases: Phase[];
  currentPhase: Phase;
  onPhaseClick: (phase: { id: string; phase_number: string; phase_name: string; status: PhaseStatus }) => void;
  totalQuestions: number;
  currentQuestionIndex: number;
  currentQuestionText?: string;
  currentOutputKeys: string[];
  allOutputKeys: string[];
  outputs: BrandOutput[];
  agent?: AgentInfo;
  hasAnswerToLock: boolean;
  isLockingAnswer: boolean;
  onLockAnswer: () => void;
  canRequestStructure: boolean;
  onRequestStructure: () => void;
  onSkipQuestion: () => void;
  onGoBack?: () => void;
  onAiChat: (outputKey: string) => void;
  onManualEdit: (outputKey: string, newValue: string) => Promise<void> | void;
  onLockVariable: (outputKey: string) => void;
  onUnlockVariable: (outputKey: string) => void;
  savingKey?: string | null;
  lockingKey?: string | null;
  onQuickAnswer: (answer: string) => void;
  isSending: boolean;
  // Logo upload (Phase 7 only)
  organizationId?: string;
  onLogoUploaded?: (url: string) => void;
  // Phase complete state
  phaseComplete: boolean;
  nextPhase?: { phase_number: string; phase_name: string } | null;
  onGoToNextPhase?: () => void;
}

export function QuestionPanel({
  phases,
  currentPhase,
  onPhaseClick,
  totalQuestions,
  currentQuestionIndex,
  currentQuestionText,
  currentOutputKeys,
  allOutputKeys,
  outputs,
  agent,
  hasAnswerToLock,
  isLockingAnswer,
  onLockAnswer,
  canRequestStructure,
  onRequestStructure,
  onSkipQuestion,
  onGoBack,
  onAiChat,
  onManualEdit,
  onLockVariable,
  onUnlockVariable,
  savingKey,
  lockingKey,
  onQuickAnswer,
  isSending,
  organizationId,
  onLogoUploaded,
  phaseComplete,
  nextPhase,
  onGoToNextPhase,
}: QuestionPanelProps) {
  const [quickAnswer, setQuickAnswer] = useState('');
  const [isQuickAnswerOpen, setIsQuickAnswerOpen] = useState(false);

  const handleQuickSubmit = () => {
    if (quickAnswer.trim() && !isSending) {
      onQuickAnswer(quickAnswer.trim());
      setQuickAnswer('');
      setIsQuickAnswerOpen(false);
    }
  };

  const outputMap = new Map(outputs.map(o => [o.output_key, o]));

  // All outputs for the current question exist and are locked (individually)
  const allCurrentOutputsLocked = currentOutputKeys.length > 0 &&
    currentOutputKeys.every(key => {
      const o = outputMap.get(key);
      return o && o.is_locked;
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Phase navigation dropdown */}
        <PhaseNavDropdown
          phases={phases}
          currentPhaseId={currentPhase.id}
          onPhaseClick={onPhaseClick}
        />

        {/* Question stepper */}
        <div className="flex items-center justify-center">
          <QuestionStepper
            totalQuestions={totalQuestions}
            currentQuestionIndex={currentQuestionIndex}
            phaseComplete={phaseComplete}
          />
        </div>

        {/* Agent intro */}
        {agent && !phaseComplete && (
          <div className="flex items-center gap-2.5">
            <img
              src={agent.avatarUrl}
              alt={agent.name}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-charcoal">{agent.name}</p>
              <p className="text-[11px] text-stone truncate">{agent.title}</p>
            </div>
          </div>
        )}

        {phaseComplete ? (
          /* Phase complete state */
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto">
              <CheckIcon className="w-6 h-6 text-teal" />
            </div>
            <div>
              <p className="text-sm font-medium text-teal">Done</p>
              <p className="text-xs text-stone mt-1">All questions completed. Unlock any variable to edit.</p>
            </div>
            {nextPhase && onGoToNextPhase ? (
              <Button
                onClick={onGoToNextPhase}
                className="w-full bg-teal hover:bg-teal/90 text-cream font-medium"
              >
                Continue to Phase {nextPhase.phase_number}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            ) : null}

            {/* Show all phase variables — locked ones can be unlocked, unlocked ones can be edited */}
            <div className="text-left space-y-2 mt-4">
              <p className="text-xs font-medium text-stone uppercase tracking-wider">Phase variables</p>
              {allOutputKeys.map(key => {
                const output = outputMap.get(key);
                return (
                  <VariablePreviewCard
                    key={key}
                    outputKey={key}
                    value={output?.output_value}
                    isLocked={output?.is_locked ?? false}
                    isEmpty={!output}
                    onAiChat={onAiChat}
                    onManualEdit={onManualEdit}
                    onLock={onLockVariable}
                    onUnlock={onUnlockVariable}
                    isSaving={savingKey === key}
                    isLocking={lockingKey === key}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Question focus card */}
            {currentQuestionText && (
              <div className="bg-cream-warm border-l-4 border-teal rounded-r-lg p-4">
                <p className="text-[11px] font-semibold text-teal uppercase tracking-wider mb-1.5">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
                <p className="text-sm text-charcoal leading-relaxed">
                  {currentQuestionText}
                </p>
                {currentOutputKeys.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {currentOutputKeys.map(key => {
                      const output = outputMap.get(key);
                      const filled = !!output && !output.is_locked;
                      const locked = output?.is_locked ?? false;
                      return (
                        <span
                          key={key}
                          className={cn(
                            'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium',
                            locked
                              ? 'bg-teal/15 text-teal'
                              : filled
                                ? 'bg-teal/10 text-teal'
                                : 'bg-stone/10 text-stone'
                          )}
                        >
                          {locked && <LockClosedIcon className="w-2.5 h-2.5" />}
                          {key.replace(/_/g, ' ')}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Logo upload for Phase 7, Question 0 */}
            {currentPhase.phase_number === '7' && currentQuestionIndex === 0 && organizationId && onLogoUploaded && (
              <div className="border border-stone/10 rounded-lg p-3 bg-white">
                <LogoUpload
                  organizationId={organizationId}
                  onLogoUploaded={onLogoUploaded}
                />
              </div>
            )}

            {/* Quick-answer option */}
            <div className="border border-stone/10 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setIsQuickAnswerOpen(!isQuickAnswerOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-cream-warm/50 transition-colors"
              >
                <span className="text-xs font-medium text-stone">
                  Know your answer? Type it directly
                </span>
                {isQuickAnswerOpen ? (
                  <ChevronUpIcon className="w-4 h-4 text-stone" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-stone" />
                )}
              </button>
              {isQuickAnswerOpen && (
                <div className="p-3 border-t border-stone/10 bg-white">
                  <textarea
                    value={quickAnswer}
                    onChange={(e) => setQuickAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={3}
                    className="w-full text-sm border border-stone/15 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/30"
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleQuickSubmit}
                    disabled={!quickAnswer.trim() || isSending}
                    className="w-full mt-2 text-sm"
                    variant="secondary"
                  >
                    Submit answer
                  </Button>
                </div>
              )}
            </div>

            {/* Variable preview cards for current question */}
            {currentOutputKeys.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-stone uppercase tracking-wider">
                  Expected outputs
                </p>
                {currentOutputKeys.map(key => {
                  const output = outputMap.get(key);
                  return (
                    <VariablePreviewCard
                      key={key}
                      outputKey={key}
                      value={output?.output_value}
                      isLocked={output?.is_locked ?? false}
                      isEmpty={!output}
                      onAiChat={onAiChat}
                      onManualEdit={onManualEdit}
                      onLock={onLockVariable}
                      onUnlock={onUnlockVariable}
                      isSaving={savingKey === key}
                      isLocking={lockingKey === key}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom action bar — sticky */}
      {!phaseComplete && (
        <div className="border-t border-stone/10 p-4 bg-white space-y-2">
          {allCurrentOutputsLocked ? (
            /* All outputs individually locked — just advance */
            <>
              <Button
                onClick={onLockAnswer}
                disabled={isLockingAnswer}
                className="w-full bg-teal hover:bg-teal/90 text-cream font-medium"
              >
                <ArrowRightIcon className="w-4 h-4 mr-2" />
                {isLockingAnswer ? 'Saving...' : 'Continue to Next Question'}
              </Button>
              {onGoBack && currentQuestionIndex > 0 && (
                <button
                  type="button"
                  onClick={onGoBack}
                  disabled={isLockingAnswer || isSending}
                  className="w-full text-xs text-stone hover:text-charcoal transition-colors py-1.5"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5 inline mr-1" />
                  Previous question
                </button>
              )}
            </>
          ) : hasAnswerToLock ? (
            <>
              <Button
                onClick={onLockAnswer}
                disabled={isLockingAnswer}
                className="w-full bg-teal hover:bg-teal/90 text-cream font-medium"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                {isLockingAnswer ? 'Saving...' : 'Confirm & Continue'}
              </Button>
              {onGoBack && currentQuestionIndex > 0 && (
                <button
                  type="button"
                  onClick={onGoBack}
                  disabled={isLockingAnswer || isSending}
                  className="w-full text-xs text-stone hover:text-charcoal transition-colors py-1.5"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5 inline mr-1" />
                  Previous question
                </button>
              )}
            </>
          ) : null}
          {canRequestStructure && !hasAnswerToLock && !allCurrentOutputsLocked && (
            <Button
              onClick={onRequestStructure}
              disabled={isSending}
              className="w-full"
              variant="secondary"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Structure my answer
            </Button>
          )}
          {!hasAnswerToLock && !allCurrentOutputsLocked && (
            <div className="flex items-center justify-center gap-4">
              {onGoBack && currentQuestionIndex > 0 && (
                <button
                  type="button"
                  onClick={onGoBack}
                  disabled={isLockingAnswer || isSending}
                  className="text-xs text-stone hover:text-charcoal transition-colors py-1.5"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5 inline mr-1" />
                  Previous question
                </button>
              )}
              {currentQuestionIndex < totalQuestions - 1 && (
                <button
                  type="button"
                  onClick={onSkipQuestion}
                  disabled={isLockingAnswer || isSending}
                  className="text-xs text-stone hover:text-charcoal transition-colors py-1.5"
                >
                  <ForwardIcon className="w-3.5 h-3.5 inline mr-1" />
                  Skip this question
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
