'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LifecycleBadge } from '@/components/crm/lifecycle-badge';
import type { CrmLifecycleStage } from '@/types/database';
import {
  PencilIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface ContactHeaderData {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone?: string | null;
  job_title?: string | null;
  lifecycle_stage: string;
  lifetime_value_cents: number;
  created_at: string;
  company?: { id: string; name: string } | null;
}


interface ContactDetailHeaderProps {
  contact: ContactHeaderData;
  onEdit: () => void;
  organizationId: string;
}

export function ContactDetailHeader({
  contact,
  onEdit,
  organizationId,
}: ContactDetailHeaderProps) {
  const router = useRouter();

  const initials = `${contact.first_name[0] || ''}${contact.last_name[0] || ''}`.toUpperCase();
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const lifetimeValue = `R${(contact.lifetime_value_cents / 100).toFixed(2)}`;

  return (
    <div className="bg-white rounded-lg border border-stone p-6 space-y-4">
      {/* Top Row: Avatar + Info + Actions */}
      <div className="flex items-start justify-between gap-6">
        {/* Left: Avatar + Info */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-teal text-white flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>

          {/* Info */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-dark">{fullName}</h1>
            <div className="flex items-center gap-3 text-charcoal">
              {contact.job_title && (
                <span className="font-medium">{contact.job_title}</span>
              )}
              {contact.company && (
                <>
                  {contact.job_title && <span>at</span>}
                  <button
                    onClick={() => router.push(`/crm/companies/${contact.company!.id}`)}
                    className="text-teal hover:underline font-medium"
                  >
                    {contact.company.name}
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <LifecycleBadge stage={contact.lifecycle_stage as CrmLifecycleStage} />
              <span className="text-sm text-charcoal">
                Lifetime Value: <span className="font-semibold text-dark">{lifetimeValue}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 border border-stone rounded-lg text-charcoal hover:bg-cream transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Bottom Row: Action Buttons */}
      <div className="flex gap-3 pt-2 border-t border-stone">
        <button
          onClick={() => {
            // Scroll to activity tab
            const activityTab = document.querySelector('[data-tab="activity"]');
            if (activityTab) {
              (activityTab as HTMLElement).click();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-cream text-charcoal rounded-lg hover:bg-cream-warm transition-colors"
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
          Log Activity
        </button>
        <button
          onClick={() => router.push(`/crm/deals?contactId=${contact.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-cream text-charcoal rounded-lg hover:bg-cream-warm transition-colors"
        >
          <CurrencyDollarIcon className="w-5 h-5" />
          Create Deal
        </button>
        <button
          onClick={() => router.push(`/crm/invoices/new?contactId=${contact.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-cream text-charcoal rounded-lg hover:bg-cream-warm transition-colors"
        >
          <DocumentTextIcon className="w-5 h-5" />
          Create Invoice
        </button>
      </div>
    </div>
  );
}
