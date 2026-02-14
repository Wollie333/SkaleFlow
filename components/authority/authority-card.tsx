'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, WARMTH_CONFIG } from '@/lib/authority/constants';
import type { AuthorityCategory, AuthorityPriority, AuthorityContactWarmth } from '@/lib/authority/types';
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AuthorityCardData {
  id: string;
  opportunity_name: string;
  category: AuthorityCategory;
  priority: AuthorityPriority;
  stage_id: string;
  target_outlet: string | null;
  target_date: string | null;
  embargo_active: boolean;
  authority_contacts?: { id: string; full_name: string; outlet: string | null; warmth: AuthorityContactWarmth } | null;
  authority_commercial?: { engagement_type: string; deal_value: number; currency: string; payment_status: string } | null;
}

interface AuthorityCardProps {
  card: AuthorityCardData;
  onClick: () => void;
  isDragging?: boolean;
}

export function AuthorityCard({ card, onClick, isDragging }: AuthorityCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const categoryInfo = CATEGORY_CONFIG[card.category];
  const priorityInfo = PRIORITY_CONFIG[card.priority];
  const contactWarmth = card.authority_contacts?.warmth
    ? WARMTH_CONFIG[card.authority_contacts.warmth]
    : null;
  const dealValue = card.authority_commercial?.deal_value;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-stone/15 p-3 cursor-pointer hover:border-teal/30 hover:shadow-sm transition-all group',
        isDragging && 'opacity-50 shadow-lg rotate-2'
      )}
    >
      {/* Priority + Category badges */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
          style={{ backgroundColor: priorityInfo.color }}
        >
          {priorityInfo.label}
        </span>
        <span className="text-[10px] text-stone truncate">
          {categoryInfo.label}
        </span>
      </div>

      {/* Opportunity name */}
      <p className="font-serif font-semibold text-sm text-charcoal truncate group-hover:text-teal transition-colors">
        {card.opportunity_name}
      </p>

      {/* Target outlet */}
      {card.target_outlet && (
        <p className="text-xs text-stone mt-1 truncate">{card.target_outlet}</p>
      )}

      {/* Contact warmth */}
      {card.authority_contacts && contactWarmth && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: contactWarmth.color }}
          />
          <span className="text-[11px] text-stone truncate">
            {card.authority_contacts.full_name}
          </span>
        </div>
      )}

      {/* Bottom row: date, value, embargo */}
      <div className="flex items-center gap-2 mt-2">
        {card.target_date && (
          <div className="flex items-center gap-1">
            <CalendarDaysIcon className="w-3 h-3 text-stone/60" />
            <span className="text-[10px] text-stone">
              {new Date(card.target_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}

        {dealValue && dealValue > 0 && (
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-3 h-3 text-gold" />
            <span className="text-[10px] font-semibold text-gold">
              R {dealValue.toLocaleString('en-ZA')}
            </span>
          </div>
        )}

        {card.embargo_active && (
          <div className="flex items-center gap-1 ml-auto">
            <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-semibold text-red-500">EMBARGO</span>
          </div>
        )}
      </div>
    </div>
  );
}
