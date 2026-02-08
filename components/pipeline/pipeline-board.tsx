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
import { PipelineColumn } from './pipeline-column';
import { ContactCard } from './contact-card';

interface Stage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_win_stage: boolean;
  is_loss_stage: boolean;
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
  assigned_to: string | null;
  notes: string | null;
  pipeline_contact_tags?: ContactTag[];
  created_at: string;
}

interface PipelineBoardProps {
  pipelineId: string;
  stages: Stage[];
  contacts: Contact[];
  onContactMove: (contactId: string, newStageId: string) => Promise<void>;
  onContactClick: (contact: Contact) => void;
  onAddContact: (stageId: string) => void;
}

export function PipelineBoard({
  pipelineId,
  stages,
  contacts,
  onContactMove,
  onContactClick,
  onAddContact,
}: PipelineBoardProps) {
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order);

  const getContactsForStage = useCallback(
    (stageId: string) => contacts.filter((c) => c.stage_id === stageId),
    [contacts]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const contact = contacts.find((c) => c.id === event.active.id);
    if (contact) setActiveContact(contact);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveContact(null);
    const { active, over } = event;
    if (!over) return;

    const contactId = active.id as string;
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    // Determine target stage: over could be a stage column or another contact
    let targetStageId = over.id as string;

    // Check if we dropped over a contact instead of a stage
    const overContact = contacts.find((c) => c.id === over.id);
    if (overContact) {
      targetStageId = overContact.stage_id;
    }

    // Check if it's a valid stage
    const isStage = stages.some((s) => s.id === targetStageId);
    if (!isStage) return;

    if (contact.stage_id !== targetStageId) {
      await onContactMove(contactId, targetStageId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-14rem)] px-1">
        <SortableContext
          items={sortedStages.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          {sortedStages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              contacts={getContactsForStage(stage.id)}
              onContactClick={onContactClick}
              onAddContact={() => onAddContact(stage.id)}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeContact ? (
          <div className="w-64 shadow-xl">
            <ContactCard contact={activeContact} onClick={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
