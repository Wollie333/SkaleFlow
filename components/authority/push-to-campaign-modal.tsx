'use client';

import { useState } from 'react';
import { XMarkIcon, RocketLaunchIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { AMPLIFICATION_POSTS, TEASER_POSTS } from '@/lib/authority/amplification-templates';

interface PushToCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardName: string;
  stageSlug: string;
  embargoActive: boolean;
  embargoDate: string | null;
}

export function PushToCampaignModal({
  isOpen,
  onClose,
  cardId,
  cardName,
  stageSlug,
  embargoActive,
  embargoDate,
}: PushToCampaignModalProps) {
  const [campaignType, setCampaignType] = useState<'teaser' | 'amplification'>('amplification');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created_count: number; campaign_name: string } | null>(null);

  if (!isOpen) return null;

  const isEmbargoed = embargoActive && embargoDate && new Date(embargoDate) > new Date();
  const canTeaser = ['agreed', 'content_prep', 'submitted', 'published', 'amplified'].includes(stageSlug);
  const canAmplify = ['published', 'amplified'].includes(stageSlug);

  const templates = campaignType === 'teaser' ? TEASER_POSTS : AMPLIFICATION_POSTS;

  const handlePush = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/authority/pipeline/${cardId}/push-to-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignType }),
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-cream-warm rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-serif font-semibold text-charcoal flex items-center gap-2">
            <RocketLaunchIcon className="w-5 h-5 text-teal" />
            Push to Campaign
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-cream rounded-lg">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            <div className="text-center space-y-3">
              <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-charcoal">
                Created <span className="text-green-600 font-semibold">{result.created_count}</span> content items
              </p>
              <p className="text-xs text-stone">{result.campaign_name}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-charcoal">
                Generate social media posts to amplify: <span className="font-semibold">{cardName}</span>
              </p>

              {isEmbargoed && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-400">
                  Embargo is active until {new Date(embargoDate!).toLocaleDateString()}. Amplification posts cannot be published until the embargo lifts.
                </div>
              )}

              {/* Campaign Type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCampaignType('teaser')}
                  disabled={!canTeaser}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    campaignType === 'teaser'
                      ? 'border-teal bg-teal/5'
                      : 'border-stone/15 hover:border-stone/30'
                  } disabled:opacity-40`}
                >
                  <SparklesIcon className="w-4 h-4 text-gold mb-1" />
                  <p className="text-xs font-semibold text-charcoal">Pre-launch Teasers</p>
                  <p className="text-[10px] text-stone mt-0.5">{TEASER_POSTS.length} posts</p>
                </button>
                <button
                  onClick={() => setCampaignType('amplification')}
                  disabled={!canAmplify}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    campaignType === 'amplification'
                      ? 'border-teal bg-teal/5'
                      : 'border-stone/15 hover:border-stone/30'
                  } disabled:opacity-40`}
                >
                  <RocketLaunchIcon className="w-4 h-4 text-teal mb-1" />
                  <p className="text-xs font-semibold text-charcoal">Full Amplification</p>
                  <p className="text-[10px] text-stone mt-0.5">{AMPLIFICATION_POSTS.length} posts</p>
                </button>
              </div>

              {/* Post Preview */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {templates.map((tpl) => (
                  <div key={tpl.sequence} className="flex items-start gap-2 p-2 bg-cream-warm/40 rounded-lg">
                    <span className="text-[10px] font-semibold text-teal bg-teal/10 px-1.5 py-0.5 rounded-full">
                      {tpl.sequence}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-charcoal">{tpl.label}</p>
                      <p className="text-[10px] text-stone mt-0.5">{tpl.description}</p>
                      <p className="text-[9px] text-stone/50 mt-0.5">
                        Day {tpl.dayOffset >= 0 ? `+${tpl.dayOffset}` : tpl.dayOffset} · {tpl.suggestedPlatforms.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePush}
                disabled={loading || (campaignType === 'amplification' && !canAmplify) || (campaignType === 'teaser' && !canTeaser)}
                className="w-full py-2.5 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Campaign...' : `Create ${templates.length} Posts`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
