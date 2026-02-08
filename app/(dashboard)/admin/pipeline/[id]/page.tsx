'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import type { PipelineStage } from '@/types/database';
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  VideoCameraIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  website_url: string | null;
  team_size: string;
  annual_revenue: string;
  biggest_challenge: string;
  what_tried: string | null;
  why_applying: string;
  pipeline_stage: PipelineStage;
  admin_notes: string | null;
  activated_user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  from_stage: string | null;
  to_stage: string | null;
  description: string;
  performed_by: string | null;
  performer_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActivatedUser {
  id: string;
  full_name: string;
  email: string;
}

interface Meeting {
  id: string;
  scheduled_at: string | null;
  duration_minutes: number;
  meet_link: string | null;
  status: string;
  attendee_email: string;
  attendee_name: string;
  booked_at: string | null;
  booking_token: string;
  token_expires_at: string;
}

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string }> = {
  application: { label: 'Application', color: 'text-blue-700', bg: 'bg-blue-100' },
  declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-100' },
  approved: { label: 'Approved', color: 'text-purple-700', bg: 'bg-purple-100' },
  booking_made: { label: 'Booking Made', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  lost: { label: 'Lost', color: 'text-stone', bg: 'bg-stone/10' },
  won: { label: 'Won', color: 'text-teal', bg: 'bg-teal/10' },
};

const STAGE_ACTIONS: Record<PipelineStage, { label: string; stage: PipelineStage; variant: 'primary' | 'danger' | 'secondary' }[]> = {
  application: [
    { label: 'Accept', stage: 'approved', variant: 'primary' },
    { label: 'Decline', stage: 'declined', variant: 'danger' },
  ],
  declined: [
    { label: 'Reopen', stage: 'application', variant: 'secondary' },
  ],
  approved: [
    { label: 'Booking Made', stage: 'booking_made', variant: 'primary' },
  ],
  booking_made: [
    { label: 'Mark as Won', stage: 'won', variant: 'primary' },
    { label: 'Mark as Lost', stage: 'lost', variant: 'danger' },
  ],
  lost: [
    { label: 'Reopen', stage: 'application', variant: 'secondary' },
  ],
  won: [],
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [activatedUser, setActivatedUser] = useState<ActivatedUser | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/pipeline/${id}`);
      const data = await res.json();
      if (data.application) {
        setApplication(data.application);
        setNotes(data.application.admin_notes || '');
        setActivity(data.activity || []);
        setActivatedUser(data.activatedUser || null);
        setMeeting(data.meeting || null);
      }
    } catch (error) {
      console.error('Failed to fetch application:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const moveStage = async (newStage: PipelineStage) => {
    setActionLoading(newStage);
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, pipeline_stage: newStage }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to move stage:', error);
    } finally {
      setActionLoading('');
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, admin_notes: notes }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  const activateUser = async () => {
    if (!confirm('This will create a user account and send a password reset email. Continue?')) return;
    setActionLoading('activate');
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action: 'activate' }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to activate user');
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to activate user:', error);
    } finally {
      setActionLoading('');
    }
  };

  const openBookingModal = async () => {
    setBookingModal(true);
    setBookingUrl('');
    setBookingError('');
    setEmailSent(false);
    setCopied(false);
    setBookingLoading(true);

    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action: 'create_booking' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Failed to generate booking link');
      } else {
        setBookingUrl(data.bookingUrl);
        await fetchData();
      }
    } catch {
      setBookingError('Network error. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const sendInviteEmail = async () => {
    setEmailSending(true);
    setBookingError('');
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action: 'send_booking_email' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Failed to send email');
      } else {
        setEmailSent(true);
        await fetchData();
      }
    } catch {
      setBookingError('Network error. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const copyBookingLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = bookingUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTimeInPipeline = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'submitted': return <PaperAirplaneIcon className="w-4 h-4 text-blue-500" />;
      case 'stage_changed': return <ArrowPathIcon className="w-4 h-4 text-amber-500" />;
      case 'note_updated': return <ChatBubbleLeftIcon className="w-4 h-4 text-stone" />;
      case 'user_activated': return <UserPlusIcon className="w-4 h-4 text-teal" />;
      case 'booking_email_sent': return <EnvelopeIcon className="w-4 h-4 text-purple-500" />;
      case 'booking_confirmed': return <VideoCameraIcon className="w-4 h-4 text-teal" />;
      default: return <DocumentTextIcon className="w-4 h-4 text-stone" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-stone">Loading application...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-20">
        <p className="text-stone">Application not found.</p>
        <Link href="/admin/pipeline" className="text-teal text-sm mt-2 inline-block hover:underline">
          Back to Pipeline
        </Link>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[application.pipeline_stage];
  const actions = STAGE_ACTIONS[application.pipeline_stage];

  return (
    <div>
      {/* Header */}
      <PageHeader
        icon={ClipboardDocumentListIcon}
        title={application.full_name}
        subtitle={application.business_name}
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Applications', href: '/admin/pipeline' },
          { label: application.full_name },
        ]}
        action={
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${stageConfig.color} ${stageConfig.bg}`}>
            {stageConfig.label}
          </span>
        }
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Info Card */}
          <div className="bg-white rounded-xl border border-stone/10 p-6">
            <h2 className="font-serif text-lg font-bold text-charcoal mb-4">Application Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Email</div>
                <a href={`mailto:${application.email}`} className="text-sm text-teal hover:underline">{application.email}</a>
              </div>
              <div>
                <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Phone</div>
                <a href={`tel:${application.phone}`} className="text-sm text-teal hover:underline">{application.phone}</a>
              </div>
              {application.website_url && (
                <div>
                  <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Website</div>
                  <a href={application.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal hover:underline">
                    {application.website_url}
                  </a>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Team Size</div>
                <div className="text-sm text-charcoal">{application.team_size}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Annual Revenue</div>
                <div className="text-sm text-charcoal">{application.annual_revenue}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Biggest Challenge</div>
                <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{application.biggest_challenge}</p>
              </div>
              {application.what_tried && (
                <div>
                  <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">What They&apos;ve Tried</div>
                  <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{application.what_tried}</p>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Why Applying Now</div>
                <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{application.why_applying}</p>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-xl border border-stone/10 p-6">
            <h2 className="font-serif text-lg font-bold text-charcoal mb-4">Admin Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this application..."
              className="w-full px-4 py-3 border border-stone/15 rounded-lg text-sm text-charcoal bg-cream transition-all focus:outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/10 placeholder:text-stone/50 min-h-[100px] resize-y"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={saveNotes}
                disabled={savingNotes || notes === (application.admin_notes || '')}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal text-cream hover:bg-teal-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-stone/10 p-6">
            <h2 className="font-serif text-lg font-bold text-charcoal mb-4">Activity Log</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-stone">No activity yet.</p>
            ) : (
              <div className="space-y-0">
                {activity.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    {/* Timeline line + icon */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(entry.action)}
                      </div>
                      {idx < activity.length - 1 && (
                        <div className="w-px flex-1 bg-stone/10 min-h-[16px]" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-4 pt-1 flex-1">
                      <p className="text-sm text-charcoal">{entry.description}</p>
                      <p className="text-[11px] text-stone/60 mt-0.5">{formatDateTime(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - sidebar */}
        <div className="space-y-6">
          {/* Current Stage */}
          <div className="bg-white rounded-xl border border-stone/10 p-6">
            <h3 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">Current Stage</h3>
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${stageConfig.color} ${stageConfig.bg}`}>
              {stageConfig.label}
            </span>
          </div>

          {/* Stage Actions */}
          <div className="bg-white rounded-xl border border-stone/10 p-6">
            <h3 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">Actions</h3>
            <div className="space-y-2">
              {actions.map((action) => (
                <button
                  key={action.stage}
                  onClick={() => moveStage(action.stage)}
                  disabled={!!actionLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 ${
                    action.variant === 'primary'
                      ? 'bg-teal text-cream hover:bg-teal-light'
                      : action.variant === 'danger'
                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        : 'bg-cream text-charcoal border border-stone/15 hover:bg-stone/5'
                  }`}
                >
                  {action.variant === 'primary' && <CheckCircleIcon className="w-4 h-4" />}
                  {action.variant === 'danger' && <XCircleIcon className="w-4 h-4" />}
                  {action.variant === 'secondary' && <ArrowPathIcon className="w-4 h-4" />}
                  {actionLoading === action.stage ? 'Processing...' : action.label}
                </button>
              ))}

              {/* Send Booking Link button (Approved stage) */}
              {application.pipeline_stage === 'approved' && (
                <button
                  onClick={openBookingModal}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-40"
                >
                  <LinkIcon className="w-4 h-4" />
                  {meeting && meeting.status === 'pending'
                    ? 'Booking Link'
                    : 'Generate Booking Link'}
                </button>
              )}

              {/* Activate User button (Won stage only) */}
              {application.pipeline_stage === 'won' && (
                <button
                  onClick={activateUser}
                  disabled={!!application.activated_user_id || !!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gold text-dark hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  {application.activated_user_id
                    ? 'User Already Activated'
                    : actionLoading === 'activate'
                      ? 'Activating...'
                      : 'Activate User'}
                </button>
              )}

              {actions.length === 0 && !application.activated_user_id && application.pipeline_stage !== 'won' && (
                <p className="text-xs text-stone/60 text-center">No actions available</p>
              )}
            </div>
          </div>

          {/* Meeting Details */}
          {meeting && (
            <div className="bg-white rounded-xl border border-stone/10 p-6">
              <h3 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">Meeting Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <VideoCameraIcon className="w-4 h-4 text-stone" />
                  <span className="text-stone">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    meeting.status === 'scheduled' ? 'text-teal bg-teal/10'
                    : meeting.status === 'completed' ? 'text-green-700 bg-green-100'
                    : meeting.status === 'cancelled' ? 'text-red-700 bg-red-100'
                    : meeting.status === 'no_show' ? 'text-amber-700 bg-amber-100'
                    : 'text-stone bg-stone/10'
                  }`}>
                    {meeting.status === 'no_show' ? 'No Show' : meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                  </span>
                </div>
                {meeting.scheduled_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="w-4 h-4 text-stone" />
                    <span className="text-stone">Date:</span>
                    <span className="text-charcoal font-medium">
                      {formatDateTime(meeting.scheduled_at)}
                    </span>
                  </div>
                )}
                {meeting.meet_link && (
                  <a
                    href={meeting.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal/10 text-teal hover:bg-teal/20 transition-colors w-full justify-center"
                  >
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                    Open Google Meet
                  </a>
                )}
                {meeting.status === 'pending' && (
                  <p className="text-xs text-stone/60">
                    Waiting for applicant to choose a time slot.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-stone/10 p-6">
            <h3 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="w-4 h-4 text-stone" />
                <span className="text-stone">Applied:</span>
                <span className="text-charcoal font-medium">{formatDate(application.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowPathIcon className="w-4 h-4 text-stone" />
                <span className="text-stone">In pipeline:</span>
                <span className="text-charcoal font-medium">{getTimeInPipeline(application.created_at)}</span>
              </div>
              {activity.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <DocumentTextIcon className="w-4 h-4 text-stone" />
                  <span className="text-stone">Last activity:</span>
                  <span className="text-charcoal font-medium">
                    {formatDate(activity[activity.length - 1].created_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Activated User Link */}
          {activatedUser && (
            <div className="bg-teal/5 rounded-xl border border-teal/15 p-6">
              <h3 className="text-xs font-semibold text-teal uppercase tracking-wider mb-3">Activated User</h3>
              <div className="text-sm text-charcoal font-medium">{activatedUser.full_name}</div>
              <div className="text-xs text-stone mt-0.5">{activatedUser.email}</div>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1 text-xs text-teal hover:underline mt-2"
              >
                View in Users
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Booking Link Modal */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <h3 className="font-serif text-lg font-bold text-charcoal">Booking Link</h3>
              <button
                onClick={() => setBookingModal(false)}
                className="p-1.5 rounded-lg hover:bg-cream-warm transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-stone" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Loading */}
              {bookingLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-[3px] border-stone/15 border-t-teal rounded-full animate-spin" />
                </div>
              )}

              {/* Error */}
              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {bookingError}
                </div>
              )}

              {/* Success: show link + actions */}
              {bookingUrl && !bookingLoading && (
                <>
                  <p className="text-sm text-stone">
                    Share this link with <span className="font-medium text-charcoal">{application.full_name}</span> so they can pick a time for their onboarding call.
                  </p>

                  {/* Link display */}
                  <div className="flex items-center gap-2 p-3 bg-cream-warm rounded-lg border border-stone/10">
                    <input
                      type="text"
                      readOnly
                      value={bookingUrl}
                      className="flex-1 bg-transparent text-xs text-charcoal truncate outline-none"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2.5">
                    {/* Send Invite Email */}
                    <button
                      onClick={sendInviteEmail}
                      disabled={emailSending || emailSent}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-teal text-cream hover:bg-teal-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {emailSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : emailSent ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          Email Sent to {application.email}
                        </>
                      ) : (
                        <>
                          <EnvelopeIcon className="w-4 h-4" />
                          Send Invite Email
                        </>
                      )}
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={copyBookingLink}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-cream text-charcoal border border-stone/15 hover:bg-stone/5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 text-teal" />
                          <span className="text-teal">Copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>

                  {emailSent && (
                    <p className="text-xs text-teal text-center">
                      A branded invite email has been sent with the booking link.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
