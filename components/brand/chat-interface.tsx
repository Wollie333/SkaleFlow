'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Textarea } from '@/components/ui';
import {
  SparklesIcon,
  UserIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  CheckIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { LogoUpload } from './logo-upload';
import { BrandAssetsUpload } from './brand-assets-upload';
import { ModelSelector } from '@/components/ai/model-selector';
import type { ClientModelOption } from '@/lib/ai/models';

interface Attachment {
  name: string;
  type: string;
  size: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  modelName?: string;
}

interface AgentInfo {
  name: string;
  title: string;
  avatarUrl: string;
  avatarInitials: string;
  avatarColor: string;
}

interface ChatInterfaceProps {
  phase: {
    phase_number: string;
    phase_name: string;
  };
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string, files?: File[]) => void;
  onLockPhase?: () => void;
  canLock?: boolean;
  totalQuestions: number;
  currentQuestionIndex: number;
  onLockAnswer?: () => void;
  hasAnswerToLock: boolean;
  isLockingAnswer?: boolean;
  canRequestStructure?: boolean;
  onRequestStructure?: () => void;
  onSkipQuestion?: () => void;
  organizationId?: string;
  onLogoUploaded?: (url: string) => void;
  selectedModelId?: string | null;
  onModelChange?: (modelId: string) => void;
  models?: ClientModelOption[];
  creditBalance?: { totalRemaining: number; hasCredits: boolean } | null;
  providerStatuses?: Record<string, 'active' | 'offline'>;
  agent?: AgentInfo;
  onGoToNextPhase?: () => void;
  nextPhaseName?: string;
  onViewPlaybook?: () => void;
  // Extraction accept
  onAcceptExtraction?: (messageIndex: number, outputKey: string, value: string) => void;
  acceptedExtractions?: Set<string>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseYamlPreview(yaml: string): Array<{ key: string; value: string }> {
  const pairs: Array<{ key: string; value: string }> = [];
  const lines = yaml.split('\n');
  let currentKey = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);

    if (keyMatch && !line.startsWith('  ')) {
      // Save previous key if exists
      if (currentKey) {
        pairs.push({ key: currentKey, value: currentLines.join('\n').trim() });
      }
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      if (value === '' || value === '|' || value === '|-') {
        currentLines = [];
      } else {
        currentLines = [value];
      }
    } else if (currentKey) {
      // Continuation line (indented array items or multiline)
      const trimmed = line.startsWith('  - ') ? line.substring(4).trim() : line.trim();
      if (trimmed) {
        currentLines.push(trimmed);
      }
    }
  }

  // Save last key
  if (currentKey) {
    pairs.push({ key: currentKey, value: currentLines.join('\n').trim() });
  }

  return pairs;
}

