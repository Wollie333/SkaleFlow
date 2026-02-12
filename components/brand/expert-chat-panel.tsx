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
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { ModelSelector } from '@/components/ai/model-selector';
import { formatFileSize, parseYamlPreview } from '@/lib/brand/format-utils';
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
  expertise: string;
  avatarUrl: string;
  avatarInitials: string;
  avatarColor: string;
}

interface ExpertChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string, files?: File[]) => void;
  onStopGeneration?: () => void;
  agent?: AgentInfo;
  phaseComplete: boolean;
  nextPhaseName?: string;
  onGoToNextPhase?: () => void;
  // Model selector
  selectedModelId?: string | null;
  onModelChange?: (modelId: string) => void;
  models?: ClientModelOption[];
  creditBalance?: { totalRemaining: number; hasCredits: boolean } | null;
  providerStatuses?: Record<string, 'active' | 'offline'>;
  phaseCreditsUsed?: number;
  // Extraction accept — messageIndex is the position in the messages array
  onAcceptExtraction?: (messageIndex: number, outputKey: string, value: string) => void;
  acceptedExtractions?: Set<string>;
}

export function ExpertChatPanel({
  messages,
  isLoading,
  onSendMessage,
  onStopGeneration,
  agent,
  phaseComplete,
  nextPhaseName,
  onGoToNextPhase,
  selectedModelId,
  onModelChange,
  models,
  creditBalance,
  providerStatuses,
  phaseCreditsUsed,
  onAcceptExtraction,
  acceptedExtractions,
}: ExpertChatPanelProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, isSupported, transcript, start, stop, reset } = useSpeechToText();
  const inputBeforeListeningRef = useRef('');

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
      const isSmallEnough = f.size <= 10 * 1024 * 1024;
      return (isImage || isPdf) && isSmallEnough;
    });
    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = '';
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
    <div className="flex flex-col h-full bg-white rounded-xl border border-stone/10 overflow-hidden">
      {/* Agent header */}
      <div className="px-5 py-3 border-b border-stone/10 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {agent ? (
              <img
                src={agent.avatarUrl}
                alt={agent.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-teal" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">
                {agent?.name || 'AI Strategist'}
              </p>
              <p className="text-[11px] text-stone truncate">
                {agent?.title || 'Brand strategy expert'}
              </p>
            </div>
          </div>

          {/* Model selector + credits */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {models && models.length > 0 && onModelChange && (
              <>
                <ModelSelector
                  models={models}
                  selectedModelId={selectedModelId || null}
                  onSelect={onModelChange}
                  compact
                  providerStatuses={providerStatuses}
                />
                {creditBalance && (
                  <span className={cn(
                    'text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
                    selectedModelId && models.find(m => m.id === selectedModelId)?.isFree
                      ? 'bg-teal/10 text-teal'
                      : creditBalance.hasCredits
                        ? 'bg-stone/10 text-stone'
                        : 'bg-red-50 text-red-500'
                  )}>
                    {selectedModelId && models.find(m => m.id === selectedModelId)?.isFree
                      ? 'Free'
                      : `${creditBalance.totalRemaining.toLocaleString()} cr`}
                  </span>
                )}
                {phaseCreditsUsed !== undefined && phaseCreditsUsed > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-gold/10 text-gold">
                    Phase: {phaseCreditsUsed.toLocaleString()} cr
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4">
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
                <p className="text-body-sm text-stone mt-1 max-w-sm mx-auto">
                  {agent.expertise}
                </p>
                <p className="text-xs text-stone/50 mt-3">
                  Start the conversation or use the quick-answer option
                </p>
              </>
            ) : (
              <>
                <SparklesIcon className="w-12 h-12 mx-auto text-teal/30 mb-4" />
                <p className="text-stone">Start the conversation to begin</p>
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
                  {message.role === 'assistant'
                    ? formatAssistantMessage(message.content, i, onAcceptExtraction, acceptedExtractions)
                    : message.content}
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
                <div className="w-2 h-2 bg-stone/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-stone/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-stone/10">
        {phaseComplete ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-center gap-2 text-teal">
              <LockClosedIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Phase complete</span>
            </div>
            {nextPhaseName && onGoToNextPhase && (
              <Button
                onClick={onGoToNextPhase}
                className="w-full bg-teal hover:bg-teal/90 text-cream font-medium"
              >
                Continue to {nextPhaseName}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <>
            {isListening && (
              <div className="flex items-center gap-2 mb-2 text-teal text-sm">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                Listening...
              </div>
            )}

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

            <form onSubmit={handleSubmit} className="flex items-end gap-2 w-full">
              <div className="flex-1 flex items-end gap-2 bg-cream-warm rounded-2xl px-3 py-2 border border-stone/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Attach images or PDFs"
                  className="p-2 h-auto hover:bg-teal/10 shrink-0"
                >
                  <PaperClipIcon className="w-5 h-5 text-stone hover:text-teal" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Textarea
                  ref={textareaRef}
                  value={isListening ? (input + (input && !input.endsWith(' ') ? ' ' : '') + transcript) : input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 resize-none !py-2 !px-0 !bg-transparent !border-0 !ring-0 !outline-none !shadow-none !min-h-0 text-sm placeholder:text-stone/50"
                  disabled={isLoading}
                  readOnly={isListening}
                />
                {isSupported && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleMicClick}
                    disabled={isLoading}
                    className={cn(
                      'p-2 h-auto shrink-0',
                      isListening ? 'bg-teal/10 text-teal animate-pulse' : 'hover:bg-teal/10'
                    )}
                  >
                    {isListening ? (
                      <StopIcon className="w-5 h-5 text-teal" />
                    ) : (
                      <MicrophoneIcon className="w-5 h-5 text-stone hover:text-teal" />
                    )}
                  </Button>
                )}
              </div>
              {isLoading && onStopGeneration ? (
                <Button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-3 h-auto rounded-full bg-red-500 hover:bg-red-600 text-white shrink-0"
                  title="Stop generating"
                >
                  <StopIcon className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={(!input.trim() && attachments.length === 0) || isLoading || isListening}
                  className="p-3 sm:p-3.5 h-auto rounded-full bg-teal hover:bg-teal/90 disabled:bg-stone/20 disabled:opacity-50 shrink-0 text-white shadow-md"
                  title="Send message"
                >
                  <PaperAirplaneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Format assistant messages — render YAML code blocks as green extraction cards
 * with Accept Extraction buttons for each variable.
 */
function formatAssistantMessage(
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
