'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface KeywordManagerProps {
  keywords: any[];
  organizationId: string;
  onClose: () => void;
}

const KEYWORD_TYPES = [
  { value: 'brand', label: 'Brand', description: 'Your brand name and variations' },
  { value: 'competitor', label: 'Competitor', description: 'Competitor brand names' },
  { value: 'industry', label: 'Industry', description: 'Industry terms and topics' },
  { value: 'hashtag', label: 'Hashtag', description: 'Hashtags to track' },
];

export function KeywordManager({ keywords: initialKeywords, organizationId, onClose }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('brand');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      alert('Please enter a keyword');
      return;
    }

    try {
      setIsAdding(true);
      const response = await fetch('/api/social/listening/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          keywordType: selectedType,
        }),
      });

      if (!response.ok) throw new Error('Failed to add keyword');

      const { data } = await response.json();
      setKeywords([data, ...keywords]);
      setNewKeyword('');
    } catch (error) {
      console.error('Error adding keyword:', error);
      alert('Failed to add keyword');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm('Are you sure you want to stop tracking this keyword?')) return;

    try {
      const response = await fetch(`/api/social/listening/keywords/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete keyword');

      setKeywords(keywords.filter((k) => k.id !== id));
    } catch (error) {
      console.error('Error deleting keyword:', error);
      alert('Failed to delete keyword');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/social/listening/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle keyword');

      const { data } = await response.json();
      setKeywords(keywords.map((k) => (k.id === id ? data : k)));
    } catch (error) {
      console.error('Error toggling keyword:', error);
      alert('Failed to toggle keyword');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      brand: 'bg-teal/10 text-teal border-teal/20',
      competitor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      industry: 'bg-teal/10 text-teal border-teal/20',
      hashtag: 'bg-purple-600/10 text-purple-600 border-purple-600/20',
    };
    return colors[type] || 'bg-cream text-charcoal border-stone/10';
  };

  // Group by type
  const groupedKeywords = keywords.reduce((acc, keyword) => {
    const type = keyword.keyword_type || 'brand';
    if (!acc[type]) acc[type] = [];
    acc[type].push(keyword);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-cream-warm rounded-xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div>
            <h2 className="text-xl font-semibold text-charcoal">Manage Keywords</h2>
            <p className="text-sm text-stone mt-1">
              Track brand mentions, competitors, and industry topics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone hover:text-charcoal hover:bg-stone/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Add Keyword */}
        <div className="px-6 py-4 border-b border-stone/10 bg-stone/5">
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddKeyword();
              }}
              placeholder="Enter keyword to track..."
              className="flex-1 px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            />

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            >
              {KEYWORD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleAddKeyword}
              disabled={isAdding || !newKeyword.trim()}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                isAdding || !newKeyword.trim()
                  ? 'bg-stone/10 text-stone/40 cursor-not-allowed'
                  : 'bg-teal text-white hover:bg-teal-dark'
              )}
            >
              <PlusIcon className="w-4 h-4" />
              Add
            </button>
          </div>

          <p className="text-xs text-stone mt-2">
            Press Enter to add or click the Add button
          </p>
        </div>

        {/* Keywords List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {keywords.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-stone/10 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-8 h-8 text-stone" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">No keywords yet</h3>
              <p className="text-sm text-stone">
                Add keywords above to start tracking brand mentions and trends
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {KEYWORD_TYPES.map((type) => {
                const typeKeywords = groupedKeywords[type.value] || [];
                if (typeKeywords.length === 0) return null;

                return (
                  <div key={type.value}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-charcoal">{type.label}</h3>
                        <p className="text-xs text-stone">{type.description}</p>
                      </div>
                      <span className="text-xs text-stone">{typeKeywords.length} keyword{typeKeywords.length === 1 ? '' : 's'}</span>
                    </div>

                    <div className="space-y-2">
                      {typeKeywords.map((keyword: any) => (
                        <div
                          key={keyword.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border transition-all',
                            keyword.is_active
                              ? 'bg-cream-warm border-stone/10'
                              : 'bg-stone/5 border-stone/20 opacity-60'
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span
                              className={cn(
                                'px-2.5 py-1 text-xs font-medium rounded-lg border',
                                getTypeColor(keyword.keyword_type)
                              )}
                            >
                              {keyword.keyword}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(keyword.id, keyword.is_active)}
                              className={cn(
                                'px-3 py-1 text-xs font-medium rounded-lg border transition-colors',
                                keyword.is_active
                                  ? 'bg-teal text-white border-teal'
                                  : 'bg-cream-warm text-stone border-stone/20 hover:border-teal'
                              )}
                            >
                              {keyword.is_active ? 'Active' : 'Inactive'}
                            </button>

                            <button
                              onClick={() => handleDeleteKeyword(keyword.id)}
                              className="p-1.5 text-stone hover:text-red-600 hover:bg-red-600/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone/10 bg-stone/5">
          <p className="text-xs text-stone">
            Total: {keywords.length} keyword{keywords.length === 1 ? '' : 's'} •{' '}
            {keywords.filter((k) => k.is_active).length} active
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-cream-warm text-charcoal border border-stone/20 rounded-lg hover:bg-stone/5 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
