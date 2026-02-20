'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, TagIcon, ClockIcon, UserPlusIcon, LinkIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  event_type: string;
  from_stage_id: string | null;
  to_stage_id: string | null;
  metadata: Record<string, unknown>;
  performed_by: string | null;
  created_at: string;
}

interface ContactTag {
  tag_id: string;
  pipeline_tags: { id: string; name: string; color: string } | null;
}

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  value_cents: number;
  stage_id: string;
  notes: string | null;
  assigned_to: string | null;
  custom_fields?: Record<string, unknown>;
  pipeline_contact_tags?: ContactTag[];
  created_at: string;
  activity?: Activity[];
}

interface Stage {
  id: string;
  name: string;
  color: string;
  is_win_stage?: boolean;
  is_loss_stage?: boolean;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ContactDetailPanelProps {
  contact: Contact | null;
  stages: Stage[];
  availableTags: Tag[];
  pipelineId: string;
  pipelineType?: string;
  onClose: () => void;
  onUpdate: (contactId: string, data: Record<string, unknown>) => Promise<void>;
  onAddTag: (contactId: string, tagId: string) => Promise<void>;
  onRemoveTag: (contactId: string, tagId: string) => Promise<void>;
  onSendEmail: (contactId: string) => void;
  onActivateUser?: (contactId: string) => void;
  onCreateBooking?: (contactId: string) => void;
  onSendBookingEmail?: (contactId: string) => void;
}

export function ContactDetailPanel({
  contact,
  stages,
  availableTags,
  pipelineId,
  pipelineType,
  onClose,
  onUpdate,
  onAddTag,
  onRemoveTag,
  onSendEmail,
  onActivateUser,
  onCreateBooking,
  onSendBookingEmail,
}: ContactDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'tags'>('details');
  const [notes, setNotes] = useState(contact?.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(contact?.notes || '');
  }, [contact]);

  if (!contact) return null;

  const isApplication = pipelineType === 'application';
  const customFields = (contact.custom_fields || {}) as Record<string, unknown>;
  const isActivated = !!customFields.activated_user_id;

  const contactTags = (contact.pipeline_contact_tags || [])
    .map((t) => t.pipeline_tags)
    .filter(Boolean) as Tag[];