export function ChatInterface({
  phase,
  messages,
  isLoading,
  onSendMessage,
  totalQuestions,
  currentQuestionIndex,
  onLockAnswer,
  hasAnswerToLock,
  isLockingAnswer = false,
  canRequestStructure = false,
  onRequestStructure,
  onSkipQuestion,
  organizationId,
  onLogoUploaded,
  selectedModelId,
  onModelChange,
  models,
  creditBalance,
  providerStatuses,
  agent,
  onGoToNextPhase,
  nextPhaseName,
  onViewPlaybook,
  onAcceptExtraction,
  acceptedExtractions,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, isSupported, transcript, start, stop, reset } = useSpeechToText();
  const inputBeforeListeningRef = useRef('');

  const phaseComplete = currentQuestionIndex >= totalQuestions;

  // When recording stops, append the transcript to whatever was in the input
  useEffect(() => {
    if (!isListening && transcript) {
      const base = inputBeforeListeningRef.current;
      const separator = base && !base.endsWith(' ') ? ' ' : '';
      setInput(base + separator + transcript);
      reset();
    }
  }, [isListening, transcript, reset]);

  const handleMicClick = () => {
    if (isListening) {
      stop();
    } else {
      inputBeforeListeningRef.current = input;
      start();
    }
  };

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type);
      const isPdf = f.type === 'application/pdf';
      const isSmallEnough = f.size <= 10 * 1024 * 1024; // 10MB
      return (isImage || isPdf) && isSmallEnough;
    });
    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset so same file can be re-selected
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-md text-charcoal">
              Phase {phase.phase_number}: {phase.phase_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {agent && (
                <div className="flex items-center gap-1.5">
                  <img
                    src={agent.avatarUrl}
                    alt={agent.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="text-body-sm text-stone">
                    Guided by {agent.name}
                  </span>
                  <span className="text-stone/30">·</span>
                </div>
              )}
              <p className="text-body-sm text-stone">
                {phaseComplete
                  ? 'All questions completed — phase locked'
                  : `Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
              </p>
            </div>
          </div>
          {/* Model selector + credit balance */}
          {models && models.length > 0 && onModelChange && (
            <div className="flex items-center gap-3">
              <ModelSelector
                models={models}
                selectedModelId={selectedModelId || null}
                onSelect={onModelChange}
                compact
                providerStatuses={providerStatuses}
              />
              {creditBalance && (
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  selectedModelId && models.find(m => m.id === selectedModelId)?.isFree
                    ? 'bg-teal/10 text-teal'
                    : creditBalance.hasCredits
                      ? 'bg-stone/10 text-stone'
                      : 'bg-red-50 text-red-500'
                )}>
                  {selectedModelId && models.find(m => m.id === selectedModelId)?.isFree
                    ? 'Free model'
                    : `${creditBalance.totalRemaining.toLocaleString()} credits`}
                </span>
              )}
            </div>
          )}

          {/* Progress circles */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const isCompleted = i < currentQuestionIndex;
              const isCurrent = i === currentQuestionIndex && !phaseComplete;
              return (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all duration-300',
                    isCompleted && 'bg-teal',
                    isCurrent && 'bg-teal/30 ring-2 ring-teal ring-offset-1',
                    !isCompleted && !isCurrent && 'bg-stone/20'
                  )}
                  title={`Question ${i + 1}${isCompleted ? ' (locked)' : isCurrent ? ' (current)' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Logo upload for Phase 7, Question 0 */}
      {phase.phase_number === '7' && currentQuestionIndex === 0 && !phaseComplete && organizationId && (
        <div className="px-6 py-3 border-b border-stone/10 bg-stone/5">
          <LogoUpload
            organizationId={organizationId}
            onLogoUploaded={(url) => onLogoUploaded?.(url)}
          />
        </div>
      )}

      {/* Visual assets upload for Phase 7 */}
      {phase.phase_number === '7' && !phaseComplete && organizationId && (
        <div className="px-6 py-3 border-b border-stone/10 bg-stone/5">
          <p className="text-xs font-semibold text-charcoal mb-2">Visual Assets</p>
          <BrandAssetsUpload organizationId={organizationId} />
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            {agent ? (
              <>
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4"
                />
                <p className="text-charcoal font-medium">
                  {agent.name} is ready to guide you
                </p>
                <p className="text-body-sm text-stone mt-1">
                  {agent.title}
                </p>
              </>
            ) : (
              <>
                <SparklesIcon className="w-12 h-12 mx-auto text-teal/30 mb-4" />
                <p className="text-stone">
                  Start the conversation to begin this phase
                </p>
              </>
            )}
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3',
              message.role === 'user' && 'justify-end'
            )}
          >
            {message.role === 'assistant' && (
              agent ? (
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-4 h-4 text-teal" />
                </div>
              )
            )}

            <div className="flex flex-col max-w-[80%]">
              <div
                className={cn(
                  'rounded-2xl px-4 py-3',
                  message.role === 'assistant'
                    ? 'bg-cream-warm text-charcoal'
                    : 'bg-teal text-cream'
                )}
              >
                {/* Show attachment badges */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {message.attachments.map((att, j) => (
                      <span
                        key={j}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                          message.role === 'user'
                            ? 'bg-cream/20 text-cream'
                            : 'bg-dark/10 text-charcoal'
                        )}
                      >
                        {att.type.startsWith('image/') ? (
                          <PhotoIcon className="w-3 h-3" />
                        ) : (
                          <DocumentIcon className="w-3 h-3" />
                        )}
                        {att.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                  {formatMessage(message.content, i, onAcceptExtraction, acceptedExtractions)}
                </div>
              </div>
              {message.role === 'assistant' && (agent || message.modelName) && (
                <span className="text-[10px] text-stone/50 mt-1 ml-1">
                  {agent ? agent.name : ''}{agent && message.modelName ? ' · via ' : ''}{message.modelName || ''}
                </span>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-stone/10 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-stone" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            {agent ? (
              <img
                src={agent.avatarUrl}
                alt={agent.name}
                className="w-8 h-8 rounded-full flex-shrink-0 animate-pulse"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-teal animate-pulse" />
              </div>
            )}
            <div className="bg-cream-warm rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-stone/40 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-stone/40 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-stone/40 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Input area */}
      <div className="p-4 border-t border-stone/10">
        {phaseComplete ? (
          <div className="space-y-3 py-3">
            <div className="flex items-center justify-center gap-2 text-teal">
              <LockClosedIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Phase complete — all answers locked</span>
            </div>
            {nextPhaseName && onGoToNextPhase ? (
              <Button
                onClick={onGoToNextPhase}
                className="w-full bg-teal hover:bg-teal/90 text-cream font-medium"
              >
                Continue to {nextPhaseName}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            ) : onViewPlaybook ? (
              <Button
                onClick={onViewPlaybook}
                className="w-full bg-teal hover:bg-teal/90 text-cream font-medium"
              >
                View Brand Playbook
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Save & Continue button — prominent green, shown when AI has produced YAML outputs */}
            {hasAnswerToLock && (
              <div className="mb-3">
                <Button
                  onClick={onLockAnswer}
                  disabled={isLockingAnswer}
                  className="w-full bg-teal hover:bg-teal/90 text-cream font-medium"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {isLockingAnswer ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            )}

            {isListening && (
              <div className="flex items-center gap-2 mb-2 text-teal text-sm">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                Listening...
              </div>
            )}

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-stone/5 border border-stone/10 rounded-lg px-3 py-1.5 text-sm text-charcoal"
                  >
                    {file.type.startsWith('image/') ? (
                      <PhotoIcon className="w-5 h-5 text-teal" />
                    ) : (
                      <DocumentIcon className="w-5 h-5 text-stone" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate max-w-[150px]">{file.name}</p>
                      <p className="text-xs text-stone">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-stone hover:text-charcoal ml-1"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Textarea
                ref={textareaRef}
                value={isListening ? (input + (input && !input.endsWith(' ') ? ' ' : '') + transcript) : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                rows={1}
                className="flex-1 resize-none !py-2.5 !rounded-lg !min-h-0"
                disabled={isLoading}
                readOnly={isListening}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach images or PDFs"
              >
                <PaperClipIcon className="w-4 h-4" />
              </Button>
              {isSupported && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleMicClick}
                  disabled={isLoading}
                  className={cn(
                    isListening && 'bg-teal/10 text-teal animate-pulse'
                  )}
                >
                  {isListening ? (
                    <StopIcon className="w-4 h-4" />
                  ) : (
                    <MicrophoneIcon className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading || isListening}
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function formatMessage(
  content: string,
  messageIndex: number,
  onAcceptExtraction?: (messageIndex: number, outputKey: string, value: string) => void,
  acceptedExtractions?: Set<string>,
): React.ReactNode {
  const parts = content.split(/(```yaml[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```yaml')) {
      const yaml = part.replace(/```yaml\n?/, '').replace(/\n?```$/, '');
      const pairs = parseYamlPreview(yaml);

      if (pairs.length === 0) {
        return (
          <pre key={i} className="bg-dark/5 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
            {yaml}
          </pre>
        );
      }

      return (
        <div key={i} className="space-y-2 my-3">
          {pairs.map(({ key, value }) => {
            const extractionId = `${messageIndex}:${key}`;
            const isAccepted = acceptedExtractions?.has(extractionId);
            return (
              <div
                key={key}
                className="bg-emerald-50 border border-emerald-200 rounded-lg p-3"
              >
                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">
                  {value}
                </div>
                {onAcceptExtraction && (
                  <button
                    type="button"
                    onClick={() => onAcceptExtraction(messageIndex, key, value)}
                    disabled={isAccepted}
                    className={cn(
                      'mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors',
                      isAccepted
                        ? 'bg-emerald-100 text-emerald-600 cursor-default'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    )}
                  >
                    {isAccepted ? (
                      <>
                        <CheckBadgeIcon className="w-3.5 h-3.5" />
                        Accepted
                      </>
                    ) : (
                      'Accept Extraction'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
