'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CalendarView, ContentEditor, TableView, ViewToggle, ApprovalQueue, BrandVariablesPanel, QuickCreateModal, KanbanView, GenerateWeekModal, DeleteConfirmationModal, ContentFilterBar, applyContentFilters, EMPTY_FILTERS, GenerationBatchTracker, type BatchStatus, type ViewMode, type ContentFilters } from '@/components/content';
import { Button, Card, PageHeader } from '@/components/ui';
import { CalendarIcon, DocumentArrowDownIcon, SparklesIcon, PlusIcon, BeakerIcon, TrashIcon, CursorArrowRaysIcon, XMarkIcon, BoltIcon, CheckCircleIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { exportToCSV, downloadCSV } from '@/lib/content-engine/export';
import { getApprovalSettings, canApproveContent } from '@/config/approval-settings';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useModelPreference } from '@/hooks/useModelPreference';
import { cn } from '@/lib/utils';
import type { FunnelStage, StoryBrandStage, TimeSlot, ContentStatus, OrgMemberRole, Json } from '@/types/database';

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
  assigned_to: string | null;
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
  generation_week?: number | null;
  target_url?: string | null;
  utm_parameters?: Record<string, string> | null;
  [key: string]: unknown;
}

interface Calendar {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  generation_progress: { weeks_generated: number; total_weeks: number } | null;
}

