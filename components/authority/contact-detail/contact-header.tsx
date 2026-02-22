'use client';

import {
  EnvelopeIcon,
  PhoneIcon,
  PlusIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { WARMTH_CONFIG } from '@/lib/authority/constants';
import { useRouter } from 'next/navigation';

interface ContactHeaderProps {
  contact: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    outlet: string | null;
    role: string | null;
    warmth: string;
    linkedin_url: string | null;
    twitter_url: string | null;
  };
  hasGmail: boolean;
  onSendEmail: () => void;
  onEditContact: () => void;
}

export function ContactHeader({ contact, hasGmail, onSendEmail, onEditContact }: ContactHeaderProps) {
  const router = useRouter();
  const warmthConfig = WARMTH_CONFIG[contact.warmth as keyof typeof WARMTH_CONFIG];

  return (
    <div className="bg-cream-warm border border-stone/10 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/authority/contacts')}
            className="mt-1 p-1.5 hover:bg-cream rounded-lg transition-colors"
            title="Back to contacts"
          >
            <ArrowLeftIcon className="w-5 h-5 text-stone" />
          </button>

          <div>
            <h1 className="text-2xl font-serif font-bold text-charcoal">{contact.full_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {contact.outlet && (
                <span className="text-sm text-stone">{contact.outlet}</span>
              )}
              {contact.role && (
                <span className="text-sm text-stone">{contact.outlet ? `· ${contact.role}` : contact.role}</span>
              )}
              {warmthConfig && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: warmthConfig.color, backgroundColor: warmthConfig.bgColor }}
                >
                  {warmthConfig.label}
                </span>
              )}
            </div>

            {/* Contact Info Icons */}
            <div className="flex items-center gap-4 mt-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-teal hover:underline">
                  <EnvelopeIcon className="w-3.5 h-3.5" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-stone hover:text-charcoal">
                  <PhoneIcon className="w-3.5 h-3.5" />
                  {contact.phone}
                </a>
              )}
              {contact.linkedin_url && (
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                  LinkedIn
                </a>
              )}
              {contact.twitter_url && (
                <a href={contact.twitter_url} target="_blank" rel="noopener noreferrer" className="text-xs text-stone hover:underline">
                  X/Twitter
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasGmail && contact.email && (
            <button
              onClick={onSendEmail}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors"
            >
              <EnvelopeIcon className="w-4 h-4" />
              Send Email
            </button>
          )}
          <button
            onClick={onEditContact}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal border border-stone/20 rounded-lg hover:bg-cream transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
