'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CheckCircleIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { FunnelStage, StoryBrandStage, TimeSlot, ContentStatus } from '@/types/database';

interface BaseContentItem {
  id: string;
  scheduled_date: string;
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
  status: ContentStatus;
  media_urls?: string[] | null;
  [key: string]: unknown;
}

interface CalendarViewProps {
  items: BaseContentItem[];
  onItemClick: (item: BaseContentItem) => void;
  onMonthChange?: (date: Date) => void;
  onMovePost?: (itemId: string, newDate: string) => void;
  onAddPost?: (date: Date) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

const TIME_SLOT_ORDER: TimeSlot[] = ['AM', 'PM', 'MID', 'EVE'];

const FUNNEL_COLORS: Record<FunnelStage, string> = {
  awareness: 'bg-green-100 text-green-800 hover:bg-green-200',
  consideration: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  conversion: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
};

const PLATFORM_DOTS: Record<string, string> = {
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-500',
  instagram: 'bg-pink-500',
  twitter: 'bg-sky-400',
  tiktok: 'bg-black',
};

function SelectablePost({
  item,
  isSelected,
  onToggle,
}: {
  item: BaseContentItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  const isPublished = item.status === 'published';
  return (
    <button
      onClick={() => onToggle(item.id)}
      className={cn(
        'w-full text-left px-2 py-1 rounded text-xs truncate transition-colors',
        isPublished ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 ring-1 ring-emerald-300' : FUNNEL_COLORS[item.funnel_stage],
        isSelected && 'ring-2 ring-teal ring-offset-1'
      )}
    >
      <div className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(item.id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-stone/30 w-3 h-3 shrink-0"
        />
        {isPublished && <CheckCircleIcon className="w-3 h-3 shrink-0 text-emerald-600" />}
        <span className="font-medium">{item.time_slot}</span>
        <span className="truncate flex-1">
          {item.topic || item.format.replace(/_/g, ' ')}
        </span>
      </div>
    </button>
  );
}

function DraggablePost({ item, onItemClick }: { item: BaseContentItem; onItemClick: (item: BaseContentItem) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });
  const isPublished = item.status === 'published';
  const hasMedia = item.media_urls && item.media_urls.length > 0;
  const thumbnail = hasMedia ? item.media_urls[0] : null;

  // Get status badge color
  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'approved': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'pending_review': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  // Get funnel stage indicator color
  const getFunnelColor = (stage: FunnelStage) => {
    switch (stage) {
      case 'awareness': return 'bg-green-500';
      case 'consideration': return 'bg-blue-500';
      case 'conversion': return 'bg-orange-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onItemClick(item)}
      className={cn(
        'group relative bg-white rounded-lg border border-stone/10 overflow-hidden hover:shadow-md transition-all cursor-pointer',
        isDragging && 'opacity-30'
      )}
    >
      {/* Thumbnail */}
      {hasMedia && thumbnail && (
        <div className="aspect-video w-full bg-stone/5 overflow-hidden">
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-2 space-y-1.5">
        {/* Header: Time + Status */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-teal">{item.time_slot}</span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', getStatusColor(item.status))}>
            {item.status.replace('_', ' ')}
          </span>
        </div>

        {/* Content preview */}
        <p className="text-[11px] text-charcoal line-clamp-2 leading-tight">
          {item.caption || item.topic || item.format.replace(/_/g, ' ')}
        </p>

        {/* Metadata row */}
        <div className="flex items-center justify-between">
          {/* Platform dots */}
          <div className="flex -space-x-1">
            {item.platforms.slice(0, 4).map(p => (
              <div
                key={p}
                className={cn('w-4 h-4 rounded-full border-2 border-white', PLATFORM_DOTS[p] || 'bg-stone')}
                title={p}
              />
            ))}
            {item.platforms.length > 4 && (
              <div className="w-4 h-4 rounded-full border-2 border-white bg-stone text-[8px] text-white flex items-center justify-center">
                +{item.platforms.length - 4}
              </div>
            )}
          </div>

          {/* Funnel stage indicator */}
          <div className={cn('w-2 h-2 rounded-full', getFunnelColor(item.funnel_stage))} title={item.funnel_stage} />
        </div>
      </div>

      {/* Hover actions overlay */}
      <div className="absolute inset-0 bg-charcoal/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onItemClick(item);
          }}
          className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
          title="View"
        >
          <EyeIcon className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onItemClick(item);
          }}
          className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
          title="Edit"
        >
          <PencilIcon className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle delete
          }}
          className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
          title="Delete"
        >
          <TrashIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

function DroppableDay({
  day,
  isCurrentMonth,
  dayItems,
  onItemClick,
  onAddPost,
  selectionMode,
  selectedIds,
  onToggleSelection,
}: {
  day: Date;
  isCurrentMonth: boolean;
  dayItems: BaseContentItem[];
  onItemClick: (item: BaseContentItem) => void;
  onAddPost?: (date: Date) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
}) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  return (
    <div
      ref={selectionMode ? undefined : setNodeRef}
      className={cn(
        'min-h-[180px] p-2 border-r border-b border-stone/5 relative group',
        !isCurrentMonth && 'bg-stone/5',
        isToday(day) && 'bg-teal/5',
        !selectionMode && isOver && 'bg-teal/10 ring-2 ring-inset ring-teal/30'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className={cn(
            'text-sm font-medium',
            !isCurrentMonth && 'text-stone/40',
            isToday(day) && 'text-teal font-bold'
          )}
        >
          {format(day, 'd')}
        </p>
        {!selectionMode && onAddPost && (
          <button
            onClick={() => onAddPost(day)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-teal/10 transition-all"
          >
            <PlusIcon className="w-4 h-4 text-teal" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {dayItems.slice(0, 4).map(item => (
          selectionMode && selectedIds && onToggleSelection ? (
            <SelectablePost
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggle={onToggleSelection}
            />
          ) : (
            <DraggablePost key={item.id} item={item} onItemClick={onItemClick} />
          )
        ))}
        {dayItems.length > 4 && (
          <p className="text-xs text-stone/60 px-2 py-1 text-center">
            +{dayItems.length - 4} more
          </p>
        )}
      </div>
    </div>
  );
}

export function CalendarView({ items, onItemClick, onMonthChange, onMovePost, onAddPost, selectionMode, selectedIds, onSelectionChange }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeItem, setActiveItem] = useState<BaseContentItem | null>(null);

  const defaultSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const emptySensors = useSensors();
  const sensors = selectionMode ? emptySensors : defaultSensors;

  const handlePreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDragStart = (event: DragStartEvent) => {
    if (selectionMode) return;
    const item = event.active.data.current?.item as BaseContentItem;
    setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (selectionMode) return;
    setActiveItem(null);
    const { active, over } = event;
    if (!over || !onMovePost) return;

    const itemId = active.id as string;
    const newDate = over.id as string;
    const oldItem = items.find(i => i.id === itemId);

    if (oldItem && oldItem.scheduled_date !== newDate) {
      onMovePost(itemId, newDate);
    }
  };

  const handleToggleSelection = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(new Set(items.map(i => i.id)));
  };

  const handleDeselectAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(new Set());
  };

  const allSelected = selectedIds && selectedIds.size === items.length && items.length > 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-xl border border-stone/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone/10 flex items-center justify-between">
          <h2 className="text-heading-md text-charcoal">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            {selectionMode && (
              <button
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="px-3 py-1 text-sm font-medium text-teal hover:bg-teal/10 rounded-lg transition-colors"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
            <button onClick={handlePreviousMonth} className="p-2 rounded-lg hover:bg-cream-warm transition-colors">
              <ChevronLeftIcon className="w-5 h-5 text-stone" />
            </button>
            <button
              onClick={() => { setCurrentMonth(new Date()); onMonthChange?.(new Date()); }}
              className="px-3 py-1 text-sm font-medium text-teal hover:bg-teal/10 rounded-lg transition-colors"
            >
              Today
            </button>
            <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-cream-warm transition-colors">
              <ChevronRightIcon className="w-5 h-5 text-stone" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-stone/10">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-stone">{day}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayItems = items
              .filter(item => item.scheduled_date === dateStr)
              .sort((a, b) => TIME_SLOT_ORDER.indexOf(a.time_slot) - TIME_SLOT_ORDER.indexOf(b.time_slot));

            return (
              <DroppableDay
                key={i}
                day={day}
                isCurrentMonth={isSameMonth(day, currentMonth)}
                dayItems={dayItems}
                onItemClick={onItemClick}
                onAddPost={onAddPost}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-stone/10 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100" />
            <span className="text-xs text-stone">Awareness</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100" />
            <span className="text-xs text-stone">Consideration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-100" />
            <span className="text-xs text-stone">Conversion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />
            <span className="text-xs text-stone">Published</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {Object.entries(PLATFORM_DOTS).map(([p, color]) => (
              <div key={p} className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', color)} />
                <span className="text-xs text-stone capitalize">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem && (
          <div className={cn(
            'px-3 py-1.5 rounded text-xs font-medium shadow-lg',
            FUNNEL_COLORS[activeItem.funnel_stage]
          )}>
            {activeItem.time_slot} • {activeItem.topic || activeItem.format.replace(/_/g, ' ')}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
