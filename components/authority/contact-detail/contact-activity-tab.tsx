'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface CorrespondenceItem {
  id: string;
  type: string;
  direction: string | null;
  email_subject: string | null;
  email_from: string | null;
  email_to: string | null;
  email_body_text: string | null;
  summary: string | null;
  content: string | null;
  occurred_at: string;
  card_id: string | null;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: EnvelopeIcon,
  phone_call: PhoneIcon,
  meeting: CalendarIcon,
  note: DocumentTextIcon,
  other: ChatBubbleLeftRightIcon,
};

const TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  phone_call: 'Phone Call',
  meeting: 'Meeting',
  note: 'Note',
  other: 'Other',
};

interface ContactActivityTabProps {
  contactId: string;
  organizationId: string;
}

export function ContactActivityTab({ contactId, organizationId }: ContactActivityTabProps) {
  const [items, setItems] = useState<CorrespondenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const loadActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/authority/contacts/${contactId}?include=correspondence`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.correspondence || []);
      }
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  const filtered = typeFilter
    ? items.filter(i => i.type === typeFilter)
    : items;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <FunnelIcon className="w-4 h-4 text-stone" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 border border-stone/20 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal/30"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <span className="text-xs text-stone">{filtered.length} items</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-stone text-center py-8">No activity recorded yet</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => {
            const Icon = TYPE_ICONS[item.type] || ChatBubbleLeftRightIcon;
            return (
              <div key={item.id} className="flex items-start gap-3 py-3 border-b border-stone/5 last:border-0">
                <div className="w-7 h-7 rounded-full bg-cream-warm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-charcoal truncate">
                      {item.email_subject || item.summary || TYPE_LABELS[item.type] || item.type}
                    </p>
                    {item.direction && (
                      <ArrowRightIcon className={cn(
                        'w-3 h-3 flex-shrink-0',
                        item.direction === 'inbound' ? 'rotate-180 text-blue-500' : 'text-green-500'
                      )} />
                    )}
                  </div>
                  {(item.content || item.email_body_text) && (
                    <p className="text-[11px] text-stone mt-0.5 line-clamp-2">
                      {item.content || item.email_body_text}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-stone capitalize">{TYPE_LABELS[item.type] || item.type}</span>
                    <span className="text-[10px] text-stone/60">
                      {new Date(item.occurred_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
