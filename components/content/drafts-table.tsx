'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ActionModal } from '@/components/ui/action-modal';
import { FORMAT_LABELS } from '@/config/script-frameworks';

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700',
  facebook: 'bg-blue-50 text-blue-600',
  instagram: 'bg-pink-50 text-pink-600',
  twitter: 'bg-gray-100 text-gray-700',
  tiktok: 'bg-gray-100 text-gray-800',
  youtube: 'bg-red-50 text-red-600',
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface DraftItem {
  id: string;
  topic: string | null;
  platforms: string[] | null;
  format: string | null;
  ai_model: string | null;
  created_at: string;
  caption: string | null;
}

interface DraftsTableProps {
  items: DraftItem[];
}

export function DraftsTable({ items: initialItems }: DraftsTableProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [deleteTarget, setDeleteTarget] = useState<DraftItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/content/items/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } catch {
      // silently fail — modal closes
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone/10 bg-cream-warm/30">
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Platforms</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Format</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">AI Model</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Created</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone/5">
            {items.map(item => {
              const platforms = (item.platforms || []) as string[];
              const formatLabel = FORMAT_LABELS[item.format as keyof typeof FORMAT_LABELS] || item.format;

              return (
                <tr key={item.id} className="hover:bg-cream-warm/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/content/${item.id}`} className="group">
                      <p className="text-sm font-medium text-charcoal group-hover:text-teal transition-colors line-clamp-1 max-w-[300px]">
                        {item.topic || 'Untitled'}
                      </p>
                      {item.caption && (
                        <p className="text-xs text-stone mt-0.5 line-clamp-1 max-w-[300px]">{item.caption}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {platforms.map(p => (
                        <span
                          key={p}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[p] || 'bg-stone-100 text-stone-600'}`}
                        >
                          {PLATFORM_LABELS[p] || p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-stone">{formatLabel}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-stone font-mono">{item.ai_model || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-stone">{formatTimeAgo(item.created_at)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/content/${item.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-teal hover:bg-teal/10 transition-colors"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ActionModal
        open={!!deleteTarget}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        variant="error"
        title="Delete Draft?"
        subtitle={`"${deleteTarget?.topic || 'Untitled'}" will be permanently deleted. This cannot be undone.`}
        actions={[
          {
            label: deleting ? 'Deleting...' : 'Delete',
            onClick: handleDelete,
            variant: 'danger',
          },
          {
            label: 'Cancel',
            onClick: () => setDeleteTarget(null),
            variant: 'ghost',
          },
        ]}
      />
    </>
  );
}
