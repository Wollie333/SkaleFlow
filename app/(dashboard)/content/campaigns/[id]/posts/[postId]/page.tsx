'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';
import { PLATFORM_DEFAULTS, type SocialChannel } from '@/config/platform-defaults';
import {
  ChevronLeftIcon,
  SparklesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  EyeIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';

// ---- Types ----

interface PostData {
  id: string;
  campaign_id: string;
  adset_id: string;
  content_type: number;
  content_type_name: string;
  objective: string;
  platform: string;
  format: string;
  topic: string | null;
  hook: string | null;
  hook_variations: string[] | null;
  body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[] | null;
  visual_brief: string | null;
  shot_suggestions: string | null;
  slide_content: Array<{ slide: number; headline: string; body: string }> | null;
  on_screen_text: Array<{ timestamp: string; text: string }> | null;
  brand_voice_score: number | null;
  ai_generated: boolean;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
}

// ---- Status config ----

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  idea: { color: 'bg-purple-400/15 text-purple-400 border-purple-400/25', label: 'Idea' },
  scripted: { color: 'bg-sky-400/15 text-sky-400 border-sky-400/25', label: 'Scripted' },
  pending_review: { color: 'bg-amber-400/15 text-amber-400 border-amber-400/25', label: 'Pending Review' },
  revision_requested: { color: 'bg-orange-400/15 text-orange-400 border-orange-400/25', label: 'Revision' },
  approved: { color: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/25', label: 'Approved' },
  rejected: { color: 'bg-red-400/15 text-red-400 border-red-400/25', label: 'Rejected' },
  scheduled: { color: 'bg-blue-400/15 text-blue-400 border-blue-400/25', label: 'Scheduled' },
  published: { color: 'bg-teal/15 text-teal border-teal/25', label: 'Published' },
};

const CONTENT_TYPE_COLORS: Record<number, string> = {
  1: '#EF4444', 2: '#F97316', 3: '#F59E0B', 4: '#22C55E', 5: '#14B8A6', 6: '#3B82F6', 7: '#8B5CF6',
};

const CHANNEL_COLORS: Record<string, string> = {
  linkedin: 'bg-[#0A66C2]/20 text-[#5B9BD5]',
  facebook: 'bg-[#1877F2]/20 text-[#6BA3E8]',
  instagram: 'bg-[#E4405F]/20 text-[#E87A90]',
  tiktok: 'bg-charcoal/10 text-charcoal',
  youtube: 'bg-[#FF0000]/20 text-[#FF6666]',
  x: 'bg-charcoal/10 text-charcoal',
};

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram',
  tiktok: 'TikTok', youtube: 'YouTube', x: 'X',
};

// ---- Page ----

