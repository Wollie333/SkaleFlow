'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, PageHeader, ActionModal } from '@/components/ui';
import { BrandVariablesPanel, CreativeAssetSpecs, MediaUpload, UTMBuilderModal, PostActionPopup, AIModelPicker, type UploadedFile, type PublishResult, IconPicker } from '@/components/content';
import { DriveFilePicker } from '@/components/content/drive-file-picker';
import { CanvaDesignPicker } from '@/components/content/canva-design-picker';
import { PreviewPanel } from '@/components/content/preview-panel';
import { InstanceEditForm, type InstanceSpec } from '@/components/content/instance-edit-form';
import ScriptModal, { type ScriptData } from '@/components/content/script-modal';
import ConfigModal, { ConfigSummaryChip, type ContentConfig } from '@/components/content/config-modal';
import { createDefaultPlacementsMap, getEnabledPlatforms, type PlatformPlacementsMap } from '@/config/placement-types';
import {
  SparklesIcon,
  BeakerIcon,
  PencilSquareIcon,
  BoltIcon,
  XMarkIcon,
  LinkIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import {
  FORMAT_LABELS,
  getFormatCategory,
  getScriptFramework,
  type ContentFormat,
  type FormatCategory,
} from '@/config/script-frameworks';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useModelPreference } from '@/hooks/useModelPreference';
import { cn } from '@/lib/utils';
import { useBrandVariables } from '@/hooks/useBrandVariables';
import { VariableTextarea, VariableInput } from '@/components/content/variable-field';
import type { FunnelStage, StoryBrandStage, ContentStatus, Json, SocialPlatform, PlacementType } from '@/types/database';
import type { UTMParams } from '@/lib/utm/generate-utm';

interface GeneratedContent {
  id?: string;
  topic: string | null;
  hook: string | null;
  script_body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[] | null;
  filming_notes: string | null;
  context_section: string | null;
  teaching_points: string | null;
  reframe: string | null;
  problem_expansion: string | null;
  framework_teaching: string | null;
  case_study: string | null;
  script_template: string | null;
  hook_template: string | null;
  cta_template: string | null;
  platform_specs: Record<string, unknown> | null;
  media_urls: string[] | null;
  status: ContentStatus;
}

interface BulkPlanItem {
  id?: string;
  scheduled_date: string;
  time_slot: string;
  format: ContentFormat;
  funnel_stage: FunnelStage;
  storybrand_stage: StoryBrandStage;
  platforms: string[];
  topic: string | null;
  hook: string | null;
  status: ContentStatus;
  selected: boolean;
}

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

const PLATFORM_OPTIONS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS).map(([value, label]) => ({
  value: value as ContentFormat,
  label,
}));

const FUNNEL_COLORS: Record<FunnelStage, string> = {
  awareness: 'bg-green-100 text-green-800',
  consideration: 'bg-blue-100 text-blue-800',
  conversion: 'bg-orange-100 text-orange-800',
};

