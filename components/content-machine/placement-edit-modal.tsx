'use client';

import { useState } from 'react';
import { XMarkIcon, CalendarDaysIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { SocialPreview } from '@/components/content/social-preview';
import { MediaUpload, type UploadedFile } from '@/components/content/media-upload';
import { getPlacementLabel } from '@/config/placement-types';
import { Button } from '@/components/ui';
import type { SocialPlatform, PlacementType } from '@/types/database';
import type { GeneratedItem, EditFields, ModalAction } from './types';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

interface PlacementEditModalProps {
  open: boolean;
  onClose: () => void;
  placement: PlacementType;
  platform: SocialPlatform;
  item: GeneratedItem;
  editFields: EditFields;
  mediaFiles: UploadedFile[];
  onEditField: (field: keyof EditFields, value: string) => void;
  onMediaChange: (files: UploadedFile[]) => void;
  onAction: (action: ModalAction, data?: { date?: string; time?: string; reason?: string }) => void;
  organizationId: string;
  userName?: string;
  isSaving?: boolean;
}

export function PlacementEditModal({
  open,
  onClose,
  placement,
  platform,
  item,
  editFields,
  mediaFiles,
  onEditField,
  onMediaChange,
  onAction,
  organizationId,
  userName,
  isSaving,
}: PlacementEditModalProps) {
  const [scheduleDate, setScheduleDate] = useState(item.scheduled_date || '');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  if (!open) return null;

  const platformLabel = PLATFORM_LABELS[platform];
  const placementLabel = getPlacementLabel(placement);
  const caption = editFields.caption ?? item.caption ?? '';
  const hashtags = editFields.hashtags ?? (item.hashtags ? item.hashtags.join(', ') : '');
  const topic = editFields.topic ?? item.topic ?? '';
  const hashtagArr = hashtags.split(',').map(h => h.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-charcoal">
              {platformLabel} &middot; {placementLabel}
            </h2>
            <p className="text-xs text-stone mt-0.5">Edit content and choose an action</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone/10 text-stone">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-stone/10">
            {/* Left: Edit Fields */}
            <div className="p-5 space-y-4">
              {/* Caption */}
              <div>
                <label className="text-sm font-medium text-charcoal-700 mb-1 block">Caption / Description</label>
                <textarea
                  value={caption}
                  onChange={e => onEditField('caption', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal resize-none"
                  placeholder="Write your post caption..."
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-sm font-medium text-charcoal-700 mb-1 block">Hashtags</label>
                <input
                  value={hashtags}
                  onChange={e => onEditField('hashtags', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  placeholder="hashtag1, hashtag2, hashtag3"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="text-sm font-medium text-charcoal-700 mb-1 block">Topic</label>
                <input
                  value={topic}
                  onChange={e => onEditField('topic', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  placeholder="Brief topic summary"
                />
              </div>

              {/* Media */}
              <div>
                <label className="text-sm font-medium text-charcoal-700 mb-2 block">Media</label>
                <MediaUpload
                  organizationId={organizationId}
                  contentItemId={item.id}
                  uploadedFiles={mediaFiles}
                  onFilesChange={onMediaChange}
                />
              </div>
            </div>

            {/* Right: Preview */}
            <div className="p-5 bg-stone-50">
              <p className="text-xs font-medium text-stone mb-3 uppercase tracking-wide">Preview</p>
              <SocialPreview
                platform={platform}
                caption={caption}
                hashtags={hashtagArr}
                mediaUrls={mediaFiles.length > 0 ? mediaFiles.map(f => f.url) : (item.media_urls || [])}
                userName={userName}
                placementType={placement}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-stone/10 p-4 bg-cream-warm/50 shrink-0">
          {showDecline ? (
            <div className="flex items-center gap-3">
              <input
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                placeholder="Reason for declining (optional)"
                autoFocus
              />
              <Button
                onClick={() => {
                  onAction('decline', { reason: declineReason });
                  setShowDecline(false);
                  setDeclineReason('');
                }}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Confirm Decline
              </Button>
              <button
                onClick={() => { setShowDecline(false); setDeclineReason(''); }}
                className="text-xs text-stone hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setShowDecline(true)}
                className="text-xs text-red-500 hover:underline"
              >
                Decline
              </button>

              <div className="flex items-center gap-2">
                {/* Save Draft */}
                <Button
                  onClick={() => onAction('draft')}
                  disabled={isSaving}
                  variant="ghost"
                  size="sm"
                >
                  Save Draft
                </Button>

                {/* Schedule */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-stone/20 text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-stone/20 text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal w-24"
                  />
                  <Button
                    onClick={() => onAction('schedule', { date: scheduleDate, time: scheduleTime })}
                    disabled={isSaving || !scheduleDate}
                    variant="ghost"
                    size="sm"
                  >
                    <CalendarDaysIcon className="w-3.5 h-3.5 mr-1" />
                    Schedule
                  </Button>
                </div>

                {/* Publish */}
                <Button
                  onClick={() => onAction('publish')}
                  disabled={isSaving}
                  size="sm"
                >
                  <PaperAirplaneIcon className="w-3.5 h-3.5 mr-1" />
                  Publish Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
