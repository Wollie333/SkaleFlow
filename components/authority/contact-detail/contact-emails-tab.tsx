'use client';

import { useState, useEffect, useCallback } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { EmailThreadView } from './email-thread-view';
import { EmailComposeModal } from './email-compose-modal';

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

interface ContactEmailsTabProps {
  contactId: string;
  contactEmail: string | null;
  contactName: string;
  organizationId: string;
  hasGmail: boolean;
}

export function ContactEmailsTab({ contactId, contactEmail, contactName, organizationId, hasGmail }: ContactEmailsTabProps) {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<{ subject: string; messageId: string; threadId: string } | null>(null);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/authority/contacts/${contactId}/emails`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      }
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => { loadEmails(); }, [loadEmails]);

  const handleReply = (msg: EmailMessage) => {
    setReplyTo({
      subject: msg.email_subject || '',
      messageId: msg.email_message_id || '',
      threadId: msg.email_thread_id || '',
    });
    setShowCompose(true);
  };

  return (
    <div className="space-y-4">
      {/* Compose button */}
      {hasGmail && contactEmail && (
        <button
          onClick={() => { setReplyTo(null); setShowCompose(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors"
        >
          <EnvelopeIcon className="w-4 h-4" />
          Compose Email
        </button>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal" />
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12">
          <EnvelopeIcon className="w-10 h-10 mx-auto text-stone/30 mb-3" />
          <p className="text-sm text-stone">No email conversations yet</p>
          {hasGmail && contactEmail && (
            <p className="text-xs text-stone/60 mt-1">Send an email to start a conversation</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <EmailThreadView key={thread.threadId} thread={thread} onReply={handleReply} />
          ))}
        </div>
      )}

      {/* Compose Modal */}
      <EmailComposeModal
        isOpen={showCompose}
        onClose={() => { setShowCompose(false); setReplyTo(null); }}
        organizationId={organizationId}
        contactId={contactId}
        contactEmail={contactEmail}
        contactName={contactName}
        replyTo={replyTo}
        onSent={loadEmails}
      />
    </div>
  );
}
