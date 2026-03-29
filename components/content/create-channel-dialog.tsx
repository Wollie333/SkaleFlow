'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PLATFORM_DEFAULTS, AGGRESSIVENESS_TIERS, type SocialChannel, type Aggressiveness } from '@/config/platform-defaults';

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
}

interface CreateChannelDialogProps {
  campaignId: string;
  campaignStartDate: string;
  campaignEndDate: string | null;
  campaigns?: Campaign[];
  selectedCampaignId?: string | null;
  onCampaignChange?: (campaignId: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateChannelDialog({
  campaignId,
  campaignStartDate,
  campaignEndDate,
  campaigns = [],
  selectedCampaignId,
  onCampaignChange,
  onClose,
  onSuccess,
}: CreateChannelDialogProps) {
  const [localCampaignId, setLocalCampaignId] = useState(selectedCampaignId || campaignId);
  const [channel, setChannel] = useState<SocialChannel>('linkedin');
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness>('committed');
  const [postsPerWeek, setPostsPerWeek] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the current selected campaign
  const currentCampaign = campaigns.find(c => c.id === localCampaignId) || {
    start_date: campaignStartDate,
    end_date: campaignEndDate,
  };

  // Calculate total posts based on campaign duration
  const calculateTotalPosts = () => {
    const start = new Date(currentCampaign.start_date);
    const end = currentCampaign.end_date ? new Date(currentCampaign.end_date) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return postsPerWeek * weeks;
  };

  const totalPosts = calculateTotalPosts();

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/content/campaigns/${localCampaignId}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          aggressiveness,
          postsPerWeek,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create channel');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-dark/80 flex items-center justify-center z-50 p-4">
      <div className="bg-cream-warm rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone/10">
          <h2 className="text-heading-md text-charcoal">Add Channel</h2>
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
          {campaigns.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Campaign
              </label>
              <select
                value={localCampaignId}
                onChange={(e) => {
                  setLocalCampaignId(e.target.value);
                  if (onCampaignChange) onCampaignChange(e.target.value);
                }}
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
              Channel / Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PLATFORM_DEFAULTS) as SocialChannel[]).map(ch => {
                const platform = PLATFORM_DEFAULTS[ch];
                return (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      channel === ch
                        ? 'border-teal bg-teal/5 text-charcoal'
                        : 'border-stone/10 bg-white hover:border-stone/20 text-stone'
                    }`}
                  >
                    {platform.icon && <span className="text-xl">{platform.icon}</span>}
                    <span className="text-sm font-medium">{platform.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aggressiveness */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Posting Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(AGGRESSIVENESS_TIERS) as Aggressiveness[]).map(agg => {
                const tier = AGGRESSIVENESS_TIERS[agg];
                return (
                  <button
                    key={agg}
                    onClick={() => {
                      setAggressiveness(agg);
                      setPostsPerWeek(tier.postsPerWeek);
                    }}
                    className={`p-3 rounded-lg border transition-colors ${
                      aggressiveness === agg
                        ? 'border-teal bg-teal/5 text-charcoal'
                        : 'border-stone/10 bg-white hover:border-stone/20 text-stone'
                    }`}
                  >
                    <div className="text-sm font-medium">{tier.label}</div>
                    <div className="text-xs text-stone mt-1">{tier.postsPerWeek}/week</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual quantity adjustment */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Posts Per Week (Manual Override)
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={postsPerWeek}
              onChange={(e) => setPostsPerWeek(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-stone/10 rounded-lg bg-white text-charcoal focus:border-teal focus:outline-none"
            />
            <p className="text-xs text-stone mt-1">
              Adjust the number of posts per week for this channel
            </p>
          </div>

          {/* Total posts calculation */}
          <div className="bg-teal/5 border border-teal/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-charcoal">Estimated Total Posts</span>
              <span className="text-2xl font-bold text-teal">{totalPosts}</span>
            </div>
            <p className="text-xs text-stone mt-1">
              Based on {postsPerWeek} posts/week over campaign duration
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-stone/10">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            Add Channel
          </Button>
        </div>
      </div>
    </div>
  );
}
