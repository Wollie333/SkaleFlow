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
  linkedin: 'bg-blue-500/10 text-blue-400',
  facebook: 'bg-blue-50 text-blue-600',
  instagram: 'bg-pink-50 text-pink-600',
  twitter: 'bg-cream text-charcoal',
  tiktok: 'bg-cream text-charcoal',
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
      <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone/10 bg-stone/5">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone uppercase tracking-wider">Platforms</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone uppercase tracking-wider">Format</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone uppercase tracking-wider">AI Model</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone uppercase tracking-wider">Created</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-stone uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {items.map(item => {
                const platforms = (item.platforms || []) as string[];
                const formatLabel = FORMAT_LABELS[item.format as keyof typeof FORMAT_LABELS] || item.format;

                return (
                  <tr key={item.id} className="hover:bg-stone/5 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/content/${item.id}`} className="group">
                        <p className="text-sm font-semibold text-charcoal group-hover:text-teal transition-colors line-clamp-2 max-w-[300px]">
                          {item.topic || 'Untitled'}
                        </p>
                        {item.caption && (
                          <p className="text-xs text-stone mt-1 line-clamp-2 max-w-[300px]">{item.caption}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {platforms.map(p => (
                          <span
                            key={p}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${PLATFORM_COLORS[p] || 'bg-cream text-stone'}`}
                          >
                            {PLATFORM_LABELS[p] || p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone font-medium">{formatLabel}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-stone font-mono bg-stone/10 px-2 py-1 rounded">{item.ai_model || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone">{formatTimeAgo(item.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/content/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-teal hover:bg-teal-dark transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
