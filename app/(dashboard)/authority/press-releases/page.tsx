'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface PressRelease {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, { text: string; bg: string; label: string }> = {
  draft: { text: '#6b7280', bg: '#f3f4f6', label: 'Draft' },
  in_review: { text: '#f59e0b', bg: '#fef3c7', label: 'In Review' },
  published: { text: '#22c55e', bg: '#dcfce7', label: 'Published' },
  archived: { text: '#9ca3af', bg: '#f3f4f6', label: 'Archived' },
};

export default function AuthorityPressReleasesPage() {
  const supabase = createClient();
  const router = useRouter();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (data?.organization_id) setOrganizationId(data.organization_id);
    }
    getOrg();
  }, []);

  const loadReleases = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const res = await fetch(`/api/authority/press-releases?organizationId=${organizationId}`);
    if (res.ok) setReleases(await res.json());
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  const handleCreate = async () => {
    if (!organizationId) return;
    const res = await fetch('/api/authority/press-releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, title: 'Untitled Press Release' }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/authority/press-releases/${data.id}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-6 h-6 text-teal" />
          <h1 className="text-2xl font-serif font-bold text-charcoal">Press Releases</h1>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Press Release
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse text-stone text-sm">Loading...</div>
        </div>
      ) : releases.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone/10 rounded-xl">
          <DocumentTextIcon className="w-10 h-10 text-stone/30 mx-auto mb-3" />
          <p className="text-sm text-stone">No press releases yet</p>
          <p className="text-xs text-stone/60 mt-1">Create one and use AI to generate content</p>
        </div>
      ) : (
        <div className="space-y-2">
          {releases.map((release) => {
            const statusConfig = STATUS_COLORS[release.status] || STATUS_COLORS.draft;
            return (
              <button
                key={release.id}
                onClick={() => router.push(`/authority/press-releases/${release.id}`)}
                className="w-full text-left p-4 bg-white border border-stone/10 rounded-xl hover:border-teal/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-semibold text-charcoal truncate">{release.title}</p>
                    {release.subtitle && (
                      <p className="text-xs text-stone mt-0.5 truncate">{release.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: statusConfig.text, backgroundColor: statusConfig.bg }}
                    >
                      {statusConfig.label}
                    </span>
                    <span className="text-[10px] text-stone">
                      {new Date(release.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
