'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  CheckIcon,
  CalendarIcon,
  UserIcon,
  EllipsisHorizontalIcon,
  TagIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface BulkActionsToolbarProps {
  selectedIds: Set<string>;
  onDeselectAll: () => void;
  onBulkAction: (action: BulkAction, data?: any) => void;
}

export type BulkAction =
  | 'approve'
  | 'reject'
  | 'schedule'
  | 'reschedule'
  | 'assign'
  | 'change_status'
  | 'add_tags'
  | 'duplicate'
  | 'delete';

export function BulkActionsToolbar({
  selectedIds,
  onDeselectAll,
  onBulkAction,
}: BulkActionsToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (selectedIds.size === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onDeselectAll} />

      {/* Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-cream-warm rounded-2xl shadow-2xl border border-stone/10 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-4 px-6 py-3">
          {/* Selection count */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
              <span className="text-sm font-bold text-teal">{selectedIds.size}</span>
            </div>
            <span className="text-sm font-medium text-charcoal">
              {selectedIds.size === 1 ? '1 post' : `${selectedIds.size} posts`} selected
            </span>
          </div>

          <div className="h-6 w-px bg-stone/20" />

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkAction('approve')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors"
              title="Approve selected posts"
            >
              <CheckIcon className="w-4 h-4" />
              Approve
            </button>

            <button
              onClick={() => onBulkAction('reschedule')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-charcoal bg-cream hover:bg-cream-warm rounded-lg transition-colors"
              title="Reschedule selected posts"
            >
              <CalendarIcon className="w-4 h-4" />
              Reschedule
            </button>

            <button
              onClick={() => onBulkAction('assign')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-charcoal bg-cream hover:bg-cream-warm rounded-lg transition-colors"
              title="Assign to team member"
            >
              <UserIcon className="w-4 h-4" />
              Assign
            </button>

            {/* More actions dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={cn(
                  'p-2 text-charcoal hover:bg-cream rounded-lg transition-colors',
                  showMoreMenu && 'bg-cream'
                )}
                title="More actions"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>

              {showMoreMenu && (
                <>
                  {/* Dropdown backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMoreMenu(false)}
                  />

                  {/* Dropdown menu */}
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-cream-warm rounded-lg shadow-xl border border-stone/10 py-1 z-20">
                    <button
                      onClick={() => {
                        onBulkAction('change_status');
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-cream transition-colors flex items-center gap-3"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Change Status
                    </button>
                    <button
                      onClick={() => {
                        onBulkAction('add_tags');
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-cream transition-colors flex items-center gap-3"
                    >
                      <TagIcon className="w-4 h-4" />
                      Add Tags
                    </button>
                    <button
                      onClick={() => {
                        onBulkAction('duplicate');
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-cream transition-colors flex items-center gap-3"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      Duplicate
                    </button>
                    <div className="my-1 border-t border-stone/10" />
                    <button
                      onClick={() => {
                        onBulkAction('delete');
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="h-6 w-px bg-stone/20" />

          {/* Close button */}
          <button
            onClick={onDeselectAll}
            className="p-2 text-stone hover:text-charcoal hover:bg-cream rounded-lg transition-colors"
            title="Deselect all"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
