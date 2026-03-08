'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HookSelector } from './hook-selector';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';
import { PLATFORM_DEFAULTS, type SocialChannel } from '@/config/platform-defaults';

// ---- Types ----

interface PostData {
  id: string;
  campaign_id: string;
  adset_id: string;
  content_type: number;
  content_type_name: string;
  platform: string;
  format: string;
  topic: string | null;
  hook: string | null;
  hook_variations: Array<{ id: string; text: string; style: string }>;
  selected_hook_id: string | null;
  body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[];
  visual_brief: string | null;
  shot_suggestions: string[];
  slide_content: Array<{ slide: number; text: string; visual: string }>;
  on_screen_text: string[];
  platform_variations: Record<string, string>;
  brand_voice_score: number | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  creative_direction: string | null;
}

interface PostEditorV3Props {
  post: PostData;
  onSave: (updates: Partial<PostData>) => void;
  onSubmitForReview: () => void;
  onRegenerate: (creativeDirection?: string) => void;
  onRegenerateHooks: () => void;
  isRegenerating?: boolean;
  isSaving?: boolean;
}

type Tab = 'content' | 'visual' | 'shots' | 'slides' | 'screen_text' | 'variations';

// ---- Status styles ----

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  idea: { bg: 'bg-stone/10', text: 'text-stone', label: 'Idea' },
  scripted: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Scripted' },
  pending_review: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Pending Review' },
  revision_requested: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'Revision Requested' },
  approved: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Approved' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Rejected' },
  scheduled: { bg: 'bg-teal/10', text: 'text-teal', label: 'Scheduled' },
  published: { bg: 'bg-teal/20', text: 'text-teal', label: 'Published' },
};

