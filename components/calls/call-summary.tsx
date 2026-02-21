'use client';

import { useState } from 'react';

interface Participant {
  id: string;
  role: string;
  display_name: string;
  guest_email?: string | null;
  joined_at?: string | null;
  left_at?: string | null;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
}

interface SummaryProps {
  summary: {
    summary_text: string | null;
    follow_up_email_draft: string | null;
  };
  participants: Participant[];
  contact: Contact | null;
  duration: number | null;
}

export function CallSummary({ summary, participants, contact, duration }: SummaryProps) {
  const [emailExpanded, setEmailExpanded] = useState(false);

  return (
    <div className="space-y-5">
      {/* Narrative Summary */}
      {summary.summary_text && (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Overview</h3>
          <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{summary.summary_text}</p>
        </div>
      )}

      {/* Duration + Participants row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Duration */}
        {duration !== null && (
          <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
            <h3 className="text-sm font-semibold text-charcoal mb-2">Duration</h3>
            <p className="text-2xl font-bold text-teal">{duration} <span className="text-sm font-normal text-stone">minutes</span></p>
          </div>
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
            <h3 className="text-sm font-semibold text-charcoal mb-2">Participants</h3>
            <div className="space-y-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal/10 flex items-center justify-center text-xs font-semibold text-teal">
                    {p.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-charcoal truncate block">{p.display_name}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    p.role === 'host' ? 'bg-teal/10 text-teal' : 'bg-stone/10 text-stone'
                  }`}>
                    {p.role === 'host' ? 'Host' : p.role === 'team_member' ? 'Team' : 'Guest'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Card */}
      {contact && (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Contact</h3>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-sm font-semibold text-gold flex-shrink-0">
              {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-charcoal">{contact.first_name} {contact.last_name}</p>
              {contact.job_title && contact.company && (
                <p className="text-xs text-stone">{contact.job_title} at {contact.company}</p>
              )}
              {contact.email && <p className="text-xs text-stone">{contact.email}</p>}
              {contact.phone && <p className="text-xs text-stone">{contact.phone}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Email (collapsible) */}
      {summary.follow_up_email_draft && (
        <div className="bg-cream-warm rounded-xl border border-stone/10">
          <button
            onClick={() => setEmailExpanded(!emailExpanded)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <h3 className="text-sm font-semibold text-charcoal">Follow-up Email Draft</h3>
            <svg className={`w-4 h-4 text-stone transition-transform ${emailExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {emailExpanded && (
            <div className="px-5 pb-5 border-t border-stone/10 pt-4">
              <pre className="text-sm text-charcoal whitespace-pre-wrap font-sans leading-relaxed">{summary.follow_up_email_draft}</pre>
              <button
                onClick={() => navigator.clipboard.writeText(summary.follow_up_email_draft!)}
                className="mt-3 text-xs text-teal hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
