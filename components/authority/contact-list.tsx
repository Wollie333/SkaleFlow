'use client';

import { WarmthBadge } from './warmth-badge';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { CONTACT_ROLES } from '@/lib/authority/constants';
import type { AuthorityContactWarmth } from '@/lib/authority/types';

export interface AuthorityContactListItem {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  outlet: string | null;
  role: string | null;
  beat: string | null;
  location: string | null;
  warmth: AuthorityContactWarmth;
  last_contacted_at: string | null;
  created_at: string;
}

interface ContactListProps {
  contacts: AuthorityContactListItem[];
  onContactClick: (contact: AuthorityContactListItem) => void;
}

export function ContactList({ contacts, onContactClick }: ContactListProps) {
  const getRoleLabel = (role: string | null) => {
    if (!role) return '—';
    return CONTACT_ROLES.find((r) => r.value === role)?.label || role;
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-stone">No contacts found</p>
        <p className="text-xs text-stone/60 mt-1">Add a new contact or import from CSV</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone/10 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone/10">
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-stone uppercase tracking-wider">Name</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-stone uppercase tracking-wider">Outlet</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-stone uppercase tracking-wider">Role</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-stone uppercase tracking-wider">Beat</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-stone uppercase tracking-wider">Warmth</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-stone uppercase tracking-wider">Contact</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-stone uppercase tracking-wider">Last Contact</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              onClick={() => onContactClick(contact)}
              className="border-b border-stone/5 hover:bg-cream-warm/30 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-charcoal text-sm">{contact.full_name}</p>
                {contact.location && <p className="text-[10px] text-stone">{contact.location}</p>}
              </td>
              <td className="px-4 py-3 text-xs text-charcoal">{contact.outlet || '—'}</td>
              <td className="px-4 py-3 text-xs text-charcoal">{getRoleLabel(contact.role)}</td>
              <td className="px-4 py-3 text-xs text-charcoal">{contact.beat || '—'}</td>
              <td className="px-4 py-3">
                <WarmthBadge warmth={contact.warmth} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-stone hover:text-teal transition-colors"
                      title={contact.email}
                    >
                      <EnvelopeIcon className="w-4 h-4" />
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-stone hover:text-teal transition-colors"
                      title={contact.phone}
                    >
                      <PhoneIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-stone">
                {contact.last_contacted_at
                  ? new Date(contact.last_contacted_at).toLocaleDateString()
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
