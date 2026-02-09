'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, StatusBadge, ActionModal } from '@/components/ui';
import { SocialPreviewTabs, MediaUpload, PlatformOverrideTabs, CommentThread, TagSelector, UTMBuilderModal, PostActionPopup, type UploadedFile, type PublishResult } from '@/components/content';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  LinkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SocialPlatform, ContentStatus, FunnelStage, StoryBrandStage } from '@/types/database';
import type { UTMParams } from '@/lib/utm/generate-utm';

const PLATFORM_OPTIONS: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];

const FUNNEL_OPTIONS: { value: FunnelStage; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'consideration', label: 'Consideration' },
  { value: 'conversion', label: 'Conversion' },
];

const STORYBRAND_OPTIONS: { value: StoryBrandStage; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'external_problem', label: 'External Problem' },
  { value: 'internal_problem', label: 'Internal Problem' },
  { value: 'philosophical_problem', label: 'Philosophical Problem' },
  { value: 'guide', label: 'Guide' },
  { value: 'plan', label: 'Plan' },
  { value: 'call_to_action', label: 'Call to Action' },
  { value: 'failure', label: 'Failure' },
  { value: 'success', label: 'Success' },
];

interface ContentItem {
  id: string;
  organization_id: string;
  calendar_id: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  time_slot: string;
  funnel_stage: FunnelStage;
  storybrand_stage: StoryBrandStage;
  format: string;
  topic: string | null;
  hook: string | null;
  script_body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[] | null;
  platforms: string[];
  platform_specs: Record<string, { caption?: string; hashtags?: string[]; customized?: boolean }> | null;
  status: ContentStatus;
  assigned_to: string | null;
  media_urls: string[] | null;
  rejection_reason: string | null;
  review_comment: string | null;
  target_url: string | null;
  utm_parameters: Record<string, string> | null;
  filming_notes: string | null;
  context_section: string | null;
  teaching_points: string | null;
  reframe: string | null;
  problem_expansion: string | null;
  framework_teaching: string | null;
  case_study: string | null;
  placement_type: string | null;
  variation_group_id: string | null;
  is_primary_variation: boolean;
  [key: string]: unknown;
}

interface VariationSibling {
  id: string;
  placement_type: string | null;
  platforms: string[];
  status: ContentStatus;
  is_primary_variation: boolean;
}