  const contactTagIds = new Set(contactTags.map((t) => t.id));
  const unusedTags = availableTags.filter((t) => !contactTagIds.has(t.id));

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await onUpdate(contact.id, { notes });
    } finally {
      setSaving(false);
    }
  };

  const currentStage = stages.find((s) => s.id === contact.stage_id);
  const isOnWinStage = currentStage?.is_win_stage === true;
  const isOnApprovedStage = currentStage?.name === 'Approved';

  const formatEventType = (type: string) => {
    const map: Record<string, string> = {
      contact_created: 'Contact created',
      stage_changed: 'Moved stage',
      tag_added: 'Tag added',
      tag_removed: 'Tag removed',
      email_sent: 'Email sent',
      contact_updated: 'Contact updated',
      note_added: 'Note added',
      user_activated: 'User activated',
      booking_created: 'Booking link created',
      booking_email_sent: 'Booking email sent',
    };
    return map[type] || type;
  };

  const tabs = [
    { id: 'details' as const, label: 'Details' },
    { id: 'activity' as const, label: 'Activity' },
    { id: 'tags' as const, label: 'Tags' },
  ];

  const CUSTOM_FIELD_LABELS: Record<string, string> = {
    website_url: 'Website',
    team_size: 'Team Size',
    annual_revenue: 'Annual Revenue',
    biggest_challenge: 'Biggest Challenge',
    what_tried: 'What They Tried',
    why_applying: 'Why Applying',
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-cream-warm shadow-xl border-l border-stone/10 z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal truncate">{contact.full_name}</h2>
          <button onClick={onClose} className="text-stone hover:text-charcoal">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {currentStage && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStage.color }} />
            <span className="text-xs text-stone">{currentStage.name}</span>
          </div>
        )}
        {contact.email && (
          <button
            onClick={() => onSendEmail(contact.id)}
            className="mt-2 flex items-center gap-1.5 text-xs text-teal hover:text-teal/80"
          >
            <PaperAirplaneIcon className="w-3.5 h-3.5" />
            Send Email
          </button>
        )}

        {/* Application action buttons */}
        {isApplication && (
          <div className="mt-3 space-y-2">
            {/* User Activated badge */}
            {isActivated && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg">
                <CheckBadgeIcon className="w-4 h-4" />
                User Activated
              </div>
            )}

            {/* Activate User — shown on win stage when not yet activated */}
            {isOnWinStage && !isActivated && onActivateUser && (
              <button
                onClick={() => onActivateUser(contact.id)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal hover:bg-teal/90 rounded-lg transition-colors"
              >
                <UserPlusIcon className="w-4 h-4" />
                Activate User
              </button>
            )}

            {/* Send Booking Link — shown on Approved stage */}
            {isOnApprovedStage && (
              <div className="flex gap-2">
                {onCreateBooking && (
                  <button
                    onClick={() => onCreateBooking(contact.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-charcoal bg-gold/20 hover:bg-gold/30 rounded-lg transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Create Booking
                  </button>
                )}
                {onSendBookingEmail && (
                  <button
                    onClick={() => onSendBookingEmail(contact.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-charcoal bg-gold/20 hover:bg-gold/30 rounded-lg transition-colors"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Send Invite
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-stone uppercase">Email</label>
              <p className="text-sm text-charcoal mt-0.5">{contact.email || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-stone uppercase">Phone</label>
              <p className="text-sm text-charcoal mt-0.5">{contact.phone || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-stone uppercase">Company</label>
              <p className="text-sm text-charcoal mt-0.5">{contact.company || '—'}</p>
            </div>
            {!isApplication && (
              <div>
                <label className="text-xs font-medium text-stone uppercase">Deal Value</label>
                <p className="text-sm text-charcoal mt-0.5">
                  {contact.value_cents > 0
                    ? `R ${(contact.value_cents / 100).toLocaleString('en-ZA')}`
                    : '—'}
                </p>
              </div>
            )}

            {/* Application custom fields */}
            {isApplication && Object.keys(customFields).length > 0 && (
              <div className="pt-2 border-t border-stone/10">
                <h4 className="text-xs font-semibold text-teal uppercase mb-3">Application Details</h4>
                <div className="space-y-3">
                  {Object.entries(CUSTOM_FIELD_LABELS).map(([key, label]) => {
                    const val = customFields[key];
                    if (!val) return null;
                    return (
                      <div key={key}>
                        <label className="text-xs font-medium text-stone uppercase">{label}</label>
                        <p className="text-sm text-charcoal mt-0.5 whitespace-pre-wrap">
                          {key === 'website_url' ? (
                            <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                              {String(val)}
                            </a>
                          ) : (
                            String(val)
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-stone uppercase mb-1 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
                placeholder="Add notes..."
              />
              <button
                onClick={handleSaveNotes}
                disabled={saving || notes === (contact.notes || '')}
                className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3">
            {(contact.activity || []).length === 0 ? (
              <p className="text-sm text-stone text-center py-8">No activity yet</p>
            ) : (
              (contact.activity || []).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    <ClockIcon className="w-4 h-4 text-stone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal">{formatEventType(item.event_type)}</p>
                    <p className="text-xs text-stone">
                      {new Date(item.created_at).toLocaleString('en-ZA')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-stone uppercase mb-2 block">Current Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {contactTags.length === 0 && (
                  <p className="text-xs text-stone">No tags</p>
                )}
                {contactTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <button
                      onClick={() => onRemoveTag(contact.id, tag.id)}
                      className="hover:opacity-75"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {unusedTags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-stone uppercase mb-2 block">Add Tag</label>
                <div className="flex flex-wrap gap-1.5">
                  {unusedTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => onAddTag(contact.id, tag.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-stone/20 text-stone hover:border-teal hover:text-teal transition-colors"
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
