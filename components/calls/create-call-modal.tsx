'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  description: string | null;
  call_type: string;
  is_system: boolean;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

const CALL_TYPES = [
  { value: 'discovery', label: 'Discovery Call' },
  { value: 'sales', label: 'Sales Call' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'custom', label: 'Custom' },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

export default function CreateCallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  // Mode: 'choose' | 'now' | 'schedule'
  const [mode, setMode] = useState<'choose' | 'now' | 'schedule'>('choose');

  // Common fields
  const [title, setTitle] = useState('');
  const [callType, setCallType] = useState('discovery');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [objective, setObjective] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);

  // Schedule fields
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [durationMin, setDurationMin] = useState(30);

  // Attendee (guest)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCompany, setGuestCompany] = useState('');

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());

  // CRM contact linking
  const [crmContactId, setCrmContactId] = useState<string | null>(null);
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmResults, setCrmResults] = useState<Array<{ id: string; first_name: string; last_name: string; email: string | null }>>([]);
  const [showCrmSearch, setShowCrmSearch] = useState(false);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Load templates, team members, and org context
  useEffect(() => {
    if (!open) return;

    fetch('/api/calls/templates')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTemplates(data); })
      .catch(() => {});

    fetch('/api/team')
      .then(r => r.json())
      .then(data => {
        if (data?.members && Array.isArray(data.members)) {
          setTeamMembers(data.members.map((m: Record<string, unknown>) => ({
            user_id: m.user_id as string,
            full_name: (m.users as Record<string, unknown>)?.full_name as string || (m.users as Record<string, unknown>)?.email as string || 'Unknown',
            email: (m.users as Record<string, unknown>)?.email as string || '',
            role: m.role as string,
          })));
        }
        if (data?.organizationId) setOrgId(data.organizationId);
      })
      .catch(() => {});
  }, [open]);

  // CRM contact search
  useEffect(() => {
    if (!crmSearchQuery || crmSearchQuery.length < 2 || !orgId) {
      setCrmResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/crm/contacts?organizationId=${orgId}&search=${encodeURIComponent(crmSearchQuery)}&limit=5`)
        .then(r => r.json())
        .then(data => {
          if (data?.contacts && Array.isArray(data.contacts)) setCrmResults(data.contacts);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [crmSearchQuery, orgId]);

  function reset() {
    setMode('choose');
    setTitle('');
    setCallType('discovery');
    setTemplateId(null);
    setObjective('');
    setScheduledDate('');
    setScheduledTime('');
    setDurationMin(30);
    setGuestName('');
    setGuestEmail('');
    setGuestCompany('');
    setSelectedTeamIds(new Set());
    setCrmContactId(null);
    setCrmSearchQuery('');
    setShowCrmSearch(false);
    setCreating(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCreate() {
    if (!title) return;
    setCreating(true);

    try {
      const isScheduled = mode === 'schedule';
      let scheduledStart: string | undefined;

      if (isScheduled && scheduledDate && scheduledTime) {
        scheduledStart = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          callType,
          templateId: templateId || undefined,
          callObjective: objective || undefined,
          scheduledStart,
          durationMin,
          crmContactId: crmContactId || undefined,
          // Guest info for participant creation
          guestName: guestName || undefined,
          guestEmail: guestEmail || undefined,
          guestCompany: guestCompany || undefined,
          // Team member IDs to add as participants
          teamMemberIds: Array.from(selectedTeamIds),
        }),
      });

      if (!res.ok) throw new Error('Failed to create call');
      const data = await res.json();

      handleClose();

      if (isScheduled) {
        // Stay on calls page — refresh to show new scheduled call
        router.refresh();
      } else {
        // Open the call room in a full-screen window with autoJoin
        window.open(`/call-room/${data.room_code}?autoJoin=true`, '_blank');
        router.refresh();
      }
    } catch {
      setCreating(false);
    }
  }

  function toggleTeamMember(userId: string) {
    setSelectedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-cream-warm rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-charcoal">
              {mode === 'choose' ? 'New Call' : mode === 'now' ? 'Start Call Now' : 'Schedule Call'}
            </h2>
            <button onClick={handleClose} className="text-stone hover:text-charcoal transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode chooser */}
          {mode === 'choose' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('now')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-stone/10 hover:border-teal transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                  <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-charcoal">Start Now</p>
                  <p className="text-xs text-stone mt-1">Begin a call immediately</p>
                </div>
              </button>
              <button
                onClick={() => setMode('schedule')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-stone/10 hover:border-gold transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-charcoal">Schedule</p>
                  <p className="text-xs text-stone mt-1">Pick a date &amp; time</p>
                </div>
              </button>
            </div>
          )}

          {/* Call form (now or schedule) */}
          {mode !== 'choose' && (
            <div className="space-y-5">
              {/* Back button */}
              <button
                onClick={() => setMode('choose')}
                className="text-sm text-stone hover:text-charcoal flex items-center gap-1 -mt-2 mb-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Call Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  placeholder="e.g. Discovery call with John"
                  autoFocus
                />
              </div>

              {/* Call type */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Call Type</label>
                <div className="flex flex-wrap gap-2">
                  {CALL_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setCallType(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        callType === t.value
                          ? 'bg-teal text-white'
                          : 'bg-cream text-charcoal hover:bg-stone/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Framework Template</label>
                  <select
                    value={templateId || ''}
                    onChange={(e) => setTemplateId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  >
                    <option value="">No template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} {t.is_system ? '(System)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Schedule-specific fields */}
              {mode === 'schedule' && (
                <Fragment>
                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Duration</label>
                    <div className="flex gap-2">
                      {DURATION_OPTIONS.map(d => (
                        <button
                          key={d}
                          onClick={() => setDurationMin(d)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            durationMin === d
                              ? 'bg-teal text-white'
                              : 'bg-cream text-charcoal hover:bg-stone/10'
                          }`}
                        >
                          {d}min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guest / Attendee */}
                  <div className="border-t border-stone/10 pt-4">
                    <label className="block text-sm font-semibold text-charcoal mb-3">Attendee</label>
                    <div className="space-y-2">
                      {/* CRM search toggle */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setShowCrmSearch(!showCrmSearch)}
                          className="text-xs text-teal hover:underline"
                        >
                          {showCrmSearch ? 'Enter manually' : 'Search CRM contacts'}
                        </button>
                      </div>

                      {showCrmSearch ? (
                        <div>
                          <input
                            type="text"
                            value={crmSearchQuery}
                            onChange={(e) => setCrmSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                            placeholder="Search by name or email..."
                          />
                          {crmResults.length > 0 && (
                            <div className="mt-1 border border-stone/10 rounded-lg overflow-hidden">
                              {crmResults.map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    setCrmContactId(c.id);
                                    setGuestName(`${c.first_name} ${c.last_name}`.trim());
                                    setGuestEmail(c.email || '');
                                    setCrmSearchQuery('');
                                    setCrmResults([]);
                                    setShowCrmSearch(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-cream/50 flex justify-between"
                                >
                                  <span className="font-medium">{c.first_name} {c.last_name}</span>
                                  <span className="text-stone">{c.email}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Fragment>
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                            placeholder="Email"
                          />
                          <input
                            type="text"
                            value={guestCompany}
                            onChange={(e) => setGuestCompany(e.target.value)}
                            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                            placeholder="Company (optional)"
                          />
                        </Fragment>
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  {teamMembers.length > 0 && (
                    <div className="border-t border-stone/10 pt-4">
                      <label className="block text-sm font-semibold text-charcoal mb-3">Team Members</label>
                      <div className="space-y-2">
                        {teamMembers.map(m => (
                          <label
                            key={m.user_id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTeamIds.has(m.user_id)}
                              onChange={() => toggleTeamMember(m.user_id)}
                              className="rounded border-stone/30 text-teal focus:ring-teal/30"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-charcoal truncate">{m.full_name}</p>
                              <p className="text-xs text-stone truncate">{m.email}</p>
                            </div>
                            <span className="text-xs text-stone capitalize">{m.role}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </Fragment>
              )}

              {/* Objective */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Call Objective <span className="text-stone">(optional)</span></label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  rows={2}
                  placeholder="What do you want to achieve in this call?"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleCreate}
                disabled={!title || creating || (mode === 'schedule' && (!scheduledDate || !scheduledTime))}
                className="w-full py-3 rounded-lg bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {creating
                  ? 'Creating...'
                  : mode === 'now'
                    ? 'Create & Enter Call Room'
                    : 'Schedule Call'
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
