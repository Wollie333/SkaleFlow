'use client';

import {
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { WARMTH_CONFIG } from '@/lib/authority/constants';

interface ContactOverviewTabProps {
  contact: {
    full_name: string;
    email: string | null;
    phone: string | null;
    outlet: string | null;
    role: string | null;
    beat: string | null;
    location: string | null;
    warmth: string;
    linkedin_url: string | null;
    twitter_url: string | null;
    notes: string | null;
    last_contacted_at: string | null;
    created_at: string;
  };
  stats: {
    totalEmails: number;
    totalCards: number;
    totalCorrespondence: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    direction: string | null;
    email_subject: string | null;
    summary: string | null;
    occurred_at: string;
  }>;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
  savingNotes: boolean;
}

export function ContactOverviewTab({
  contact,
  stats,
  recentActivity,
  notes,
  onNotesChange,
  onSaveNotes,
  savingNotes,
}: ContactOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Contact Info + Notes */}
      <div className="lg:col-span-2 space-y-6">
        {/* Contact Info Card */}
        <div className="bg-cream-warm border border-stone/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-4">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Email" value={contact.email} icon={EnvelopeIcon} />
            <InfoField label="Phone" value={contact.phone} icon={PhoneIcon} />
            <InfoField label="Outlet" value={contact.outlet} />
            <InfoField label="Role" value={contact.role} />
            <InfoField label="Beat" value={contact.beat} />
            <InfoField label="Location" value={contact.location} />
            <InfoField label="LinkedIn" value={contact.linkedin_url ? 'Connected' : null} />
            <InfoField label="X/Twitter" value={contact.twitter_url ? 'Connected' : null} />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-cream-warm border border-stone/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            placeholder="Add notes about this contact..."
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={onSaveNotes}
              disabled={savingNotes}
              className="px-3 py-1.5 text-xs font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-cream-warm border border-stone/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-xs text-stone text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-stone/5 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-cream-warm flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ActivityIcon type={item.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-charcoal truncate">
                      {item.email_subject || item.summary || item.type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-stone capitalize">{item.type.replace('_', ' ')}</span>
                      {item.direction && (
                        <span className={`text-[10px] ${item.direction === 'inbound' ? 'text-blue-500' : 'text-green-500'}`}>
                          {item.direction === 'inbound' ? 'Received' : 'Sent'}
                        </span>
                      )}
                      <span className="text-[10px] text-stone/60">
                        {new Date(item.occurred_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right column: Quick Stats */}
      <div className="space-y-6">
        <div className="bg-cream-warm border border-stone/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <StatItem icon={EnvelopeIcon} label="Total Emails" value={stats.totalEmails} />
            <StatItem icon={RectangleStackIcon} label="Pipeline Cards" value={stats.totalCards} />
            <StatItem icon={ChatBubbleLeftRightIcon} label="All Interactions" value={stats.totalCorrespondence} />
            <StatItem
              icon={CalendarIcon}
              label="Last Contacted"
              value={contact.last_contacted_at
                ? new Date(contact.last_contacted_at).toLocaleDateString()
                : 'Never'
              }
            />
            <StatItem
              icon={CalendarIcon}
              label="Added"
              value={new Date(contact.created_at).toLocaleDateString()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, icon: Icon }: { label: string; value: string | null; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-stone uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-stone" />}
        <p className="text-sm text-charcoal">{value || '—'}</p>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-stone" />
        <span className="text-xs text-stone">{label}</span>
      </div>
      <span className="text-sm font-semibold text-charcoal">{value}</span>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconClass = 'w-3 h-3 text-teal';
  switch (type) {
    case 'email': return <EnvelopeIcon className={iconClass} />;
    case 'phone_call': return <PhoneIcon className={iconClass} />;
    case 'meeting': return <CalendarIcon className={iconClass} />;
    default: return <ChatBubbleLeftRightIcon className={iconClass} />;
  }
}
