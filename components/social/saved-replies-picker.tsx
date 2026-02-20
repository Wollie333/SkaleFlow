'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';

interface SavedRepliesPickerProps {
  savedReplies: any[];
  onSelect: (content: string) => void;
  onClose: () => void;
}

export function SavedRepliesPicker({
  savedReplies,
  onSelect,
  onClose,
}: SavedRepliesPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReplies = savedReplies.filter((reply) => {
    const query = searchQuery.toLowerCase();
    return (
      reply.name.toLowerCase().includes(query) ||
      reply.content.toLowerCase().includes(query) ||
      reply.category?.toLowerCase().includes(query)
    );
  });

  // Group by category
  const groupedReplies = filteredReplies.reduce((acc, reply) => {
    const category = reply.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(reply);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-10" onClick={onClose} />

      {/* Dropdown */}
      <div className="absolute bottom-full left-0 mb-2 w-96 max-w-[calc(100vw-2rem)] bg-cream-warm rounded-lg shadow-2xl border border-stone/10 z-20 max-h-[400px] flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-stone/10">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Search saved replies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Replies List */}
        <div className="flex-1 overflow-y-auto p-2">
          {Object.keys(groupedReplies).length === 0 ? (
            <div className="p-4 text-center text-sm text-stone">
              No saved replies found
            </div>
          ) : (
            <div className="space-y-3">
              {(Object.entries(groupedReplies) as [string, any[]][]).map(([category, replies]) => (
                <div key={category}>
                  <h4 className="px-2 text-xs font-semibold text-stone uppercase tracking-wider mb-1">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {replies.map((reply) => (
                      <button
                        key={reply.id}
                        onClick={() => onSelect(reply.content)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-cream transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-charcoal truncate">
                              {reply.name}
                            </p>
                            <p className="text-xs text-stone line-clamp-2 mt-0.5">
                              {reply.content}
                            </p>
                            {reply.use_count > 0 && (
                              <p className="text-[10px] text-stone/60 mt-1">
                                Used {reply.use_count} {reply.use_count === 1 ? 'time' : 'times'}
                              </p>
                            )}
                          </div>
                          <CheckIcon className="w-4 h-4 text-teal opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-stone/10 bg-stone/5">
          <a
            href="/social/library/replies"
            className="text-xs text-teal hover:text-teal-dark font-medium"
          >
            Manage saved replies →
          </a>
        </div>
      </div>
    </>
  );
}
