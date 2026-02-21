'use client';

import { useRouter } from 'next/navigation';
import { BookmarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { PR_DIRECTORY_CATEGORIES } from '@/lib/authority/directory-constants';
import type { PRDirectoryCategory } from '@/types/database';

export interface DirectoryContactCardData {
  id: string;
  full_name: string;
  company: string | null;
  job_title: string | null;
  photo_url: string | null;
  category: PRDirectoryCategory;
  country: string | null;
  city: string | null;
  industry_types: string[] | null;
  is_saved: boolean;
}

interface DirectoryContactCardProps {
  contact: DirectoryContactCardData;
  onToggleSave: (contactId: string, currentlySaved: boolean) => void;
  onReachOut: (contactId: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DirectoryContactCard({ contact, onToggleSave, onReachOut }: DirectoryContactCardProps) {
  const router = useRouter();
  const categoryConfig = PR_DIRECTORY_CATEGORIES[contact.category];
  const industries = contact.industry_types || [];
  const location = [contact.city, contact.country].filter(Boolean).join(', ');

  return (
    <div
      onClick={() => router.push(`/authority/directory/${contact.id}`)}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {/* Photo / Initials */}
        <div className="flex-shrink-0">
          {contact.photo_url ? (
            <img
              src={contact.photo_url}
              alt={contact.full_name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
              {getInitials(contact.full_name)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
            {contact.full_name}
          </h3>
          {(contact.job_title || contact.company) && (
            <p className="text-sm text-gray-500 truncate">
              {[contact.job_title, contact.company].filter(Boolean).join(' at ')}
            </p>
          )}
        </div>

        {/* Bookmark */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(contact.id, contact.is_saved);
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
        >
          {contact.is_saved ? (
            <BookmarkSolidIcon className="h-5 w-5 text-teal-600" />
          ) : (
            <BookmarkIcon className="h-5 w-5 text-gray-400 hover:text-teal-600" />
          )}
        </button>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryConfig.color}`}>
          {categoryConfig.label}
        </span>
        {location && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <MapPinIcon className="h-3.5 w-3.5" />
            {location}
          </span>
        )}
      </div>

      {/* Industry tags */}
      {industries.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {industries.slice(0, 2).map((ind) => (
            <span key={ind} className="px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600">
              {ind}
            </span>
          ))}
          {industries.length > 2 && (
            <span className="text-xs text-gray-400">+{industries.length - 2}</span>
          )}
        </div>
      )}

      {/* Reach Out button */}
      <div className="mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReachOut(contact.id);
          }}
          className="w-full py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Reach Out
        </button>
      </div>
    </div>
  );
}