export default function CalendarPage() {
  const supabase = createClient();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [currentCalendar, setCurrentCalendar] = useState<Calendar | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [contentEngineEnabled, setContentEngineEnabled] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showBrandPanel, setShowBrandPanel] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState<OrgMemberRole>('member');
  const [userCanApprove, setUserCanApprove] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [generateWeekModal, setGenerateWeekModal] = useState<{ weekNumber: number; itemCount: number; totalWeekItems: number } | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [calendarSelectionMode, setCalendarSelectionMode] = useState(false);
  const [calendarSelectedIds, setCalendarSelectedIds] = useState<Set<string>>(new Set());
  const [showCalendarDeleteModal, setShowCalendarDeleteModal] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [contentFilters, setContentFilters] = useState<ContentFilters>(EMPTY_FILTERS);

  // Apply filters to items
  const filteredItems = useMemo(
    () => applyContentFilters(items, contentFilters),
    [items, contentFilters]
  );

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
          .select('organization_id, role, organizations(content_engine_enabled, settings)')
          .eq('user_id', user.id)
          .single();

        if (!membership?.organization_id) {
          setIsLoading(false);
          return;
        }

        setOrganizationId(membership.organization_id);
        setUserRole(membership.role as OrgMemberRole);

        // Check if user is super_admin (bypasses credit constraints)
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (userData?.role === 'super_admin') {
          setIsSuperAdmin(true);
        }
        const orgData = membership.organizations as { content_engine_enabled: boolean; settings: Record<string, unknown> | null };
        setContentEngineEnabled(orgData?.content_engine_enabled || false);

        const approvalSettings = getApprovalSettings(orgData?.settings || null);
        setUserCanApprove(canApproveContent(membership.role as OrgMemberRole, approvalSettings));

        const { data: calendarsData } = await supabase
          .from('content_calendars')
          .select('id, name, start_date, end_date, generation_progress')
          .eq('organization_id', membership.organization_id)
          .order('created_at', { ascending: false });

        if (calendarsData && calendarsData.length > 0) {
          const parsedCalendars = calendarsData.map(c => ({
            ...c,
            generation_progress: c.generation_progress as { weeks_generated: number; total_weeks: number } | null,
          }));
          setCalendars(parsedCalendars);
          setCurrentCalendar(parsedCalendars[0]);

          const { data: itemsData } = await supabase
            .from('content_items')
            .select('*')
            .eq('calendar_id', parsedCalendars[0].id)
            .order('scheduled_date');

          setItems((itemsData || []) as ContentItem[]);
        }

        // Check for active generation batches
        const { data: activeBatch } = await supabase
          .from('generation_batches')
          .select('id')
          .eq('organization_id', membership.organization_id)
          .in('status', ['pending', 'processing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeBatch) {
          setActiveBatchId(activeBatch.id);
          setIsGenerating(true);
        }
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const reloadItems = useCallback(async (calendarId: string) => {
    const { data: itemsData } = await supabase
      .from('content_items')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('scheduled_date');
    setItems((itemsData || []) as ContentItem[]);
  }, [supabase]);

  /** Reload only generated (non-idea) items — used during active generation */
  const reloadGeneratedItems = useCallback(async (calendarId: string) => {
    const { data: itemsData } = await supabase
      .from('content_items')
      .select('*')
      .eq('calendar_id', calendarId)
      .neq('status', 'idea')
      .order('scheduled_date');
    setItems((itemsData || []) as ContentItem[]);
  }, [supabase]);

  const handleBatchProgress = useCallback(async () => {
    if (currentCalendar) {
      await reloadGeneratedItems(currentCalendar.id);
    }
  }, [currentCalendar, reloadGeneratedItems]);

  const handleBatchComplete = useCallback(async () => {
    setActiveBatchId(null);
    setIsGenerating(false);
    if (currentCalendar) {
      // Final reload — include all items (some may still be "idea" if cancelled/failed)
      await reloadItems(currentCalendar.id);
    }
  }, [currentCalendar, reloadItems]);

  const handleBatchCancel = useCallback(async () => {
    setActiveBatchId(null);
    setIsGenerating(false);
    if (currentCalendar) {
      await reloadItems(currentCalendar.id);
    }
  }, [currentCalendar, reloadItems]);

  const handleCreateCalendar = async (campaignName: string, startDate: string, endDate: string, frequency: 'aggressive' | 'moderate' | 'light', platforms?: string[], modelOverride?: string) => {
    if (!organizationId) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          campaignName,
          startDate,
          endDate,
          frequency,
          defaultPlatforms: platforms,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Refresh calendar list
      const { data: calendarsData } = await supabase
        .from('content_calendars')
        .select('id, name, start_date, end_date, generation_progress')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (calendarsData && calendarsData.length > 0) {
        const parsedCalendars = calendarsData.map(c => ({
          ...c,
          generation_progress: c.generation_progress as { weeks_generated: number; total_weeks: number } | null,
        }));
        setCalendars(parsedCalendars);
        setCurrentCalendar(parsedCalendars[0]);

        // DON'T load items yet — they're all "idea" status.
        // Items will appear one by one as AI generates them via onProgress.
        setItems([]);

        setShowCreateModal(false);

        // Queue-based generation: enqueue all 'idea' items
        const newCalendar = parsedCalendars[0];
        if (modelOverride) {
          const { data: ideaItems } = await supabase
            .from('content_items')
            .select('id')
            .eq('calendar_id', newCalendar.id)
            .eq('status', 'idea');

          if (ideaItems && ideaItems.length > 0) {
            try {
              const queueRes = await fetch('/api/content/generate/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  organizationId,
                  calendarId: newCalendar.id,
                  contentItemIds: ideaItems.map(i => i.id),
                  modelOverride,
                }),
              });
              const queueData = await queueRes.json();
              if (queueRes.ok && queueData.batchId) {
                setActiveBatchId(queueData.batchId);
              } else {
                console.error('Queue enqueue failed:', queueData);
                // Load all items as fallback so user can see them
                await reloadItems(newCalendar.id);
                setIsGenerating(false);
              }
            } catch (err) {
              console.error('Failed to enqueue generation:', err);
              await reloadItems(newCalendar.id);
              setIsGenerating(false);
            }
          } else {
            setIsGenerating(false);
          }
        } else {
          // No model selected — just load the idea items normally
          await reloadItems(parsedCalendars[0].id);
          setIsGenerating(false);
        }
        return;
      }

      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create calendar:', error);
    }
    setIsGenerating(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleItemClick = useCallback((item: any) => {
    setSelectedItem(item as ContentItem);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveItem = async (updatedItem: any) => {
    const res = await fetch(`/api/content/items/${updatedItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem),
    });

    if (res.ok) {
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem as ContentItem : i));
    }
  };

  const handleGenerateContent = async (itemId: string): Promise<Partial<ContentItem>> => {
    const response = await fetch('/api/content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, contentItemIds: [itemId] }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const generated = data.results?.[0]?.content || {};
    if (currentCalendar) await reloadItems(currentCalendar.id);
    return generated;
  };

  const handleOpenGenerateWeek = (weekNumber: number) => {
    // Count all items for the week — the API filters to 'idea' status server-side
    const weekItems = items.filter(i => i.generation_week === weekNumber);
    const ideaItems = weekItems.filter(i => i.status === 'idea');
    setGenerateWeekModal({ weekNumber, itemCount: ideaItems.length, totalWeekItems: weekItems.length });
  };

  const handleGenerateWeek = async (weekNumber: number, modelOverride?: string, limit?: number) => {
    if (!currentCalendar || !organizationId) return;
    setIsGenerating(true);

    try {
      // Get 'idea' items for this week
      const weekItems = items.filter(i => i.generation_week === weekNumber && i.status === 'idea');
      const itemIds = limit ? weekItems.slice(0, limit).map(i => i.id) : weekItems.map(i => i.id);

      if (itemIds.length === 0) {
        setIsGenerating(false);
        setGenerateWeekModal(null);
        return;
      }

      const queueRes = await fetch('/api/content/generate/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          calendarId: currentCalendar.id,
          contentItemIds: itemIds,
          modelOverride,
        }),
      });

      const queueData = await queueRes.json();
      if (queueRes.ok && queueData.batchId) {
        setActiveBatchId(queueData.batchId);
      } else {
        throw new Error(queueData.error || 'Failed to start generation');
      }
    } catch (error) {
      console.error('Week generation failed:', error);
      setIsGenerating(false);
    }
    setGenerateWeekModal(null);
  };

  const handleMovePost = async (itemId: string, newDate: string) => {
    const res = await fetch(`/api/content/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_date: newDate }),
    });

    if (res.ok) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, scheduled_date: newDate } : i));
    }
  };

  const handleAddPost = (date: Date) => {
    setQuickCreateDate(date);
  };

  const handleQuickCreate = async (data: {
    scheduled_date: string;
    format: string;
    funnel_stage: FunnelStage;
    storybrand_stage: StoryBrandStage;
    platforms: string[];
    generateImmediately: boolean;
  }) => {
    const res = await fetch('/api/content/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        calendarId: currentCalendar?.id,
        ...data,
      }),
    });

    if (res.ok && currentCalendar) {
      await reloadItems(currentCalendar.id);
    }
  };

  const handleBulkAction = async (itemIds: string[], action: string, value?: string) => {
    const res = await fetch('/api/content/items/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds, action, value }),
    });

    if (res.ok && currentCalendar) {
      await reloadItems(currentCalendar.id);
    }
  };

  const handleApprove = async (itemId: string, comment?: string) => {
    const res = await fetch(`/api/content/items/${itemId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', comment }),
    });
    if (res.ok && currentCalendar) {
      await reloadItems(currentCalendar.id);
      setSelectedItem(null);
    }
  };

  const handleReject = async (itemId: string, comment: string) => {
    const res = await fetch(`/api/content/items/${itemId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', comment }),
    });
    if (res.ok && currentCalendar) {
      await reloadItems(currentCalendar.id);
      setSelectedItem(null);
    }
  };

  const handleRequestRevision = async (itemId: string, comment: string) => {
    const res = await fetch(`/api/content/items/${itemId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_revision', comment }),
    });
    if (res.ok && currentCalendar) {
      await reloadItems(currentCalendar.id);
      setSelectedItem(null);
    }
  };

  const handleResubmit = async (itemId: string) => {
    const res = await fetch(`/api/content/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending_review' }),
    });
    if (res.ok && currentCalendar) {
      await reloadItems(currentCalendar.id);
      setSelectedItem(null);
    }
  };

  const handleExport = () => {
    const csv = exportToCSV(items);
    downloadCSV(csv, `content-calendar-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleDeleteCalendar = async () => {
    if (!currentCalendar) return;
    setIsClearing(true);
    try {
      const res = await fetch('/api/content/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: currentCalendar.id }),
      });

      if (res.ok) {
        const remaining = calendars.filter(c => c.id !== currentCalendar.id);
        setCalendars(remaining);
        if (remaining.length > 0) {
          setCurrentCalendar(remaining[0]);
          await reloadItems(remaining[0].id);
        } else {
          setCurrentCalendar(null);
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete calendar:', error);
    }
    setIsClearing(false);
    setShowClearModal(false);
  };

  const handleDeleteSelected = async () => {
    if (calendarSelectedIds.size === 0) return;
    setIsDeletingSelected(true);
    await handleBulkAction(Array.from(calendarSelectedIds), 'delete');
    setIsDeletingSelected(false);
    setShowCalendarDeleteModal(false);
    setCalendarSelectedIds(new Set());
    setCalendarSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setCalendarSelectionMode(false);
    setCalendarSelectedIds(new Set());
  };

  const pendingReviewItems = items.filter(i => i.status === 'pending_review' || i.status === 'revision_requested');

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
          Your brand strategy powers the AI content generation.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = '/brand'}>
          Continue Brand Engine
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={CalendarIcon}
        title="Content Calendar"
        subtitle="Plan, create, and schedule your content"
        action={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            {viewMode === 'calendar' && items.length > 0 && (
              <Button
                onClick={() => calendarSelectionMode ? exitSelectionMode() : setCalendarSelectionMode(true)}
                variant="ghost"
                size="sm"
                className={calendarSelectionMode ? 'bg-teal/10 text-teal' : ''}
              >
                <CursorArrowRaysIcon className="w-4 h-4 mr-2" />
                {calendarSelectionMode ? 'Exit Select' : 'Select'}
              </Button>
            )}
            <Button onClick={() => setShowBrandPanel(true)} variant="ghost" size="sm">
              <BeakerIcon className="w-4 h-4 mr-2" />
              Brand DNA
            </Button>
            <Button onClick={handleExport} variant="ghost" size="sm">
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
            {currentCalendar && (userRole === 'owner' || userRole === 'admin') && (
              <Button onClick={() => setShowClearModal(true)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Calendar
              </Button>
            )}
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              New Calendar
            </Button>
          </div>
        }
      />

      {/* Calendar selector */}
      {calendars.length > 1 && (
        <div className="flex gap-2">
          {calendars.map(cal => (
            <button
              key={cal.id}
              onClick={async () => {
                setCurrentCalendar(cal);
                await reloadItems(cal.id);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentCalendar?.id === cal.id
                  ? 'bg-teal text-cream'
                  : 'bg-cream-warm text-charcoal hover:bg-stone/10'
              }`}
            >
              {cal.name}
            </button>
          ))}
        </div>
      )}

      {/* Queue-based generation progress tracker */}
      {activeBatchId && (
        <GenerationBatchTracker
          batchId={activeBatchId}
          onComplete={handleBatchComplete}
          onCancel={handleBatchCancel}
          onProgress={handleBatchProgress}
        />
      )}

      {/* Approval queue */}
      {userCanApprove && pendingReviewItems.length > 0 && (
        <ApprovalQueue
          items={pendingReviewItems}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestRevision={handleRequestRevision}
          onItemClick={handleItemClick}
        />
      )}

      {/* Content Filters */}
      {items.length > 0 && (
        <ContentFilterBar
          filters={contentFilters}
          onChange={setContentFilters}
          totalCount={items.length}
          filteredCount={filteredItems.length}
        />
      )}

      {/* Content views */}
      {items.length > 0 ? (
        viewMode === 'calendar' ? (
          <CalendarView
            items={filteredItems}
            onItemClick={handleItemClick}
            onMovePost={handleMovePost}
            onAddPost={handleAddPost}
            selectionMode={calendarSelectionMode}
            selectedIds={calendarSelectedIds}
            onSelectionChange={setCalendarSelectedIds}
          />
        ) : viewMode === 'kanban' ? (
          <KanbanView
            items={filteredItems}
            onItemClick={handleItemClick}
            onStatusChange={async (itemId, newStatus) => {
              const res = await fetch(`/api/content/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
              });
              if (res.ok && currentCalendar) {
                await reloadItems(currentCalendar.id);
              }
            }}
          />
        ) : (
          <TableView
            items={filteredItems}
            onItemClick={handleItemClick}
            onBulkAction={handleBulkAction}
          />
        )
      ) : (
        <Card className="text-center py-16">
          <SparklesIcon className="w-16 h-16 mx-auto text-stone/30 mb-4" />
          <h3 className="text-heading-md text-charcoal mb-2">No Calendar Yet</h3>
          <p className="text-stone mb-6">Create your first content calendar to start planning and generating content.</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Calendar
          </Button>
        </Card>
      )}

      {/* Content editor slide panel */}
      {selectedItem && (
        <ContentEditor
          item={selectedItem}
          onSave={handleSaveItem}
          onClose={() => setSelectedItem(null)}
          onGenerate={handleGenerateContent}
          onApprove={userCanApprove ? handleApprove : undefined}
          onReject={userCanApprove ? handleReject : undefined}
          onRequestRevision={userCanApprove ? handleRequestRevision : undefined}
          onResubmit={handleResubmit}
          canApprove={userCanApprove}
          organizationId={organizationId || undefined}
        />
      )}

      {/* Quick create modal */}
      {quickCreateDate && (
        <QuickCreateModal
          date={quickCreateDate}
          onClose={() => setQuickCreateDate(null)}
          onCreate={handleQuickCreate}
        />
      )}

      {/* Create calendar modal */}
      {showCreateModal && (
        <CreateCalendarModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCalendar}
          isLoading={isGenerating}
          organizationId={organizationId}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Generate week modal */}
      {generateWeekModal && organizationId && (
        <GenerateWeekModal
          weekNumber={generateWeekModal.weekNumber}
          itemCount={generateWeekModal.itemCount}
          totalWeekItems={generateWeekModal.totalWeekItems}
          organizationId={organizationId}
          isGenerating={isGenerating}
          onGenerate={handleGenerateWeek}
          onClose={() => setGenerateWeekModal(null)}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Brand variables panel */}
      {organizationId && (
        <BrandVariablesPanel
          organizationId={organizationId}
          isOpen={showBrandPanel}
          onClose={() => setShowBrandPanel(false)}
        />
      )}

      {/* Floating selection toolbar */}
      {calendarSelectionMode && calendarSelectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl border border-stone/10 px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium text-charcoal">
            {calendarSelectedIds.size} selected
          </span>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setShowCalendarDeleteModal(true)}
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={exitSelectionMode}>
            <XMarkIcon className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      )}

      {/* Clear calendar confirmation modal */}
      {showClearModal && currentCalendar && (
        <DeleteConfirmationModal
          title="Delete Calendar"
          message={`Delete "${currentCalendar.name}" and all its content?`}
          itemCount={items.length}
          requireTypedConfirmation={currentCalendar.name}
          onConfirm={handleDeleteCalendar}
          onCancel={() => setShowClearModal(false)}
          isDeleting={isClearing}
        />
      )}

      {/* Calendar view selection delete modal */}
      {showCalendarDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Selected"
          message={`You are about to delete ${calendarSelectedIds.size} content ${calendarSelectedIds.size === 1 ? 'item' : 'items'}.`}
          itemCount={calendarSelectedIds.size}
          onConfirm={handleDeleteSelected}
          onCancel={() => setShowCalendarDeleteModal(false)}
          isDeleting={isDeletingSelected}
        />
      )}
    </div>
  );
}

/** Estimated post counts per frequency */
const FREQUENCY_EST_POSTS: Record<string, number> = {
  aggressive: 100,
  moderate: 50,
  light: 30,
};

/** 1 credit = 1 ZAR cent → 100 credits = R1.00 */
function creditsToRand(credits: number): string {
  return `R${(credits / 100).toFixed(2)}`;
}

function CreateCalendarModal({
  onClose,
  onCreate,
  isLoading,
  organizationId,
  isSuperAdmin: superAdmin = false,
}: {
  onClose: () => void;
  onCreate: (campaignName: string, startDate: string, endDate: string, frequency: 'aggressive' | 'moderate' | 'light', platforms?: string[], modelOverride?: string) => void;
  isLoading: boolean;
  organizationId: string | null;
  isSuperAdmin?: boolean;
}) {
  const [campaignName, setCampaignName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<'aggressive' | 'moderate' | 'light'>('aggressive');
  const [platforms, setPlatforms] = useState<string[]>(['linkedin', 'facebook', 'instagram']);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const { models } = useAvailableModels('content_generation');
  const { selectedModel: orgDefault } = useModelPreference(organizationId, 'content_generation');
  const { balance, isLoading: balanceLoading } = useCreditBalance(organizationId);

  const effectiveModelId = selectedModelId || orgDefault || null;
  const selectedModel = effectiveModelId ? models.find(m => m.id === effectiveModelId) : null;

  const estPosts = FREQUENCY_EST_POSTS[frequency] || 50;
  const estimatedCredits = selectedModel
    ? selectedModel.isFree ? 0 : selectedModel.estimatedCreditsPerMessage * estPosts
    : 0;
  const hasEnoughCredits = superAdmin || !selectedModel || selectedModel.isFree || (balance != null && balance.totalRemaining >= estimatedCredits);

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !startDate || !endDate) return;
    onCreate(campaignName.trim(), startDate, endDate, frequency, platforms, effectiveModelId || undefined);
  };

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-heading-lg text-charcoal mb-6">Create Campaign</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. February Launch Campaign"
              required
              className="w-full px-4 py-3 rounded-xl border border-stone/20 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone/20 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone/20 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Posting Frequency</label>
            <div className="space-y-2">
              {[
                { value: 'aggressive' as const, label: 'Aggressive', desc: '3-4 posts/day + medium/long-form videos' },
                { value: 'moderate' as const, label: 'Moderate', desc: '1-2 posts/day + medium videos + bi-weekly long-form' },
                { value: 'light' as const, label: 'Light', desc: '~1 post/day + medium videos + monthly long-form' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    frequency === opt.value ? 'border-teal bg-teal/5' : 'border-stone/20 hover:border-stone/40'
                  }`}
                >
                  <input type="radio" name="frequency" value={opt.value} checked={frequency === opt.value} onChange={() => setFrequency(opt.value)} className="sr-only" />
                  <div>
                    <p className="font-medium text-charcoal">{opt.label}</p>
                    <p className="text-xs text-stone">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Default Platforms</label>
            <div className="flex flex-wrap gap-2">
              {['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'].map(p => (
                <button
                  key={p}
                  type="button"
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

          {/* AI Model Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">AI Model</label>
            <div className="space-y-2">
              {models.map(model => (
                <button
                  key={model.id}
                  type="button"
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
                        {model.isFree ? 'Free' : `~${model.estimatedCreditsPerMessage} cr/post`}
                      </span>
                      {effectiveModelId === model.id && (
                        <CheckCircleIcon className="w-5 h-5 text-teal shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cost Estimate */}
          {selectedModel && (
            <div className="bg-cream-warm rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone">Estimated posts</span>
                <span className="font-semibold text-charcoal">~{estPosts}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone">Cost per post</span>
                <span className="font-medium text-charcoal">
                  {selectedModel.isFree ? (
                    <span className="text-teal flex items-center gap-1">
                      <BoltIcon className="w-3.5 h-3.5" /> Free
                    </span>
                  ) : (
                    `~${selectedModel.estimatedCreditsPerMessage} credits`
                  )}
                </span>
              </div>
              <div className="border-t border-stone/10 pt-2 flex items-center justify-between text-sm">
                <span className="font-medium text-charcoal">Estimated total</span>
                <div className="text-right">
                  <span className="font-semibold text-charcoal block">
                    {selectedModel.isFree ? (
                      <span className="text-teal flex items-center gap-1">
                        <BoltIcon className="w-3.5 h-3.5" /> Free
                      </span>
                    ) : (
                      `~${estimatedCredits.toLocaleString()} credits`
                    )}
                  </span>
                  {!selectedModel.isFree && (
                    <span className="text-xs text-stone">~{creditsToRand(estimatedCredits)}</span>
                  )}
                </div>
              </div>
              {!selectedModel.isFree && !balanceLoading && balance && (
                <div className="border-t border-stone/10 pt-2 flex items-center justify-between text-xs">
                  <span className="text-stone">Your balance</span>
                  <span className={hasEnoughCredits ? 'font-medium text-teal' : 'font-medium text-red-500'}>
                    {balance.totalRemaining.toLocaleString()} credits ({creditsToRand(balance.totalRemaining)})
                  </span>
                </div>
              )}
            </div>
          )}

          {!hasEnoughCredits && selectedModel && !selectedModel.isFree && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              Insufficient credits. Choose a free model or top up your balance.
            </p>
          )}

          <div className="flex gap-3">
            <Button type="button" onClick={onClose} variant="ghost" className="flex-1">Cancel</Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="flex-1"
              disabled={!campaignName.trim() || !startDate || !endDate || platforms.length === 0 || !effectiveModelId || (!hasEnoughCredits && selectedModel != null && !selectedModel.isFree)}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Create &amp; Generate All Content
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
