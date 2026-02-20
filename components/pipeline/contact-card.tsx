'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { CurrencyDollarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

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

interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
  isDragging?: boolean;
}

export function ContactCard({ contact, onClick, isDragging }: ContactCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: contact.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const tags = (contact.pipeline_contact_tags || [])
    .map((t) => t.pipeline_tags)
    .filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'bg-cream-warm rounded-lg border border-stone/15 p-3 cursor-pointer hover:border-teal/30 hover:shadow-sm transition-all group',
        isDragging && 'opacity-50 shadow-lg rotate-2'
      )}
    >
      <p className="font-serif font-semibold text-sm text-charcoal truncate group-hover:text-teal transition-colors">
        {contact.full_name}
      </p>

      {contact.company && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <BuildingOfficeIcon className="w-3.5 h-3.5 text-stone/60" />
          <span className="text-xs text-stone truncate">{contact.company}</span>
        </div>
      )}

      {contact.value_cents > 0 && (
        <div className="flex items-center gap-1.5 mt-1">
          <CurrencyDollarIcon className="w-3.5 h-3.5 text-gold" />
          <span className="text-xs font-semibold text-gold">
            R {(contact.value_cents / 100).toLocaleString('en-ZA')}
          </span>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag!.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white shadow-sm"
              style={{ backgroundColor: tag!.color }}
            >
              {tag!.name}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-stone font-medium">+{tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
