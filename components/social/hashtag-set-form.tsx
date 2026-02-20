'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { SocialPlatform } from '@/types/social';

interface HashtagSetFormProps {
  set?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const PLATFORMS: SocialPlatform[] = [
  'linkedin',
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
];

const CATEGORIES = ['industry', 'trending', 'branded', 'campaign'];

export function HashtagSetForm({ set, onSave, onCancel }: HashtagSetFormProps) {
  const [formData, setFormData] = useState({
    name: set?.name || '',
    description: set?.description || '',
    hashtags: set?.hashtags || [],
    platforms: set?.platforms || [],
    category: set?.category || 'industry',
  });
  const [hashtagInput, setHashtagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddHashtag = () => {
    if (!hashtagInput.trim()) return;

    // Clean and format hashtag
    let tag = hashtagInput.trim();
    if (!tag.startsWith('#')) tag = `#${tag}`;

    // Check for duplicates
    if (formData.hashtags.includes(tag)) {
      alert('This hashtag is already in the set');
      return;
    }

    setFormData({
      ...formData,
      hashtags: [...formData.hashtags, tag],
    });
    setHashtagInput('');
  };

  const handleRemoveHashtag = (index: number) => {
    setFormData({
      ...formData,
      hashtags: formData.hashtags.filter((_: string, i: number) => i !== index),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const togglePlatform = (platform: SocialPlatform) => {
    const platforms = formData.platforms.includes(platform)
      ? formData.platforms.filter((p: SocialPlatform) => p !== platform)
      : [...formData.platforms, platform];
    setFormData({ ...formData, platforms });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a name for this hashtag set');
      return;
    }

    if (formData.hashtags.length === 0) {
      alert('Please add at least one hashtag');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving hashtag set:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlatformLabel = (platform: SocialPlatform): string => {
    const labels: Record<SocialPlatform, string> = {
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      instagram: 'Instagram',
      twitter: 'Twitter',
      tiktok: 'TikTok',
      youtube: 'YouTube',
    };
    return labels[platform];
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-cream-warm rounded-xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-xl font-semibold text-charcoal">
            {set ? 'Edit Hashtag Set' : 'Create Hashtag Set'}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Marketing Campaign 2024"
              className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe when to use this hashtag set..."
              rows={3}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal resize-none text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFormData({ ...formData, category })}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg border transition-colors capitalize',
                    formData.category === category
                      ? 'bg-teal text-white border-teal'
                      : 'bg-cream-warm text-stone border-stone/20 hover:border-teal hover:text-teal'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Platforms (optional)
            </label>
            <p className="text-xs text-stone mb-3">
              Select which platforms this hashtag set is optimized for
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                    formData.platforms.includes(platform)
                      ? 'bg-teal text-white border-teal'
                      : 'bg-cream-warm text-stone border-stone/20 hover:border-teal hover:text-teal'
                  )}
                >
                  {getPlatformLabel(platform)}
                </button>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Hashtags <span className="text-red-500">*</span>
            </label>

            {/* Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a hashtag and press Enter"
                className="flex-1 px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
              />
              <button
                type="button"
                onClick={handleAddHashtag}
                className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors text-sm font-medium flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Hashtag List */}
            {formData.hashtags.length === 0 ? (
              <div className="bg-stone/5 rounded-lg p-6 text-center">
                <p className="text-sm text-stone">No hashtags added yet</p>
              </div>
            ) : (
              <div className="bg-stone/5 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((tag: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cream-warm text-charcoal text-sm rounded-lg border border-stone/10"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHashtag(index)}
                        className="text-stone hover:text-red-600 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone mt-3">{formData.hashtags.length} hashtags</p>
              </div>
            )}
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
            disabled={isSubmitting || !formData.name.trim() || formData.hashtags.length === 0}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isSubmitting || !formData.name.trim() || formData.hashtags.length === 0
                ? 'bg-stone/10 text-stone/40 cursor-not-allowed'
                : 'bg-teal text-white hover:bg-teal-dark'
            )}
          >
            {isSubmitting ? 'Saving...' : set ? 'Update Set' : 'Create Set'}
          </button>
        </div>
      </div>
    </>
  );
}
