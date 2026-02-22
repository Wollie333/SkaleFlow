'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  contactId?: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
  cardId?: string | null;
  replyTo?: {
    subject: string;
    messageId: string;
    threadId: string;
  } | null;
  prefillSubject?: string;
  prefillBody?: string;
  onSent?: () => void;
}

export function EmailComposeModal({
  isOpen,
  onClose,
  organizationId,
  contactId,
  contactEmail,
  contactName,
  cardId,
  replyTo,
  prefillSubject,
  prefillBody,
  onSent,
}: EmailComposeModalProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo(contactEmail || '');
      setCc('');
      setBcc('');
      setSubject(
        prefillSubject ||
        (replyTo ? (replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`) : '')
      );
      setBody(prefillBody || '');
      setError(null);
    }
  }, [isOpen, contactEmail, replyTo, prefillSubject, prefillBody]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!to || !subject) {
      setError('To and Subject are required');
      return;
    }
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/authority/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          contactId: contactId || null,
          cardId: cardId || null,
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          bodyText: body,
          bodyHtml: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${body.replace(/\n/g, '<br/>')}</div>`,
          inReplyTo: replyTo?.messageId || undefined,
          threadId: replyTo?.threadId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send email');
        return;
      }

      onSent?.();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-cream-warm rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-serif font-semibold text-charcoal">
            {replyTo ? 'Reply' : 'Compose Email'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-cream rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* To */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">To *</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              placeholder="recipient@example.com"
            />
            {contactName && to === contactEmail && (
              <p className="text-xs text-stone mt-0.5">{contactName}</p>
            )}
          </div>

          {/* CC / BCC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">CC</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                placeholder="cc@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">BCC</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                placeholder="bcc@example.com"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              placeholder="Email subject"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
              placeholder="Write your email..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !to || !subject}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors disabled:opacity-50"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send via Gmail'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
