'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface HashtagPickerModalProps {
  onSelect: (hashtags: string[]) => void;
  onClose: () => void;
  organizationId: string;
  selectedPlatforms?: string[];
}

export function HashtagPickerModal({
  onSelect,
  onClose,
  organizationId,
  selectedPlatforms = [],
}: HashtagPickerModalProps) {
  const [hashtagSets, setHashtagSets] = useState<any[]>([]);
  const [selectedSet, setSelectedSet] = useState<any | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHashtagSets();
  }, []);

  const fetchHashtagSets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/social/hashtags?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch hashtag sets');

      const { data } = await response.json();
      setHashtagSets(data || []);
    } catch (error) {
      console.error('Error fetching hashtag sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSets = hashtagSets.filter((set) => {
    const matchesSearch =
      searchQuery === '' ||
      set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.hashtags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPlatform =
      selectedPlatforms.length === 0 ||
      !set.platforms ||
      set.platforms.length === 0 ||
      set.platforms.some((p: string) => selectedPlatforms.includes(p));

    return matchesSearch && matchesPlatform;
  });

  const toggleHashtag = (hashtag: string) => {
    const newSelected = new Set(selectedHashtags);
    if (newSelected.has(hashtag)) {
      newSelected.delete(hashtag);
    } else {
      newSelected.add(hashtag);
    }
    setSelectedHashtags(newSelected);
  };

  const selectAllFromSet = (set: any) => {
    const newSelected = new Set(selectedHashtags);
    set.hashtags.forEach((tag: string) => newSelected.add(tag));
    setSelectedHashtags(newSelected);
  };

  const handleInsert = () => {
    if (selectedHashtags.size === 0) {
      alert('Please select at least one hashtag');
      return;
    }

    onSelect(Array.from(selectedHashtags));
    onClose();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      industry: 'bg-blue-100 text-blue-700',
      trending: 'bg-pink-100 text-pink-700',
      branded: 'bg-purple-100 text-purple-700',
      campaign: 'bg-green-100 text-green-700',
    };
    return colors[category?.toLowerCase()] || 'bg-cream text-charcoal';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-cream-warm rounded-xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-charcoal">Insert Hashtags</h2>
            <p className="text-sm text-stone mt-1">
              Select individual hashtags or entire sets
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone hover:text-charcoal hover:bg-stone/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-stone/10">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Search hashtag sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Hashtag Sets List */}
          <div className="border-r border-stone/10 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
              </div>
            ) : filteredSets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-stone">No hashtag sets found</p>
                <a
                  href="/social/library/hashtags"
                  className="text-sm text-teal hover:text-teal-dark mt-2 inline-block"
                >
                  Create a hashtag set →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => setSelectedSet(set)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      selectedSet?.id === set.id
                        ? 'bg-teal/5 border-teal ring-1 ring-teal'
                        : 'bg-cream-warm border-stone/10 hover:border-teal/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-charcoal">{set.name}</h4>
                      {set.category && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-lg flex-shrink-0',
                            getCategoryColor(set.category)
                          )}
                        >
                          {set.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone">{set.hashtags.length} hashtags</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Hashtag Selection */}
          <div className="overflow-y-auto p-4">
            {selectedSet ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-charcoal">{selectedSet.name}</h3>
                  <button
                    onClick={() => selectAllFromSet(selectedSet)}
                    className="text-xs text-teal hover:text-teal-dark font-medium"
                  >
                    Select All
                  </button>
                </div>

                {selectedSet.description && (
                  <p className="text-sm text-stone mb-4">{selectedSet.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {selectedSet.hashtags.map((tag: string, index: number) => {
                    const isSelected = selectedHashtags.has(tag);
                    return (
                      <button
                        key={index}
                        onClick={() => toggleHashtag(tag)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all',
                          isSelected
                            ? 'bg-teal text-white border-teal'
                            : 'bg-cream-warm text-charcoal border-stone/10 hover:border-teal'
                        )}
                      >
                        {tag}
                        {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Performance Metrics */}
                {selectedSet.metrics && (
                  <div className="mt-4 pt-4 border-t border-stone/10">
                    <h4 className="text-xs font-semibold text-stone uppercase mb-2">
                      Performance
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-stone/5 rounded-lg p-3">
                        <p className="text-xs text-stone mb-1">Used</p>
                        <p className="text-lg font-semibold text-charcoal">
                          {selectedSet.metrics.totalUses || 0}
                        </p>
                      </div>
                      <div className="bg-stone/5 rounded-lg p-3">
                        <p className="text-xs text-stone mb-1">Avg Engagement</p>
                        <p className="text-lg font-semibold text-teal">
                          {selectedSet.metrics.avgEngagement || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-stone">Select a hashtag set to view hashtags</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone/10 bg-stone/5">
          <div className="text-sm text-stone">
            {selectedHashtags.size > 0 ? (
              <span className="font-medium text-charcoal">
                {selectedHashtags.size} hashtag{selectedHashtags.size === 1 ? '' : 's'} selected
              </span>
            ) : (
              <span>No hashtags selected</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal border border-stone/20 rounded-lg hover:bg-cream-warm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={selectedHashtags.size === 0}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                selectedHashtags.size === 0
                  ? 'bg-stone/10 text-stone/40 cursor-not-allowed'
                  : 'bg-teal text-white hover:bg-teal-dark'
              )}
            >
              Insert {selectedHashtags.size > 0 && `(${selectedHashtags.size})`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