export default function ContentCreatePage() {
  const supabase = createClient();
  const router = useRouter();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [contentEngineEnabled, setContentEngineEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Shared configuration state
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>('short_video_30_60');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('awareness');
  const [storybrandStage, setStorybrandStage] = useState<StoryBrandStage>('character');
  const [platforms, setPlatforms] = useState<string[]>(['linkedin']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [showBrandPanel, setShowBrandPanel] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Media upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [hasDriveConnection, setHasDriveConnection] = useState(false);
  const [hasCanvaConnection, setHasCanvaConnection] = useState(false);
  const [showCanvaPicker, setShowCanvaPicker] = useState(false);

  // AI model selection
  const [showModelModal, setShowModelModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'generate' | 'enhance' | 'regenerate' | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Editable fields
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  // Manual mode: content item ID (created on first save)
  const [manualItemId, setManualItemId] = useState<string | null>(null);

  // Bulk mode state
  const [bulkCampaignName, setBulkCampaignName] = useState('');
  const [bulkStartDate, setBulkStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkFrequency, setBulkFrequency] = useState<'aggressive' | 'moderate' | 'light'>('moderate');
  const [bulkFunnelFocus, setBulkFunnelFocus] = useState<FunnelStage | 'balanced'>('balanced');
  const [bulkPlatforms, setBulkPlatforms] = useState<string[]>(['linkedin', 'facebook', 'instagram']);
  const [bulkItems, setBulkItems] = useState<BulkPlanItem[]>([]);
  const [isBulkPlanning, setIsBulkPlanning] = useState(false);
  const [isBulkPushing, setIsBulkPushing] = useState(false);
  const [bulkModelId, setBulkModelId] = useState<string | null>(null);
  const [bulkBatchId, setBulkBatchId] = useState<string | null>(null);
  const [bulkCalendarId, setBulkCalendarId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userName, setUserName] = useState('');

  // ActionModal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModalConfig, setActionModalConfig] = useState<{
    variant: 'success' | 'error' | 'info';
    title: string;
    subtitle?: string;
    savedItemId?: string;
  }>({ variant: 'success', title: '' });

  // Post action popup + UTM state
  const [showPostActionPopup, setShowPostActionPopup] = useState(false);
  const [utmParams, setUtmParams] = useState<UTMParams | null>(null);
  const [showUtmModal, setShowUtmModal] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');

  // Creative direction prompt
  const [creativeDirection, setCreativeDirection] = useState('');

  // Content angles for config modal
  const [contentAngles, setContentAngles] = useState<Array<{
    id: string; name: string; emotional_target: string | null;
  }>>([]);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [showTargetUrl, setShowTargetUrl] = useState(false);

  // New state for single/manual redesign
  const [platformPlacements, setPlatformPlacements] = useState<PlatformPlacementsMap>(
    createDefaultPlacementsMap(['linkedin'])
  );
  const [platformSpecs, setPlatformSpecs] = useState<Record<string, InstanceSpec>>({});
  const [editingInstance, setEditingInstance] = useState<PlacementType | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptData>({
    hook: null, script_body: null, cta: null, filming_notes: null,
    context_section: null, teaching_points: null, reframe: null,
    problem_expansion: null, framework_teaching: null, case_study: null,
  });
  const [isAiAssisting, setIsAiAssisting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id, organizations(content_engine_enabled)')
        .eq('user_id', user.id)
        .single();

      if (membership?.organization_id) {
        setOrganizationId(membership.organization_id);
        const orgData = membership.organizations as { content_engine_enabled: boolean } | null;
        setContentEngineEnabled(orgData?.content_engine_enabled || false);

        // Check if user is super_admin + get name
        const { data: userData } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', user.id)
          .single();
        if (userData?.role === 'super_admin') {
          setIsSuperAdmin(true);
        }
        if (userData?.full_name) {
          setUserName(userData.full_name);
        }

        // Check for Google Drive connection
        const { data: driveConn } = await supabase
          .from('google_drive_connections')
          .select('id')
          .eq('organization_id', membership.organization_id)
          .eq('is_active', true)
          .maybeSingle();
        setHasDriveConnection(!!driveConn);

        // Check Canva connection
        const { data: canvaConn } = await supabase
          .from('canva_connections')
          .select('id')
          .eq('organization_id', membership.organization_id)
          .eq('is_active', true)
          .maybeSingle();
        setHasCanvaConnection(!!canvaConn);

        // Load content angles for config modal
        const { data: angles } = await supabase
          .from('content_angles')
          .select('id, name, emotional_target')
          .eq('organization_id', membership.organization_id)
          .eq('is_active', true)
          .order('sort_order');
        if (angles) setContentAngles(angles);
      }

      setIsLoading(false);
    }

    loadData();
  }, [supabase]);

  const { models } = useAvailableModels('content_generation');
  const { selectedModel: orgDefaultModel } = useModelPreference(organizationId, 'content_generation');
  const { balance, isLoading: balanceLoading } = useCreditBalance(organizationId);
  const { categories: brandCategories, flatVariables: brandFlatVariables } = useBrandVariables(organizationId);

  const effectiveModelId = selectedModelId || orgDefaultModel || null;
  const selectedModel = effectiveModelId ? models.find(m => m.id === effectiveModelId) : null;

  /** 1 credit = 1 ZAR cent -> 100 credits = R1.00 */
  const creditsToRand = (credits: number) => `R${(credits / 100).toFixed(2)}`;

  const openModelModal = (action: 'generate' | 'enhance' | 'regenerate') => {
    setPendingAction(action);
    setGenerateError(null);
    setShowModelModal(true);
  };

  const handleModelConfirm = () => {
    setShowModelModal(false);
    if (pendingAction === 'generate') {
      handleGenerate(effectiveModelId || undefined);
    } else if (pendingAction === 'enhance') {
      handleEnhanceWithAI(effectiveModelId || undefined);
    } else if (pendingAction === 'regenerate') {
      handleRegenerate(effectiveModelId || undefined);
    }
    setPendingAction(null);
  };

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const toggleBulkPlatform = (p: string) => {
    setBulkPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const frameworkInfo = getScriptFramework(selectedFormat, funnelStage, storybrandStage);
  const formatCategory = getFormatCategory(selectedFormat);

  // Computed config for ConfigModal / ConfigSummaryChip
  const contentConfig: ContentConfig = {
    format: selectedFormat,
    funnelStage,
    storybrandStage,
    angleId: null,
  };

  // Primary field keys -- always visible
  const PRIMARY_FIELDS = new Set(['topic', 'hook', 'script_body', 'cta', 'caption']);

  // Get fields to display based on format category
  const getFieldsForFormat = (cat: FormatCategory): { key: string; label: string; rows?: number; advanced?: boolean }[] => {
    const common = [
      { key: 'caption', label: 'Caption', rows: 3 },
      { key: 'hashtags', label: 'Hashtags (comma-separated)', rows: 1, advanced: true },
    ];

    const markAdvanced = (fields: { key: string; label: string; rows?: number }[]) =>
      fields.map(f => ({ ...f, advanced: !PRIMARY_FIELDS.has(f.key) }));

    switch (cat) {
      case 'short':
        return markAdvanced([
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'hook', label: 'Hook (0-3s)', rows: 2 },
          { key: 'script_body', label: 'Script Body', rows: 6 },
          { key: 'cta', label: 'CTA (last 2-3s)', rows: 2 },
          { key: 'filming_notes', label: 'Filming Notes', rows: 3 },
          ...common,
        ]);
      case 'medium':
        return markAdvanced([
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'hook', label: 'Hook (0-10s)', rows: 2 },
          { key: 'context_section', label: 'Context (10-30s)', rows: 4 },
          { key: 'teaching_points', label: 'Teaching Points', rows: 6 },
          { key: 'reframe', label: 'Reframe', rows: 3 },
          { key: 'cta', label: 'CTA', rows: 2 },
          { key: 'filming_notes', label: 'Filming Notes', rows: 3 },
          ...common,
        ]);
      case 'long':
        return markAdvanced([
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'hook', label: 'Hook (0-30s)', rows: 3 },
          { key: 'context_section', label: 'Context (30s-2min)', rows: 4 },
          { key: 'problem_expansion', label: 'Problem Expansion', rows: 5 },
          { key: 'framework_teaching', label: 'Framework Teaching', rows: 8 },
          { key: 'case_study', label: 'Case Study', rows: 5 },
          { key: 'reframe', label: 'Reframe', rows: 3 },
          { key: 'cta', label: 'CTA', rows: 2 },
          { key: 'filming_notes', label: 'Filming Notes', rows: 3 },
          ...common,
        ]);
      case 'carousel':
        return markAdvanced([
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'script_body', label: 'Slides (JSON)', rows: 10 },
          ...common,
        ]);
      case 'static':
        return markAdvanced([
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'script_body', label: 'Content (headline, body, visual direction)', rows: 8 },
          ...common,
        ]);
    }
  };

  // AI Assist for single/manual modes (new caption-first flow)
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
          creativeDirection: creativeDirection || null,
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

  // Single mode: generate content (legacy, kept for bulk/engine compat)
  const handleGenerate = async (modelOverride?: string) => {
    if (!organizationId || platforms.length === 0) return;
    setIsGenerating(true);
    setSaveSuccess(false);
    setGenerateError(null);

    try {
      // First create the item (without generating)
      const createRes = await fetch('/api/content/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          format: selectedFormat,
          funnel_stage: funnelStage,
          storybrand_stage: storybrandStage,
          platforms,
          scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        }),
      });

      const createData = await createRes.json();
      if (createData.error) throw new Error(createData.error);

      const itemId = createData.item?.id;
      if (!itemId) throw new Error('No item ID returned');

      // Now generate content with the selected model
      const genRes = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, contentItemIds: [itemId], modelOverride }),
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Generation failed');

      const { data: item } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (item) {
        const gen: GeneratedContent = {
          id: item.id,
          topic: item.topic,
          hook: item.hook,
          script_body: item.script_body,
          cta: item.cta,
          caption: item.caption,
          hashtags: item.hashtags,
          filming_notes: item.filming_notes,
          context_section: item.context_section,
          teaching_points: item.teaching_points,
          reframe: item.reframe,
          problem_expansion: item.problem_expansion,
          framework_teaching: item.framework_teaching,
          case_study: item.case_study,
          script_template: item.script_template,
          hook_template: item.hook_template,
          cta_template: item.cta_template,
          platform_specs: (item.platform_specs || null) as Record<string, unknown> | null,
          media_urls: item.media_urls || null,
          status: item.status,
        };
        setGenerated(gen);

        if (gen.media_urls && gen.media_urls.length > 0) {
          setUploadedFiles(gen.media_urls.map(url => ({
            url,
            fileName: url.split('/').pop() || 'file',
            fileType: url.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : url.match(/\.pdf$/i) ? 'application/pdf' : 'image/jpeg',
            fileSize: 0,
          })));
        } else {
          setUploadedFiles([]);
        }

        const fields: Record<string, string> = {};
        if (gen.topic) fields.topic = gen.topic;
        if (gen.hook) fields.hook = gen.hook;
        if (gen.script_body) fields.script_body = gen.script_body;
        if (gen.cta) fields.cta = gen.cta;
        if (gen.caption) fields.caption = gen.caption;
        if (gen.hashtags) fields.hashtags = gen.hashtags.join(', ');
        if (gen.filming_notes) fields.filming_notes = gen.filming_notes;
        if (gen.context_section) fields.context_section = gen.context_section;
        if (gen.teaching_points) fields.teaching_points = gen.teaching_points;
        if (gen.reframe) fields.reframe = gen.reframe;
        if (gen.problem_expansion) fields.problem_expansion = gen.problem_expansion;
        if (gen.framework_teaching) fields.framework_teaching = gen.framework_teaching;
        if (gen.case_study) fields.case_study = gen.case_study;
        setEditFields(fields);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setGenerateError(error instanceof Error ? error.message : 'Generation failed. Please try again.');
    }

    setIsGenerating(false);
  };

  // Single mode: regenerate (now uses handleAiAssistPost)
  const handleRegenerate = async (_modelOverride?: string) => {
    await handleAiAssistPost();
  };

  // Helper to build the script data fields for save body
  const buildScriptFields = (): Record<string, unknown> => ({
    hook: scriptData.hook || editFields.hook || null,
    script_body: scriptData.script_body || editFields.script_body || null,
    cta: scriptData.cta || editFields.cta || null,
    filming_notes: scriptData.filming_notes || editFields.filming_notes || null,
    context_section: scriptData.context_section || editFields.context_section || null,
    teaching_points: scriptData.teaching_points || editFields.teaching_points || null,
    reframe: scriptData.reframe || editFields.reframe || null,
    problem_expansion: scriptData.problem_expansion || editFields.problem_expansion || null,
    framework_teaching: scriptData.framework_teaching || editFields.framework_teaching || null,
    case_study: scriptData.case_study || editFields.case_study || null,
  });

  // Silent save (for publish flow - doesn't show modal)
  const handleSilentSave = async (): Promise<string | null> => {
    const itemId = generated?.id;
    const activePlatforms = getEnabledPlatforms(platformPlacements) as string[];

    try {
      const updateBody: Record<string, unknown> = {
        topic: editFields.topic || null,
        caption: editFields.caption || null,
        hashtags: editFields.hashtags ? editFields.hashtags.split(',').map(h => h.trim()).filter(Boolean) : null,
        media_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : null,
        platform_specs: Object.keys(platformSpecs).length > 0 ? platformSpecs : null,
        ...buildScriptFields(),
      };

      // If no item exists yet (manual mode, first save), create one
      if (!itemId) {
        const createRes = await fetch('/api/content/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            format: selectedFormat,
            funnel_stage: funnelStage,
            storybrand_stage: storybrandStage,
            platforms: activePlatforms,
            scheduled_date: scheduleDate || format(new Date(), 'yyyy-MM-dd'),
            scheduled_time: scheduleTime || null,
            ai_generated: false,
            status: 'scripted',
            ...updateBody,
          }),
        });

        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);

        const newId = createData.item?.id || null;
        setManualItemId(newId);
        return newId;
      }

      const res = await fetch(`/api/content/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });

      if (res.ok) {
        return itemId;
      }
      throw new Error('Save failed');
    } catch (error) {
      console.error('Save failed:', error);
      return null;
    }
  };

  // Save edits (works for both single/AI and manual modes)
  const handleSave = async (pushToSchedule: boolean) => {
    const itemId = generated?.id;
    setIsSaving(true);

    const activePlatforms = getEnabledPlatforms(platformPlacements) as string[];

    try {
      const updateBody: Record<string, unknown> = {
        topic: editFields.topic || null,
        caption: editFields.caption || null,
        hashtags: editFields.hashtags ? editFields.hashtags.split(',').map(h => h.trim()).filter(Boolean) : null,
        media_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : null,
        platform_specs: Object.keys(platformSpecs).length > 0 ? platformSpecs : null,
        ...buildScriptFields(),
      };

      // If no item exists yet (manual mode, first save), create one
      if (!itemId) {
        const createRes = await fetch('/api/content/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            format: selectedFormat,
            funnel_stage: funnelStage,
            storybrand_stage: storybrandStage,
            platforms: activePlatforms,
            scheduled_date: scheduleDate || format(new Date(), 'yyyy-MM-dd'),
            scheduled_time: scheduleTime || null,
            ai_generated: false,
            status: pushToSchedule && scheduleDate ? 'scheduled' : 'scripted',
            ...updateBody,
          }),
        });

        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);

        const newId = createData.item?.id || null;
        setManualItemId(newId);
        setActionModalConfig({
          variant: 'success',
          title: pushToSchedule ? 'Post Scheduled!' : 'Post Saved as Draft',
          subtitle: pushToSchedule && scheduleDate ? `Scheduled for ${format(new Date(scheduleDate + 'T00:00:00'), 'MMM d, yyyy')}` : undefined,
          savedItemId: newId || undefined,
        });
        setShowActionModal(true);
        setIsSaving(false);
        return;
      }

      if (pushToSchedule && scheduleDate) {
        updateBody.scheduled_date = scheduleDate;
        updateBody.scheduled_time = scheduleTime || null;
        updateBody.status = 'scheduled';

        if (organizationId) {
          const { data: calendars } = await supabase
            .from('content_calendars')
            .select('id, start_date, end_date')
            .eq('organization_id', organizationId)
            .lte('start_date', scheduleDate)
            .gte('end_date', scheduleDate)
            .limit(1);

          if (calendars && calendars.length > 0) {
            updateBody.calendar_id = calendars[0].id;
          } else {
            const { data: recentCal } = await supabase
              .from('content_calendars')
              .select('id')
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (recentCal) {
              updateBody.calendar_id = recentCal.id;
            }
          }
        }
      }

      const res = await fetch(`/api/content/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });

      if (res.ok) {
        const savedData = await res.json();
        setActionModalConfig({
          variant: 'success',
          title: pushToSchedule ? 'Post Scheduled!' : 'Post Saved',
          subtitle: pushToSchedule && scheduleDate ? `Scheduled for ${format(new Date(scheduleDate + 'T00:00:00'), 'MMM d, yyyy')}` : undefined,
          savedItemId: itemId || savedData?.item?.id,
        });
        setShowActionModal(true);
      }
    } catch (error) {
      console.error('Save failed:', error);
      setActionModalConfig({ variant: 'error', title: 'Save Failed', subtitle: 'Please try again' });
      setShowActionModal(true);
    }

    setIsSaving(false);
  };

  // Manual mode: enhance with AI (legacy, kept for backward compat)
  const handleEnhanceWithAI = async (modelOverride?: string) => {
    if (!organizationId || platforms.length === 0) return;
    setIsGenerating(true);
    setGenerateError(null);

    try {
      // If we don't have an item yet, create one first
      let itemId = manualItemId;
      if (!itemId) {
        const createRes = await fetch('/api/content/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            format: selectedFormat,
            funnel_stage: funnelStage,
            storybrand_stage: storybrandStage,
            platforms,
            scheduled_date: format(new Date(), 'yyyy-MM-dd'),
            ai_generated: false,
            topic: editFields.topic || null,
            hook: editFields.hook || null,
            script_body: editFields.script_body || null,
          }),
        });
        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);
        itemId = createData.item?.id;
        if (itemId) setManualItemId(itemId);
      }

      if (!itemId) throw new Error('No item ID');

      // Generate content for this item
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, contentItemIds: [itemId], modelOverride }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Enhancement failed');

      // Fetch updated item
      const { data: item } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (item) {
        const fields: Record<string, string> = {};
        if (item.topic) fields.topic = item.topic;
        if (item.hook) fields.hook = item.hook;
        if (item.script_body) fields.script_body = item.script_body;
        if (item.cta) fields.cta = item.cta;
        if (item.caption) fields.caption = item.caption;
        if (item.hashtags) fields.hashtags = (item.hashtags as string[]).join(', ');
        if (item.filming_notes) fields.filming_notes = item.filming_notes;
        if (item.context_section) fields.context_section = item.context_section;
        if (item.teaching_points) fields.teaching_points = item.teaching_points;
        if (item.reframe) fields.reframe = item.reframe;
        if (item.problem_expansion) fields.problem_expansion = item.problem_expansion;
        if (item.framework_teaching) fields.framework_teaching = item.framework_teaching;
        if (item.case_study) fields.case_study = item.case_study;
        setEditFields(fields);
      }
    } catch (error) {
      console.error('Enhance with AI failed:', error);
      setGenerateError(error instanceof Error ? error.message : 'Enhancement failed. Please try again.');
    }

    setIsGenerating(false);
  };

  // Editable field helper
  const updateField = (key: string, value: string) => {
    setEditFields(prev => ({ ...prev, [key]: value }));
  };

  // Icon picker handler
  const handleIconSelect = (icon: string) => {
    // Insert icon at end of caption
    const currentCaption = editFields.caption || '';
    updateField('caption', currentCaption + icon);
  };

  // Drive import handler
  const handleDriveImport = (files: Array<{ url: string; fileName: string; fileType: string; fileSize: number }>) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleCreateWithCanva = async () => {
    const platform = platforms[0] || 'instagram';
    const sizeMap: Record<string, { width: number; height: number }> = {
      instagram: { width: 1080, height: 1080 },
      facebook: { width: 1200, height: 630 },
      linkedin: { width: 1200, height: 627 },
      twitter: { width: 1200, height: 675 },
      tiktok: { width: 1080, height: 1920 },
      youtube: { width: 1280, height: 720 },
    };
    const size = sizeMap[platform] || { width: 1080, height: 1080 };
    const title = 'SkaleFlow Design';

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

    setUploadedFiles(prev => [...prev, {
      url: data.url,
      fileName: data.fileName,
      fileType: 'image/png',
      fileSize: 0,
    }]);
  };

  const bulkEffectiveModelId = bulkModelId || orgDefaultModel || null;
  const bulkSelectedModel = bulkEffectiveModelId ? models.find(m => m.id === bulkEffectiveModelId) : null;

  // Bulk mode handlers
  const handleBulkPlan = async () => {
    if (!organizationId || !bulkEndDate || !bulkCampaignName.trim()) return;
    setIsBulkPlanning(true);

    try {
      const response = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          campaignName: bulkCampaignName.trim(),
          startDate: bulkStartDate,
          endDate: bulkEndDate,
          frequency: bulkFrequency,
          defaultPlatforms: bulkPlatforms,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const calId = data.calendar?.id;
      setBulkCalendarId(calId || null);

      const { data: items } = await supabase
        .from('content_items')
        .select('*')
        .eq('calendar_id', calId)
        .order('scheduled_date');

      if (items) {
        const planned: BulkPlanItem[] = items.map(item => ({
          id: item.id,
          scheduled_date: item.scheduled_date,
          time_slot: item.time_slot,
          format: item.format as ContentFormat,
          funnel_stage: item.funnel_stage as FunnelStage,
          storybrand_stage: item.storybrand_stage as StoryBrandStage,
          platforms: item.platforms || [],
          topic: item.topic,
          hook: item.hook,
          status: item.status as ContentStatus,
          selected: true,
        }));
        setBulkItems(planned);

        // Auto-trigger queue-based generation if a model is selected
        if (bulkEffectiveModelId && calId && items.length > 0) {
          const ideaIds = items.filter(i => i.status === 'idea').map(i => i.id);
          if (ideaIds.length > 0) {
            try {
              const queueRes = await fetch('/api/content/generate/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  organizationId,
                  calendarId: calId,
                  contentItemIds: ideaIds,
                  modelOverride: bulkEffectiveModelId,
                  creativeDirection: creativeDirection || null,
                }),
              });
              const queueData = await queueRes.json();
              if (queueRes.ok && queueData.batchId) {
                setBulkBatchId(queueData.batchId);
              }
            } catch (err) {
              console.error('Failed to enqueue generation:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Bulk planning failed:', error);
    }

    setIsBulkPlanning(false);
  };

  const handleBulkBatchComplete = useCallback(async () => {
    setBulkBatchId(null);
    if (bulkCalendarId) {
      const { data: items } = await supabase
        .from('content_items')
        .select('*')
        .eq('calendar_id', bulkCalendarId)
        .order('scheduled_date');

      if (items) {
        setBulkItems(items.map(item => ({
          id: item.id,
          scheduled_date: item.scheduled_date,
          time_slot: item.time_slot,
          format: item.format as ContentFormat,
          funnel_stage: item.funnel_stage as FunnelStage,
          storybrand_stage: item.storybrand_stage as StoryBrandStage,
          platforms: item.platforms || [],
          topic: item.topic,
          hook: item.hook,
          status: item.status as ContentStatus,
          selected: true,
        })));
      }
    }
  }, [bulkCalendarId, supabase]);

  const handleBulkBatchCancel = useCallback(() => {
    setBulkBatchId(null);
  }, []);

  // Post action popup handlers
  const handlePopupSaveDraft = async (): Promise<string | null> => {
    await handleSave(false);
    return generated?.id || manualItemId || null;
  };

  const handlePopupSchedule = async (date: string, time: string): Promise<string | null> => {
    const itemId = generated?.id || manualItemId;
    setIsSaving(true);
    try {
      const activePlatforms = getEnabledPlatforms(platformPlacements) as string[];

      const updateBody: Record<string, unknown> = {
        topic: editFields.topic || null,
        caption: editFields.caption || null,
        hashtags: editFields.hashtags ? editFields.hashtags.split(',').map(h => h.trim()).filter(Boolean) : null,
        media_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : null,
        platform_specs: Object.keys(platformSpecs).length > 0 ? platformSpecs : null,
        ...buildScriptFields(),
        scheduled_date: date,
        scheduled_time: time,
        status: 'scheduled',
      };

      if (!itemId) {
        // Create new item with scheduled status
        const createRes = await fetch('/api/content/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            format: selectedFormat,
            funnel_stage: funnelStage,
            storybrand_stage: storybrandStage,
            platforms: activePlatforms,
            ai_generated: false,
            ...updateBody,
          }),
        });
        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);
        const newId = createData.item?.id || null;
        setManualItemId(newId);
        setScheduleDate(date);
        setScheduleTime(time);
        setActionModalConfig({
          variant: 'success',
          title: 'Post Scheduled!',
          subtitle: `Scheduled for ${format(new Date(date + 'T00:00:00'), 'MMM d, yyyy')} at ${time}`,
          savedItemId: newId || undefined,
        });
        setShowActionModal(true);
        return newId;
      }

      const res = await fetch(`/api/content/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });

      if (res.ok) {
        setScheduleDate(date);
        setScheduleTime(time);
        setActionModalConfig({
          variant: 'success',
          title: 'Post Scheduled!',
          subtitle: `Scheduled for ${format(new Date(date + 'T00:00:00'), 'MMM d, yyyy')} at ${time}`,
          savedItemId: itemId,
        });
        setShowActionModal(true);
        return itemId;
      }
      throw new Error('Schedule failed');
    } catch (err) {
      console.error('Schedule failed:', err);
      setActionModalConfig({ variant: 'error', title: 'Schedule Failed', subtitle: 'Please try again' });
      setShowActionModal(true);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePopupPublishNow = async (publishPlatforms: string[]): Promise<PublishResult[]> => {
    // Save silently first (no modal)
    const itemId = await handleSilentSave();
    if (!itemId) return [{ platform: 'all', success: false, error: 'Failed to save post before publishing' }];

    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItemId: itemId, platforms: publishPlatforms }),
      });
      const data = await res.json();
      if (!res.ok) return [{ platform: 'all', success: false, error: data.error || 'Publish failed' }];
      return data.results || [];
    } catch {
      return [{ platform: 'all', success: false, error: 'Publish failed. Please try again.' }];
    }
  };


  // Current content item ID (for media upload)
  const currentItemId = generated?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  if (!contentEngineEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <SparklesIcon className="w-16 h-16 text-stone/30 mb-4" />
        <h2 className="text-heading-lg text-charcoal mb-2">Content Engine Locked</h2>
        <p className="text-stone max-w-md">
          Complete all phases in the Brand Engine to unlock the Content Engine.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = '/brand'}>
          Continue Brand Engine
        </Button>
      </div>
    );
  }

  // Shared configuration panel (used by bulk mode for backward compat)
  const renderConfigPanel = () => (
    <Card>
      <h3 className="text-heading-sm text-charcoal mb-4">Post Configuration</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Format</label>
          <select
            value={selectedFormat}
            onChange={e => { setSelectedFormat(e.target.value as ContentFormat); setGenerated(null); }}
            className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Funnel Stage</label>
          <select
            value={funnelStage}
            onChange={e => { setFunnelStage(e.target.value as FunnelStage); setGenerated(null); }}
            className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            {FUNNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">StoryBrand Stage</label>
          <select
            value={storybrandStage}
            onChange={e => { setStorybrandStage(e.target.value as StoryBrandStage); setGenerated(null); }}
            className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            {STORYBRAND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map(p => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  platforms.includes(p) ? 'bg-teal text-white' : 'bg-stone/5 text-stone hover:bg-stone/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Framework preview */}
      <div className="mt-4 p-3 bg-cream-warm rounded-lg">
        <p className="text-xs font-medium text-stone mb-1">Auto-selected framework</p>
        <p className="text-sm font-medium text-charcoal">{frameworkInfo.scriptTemplateName}</p>
        {frameworkInfo.hookTemplateName && (
          <p className="text-xs text-stone mt-0.5">Hook: {frameworkInfo.hookTemplateName}</p>
        )}
        {frameworkInfo.ctaTemplateName && (
          <p className="text-xs text-stone">CTA: {frameworkInfo.ctaTemplateName}</p>
        )}
      </div>

      {/* Creative specs */}
      <div className="mt-4">
        <CreativeAssetSpecs format={selectedFormat} />
      </div>

      {/* Error display */}
      {generateError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{generateError}</p>
        </div>
      )}
    </Card>
  );

  // Single/Manual mode: new 2-column caption-first layout
  const renderSingleManualLayout = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Post content (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {editingInstance ? (
            <InstanceEditForm
              placementType={editingInstance}
              masterCaption={editFields.caption || ''}
              masterHashtags={(editFields.hashtags || '').split(',').map(t => t.trim()).filter(Boolean)}
              instanceSpec={platformSpecs[editingInstance] || {}}
              organizationId={organizationId}
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
              <Card>
                {/* Caption - PRIMARY FIELD */}
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
                  <VariableTextarea
                    value={editFields.caption || ''}
                    onValueChange={(v) => updateField('caption', v)}
                    rows={8}
                    placeholder="Write your post caption... (~ for brand variables)"
                    className="text-sm"
                    brandFlatVariables={brandFlatVariables}
                    brandCategories={brandCategories}
                  />

                  {/* Icon Picker */}
                  <div className="mt-2">
                    <IconPicker onIconSelect={handleIconSelect} />
                  </div>
                </div>

                {/* Hashtags */}
                <div className="mb-4">
                  <VariableInput
                    label="Hashtags"
                    value={editFields.hashtags || ''}
                    onValueChange={(v) => updateField('hashtags', v)}
                    placeholder="hashtag1, hashtag2 (~ for brand variables)"
                    brandFlatVariables={brandFlatVariables}
                    brandCategories={brandCategories}
                  />
                </div>

                {/* Topic (small) */}
                <div className="mb-4">
                  <VariableInput
                    label="Topic"
                    value={editFields.topic || ''}
                    onValueChange={(v) => updateField('topic', v)}
                    placeholder="Brief topic summary (~ for brand variables)"
                    brandFlatVariables={brandFlatVariables}
                    brandCategories={brandCategories}
                  />
                </div>
              </Card>

              {/* Creative Direction */}
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <LightBulbIcon className="w-4 h-4 text-gold" />
                  <label className="text-sm font-medium text-charcoal-700">Creative Direction</label>
                  <span className="text-xs text-stone">(optional)</span>
                </div>
                <textarea
                  value={creativeDirection}
                  onChange={e => setCreativeDirection(e.target.value)}
                  rows={2}
                  placeholder="e.g. &quot;Focus on our new group coaching launch&quot; or &quot;Address objections from price-sensitive leads&quot;"
                  className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold placeholder:text-stone/40 resize-none"
                  maxLength={500}
                />
                {creativeDirection && (
                  <p className="text-xs text-stone mt-1 text-right">{creativeDirection.length}/500</p>
                )}
              </Card>

              {/* Creative Assets */}
              <Card>
                <h3 className="text-heading-sm text-charcoal mb-3">Media</h3>
                {organizationId && (
                  <MediaUpload
                    organizationId={organizationId}
                    contentItemId={currentItemId || undefined}
                    uploadedFiles={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    onImportFromDrive={hasDriveConnection ? () => setShowDrivePicker(true) : undefined}
                    onCreateWithCanva={hasCanvaConnection ? handleCreateWithCanva : undefined}
                    onImportFromCanva={hasCanvaConnection ? () => setShowCanvaPicker(true) : undefined}
                  />
                )}
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

              {/* Schedule + Actions */}
              <Card>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-charcoal-700 mb-1 block">Schedule Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-charcoal-700 mb-1 block">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                    />
                  </div>
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

              {generateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{generateError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right column: Preview Panel (2/5) */}
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <PageHeader
        icon={PencilSquareIcon}
        title="Create Content"
        breadcrumbs={[
          { label: 'Content' },
          { label: 'Create' },
        ]}
        subtitle="Generate a single post with AI"
        action={
          <Button onClick={() => setShowBrandPanel(true)} variant="ghost" size="sm">
            <BeakerIcon className="w-4 h-4 mr-2" />
            Brand DNA
          </Button>
        }
      />

      {/* Single AI Post Layout */}
      {renderSingleManualLayout()}


      {/* Brand variables panel */}
      {organizationId && (
        <BrandVariablesPanel
          organizationId={organizationId}
          isOpen={showBrandPanel}
          onClose={() => setShowBrandPanel(false)}
        />
      )}

      {/* Drive file picker modal */}
      {showDrivePicker && organizationId && (
        <DriveFilePicker
          organizationId={organizationId}
          contentItemId={currentItemId || undefined}
          onImport={handleDriveImport}
          onClose={() => setShowDrivePicker(false)}
        />
      )}

      {showCanvaPicker && (
        <CanvaDesignPicker
          onImport={handleImportFromCanva}
          onClose={() => setShowCanvaPicker(false)}
        />
      )}

      {/* AI Model Selection Modal (kept for backward compat, used by bulk/engine) */}
      {showModelModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h2 className="text-heading-lg text-charcoal">
                    {pendingAction === 'enhance' ? 'Enhance with AI' : pendingAction === 'regenerate' ? 'Regenerate Content' : 'Generate Content'}
                  </h2>
                  <p className="text-sm text-stone">Select an AI model to use</p>
                </div>
              </div>
              <button onClick={() => { setShowModelModal(false); setPendingAction(null); }} className="p-1 rounded-lg hover:bg-stone/10">
                <XMarkIcon className="w-5 h-5 text-stone" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Model cards */}
              <AIModelPicker
                models={models}
                selectedModelId={effectiveModelId}
                onSelect={setSelectedModelId}
              />

              {/* Cost estimate */}
              {selectedModel && !selectedModel.isFree && (
                <div className="bg-cream-warm rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone">Estimated cost</span>
                    <div className="text-right">
                      <span className="font-semibold text-charcoal">~{selectedModel.estimatedCreditsPerMessage} credits</span>
                      <span className="text-xs text-stone ml-1">({creditsToRand(selectedModel.estimatedCreditsPerMessage)})</span>
                    </div>
                  </div>
                  {!balanceLoading && balance && (
                    <div className="flex items-center justify-between text-xs border-t border-stone/10 pt-2">
                      <span className="text-stone">Your balance</span>
                      <span className={cn(
                        'font-medium',
                        balance.totalRemaining >= selectedModel.estimatedCreditsPerMessage ? 'text-teal' : 'text-red-500'
                      )}>
                        {balance.totalRemaining.toLocaleString()} credits ({creditsToRand(balance.totalRemaining)})
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selectedModel?.isFree && (
                <div className="bg-teal/5 rounded-xl p-3 flex items-center gap-2">
                  <BoltIcon className="w-4 h-4 text-teal shrink-0" />
                  <p className="text-sm text-teal font-medium">This model is free -- no credits required</p>
                </div>
              )}

              {!selectedModel && !selectedModelId && !orgDefaultModel && (
                <p className="text-sm text-stone text-center py-2">Select a model above to continue</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => { setShowModelModal(false); setPendingAction(null); }} variant="ghost" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleModelConfirm}
                className="flex-1"
                disabled={!effectiveModelId || (!selectedModel?.isFree && !!balance && balance.totalRemaining < (selectedModel?.estimatedCreditsPerMessage || 0))}
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                {selectedModel
                  ? `${pendingAction === 'enhance' ? 'Enhance' : 'Generate'} with ${selectedModel.name}`
                  : 'Select a model'
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UTM Builder Modal */}
      <UTMBuilderModal
        open={showUtmModal}
        onClose={() => setShowUtmModal(false)}
        baseUrl={targetUrl}
        initialParams={utmParams}
        onApply={setUtmParams}
        autoGenerateContext={{
          platform: getEnabledPlatforms(platformPlacements)[0] || 'linkedin',
          funnelStage,
          format: selectedFormat,
          topic: editFields.topic || null,
          scheduledDate: scheduleDate || format(new Date(), 'yyyy-MM-dd'),
        }}
      />

      {/* Post Action Popup */}
      <PostActionPopup
        open={showPostActionPopup}
        onClose={() => setShowPostActionPopup(false)}
        platforms={getEnabledPlatforms(platformPlacements) as string[]}
        onSaveDraft={handlePopupSaveDraft}
        onSchedule={handlePopupSchedule}
        onPublishNow={handlePopupPublishNow}
        isLoading={isSaving}
        defaultScheduleDate={scheduleDate}
        defaultScheduleTime={scheduleTime}
      />

      {/* Action Modal -- shown after save/schedule */}
      <ActionModal
        open={showActionModal}
        onClose={() => setShowActionModal(false)}
        variant={actionModalConfig.variant}
        title={actionModalConfig.title}
        subtitle={actionModalConfig.subtitle}
        actions={actionModalConfig.variant === 'error' ? [
          { label: 'Try Again', onClick: () => setShowActionModal(false), variant: 'primary' },
        ] : [
          { label: 'View in Calendar', onClick: () => router.push('/calendar'), variant: 'primary' },
          ...(actionModalConfig.savedItemId ? [{ label: 'Edit Post', onClick: () => router.push(`/content/${actionModalConfig.savedItemId}`), variant: 'ghost' as const }] : []),
          { label: 'Create Another', onClick: () => { setShowActionModal(false); setGenerated(null); setEditFields({}); setUploadedFiles([]); }, variant: 'ghost' as const },
        ]}
      />

      {/* Script Modal */}
      <ScriptModal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        scriptData={scriptData}
        onSave={setScriptData}
        formatCategory={formatCategory}
        organizationId={organizationId || ''}
        caption={editFields.caption}
        hashtags={editFields.hashtags ? editFields.hashtags.split(',').map(h => h.trim()).filter(Boolean) : []}
        funnelStage={funnelStage}
        storybrandStage={storybrandStage}
        format={selectedFormat}
      />

      {/* Config Modal Ã¢â‚¬" single mode only */}
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

    </div>
  );
}
