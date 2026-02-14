'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, PageHeader, ActionModal } from '@/components/ui';
import { type BatchStatus } from '@/components/content/generation-batch-tracker';
import { GenerationModal } from '@/components/content/generation-modal';
import { BrandVariableModal } from '@/components/content/brand-variable-modal';
import { BrandVariablesPanel } from '@/components/content/brand-variables-panel';
import { TemplateModal, type TemplateOverrides } from '@/components/content/template-modal';
import { AIModelPicker } from '@/components/content/ai-model-picker';
import { PlacementPreviewCard } from '@/components/content-machine/placement-preview-card';
import { PlacementEditModal } from '@/components/content-machine/placement-edit-modal';
import { ScheduleModal } from '@/components/content-machine/schedule-modal';
import type { UploadedFile } from '@/components/content/media-upload';
import {
  createDefaultPlacementsMap,
  getEnabledPlatforms,
  PLATFORM_ORDER,
  PLACEMENT_OPTIONS,
  getPlacementLabel,
  type PlatformPlacementsMap,
} from '@/config/placement-types';
import {
  BoltIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { FORMAT_LABELS, getFormatCategory, type ContentFormat } from '@/config/script-frameworks';
import { getTemplateByKey as getTemplateName } from '@/lib/content-engine/template-catalog';
import type { FunnelStage, StoryBrandStage, SocialPlatform, PlacementType } from '@/types/database';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useModelPreference } from '@/hooks/useModelPreference';
import {
  ESSENTIAL_CONTENT_VARIABLES,
} from '@/lib/content-engine/brand-variable-categories';
import {
  exportAsCSV,
  copyToClipboard,
  downloadFile,
} from '@/lib/content-engine/export-utils';
import type {
  SharedConfig,
  PlacementConfig,
  GeneratedItem,
  EditFields,
  PlacementEntry,
  ModalAction,
} from '@/components/content-machine/types';

// ─── Constants ────────────────────────────────────────────────────────────
const MAX_PLACEMENTS = 10;

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

const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS).map(([value, label]) => ({
  value: value as ContentFormat,
  label,
}));

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#000000',
  tiktok: '#000000',
  youtube: '#FF0000',
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

