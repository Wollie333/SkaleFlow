'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Textarea } from '@/components/ui';
import { SparklesIcon, UserIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  phase: {
    phase_number: string;
    phase_name: string;
  };
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onLockPhase?: () => void;
  canLock?: boolean;
}

export function ChatInterface({
  phase,
  messages,
  isLoading,
  onSendMessage,
  onLockPhase,
  canLock = false,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-xl border border-stone/10">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-md text-charcoal">
              Phase {phase.phase_number}: {phase.phase_name}
            </h2>
            <p className="text-body-sm text-stone mt-1">
              Answer the questions to complete this phase
            </p>
          </div>
          {canLock && (
            <Button onClick={onLockPhase} variant="secondary" size="sm">
              Lock Phase
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <SparklesIcon className="w-12 h-12 mx-auto text-teal/30 mb-4" />
            <p className="text-stone">
              Start the conversation to begin this phase
            </p>
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
              <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-4 h-4 text-teal" />
              </div>
            )}

            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'assistant'
                  ? 'bg-cream-warm text-charcoal'
                  : 'bg-teal text-cream'
              )}
            >
              <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                {formatMessage(message.content)}
              </div>
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
            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-teal animate-pulse" />
            </div>
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-stone/10">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 resize-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function formatMessage(content: string): React.ReactNode {
  // Handle YAML code blocks
  const parts = content.split(/(```yaml[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```yaml')) {
      const yaml = part.replace(/```yaml\n?/, '').replace(/\n?```$/, '');
      return (
        <pre key={i} className="bg-dark/5 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
          {yaml}
        </pre>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
