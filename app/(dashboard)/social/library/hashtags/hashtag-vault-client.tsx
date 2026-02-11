'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { HashtagSetCard } from '@/components/social/hashtag-set-card';
import { HashtagSetForm } from '@/components/social/hashtag-set-form';
import { TrendingHashtagsWidget } from '@/components/social/trending-hashtags-widget';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface HashtagVaultClientProps {
  initialHashtagSets: any[];
  organizationId: string;
}

const CATEGORIES = ['All', 'Industry', 'Trending', 'Branded', 'Campaign'];

export function HashtagVaultClient({
  initialHashtagSets,
  organizationId,
}: HashtagVaultClientProps) {
  const [hashtagSets, setHashtagSets] = useState(initialHashtagSets);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSet, setEditingSet] = useState<any | null>(null);

  // Filter sets
  const filteredSets = hashtagSets.filter((set) => {
    const matchesSearch =
      searchQuery === '' ||
      set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.hashtags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || set.category === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleCreateSet = async (setData: any) => {
    try {
      const response = await fetch('/api/social/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setData),
      });

      if (!response.ok) throw new Error('Failed to create hashtag set');

      const { data } = await response.json();
      setHashtagSets([data, ...hashtagSets]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating hashtag set:', error);
      alert('Failed to create hashtag set');
    }
  };

  const handleUpdateSet = async (id: string, setData: any) => {
    try {
      const response = await fetch(`/api/social/hashtags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setData),
      });

      if (!response.ok) throw new Error('Failed to update hashtag set');

      const { data } = await response.json();
      setHashtagSets(hashtagSets.map((set) => (set.id === id ? data : set)));
      setEditingSet(null);
    } catch (error) {
      console.error('Error updating hashtag set:', error);
      alert('Failed to update hashtag set');
    }
  };

  const handleDeleteSet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hashtag set?')) return;

    try {
      const response = await fetch(`/api/social/hashtags/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete hashtag set');

      setHashtagSets(hashtagSets.filter((set) => set.id !== id));
    } catch (error) {
      console.error('Error deleting hashtag set:', error);
      alert('Failed to delete hashtag set');
    }
  };

  const handleCopySet = async (hashtags: string[]) => {
    const text = hashtags.join(' ');
    try {
      await navigator.clipboard.writeText(text);
      alert('Hashtags copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Hashtag Vault"
        description="Save and organize hashtag sets for quick insertion into posts"
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial sm:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Search hashtag sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-charcoal"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  selectedCategory === category
                    ? 'bg-teal text-white border-teal'
                    : 'bg-white text-stone border-stone/20 hover:border-teal hover:text-teal'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          Create Hashtag Set
        </button>
      </div>

      {/* Trending Hashtags Widget */}
      <TrendingHashtagsWidget organizationId={organizationId} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Total Sets</p>
          <p className="text-2xl font-bold text-charcoal">{hashtagSets.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Total Hashtags</p>
          <p className="text-2xl font-bold text-charcoal">
            {hashtagSets.reduce((sum, set) => sum + (set.hashtags?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Average Engagement</p>
          <p className="text-2xl font-bold text-charcoal">
            {hashtagSets.length > 0
              ? (
                  hashtagSets.reduce((sum, set) => sum + (set.metrics?.avgEngagement || 0), 0) /
                  hashtagSets.length
                ).toFixed(2)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Hashtag Sets Grid */}
      {filteredSets.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone/10 rounded-full flex items-center justify-center">
            <FunnelIcon className="w-8 h-8 text-stone" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No hashtag sets found</h3>
          <p className="text-sm text-stone mb-4">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your filters'
              : 'Create your first hashtag set to get started'}
          </p>
          {!searchQuery && selectedCategory === 'All' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Create Hashtag Set
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSets.map((set) => (
            <HashtagSetCard
              key={set.id}
              set={set}
              onEdit={() => setEditingSet(set)}
              onDelete={() => handleDeleteSet(set.id)}
              onCopy={() => handleCopySet(set.hashtags)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingSet) && (
        <HashtagSetForm
          set={editingSet}
          onSave={
            editingSet
              ? (data) => handleUpdateSet(editingSet.id, data)
              : handleCreateSet
          }
          onCancel={() => {
            setShowCreateForm(false);
            setEditingSet(null);
          }}
        />
      )}
    </div>
  );
}
