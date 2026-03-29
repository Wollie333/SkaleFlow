'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';
import { PLATFORM_DEFAULTS, type SocialChannel } from '@/config/platform-defaults';

interface AdSet {
  id: string;
  channel: string;
  campaign_id: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface CreatePostDialogProps {
  campaignId: string;
  campaigns?: Campaign[];
  adsets: AdSet[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePostDialog({
  campaignId,
  campaigns = [],
  adsets,
  onClose,
  onSuccess,
}: CreatePostDialogProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId);

  // Filter adsets by selected campaign
  const filteredAdsets = adsets.filter(a => a.campaign_id === selectedCampaignId);

  const [adsetId, setAdsetId] = useState(filteredAdsets[0]?.id || '');
  const [contentType, setContentType] = useState<ContentTypeId>(4);
  const [format, setFormat] = useState('text');
  const [topic, setTopic] = useState('');
  const [hook, setHook] = useState('');
  const [body, setBody] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected adset's channel for format options
  const selectedAdset = filteredAdsets.find(a => a.id === adsetId);
  const selectedChannel = selectedAdset?.channel as SocialChannel;
  const platformConfig = selectedChannel ? PLATFORM_DEFAULTS[selectedChannel] : null;

  // Available formats based on channel
  const availableFormats = platformConfig?.formats || ['text', 'image', 'video', 'carousel'];

  // Update adsetId when campaign changes
  useEffect(() => {
    const newFilteredAdsets = adsets.filter(a => a.campaign_id === selectedCampaignId);
    if (newFilteredAdsets.length > 0 && !newFilteredAdsets.find(a => a.id === adsetId)) {
      setAdsetId(newFilteredAdsets[0].id);
    }
  }, [selectedCampaignId, adsets, adsetId]);

  async function handleSave() {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/content/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          adsetId,
          contentType,
          format,
          topic: topic.trim(),
          hook: hook.trim() || null,
          body: body.trim() || null,
          caption: caption.trim() || null,
          scheduledDate: scheduledDate || null,
          scheduledTime: scheduledTime || null,
          status: 'scripted', // Manual posts start as scripted
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-dark/80 flex items-center justify-center z-50 p-4">
      <div className="bg-cream-warm rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone/10">
          <h2 className="text-heading-md text-charcoal">New Post</h2>
          <button
            onClick={onClose}
            className="text-stone hover:text-charcoal transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Campaign selection (if multiple campaigns available) */}
          {campaigns.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Campaign
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none"
              >
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Channel selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Channel
            </label>
            <select
              value={adsetId}
              onChange={(e) => setAdsetId(e.target.value)}
              className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none"
            >
              {filteredAdsets.map(adset => {
                const platform = PLATFORM_DEFAULTS[adset.channel as SocialChannel];
                return (
                  <option key={adset.id} value={adset.id}>
                    {platform?.label || adset.channel}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(parseInt(e.target.value) as ContentTypeId)}
              className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none"
            >
              {Object.entries(CONTENT_TYPES).map(([id, type]) => (
                <option key={id} value={id}>
                  Type {id}: {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableFormats.map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`p-2 rounded-lg border capitalize transition-colors ${
                    format === fmt
                      ? 'border-teal bg-teal/5 text-charcoal'
                      : 'border-stone/10 bg-white hover:border-stone/20 text-stone'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 5 Ways to Improve Team Productivity"
              className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none"
            />
          </div>

          {/* Hook */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Hook / Opening Line
            </label>
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={2}
              placeholder="e.g., Most teams waste 3 hours per day on inefficient meetings..."
              className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none resize-none"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Body / Main Content
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write your post content here..."
              className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none resize-y"
            />
          </div>

          {/* Caption (for visual content) */}
          {['image', 'video', 'carousel'].includes(format) && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Caption for your visual content..."
                className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Scheduled Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Scheduled Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-stone/10">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
