'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AuthorityCard } from './authority-card';
import { PlusIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { CLOSED_STAGE_SLUGS } from '@/lib/authority/constants';

interface Stage {
  id: string;
  name: string;
  slug: string;
  stage_order: number;
  stage_type: string;
  color: string | null;
}

interface ColumnCard {
  id: string;
  opportunity_name: string;
  category: string;
  priority: string;
  stage_id: string;
  target_outlet: string | null;
  target_date: string | null;
  embargo_active: boolean;
  authority_contacts?: { id: string; full_name: string; outlet: string | null; warmth: string } | null;
  authority_commercial?: { engagement_type: string; deal_value: number; currency: string; payment_status: string } | null;
}

interface AuthorityColumnProps {
  stage: Stage;
  cards: ColumnCard[];
  onCardClick: (card: ColumnCard) => void;
  onAddCard: () => void;
}

export function AuthorityColumn({ stage, cards, onCardClick, onAddCard }: AuthorityColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const isClosed = (CLOSED_STAGE_SLUGS as readonly string[]).includes(stage.slug);
  const [collapsed, setCollapsed] = useState(isClosed);

  const stageColor = stage.color || '#6b7280';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-60 min-w-[15rem] rounded-xl bg-white border border-stone/10 shadow-sm transition-all flex-shrink-0',
        isOver && 'border-teal/40 bg-teal/5 shadow-md'
      )}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5 rounded-t-xl border-b border-stone/10 cursor-pointer"
        style={{ backgroundColor: `${stageColor}12` }}
        onClick={isClosed ? () => setCollapsed(!collapsed) : undefined}
      >
        <div className="flex items-center gap-2">
          {isClosed && (
            collapsed
              ? <ChevronRightIcon className="w-3.5 h-3.5 text-stone/60" />
              : <ChevronDownIcon className="w-3.5 h-3.5 text-stone/60" />
          )}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: stageColor }}
          />
          <h3 className="font-serif font-semibold text-xs text-charcoal truncate">{stage.name}</h3>
          <span
            className="ml-auto text-[10px] text-white px-1.5 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: stageColor }}
          >
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      {!collapsed && (
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-20rem)] bg-cream-warm/50 rounded-b-xl">
          {cards.map((card) => (
            <AuthorityCard
              key={card.id}
              card={card as Parameters<typeof AuthorityCard>[0]['card']}
              onClick={() => onCardClick(card)}
            />
          ))}

          {!isClosed && (
            <button
              onClick={onAddCard}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium text-teal bg-teal/10 hover:bg-teal/20 rounded-lg border border-teal/20 hover:border-teal/40 transition-all"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add opportunity
            </button>
          )}
        </div>
      )}
    </div>
  );
}
