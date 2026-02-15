'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, WARMTH_CONFIG, CONFIRMED_FORMATS } from '@/lib/authority/constants';
import { ChecklistSection } from './checklist-section';
import { AddCorrespondenceModal } from './add-correspondence-modal';
import { PitchEmailGenerator } from './pitch-email-generator';
import type { AuthorityCategory, AuthorityPriority, AuthorityReachTier, AuthorityCorrespondenceType } from '@/lib/authority/types';

// ============================================================================
// Types
// ============================================================================

interface CardDetail {
  id: string;
  organization_id: string;
  opportunity_name: string;
  category: AuthorityCategory;
  priority: AuthorityPriority;
  stage_id: string;
  target_outlet: string | null;
  target_date: string | null;
  reach_tier: AuthorityReachTier;
  custom_story_angle: string | null;
  notes: string | null;
  live_url: string | null;
  clipping_url: string | null;
  confirmed_format: string | null;
  embargo_active: boolean;
  embargo_date: string | null;
  submission_deadline: string | null;
  expected_publication_date: string | null;
  pitched_at: string | null;
  agreed_at: string | null;
  submitted_at: string | null;
  published_at: string | null;
  amplified_at: string | null;
  decline_reason: string | null;
  decline_notes: string | null;
  on_hold_reason: string | null;
  created_at: string;
  updated_at: string;
  contact_id: string | null;
  story_angle_id: string | null;

  // Relations
  authority_pipeline_stages?: { id: string; name: string; slug: string; color: string | null } | null;
  authority_contacts?: { id: string; full_name: string; email: string | null; outlet: string | null; role: string | null; warmth: string; linkedin_url: string | null; twitter_url: string | null } | null;
  authority_story_angles?: { id: string; title: string; description: string | null } | null;
  authority_commercial?: {
    id: string;
    engagement_type: string;
    deal_value: number;
    currency: string;
    payment_status: string;
    payment_terms: string | null;
    invoice_number: string | null;
    paid_date: string | null;
  } | null;
  checklist_count: number;
  checklist_completed: number;
  correspondence_count: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  is_completed: boolean;
  completed_at: string | null;
  display_order: number;
  is_custom: boolean;
}

interface CorrespondenceItem {
  id: string;
  correspondence_type: AuthorityCorrespondenceType;
  direction: string;
  subject: string;
  body: string | null;
  occurred_at: string;
  authority_contacts?: { id: string; full_name: string } | null;
}

interface Contact {
  id: string;
  full_name: string;
  outlet: string | null;
}

type Tab = 'details' | 'commercial' | 'correspondence' | 'checklist' | 'activity';

interface CardDetailPanelProps {
  cardId: string | null;
  onClose: () => void;
  onUpdate: () => void;
  contacts: Contact[];
}

// ============================================================================
// Correspondence type icons/labels
// ============================================================================

const CORRESPONDENCE_ICONS: Record<string, typeof EnvelopeIcon> = {
  email: EnvelopeIcon,
  phone_call: PhoneIcon,
  meeting: CalendarIcon,
  note: DocumentTextIcon,
  other: ChatBubbleLeftRightIcon,
};

// ============================================================================
// Component
// ============================================================================

