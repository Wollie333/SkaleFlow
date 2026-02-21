'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TagManager } from '@/components/crm/tag-manager';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { CALL_TYPE_LABELS, CALL_STATUS_LABELS, CALL_STATUS_COLORS } from '@/lib/calls/helpers';
import type { CallType, CallStatus } from '@/types/database';

interface ContactDetailTabsProps {
  contactId: string;
  organizationId: string;
}

interface CallSummary {
  id: string;
  summary_text: string | null;
  overall_score: number | null;
  deal_stage_recommendation: string | null;
}

interface CallParticipant {
  id: string;
  guest_name: string | null;
  user_id: string | null;
  role: string;
}

interface Call {
  id: string;
  title: string;
  call_type: string;
  call_status: string;
  room_code: string;
  scheduled_start: string | null;
  actual_start: string | null;
  actual_end: string | null;
  scheduled_duration_min: number | null;
  created_at: string;
  call_summaries: CallSummary[];
  call_participants: CallParticipant[];
}

interface Deal {
  id: string;
  title: string;
  value_cents: number;
  status: string;
  expected_close_date?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_cents: number;
  due_date?: string;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  performed_by: string | null;
  created_at: string;
  users?: { full_name: string } | null;
  performer?: { full_name: string } | null;
}

export function ContactDetailTabs({
  contactId,
  organizationId,
}: ContactDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'calls' | 'invoices' | 'activity'>('overview');
  const [contact, setContact] = useState<any>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Activity form state
  const [activityType, setActivityType] = useState('note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  useEffect(() => {
    if (activeTab === 'deals') {
      fetchDeals();
    } else if (activeTab === 'calls') {
      fetchCalls();
    } else if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'activity') {
      fetchActivities();
    }
  }, [activeTab, contactId]);

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}?organizationId=${organizationId}`);
      if (!response.ok) return;
      const data = await response.json();
      setContact(data.contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
    }
  };

  const fetchCalls = async () => {
    setLoadingCalls(true);
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}/calls`);
      if (!response.ok) return;
      const data = await response.json();
      setCalls(data.calls || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoadingCalls(false);
    }
  };

  const fetchDeals = async () => {
    setLoadingDeals(true);
    try {
      const response = await fetch(
        `/api/crm/deals?organizationId=${organizationId}&contactId=${contactId}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoadingDeals(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await fetch(
        `/api/crm/invoices?organizationId=${organizationId}&contactId=${contactId}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}/activity`);
      if (!response.ok) return;
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingActivity(true);
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityType,
          title: activityTitle,
          description: activityDescription,
          organizationId,
        }),
      });

      if (!response.ok) throw new Error('Failed to log activity');

      setActivityType('note');
      setActivityTitle('');
      setActivityDescription('');
      fetchActivities();
    } catch (error) {
      console.error('Error logging activity:', error);
    } finally {
      setSubmittingActivity(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'deals', label: 'Deals' },
    { id: 'calls', label: 'Calls' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'activity', label: 'Activity' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="mb-4 flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
              activeTab === tab.id
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-cream-warm rounded-lg border border-stone/10 p-6">
        {activeTab === 'overview' && contact && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-charcoal mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-stone mb-1">Email</p>
                  <p className="text-charcoal">{contact.email}</p>
                </div>
                {contact.phone && (
                  <div>
                    <p className="text-sm font-medium text-stone mb-1">Phone</p>
                    <p className="text-charcoal">{contact.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-stone mb-1">Source</p>
                  <p className="text-charcoal capitalize">{contact.source.replace('_', ' ')}</p>
                </div>
                {contact.assigned_to && (
                  <div>
                    <p className="text-sm font-medium text-stone mb-1">Assigned To</p>
                    <p className="text-charcoal">{contact.assigned_to}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-stone mb-1">Created</p>
                  <p className="text-charcoal">{new Date(contact.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone/10">
              <h3 className="text-lg font-bold text-charcoal mb-4">Tags</h3>
              <TagManager
                organizationId={organizationId}
                contactId={contactId}
                assignedTags={[]}
                onTagsChange={fetchContact}
              />
            </div>
          </div>
        )}

        {activeTab === 'deals' && (
          <div>
            <h3 className="text-lg font-bold text-charcoal mb-4">Deals</h3>
            {loadingDeals ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal"></div>
              </div>
            ) : deals.length === 0 ? (
              <p className="text-stone text-center py-8">No deals yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream border-b border-stone/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone uppercase">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone uppercase">
                        Value
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone uppercase">
                        Expected Close
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/10">
                    {deals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-cream/50">
                        <td className="px-4 py-3 text-charcoal">{deal.title}</td>
                        <td className="px-4 py-3 text-charcoal">
                          R{(deal.value_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-charcoal capitalize">{deal.status}</td>
                        <td className="px-4 py-3 text-stone">
                          {deal.expected_close_date
                            ? new Date(deal.expected_close_date).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calls' && (
          <div>
            <h3 className="text-lg font-bold text-charcoal mb-4">Calls</h3>
            {loadingCalls ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal"></div>
              </div>
            ) : calls.length === 0 ? (
              <p className="text-stone text-center py-8">No calls yet</p>
            ) : (
              <div className="space-y-3">
                {calls.map((call) => {
                  const hasSummary = call.call_summaries && call.call_summaries.length > 0;
                  const href = hasSummary
                    ? `/calls/${call.room_code}/summary`
                    : `/calls/${call.room_code}`;
                  const displayDate = call.actual_end
                    ? new Date(call.actual_end).toLocaleDateString()
                    : call.scheduled_start
                      ? new Date(call.scheduled_start).toLocaleString()
                      : new Date(call.created_at).toLocaleDateString();
                  // Calculate duration from actual times
                  let durationText = '';
                  if (call.actual_start && call.actual_end) {
                    const mins = Math.round(
                      (new Date(call.actual_end).getTime() - new Date(call.actual_start).getTime()) / 60_000
                    );
                    durationText = mins < 60 ? `${mins}min` : `${Math.floor(mins / 60)}h ${mins % 60}min`;
                  } else if (call.scheduled_duration_min) {
                    durationText = `${call.scheduled_duration_min}min (scheduled)`;
                  }

                  return (
                    <Link
                      key={call.id}
                      href={href}
                      className="block bg-cream rounded-xl border border-stone/10 hover:border-teal/20 transition-colors p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-charcoal">{call.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-stone">
                            <span>{CALL_TYPE_LABELS[call.call_type as CallType] || call.call_type}</span>
                            <span>{displayDate}</span>
                            {durationText && <span>{durationText}</span>}
                            {hasSummary && <span className="text-teal">Summary available</span>}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CALL_STATUS_COLORS[call.call_status as CallStatus] || 'bg-gray-100 text-gray-700'}`}>
                          {CALL_STATUS_LABELS[call.call_status as CallStatus] || call.call_status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div>
            <h3 className="text-lg font-bold text-charcoal mb-4">Invoices</h3>
            {loadingInvoices ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal"></div>
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-stone text-center py-8">No invoices yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream border-b border-stone/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone uppercase">
                        Invoice Number
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone uppercase">
                        Total
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone uppercase">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/10">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-cream/50">
                        <td className="px-4 py-3 text-charcoal">{invoice.invoice_number}</td>
                        <td className="px-4 py-3 text-charcoal capitalize">{invoice.status}</td>
                        <td className="px-4 py-3 text-charcoal">
                          R{(invoice.total_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-stone">
                          {invoice.due_date
                            ? new Date(invoice.due_date).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Log Activity Form */}
            <div className="bg-cream rounded-lg p-4">
              <h3 className="text-lg font-bold text-charcoal mb-4">Log Activity</h3>
              <form onSubmit={handleLogActivity} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Type
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-warm border border-stone/10 rounded-lg text-charcoal focus:ring-2 focus:ring-teal focus:border-transparent"
                  >
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-warm border border-stone/10 rounded-lg text-charcoal focus:ring-2 focus:ring-teal focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-warm border border-stone/10 rounded-lg text-charcoal focus:ring-2 focus:ring-teal focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingActivity}
                  className={cn(
                    'px-4 py-2 bg-teal text-white rounded-lg transition-colors font-medium text-sm',
                    submittingActivity
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-teal/90'
                  )}
                >
                  {submittingActivity ? 'Logging...' : 'Log Activity'}
                </button>
              </form>
            </div>

            {/* Activity Timeline */}
            <div>
              <h3 className="text-lg font-bold text-charcoal mb-4">Activity Timeline</h3>
              {loadingActivities ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal"></div>
                </div>
              ) : (
                <ActivityTimeline activities={activities} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
