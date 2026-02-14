'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AuthorityColumn } from './authority-column';
import { AuthorityCard } from './authority-card';

interface Stage {
  id: string;
  name: string;
  slug: string;
  stage_order: number;
  stage_type: string;
  color: string | null;
}

interface CardData {
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

interface AuthorityBoardProps {
  stages: Stage[];
  cards: CardData[];
  onCardMove: (cardId: string, newStageId: string) => Promise<void>;
  onCardClick: (card: CardData) => void;
  onAddCard: (stageId: string) => void;
}

export function AuthorityBoard({
  stages,
  cards,
  onCardMove,
  onCardClick,
  onAddCard,
}: AuthorityBoardProps) {
  const [activeCard, setActiveCard] = useState<CardData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  const getCardsForStage = useCallback(
    (stageId: string) => cards.filter((c) => c.stage_id === stageId),
    [cards]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    let targetStageId = over.id as string;

    // If dropped over another card, use its stage
    const overCard = cards.find((c) => c.id === over.id);
    if (overCard) {
      targetStageId = overCard.stage_id;
    }

    const isStage = stages.some((s) => s.id === targetStageId);
    if (!isStage) return;

    if (card.stage_id !== targetStageId) {
      await onCardMove(cardId, targetStageId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-16rem)] px-1">
        <SortableContext
          items={sortedStages.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          {sortedStages.map((stage) => (
            <AuthorityColumn
              key={stage.id}
              stage={stage}
              cards={getCardsForStage(stage.id)}
              onCardClick={onCardClick}
              onAddCard={() => onAddCard(stage.id)}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="w-60 shadow-xl">
            <AuthorityCard
              card={activeCard as Parameters<typeof AuthorityCard>[0]['card']}
              onClick={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
