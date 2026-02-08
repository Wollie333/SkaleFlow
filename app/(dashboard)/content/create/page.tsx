'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Badge, Textarea, PageHeader } from '@/components/ui';
import { BrandVariablesPanel, ScriptTemplateBadge, CreativeAssetSpecs, PlatformOverrideTabs, MediaUpload, GenerationBatchTracker, type UploadedFile } from '@/components/content';
import { DriveFilePicker } from '@/components/content/drive-file-picker';
import {
  SparklesIcon,
  BeakerIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckIcon,
  PencilSquareIcon,
  BoltIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import {
  FORMAT_LABELS,
  getFormatCategory,
  getScriptFramework,
  type ContentFormat,
  type FormatCategory,
} from '@/config/script-frameworks';
import { type ClientModelOption } from '@/lib/ai/client-models';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useModelPreference } from '@/hooks/useModelPreference';
import { cn } from '@/lib/utils';
import {
  BRAND_VARIABLE_CATEGORIES,
  AI_GENERATION_VARIABLES,
  VARIABLE_DISPLAY_NAMES,
} from '@/lib/content-engine/brand-variable-categories';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { FunnelStage, StoryBrandStage, ContentStatus, Json } from '@/types/database';

type CreateMode = 'single' | 'manual' | 'bulk' | 'engine';

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

