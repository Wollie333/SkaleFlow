'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button, Badge, StatusBadge } from '@/components/ui';
import { ChevronUpDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { FORMAT_LABELS, type ContentFormat } from '@/config/script-frameworks';
import { DeleteConfirmationModal } from './delete-confirmation-modal';
import type { FunnelStage, StoryBrandStage, TimeSlot, ContentStatus } from '@/types/database';

interface ContentItem {
  id: string;
  scheduled_date: string;
  time_slot: TimeSlot;
  funnel_stage: FunnelStage;
  storybrand_stage: StoryBrandStage;
  format: string;
  topic: string | null;
  hook: string | null;
  platforms: string[];
  status: ContentStatus;
  assigned_to: string | null;
  [key: string]: unknown;
}

interface TableViewProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
  onBulkAction: (itemIds: string[], action: string, value?: string) => Promise<void>;
}

type SortField = 'scheduled_date' | 'status' | 'funnel_stage';
type SortDir = 'asc' | 'desc';

export function TableView({ items, onItemClick, onBulkAction }: TableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('scheduled_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterStatus, setFilterStatus] = useState<ContentStatus | ''>('');
  const [filterFunnel, setFilterFunnel] = useState<FunnelStage | ''>('');
  const [filterPlatform, setFilterPlatform] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...items];
    if (filterStatus) result = result.filter(i => i.status === filterStatus);
    if (filterFunnel) result = result.filter(i => i.funnel_stage === filterFunnel);
    if (filterPlatform) result = result.filter(i => i.platforms.includes(filterPlatform));

    result.sort((a, b) => {
      const av = a[sortField] || '';
      const bv = b[sortField] || '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [items, filterStatus, filterFunnel, filterPlatform, sortField, sortDir]);

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkAction = async (action: string, value?: string) => {
    await onBulkAction(Array.from(selectedIds), action, value);
    setSelectedIds(new Set());
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-stone hover:text-charcoal"
    >
      {children}
      <ChevronUpDownIcon className="w-3 h-3" />
    </button>
  );

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-stone/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone">{selectedIds.size} selected</span>
              <Button size="sm" variant="ghost" onClick={() => handleBulkAction('approve')}>Approve</Button>
              <Button size="sm" variant="ghost" onClick={() => handleBulkAction('change_status', 'scheduled')}>Schedule</Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            showFilters ? 'bg-teal/10 text-teal' : 'text-stone hover:bg-cream'
          )}
        >
          <FunnelIcon className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-stone/10 flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ContentStatus | '')}
            className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm"
          >
            <option value="">All Statuses</option>
            {['idea', 'scripted', 'pending_review', 'approved', 'rejected', 'filming', 'filmed', 'designing', 'designed', 'editing', 'edited', 'scheduled', 'published'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={filterFunnel}
            onChange={e => setFilterFunnel(e.target.value as FunnelStage | '')}
            className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm"
          >
            <option value="">All Funnel Stages</option>
            <option value="awareness">Awareness</option>
            <option value="consideration">Consideration</option>
            <option value="conversion">Conversion</option>
          </select>
          <select
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm"
          >
            <option value="">All Platforms</option>
            {['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone/10 bg-stone/5">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded border-stone/30"
                />
              </th>
              <th className="px-3 py-3 text-left"><SortHeader field="scheduled_date">Date</SortHeader></th>
              <th className="px-3 py-3 text-left text-xs font-medium text-stone">Time</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-stone">Topic / Hook</th>
              <th className="px-3 py-3 text-left"><SortHeader field="funnel_stage">Funnel</SortHeader></th>
              <th className="px-3 py-3 text-left text-xs font-medium text-stone">Format</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-stone">Platforms</th>
              <th className="px-3 py-3 text-left"><SortHeader field="status">Status</SortHeader></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone/5">
            {filtered.map(item => (
              <tr
                key={item.id}
                className={cn(
                  'hover:bg-cream/50 transition-colors cursor-pointer',
                  selectedIds.has(item.id) && 'bg-teal/5'
                )}
              >
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="rounded border-stone/30"
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap" onClick={() => onItemClick(item)}>
                  {format(new Date(item.scheduled_date), 'MMM d')}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-stone" onClick={() => onItemClick(item)}>
                  {item.time_slot}
                </td>
                <td className="px-3 py-3 max-w-[200px]" onClick={() => onItemClick(item)}>
                  <p className="truncate font-medium text-charcoal">
                    {item.topic || 'Untitled'}
                  </p>
                  {item.hook && (
                    <p className="truncate text-xs text-stone italic">{item.hook}</p>
                  )}
                </td>
                <td className="px-3 py-3" onClick={() => onItemClick(item)}>
                  <Badge variant={item.funnel_stage} className="text-xs">
                    {item.funnel_stage}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-xs text-stone whitespace-nowrap" onClick={() => onItemClick(item)}>
                  {FORMAT_LABELS[item.format as ContentFormat] || item.format.replace(/_/g, ' ')}
                </td>
                <td className="px-3 py-3" onClick={() => onItemClick(item)}>
                  <div className="flex gap-1">
                    {item.platforms.slice(0, 3).map(p => (
                      <span key={p} className="px-1.5 py-0.5 bg-stone/5 rounded text-xs capitalize">{p.substring(0, 2)}</span>
                    ))}
                    {item.platforms.length > 3 && (
                      <span className="text-xs text-stone">+{item.platforms.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3" onClick={() => onItemClick(item)}>
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-stone text-sm">
          No content items match your filters
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          title="Delete Selected"
          message={`You are about to delete ${selectedIds.size} content ${selectedIds.size === 1 ? 'item' : 'items'}.`}
          itemCount={selectedIds.size}
          onConfirm={async () => {
            setIsDeleting(true);
            await handleBulkAction('delete');
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
