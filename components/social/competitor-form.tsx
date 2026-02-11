'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SocialPlatform } from '@/types/social';

interface CompetitorFormProps {
  competitor?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const PLATFORMS: { key: SocialPlatform; label: string; placeholder: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'company-name or personal-profile' },
  { key: 'facebook', label: 'Facebook', placeholder: 'page-name' },
  { key: 'instagram', label: 'Instagram', placeholder: '@username' },
  { key: 'twitter', label: 'Twitter', placeholder: '@username' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@username' },
  { key: 'youtube', label: 'YouTube', placeholder: '@channel or channel-id' },
];

export function CompetitorForm({ competitor, onSave, onCancel }: CompetitorFormProps) {
  const [formData, setFormData] = useState({
    name: competitor?.name || '',
    description: competitor?.description || '',
    website: competitor?.website || '',
    logo_url: competitor?.logo_url || '',
    linkedin_handle: competitor?.linkedin_handle || '',
    facebook_handle: competitor?.facebook_handle || '',
    instagram_handle: competitor?.instagram_handle || '',
    twitter_handle: competitor?.twitter_handle || '',
    tiktok_handle: competitor?.tiktok_handle || '',
    youtube_handle: competitor?.youtube_handle || '',
    track_mentions: competitor?.track_mentions ?? true,
    track_performance: competitor?.track_performance ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a competitor name');
      return;
    }

    // Check that at least one platform handle is provided
    const hasPlatform = PLATFORMS.some(
      (p) => formData[`${p.key}_handle` as keyof typeof formData]
    );

    if (!hasPlatform) {
      alert('Please add at least one social media handle');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving competitor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-xl font-semibold text-charcoal">
            {competitor ? 'Edit Competitor' : 'Add Competitor'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-stone hover:text-charcoal hover:bg-stone/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
              Basic Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Competitor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp, Competitor X"
                className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this competitor..."
                rows={3}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://competitor.com"
                  className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                />
              </div>
            </div>
          </div>

          {/* Social Media Handles */}
          <div className="space-y-4 border-t border-stone/10 pt-6">
            <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
              Social Media Handles
            </h3>
            <p className="text-xs text-stone">
              Add at least one platform handle to track this competitor
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLATFORMS.map((platform) => (
                <div key={platform.key}>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    {platform.label}
                  </label>
                  <input
                    type="text"
                    value={formData[`${platform.key}_handle` as keyof typeof formData] as string}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`${platform.key}_handle`]: e.target.value,
                      })
                    }
                    placeholder={platform.placeholder}
                    className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Options */}
          <div className="space-y-4 border-t border-stone/10 pt-6">
            <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
              Tracking Options
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.track_mentions}
                  onChange={(e) =>
                    setFormData({ ...formData, track_mentions: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 text-teal border-stone/20 rounded focus:ring-2 focus:ring-teal/20"
                />
                <div>
                  <p className="text-sm font-medium text-charcoal">Track Mentions</p>
                  <p className="text-xs text-stone">
                    Monitor when this competitor is mentioned across social media and the web
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.track_performance}
                  onChange={(e) =>
                    setFormData({ ...formData, track_performance: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 text-teal border-stone/20 rounded focus:ring-2 focus:ring-teal/20"
                />
                <div>
                  <p className="text-sm font-medium text-charcoal">Track Performance</p>
                  <p className="text-xs text-stone">
                    Collect metrics like follower growth, engagement rates, and posting frequency
                  </p>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal border border-stone/20 rounded-lg hover:bg-stone/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isSubmitting || !formData.name.trim()
                ? 'bg-stone/10 text-stone/40 cursor-not-allowed'
                : 'bg-teal text-white hover:bg-teal-dark'
            )}
          >
            {isSubmitting ? 'Saving...' : competitor ? 'Update Competitor' : 'Add Competitor'}
          </button>
        </div>
      </div>
    </>
  );
}