const PLATFORM_OPTIONS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'];

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

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [contentEngineEnabled, setContentEngineEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mode
  const [mode, setMode] = useState<CreateMode>('single');

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

  // Engine tab state
  const [engineFunnelStage, setEngineFunnelStage] = useState<FunnelStage>('awareness');
  const [engineStorybrandStage, setEngineStorybrandStage] = useState<StoryBrandStage>('character');
  const [engineFormat, setEngineFormat] = useState<ContentFormat>('short_video_30_60');
  const [enginePlatforms, setEnginePlatforms] = useState<string[]>(['linkedin']);
  const [engineAngleId, setEngineAngleId] = useState<string | null>(null);
  const [engineVariationCount, setEngineVariationCount] = useState(3);
  const [engineScheduleMode, setEngineScheduleMode] = useState<'undated' | 'dated'>('undated');
  const [engineStartDate, setEngineStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [engineEndDate, setEngineEndDate] = useState('');
  const [selectedBrandVars, setSelectedBrandVars] = useState<Set<string>>(
    new Set(AI_GENERATION_VARIABLES)
  );
  const [engineModelId, setEngineModelId] = useState<string | null>(null);
  const [engineBatchId, setEngineBatchId] = useState<string | null>(null);
  const [engineGeneratedItems, setEngineGeneratedItems] = useState<Array<{
    id: string; topic: string | null; funnel_stage: string; storybrand_stage: string; format: string; scheduled_date: string;
  }>>([]);
  const [engineIsGenerating, setEngineIsGenerating] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [contentAngles, setContentAngles] = useState<Array<{
    id: string; name: string; emotional_target: string | null;
  }>>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(BRAND_VARIABLE_CATEGORIES.map(c => c.key))
  );

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

        // Check if user is super_admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (userData?.role === 'super_admin') {
          setIsSuperAdmin(true);
        }

        // Check for Google Drive connection
        const { data: driveConn } = await supabase
          .from('google_drive_connections')
          .select('id')
          .eq('organization_id', membership.organization_id)
          .eq('is_active', true)
          .maybeSingle();
        setHasDriveConnection(!!driveConn);

        // Load content angles for engine tab
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

  const effectiveModelId = selectedModelId || orgDefaultModel || null;
  const selectedModel = effectiveModelId ? models.find(m => m.id === effectiveModelId) : null;

  /** 1 credit = 1 ZAR cent → 100 credits = R1.00 */
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

  // Get fields to display based on format category
  const getFieldsForFormat = (cat: FormatCategory): { key: string; label: string; rows?: number }[] => {
    const common = [
      { key: 'caption', label: 'Caption', rows: 3 },
      { key: 'hashtags', label: 'Hashtags (comma-separated)', rows: 1 },
    ];

    switch (cat) {
      case 'short':
        return [
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'hook', label: 'Hook (0-3s)', rows: 2 },
          { key: 'script_body', label: 'Script Body', rows: 6 },
          { key: 'cta', label: 'CTA (last 2-3s)', rows: 2 },
          { key: 'filming_notes', label: 'Filming Notes', rows: 3 },
          ...common,
        ];
      case 'medium':
        return [
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'hook', label: 'Hook (0-10s)', rows: 2 },
          { key: 'context_section', label: 'Context (10-30s)', rows: 4 },
          { key: 'teaching_points', label: 'Teaching Points', rows: 6 },
          { key: 'reframe', label: 'Reframe', rows: 3 },
          { key: 'cta', label: 'CTA', rows: 2 },
          { key: 'filming_notes', label: 'Filming Notes', rows: 3 },
          ...common,
        ];
      case 'long':
        return [
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
        ];
      case 'carousel':
        return [
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'script_body', label: 'Slides (JSON)', rows: 10 },
          ...common,
        ];
      case 'static':
        return [
          { key: 'topic', label: 'Topic', rows: 1 },
          { key: 'script_body', label: 'Content (headline, body, visual direction)', rows: 8 },
          ...common,
        ];
    }
  };

  // Single mode: generate content
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

  // Single mode: regenerate
  const handleRegenerate = async (modelOverride?: string) => {
    if (!generated?.id || !organizationId) return;
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, contentItemIds: [generated.id], modelOverride }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const { data: item } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', generated.id)
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
      console.error('Regeneration failed:', error);
      setGenerateError(error instanceof Error ? error.message : 'Regeneration failed. Please try again.');
    }

    setIsGenerating(false);
  };

  // Save edits (works for both single/AI and manual modes)
  const handleSave = async (pushToSchedule: boolean) => {
    const itemId = mode === 'manual' ? manualItemId : generated?.id;
    setIsSaving(true);

    try {
      const updateBody: Record<string, unknown> = {
        topic: editFields.topic || null,
        hook: editFields.hook || null,
        script_body: editFields.script_body || null,
        cta: editFields.cta || null,
        caption: editFields.caption || null,
        hashtags: editFields.hashtags ? editFields.hashtags.split(',').map(h => h.trim()).filter(Boolean) : null,
        filming_notes: editFields.filming_notes || null,
        context_section: editFields.context_section || null,
        teaching_points: editFields.teaching_points || null,
        reframe: editFields.reframe || null,
        problem_expansion: editFields.problem_expansion || null,
        framework_teaching: editFields.framework_teaching || null,
        case_study: editFields.case_study || null,
        media_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : null,
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
            platforms,
            scheduled_date: scheduleDate || format(new Date(), 'yyyy-MM-dd'),
            scheduled_time: scheduleTime || null,
            ai_generated: false,
            status: pushToSchedule && scheduleDate ? 'scheduled' : 'scripted',
            ...updateBody,
          }),
        });

        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);

        setManualItemId(createData.item?.id || null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
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
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }

    setIsSaving(false);
  };

  // Manual mode: enhance with AI
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

  // Drive import handler
  const handleDriveImport = (files: Array<{ url: string; fileName: string; fileType: string; fileSize: number }>) => {
    setUploadedFiles(prev => [...prev, ...files]);
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

  // Engine tab helpers
  const engineEffectiveModelId = engineModelId || orgDefaultModel || null;
  const engineSelectedModel = engineEffectiveModelId ? models.find(m => m.id === engineEffectiveModelId) : null;

  const toggleBrandVar = (key: string) => {
    setSelectedBrandVars(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategoryVars = (categoryKey: string, selectAll: boolean) => {
    const category = BRAND_VARIABLE_CATEGORIES.find(c => c.key === categoryKey);
    if (!category) return;
    setSelectedBrandVars(prev => {
      const next = new Set(prev);
      for (const k of category.outputKeys) {
        if (selectAll) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  };

  const toggleExpandCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleEnginePlatform = (p: string) => {
    setEnginePlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleEngineGenerate = async () => {
    if (!organizationId || enginePlatforms.length === 0 || !engineEffectiveModelId) return;
    setEngineIsGenerating(true);
    setEngineError(null);
    setEngineGeneratedItems([]);
    setEngineBatchId(null);

    try {
      // Distribute dates if in "dated" mode
      const dates: string[] = [];
      if (engineScheduleMode === 'dated' && engineStartDate && engineEndDate) {
        const start = new Date(engineStartDate);
        const end = new Date(engineEndDate);
        const totalMs = end.getTime() - start.getTime();
        for (let i = 0; i < engineVariationCount; i++) {
          const offset = engineVariationCount > 1
            ? (totalMs * i) / (engineVariationCount - 1)
            : 0;
          const d = new Date(start.getTime() + offset);
          dates.push(format(d, 'yyyy-MM-dd'));
        }
      } else {
        for (let i = 0; i < engineVariationCount; i++) {
          dates.push(format(new Date(), 'yyyy-MM-dd'));
        }
      }

      // Create content items
      const createdIds: string[] = [];
      for (let i = 0; i < engineVariationCount; i++) {
        const createRes = await fetch('/api/content/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            format: engineFormat,
            funnel_stage: engineFunnelStage,
            storybrand_stage: engineStorybrandStage,
            platforms: enginePlatforms,
            scheduled_date: dates[i],
            ai_generated: true,
            status: 'idea',
            ...(engineAngleId ? { angle_id: engineAngleId } : {}),
          }),
        });
        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);
        if (createData.item?.id) createdIds.push(createData.item.id);
      }

      if (createdIds.length === 0) throw new Error('No content items were created');

      // Enqueue with selected brand variables
      const queueRes = await fetch('/api/content/generate/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          contentItemIds: createdIds,
          modelOverride: engineEffectiveModelId,
          selectedBrandVariables: Array.from(selectedBrandVars),
        }),
      });

      const queueData = await queueRes.json();
      if (!queueRes.ok) throw new Error(queueData.error || 'Failed to enqueue generation');
      if (queueData.batchId) {
        setEngineBatchId(queueData.batchId);
      }
    } catch (error) {
      console.error('Engine generation failed:', error);
      setEngineError(error instanceof Error ? error.message : 'Generation failed');
    }

    setEngineIsGenerating(false);
  };

  const handleEngineBatchComplete = useCallback(async () => {
    const batchId = engineBatchId;
    setEngineBatchId(null);
    if (!batchId || !organizationId) return;

    // Fetch the generated items from the batch
    const { data: queueItems } = await supabase
      .from('generation_queue')
      .select('content_item_id')
      .eq('batch_id', batchId)
      .eq('status', 'completed');

    if (queueItems && queueItems.length > 0) {
      const ids = queueItems.map(q => q.content_item_id);
      const { data: items } = await supabase
        .from('content_items')
        .select('id, topic, funnel_stage, storybrand_stage, format, scheduled_date')
        .in('id', ids);

      if (items) {
        setEngineGeneratedItems(items);
      }
    }
  }, [engineBatchId, organizationId, supabase]);

  const handleEngineBatchCancel = useCallback(() => {
    setEngineBatchId(null);
  }, []);

  const handleBulkPush = async () => {
    const selectedIds = bulkItems.filter(i => i.selected && i.id).map(i => i.id!);
    if (selectedIds.length === 0) return;
    setIsBulkPushing(true);

    try {
      await fetch('/api/content/items/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: selectedIds,
          action: 'change_status',
          value: 'scheduled',
        }),
      });

      setBulkItems(prev => prev.map(i =>
        i.selected ? { ...i, status: 'scheduled' as ContentStatus } : i
      ));
    } catch (error) {
      console.error('Bulk push failed:', error);
    }

    setIsBulkPushing(false);
  };

  const toggleBulkSelect = (index: number) => {
    setBulkItems(prev => prev.map((item, i) =>
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const selectAllBulk = () => {
    const allSelected = bulkItems.every(i => i.selected);
    setBulkItems(prev => prev.map(i => ({ ...i, selected: !allSelected })));
  };

  // Reset when switching modes
  const handleModeChange = (newMode: CreateMode) => {
    setMode(newMode);
    if (newMode === 'manual') {
      setGenerated(null);
      setManualItemId(null);
      setEditFields({});
      setUploadedFiles([]);
      setSaveSuccess(false);
    } else if (newMode === 'single') {
      setManualItemId(null);
      setGenerated(null);
      setEditFields({});
      setUploadedFiles([]);
      setSaveSuccess(false);
    } else if (newMode === 'engine') {
      setEngineBatchId(null);
      setEngineGeneratedItems([]);
      setEngineError(null);
    }
  };

  // Current content item ID (for media upload)
  const currentItemId = mode === 'manual' ? manualItemId : generated?.id;

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

  // Shared configuration panel (used by both single and manual modes)
  const renderConfigPanel = () => (
    <Card>
      <h3 className="text-heading-sm text-charcoal mb-4">Post Configuration</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Format</label>
          <select
            value={selectedFormat}
            onChange={e => { setSelectedFormat(e.target.value as ContentFormat); if (mode === 'single') setGenerated(null); }}
            className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Funnel Stage</label>
          <select
            value={funnelStage}
            onChange={e => { setFunnelStage(e.target.value as FunnelStage); if (mode === 'single') setGenerated(null); }}
            className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            {FUNNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">StoryBrand Stage</label>
          <select
            value={storybrandStage}
            onChange={e => { setStorybrandStage(e.target.value as StoryBrandStage); if (mode === 'single') setGenerated(null); }}
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

      {/* Mode-specific buttons */}
      {mode === 'single' && (
        <Button
          onClick={() => openModelModal('generate')}
          isLoading={isGenerating}
          disabled={platforms.length === 0}
          className="w-full mt-4"
        >
          <SparklesIcon className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Content'}
        </Button>
      )}

      {mode === 'manual' && (
        <Button
          onClick={() => openModelModal('enhance')}
          isLoading={isGenerating}
          disabled={platforms.length === 0}
          variant="secondary"
          className="w-full mt-4"
        >
          <SparklesIcon className="w-4 h-4 mr-2" />
          {isGenerating ? 'Enhancing...' : 'Enhance with AI'}
        </Button>
      )}

      {/* Error display */}
      {generateError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{generateError}</p>
        </div>
      )}
    </Card>
  );

  // Shared content fields + upload + actions panel
  const renderContentPanel = () => (
    <>
      {/* Script Content fields */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading-sm text-charcoal">Script Content</h3>
          {mode === 'single' && generated && (
            <Button onClick={() => openModelModal('regenerate')} variant="ghost" size="sm" disabled={isGenerating}>
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Regenerate
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {getFieldsForFormat(formatCategory).map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-charcoal mb-1">{field.label}</label>
              <Textarea
                value={editFields[field.key] || ''}
                onChange={e => updateField(field.key, e.target.value)}
                rows={field.rows || 3}
                className="text-sm"
                placeholder={mode === 'manual' ? `Enter ${field.label.toLowerCase()}...` : undefined}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Template info bar (AI mode only, when generated) */}
      {mode === 'single' && generated && (
        <ScriptTemplateBadge
          scriptTemplate={generated.script_template}
          hookTemplate={generated.hook_template}
          ctaTemplate={generated.cta_template}
        />
      )}

      {/* Creative Asset Upload */}
      <Card>
        <h3 className="text-heading-sm text-charcoal mb-4">Creative Assets</h3>
        <p className="text-xs text-stone mb-3">
          Upload images, videos, or PDFs to attach to this post.
        </p>
        {organizationId && (
          <MediaUpload
            organizationId={organizationId}
            contentItemId={currentItemId || undefined}
            uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles}
            onImportFromDrive={hasDriveConnection ? () => setShowDrivePicker(true) : undefined}
          />
        )}
      </Card>

      {/* Platform previews */}
      {((mode === 'single' && generated?.platform_specs) || mode === 'manual') && platforms.length > 0 && (
        <Card>
          <h3 className="text-heading-sm text-charcoal mb-4">Platform Previews</h3>
          <PlatformOverrideTabs
            platforms={platforms}
            universalCaption={editFields.caption || ''}
            universalHashtags={editFields.hashtags ? editFields.hashtags.split(',').map(h => h.trim()).filter(Boolean) : []}
            platformSpecs={((mode === 'single' ? generated?.platform_specs : {}) || {}) as Record<string, { caption?: string; hashtags?: string[]; customized?: boolean }>}
            onUniversalChange={(caption, hashtags) => {
              updateField('caption', caption);
              updateField('hashtags', hashtags.join(', '));
            }}
            onPlatformChange={() => {}}
          />
        </Card>
      )}

      {/* Actions */}
      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone mb-1">Schedule Date (optional)</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-stone mb-1">Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
          </div>
          <div className="flex gap-2 sm:pt-4">
            <Button onClick={() => handleSave(false)} variant="ghost" disabled={isSaving}>
              Save as Draft
            </Button>
            {mode === 'manual' && (
              <Button
                onClick={() => {
                  // Save with status 'pending_review'
                  handleSave(false);
                }}
                variant="ghost"
                disabled={isSaving}
              >
                Submit for Review
              </Button>
            )}
            <Button onClick={() => handleSave(true)} disabled={isSaving || !scheduleDate}>
              <CalendarDaysIcon className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Push to Schedule'}
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-3 flex items-center gap-2 text-sm text-teal">
            <CheckIcon className="w-4 h-4" />
            Saved successfully!
          </div>
        )}
      </Card>
    </>
  );

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
        subtitle={mode === 'single' ? 'Generate a single post with AI' :
          mode === 'manual' ? 'Write a post manually' :
          mode === 'engine' ? 'Targeted content with brand variable control' :
          'Plan multiple posts with AI'}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mode toggle tabs */}
          <div className="flex gap-1 bg-cream-warm rounded-lg p-1">
            <button
              onClick={() => handleModeChange('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                mode === 'single' ? 'bg-white text-charcoal shadow-sm' : 'text-stone hover:text-charcoal'
              }`}
            >
              <SparklesIcon className="w-4 h-4" />
              Single Post
            </button>
            <button
              onClick={() => handleModeChange('manual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                mode === 'manual' ? 'bg-white text-charcoal shadow-sm' : 'text-stone hover:text-charcoal'
              }`}
            >
              <PencilSquareIcon className="w-4 h-4" />
              Manual Create
            </button>
            <button
              onClick={() => handleModeChange('bulk')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'bulk' ? 'bg-white text-charcoal shadow-sm' : 'text-stone hover:text-charcoal'
              }`}
            >
              Bulk AI Planner
            </button>
            <button
              onClick={() => handleModeChange('engine')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                mode === 'engine' ? 'bg-white text-charcoal shadow-sm' : 'text-stone hover:text-charcoal'
              }`}
            >
              <BoltIcon className="w-4 h-4" />
              Content Engine
            </button>
          </div>

          <Button onClick={() => setShowBrandPanel(true)} variant="ghost" size="sm">
            <BeakerIcon className="w-4 h-4 mr-2" />
            Brand DNA
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODE 1: SINGLE POST (AI) */}
      {/* ============================================================ */}
      {mode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Configuration */}
          <div className="lg:col-span-1 space-y-4">
            {renderConfigPanel()}
          </div>

          {/* Right: Generated content / Preview */}
          <div className="lg:col-span-2 space-y-4">
            {!generated && !isGenerating && (
              <Card className="text-center py-16">
                <SparklesIcon className="w-16 h-16 mx-auto text-stone/20 mb-4" />
                <h3 className="text-heading-md text-charcoal mb-2">Ready to Generate</h3>
                <p className="text-stone">Configure your post on the left, then click Generate Content.</p>
              </Card>
            )}

            {isGenerating && !generated && (
              <Card className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal mx-auto mb-4" />
                <h3 className="text-heading-md text-charcoal mb-2">Generating Content...</h3>
                <p className="text-stone">AI is crafting your content using the {frameworkInfo.scriptTemplateName} framework.</p>
              </Card>
            )}

            {generated && renderContentPanel()}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 2: MANUAL CREATE */}
      {/* ============================================================ */}
      {mode === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Configuration + AI Enhance */}
          <div className="lg:col-span-1 space-y-4">
            {renderConfigPanel()}
          </div>

          {/* Right: Editable fields (always visible) */}
          <div className="lg:col-span-2 space-y-4">
            {renderContentPanel()}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 3: BULK AI PLANNER */}
      {/* ============================================================ */}
      {mode === 'bulk' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-heading-sm text-charcoal mb-4">Campaign Configuration</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal mb-1">Campaign Name</label>
              <input
                type="text"
                value={bulkCampaignName}
                onChange={e => setBulkCampaignName(e.target.value)}
                placeholder="e.g. February Launch Campaign"
                className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Start Date</label>
                <input
                  type="date"
                  value={bulkStartDate}
                  onChange={e => setBulkStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">End Date</label>
                <input
                  type="date"
                  value={bulkEndDate}
                  onChange={e => setBulkEndDate(e.target.value)}
                  min={bulkStartDate}
                  className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Frequency</label>
                <select
                  value={bulkFrequency}
                  onChange={e => setBulkFrequency(e.target.value as 'aggressive' | 'moderate' | 'light')}
                  className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                >
                  <option value="aggressive">Aggressive (3-4/day)</option>
                  <option value="moderate">Moderate (1-2/day)</option>
                  <option value="light">Light (~1/day)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Funnel Focus</label>
                <select
                  value={bulkFunnelFocus}
                  onChange={e => setBulkFunnelFocus(e.target.value as FunnelStage | 'balanced')}
                  className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                >
                  <option value="balanced">Balanced</option>
                  <option value="awareness">Focus: Awareness</option>
                  <option value="consideration">Focus: Consideration</option>
                  <option value="conversion">Focus: Conversion</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-charcoal mb-1">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleBulkPlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      bulkPlatforms.includes(p) ? 'bg-teal text-white' : 'bg-stone/5 text-stone hover:bg-stone/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-charcoal mb-2">AI Model</label>
              <div className="space-y-2">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setBulkModelId(model.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border-2 transition-all',
                      bulkEffectiveModelId === model.id
                        ? 'border-teal bg-teal/5 shadow-sm'
                        : 'border-stone/15 hover:border-stone/30 bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        {model.isFree ? (
                          <BoltIcon className="w-4 h-4 text-teal shrink-0" />
                        ) : (
                          <SparklesIcon className="w-4 h-4 text-gold shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-charcoal">{model.name}</p>
                          <p className="text-xs text-stone capitalize">{model.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          model.isFree ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'
                        )}>
                          {model.isFree ? 'Free' : `~${model.estimatedCreditsPerMessage} cr/post`}
                        </span>
                        {bulkEffectiveModelId === model.id && (
                          <CheckCircleIcon className="w-5 h-5 text-teal shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleBulkPlan}
              isLoading={isBulkPlanning}
              disabled={!bulkCampaignName.trim() || !bulkEndDate || bulkPlatforms.length === 0 || !bulkEffectiveModelId}
              className="mt-4"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              {isBulkPlanning ? 'Creating Campaign...' : 'Create Campaign & Generate'}
            </Button>
          </Card>

          {/* Generation progress tracker */}
          {bulkBatchId && (
            <GenerationBatchTracker
              batchId={bulkBatchId}
              onComplete={handleBulkBatchComplete}
              onCancel={handleBulkBatchCancel}
            />
          )}

          {/* Bulk items grid */}
          {bulkItems.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-heading-sm text-charcoal">
                    Planned Posts ({bulkItems.length})
                  </h3>
                  <button onClick={selectAllBulk} className="text-xs text-teal hover:underline">
                    {bulkItems.every(i => i.selected) ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkPush}
                    isLoading={isBulkPushing}
                    disabled={bulkItems.filter(i => i.selected).length === 0}
                  >
                    <CalendarDaysIcon className="w-4 h-4 mr-1" />
                    Push {bulkItems.filter(i => i.selected).length} to Schedule
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {bulkItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                      item.selected
                        ? 'border-teal bg-teal/5'
                        : 'border-stone/10 hover:border-stone/20'
                    }`}
                    onClick={() => toggleBulkSelect(idx)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleBulkSelect(idx)}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-stone/30 text-teal focus:ring-teal"
                        />
                        <span className="text-xs text-stone">{format(new Date(item.scheduled_date), 'EEE, MMM d')}</span>
                        <span className="text-xs text-stone/50">{item.time_slot}</span>
                      </div>
                      <Badge className={FUNNEL_COLORS[item.funnel_stage]}>
                        {item.funnel_stage}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium text-charcoal mb-1">
                      {item.topic || FORMAT_LABELS[item.format] || item.format.replace(/_/g, ' ')}
                    </p>

                    {item.hook && (
                      <p className="text-xs text-stone line-clamp-2">{item.hook}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-stone/60">{FORMAT_LABELS[item.format]}</span>
                      <span className="text-xs text-stone/40">|</span>
                      <div className="flex gap-1">
                        {item.platforms.slice(0, 3).map(p => (
                          <span key={p} className="text-xs text-stone/60 capitalize">{p.slice(0, 2)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 4: CONTENT ENGINE */}
      {/* ============================================================ */}
      {mode === 'engine' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Configuration (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <h3 className="text-heading-sm text-charcoal mb-4">Content Configuration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Funnel Stage */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Funnel Stage</label>
                  <select
                    value={engineFunnelStage}
                    onChange={e => setEngineFunnelStage(e.target.value as FunnelStage)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    {FUNNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* StoryBrand Stage */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">StoryBrand Stage</label>
                  <select
                    value={engineStorybrandStage}
                    onChange={e => setEngineStorybrandStage(e.target.value as StoryBrandStage)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    {STORYBRAND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Format</label>
                  <select
                    value={engineFormat}
                    onChange={e => setEngineFormat(e.target.value as ContentFormat)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Content Angle */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Content Angle</label>
                  <select
                    value={engineAngleId || ''}
                    onChange={e => setEngineAngleId(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    <option value="">Auto-select</option>
                    {contentAngles.map(a => (
                      <option key={a.id} value={a.id}>{a.name}{a.emotional_target ? ` (${a.emotional_target})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Platforms */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-charcoal mb-1">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => toggleEnginePlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                        enginePlatforms.includes(p) ? 'bg-teal text-white' : 'bg-stone/5 text-stone hover:bg-stone/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variation Count */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-charcoal mb-1">Variations</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEngineVariationCount(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg border border-stone/20 text-sm font-medium text-charcoal hover:bg-stone/5 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold text-charcoal w-8 text-center">{engineVariationCount}</span>
                  <button
                    onClick={() => setEngineVariationCount(prev => Math.min(5, prev + 1))}
                    className="w-8 h-8 rounded-lg border border-stone/20 text-sm font-medium text-charcoal hover:bg-stone/5 flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="text-xs text-stone">posts (1-5)</span>
                </div>
              </div>

              {/* Scheduling */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-charcoal mb-2">Scheduling</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEngineScheduleMode('undated')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      engineScheduleMode === 'undated' ? 'bg-teal text-white' : 'bg-stone/5 text-stone hover:bg-stone/10'
                    )}
                  >
                    Create as Undated
                  </button>
                  <button
                    onClick={() => setEngineScheduleMode('dated')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      engineScheduleMode === 'dated' ? 'bg-teal text-white' : 'bg-stone/5 text-stone hover:bg-stone/10'
                    )}
                  >
                    Assign to Dates
                  </button>
                </div>
                {engineScheduleMode === 'dated' && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-stone mb-1">Start Date</label>
                      <input
                        type="date"
                        value={engineStartDate}
                        onChange={e => setEngineStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone mb-1">End Date</label>
                      <input
                        type="date"
                        value={engineEndDate}
                        onChange={e => setEngineEndDate(e.target.value)}
                        min={engineStartDate}
                        className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* AI Model Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-charcoal mb-2">AI Model</label>
                <div className="space-y-2">
                  {models.map(model => (
                    <button
                      key={model.id}
                      onClick={() => setEngineModelId(model.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border-2 transition-all',
                        engineEffectiveModelId === model.id
                          ? 'border-teal bg-teal/5 shadow-sm'
                          : 'border-stone/15 hover:border-stone/30 bg-white'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          {model.isFree ? (
                            <BoltIcon className="w-4 h-4 text-teal shrink-0" />
                          ) : (
                            <SparklesIcon className="w-4 h-4 text-gold shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-charcoal">{model.name}</p>
                            <p className="text-xs text-stone capitalize">{model.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            model.isFree ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'
                          )}>
                            {model.isFree ? 'Free' : `~${model.estimatedCreditsPerMessage * engineVariationCount} cr total`}
                          </span>
                          {engineEffectiveModelId === model.id && (
                            <CheckCircleIcon className="w-5 h-5 text-teal shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost estimate */}
              {engineSelectedModel && !engineSelectedModel.isFree && !balanceLoading && balance && (
                <div className="mt-3 bg-cream-warm rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone">Estimated total cost</span>
                    <span className="font-semibold text-charcoal">
                      ~{engineSelectedModel.estimatedCreditsPerMessage * engineVariationCount} credits
                      <span className="text-xs text-stone ml-1">({creditsToRand(engineSelectedModel.estimatedCreditsPerMessage * engineVariationCount)})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-stone/10 pt-1">
                    <span className="text-stone">Your balance</span>
                    <span className={cn(
                      'font-medium',
                      balance.totalRemaining >= engineSelectedModel.estimatedCreditsPerMessage * engineVariationCount ? 'text-teal' : 'text-red-500'
                    )}>
                      {balance.totalRemaining.toLocaleString()} credits
                    </span>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleEngineGenerate}
                isLoading={engineIsGenerating}
                disabled={
                  enginePlatforms.length === 0 ||
                  !engineEffectiveModelId ||
                  (engineScheduleMode === 'dated' && !engineEndDate)
                }
                className="w-full mt-4"
              >
                <BoltIcon className="w-4 h-4 mr-2" />
                {engineIsGenerating ? 'Creating...' : `Generate ${engineVariationCount} Variation${engineVariationCount !== 1 ? 's' : ''}`}
              </Button>

              {engineError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{engineError}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Brand Variables + Results (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Brand Variable Toggles */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-heading-sm text-charcoal">Brand Variables</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedBrandVars(new Set(AI_GENERATION_VARIABLES))}
                    className="text-xs text-teal hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedBrandVars(new Set())}
                    className="text-xs text-stone hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <p className="text-xs text-stone mb-3">
                Toggle which brand DNA feeds the AI prompt. Deselect variables to narrow the content focus.
              </p>

              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {BRAND_VARIABLE_CATEGORIES.map(category => {
                  const isExpanded = expandedCategories.has(category.key);
                  const selectedCount = category.outputKeys.filter(k => selectedBrandVars.has(k)).length;
                  const allSelected = selectedCount === category.outputKeys.length;

                  return (
                    <div key={category.key} className="border border-stone/10 rounded-lg">
                      <button
                        onClick={() => toggleExpandCategory(category.key)}
                        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-stone/5 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-charcoal">{category.label}</span>
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full',
                            selectedCount === 0 ? 'bg-stone/10 text-stone' : 'bg-teal/10 text-teal'
                          )}>
                            {selectedCount}/{category.outputKeys.length}
                          </span>
                        </div>
                        {isExpanded
                          ? <ChevronUpIcon className="w-4 h-4 text-stone" />
                          : <ChevronDownIcon className="w-4 h-4 text-stone" />
                        }
                      </button>

                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 space-y-1">
                          <button
                            onClick={() => toggleCategoryVars(category.key, !allSelected)}
                            className="text-xs text-teal hover:underline mb-1"
                          >
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </button>
                          {category.outputKeys.map(varKey => (
                            <label
                              key={varKey}
                              className="flex items-center gap-2 py-1 px-1 rounded hover:bg-stone/5 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedBrandVars.has(varKey)}
                                onChange={() => toggleBrandVar(varKey)}
                                className="rounded border-stone/30 text-teal focus:ring-teal w-3.5 h-3.5"
                              />
                              <span className="text-xs text-charcoal">{VARIABLE_DISPLAY_NAMES[varKey] || varKey}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-stone/10">
                <p className="text-xs text-stone">
                  {selectedBrandVars.size} of {AI_GENERATION_VARIABLES.length} variables selected
                </p>
              </div>
            </Card>

            {/* Results Panel */}
            {!engineBatchId && engineGeneratedItems.length === 0 && (
              <Card className="text-center py-12">
                <BoltIcon className="w-12 h-12 mx-auto text-stone/20 mb-3" />
                <h3 className="text-heading-md text-charcoal mb-2">Ready to Generate</h3>
                <p className="text-sm text-stone">Configure your content on the left, then click Generate.</p>
              </Card>
            )}

            {engineBatchId && (
              <GenerationBatchTracker
                batchId={engineBatchId}
                onComplete={handleEngineBatchComplete}
                onCancel={handleEngineBatchCancel}
              />
            )}

            {engineGeneratedItems.length > 0 && (
              <Card>
                <h3 className="text-heading-sm text-charcoal mb-3">
                  Generated Content ({engineGeneratedItems.length})
                </h3>
                <div className="space-y-2">
                  {engineGeneratedItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-stone/10 hover:border-teal/30 transition-colors"
                    >
                      <p className="text-sm font-medium text-charcoal mb-1">
                        {item.topic || 'Generated content'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={FUNNEL_COLORS[item.funnel_stage as FunnelStage]}>
                          {item.funnel_stage}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          {item.storybrand_stage.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-stone">{FORMAT_LABELS[item.format as ContentFormat] || item.format}</span>
                        <span className="text-xs text-stone/50">|</span>
                        <span className="text-xs text-stone">{format(new Date(item.scheduled_date), 'MMM d')}</span>
                      </div>
                      <a
                        href="/calendar"
                        className="text-xs text-teal hover:underline mt-1 inline-block"
                      >
                        View in Calendar
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

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

      {/* AI Model Selection Modal */}
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
              <div className="space-y-2">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border-2 transition-all',
                      effectiveModelId === model.id
                        ? 'border-teal bg-teal/5 shadow-sm'
                        : 'border-stone/15 hover:border-stone/30 bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        {model.isFree ? (
                          <BoltIcon className="w-4 h-4 text-teal shrink-0" />
                        ) : (
                          <SparklesIcon className="w-4 h-4 text-gold shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-charcoal">{model.name}</p>
                          <p className="text-xs text-stone capitalize">{model.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          model.isFree ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'
                        )}>
                          {model.isFree ? 'Free' : `~${model.estimatedCreditsPerMessage} cr`}
                        </span>
                        {effectiveModelId === model.id && (
                          <CheckCircleIcon className="w-5 h-5 text-teal shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

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
                  <p className="text-sm text-teal font-medium">This model is free — no credits required</p>
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
    </div>
  );
}
