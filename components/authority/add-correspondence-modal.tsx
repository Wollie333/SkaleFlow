'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { AuthorityCorrespondenceType, AuthorityCorrespondenceDirection } from '@/lib/authority/types';

interface Contact {
  id: string;
  full_name: string;
  email?: string | null;
}

interface AddCorrespondenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    correspondence_type: AuthorityCorrespondenceType;
    direction: AuthorityCorrespondenceDirection;
    subject: string;
    body: string;
    contact_id: string | null;
    occurred_at: string;
  }) => Promise<void>;
  contacts: Contact[];
  defaultContactId?: string | null;
  hasGmail?: boolean;
  organizationId?: string;
  onEmailSent?: () => void;
}

const TYPES: { value: AuthorityCorrespondenceType; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'other', label: 'Other' },
];

const DIRECTIONS: { value: AuthorityCorrespondenceDirection; label: string }[] = [
  { value: 'outbound', label: 'Outbound (I sent)' },
  { value: 'inbound', label: 'Inbound (I received)' },
];

export function AddCorrespondenceModal({
  isOpen,
  onClose,
  onSubmit,
  contacts,
  defaultContactId,
  hasGmail,
  organizationId,
  onEmailSent,
}: AddCorrespondenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [sendRealEmail, setSendRealEmail] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    correspondence_type: 'email' as AuthorityCorrespondenceType,
    direction: 'outbound' as AuthorityCorrespondenceDirection,
    subject: '',
    body: '',
    contact_id: defaultContactId || '',
    occurred_at: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        correspondence_type: 'email',
        direction: 'outbound',
        subject: '',
        body: '',
        contact_id: defaultContactId || '',
        occurred_at: new Date().toISOString().slice(0, 16),
      });
      setSendRealEmail(false);
      setSendError(null);
    }
  }, [isOpen, defaultContactId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSendError(null);

    try {
      // If "send as real email" is toggled, use Gmail API
      if (sendRealEmail && formData.correspondence_type === 'email' && organizationId) {
        const selectedContact = contacts.find(c => c.id === formData.contact_id);
        const res = await fetch('/api/authority/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            contactId: formData.contact_id || null,
            to: selectedContact ? (selectedContact as { email?: string }).email : '',
            subject: formData.subject,
            bodyText: formData.body,
            bodyHtml: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${formData.body.replace(/\n/g, '<br/>')}</div>`,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setSendError(data.error || 'Failed to send email');
          return;
        }
        onEmailSent?.();
        onClose();
        return;
      }

      await onSubmit({
        ...formData,
        contact_id: formData.contact_id || null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-serif font-semibold text-charcoal">Log Correspondence</h2>
          <button onClick={onClose} className="p-1 hover:bg-cream-warm rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {sendError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {sendError}
            </div>
          )}

          {/* Type + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Type *</label>
              <select
                value={formData.correspondence_type}
                onChange={(e) => setFormData({ ...formData, correspondence_type: e.target.value as AuthorityCorrespondenceType })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Direction</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value as AuthorityCorrespondenceDirection })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Send as real email toggle */}
          {hasGmail && formData.correspondence_type === 'email' && formData.direction === 'outbound' && (
            <div className="flex items-center justify-between p-3 bg-teal/5 border border-teal/20 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-charcoal">Send as real email</p>
                <p className="text-[10px] text-stone">Actually send this email via your connected Gmail</p>
              </div>
              <button
                type="button"
                onClick={() => setSendRealEmail(!sendRealEmail)}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                  sendRealEmail ? 'bg-teal' : 'bg-stone/20'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  sendRealEmail ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          )}

          {/* Contact */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Contact</label>
            <select
              value={formData.contact_id}
              onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Subject *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              placeholder="e.g., Initial pitch email"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Details</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
              placeholder="Notes, key points discussed..."
            />
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">When</label>
            <input
              type="datetime-local"
              value={formData.occurred_at}
              onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
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
              type="submit"
              disabled={loading || !formData.subject}
              className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (sendRealEmail ? 'Sending...' : 'Saving...') : (sendRealEmail ? 'Send via Gmail' : 'Log Correspondence')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
