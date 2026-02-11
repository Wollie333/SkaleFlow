'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { CompetitorCard } from '@/components/social/competitor-card';
import { CompetitorForm } from '@/components/social/competitor-form';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface CompetitorManagementClientProps {
  initialCompetitors: any[];
  organizationId: string;
}

export function CompetitorManagementClient({
  initialCompetitors,
  organizationId,
}: CompetitorManagementClientProps) {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<any | null>(null);

  // Filter competitors
  const filteredCompetitors = competitors.filter((competitor) => {
    const matchesSearch =
      searchQuery === '' ||
      competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      competitor.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesActive = !showActiveOnly || competitor.is_active;

    return matchesSearch && matchesActive;
  });

  const handleCreateCompetitor = async (competitorData: any) => {
    try {
      const response = await fetch('/api/social/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitorData),
      });

      if (!response.ok) throw new Error('Failed to create competitor');

      const { data } = await response.json();
      setCompetitors([data, ...competitors]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating competitor:', error);
      alert('Failed to create competitor');
    }
  };

  const handleUpdateCompetitor = async (id: string, competitorData: any) => {
    try {
      const response = await fetch(`/api/social/competitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitorData),
      });

      if (!response.ok) throw new Error('Failed to update competitor');

      const { data } = await response.json();
      setCompetitors(competitors.map((c) => (c.id === id ? data : c)));
      setEditingCompetitor(null);
    } catch (error) {
      console.error('Error updating competitor:', error);
      alert('Failed to update competitor');
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competitor? All tracking data will be lost.'))
      return;

    try {
      const response = await fetch(`/api/social/competitors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete competitor');

      setCompetitors(competitors.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Error deleting competitor:', error);
      alert('Failed to delete competitor');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/social/competitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle competitor');

      const { data } = await response.json();
      setCompetitors(competitors.map((c) => (c.id === id ? data : c)));
    } catch (error) {
      console.error('Error toggling competitor:', error);
      alert('Failed to toggle competitor');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Competitor Tracking"
        description="Track and compare competitor performance across social media platforms"
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial sm:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Search competitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            />
          </div>

          {/* Active filter */}
          <button
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              showActiveOnly
                ? 'bg-teal text-white border-teal'
                : 'bg-white text-stone border-stone/20 hover:border-teal'
            }`}
          >
            Active Only
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Comparison Dashboard */}
          <Link
            href="/social/competitors/compare"
            className="flex items-center gap-2 px-4 py-2 bg-white text-charcoal border border-stone/20 rounded-lg hover:border-teal hover:text-teal transition-colors text-sm font-medium"
          >
            <ChartBarIcon className="w-4 h-4" />
            Compare
          </Link>

          {/* Add Competitor Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Add Competitor
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Total Competitors</p>
          <p className="text-2xl font-bold text-charcoal">{competitors.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Actively Tracking</p>
          <p className="text-2xl font-bold text-teal">
            {competitors.filter((c) => c.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Platforms Monitored</p>
          <p className="text-2xl font-bold text-charcoal">
            {new Set(
              competitors.flatMap((c) =>
                [
                  c.linkedin_handle && 'linkedin',
                  c.facebook_handle && 'facebook',
                  c.instagram_handle && 'instagram',
                  c.twitter_handle && 'twitter',
                  c.tiktok_handle && 'tiktok',
                  c.youtube_handle && 'youtube',
                ].filter(Boolean)
              )
            ).size}
          </p>
        </div>
      </div>

      {/* Competitors Grid */}
      {filteredCompetitors.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone/10 rounded-full flex items-center justify-center">
            <FunnelIcon className="w-8 h-8 text-stone" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No competitors found</h3>
          <p className="text-sm text-stone mb-4">
            {searchQuery || !showActiveOnly
              ? 'Try adjusting your filters'
              : 'Add your first competitor to start tracking'}
          </p>
          {!searchQuery && showActiveOnly && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Add Competitor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              onEdit={() => setEditingCompetitor(competitor)}
              onDelete={() => handleDeleteCompetitor(competitor.id)}
              onToggleActive={() => handleToggleActive(competitor.id, competitor.is_active)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingCompetitor) && (
        <CompetitorForm
          competitor={editingCompetitor}
          onSave={
            editingCompetitor
              ? (data) => handleUpdateCompetitor(editingCompetitor.id, data)
              : handleCreateCompetitor
          }
          onCancel={() => {
            setShowCreateForm(false);
            setEditingCompetitor(null);
          }}
        />
      )}
    </div>
  );
}