// ─── Platform SVG Icons ──────────────────────────────────────────────────
function PlatformIcon({ platform, size = 20 }: { platform: SocialPlatform; size?: number }) {
  const s = size;
  switch (platform) {
    case 'linkedin':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM3.23 8.5h3.42V21H3.23V8.5Zm5.46 0h3.28v1.71h.05c.46-.87 1.58-1.79 3.24-1.79 3.47 0 4.1 2.28 4.1 5.25V21h-3.42v-5.96c0-1.42-.03-3.25-1.98-3.25-1.98 0-2.28 1.55-2.28 3.15V21H8.69V8.5Z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.013 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.013-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.25a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5ZM18.406 6.155a1.187 1.187 0 1 0-2.374 0 1.187 1.187 0 0 0 2.374 0Z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function creditsToRand(credits: number): string {
  return `R${(credits / 100).toFixed(2)}`;
}

function countAllPlacements(platformPlacements: PlatformPlacementsMap): number {
  let count = 0;
  for (const platform of PLATFORM_ORDER) {
    if (platformPlacements[platform].enabled) {
      count += platformPlacements[platform].placements.size;
    }
  }
  return count;
}

// ═════════════════════════════════════════════════════════════════════════
// Page Component
// ═════════════════════════════════════════════════════════════════════════
export default function ContentEnginePage() {
  const supabase = createClient();

  // ─── Init State ──────────────────────────────────────────────────────
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Platform & placements
  const [platformPlacements, setPlatformPlacements] = useState<PlatformPlacementsMap>(
    createDefaultPlacementsMap()
  );

  // Shared config
  const [sharedConfig, setSharedConfig] = useState<SharedConfig>({
    format: 'short_video_30_60',
    funnelStage: 'awareness',
    storybrandStage: 'character',
  });

  // Brand variables — empty = smart mode (AI picks 7 random per post)
  const [selectedBrandVars, setSelectedBrandVars] = useState<Set<string>>(new Set());
  const [showBrandVarModal, setShowBrandVarModal] = useState(false);
  const [showBrandPanel, setShowBrandPanel] = useState(false);

  // Templates — empty = smart mode (AI picks best template)
  const [selectedTemplates, setSelectedTemplates] = useState<TemplateOverrides>({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // AI model
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Per-placement config overrides
  const [placementConfigs, setPlacementConfigs] = useState<Record<string, PlacementConfig>>({});
  const [configPopoverPlacement, setConfigPopoverPlacement] = useState<string | null>(null);

  // Generation state
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPlacements, setGeneratingPlacements] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Generated items mapping: placement key -> GeneratedItem
  const [placementItemMap, setPlacementItemMap] = useState<Record<string, GeneratedItem>>({});
  // Edit fields per placement
  const [editFieldsMap, setEditFieldsMap] = useState<Record<string, EditFields>>({});
  // Media per placement
  const [mediaFilesMap, setMediaFilesMap] = useState<Record<string, UploadedFile[]>>({});
  // Track which placement maps to which content item ID
  const [placementItemIdMap, setPlacementItemIdMap] = useState<Record<string, string>>({});
  // Calendar ID for navigation after publish/save
  const [calendarId, setCalendarId] = useState<string | null>(null);

  // Modal state
  const [activeModalPlacement, setActiveModalPlacement] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModalConfig, setActionModalConfig] = useState<{
    variant: 'success' | 'error' | 'info';
    title: string;
    subtitle?: string;
  }>({ variant: 'success', title: '' });

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Copy feedback
  const [copyFeedback, setCopyFeedback] = useState(false);

  // ─── Data Loading ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: membership } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (membership?.organization_id) {
          setOrganizationId(membership.organization_id);

          const { data: userData } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();
          if (userData?.role === 'super_admin') setIsSuperAdmin(true);
          if (userData?.full_name) setUserName(userData.full_name);
        }
      } catch (err) {
        console.error('[ENGINE] loadData error:', err);
        setError('Failed to load user data. Please refresh the page.');
      }

      setIsLoading(false);
    }

    loadData();
  }, [supabase]);

  // ─── Hooks ───────────────────────────────────────────────────────────
  const { models } = useAvailableModels('content_generation');
  const { selectedModel: orgDefaultModel } = useModelPreference(organizationId, 'content_generation');
  const { balance, isLoading: balanceLoading } = useCreditBalance(organizationId);

  // Derived format category for template filtering
  const currentFormatCategory = getFormatCategory(sharedConfig.format);

  // Template selection handler
  const handleTemplateSelect = (type: 'script' | 'hook' | 'cta', key: string | null) => {
    setSelectedTemplates(prev => {
      const next = { ...prev };
      if (key) {
        next[type] = key;
      } else {
        delete next[type];
      }
      return next;
    });
  };

  // Default to Llama 3.3 70B (Groq) — free and working; user can change manually
  const DEFAULT_MODEL_ID = 'llama-3-3-70b';
  const effectiveModelId = selectedModelId || orgDefaultModel || DEFAULT_MODEL_ID;
  const selectedModel = models.find(m => m.id === effectiveModelId) || null;

  // ─── Derived ─────────────────────────────────────────────────────────
  const allSelectedPlacements: PlacementEntry[] = [];
  for (const platform of PLATFORM_ORDER) {
    if (platformPlacements[platform].enabled) {
      platformPlacements[platform].placements.forEach(p => {
        allSelectedPlacements.push({ platform, placement: p });
      });
    }
  }

  const placementCount = allSelectedPlacements.length;
  const hasGeneratedItems = Object.keys(placementItemMap).length > 0;

  // ─── Platform Toggle (with max cap) ──────────────────────────────────
  const handlePlatformToggle = (platform: SocialPlatform) => {
    const state = platformPlacements[platform];
    const updated = { ...platformPlacements };

    if (state.enabled) {
      updated[platform] = { enabled: false, placements: new Set() };
    } else {
      // Check if adding this platform's default placement would exceed max
      const currentCount = countAllPlacements(platformPlacements);
      if (currentCount >= MAX_PLACEMENTS) return;
      const defaultPlacement = PLACEMENT_OPTIONS[platform][0].value;
      updated[platform] = { enabled: true, placements: new Set([defaultPlacement]) };
    }
    setPlatformPlacements(updated);
  };

  const handlePlacementToggle = (platform: SocialPlatform, placement: PlacementType) => {
    const state = platformPlacements[platform];
    const next = new Set(state.placements);
    if (next.has(placement)) {
      if (next.size > 1) next.delete(placement);
    } else {
      // Check max cap before adding
      const currentCount = countAllPlacements(platformPlacements);
      if (currentCount >= MAX_PLACEMENTS) return;
      next.add(placement);
    }
    const updated = { ...platformPlacements };
    updated[platform] = { ...state, placements: next };
    setPlatformPlacements(updated);
  };

  // ─── Brand Var Toggles — max 7 at a time ───────────────────────────
  const MAX_BRAND_VARS = 7;
  const toggleBrandVar = (key: string) => {
    setSelectedBrandVars(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < MAX_BRAND_VARS) {
        next.add(key);
      }
      return next;
    });
  };

  // ─── Per-Placement Config ───────────────────────────────────────────
  const updatePlacementConfig = (placement: string, field: keyof PlacementConfig, value: string) => {
    setPlacementConfigs(prev => ({
      ...prev,
      [placement]: { ...(prev[placement] || {}), [field]: value },
    }));
  };

  const clearPlacementConfig = (placement: string) => {
    setPlacementConfigs(prev => {
      const next = { ...prev };
      delete next[placement];
      return next;
    });
  };

  // ─── Generation ─────────────────────────────────────────────────────
  const [showGenModal, setShowGenModal] = useState(false);

  const handleGenerate = async () => {
    if (!organizationId || placementCount === 0 || !effectiveModelId) return;

    setShowGenModal(true);
    setIsGenerating(true);
    setError(null);
    setBatchId(null);
    setPlacementItemMap({});
    setEditFieldsMap({});
    setMediaFilesMap({});
    setPlacementItemIdMap({});

    const genSet = new Set<string>();
    for (const { placement } of allSelectedPlacements) {
      genSet.add(placement);
    }
    setGeneratingPlacements(genSet);

    try {
      const today = new Date().toISOString().split('T')[0];
      const createdIds: string[] = [];
      const idToPlacement: Record<string, string> = {};

      for (const { platform, placement } of allSelectedPlacements) {
        const cfg = placementConfigs[placement];
        const format = cfg?.format || sharedConfig.format;
        const funnelStage = cfg?.funnelStage || sharedConfig.funnelStage;
        const storybrandStage = cfg?.storybrandStage || sharedConfig.storybrandStage;

        const createRes = await fetch('/api/content/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            format,
            funnel_stage: funnelStage,
            storybrand_stage: storybrandStage,
            platforms: [platform],
            scheduled_date: today,
            ai_generated: true,
            status: 'scripted',
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          throw new Error(`Failed to create content item (${createRes.status}): ${errText}`);
        }

        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);
        if (createData.item?.id) {
          createdIds.push(createData.item.id);
          idToPlacement[createData.item.id] = placement;
        }
      }

      if (createdIds.length === 0) throw new Error('No content items were created');

      const placementToId: Record<string, string> = {};
      for (const [id, pl] of Object.entries(idToPlacement)) {
        placementToId[pl] = id;
      }
      setPlacementItemIdMap(placementToId);

      const queueRes = await fetch('/api/content/generate/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          contentItemIds: createdIds,
          modelOverride: effectiveModelId,
          selectedBrandVariables: selectedBrandVars.size > 0 ? Array.from(selectedBrandVars) : null,
          templateOverrides: (selectedTemplates.script || selectedTemplates.hook || selectedTemplates.cta) ? selectedTemplates : null,
        }),
      });

      const queueData = await queueRes.json();
      if (!queueRes.ok) throw new Error(queueData.error || `Failed to enqueue generation (${queueRes.status})`);

      if (queueData.batchId) {
        setBatchId(queueData.batchId);
      } else {
        throw new Error('Server returned OK but no batchId');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGeneratingPlacements(new Set());
    }

    setIsGenerating(false);
  };

  // ─── Batch Complete ─────────────────────────────────────────────────
  const handleBatchComplete = useCallback(async () => {
    setBatchId(null);
    setShowGenModal(false);
    setGeneratingPlacements(new Set());
    if (!organizationId) return;

    const ids = Array.from(new Set(Object.values(placementItemIdMap).filter(Boolean)));
    if (ids.length === 0) return;

    const { data: items } = await supabase
      .from('content_items')
      .select('id, topic, caption, hashtags, funnel_stage, storybrand_stage, format, platforms, media_urls, scheduled_date, status, calendar_id')
      .in('id', ids);

    if (items && items.length > 0) {
      const firstCalId = items[0].calendar_id;
      if (firstCalId) setCalendarId(firstCalId);
      const newItemMap: Record<string, GeneratedItem> = {};
      const newEditMap: Record<string, EditFields> = {};

      for (const item of items) {
        const placementKey = Object.entries(placementItemIdMap).find(
          ([, id]) => id === item.id
        )?.[0];

        if (placementKey) {
          newItemMap[placementKey] = {
            id: item.id,
            caption: item.caption,
            hashtags: item.hashtags as string[] | null,
            topic: item.topic,
            media_urls: item.media_urls as string[] | null,
            status: item.status,
            platforms: item.platforms as string[] | null,
            format: item.format,
            funnel_stage: item.funnel_stage,
            storybrand_stage: item.storybrand_stage,
            scheduled_date: item.scheduled_date,
          };
          newEditMap[placementKey] = {
            caption: item.caption || '',
            hashtags: item.hashtags ? (item.hashtags as string[]).join(', ') : '',
            topic: item.topic || '',
          };
        }
      }

      setPlacementItemMap(newItemMap);
      setEditFieldsMap(newEditMap);
    }
  }, [organizationId, placementItemIdMap, supabase]);

  const handleBatchCancel = useCallback(() => {
    setBatchId(null);
    setShowGenModal(false);
    setGeneratingPlacements(new Set());
    setError(null);
  }, []);

  // ─── Progress callback — update items as they complete ──────────────
  const handleBatchProgress = useCallback(async (status: BatchStatus) => {
    if (!organizationId || status.recentItems.length === 0) return;

    const completedItemIds = status.recentItems
      .filter(ri => ri.status === 'completed')
      .map(ri => ri.id);

    if (completedItemIds.length === 0) return;

    const { data: items } = await supabase
      .from('content_items')
      .select('id, topic, caption, hashtags, funnel_stage, storybrand_stage, format, platforms, media_urls, scheduled_date, status')
      .in('id', completedItemIds);

    if (items && items.length > 0) {
      setPlacementItemMap(prev => {
        const updated = { ...prev };
        for (const item of items) {
          const placementKey = Object.entries(placementItemIdMap).find(
            ([, id]) => id === item.id
          )?.[0];
          if (placementKey) {
            updated[placementKey] = {
              id: item.id,
              caption: item.caption,
              hashtags: item.hashtags as string[] | null,
              topic: item.topic,
              media_urls: item.media_urls as string[] | null,
              status: item.status,
              platforms: item.platforms as string[] | null,
              format: item.format,
              funnel_stage: item.funnel_stage,
              storybrand_stage: item.storybrand_stage,
              scheduled_date: item.scheduled_date,
            };
            setGeneratingPlacements(gp => {
              const next = new Set(gp);
              next.delete(placementKey);
              return next;
            });
            setEditFieldsMap(ef => ({
              ...ef,
              [placementKey]: {
                caption: item.caption || '',
                hashtags: item.hashtags ? (item.hashtags as string[]).join(', ') : '',
                topic: item.topic || '',
              },
            }));
          }
        }
        return updated;
      });
    }
  }, [organizationId, placementItemIdMap, supabase]);

  // ─── Modal Actions ──────────────────────────────────────────────────
  const handleModalAction = async (
    placement: string,
    action: ModalAction,
    data?: { date?: string; time?: string; reason?: string }
  ) => {
    const item = placementItemMap[placement];
    if (!item) return;

    setIsSaving(true);
    try {
      const fields = editFieldsMap[placement] || {};
      const media = mediaFilesMap[placement] || [];
      const hashtagArr = fields.hashtags
        ? fields.hashtags.split(',').map(h => h.trim()).filter(Boolean)
        : null;

      let status: string;
      const body: Record<string, unknown> = {
        caption: fields.caption || null,
        hashtags: hashtagArr,
        topic: fields.topic || null,
        media_urls: media.length > 0 ? media.map(f => f.url) : (item.media_urls || null),
      };

      switch (action) {
        case 'draft':
          status = 'scripted';
          body.status = status;
          break;
        case 'schedule':
          status = 'scheduled';
          body.status = status;
          body.scheduled_date = data?.date || null;
          body.scheduled_time = data?.time || null;
          break;
        case 'publish': {
          body.status = 'approved';
          await fetch(`/api/content/items/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const pubRes = await fetch('/api/content/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentItemId: item.id,
              platforms: item.platforms || [],
            }),
          });
          const pubData = await pubRes.json();
          const success = pubData.results?.some((r: { success: boolean }) => r.success);
          setPlacementItemMap(prev => ({
            ...prev,
            [placement]: { ...prev[placement], status: success ? 'published' : 'failed' },
          }));
          setActionModalConfig({
            variant: success ? 'success' : 'error',
            title: success ? 'Published!' : 'Publish Failed',
            subtitle: success ? `${PLATFORM_LABELS[allSelectedPlacements.find(p => p.placement === placement as PlacementType)?.platform || 'linkedin']} ${getPlacementLabel(placement as PlacementType)}` : 'Please try again',
          });
          setShowActionModal(true);
          setActiveModalPlacement(null);
          setIsSaving(false);
          return;
        }
        case 'decline':
          status = 'rejected';
          body.status = status;
          if (data?.reason) {
            body.metadata = { decline_reason: data.reason };
          }
          break;
        default:
          status = 'scripted';
          body.status = status;
      }

      await fetch(`/api/content/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setPlacementItemMap(prev => ({
        ...prev,
        [placement]: { ...prev[placement], status },
      }));

      const actionLabel = action === 'draft' ? 'Saved as Draft' :
        action === 'schedule' ? 'Scheduled' :
        action === 'decline' ? 'Declined' : 'Done';

      setActionModalConfig({
        variant: action === 'decline' ? 'info' : 'success',
        title: actionLabel,
        subtitle: `${PLATFORM_LABELS[allSelectedPlacements.find(p => p.placement === placement as PlacementType)?.platform || 'linkedin']} ${getPlacementLabel(placement as PlacementType)}`,
      });
      setShowActionModal(true);
      setActiveModalPlacement(null);
    } catch (err) {
      console.error('Action failed:', err);
      setActionModalConfig({
        variant: 'error',
        title: 'Action Failed',
        subtitle: 'Please try again',
      });
      setShowActionModal(true);
    }
    setIsSaving(false);
  };

  // ─── Edit field updates ─────────────────────────────────────────────
  const updateEditField = (placement: string, field: keyof EditFields, value: string) => {
    setEditFieldsMap(prev => ({
      ...prev,
      [placement]: { ...(prev[placement] || {}), [field]: value },
    }));
  };

  // ─── Post-generation actions ────────────────────────────────────────
  const handleDownloadCSV = () => {
    const csv = exportAsCSV(allSelectedPlacements, placementItemMap);
    downloadFile(csv, `content-engine-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleCopyAll = async () => {
    const ok = await copyToClipboard(allSelectedPlacements, placementItemMap);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleStartNewBatch = () => {
    setBatchId(null);
    setPlacementItemMap({});
    setEditFieldsMap({});
    setMediaFilesMap({});
    setPlacementItemIdMap({});
    setCalendarId(null);
    setError(null);
    setGeneratingPlacements(new Set());
    setShowGenModal(false);
    setCopyFeedback(false);
  };

  const handleScheduleComplete = () => {
    // Refresh items to show updated status
    handleBatchComplete();
    setActionModalConfig({
      variant: 'success',
      title: 'Scheduled!',
      subtitle: 'All posts have been pushed to the calendar',
    });
    setShowActionModal(true);
  };

  // ─── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  // ─── Active platform for placement pills ─────────────────────────────
  const enabledPlatforms = getEnabledPlatforms(platformPlacements);

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Engine"
        icon={BoltIcon}
        subtitle="Generate content across platforms and placements"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBrandPanel(true)}
          >
            <SparklesIcon className="w-4 h-4 mr-1" />
            Brand DNA
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left Column (3/5) ───────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* ── Shared Defaults Card ──────────────────────────────── */}
          <Card>
            <h3 className="text-sm font-semibold text-charcoal mb-3">Shared Defaults</h3>
            <p className="text-xs text-stone mb-4">These apply to all placements unless overridden per-card.</p>

            {/* Format */}
            <div className="mb-3">
              <label className="text-xs font-medium text-charcoal-700 mb-1 block">Format</label>
              <select
                value={sharedConfig.format}
                onChange={e => setSharedConfig(prev => ({ ...prev, format: e.target.value as ContentFormat }))}
                className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
              >
                {FORMAT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Funnel Stage */}
            <div className="mb-3">
              <label className="text-xs font-medium text-charcoal-700 mb-1 block">Funnel Stage</label>
              <div className="flex flex-wrap gap-2">
                {FUNNEL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSharedConfig(prev => ({ ...prev, funnelStage: opt.value }))}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                      sharedConfig.funnelStage === opt.value
                        ? 'bg-teal text-white border-teal'
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* StoryBrand Stage */}
            <div>
              <label className="text-xs font-medium text-charcoal-700 mb-1 block">StoryBrand Stage</label>
              <select
                value={sharedConfig.storybrandStage}
                onChange={e => setSharedConfig(prev => ({ ...prev, storybrandStage: e.target.value as StoryBrandStage }))}
                className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
              >
                {STORYBRAND_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* ── Brand Variables ───────────────────────────────────── */}
          <button
            onClick={() => setShowBrandVarModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone/20 text-sm text-charcoal hover:border-teal/30 hover:text-teal transition-colors w-full justify-between"
          >
            <div className="flex flex-col items-start">
              <span>Brand Variables</span>
              {selectedBrandVars.size === 0 && (
                <span className="text-[10px] text-stone">AI picks 7 random per post for variety</span>
              )}
            </div>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
              selectedBrandVars.size === 0
                ? 'bg-teal/10 text-teal'
                : 'bg-gold/10 text-gold'
            )}>
              {selectedBrandVars.size === 0 ? 'Smart Mode' : `${selectedBrandVars.size}/${MAX_BRAND_VARS}`}
            </span>
          </button>

          {/* ── Templates ─────────────────────────────────────────── */}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone/20 text-sm text-charcoal hover:border-teal/30 hover:text-teal transition-colors w-full justify-between"
          >
            <div className="flex flex-col items-start">
              <span>Templates</span>
              {!selectedTemplates.script && !selectedTemplates.hook && !selectedTemplates.cta ? (
                <span className="text-[10px] text-stone">AI picks best template per post</span>
              ) : (
                <span className="text-[10px] text-stone line-clamp-1">
                  {[
                    selectedTemplates.script && `Script: ${getTemplateName(selectedTemplates.script)?.name || selectedTemplates.script}`,
                    selectedTemplates.hook && `Hook: ${getTemplateName(selectedTemplates.hook)?.name || selectedTemplates.hook}`,
                    selectedTemplates.cta && `CTA: ${getTemplateName(selectedTemplates.cta)?.name || selectedTemplates.cta}`,
                  ].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
              !selectedTemplates.script && !selectedTemplates.hook && !selectedTemplates.cta
                ? 'bg-teal/10 text-teal'
                : 'bg-gold/10 text-gold'
            )}>
              {!selectedTemplates.script && !selectedTemplates.hook && !selectedTemplates.cta
                ? 'Smart Mode'
                : `${[selectedTemplates.script, selectedTemplates.hook, selectedTemplates.cta].filter(Boolean).length} override${[selectedTemplates.script, selectedTemplates.hook, selectedTemplates.cta].filter(Boolean).length !== 1 ? 's' : ''}`}
            </span>
          </button>

          {/* ── AI Model ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-stone/20">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-stone" />
              <span className="text-sm text-charcoal">
                {selectedModel ? selectedModel.name : 'Select AI Model'}
              </span>
              {selectedModel && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  selectedModel.isFree ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'
                )}>
                  {selectedModel.isFree ? 'Free' : `~${selectedModel.estimatedCreditsPerMessage * placementCount} cr`}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="text-xs font-medium text-teal hover:underline"
            >
              {showModelPicker ? 'Hide' : 'Change'}
            </button>
          </div>

          {showModelPicker && (
            <Card>
              <AIModelPicker
                models={models}
                selectedModelId={effectiveModelId}
                onSelect={(id) => { setSelectedModelId(id); setShowModelPicker(false); }}
                costLabelFn={m => m.isFree ? 'Free' : `~${m.estimatedCreditsPerMessage * placementCount} cr`}
              />
            </Card>
          )}

          {/* ── Cost Estimate & Generate ─────────────────────────── */}
          <Card>
            {selectedModel && !selectedModel.isFree && !balanceLoading && balance && (
              <div className="mb-4 bg-cream-warm rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone">Estimated total cost</span>
                  <span className="font-semibold text-charcoal">
                    ~{selectedModel.estimatedCreditsPerMessage * placementCount} credits
                    <span className="text-xs text-stone ml-1">({creditsToRand(selectedModel.estimatedCreditsPerMessage * placementCount)})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-stone/10 pt-1">
                  <span className="text-stone">Your balance</span>
                  <span className={cn(
                    'font-medium',
                    balance.totalRemaining >= selectedModel.estimatedCreditsPerMessage * placementCount ? 'text-teal' : 'text-red-500'
                  )}>
                    {balance.totalRemaining.toLocaleString()} credits
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={placementCount === 0 || !effectiveModelId || !!batchId}
              className="w-full"
            >
              <BoltIcon className="w-4 h-4 mr-2" />
              {batchId ? 'Generating...' : `Generate ${placementCount} Post${placementCount !== 1 ? 's' : ''}`}
            </Button>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </Card>

          {/* ── Post-Generation Actions ───────────────────────────── */}
          {hasGeneratedItems && !batchId && (
            <Card>
              <h3 className="text-sm font-semibold text-charcoal mb-3">Batch Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScheduleModal(true)}
                >
                  <CalendarDaysIcon className="w-4 h-4 mr-1.5" />
                  Push All to Calendar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCSV}
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                >
                  <ClipboardDocumentIcon className="w-4 h-4 mr-1.5" />
                  {copyFeedback ? 'Copied!' : 'Copy All'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartNewBatch}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                  Start New Batch
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* ── Right Column (2/5) — Sticky Preview ─────────────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <Card className="p-5">
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-charcoal">Channels & Placements</h3>
                <p className="text-xs text-stone mt-0.5">Click to enable/disable a channel</p>
              </div>

              {/* Platform logos */}
              <div className="flex items-center justify-center gap-3 mb-4">
                {PLATFORM_ORDER.map(platform => {
                  const state = platformPlacements[platform];
                  const isEnabled = state.enabled;
                  const color = PLATFORM_COLORS[platform];

                  return (
                    <button
                      key={platform}
                      onClick={() => handlePlatformToggle(platform)}
                      title={`${PLATFORM_LABELS[platform]} — ${isEnabled ? 'click to disable' : 'click to enable'}`}
                      className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shrink-0',
                        isEnabled
                          ? 'text-white shadow-lg scale-105'
                          : 'bg-stone-100 border border-stone-200 text-stone-400 hover:bg-stone-50 hover:border-stone-300'
                      )}
                      style={
                        isEnabled
                          ? { backgroundColor: color, borderColor: color, boxShadow: `0 0 0 3px ${color}30` }
                          : undefined
                      }
                    >
                      <PlatformIcon platform={platform} size={18} />
                    </button>
                  );
                })}
              </div>

              {/* Placement pills for each enabled platform */}
              {enabledPlatforms.map(platform => (
                <div key={platform} className="mb-3">
                  <p className="text-[10px] font-semibold text-stone uppercase tracking-wide mb-1.5">{PLATFORM_LABELS[platform]}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEMENT_OPTIONS[platform].map(opt => {
                      const isSelected = platformPlacements[platform].placements.has(opt.value);
                      const atMax = placementCount >= MAX_PLACEMENTS && !isSelected;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handlePlacementToggle(platform, opt.value)}
                          disabled={atMax}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border',
                            isSelected
                              ? 'bg-teal text-white border-teal'
                              : atMax
                                ? 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
                                : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300'
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Divider */}
              {allSelectedPlacements.length > 0 && <div className="border-t border-stone-100 my-3" />}

              {/* Placement Preview Cards */}
              {allSelectedPlacements.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {allSelectedPlacements.map(({ platform, placement }) => (
                    <PlacementPreviewCard
                      key={placement}
                      placement={placement}
                      platform={platform}
                      item={placementItemMap[placement] || null}
                      config={placementConfigs[placement] || null}
                      sharedConfig={sharedConfig}
                      isGenerating={generatingPlacements.has(placement)}
                      onCardClick={() => {
                        if (placementItemMap[placement]) {
                          setActiveModalPlacement(placement);
                        }
                      }}
                      onConfigClick={(e) => {
                        e.stopPropagation();
                        setConfigPopoverPlacement(
                          configPopoverPlacement === placement ? null : placement
                        );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-stone-50 rounded-xl p-3 min-h-[200px] flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                    <BoltIcon className="w-6 h-6 text-stone-400" />
                  </div>
                  <p className="text-sm font-medium text-stone-500">Select channels above</p>
                  <p className="text-xs text-stone-400 mt-1">Each placement = 1 generated post</p>
                </div>
              )}

              {/* Summary */}
              {placementCount > 0 && (
                <div className="bg-stone-50 rounded-lg px-3 py-2 mt-3">
                  <p className="text-xs font-medium text-teal">
                    {enabledPlatforms.length} channel{enabledPlatforms.length !== 1 ? 's' : ''}, {placementCount}/{MAX_PLACEMENTS} posts
                  </p>
                </div>
              )}
            </Card>

            {/* Per-placement config popover */}
            {configPopoverPlacement && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-charcoal">
                    Override: {getPlacementLabel(configPopoverPlacement as PlacementType)}
                  </h4>
                  <button
                    onClick={() => setConfigPopoverPlacement(null)}
                    className="text-xs text-stone hover:text-charcoal"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-charcoal-700 mb-1 block">Format</label>
                    <select
                      value={placementConfigs[configPopoverPlacement]?.format || ''}
                      onChange={e => updatePlacementConfig(configPopoverPlacement, 'format', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone/20 text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
                    >
                      <option value="">Use shared default</option>
                      {FORMAT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-charcoal-700 mb-1 block">Funnel Stage</label>
                    <select
                      value={placementConfigs[configPopoverPlacement]?.funnelStage || ''}
                      onChange={e => updatePlacementConfig(configPopoverPlacement, 'funnelStage', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone/20 text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
                    >
                      <option value="">Use shared default</option>
                      {FUNNEL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-charcoal-700 mb-1 block">StoryBrand Stage</label>
                    <select
                      value={placementConfigs[configPopoverPlacement]?.storybrandStage || ''}
                      onChange={e => updatePlacementConfig(configPopoverPlacement, 'storybrandStage', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone/20 text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
                    >
                      <option value="">Use shared default</option>
                      {STORYBRAND_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {placementConfigs[configPopoverPlacement] && (
                    <button
                      onClick={() => clearPlacementConfig(configPopoverPlacement)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Reset to shared defaults
                    </button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Modal ────────────────────────────────────────────── */}
      {activeModalPlacement && placementItemMap[activeModalPlacement] && (
        <PlacementEditModal
          open={!!activeModalPlacement}
          onClose={() => setActiveModalPlacement(null)}
          placement={activeModalPlacement as PlacementType}
          platform={allSelectedPlacements.find(p => p.placement === activeModalPlacement as PlacementType)?.platform || 'linkedin'}
          item={placementItemMap[activeModalPlacement]}
          editFields={editFieldsMap[activeModalPlacement] || {}}
          mediaFiles={mediaFilesMap[activeModalPlacement] || []}
          onEditField={(field, value) => updateEditField(activeModalPlacement, field, value)}
          onMediaChange={(files) => setMediaFilesMap(prev => ({ ...prev, [activeModalPlacement!]: files }))}
          onAction={(action, data) => handleModalAction(activeModalPlacement, action, data)}
          organizationId={organizationId || ''}
          userName={userName}
          isSaving={isSaving}
        />
      )}

      {/* ── Generation Modal — shown immediately on Generate click ─ */}
      <GenerationModal
        open={showGenModal}
        batchId={batchId}
        totalPosts={placementCount}
        onComplete={handleBatchComplete}
        onCancel={handleBatchCancel}
        onProgress={handleBatchProgress}
        prepError={error}
      />

      {/* ── Schedule Modal ────────────────────────────────────────── */}
      <ScheduleModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        placements={allSelectedPlacements}
        itemMap={placementItemMap}
        placementItemIdMap={placementItemIdMap}
        onScheduled={handleScheduleComplete}
      />

      {/* ── Template Modal ──────────────────────────────────────── */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        selectedTemplates={selectedTemplates}
        onSelect={handleTemplateSelect}
        onClearAll={() => setSelectedTemplates({})}
        formatCategory={currentFormatCategory}
      />

      {/* ── Brand Variable Modal ──────────────────────────────────── */}
      <BrandVariableModal
        isOpen={showBrandVarModal}
        onClose={() => setShowBrandVarModal(false)}
        selectedBrandVars={selectedBrandVars}
        onToggle={toggleBrandVar}
        onSelectAll={() => setSelectedBrandVars(new Set(ESSENTIAL_CONTENT_VARIABLES.slice(0, MAX_BRAND_VARS)))}
        onClearAll={() => setSelectedBrandVars(new Set())}
      />

      {/* ── Action Modal ──────────────────────────────────────────── */}
      <ActionModal
        open={showActionModal}
        onClose={() => setShowActionModal(false)}
        variant={actionModalConfig.variant}
        title={actionModalConfig.title}
        subtitle={actionModalConfig.subtitle}
        actions={[
          { label: 'Continue', onClick: () => setShowActionModal(false) },
          { label: 'View Calendar', href: calendarId ? `/calendar?calendarId=${calendarId}` : '/calendar', variant: 'ghost' },
        ]}
      />

      {/* ── Brand DNA Sidebar ──────────────────────────────────────── */}
      {organizationId && (
        <BrandVariablesPanel
          organizationId={organizationId}
          isOpen={showBrandPanel}
          onClose={() => setShowBrandPanel(false)}
        />
      )}
    </div>
  );
}