const TYPE_COLORS = ['', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6'];

// ---- Component ----

export function PostEditorV3({
  post,
  onSave,
  onSubmitForReview,
  onRegenerate,
  onRegenerateHooks,
  isRegenerating = false,
  isSaving = false,
}: PostEditorV3Props) {
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [editedPost, setEditedPost] = useState(post);
  const [creativeDirection, setCreativeDirection] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedPost(post);
    setHasChanges(false);
  }, [post.id]);

  function updateField(field: string, value: unknown) {
    setEditedPost(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }

  function handleSave() {
    onSave(editedPost);
    setHasChanges(false);
  }

  const contentType = CONTENT_TYPES[post.content_type as ContentTypeId];
  const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.idea;

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'content', label: 'Content', show: true },
    { id: 'visual', label: 'Visual Brief', show: true },
    { id: 'shots', label: 'Shots', show: ['reel', 'video', 'long_video'].includes(post.format) },
    { id: 'slides', label: 'Slides', show: post.format === 'carousel' },
    { id: 'screen_text', label: 'On-Screen Text', show: ['reel', 'video', 'story'].includes(post.format) },
    { id: 'variations', label: 'Platform Variations', show: Object.keys(post.platform_variations || {}).length > 0 },
  ];

  const visibleTabs = tabs.filter(t => t.show);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: TYPE_COLORS[post.content_type] || '#888' }}
          >
            T{post.content_type}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-heading-sm text-charcoal">
                {contentType?.name || `Type ${post.content_type}`}
              </h2>
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            </div>
            <p className="text-xs text-stone">
              {post.platform} · {post.format} · {post.scheduled_date || 'Unscheduled'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.brand_voice_score && (
            <div className={`text-sm font-medium ${post.brand_voice_score >= 80 ? 'text-green-400' : 'text-amber-400'}`}>
              Voice: {post.brand_voice_score}
            </div>
          )}
          {hasChanges && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          {post.status === 'scripted' && (
            <Button size="sm" variant="ghost" onClick={onSubmitForReview}>
              Submit for Review
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone/10">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {/* Content tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Hook selector */}
            <HookSelector
              hooks={editedPost.hook_variations || []}
              selectedHookId={editedPost.selected_hook_id}
              onSelect={id => {
                const hook = editedPost.hook_variations?.find(h => h.id === id);
                updateField('selected_hook_id', id);
                if (hook) updateField('hook', hook.text);
              }}
              onRegenerate={onRegenerateHooks}
              isRegenerating={isRegenerating}
            />

            {/* Topic */}
            <div>
              <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
                Topic
              </label>
              <input
                type="text"
                value={editedPost.topic || ''}
                onChange={e => updateField('topic', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal"
                placeholder="Post topic..."
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
                Body
              </label>
              <textarea
                value={editedPost.body || ''}
                onChange={e => updateField('body', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal resize-y"
                placeholder="Post body content..."
              />
            </div>

            {/* CTA */}
            <div>
              <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
                Call to Action
              </label>
              <input
                type="text"
                value={editedPost.cta || ''}
                onChange={e => updateField('cta', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal"
                placeholder="CTA..."
              />
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
                Caption
              </label>
              <textarea
                value={editedPost.caption || ''}
                onChange={e => updateField('caption', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal resize-y"
                placeholder="Platform caption..."
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
                Hashtags
              </label>
              <input
                type="text"
                value={(editedPost.hashtags || []).join(' ')}
                onChange={e => updateField('hashtags', e.target.value.split(/\s+/).filter(Boolean))}
                className="w-full px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal"
                placeholder="#hashtag1 #hashtag2..."
              />
            </div>
          </div>
        )}

        {/* Visual Brief tab */}
        {activeTab === 'visual' && (
          <div>
            <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
              Visual Brief
            </label>
            <textarea
              value={editedPost.visual_brief || ''}
              onChange={e => updateField('visual_brief', e.target.value)}
              rows={12}
              className="w-full px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal resize-y"
              placeholder="Visual direction, mood, style references..."
            />
          </div>
        )}

        {/* Shot Suggestions tab */}
        {activeTab === 'shots' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
              Shot Suggestions
            </label>
            {(editedPost.shot_suggestions || []).length === 0 ? (
              <p className="text-xs text-stone/50 italic">No shot suggestions generated.</p>
            ) : (
              editedPost.shot_suggestions.map((shot, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs text-teal font-bold mt-1 w-6">{idx + 1}.</span>
                  <textarea
                    value={shot}
                    onChange={e => {
                      const updated = [...editedPost.shot_suggestions];
                      updated[idx] = e.target.value;
                      updateField('shot_suggestions', updated);
                    }}
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal resize-y"
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Slides tab */}
        {activeTab === 'slides' && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
              Slide Content
            </label>
            {(editedPost.slide_content || []).length === 0 ? (
              <p className="text-xs text-stone/50 italic">No slide content generated.</p>
            ) : (
              editedPost.slide_content.map((slide, idx) => (
                <div key={idx} className="p-3 bg-stone/5 border border-stone/10 rounded-lg">
                  <div className="text-xs text-teal font-bold mb-2">Slide {slide.slide}</div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-stone/60 uppercase">Text</label>
                      <textarea
                        value={slide.text}
                        onChange={e => {
                          const updated = [...editedPost.slide_content];
                          updated[idx] = { ...slide, text: e.target.value };
                          updateField('slide_content', updated);
                        }}
                        rows={2}
                        className="w-full px-2 py-1 text-sm bg-white border border-stone/10 rounded text-charcoal resize-y"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone/60 uppercase">Visual Direction</label>
                      <input
                        type="text"
                        value={slide.visual}
                        onChange={e => {
                          const updated = [...editedPost.slide_content];
                          updated[idx] = { ...slide, visual: e.target.value };
                          updateField('slide_content', updated);
                        }}
                        className="w-full px-2 py-1 text-sm bg-white border border-stone/10 rounded text-charcoal"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* On-Screen Text tab */}
        {activeTab === 'screen_text' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
              On-Screen Text Overlays
            </label>
            {(editedPost.on_screen_text || []).length === 0 ? (
              <p className="text-xs text-stone/50 italic">No on-screen text generated.</p>
            ) : (
              editedPost.on_screen_text.map((text, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-teal font-bold w-6">{idx + 1}.</span>
                  <input
                    type="text"
                    value={text}
                    onChange={e => {
                      const updated = [...editedPost.on_screen_text];
                      updated[idx] = e.target.value;
                      updateField('on_screen_text', updated);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal"
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Platform Variations tab */}
        {activeTab === 'variations' && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-1">
              Platform Variations
            </label>
            {Object.entries(editedPost.platform_variations || {}).map(([platform, content]) => (
              <div key={platform} className="p-3 bg-stone/5 border border-stone/10 rounded-lg">
                <div className="text-xs text-teal font-bold mb-2 capitalize">{platform}</div>
                <textarea
                  value={content}
                  onChange={e => {
                    const updated = { ...editedPost.platform_variations, [platform]: e.target.value };
                    updateField('platform_variations', updated);
                  }}
                  rows={4}
                  className="w-full px-2 py-1 text-sm bg-white border border-stone/10 rounded text-charcoal resize-y"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regenerate section */}
      <div className="border-t border-stone/10 pt-4">
        <label className="text-xs font-medium text-stone uppercase tracking-wider block mb-2">
          Regenerate with Direction
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={creativeDirection}
            onChange={e => setCreativeDirection(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal"
            placeholder="e.g., Make it more conversational, add a personal story..."
          />
          <Button
            onClick={() => onRegenerate(creativeDirection || undefined)}
            disabled={isRegenerating}
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
