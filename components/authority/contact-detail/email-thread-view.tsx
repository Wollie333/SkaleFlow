'use client';

import { useState } from 'react';
import { ArrowUturnLeftIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface EmailMessage {
  id: string;
  email_from: string | null;
  email_to: string | null;
  email_cc: string | null;
  email_subject: string | null;
  email_body_text: string | null;
  email_body_html: string | null;
  email_message_id: string | null;
  email_thread_id: string | null;
  direction: string | null;
  occurred_at: string;
}

interface EmailThread {
  threadId: string;
  subject: string;
  messageCount: number;
  latestDate: string;
  messages: EmailMessage[];
}

interface EmailThreadViewProps {
  thread: EmailThread;
  onReply: (message: EmailMessage) => void;
}

export function EmailThreadView({ thread, onReply }: EmailThreadViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const latestMessage = thread.messages[thread.messages.length - 1];
  const previewText = latestMessage?.email_body_text?.slice(0, 120) || '';

  return (
    <div className="bg-white border border-stone/10 rounded-xl overflow-hidden">
      {/* Thread Header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-3 p-4 hover:bg-cream-warm/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-charcoal truncate">{thread.subject}</p>
            {thread.messageCount > 1 && (
              <span className="text-[10px] text-stone bg-stone/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {thread.messageCount}
              </span>
            )}
          </div>
          {!isExpanded && (
            <p className="text-xs text-stone mt-0.5 truncate">{previewText}...</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-stone">
            {new Date(thread.latestDate).toLocaleDateString()}
          </span>
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 text-stone" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-stone" />
          )}
        </div>
      </button>

      {/* Expanded: all messages */}
      {isExpanded && (
        <div className="border-t border-stone/10">
          {thread.messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={cn(
                'p-4',
                idx > 0 && 'border-t border-stone/5'
              )}
            >
              {/* Message header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-semibold',
                      msg.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'
                    )}>
                      {msg.direction === 'inbound' ? 'Received' : 'Sent'}
                    </span>
                    <span className="text-[10px] text-stone">
                      {new Date(msg.occurred_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-stone mt-0.5">
                    From: {msg.email_from || '—'} &rarr; To: {msg.email_to || '—'}
                  </p>
                  {msg.email_cc && (
                    <p className="text-[10px] text-stone">CC: {msg.email_cc}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onReply(msg); }}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-teal border border-teal/20 rounded hover:bg-teal/5 transition-colors"
                  title="Reply"
                >
                  <ArrowUturnLeftIcon className="w-3 h-3" />
                  Reply
                </button>
              </div>

              {/* Message body */}
              <div className="mt-2">
                {msg.email_body_html ? (
                  <div
                    className="text-xs text-charcoal leading-relaxed prose prose-xs max-w-none [&_*]:text-xs"
                    dangerouslySetInnerHTML={{ __html: msg.email_body_html }}
                  />
                ) : (
                  <pre className="text-xs text-charcoal leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.email_body_text || '(No content)'}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