export default function PostEditPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;
  const supabase = createClient();

  const [item, setItem] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('member');
  const [userName, setUserName] = useState<string>('');

  // Form state
  const [topic, setTopic] = useState('');
  const [hook, setHook] = useState('');
  const [scriptBody, setScriptBody] = useState('');
  const [cta, setCta] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(['linkedin']);
  const [targetUrl, setTargetUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('awareness');
  const [storybrandStage, setStorybrandStage] = useState<StoryBrandStage>('character');
  const [filmingNotes, setFilmingNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    variant: 'success' | 'error' | 'info';
    title: string;
    subtitle?: string;
  }>({ variant: 'success', title: '' });

  // Post action popup + UTM state
  const [showPostActionPopup, setShowPostActionPopup] = useState(false);
  const [utmParams, setUtmParams] = useState<UTMParams | null>(null);
  const [showUtmModal, setShowUtmModal] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [showTargetUrlSection, setShowTargetUrlSection] = useState(false);
  const [showMediaSection, setShowMediaSection] = useState(false);

  // Variation group state
  const [variationSiblings, setVariationSiblings] = useState<VariationSibling[]>([]);

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await fetch(`/api/content/items/${itemId}`);
        if (!res.ok) {
          router.push('/calendar');
          return;
        }
        const data = await res.json();
        const loadedItem = data.item as ContentItem;
        setItem(loadedItem);
        setUserRole(data.role || 'member');

        // Populate form fields
        setTopic(loadedItem.topic || '');
        setHook(loadedItem.hook || '');
        setScriptBody(loadedItem.script_body || '');
        setCta(loadedItem.cta || '');
        setCaption(loadedItem.caption || '');
        setHashtags(loadedItem.hashtags || []);
        setPlatforms((loadedItem.platforms || ['linkedin']) as SocialPlatform[]);
        setTargetUrl(loadedItem.target_url || '');
        setScheduledDate(loadedItem.scheduled_date || '');
        setScheduledTime(loadedItem.scheduled_time || '08:00');
        setFunnelStage(loadedItem.funnel_stage || 'awareness');
        setStorybrandStage(loadedItem.storybrand_stage || 'character');
        setFilmingNotes(loadedItem.filming_notes || '');
        if (loadedItem.utm_parameters) {
          setUtmParams(loadedItem.utm_parameters as unknown as UTMParams);
        }
        const loadedMedia = (loadedItem.media_urls || []).map((url: string) => ({
          url,
          fileName: url.split('/').pop() || 'file',
          fileType: 'image/jpeg',
          fileSize: 0,
        }));
        setUploadedFiles(loadedMedia);
        // Auto-expand sections that have data
        if (loadedItem.target_url || loadedItem.utm_parameters) setShowTargetUrlSection(true);
        if (loadedMedia.length > 0) setShowMediaSection(true);
        if (loadedItem.filming_notes) setShowAdvancedFields(true);

        // Load variation siblings if item has a variation group
        if (loadedItem.variation_group_id) {
          const { data: siblings } = await supabase
            .from('content_items')
            .select('id, placement_type, platforms, status, is_primary_variation')
            .eq('variation_group_id', loadedItem.variation_group_id)
            .neq('id', loadedItem.id)
            .order('is_primary_variation', { ascending: false });
          if (siblings) {
            setVariationSiblings(siblings as VariationSibling[]);
          }
        }

        // Get user name for preview
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single();
          if (userData?.full_name) setUserName(userData.full_name);
        }
      } catch (err) {
        console.error('Failed to load item:', err);
        router.push('/calendar');
      } finally {
        setIsLoading(false);
      }
    }
    loadItem();
  }, [itemId, router, supabase]);

  const handleSave = useCallback(async (newStatus?: ContentStatus) => {
    if (!item) return;
    setIsSaving(true);

    try {
      const body: Record<string, unknown> = {
        topic: topic || null,
        hook: hook || null,
        script_body: scriptBody || null,
        cta: cta || null,
        caption: caption || null,
        hashtags: hashtags.length > 0 ? hashtags : null,
        platforms,
        target_url: targetUrl || null,
        utm_parameters: utmParams || null,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        funnel_stage: funnelStage,
        storybrand_stage: storybrandStage,
        filming_notes: filmingNotes || null,
        media_urls: uploadedFiles.map(f => f.url),
      };

      if (newStatus) {
        body.status = newStatus;
      }

      const res = await fetch(`/api/content/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setItem(data.item);

        const statusLabel = newStatus === 'scheduled' ? 'Post Scheduled!' :
          newStatus === 'pending_review' ? 'Submitted for Review' :
          'Post Saved';

        setModalConfig({
          variant: 'success',
          title: statusLabel,
          subtitle: newStatus === 'scheduled'
            ? `Scheduled for ${format(new Date(scheduledDate), 'MMM d, yyyy')} at ${scheduledTime}`
            : undefined,
        });
        setShowModal(true);
      } else {
        setModalConfig({ variant: 'error', title: 'Save Failed', subtitle: 'Please try again' });
        setShowModal(true);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setModalConfig({ variant: 'error', title: 'Save Failed', subtitle: 'An unexpected error occurred' });
      setShowModal(true);
    } finally {
      setIsSaving(false);
    }
  }, [item, topic, hook, scriptBody, cta, caption, hashtags, platforms, targetUrl, utmParams, scheduledDate, scheduledTime, funnelStage, storybrandStage, filmingNotes, uploadedFiles]);

  const handleReview = useCallback(async (action: 'approve' | 'reject' | 'request_revision', comment?: string) => {
    if (!item) return;
    const res = await fetch(`/api/content/items/${item.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment }),
    });
    if (res.ok) {
      // Reload item
      const itemRes = await fetch(`/api/content/items/${item.id}`);
      if (itemRes.ok) {
        const data = await itemRes.json();
        setItem(data.item);
      }
      const label = action === 'approve' ? 'Post Approved' :
        action === 'reject' ? 'Post Rejected' : 'Revision Requested';
      setModalConfig({ variant: action === 'approve' ? 'success' : 'info', title: label });
      setShowModal(true);
    }
  }, [item]);

  const togglePlatform = (p: SocialPlatform) => {
    setPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().startsWith('#') ? hashtagInput.trim() : '#' + hashtagInput.trim();
    if (tag.length > 1 && !hashtags.includes(tag)) {
      setHashtags(prev => [...prev, tag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  // Post action popup handlers
  const handlePopupSaveDraft = async (): Promise<string | null> => {
    await handleSave();
    return item?.id || null;
  };

  const handlePopupSchedule = async (date: string, time: string): Promise<string | null> => {
    if (!item) return null;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        topic: topic || null,
        hook: hook || null,
        script_body: scriptBody || null,
        cta: cta || null,
        caption: caption || null,
        hashtags: hashtags.length > 0 ? hashtags : null,
        platforms,
        target_url: targetUrl || null,
        utm_parameters: utmParams || null,
        scheduled_date: date,
        scheduled_time: time,
        funnel_stage: funnelStage,
        storybrand_stage: storybrandStage,
        filming_notes: filmingNotes || null,
        media_urls: uploadedFiles.map(f => f.url),
        status: 'scheduled',
      };

      const res = await fetch(`/api/content/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
        setScheduledDate(date);
        setScheduledTime(time);
        setModalConfig({
          variant: 'success',
          title: 'Post Scheduled!',
          subtitle: `Scheduled for ${format(new Date(date + 'T00:00:00'), 'MMM d, yyyy')} at ${time}`,
        });
        setShowModal(true);
        return item.id;
      }
      throw new Error('Save failed');
    } catch {
      setModalConfig({ variant: 'error', title: 'Schedule Failed', subtitle: 'Please try again' });
      setShowModal(true);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePopupPublishNow = async (publishPlatforms: string[]): Promise<PublishResult[]> => {
    // Save first
    await handleSave();
    if (!item) return [{ platform: 'all', success: false, error: 'No item to publish' }];

    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItemId: item.id, platforms: publishPlatforms }),
      });
      const data = await res.json();
      if (!res.ok) return [{ platform: 'all', success: false, error: data.error || 'Publish failed' }];
      return data.results || [];
    } catch {
      return [{ platform: 'all', success: false, error: 'Publish failed. Please try again.' }];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-heading-lg text-charcoal mb-2">Post Not Found</h2>
        <Button onClick={() => router.push('/calendar')}>Back to Calendar</Button>
      </div>
    );
  }

  const canApprove = userRole === 'owner' || userRole === 'admin';
  const previewCaption = caption || scriptBody || hook || topic || '';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/calendar')}
            className="p-2 rounded-lg hover:bg-cream-warm text-stone transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-charcoal">
              {topic || 'Untitled Post'}
            </h1>
            <p className="text-sm text-stone">
              {scheduledDate ? format(new Date(scheduledDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy') : 'No date'} &middot; {item.format}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Revision feedback banner */}
      {item.status === 'revision_requested' && item.review_comment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">Revision Requested</p>
          <p className="text-sm text-amber-700 mt-1">{item.review_comment}</p>
        </div>
      )}

      {item.status === 'rejected' && item.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-800">Rejected</p>
          <p className="text-sm text-red-700 mt-1">{item.rejection_reason}</p>
        </div>
      )}

      {/* Variation group tabs */}
      {variationSiblings.length > 0 && (
        <div className="bg-white border border-stone/15 rounded-xl p-3">
          <p className="text-xs font-medium text-stone mb-2">Variation Group</p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal/10 text-teal border border-teal/20">
              {item.placement_type ? item.placement_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : item.platforms.join(', ')}
              {' '}(current)
            </span>
            {variationSiblings.map(s => (
              <button
                key={s.id}
                onClick={() => router.push(`/content/${s.id}`)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone/5 text-stone hover:bg-stone/10 border border-stone/10 transition-colors"
              >
                {s.placement_type ? s.placement_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : s.platforms.join(', ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Edit Form (60%) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Card 1: Content */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-charcoal">Content</h3>

            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">Topic</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                placeholder="What is this post about?"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">Hook</label>
              <input
                value={hook}
                onChange={e => setHook(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                placeholder="Opening line that grabs attention"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">Script / Body</label>
              <textarea
                value={scriptBody}
                onChange={e => setScriptBody(e.target.value)}
                rows={6}
                className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none resize-y"
                placeholder="Full script or post body"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">CTA</label>
              <input
                value={cta}
                onChange={e => setCta(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                placeholder="Call to action"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">Caption (Published Text)</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none resize-y"
                placeholder="The caption that gets published"
              />
            </div>

            {/* Advanced fields toggle */}
            <button
              onClick={() => setShowAdvancedFields(prev => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium text-teal hover:underline"
            >
              <ChevronDownIcon className={cn("w-3.5 h-3.5 transition-transform", showAdvancedFields && "rotate-180")} />
              {showAdvancedFields ? 'Hide advanced fields' : 'Show filming notes & more'}
            </button>
            {showAdvancedFields && (
              <div className="pt-3 border-t border-stone/10">
                <label className="block text-xs font-medium text-stone mb-1.5">Filming Notes</label>
                <textarea
                  value={filmingNotes}
                  onChange={e => setFilmingNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none resize-y"
                  placeholder="Notes for filming / content creation"
                />
              </div>
            )}
          </Card>

          {/* Card 2: Details (Hashtags + Platforms + Strategy) */}
          <Card className="p-5 space-y-0">
            <h3 className="text-sm font-semibold text-charcoal mb-4">Details</h3>

            {/* Hashtags section */}
            <div>
              <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-2">Hashtags</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal/10 text-teal text-xs font-medium">
                    {tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={hashtagInput}
                  onChange={e => setHashtagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  className="flex-1 px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                  placeholder="Add hashtag"
                />
                <Button size="sm" onClick={addHashtag}>Add</Button>
              </div>
            </div>

            {/* Platforms section */}
            <div className="border-t border-stone/10 pt-4 mt-4">
              <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-2">Platforms</h4>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      platforms.includes(p)
                        ? 'bg-teal text-white'
                        : 'bg-stone/5 text-stone hover:bg-stone/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy section */}
            <div className="border-t border-stone/10 pt-4 mt-4">
              <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-2">Strategy</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone mb-1.5">Funnel Stage</label>
                  <select
                    value={funnelStage}
                    onChange={e => setFunnelStage(e.target.value as FunnelStage)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                  >
                    {FUNNEL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone mb-1.5">StoryBrand Stage</label>
                  <select
                    value={storybrandStage}
                    onChange={e => setStorybrandStage(e.target.value as StoryBrandStage)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                  >
                    {STORYBRAND_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Publishing (Schedule + Target URL + Media) */}
          <Card className="p-5 space-y-0">
            <h3 className="text-sm font-semibold text-charcoal mb-4">Publishing</h3>

            {/* Schedule section */}
            <div>
              <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-2">Schedule</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone mb-1.5">
                    <CalendarDaysIcon className="w-3.5 h-3.5 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone mb-1.5">
                    <ClockIcon className="w-3.5 h-3.5 inline mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Target URL section — collapsed if empty */}
            <div className="border-t border-stone/10 pt-4 mt-4">
              <button
                onClick={() => setShowTargetUrlSection(prev => !prev)}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-xs font-semibold text-stone uppercase tracking-wider">Target URL &amp; Tracking</h4>
                <div className="flex items-center gap-2">
                  {targetUrl && !showTargetUrlSection && (
                    <span className="text-xs text-teal bg-teal/10 px-2 py-0.5 rounded-full truncate max-w-[200px]">{targetUrl}</span>
                  )}
                  <ChevronDownIcon className={cn("w-4 h-4 text-stone transition-transform", showTargetUrlSection && "rotate-180")} />
                </div>
              </button>
              {showTargetUrlSection && (
                <div className="mt-3 space-y-2">
                  <input
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                    placeholder="https://your-link.com"
                  />
                  <button
                    onClick={() => setShowUtmModal(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    {utmParams ? 'Edit UTM Parameters' : 'Build UTM Parameters'}
                  </button>
                  {utmParams && (utmParams.utm_source || utmParams.utm_campaign) && (
                    <div className="bg-cream-warm rounded-lg p-2.5">
                      <p className="text-xs text-stone">
                        {[
                          utmParams.utm_source && `source: ${utmParams.utm_source}`,
                          utmParams.utm_medium && `medium: ${utmParams.utm_medium}`,
                          utmParams.utm_campaign && `campaign: ${utmParams.utm_campaign}`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Media section — collapsed if empty */}
            <div className="border-t border-stone/10 pt-4 mt-4">
              <button
                onClick={() => setShowMediaSection(prev => !prev)}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-xs font-semibold text-stone uppercase tracking-wider">Media</h4>
                <div className="flex items-center gap-2">
                  {uploadedFiles.length > 0 && !showMediaSection && (
                    <span className="text-xs text-teal bg-teal/10 px-2 py-0.5 rounded-full">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}</span>
                  )}
                  <ChevronDownIcon className={cn("w-4 h-4 text-stone transition-transform", showMediaSection && "rotate-180")} />
                </div>
              </button>
              {showMediaSection && (
                <div className="mt-3">
                  <MediaUpload
                    uploadedFiles={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    organizationId={item.organization_id}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT: Live Preview (40%) */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-charcoal mb-4">Live Preview</h3>
              <SocialPreviewTabs
                platforms={platforms}
                caption={previewCaption}
                hashtags={hashtags}
                mediaUrls={uploadedFiles.map(f => f.url)}
                targetUrl={targetUrl || undefined}
                userName={userName}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-stone/10 -mx-6 px-6 py-4 flex flex-wrap items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={item.status} />
          {/* Review actions (for admins/owners) */}
          {canApprove && (item.status === 'pending_review' || item.status === 'revision_requested') && (
            <>
              <Button
                size="sm"
                onClick={() => handleReview('approve')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleReview('request_revision', 'Please review and update')}
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                Revision
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={() => handleReview('reject', 'Content does not meet standards')}
              >
                <XCircleIcon className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          {item.status === 'revision_requested' && (
            <Button
              size="sm"
              onClick={() => handleSave('pending_review')}
              isLoading={isSaving}
            >
              Resubmit
            </Button>
          )}
        </div>

        <Button
          onClick={() => setShowPostActionPopup(true)}
          isLoading={isSaving}
        >
          <PaperAirplaneIcon className="w-4 h-4 mr-1" />
          Save &amp; Publish
        </Button>
      </div>

      {/* UTM Builder Modal */}
      <UTMBuilderModal
        open={showUtmModal}
        onClose={() => setShowUtmModal(false)}
        baseUrl={targetUrl}
        initialParams={utmParams}
        onApply={setUtmParams}
        autoGenerateContext={{
          platform: platforms[0] || 'linkedin',
          funnelStage,
          format: item.format || 'short_video_30_60',
          topic: topic || null,
          scheduledDate: scheduledDate || format(new Date(), 'yyyy-MM-dd'),
        }}
      />

      {/* Post Action Popup */}
      <PostActionPopup
        open={showPostActionPopup}
        onClose={() => setShowPostActionPopup(false)}
        platforms={platforms}
        onSaveDraft={handlePopupSaveDraft}
        onSchedule={handlePopupSchedule}
        onPublishNow={handlePopupPublishNow}
        isLoading={isSaving}
        defaultScheduleDate={scheduledDate}
        defaultScheduleTime={scheduledTime}
      />

      {/* Action Modal */}
      <ActionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        variant={modalConfig.variant}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        actions={[
          { label: 'View in Calendar', href: '/calendar', variant: 'primary' },
          { label: 'Keep Editing', onClick: () => setShowModal(false), variant: 'ghost' },
        ]}
      />
    </div>
  );
}