export function CardDetailPanel({ cardId, onClose, onUpdate, contacts }: CardDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [card, setCard] = useState<CardDetail | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [correspondence, setCorrespondence] = useState<CorrespondenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCorrespondenceModal, setShowCorrespondenceModal] = useState(false);

  // Editable fields
  const [editNotes, setEditNotes] = useState('');
  const [editLiveUrl, setEditLiveUrl] = useState('');
  const [editClippingUrl, setEditClippingUrl] = useState('');
  const [editConfirmedFormat, setEditConfirmedFormat] = useState('');
  const [editEmbargoActive, setEditEmbargoActive] = useState(false);
  const [editEmbargoDate, setEditEmbargoDate] = useState('');
  const [editSubmissionDeadline, setEditSubmissionDeadline] = useState('');
  const [editExpectedPubDate, setEditExpectedPubDate] = useState('');

  // Commercial fields
  const [editEngagementType, setEditEngagementType] = useState('earned');
  const [editDealValue, setEditDealValue] = useState(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState('not_invoiced');
  const [editPaymentTerms, setEditPaymentTerms] = useState('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');

  // Fetch card detail
  const fetchCard = useCallback(async () => {
    if (!cardId) return;
    setLoading(true);

    const res = await fetch(`/api/authority/pipeline/${cardId}`);
    if (res.ok) {
      const data: CardDetail = await res.json();
      setCard(data);
      setEditNotes(data.notes || '');
      setEditLiveUrl(data.live_url || '');
      setEditClippingUrl(data.clipping_url || '');
      setEditConfirmedFormat(data.confirmed_format || '');
      setEditEmbargoActive(data.embargo_active);
      setEditEmbargoDate(data.embargo_date?.slice(0, 10) || '');
      setEditSubmissionDeadline(data.submission_deadline?.slice(0, 10) || '');
      setEditExpectedPubDate(data.expected_publication_date?.slice(0, 10) || '');

      const commercial = data.authority_commercial;
      setEditEngagementType(commercial?.engagement_type || 'earned');
      setEditDealValue(commercial?.deal_value || 0);
      setEditPaymentStatus(commercial?.payment_status || 'not_invoiced');
      setEditPaymentTerms(commercial?.payment_terms || '');
      setEditInvoiceNumber(commercial?.invoice_number || '');
    }

    setLoading(false);
  }, [cardId]);

  // Fetch checklist
  const fetchChecklist = useCallback(async () => {
    if (!cardId) return;
    const res = await fetch(`/api/authority/pipeline/${cardId}/checklist`);
    if (res.ok) setChecklist(await res.json());
  }, [cardId]);

  // Fetch correspondence
  const fetchCorrespondence = useCallback(async () => {
    if (!cardId) return;
    const res = await fetch(`/api/authority/pipeline/${cardId}/correspondence`);
    if (res.ok) setCorrespondence(await res.json());
  }, [cardId]);

  useEffect(() => {
    if (cardId) {
      fetchCard();
      fetchChecklist();
      fetchCorrespondence();
      setActiveTab('details');
    }
  }, [cardId, fetchCard, fetchChecklist, fetchCorrespondence]);

  // Save details
  const handleSaveDetails = async () => {
    if (!cardId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/authority/pipeline/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: editNotes || null,
          live_url: editLiveUrl || null,
          clipping_url: editClippingUrl || null,
          confirmed_format: editConfirmedFormat || null,
          embargo_active: editEmbargoActive,
          embargo_date: editEmbargoDate || null,
          submission_deadline: editSubmissionDeadline || null,
          expected_publication_date: editExpectedPubDate || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save details:', err);
      }
    } catch (err) {
      console.error('Details save error:', err);
    }
    setSaving(false);
    fetchCard();
    onUpdate();
  };

  // Save commercial
  const handleSaveCommercial = async () => {
    if (!cardId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/authority/pipeline/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commercial: {
            engagement_type: editEngagementType,
            deal_value: editDealValue,
            payment_status: editPaymentStatus,
            payment_terms: editPaymentTerms || null,
            invoice_number: editInvoiceNumber || null,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save commercial:', err);
      }
    } catch (err) {
      console.error('Commercial save error:', err);
    }
    setSaving(false);
    fetchCard();
    onUpdate();
  };

  // Checklist toggle
  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/authority/pipeline/${cardId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, is_completed: completed }),
      });
      if (!res.ok) console.error('Failed to toggle checklist:', await res.json().catch(() => ({})));
    } catch (err) {
      console.error('Checklist toggle error:', err);
    }
    fetchChecklist();
  };

  // Add checklist item
  const handleAddChecklistItem = async (label: string) => {
    try {
      const res = await fetch(`/api/authority/pipeline/${cardId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) console.error('Failed to add checklist item:', await res.json().catch(() => ({})));
    } catch (err) {
      console.error('Checklist add error:', err);
    }
    fetchChecklist();
  };

  // Add correspondence
  const handleAddCorrespondence = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/authority/pipeline/${cardId}/correspondence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) console.error('Failed to add correspondence:', await res.json().catch(() => ({})));
    } catch (err) {
      console.error('Correspondence add error:', err);
    }
    fetchCorrespondence();
    onUpdate();
  };

  if (!cardId) return null;

  const stage = card?.authority_pipeline_stages;
  const contact = card?.authority_contacts;
  const storyAngle = card?.authority_story_angles;

  // ============================================================================
  // Tabs Config
  // ============================================================================

  const tabs: { key: Tab; label: string; icon: typeof InformationCircleIcon; badge?: number }[] = [
    { key: 'details', label: 'Details', icon: InformationCircleIcon },
    { key: 'commercial', label: 'Commercial', icon: CurrencyDollarIcon },
    { key: 'correspondence', label: 'Comms', icon: ChatBubbleLeftRightIcon, badge: card?.correspondence_count },
    { key: 'checklist', label: 'Checklist', icon: ClipboardDocumentCheckIcon, badge: card ? card.checklist_count - card.checklist_completed : undefined },
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Backdrop — click to close */}
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[28rem] bg-white border-l border-stone/15 shadow-2xl z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone/10">
          <div className="flex-1 min-w-0 pr-3">
            {loading ? (
              <div className="h-5 w-48 bg-stone/10 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="font-serif font-semibold text-charcoal truncate text-sm">
                  {card?.opportunity_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {stage && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: stage.color || '#6b7280' }}
                    >
                      {stage.name}
                    </span>
                  )}
                  {card && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: PRIORITY_CONFIG[card.priority]?.color,
                        backgroundColor: `${PRIORITY_CONFIG[card.priority]?.color}15`,
                      }}
                    >
                      {PRIORITY_CONFIG[card.priority]?.label}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-cream-warm rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-teal text-teal'
                    : 'border-transparent text-stone hover:text-charcoal'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-0.5 text-[9px] bg-teal/10 text-teal px-1.5 py-0.5 rounded-full font-semibold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-stone/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* ---- DETAILS TAB ---- */}
              {activeTab === 'details' && card && (
                <div className="p-5 space-y-4">
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="Category" value={CATEGORY_CONFIG[card.category]?.label} />
                    <InfoItem label="Reach Tier" value={card.reach_tier} />
                    <InfoItem label="Target Outlet" value={card.target_outlet || '—'} />
                    <InfoItem label="Target Date" value={card.target_date ? new Date(card.target_date).toLocaleDateString() : '—'} />
                  </div>

                  {/* Contact */}
                  {contact && (
                    <div className="p-3 bg-cream-warm/40 rounded-lg">
                      <p className="text-[10px] text-stone font-semibold uppercase tracking-wider mb-1">Contact</p>
                      <p className="text-sm font-medium text-charcoal">{contact.full_name}</p>
                      {contact.outlet && <p className="text-xs text-stone">{contact.outlet} · {contact.role}</p>}
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{
                            color: WARMTH_CONFIG[contact.warmth as keyof typeof WARMTH_CONFIG]?.color || '#6b7280',
                            backgroundColor: WARMTH_CONFIG[contact.warmth as keyof typeof WARMTH_CONFIG]?.bgColor || '#f3f4f6',
                          }}
                        >
                          {WARMTH_CONFIG[contact.warmth as keyof typeof WARMTH_CONFIG]?.label || contact.warmth}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Story Angle */}
                  {storyAngle && (
                    <div className="p-3 bg-cream-warm/40 rounded-lg">
                      <p className="text-[10px] text-stone font-semibold uppercase tracking-wider mb-1">Story Angle</p>
                      <p className="text-sm font-medium text-charcoal">{storyAngle.title}</p>
                      {storyAngle.description && <p className="text-xs text-stone mt-0.5">{storyAngle.description}</p>}
                    </div>
                  )}
                  {card.custom_story_angle && !storyAngle && (
                    <div className="p-3 bg-cream-warm/40 rounded-lg">
                      <p className="text-[10px] text-stone font-semibold uppercase tracking-wider mb-1">Story Angle (Custom)</p>
                      <p className="text-sm text-charcoal">{card.custom_story_angle}</p>
                    </div>
                  )}

                  {/* Dates & Embargo */}
                  <div className="space-y-3 pt-2 border-t border-stone/10">
                    <p className="text-[10px] text-stone font-semibold uppercase tracking-wider">Dates & Embargo</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-stone font-medium mb-0.5">Submission Deadline</label>
                        <input
                          type="date"
                          value={editSubmissionDeadline}
                          onChange={(e) => setEditSubmissionDeadline(e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone font-medium mb-0.5">Expected Publication</label>
                        <input
                          type="date"
                          value={editExpectedPubDate}
                          onChange={(e) => setEditExpectedPubDate(e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editEmbargoActive}
                          onChange={(e) => setEditEmbargoActive(e.target.checked)}
                          className="rounded border-stone/30 text-teal focus:ring-teal/30"
                        />
                        Embargo Active
                      </label>
                      {editEmbargoActive && (
                        <input
                          type="date"
                          value={editEmbargoDate}
                          onChange={(e) => setEditEmbargoDate(e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Confirmed Format */}
                  <div>
                    <label className="block text-[10px] text-stone font-medium mb-0.5">Confirmed Format</label>
                    <select
                      value={editConfirmedFormat}
                      onChange={(e) => setEditConfirmedFormat(e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                    >
                      <option value="">Not confirmed</option>
                      {CONFIRMED_FORMATS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Published URLs */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-stone font-medium mb-0.5">Live URL</label>
                      <input
                        type="url"
                        value={editLiveUrl}
                        onChange={(e) => setEditLiveUrl(e.target.value)}
                        className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone font-medium mb-0.5">Clipping URL</label>
                      <input
                        type="url"
                        value={editClippingUrl}
                        onChange={(e) => setEditClippingUrl(e.target.value)}
                        className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] text-stone font-medium mb-0.5">Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none resize-none"
                      placeholder="Internal notes..."
                    />
                  </div>

                  {/* Timeline */}
                  {(card.pitched_at || card.agreed_at || card.submitted_at || card.published_at) && (
                    <div className="pt-2 border-t border-stone/10">
                      <p className="text-[10px] text-stone font-semibold uppercase tracking-wider mb-2">Timeline</p>
                      <div className="space-y-1.5">
                        {card.pitched_at && <TimelineItem label="Pitched" date={card.pitched_at} />}
                        {card.agreed_at && <TimelineItem label="Agreed" date={card.agreed_at} />}
                        {card.submitted_at && <TimelineItem label="Submitted" date={card.submitted_at} />}
                        {card.published_at && <TimelineItem label="Published" date={card.published_at} />}
                        {card.amplified_at && <TimelineItem label="Amplified" date={card.amplified_at} />}
                      </div>
                    </div>
                  )}

                  {/* Save */}
                  <button
                    onClick={handleSaveDetails}
                    disabled={saving}
                    className="w-full py-2 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Details'}
                  </button>
                </div>
              )}

              {/* ---- COMMERCIAL TAB ---- */}
              {activeTab === 'commercial' && card && (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] text-stone font-medium mb-0.5">Engagement Type</label>
                    <select
                      value={editEngagementType}
                      onChange={(e) => setEditEngagementType(e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                    >
                      <option value="earned">Earned (Free)</option>
                      <option value="paid">Paid</option>
                      <option value="contra">Contra / Exchange</option>
                      <option value="sponsored">Sponsored</option>
                    </select>
                  </div>

                  {['paid', 'sponsored'].includes(editEngagementType) && (
                    <>
                      <div>
                        <label className="block text-[10px] text-stone font-medium mb-0.5">Deal Value (R)</label>
                        <input
                          type="number"
                          min="0"
                          value={editDealValue || ''}
                          onChange={(e) => setEditDealValue(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone font-medium mb-0.5">Payment Status</label>
                        <select
                          value={editPaymentStatus}
                          onChange={(e) => setEditPaymentStatus(e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                        >
                          <option value="not_invoiced">Not Invoiced</option>
                          <option value="invoiced">Invoiced</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone font-medium mb-0.5">Payment Terms</label>
                        <select
                          value={editPaymentTerms}
                          onChange={(e) => setEditPaymentTerms(e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                        >
                          <option value="">None</option>
                          <option value="prepaid">Prepaid</option>
                          <option value="net_30">Net 30</option>
                          <option value="net_60">Net 60</option>
                          <option value="contra">Contra</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone font-medium mb-0.5">Invoice Number</label>
                        <input
                          type="text"
                          value={editInvoiceNumber}
                          onChange={(e) => setEditInvoiceNumber(e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none"
                          placeholder="INV-001"
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleSaveCommercial}
                    disabled={saving}
                    className="w-full py-2 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Commercial'}
                  </button>
                </div>
              )}

              {/* ---- CORRESPONDENCE TAB ---- */}
              {activeTab === 'correspondence' && (
                <div className="p-5 space-y-3">
                  <button
                    onClick={() => setShowCorrespondenceModal(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-teal border border-teal/30 rounded-lg hover:bg-teal/5 transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Log Correspondence
                  </button>

                  {correspondence.length === 0 ? (
                    <p className="text-xs text-stone text-center py-6">No correspondence logged yet</p>
                  ) : (
                    <div className="space-y-2">
                      {correspondence.map((item) => {
                        const Icon = CORRESPONDENCE_ICONS[item.correspondence_type] || ChatBubbleLeftRightIcon;
                        return (
                          <div key={item.id} className="p-3 bg-cream-warm/40 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Icon className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-semibold text-charcoal truncate">{item.subject}</p>
                                  <ArrowRightIcon className={cn(
                                    'w-3 h-3 flex-shrink-0',
                                    item.direction === 'inbound' ? 'rotate-180 text-blue-500' : 'text-green-500'
                                  )} />
                                </div>
                                {item.body && (
                                  <p className="text-[11px] text-stone mt-0.5 line-clamp-2">{item.body}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {item.authority_contacts && (
                                    <span className="text-[10px] text-stone">{item.authority_contacts.full_name}</span>
                                  )}
                                  <span className="text-[10px] text-stone/60">
                                    {new Date(item.occurred_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Pitch Email Generator */}
                  {card && contact && (
                    <div className="pt-3 border-t border-stone/10">
                      <p className="text-[10px] text-stone font-semibold uppercase tracking-wider mb-2">AI Pitch Email</p>
                      <PitchEmailGenerator
                        organizationId={card.organization_id}
                        contactName={contact.full_name}
                        contactOutlet={contact.outlet}
                        contactWarmth={contact.warmth}
                        storyAngle={card.authority_story_angles?.title || card.custom_story_angle}
                        category={card.category}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ---- CHECKLIST TAB ---- */}
              {activeTab === 'checklist' && (
                <div className="p-5">
                  <ChecklistSection
                    items={checklist}
                    cardId={cardId!}
                    onToggle={handleChecklistToggle}
                    onAdd={handleAddChecklistItem}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Correspondence Modal */}
      <AddCorrespondenceModal
        isOpen={showCorrespondenceModal}
        onClose={() => setShowCorrespondenceModal(false)}
        onSubmit={handleAddCorrespondence}
        contacts={contacts}
        defaultContactId={card?.contact_id}
      />
    </>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-stone font-medium">{label}</p>
      <p className="text-xs text-charcoal font-medium capitalize">{value}</p>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0" />
      <span className="text-[11px] text-charcoal font-medium">{label}</span>
      <span className="text-[10px] text-stone ml-auto">{new Date(date).toLocaleDateString()}</span>
    </div>
  );
}
