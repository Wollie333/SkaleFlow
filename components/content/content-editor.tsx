'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, StatusBadge } from '@/components/ui';
import { VariableTextarea, VariableInput } from '@/components/content/variable-field';
import { useBrandVariables } from '@/hooks/useBrandVariables';
import { XMarkIcon, SparklesIcon, PaperAirplaneIcon, ArrowTopRightOnSquareIcon, CalendarIcon, ArrowPathIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import type { FunnelStage, StoryBrandStage, TimeSlot, ContentStatus, SocialPlatform } from '@/types/database';
import { PlatformSelector } from './platform-selector';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import { CreativeAssetSpecs } from './creative-asset-specs';
import { ScriptTemplateBadge } from './script-template-badge';
import { PlatformOverrideTabs } from './platform-override-tabs';
import { MediaUpload, type UploadedFile } from './media-upload';
import { CanvaDesignPicker } from './canva-design-picker';
import { CommentThread } from './comment-thread';
import { TagSelector } from './tag-selector';
import { ContentBrief } from './content-brief';
import { IconPicker } from './icon-picker';
import { getFormatCategory, getAvailableTemplates, type ContentFormat } from '@/config/script-frameworks';
import { generateUTMParams, buildTrackedUrl, type UTMParams } from '@/lib/utm/generate-utm';
import { PublishStatusPanel } from './publish-status-panel';
import { PublishHistory } from './publish-history';

interface ContentItem {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  time_slot: TimeSlot;
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
  platform_specs?: Record<string, { caption?: string; hashtags?: string[]; customized?: boolean }>;
  status: ContentStatus;
  media_urls?: string[] | null;
  script_template?: string | null;
  hook_template?: string | null;
  cta_template?: string | null;
  filming_notes?: string | null;
  context_section?: string | null;
  teaching_points?: string | null;
  reframe?: string | null;
  problem_expansion?: string | null;
  case_study?: string | null;
  framework_teaching?: string | null;
  rejection_reason?: string | null;
  review_comment?: string | null;
  assigned_to?: string | null;
  generation_week?: number | null;
  target_url?: string | null;
  utm_parameters?: Record<string, string> | null;
  [key: string]: unknown;
}

interface PublishedPost {
  platform: string;
  post_url: string | null;
  publish_status: string;
}

interface ContentEditorProps {
  item: ContentItem;
  onSave: (item: ContentItem) => Promise<void>;
  onClose: () => void;
  onGenerate: (itemId: string) => Promise<Partial<ContentItem>>;
  onApprove?: (itemId: string, comment?: string) => Promise<void>;
  onReject?: (itemId: string, comment: string) => Promise<void>;
  onRequestRevision?: (itemId: string, comment: string) => Promise<void>;
  onResubmit?: (itemId: string) => Promise<void>;
  canApprove?: boolean;
  organizationId?: string;
}

export function ContentEditor({ item, onSave, onClose, onGenerate, onApprove, onReject, onRequestRevision, onResubmit, canApprove, organizationId }: ContentEditorProps) {
  const [formData, setFormData] = useState(item);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);
  const [publishResults, setPublishResults] = useState<Array<{ platform: string; success: boolean; postUrl?: string; error?: string }>>([]);
  const [publishedPosts] = useState<PublishedPost[]>([]);
  const [publishedPostsData, setPublishedPostsData] = useState<Array<{
    id: string;
    platform: import('@/types/database').SocialPlatform;
    publish_status: 'queued' | 'publishing' | 'published' | 'failed';
    post_url: string | null;
    error_message: string | null;
    retry_count: number;
    published_at: string | null;
    connection_id: string;
  }>>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ user_id: string; full_name: string; role: string }>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    (item.media_urls || []).map(url => ({
      url,
      fileName: url.split('/').pop() || 'file',
      fileType: url.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : url.match(/\.pdf$/i) ? 'application/pdf' : 'image/jpeg',
      fileSize: 0,
    }))
  );
  const [showCanvaPicker, setShowCanvaPicker] = useState(false);
  const [canvaConnected, setCanvaConnected] = useState(false);

  // Load team members for assignment
  useEffect(() => {
    if (!organizationId) return;
    const orgId = organizationId;
    const supabase = createClient();
    async function loadTeam() {
      const { data } = await supabase
        .from('org_members')
        .select('user_id, role, users(full_name)')
        .eq('organization_id', orgId);
      if (data) {
        setTeamMembers(data.map((m: Record<string, unknown>) => ({
          user_id: m.user_id as string,
          full_name: ((m.users as Record<string, unknown>)?.full_name as string) || 'Unknown',
          role: m.role as string,
        })));
      }
    }
    loadTeam();
  }, [organizationId]);

  // Check Canva connection status
  useEffect(() => {
    if (!organizationId) return;
    const supabase = createClient();
    supabase
      .from('canva_connections')
      .select('id, is_active')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(1)
      .single()
      .then(({ data }) => {
        setCanvaConnected(!!data);
      });
  }, [organizationId]);

  // Load published posts for status panel
  useEffect(() => {
    if (!item.id) return;
    const supabase = createClient();
    async function loadPublishedPosts() {
      const { data } = await supabase
        .from('published_posts')
        .select('id, platform, publish_status, post_url, error_message, retry_count, published_at, connection_id')
        .eq('content_item_id', item.id)
        .order('created_at', { ascending: true });
      if (data) {
        setPublishedPostsData(data as typeof publishedPostsData);
      }
    }
    loadPublishedPosts();
  }, [item.id]);

  const handleCreateWithCanva = async () => {
    // Determine platform-appropriate size
    const platform = formData.platforms?.[0] || 'instagram';
    const sizeMap: Record<string, { width: number; height: number }> = {
      instagram: { width: 1080, height: 1080 },
      facebook: { width: 1200, height: 630 },
      linkedin: { width: 1200, height: 627 },
      twitter: { width: 1200, height: 675 },
      tiktok: { width: 1080, height: 1920 },
      youtube: { width: 1280, height: 720 },
    };
    const size = sizeMap[platform] || { width: 1080, height: 1080 };
    const title = formData.title || 'SkaleFlow Design';

    try {
      const res = await fetch('/api/canva/designs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ...size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create design');
      window.open(data.editUrl, '_blank');
    } catch (err) {
      console.error('Failed to create Canva design:', err);
    }
  };

  const handleImportFromCanva = async (designId: string) => {
    const res = await fetch('/api/canva/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import design');

    const newFile: UploadedFile = {
      url: data.url,
      fileName: data.fileName,
      fileType: 'image/png',
      fileSize: 0,
    };
    setUploadedFiles(prev => [...prev, newFile]);
  };

  const { categories: brandCategories, flatVariables: brandFlatVariables } = useBrandVariables(organizationId || null);
  const formatCategory = getFormatCategory(item.format as ContentFormat);
  const availableTemplates = getAvailableTemplates(item.format as ContentFormat);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await onGenerate(item.id);
      setFormData(prev => ({ ...prev, ...generated }));
    } catch (error) {
      console.error('Generation failed:', error);
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saveData = {
        ...formData,
        media_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : null,
      };
      await onSave(saveData);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    }
    setIsSaving(false);
  };

  const handlePublish = async () => {
    if (selectedConnectionIds.length === 0 && selectedPlatforms.length === 0) return;
    setIsPublishing(true);
    setPublishResults([]);
    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId: item.id,
          // Prefer connectionIds for granular control, fallback to platforms for backward compatibility
          ...(selectedConnectionIds.length > 0
            ? { connectionIds: selectedConnectionIds }
            : { platforms: selectedPlatforms }),
        }),
      });
      const data = await res.json();
      if (data.results) {
        setPublishResults(data.results);
        const anySuccess = data.results.some((r: { success: boolean }) => r.success);
        if (anySuccess) {
          setFormData(prev => ({ ...prev, status: 'published' }));
        }
      }
    } catch (error) {
      console.error('Publish failed:', error);
    }
    setIsPublishing(false);
  };

  const handleRetry = async (connectionId: string) => {
    setIsRetrying(true);
    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId: item.id,
          retry: true,
          retryConnectionId: connectionId,
        }),
      });
      const json = await res.json();
      // Refresh published posts data
      const supabase = createClient();
      const { data } = await supabase
        .from('published_posts')
        .select('id, platform, publish_status, post_url, error_message, retry_count, published_at, connection_id')
        .eq('content_item_id', item.id)
        .order('created_at', { ascending: true });
      if (data) {
        setPublishedPostsData(data as typeof publishedPostsData);
      }
    } catch (err) {
      console.error('Retry failed:', err);
    }
    setIsRetrying(false);
  };

  const updateField = <K extends keyof ContentItem>(field: K, value: ContentItem[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Parse carousel slides from script_body
  const carouselSlides = formatCategory === 'carousel'
    ? (() => { try { return JSON.parse(formData.script_body || '[]'); } catch { return []; } })()
    : [];

  // Parse static content from script_body
  const staticContent = formatCategory === 'static'
    ? (() => { try { return JSON.parse(formData.script_body || '{}'); } catch { return {}; } })()
    : {};

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-cream-warm shadow-2xl border-l border-stone/10 overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-cream-warm border-b border-stone/10 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-heading-md text-charcoal">Edit Content</h2>
          <p className="text-sm text-stone">
            {format(new Date(item.scheduled_date), 'EEEE, MMMM d')} â€¢ {item.scheduled_time || item.time_slot}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {organizationId && (
            <ContentBrief item={formData} organizationId={organizationId} />
          )}
          <button onClick={onClose} className="p-2 hover:bg-cream-warm rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>
      </div>

      {/* Metadata badges */}
      <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-stone/5">
        <Badge variant={item.funnel_stage}>{item.funnel_stage}</Badge>
        <Badge>{item.storybrand_stage.replace(/_/g, ' ')}</Badge>
        <Badge>{item.format.replace(/_/g, ' ')}</Badge>
        <StatusBadge status={formData.status} />
      </div>

      {/* Script template badges */}
      {(item.script_template || item.hook_template || item.cta_template) && (
        <div className="px-6 py-3 border-b border-stone/5">
          <ScriptTemplateBadge
            scriptTemplate={item.script_template}
            hookTemplate={item.hook_template}
            ctaTemplate={item.cta_template}
          />
        </div>
      )}

      {/* Rejection reason */}
      {formData.status === 'rejected' && formData.rejection_reason && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm font-medium text-red-400">Rejected</p>
          <p className="text-sm text-red-400 mt-1">{formData.rejection_reason}</p>
        </div>
      )}

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Generate button */}
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1" variant="secondary">
            <SparklesIcon className="w-5 h-5 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
          {formData.script_template && availableTemplates && (
            <select
              className="px-3 py-2 rounded-xl border border-stone/20 text-sm"
              value={formData.script_template || ''}
              onChange={e => updateField('script_template', e.target.value)}
            >
              {availableTemplates.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Creative asset specs */}
        <CreativeAssetSpecs
          format={item.format as ContentFormat}
          platforms={item.platforms}
        />

        {/* Platform selector */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">Target Platforms</label>
          <div className="flex flex-wrap gap-2">
            {['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'].map(p => (
              <button
                key={p}
                onClick={() => {
                  const platforms = formData.platforms.includes(p)
                    ? formData.platforms.filter(x => x !== p)
                    : [...formData.platforms, p];
                  updateField('platforms', platforms);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                  formData.platforms.includes(p)
                    ? 'bg-teal text-white'
                    : 'bg-stone/5 text-stone hover:bg-stone/10'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <VariableInput
          label="Topic"
          value={formData.topic || ''}
          onValueChange={(v) => updateField('topic', v)}
          placeholder="Content topic..."
          brandFlatVariables={brandFlatVariables}
          brandCategories={brandCategories}
        />

        {/* FORMAT-SPECIFIC FIELDS */}

        {/* SHORT-FORM: Hook, Script Body, CTA, Filming Notes */}
        {formatCategory === 'short' && (
          <>
            <VariableTextarea
              label="Hook"
              hint="First 3 seconds / first line that stops the scroll"
              value={formData.hook || ''}
              onValueChange={(v) => updateField('hook', v)}
              placeholder="Attention-grabbing opening..."
              rows={2}
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
            <p className="text-xs text-stone -mt-4">{(formData.hook || '').length}/100 characters</p>

            <VariableTextarea
              label="Script Body"
              value={formData.script_body || ''}
              onValueChange={(v) => updateField('script_body', v)}
              placeholder="Main content..."
              rows={6}
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />

            <VariableInput
              label="Call to Action"
              value={formData.cta || ''}
              onValueChange={(v) => updateField('cta', v)}
              placeholder="What should they do next?"
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />

            <VariableTextarea
              label="Filming Notes"
              hint="Visual directions for the creator"
              value={formData.filming_notes || ''}
              onValueChange={(v) => updateField('filming_notes', v)}
              placeholder="Camera angles, B-roll, visual cues..."
              rows={3}
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
          </>
        )}

        {/* MEDIUM-FORM: Hook, Context, Teaching Points, Reframe, CTA, Filming Notes */}
        {formatCategory === 'medium' && (
          <>
            <VariableTextarea label="Hook" hint="0-10 seconds" value={formData.hook || ''} onValueChange={v => updateField('hook', v)} placeholder="Opening hook..." rows={2} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Context Section" hint="10-30 seconds. Who this is for and what's at stake." value={formData.context_section || ''} onValueChange={v => updateField('context_section', v)} placeholder="Set up the context..." rows={3} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Teaching Points" hint="Core teaching body" value={formData.teaching_points || ''} onValueChange={v => updateField('teaching_points', v)} placeholder="Main teaching content..." rows={8} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Reframe" value={formData.reframe || ''} onValueChange={v => updateField('reframe', v)} placeholder="Tie everything together..." rows={3} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableInput label="Call to Action" value={formData.cta || ''} onValueChange={v => updateField('cta', v)} placeholder="CTA..." brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Filming Notes" value={formData.filming_notes || ''} onValueChange={v => updateField('filming_notes', v)} placeholder="Visual/B-roll directions..." rows={3} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
          </>
        )}

        {/* LONG-FORM: Hook, Context, Problem Expansion, Framework Teaching, Case Study, Reframe, CTA, Filming Notes */}
        {formatCategory === 'long' && (
          <>
            <VariableTextarea label="Hook" hint="0-30 seconds" value={formData.hook || ''} onValueChange={v => updateField('hook', v)} placeholder="Bold opening..." rows={3} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Context Section" hint="30s-2min. Authority and framing." value={formData.context_section || ''} onValueChange={v => updateField('context_section', v)} placeholder="Context..." rows={4} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Problem Expansion" hint="Deep dive into the problem landscape" value={formData.problem_expansion || ''} onValueChange={v => updateField('problem_expansion', v)} placeholder="Problem analysis..." rows={6} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Framework Teaching" hint="Core framework content" value={formData.framework_teaching || ''} onValueChange={v => updateField('framework_teaching', v)} placeholder="Framework/teaching content..." rows={10} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Case Study" value={formData.case_study || ''} onValueChange={v => updateField('case_study', v)} placeholder="Real-world example..." rows={6} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Reframe" value={formData.reframe || ''} onValueChange={v => updateField('reframe', v)} placeholder="Synthesis and worldview shift..." rows={3} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableInput label="Call to Action" value={formData.cta || ''} onValueChange={v => updateField('cta', v)} placeholder="CTA..." brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
            <VariableTextarea label="Filming Notes" value={formData.filming_notes || ''} onValueChange={v => updateField('filming_notes', v)} placeholder="Visual/production directions..." rows={4} brandFlatVariables={brandFlatVariables} brandCategories={brandCategories} />
          </>
        )}

        {/* CAROUSEL: Slides editor */}
        {formatCategory === 'carousel' && (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-charcoal">Slides</label>
              {carouselSlides.map((slide: { slide_number: number; text: string; visual_direction: string }, idx: number) => (
                <div key={idx} className="p-3 bg-cream-warm rounded-lg space-y-2">
                  <p className="text-xs font-medium text-charcoal">Slide {slide.slide_number || idx + 1}</p>
                  <VariableTextarea
                    value={slide.text || ''}
                    onValueChange={v => {
                      const updated = [...carouselSlides];
                      updated[idx] = { ...updated[idx], text: v };
                      updateField('script_body', JSON.stringify(updated));
                    }}
                    rows={2}
                    placeholder="Slide text..."
                    brandFlatVariables={brandFlatVariables}
                    brandCategories={brandCategories}
                  />
                  <VariableInput
                    value={slide.visual_direction || ''}
                    onValueChange={v => {
                      const updated = [...carouselSlides];
                      updated[idx] = { ...updated[idx], visual_direction: v };
                      updateField('script_body', JSON.stringify(updated));
                    }}
                    placeholder="Visual direction..."
                    brandFlatVariables={brandFlatVariables}
                    brandCategories={brandCategories}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* STATIC: Headline, Body Text, Visual Direction */}
        {formatCategory === 'static' && (
          <>
            <VariableInput
              label="Headline"
              value={staticContent.headline || ''}
              onValueChange={v => {
                const updated = { ...staticContent, headline: v };
                updateField('script_body', JSON.stringify(updated));
              }}
              placeholder="Bold headline/stat..."
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
            <VariableTextarea
              label="Body Text"
              value={staticContent.body_text || ''}
              onValueChange={v => {
                const updated = { ...staticContent, body_text: v };
                updateField('script_body', JSON.stringify(updated));
              }}
              rows={4}
              placeholder="Supporting text..."
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
            <VariableTextarea
              label="Visual Direction"
              value={staticContent.visual_direction || ''}
              onValueChange={v => {
                const updated = { ...staticContent, visual_direction: v };
                updateField('script_body', JSON.stringify(updated));
              }}
              rows={3}
              placeholder="Design directions..."
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
          </>
        )}

        {/* Post Description */}
        <div className="border-t border-stone/10 pt-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Post Description</label>
            <p className="text-xs text-stone mb-2">The text posted alongside your content on social media</p>
            <VariableTextarea
              value={formData.caption || ''}
              onValueChange={(v) => updateField('caption', v)}
              placeholder="Write the social media description... (~ for brand variables)"
              rows={4}
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-stone">{(formData.caption || '').length} characters</p>
                <IconPicker
                  onIconSelect={(icon) => updateField('caption', (formData.caption || '') + icon)}
                />
              </div>
              <div className="flex gap-2 text-xs text-stone">
                <span className={(formData.caption || '').length <= 150 ? 'text-teal' : 'text-stone'}>Twitter: 150</span>
                <span className={(formData.caption || '').length <= 300 ? 'text-teal' : 'text-stone'}>IG/TikTok: 300</span>
                <span className={(formData.caption || '').length <= 500 ? 'text-teal' : 'text-stone'}>LinkedIn: 500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Target URL & UTM Parameters */}
        <div className="border-t border-stone/10 pt-6 space-y-4">
          <VariableInput
            label="Target URL"
            value={formData.target_url || ''}
            onValueChange={(v) => {
              updateField('target_url', v || null);
              // Auto-generate UTM params when URL is entered and no UTM exists yet
              if (v && (!formData.utm_parameters || Object.keys(formData.utm_parameters).length === 0)) {
                const utm = generateUTMParams({
                  platform: formData.platforms[0] || 'social',
                  funnelStage: formData.funnel_stage,
                  format: formData.format,
                  topic: formData.topic,
                  scheduledDate: formData.scheduled_date,
                });
                updateField('utm_parameters', utm as unknown as Record<string, string>);
              }
            }}
            placeholder="https://example.com/landing-page"
            brandFlatVariables={brandFlatVariables}
            brandCategories={brandCategories}
          />

          {formData.target_url && (
            <div className="space-y-3 bg-cream-warm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-charcoal">UTM Parameters</h4>
                <button
                  type="button"
                  onClick={() => {
                    const utm = generateUTMParams({
                      platform: formData.platforms[0] || 'social',
                      funnelStage: formData.funnel_stage,
                      format: formData.format,
                      topic: formData.topic,
                      scheduledDate: formData.scheduled_date,
                    });
                    updateField('utm_parameters', utm as unknown as Record<string, string>);
                  }}
                  className="text-xs text-teal hover:text-teal/80 font-medium"
                >
                  Auto-generate
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <VariableInput
                  label="Source"
                  value={(formData.utm_parameters as Record<string, string>)?.utm_source || ''}
                  onValueChange={v => updateField('utm_parameters', { ...(formData.utm_parameters || {}), utm_source: v } as Record<string, string>)}
                  placeholder="e.g. linkedin"
                  brandFlatVariables={brandFlatVariables}
                  brandCategories={brandCategories}
                />
                <VariableInput
                  label="Medium"
                  value={(formData.utm_parameters as Record<string, string>)?.utm_medium || ''}
                  onValueChange={v => updateField('utm_parameters', { ...(formData.utm_parameters || {}), utm_medium: v } as Record<string, string>)}
                  placeholder="e.g. social"
                  brandFlatVariables={brandFlatVariables}
                  brandCategories={brandCategories}
                />
                <VariableInput
                  label="Campaign"
                  value={(formData.utm_parameters as Record<string, string>)?.utm_campaign || ''}
                  onValueChange={v => updateField('utm_parameters', { ...(formData.utm_parameters || {}), utm_campaign: v } as Record<string, string>)}
                  placeholder="e.g. 2026-02-awareness"
                  brandFlatVariables={brandFlatVariables}
                  brandCategories={brandCategories}
                />
                <VariableInput
                  label="Content"
                  value={(formData.utm_parameters as Record<string, string>)?.utm_content || ''}
                  onValueChange={v => updateField('utm_parameters', { ...(formData.utm_parameters || {}), utm_content: v } as Record<string, string>)}
                  placeholder="e.g. short-video-topic"
                  brandFlatVariables={brandFlatVariables}
                  brandCategories={brandCategories}
                />
                <div className="col-span-2">
                  <VariableInput
                    label="Term (optional)"
                    value={(formData.utm_parameters as Record<string, string>)?.utm_term || ''}
                    onValueChange={v => updateField('utm_parameters', { ...(formData.utm_parameters || {}), utm_term: v } as Record<string, string>)}
                    placeholder="Optional keyword term"
                    brandFlatVariables={brandFlatVariables}
                    brandCategories={brandCategories}
                  />
                </div>
              </div>
              {formData.target_url && formData.utm_parameters && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-stone mb-1">Full tracked URL:</p>
                  <p className="text-xs text-teal bg-cream-warm rounded-lg px-3 py-2 break-all border border-stone/10">
                    {buildTrackedUrl(formData.target_url, formData.utm_parameters as unknown as UTMParams)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Platform Overrides */}
        <div className="border-t border-stone/10 pt-6 space-y-4">
          <h3 className="font-medium text-charcoal text-sm">Platform Overrides</h3>
          <PlatformOverrideTabs
            platforms={formData.platforms}
            universalCaption={formData.caption || ''}
            universalHashtags={formData.hashtags || []}
            platformSpecs={(formData.platform_specs || {}) as Record<string, { caption?: string; hashtags?: string[]; customized?: boolean }>}
            organizationId={organizationId}
            onUniversalChange={(caption, hashtags) => {
              setFormData(prev => ({ ...prev, caption, hashtags }));
            }}
            onPlatformChange={(platform, caption, hashtags) => {
              setFormData(prev => ({
                ...prev,
                platform_specs: {
                  ...((prev.platform_specs || {}) as Record<string, { caption?: string; hashtags?: string[]; customized?: boolean }>),
                  [platform]: { caption, hashtags, customized: true },
                },
              }));
            }}
          />
        </div>

        {/* Creative Assets */}
        {organizationId && (
          <div className="border-t border-stone/10 pt-6 space-y-3">
            <h3 className="font-medium text-charcoal text-sm">Creative Assets</h3>
            <MediaUpload
              organizationId={organizationId}
              contentItemId={item.id}
              uploadedFiles={uploadedFiles}
              onFilesChange={setUploadedFiles}
              onCreateWithCanva={canvaConnected ? handleCreateWithCanva : undefined}
              onImportFromCanva={canvaConnected ? () => setShowCanvaPicker(true) : undefined}
            />
          </div>
        )}

        {/* Content Tags */}
        {organizationId && (
          <div className="border-t border-stone/10 pt-6 space-y-3">
            <h3 className="font-medium text-charcoal text-sm">Content Tags</h3>
            <p className="text-xs text-stone -mt-1">Internal labels for organizing your content (not posted to social media)</p>
            <TagSelector
              organizationId={organizationId}
              selectedTagIds={selectedTagIds}
              onTagsChange={setSelectedTagIds}
            />
          </div>
        )}

        {/* Comments */}
        <div className="border-t border-stone/10 pt-6">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-sm font-medium text-charcoal hover:text-teal transition-colors"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            {showComments ? 'Hide Comments' : 'Show Comments'}
          </button>
          {showComments && (
            <div className="mt-3">
              <CommentThread contentItemId={item.id} />
            </div>
          )}
        </div>

        {/* Assigned To */}
        {organizationId && teamMembers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Assigned To</label>
            <select
              value={formData.assigned_to || ''}
              onChange={(e) => updateField('assigned_to', e.target.value || null)}
              className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as ContentStatus)}
            className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            <option value="idea">Idea</option>
            <option value="scripted">Scripted</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="filming">Filming</option>
            <option value="filmed">Filmed</option>
            <option value="designing">Designing</option>
            <option value="designed">Designed</option>
            <option value="editing">Editing</option>
            <option value="edited">Edited</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Reschedule */}
        <div>
          <button
            onClick={() => setShowReschedule(!showReschedule)}
            className="flex items-center gap-2 text-sm text-teal hover:text-teal/80"
          >
            <CalendarIcon className="w-4 h-4" />
            Reschedule
          </button>
          {showReschedule && (
            <div className="mt-2 flex gap-2">
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={e => updateField('scheduled_date', e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
              <input
                type="time"
                value={formData.scheduled_time || ''}
                onChange={e => updateField('scheduled_time', e.target.value || null)}
                className="w-36 px-4 py-3 rounded-xl border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
          )}
        </div>

        {/* Revision Feedback Banner */}
        {(formData.status === 'revision_requested' || formData.status === 'rejected') && formData.review_comment && (
          <div className={cn(
            'border-t pt-6',
            formData.status === 'revision_requested' ? 'border-amber-200' : 'border-red-200'
          )}>
            <div className={cn(
              'rounded-lg p-4',
              formData.status === 'revision_requested' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'
            )}>
              <h3 className={cn(
                'text-sm font-medium mb-1',
                formData.status === 'revision_requested' ? 'text-amber-800' : 'text-red-400'
              )}>
                {formData.status === 'revision_requested' ? 'Revisions Requested' : 'Rejected'}
              </h3>
              <p className={cn(
                'text-sm',
                formData.status === 'revision_requested' ? 'text-amber-700' : 'text-red-400'
              )}>
                {formData.review_comment}
              </p>
            </div>
            {onResubmit && (
              <Button
                onClick={() => onResubmit(item.id)}
                className="mt-3 w-full bg-teal hover:bg-teal/90"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Resubmit for Review
              </Button>
            )}
          </div>
        )}

        {/* Approval UI */}
        {formData.status === 'pending_review' && canApprove && onApprove && onReject && (
          <div className="border-t border-stone/10 pt-6 space-y-3">
            <h3 className="font-medium text-charcoal">Review</h3>
            <VariableTextarea
              value={reviewComment}
              onValueChange={setReviewComment}
              placeholder="Add a comment (optional for approval, required for rejection/revision)..."
              rows={2}
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
            <div className="flex gap-3">
              <Button onClick={() => onApprove(item.id, reviewComment)} className="flex-1 bg-green-600 hover:bg-green-700">
                Approve
              </Button>
              {onRequestRevision && (
                <Button
                  onClick={() => {
                    if (reviewComment.trim()) {
                      onRequestRevision(item.id, reviewComment);
                    }
                  }}
                  variant="ghost"
                  className="flex-1 text-amber-600 border border-amber-200 hover:bg-amber-50"
                  disabled={!reviewComment.trim()}
                >
                  Request Revisions
                </Button>
              )}
              <Button
                onClick={() => onReject(item.id, reviewComment || 'No reason provided')}
                variant="ghost"
                className="flex-1 text-red-600 border border-red-200 hover:bg-red-50"
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Publish Section */}
        {['idea', 'scripted', 'edited', 'scheduled', 'approved', 'designed', 'filmed'].includes(formData.status) && (
          <div className="border-t border-stone/10 pt-6 space-y-4">
            <h3 className="font-medium text-charcoal">Publish to Social Media</h3>

            <PlatformSelector
              selectedPlatforms={selectedPlatforms}
              onSelectionChange={setSelectedPlatforms}
              selectedConnectionIds={selectedConnectionIds}
              onConnectionIdsChange={setSelectedConnectionIds}
              contentItem={{ media_urls: item.media_urls || null }}
            />

            {selectedPlatforms.length > 0 && (
              <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
                <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                {isPublishing ? 'Publishing...' : `Publish Now to ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}`}
              </Button>
            )}

            {publishResults.length > 0 && (
              <div className="space-y-2">
                {publishResults.map((result, i) => (
                  <div key={i} className={cn('p-3 rounded-lg text-sm', result.success ? 'bg-teal/10 border border-teal/20 text-teal' : 'bg-red-50 border border-red-200 text-red-400')}>
                    <span className="font-medium">{PLATFORM_CONFIG[result.platform as SocialPlatform]?.name || result.platform}:</span>{' '}
                    {result.success ? (
                      <>Published successfully
                        {result.postUrl && (
                          <a href={result.postUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 underline">
                            View post <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    ) : (result.error || 'Failed')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Publish Status Panel — shows for any item with publish attempts */}
        {publishedPostsData.length > 0 && (
          <div className="border-t border-stone/10 pt-6">
            <PublishStatusPanel
              contentItemId={item.id}
              posts={publishedPostsData}
              onRetry={handleRetry}
              isRetrying={isRetrying}
            />
          </div>
        )}

        {/* Publish History Timeline */}
        {item.id && (formData.status === 'published' || formData.status === 'scheduled' || publishedPostsData.length > 0) && (
          <div className="border-t border-stone/10 pt-4">
            <PublishHistory contentItemId={item.id} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-cream-warm border-t border-stone/10 px-6 py-4 flex gap-3">
        <Button onClick={onClose} variant="ghost" className="flex-1">Cancel</Button>
        <Button onClick={handleSave} isLoading={isSaving} className="flex-1">Save Changes</Button>
      </div>

      {/* Canva Design Picker Modal */}
      {showCanvaPicker && (
        <CanvaDesignPicker
          onImport={handleImportFromCanva}
          onClose={() => setShowCanvaPicker(false)}
        />
      )}
    </div>
  );
}
