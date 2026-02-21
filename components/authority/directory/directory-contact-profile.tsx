'use client';

import {
  BookmarkIcon,
  FlagIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { PR_DIRECTORY_CATEGORIES } from '@/lib/authority/directory-constants';
import type { PRDirectoryCategory } from '@/types/database';

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

export interface DirectoryContactProfileData {
  id: string;
  full_name: string;
  company: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  description: string | null;
  website_url: string | null;
  social_links: SocialLinks | null;
  category: PRDirectoryCategory;
  industry_types: string[] | null;
  country: string | null;
  city: string | null;
  province_state: string | null;
  added_by_name: string | null;
  is_saved: boolean;
  save_count: number;
  created_at: string;
}

interface DirectoryContactProfileProps {
  contact: DirectoryContactProfileData;
  onReachOut: () => void;
  onToggleSave: () => void;
  onFlag: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DirectoryContactProfile({
  contact,
  onReachOut,
  onToggleSave,
  onFlag,
}: DirectoryContactProfileProps) {
  const categoryConfig = PR_DIRECTORY_CATEGORIES[contact.category];
  const location = [contact.city, contact.province_state, contact.country].filter(Boolean).join(', ');
  const socialLinks = contact.social_links || {};

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {contact.photo_url ? (
              <img
                src={contact.photo_url}
                alt={contact.full_name}
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-2xl">
                {getInitials(contact.full_name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{contact.full_name}</h1>
            {(contact.job_title || contact.company) && (
              <p className="text-lg text-gray-600 mt-1">
                {[contact.job_title, contact.company].filter(Boolean).join(' at ')}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryConfig.color}`}>
                {categoryConfig.label}
              </span>
              {location && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4" />
                  {location}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={onReachOut}
              className="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors text-sm"
            >
              Reach Out
            </button>
            <div className="flex gap-2">
              <button
                onClick={onToggleSave}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  contact.is_saved
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {contact.is_saved ? (
                  <BookmarkSolidIcon className="h-4 w-4" />
                ) : (
                  <BookmarkIcon className="h-4 w-4" />
                )}
                {contact.is_saved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={onFlag}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <FlagIcon className="h-4 w-4" />
                Flag
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="border-t border-gray-100 p-6 sm:p-8 space-y-6">
        {/* Description */}
        {contact.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">About</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{contact.description}</p>
          </div>
        )}

        {/* Contact info */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
          <div className="space-y-2">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-teal-700 hover:underline">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-teal-700 hover:underline">
                <PhoneIcon className="h-4 w-4 text-gray-400" />
                {contact.phone}
              </a>
            )}
            {contact.website_url && (
              <a
                href={contact.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-teal-700 hover:underline"
              >
                <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                {contact.website_url}
              </a>
            )}
          </div>
        </div>

        {/* Social links */}
        {Object.keys(socialLinks).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Social</h3>
            <div className="flex gap-3">
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-700 hover:underline">
                  LinkedIn
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-700 hover:underline">
                  Twitter/X
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-700 hover:underline">
                  Instagram
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-700 hover:underline">
                  Facebook
                </a>
              )}
            </div>
          </div>
        )}

        {/* Industry tags */}
        {(contact.industry_types || []).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Industries</h3>
            <div className="flex flex-wrap gap-2">
              {(contact.industry_types || []).map((ind) => (
                <span key={ind} className="px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attribution */}
        {contact.added_by_name && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Added by {contact.added_by_name} &middot; {new Date(contact.created_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
