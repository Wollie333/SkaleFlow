'use client';

import { useDroppable } from '@dnd-kit/core';
import { ContactCard } from './contact-card';
import { PlusIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

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

interface PipelineColumnProps {
  stage: Stage;
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
  onAddContact: () => void;
}

export function PipelineColumn({ stage, contacts, onContactClick, onAddContact }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalValue = contacts.reduce((sum, c) => sum + c.value_cents, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 min-w-[18rem] rounded-xl bg-cream-warm border border-stone/10 shadow-sm transition-all',
        isOver && 'border-teal/40 bg-teal/5 shadow-md'
      )}
    >
      {/* Header */}
      <div
        className="px-4 py-3 rounded-t-xl border-b border-stone/10"
        style={{ backgroundColor: `${stage.color}12` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/80 ring-offset-1"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-serif font-semibold text-sm text-charcoal truncate">{stage.name}</h3>
          <span className="ml-auto text-[11px] text-white px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: stage.color }}>
            {contacts.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-gold font-medium mt-1.5 ml-5">
            R {(totalValue / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
          </p>
        )}
      </div>

      {/* Contacts */}
      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto max-h-[calc(100vh-20rem)] bg-cream-warm/50 rounded-b-xl">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onClick={() => onContactClick(contact)}
          />
        ))}

        {/* Add contact button */}
        <button
          onClick={onAddContact}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-stone hover:text-teal hover:bg-cream rounded-lg border border-dashed border-stone/15 hover:border-teal/30 transition-all"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add contact
        </button>
      </div>
    </div>
  );
}
