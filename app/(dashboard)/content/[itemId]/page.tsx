'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Textarea, StatusBadge, ActionModal } from '@/components/ui';
import { MediaUpload, UTMBuilderModal, PostActionPopup, AIModelPicker, type UploadedFile, type PublishResult } from '@/components/content';
import { PreviewPanel } from '@/components/content/preview-panel';
import { InstanceEditForm, type InstanceSpec } from '@/components/content/instance-edit-form';
import ScriptModal, { type ScriptData } from '@/components/content/script-modal';
import ConfigModal, { ConfigSummaryChip, type ContentConfig } from '@/components/content/config-modal';
import { createDefaultPlacementsMap, getEnabledPlatforms, type PlatformPlacementsMap } from '@/config/placement-types';
import { FORMAT_LABELS, getFormatCategory, type ContentFormat } from '@/config/script-frameworks';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useModelPreference } from '@/hooks/useModelPreference';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import type { SocialPlatform, ContentStatus, FunnelStage, StoryBrandStage, PlacementType } from '@/types/database';
import type { UTMParams } from '@/lib/utm/generate-utm';

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
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Editable fields (caption-first)
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  // Script data (managed via ScriptModal)
  const [scriptData, setScriptData] = useState<ScriptData>({
    hook: null, script_body: null, cta: null, filming_notes: null,
    context_section: null, teaching_points: null, reframe: null,
    problem_expansion: null, framework_teaching: null, case_study: null,
  });

  // Platform / placement state (managed via PreviewPanel)
  const [platformPlacements, setPlatformPlacements] = useState<PlatformPlacementsMap>(
    createDefaultPlacementsMap(['linkedin'])
  );
  const [platformSpecs, setPlatformSpecs] = useState<Record<string, InstanceSpec>>({});
  const [editingInstance, setEditingInstance] = useState<PlacementType | null>(null);

  // Config state
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>('short_video_30_60');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('awareness');
  const [storybrandStage, setStorybrandStage] = useState<StoryBrandStage>('character');
  const [contentAngles, setContentAngles] = useState<Array<{ id: string; name: string; emotional_target: string | null }>>([]);

  // AI assist state
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Scheduling
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00');

  // Media
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Target URL / UTM
  const [targetUrl, setTargetUrl] = useState('');
  const [utmParams, setUtmParams] = useState<UTMParams | null>(null);
  const [showUtmModal, setShowUtmModal] = useState(false);
  const [showTargetUrl, setShowTargetUrl] = useState(false);

  // Modals
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    variant: 'success' | 'error' | 'info';
    title: string;
    subtitle?: string;
  }>({ variant: 'success', title: '' });
  const [showPostActionPopup, setShowPostActionPopup] = useState(false);

  // Variation group state
  const [variationSiblings, setVariationSiblings] = useState<VariationSibling[]>([]);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Hooks Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const { models } = useAvailableModels('content_generation');
  const { selectedModel: orgDefaultModel } = useModelPreference(organizationId, 'content_generation');
  const effectiveModelId = selectedModelId || orgDefaultModel || null;
  const formatCategory = getFormatCategory(selectedFormat);

  // Computed config for ConfigModal / ConfigSummaryChip
  const contentConfig: ContentConfig = {
    format: selectedFormat,
    funnelStage,
    storybrandStage,
    angleId: null,
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const updateField = (key: string, value: string) => {
    setEditFields(prev => ({ ...prev, [key]: value }));
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Load item Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
        setOrganizationId(loadedItem.organization_id);

        // Populate editFields
        setEditFields({
          caption: loadedItem.caption || '',
          hashtags: (loadedItem.hashtags || []).join(', '),
          topic: loadedItem.topic || '',
        });

        // Populate scriptData
        setScriptData({
          hook: loadedItem.hook || null,
          script_body: loadedItem.script_body || null,
          cta: loadedItem.cta || null,
          filming_notes: loadedItem.filming_notes || null,
          context_section: loadedItem.context_section || null,
          teaching_points: loadedItem.teaching_points || null,
          reframe: loadedItem.reframe || null,
          problem_expansion: loadedItem.problem_expansion || null,
          framework_teaching: loadedItem.framework_teaching || null,
          case_study: loadedItem.case_study || null,
        });

        // Platform placements from saved platforms array
        const loadedPlatforms = (loadedItem.platforms || ['linkedin']) as SocialPlatform[];
        setPlatformPlacements(createDefaultPlacementsMap(loadedPlatforms));

        // Platform specs
        if (loadedItem.platform_specs) {
          const specs: Record<string, InstanceSpec> = {};
          for (const [key, val] of Object.entries(loadedItem.platform_specs)) {
            if (val && typeof val === 'object') {
              specs[key] = val as InstanceSpec;
            }
          }
          setPlatformSpecs(specs);
        }

        // Config
        setSelectedFormat((loadedItem.format || 'short_video_30_60') as ContentFormat);
        setFunnelStage(loadedItem.funnel_stage || 'awareness');
        setStorybrandStage(loadedItem.storybrand_stage || 'character');

        // Schedule
        setScheduledDate(loadedItem.scheduled_date || '');
        setScheduledTime(loadedItem.scheduled_time || '08:00');

        // Target URL / UTM
        setTargetUrl(loadedItem.target_url || '');
        if (loadedItem.utm_parameters) {
          setUtmParams(loadedItem.utm_parameters as unknown as UTMParams);
        }
        if (loadedItem.target_url || loadedItem.utm_parameters) {
          setShowTargetUrl(true);
        }

        // Media
        const loadedMedia = (loadedItem.media_urls || []).map((url: string) => ({
          url,
          fileName: url.split('/').pop() || 'file',
          fileType: 'image/jpeg',
          fileSize: 0,
        }));
        setUploadedFiles(loadedMedia);

        // Load variation siblings
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

        // Load content angles for ConfigModal
        const { data: angles } = await supabase
          .from('content_angles')
          .select('id, name, emotional_target')
          .eq('organization_id', loadedItem.organization_id)
          .eq('is_active', true)
          .order('sort_order');
        if (angles) setContentAngles(angles);

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

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Build save body Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const buildSaveBody = useCallback((overrides?: Record<string, unknown>) => {
    const hashtagsArray = (editFields.hashtags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const body: Record<string, unknown> = {
      topic: editFields.topic || null,
      caption: editFields.caption || null,
      hashtags: hashtagsArray.length > 0 ? hashtagsArray : null,
      platforms: getEnabledPlatforms(platformPlacements),
      platform_specs: Object.keys(platformSpecs).length > 0 ? platformSpecs : null,
      format: selectedFormat,
      funnel_stage: funnelStage,
      storybrand_stage: storybrandStage,
      target_url: targetUrl || null,
      utm_parameters: utmParams || null,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      media_urls: uploadedFiles.map(f => f.url),
      // Script fields
      hook: scriptData.hook || null,
      script_body: scriptData.script_body || null,
      cta: scriptData.cta || null,
      filming_notes: scriptData.filming_notes || null,
      context_section: scriptData.context_section || null,
      teaching_points: scriptData.teaching_points || null,
      reframe: scriptData.reframe || null,
      problem_expansion: scriptData.problem_expansion || null,
      framework_teaching: scriptData.framework_teaching || null,
      case_study: scriptData.case_study || null,
      ...overrides,
    };

    return body;
  }, [editFields, platformPlacements, platformSpecs, selectedFormat, funnelStage, storybrandStage, targetUrl, utmParams, scheduledDate, scheduledTime, uploadedFiles, scriptData]);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Save handler Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleSave = useCallback(async (newStatus?: ContentStatus) => {
    if (!item) return;
    setIsSaving(true);

    try {
      const body = buildSaveBody(newStatus ? { status: newStatus } : undefined);

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
  }, [item, buildSaveBody, scheduledDate, scheduledTime]);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Review handler (unchanged) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleReview = useCallback(async (action: 'approve' | 'reject' | 'request_revision', comment?: string) => {
    if (!item) return;
    const res = await fetch(`/api/content/items/${item.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment }),
    });
    if (res.ok) {
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

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ AI Assist handler Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleAiAssistPost = async () => {
    if (!organizationId) return;
    setIsAiAssisting(true);
    setGenerateError(null);

    try {
      const res = await fetch('/api/content/ai-assist/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          funnelStage,
          storybrandStage,
          format: selectedFormat,
          platforms: getEnabledPlatforms(platformPlacements),
          modelOverride: effectiveModelId,
          existingCaption: editFields.caption || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      updateField('caption', data.caption || '');
      updateField('topic', data.topic || '');
      updateField('hashtags', (data.hashtags || []).join(', '));
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'AI assist failed');
    }

    setIsAiAssisting(false);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Post action popup handlers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handlePopupSaveDraft = async (): Promise<string | null> => {
    await handleSave();
    return item?.id || null;
  };

  const handlePopupSchedule = async (date: string, time: string): Promise<string | null> => {
    if (!item) return null;
    setIsSaving(true);
    try {
      const body = buildSaveBody({
        scheduled_date: date,
        scheduled_time: time,
        status: 'scheduled',
      });

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

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Loading / Not found states Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
  const enabledPlatforms = getEnabledPlatforms(platformPlacements);
  const formatLabel = FORMAT_LABELS[selectedFormat] || selectedFormat;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Header Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
              {editFields.topic || 'Untitled Post'}
            </h1>
            <p className="text-sm text-stone">
              {scheduledDate ? format(new Date(scheduledDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy') : 'No date'} &middot; {formatLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Revision feedback banner Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
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

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Variation group tabs Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
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

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Two-column layout (matching create page) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Post content (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {editingInstance ? (
            <InstanceEditForm
              placementType={editingInstance}
              masterCaption={editFields.caption || ''}
              masterHashtags={(editFields.hashtags || '').split(',').map(t => t.trim()).filter(Boolean)}
              instanceSpec={platformSpecs[editingInstance] || {}}
              onSave={(placement, spec) => {
                const updated = { ...platformSpecs };
                if (Object.keys(spec).length === 0) delete updated[placement];
                else updated[placement] = spec;
                setPlatformSpecs(updated);
                setEditingInstance(null);
              }}
              onCancel={() => setEditingInstance(null)}
            />
          ) : (
            <>
              {/* Card 1: Main Post Ã¢â‚¬â€ Config + Caption + Hashtags + Topic */}
              <Card>
                {/* Config summary + Configure button */}
                <div className="flex items-center justify-between mb-4">
                  <ConfigSummaryChip config={contentConfig} angles={contentAngles} />
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="text-xs font-medium text-teal hover:underline"
                  >
                    Configure
                  </button>
                </div>

                {/* Caption Ã¢â‚¬â€ PRIMARY FIELD */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-charcoal-700">Caption / Description</label>
                    <button
                      onClick={handleAiAssistPost}
                      disabled={isAiAssisting}
                      className="flex items-center gap-1.5 text-xs font-medium text-teal hover:underline disabled:opacity-50"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      {isAiAssisting ? 'Generating...' : editFields.caption ? 'AI Enhance' : 'AI Generate'}
                    </button>
                  </div>
                  <Textarea
                    value={editFields.caption || ''}
                    onChange={e => updateField('caption', e.target.value)}
                    rows={8}
                    placeholder="Write your post caption..."
                    className="text-sm"
                  />
                </div>

                {/* Hashtags */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-charcoal-700 mb-1 block">Hashtags</label>
                  <input
                    value={editFields.hashtags || ''}
                    onChange={e => updateField('hashtags', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                    placeholder="hashtag1, hashtag2, hashtag3"
                  />
                </div>

                {/* Topic (small) */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-charcoal-700 mb-1 block">Topic</label>
                  <input
                    value={editFields.topic || ''}
                    onChange={e => updateField('topic', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                    placeholder="Brief topic summary"
                  />
                </div>
              </Card>

              {/* Card 2: Media */}
              <Card>
                <h3 className="text-heading-sm text-charcoal mb-3">Media</h3>
                <MediaUpload
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  organizationId={item.organization_id}
                />
              </Card>

              {/* Small buttons row */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowScriptModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone/20 text-sm text-stone-600 hover:border-teal/30 hover:text-teal transition-colors"
                >
                  Script {scriptData.hook || scriptData.script_body ? '(added)' : '(optional)'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTargetUrl(prev => !prev)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone/20 text-sm text-stone-600 hover:border-teal/30 hover:text-teal transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  {targetUrl ? 'Edit Link' : 'Add Link'}
                </button>
              </div>

              {/* Target URL (collapsible) */}
              {(showTargetUrl || targetUrl || utmParams) && (
                <Card>
                  <h3 className="text-heading-sm text-charcoal mb-3">Target URL &amp; Tracking</h3>
                  <input
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                    placeholder="https://your-link.com"
                  />
                  <button
                    onClick={() => setShowUtmModal(true)}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-teal hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    {utmParams ? 'Edit UTM Parameters' : 'Build UTM Parameters'}
                  </button>
                  {utmParams && (utmParams.utm_source || utmParams.utm_campaign) && (
                    <div className="mt-2 bg-cream-warm rounded-lg p-2.5">
                      <p className="text-xs text-stone">
                        {[
                          utmParams.utm_source && `source: ${utmParams.utm_source}`,
                          utmParams.utm_medium && `medium: ${utmParams.utm_medium}`,
                          utmParams.utm_campaign && `campaign: ${utmParams.utm_campaign}`,
                        ].filter(Boolean).join(' Ã‚Â· ')}
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {/* Schedule + AI Model + Actions */}
              <Card>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-charcoal-700 mb-1 block">Schedule Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-charcoal-700 mb-1 block">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                    />
                  </div>
                </div>

                {/* AI Model selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-charcoal mb-2">AI Model</label>
                  <AIModelPicker
                    models={models}
                    selectedModelId={effectiveModelId}
                    onSelect={setSelectedModelId}
                    costLabelFn={m => m.isFree ? 'Free' : `~${m.estimatedCreditsPerMessage} cr`}
                  />
                </div>

                <Button
                  onClick={() => setShowPostActionPopup(true)}
                  className="w-full"
                  disabled={isSaving}
                >
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  Save &amp; Publish
                </Button>
              </Card>

              {/* Error display */}
              {generateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{generateError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Preview Panel (2/5) */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <Card className="p-5">
              <PreviewPanel
                platformPlacements={platformPlacements}
                onPlatformPlacementsChange={setPlatformPlacements}
                caption={editFields.caption || ''}
                hashtags={(editFields.hashtags || '').split(',').map(t => t.trim()).filter(Boolean)}
                mediaUrls={uploadedFiles.map(f => f.url)}
                targetUrl={targetUrl}
                userName={userName}
                instanceSpecs={platformSpecs}
                onEditInstance={setEditingInstance}
                editingInstance={editingInstance}
                hasMedia={uploadedFiles.length > 0}
                hasVideo={uploadedFiles.some(f => f.fileType?.startsWith('video/'))}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Footer Actions Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
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

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Modals Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}

      {/* Script Modal */}
      <ScriptModal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        scriptData={scriptData}
        onSave={setScriptData}
        formatCategory={formatCategory}
        organizationId={item.organization_id}
        caption={editFields.caption}
        hashtags={editFields.hashtags ? editFields.hashtags.split(',').map(h => h.trim()).filter(Boolean) : []}
        funnelStage={funnelStage}
        storybrandStage={storybrandStage}
        format={selectedFormat}
      />

      {/* Config Modal */}
      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        config={contentConfig}
        onSave={(c) => {
          setSelectedFormat(c.format);
          setFunnelStage(c.funnelStage);
          setStorybrandStage(c.storybrandStage);
        }}
        angles={contentAngles}
      />

      {/* UTM Builder Modal */}
      <UTMBuilderModal
        open={showUtmModal}
        onClose={() => setShowUtmModal(false)}
        baseUrl={targetUrl}
        initialParams={utmParams}
        onApply={setUtmParams}
        autoGenerateContext={{
          platform: enabledPlatforms[0] || 'linkedin',
          funnelStage,
          format: selectedFormat,
          topic: editFields.topic || null,
          scheduledDate: scheduledDate || format(new Date(), 'yyyy-MM-dd'),
        }}
      />

      {/* Post Action Popup */}
      <PostActionPopup
        open={showPostActionPopup}
        onClose={() => setShowPostActionPopup(false)}
        platforms={enabledPlatforms as string[]}
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