export default function PostEditorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const postId = params.postId as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [edited, setEdited] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'visual' | 'slides' | 'shots'>('content');
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/content/campaigns/${campaignId}/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        setEdited(data.post);
      }
    } catch (err) {
      console.error('Failed to fetch post:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId, postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  function updateField(field: keyof PostData, value: unknown) {
    if (!edited) return;
    setEdited(prev => prev ? { ...prev, [field]: value } : prev);
    setHasChanges(true);
  }

  async function handleSave(statusOverride?: string) {
    if (!edited) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        topic: edited.topic,
        hook: edited.hook,
        hook_variations: edited.hook_variations,
        body: edited.body,
        cta: edited.cta,
        caption: edited.caption,
        hashtags: edited.hashtags,
        visual_brief: edited.visual_brief,
        shot_suggestions: edited.shot_suggestions,
        slide_content: edited.slide_content,
        on_screen_text: edited.on_screen_text,
        scheduled_date: edited.scheduled_date,
        scheduled_time: edited.scheduled_time,
      };
      if (statusOverride) updates.status = statusOverride;
      await fetch(`/api/content/campaigns/${campaignId}/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await fetchPost();
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post || !edited) {
    return (
      <div className="text-center py-12">
        <p className="text-stone text-sm mb-4">Post not found.</p>
        <Button onClick={() => router.push('/content/machine')}>Back to Content Engine</Button>
      </div>
    );
  }

  const contentType = CONTENT_TYPES[post.content_type as ContentTypeId];
  const platformConfig = PLATFORM_DEFAULTS[post.platform as SocialChannel];
  const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.idea;
  const hooks = edited.hook_variations || [];
  const isVideo = ['reel', 'video', 'long_video', 'story'].includes(post.format);
  const isCarousel = post.format === 'carousel';

  // Build tabs
  const tabs: { id: typeof activeTab; label: string; show: boolean }[] = [
    { id: 'content', label: 'Content', show: true },
    { id: 'visual', label: 'Visual Brief', show: true },
    { id: 'slides', label: 'Slides', show: isCarousel },
    { id: 'shots', label: 'Shots & Screen Text', show: isVideo },
  ];

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push('/content/machine')}
          className="flex items-center gap-1 text-xs text-stone hover:text-teal transition-colors"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          Back to Content Engine
        </button>

        <div className="flex items-center gap-2">
          <span className={cn('inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border', statusStyle.color)}>
            {statusStyle.label}
          </span>
          {post.ai_generated && (
            <span className="inline-flex items-center gap-1 text-[10px] text-purple-400">
              <SparklesIcon className="w-3 h-3" /> AI Generated
            </span>
          )}
          {post.brand_voice_score && (
            <span className={cn('text-xs font-medium', post.brand_voice_score >= 80 ? 'text-emerald-400' : 'text-amber-400')}>
              Voice: {post.brand_voice_score}%
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: CONTENT_TYPE_COLORS[post.content_type] || '#888' }}
        >
          T{post.content_type}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-charcoal truncate">
            {edited.topic || 'Untitled Post'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-full', CHANNEL_COLORS[post.platform] || 'bg-stone/10 text-charcoal')}>
              {CHANNEL_LABELS[post.platform] || post.platform}
            </span>
            <span className="text-xs text-stone capitalize">{post.format.replace(/_/g, ' ')}</span>
            <span className="text-xs text-stone">·</span>
            <span className="text-xs text-stone">{contentType?.name || `Type ${post.content_type}`}</span>
          </div>
        </div>
      </div>

      {/* Split layout: Editor (left) + Preview (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Editor ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Editor tabs */}
          <div className="flex gap-1 border-b border-stone/10">
            {tabs.filter(t => t.show).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.id ? 'border-teal text-teal' : 'border-transparent text-stone hover:text-charcoal'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Hook variations */}
              {hooks.length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-stone uppercase tracking-wider block mb-2">
                    Hook Variations — Select one
                  </label>
                  <div className="space-y-2">
                    {hooks.map((hook, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedHookIndex(i);
                          updateField('hook', hook);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2.5 text-sm rounded-lg border transition-colors',
                          (selectedHookIndex === i || edited.hook === hook)
                            ? 'border-teal/40 bg-teal/5 text-charcoal'
                            : 'border-stone/10 bg-stone/5 text-stone hover:border-stone/20'
                        )}
                      >
                        <span className="text-[10px] font-bold text-teal mr-2">#{i + 1}</span>
                        {hook}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic */}
              <FieldInput
                label="Topic"
                value={edited.topic || ''}
                onChange={v => updateField('topic', v)}
                placeholder="Post topic..."
              />

              {/* Body */}
              <FieldTextarea
                label="Body / Script"
                value={edited.body || ''}
                onChange={v => updateField('body', v)}
                rows={8}
                placeholder="Post body content or video script..."
              />

              {/* CTA */}
              <FieldInput
                label="Call to Action"
                value={edited.cta || ''}
                onChange={v => updateField('cta', v)}
                placeholder="What should the viewer do?"
              />

              {/* Caption */}
              <FieldTextarea
                label="Caption"
                value={edited.caption || ''}
                onChange={v => updateField('caption', v)}
                rows={3}
                placeholder="Platform caption..."
                charLimit={platformConfig?.charLimits?.caption}
              />

              {/* Hashtags */}
              <FieldInput
                label="Hashtags"
                value={(edited.hashtags || []).join(' ')}
                onChange={v => updateField('hashtags', v.split(/\s+/).filter(Boolean))}
                placeholder="#hashtag1 #hashtag2..."
              />
            </div>
          )}

          {/* Visual Brief tab */}
          {activeTab === 'visual' && (
            <FieldTextarea
              label="Visual Brief"
              value={edited.visual_brief || ''}
              onChange={v => updateField('visual_brief', v)}
              rows={12}
              placeholder="Visual direction, mood, style, text overlays..."
            />
          )}

          {/* Slides tab */}
          {activeTab === 'slides' && (
            <div className="space-y-3">
              <label className="text-[11px] font-medium text-stone uppercase tracking-wider block">
                Slide Content
              </label>
              {(edited.slide_content || []).length === 0 ? (
                <p className="text-xs text-stone/50 italic py-8 text-center">No slide content generated yet.</p>
              ) : (
                edited.slide_content!.map((slide, idx) => (
                  <div key={idx} className="p-3 bg-stone/5 border border-stone/10 rounded-lg">
                    <div className="text-[11px] text-teal font-bold mb-2">Slide {slide.slide}</div>
                    <FieldInput
                      label="Headline"
                      value={slide.headline}
                      onChange={v => {
                        const updated = [...(edited.slide_content || [])];
                        updated[idx] = { ...slide, headline: v };
                        updateField('slide_content', updated);
                      }}
                      placeholder="Slide headline..."
                    />
                    <div className="mt-2">
                      <FieldTextarea
                        label="Body"
                        value={slide.body}
                        onChange={v => {
                          const updated = [...(edited.slide_content || [])];
                          updated[idx] = { ...slide, body: v };
                          updateField('slide_content', updated);
                        }}
                        rows={2}
                        placeholder="Slide body text..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Shots & Screen Text tab */}
          {activeTab === 'shots' && (
            <div className="space-y-6">
              <FieldTextarea
                label="Shot Suggestions / Filming Directions"
                value={edited.shot_suggestions || ''}
                onChange={v => updateField('shot_suggestions', v)}
                rows={6}
                placeholder="Camera angles, movements, transitions..."
              />
              <div>
                <label className="text-[11px] font-medium text-stone uppercase tracking-wider block mb-2">
                  On-Screen Text Overlays
                </label>
                {(edited.on_screen_text || []).length === 0 ? (
                  <p className="text-xs text-stone/50 italic py-4 text-center">No on-screen text generated.</p>
                ) : (
                  <div className="space-y-2">
                    {edited.on_screen_text!.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.timestamp}
                          onChange={e => {
                            const updated = [...(edited.on_screen_text || [])];
                            updated[idx] = { ...item, timestamp: e.target.value };
                            updateField('on_screen_text', updated);
                          }}
                          className="w-16 px-2 py-1.5 text-xs bg-stone/5 border border-stone/10 rounded-lg text-teal font-mono text-center"
                        />
                        <input
                          type="text"
                          value={item.text}
                          onChange={e => {
                            const updated = [...(edited.on_screen_text || [])];
                            updated[idx] = { ...item, text: e.target.value };
                            updateField('on_screen_text', updated);
                          }}
                          className="flex-1 px-3 py-1.5 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Preview + Schedule ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live preview */}
          <div className="bg-cream-warm border border-stone/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone/10 flex items-center gap-2">
              <EyeIcon className="w-4 h-4 text-stone" />
              <span className="text-xs font-medium text-stone uppercase tracking-wider">Preview</span>
              <span className={cn('ml-auto px-2 py-0.5 text-[10px] font-medium rounded-full', CHANNEL_COLORS[post.platform] || 'bg-stone/10 text-charcoal')}>
                {CHANNEL_LABELS[post.platform] || post.platform}
              </span>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {/* Preview content */}
              {edited.hook && (
                <p className="text-sm font-semibold text-charcoal mb-3 leading-relaxed">
                  {edited.hook}
                </p>
              )}
              {edited.body && (
                <div className="text-sm text-charcoal/90 mb-3 whitespace-pre-wrap leading-relaxed">
                  {edited.body}
                </div>
              )}
              {edited.cta && (
                <p className="text-sm font-medium text-teal mb-3">{edited.cta}</p>
              )}
              {edited.caption && edited.caption !== edited.body && (
                <div className="border-t border-stone/10 pt-3 mt-3">
                  <p className="text-xs text-stone mb-1 font-medium">Caption:</p>
                  <p className="text-sm text-charcoal/80 whitespace-pre-wrap">{edited.caption}</p>
                </div>
              )}
              {edited.hashtags && edited.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {edited.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-teal">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
              {!edited.hook && !edited.body && !edited.caption && (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-8 h-8 text-stone/20 mx-auto mb-2" />
                  <p className="text-xs text-stone/40">No content yet — edit on the left or generate with AI</p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-cream-warm border border-stone/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDaysIcon className="w-4 h-4 text-stone" />
              <span className="text-xs font-medium text-stone uppercase tracking-wider">Schedule</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-stone/60 uppercase block mb-1">Date</label>
                <input
                  type="date"
                  value={edited.scheduled_date || ''}
                  onChange={e => updateField('scheduled_date', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg bg-cream/50 text-charcoal focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/20"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone/60 uppercase block mb-1">Time</label>
                <input
                  type="time"
                  value={edited.scheduled_time || ''}
                  onChange={e => updateField('scheduled_time', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg bg-cream/50 text-charcoal focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/20"
                />
              </div>
            </div>
          </div>

          {/* Content type info */}
          {contentType && (
            <div className="bg-cream-warm border border-stone/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: CONTENT_TYPE_COLORS[post.content_type] || '#888' }}
                >
                  {post.content_type}
                </div>
                <span className="text-xs font-medium text-charcoal">{contentType.name}</span>
              </div>
              <p className="text-xs text-stone leading-relaxed">{contentType.description}</p>
              <p className="text-[10px] text-stone/60 mt-1">{contentType.primaryOutcome}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="bg-cream-warm border border-stone/10 rounded-xl p-4 space-y-2">
            {/* Save as Draft */}
            <Button
              onClick={() => handleSave('scripted')}
              disabled={saving}
              variant="ghost"
              className="w-full justify-center gap-2 !border-stone/20 !text-charcoal"
            >
              <DocumentTextIcon className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>

            {/* Schedule */}
            <Button
              onClick={() => {
                if (!edited.scheduled_date) {
                  alert('Please set a date before scheduling.');
                  return;
                }
                handleSave('scheduled');
              }}
              disabled={saving}
              variant="ghost"
              className="w-full justify-center gap-2 !border-teal/30 !text-teal"
            >
              <ClockIcon className="w-4 h-4" />
              Schedule
            </Button>

            {/* Submit for Review */}
            <Button
              onClick={() => handleSave('pending_review')}
              disabled={saving}
              variant="ghost"
              className="w-full justify-center gap-2 !border-amber-400/30 !text-amber-400"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Submit for Review
            </Button>

            {/* Publish */}
            <Button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="w-full justify-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Shared field components ----

function FieldInput({ label, value, onChange, placeholder, charLimit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; charLimit?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-medium text-stone uppercase tracking-wider">{label}</label>
        {charLimit && <span className={cn('text-[10px]', value.length > charLimit ? 'text-red-400' : 'text-stone/40')}>{value.length}/{charLimit}</span>}
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal placeholder:text-stone/30 focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/20"
        placeholder={placeholder}
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, rows, placeholder, charLimit }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; charLimit?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-medium text-stone uppercase tracking-wider">{label}</label>
        {charLimit && <span className={cn('text-[10px]', value.length > charLimit ? 'text-red-400' : 'text-stone/40')}>{value.length}/{charLimit}</span>}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows || 4}
        className="w-full px-3 py-2 text-sm bg-stone/5 border border-stone/10 rounded-lg text-charcoal placeholder:text-stone/30 resize-y focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/20"
        placeholder={placeholder}
      />
    </div>
  );
}
