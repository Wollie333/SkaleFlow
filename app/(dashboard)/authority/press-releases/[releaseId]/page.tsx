'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PressReleaseEditor } from '@/components/authority/press-release-editor';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import type { AuthorityPressReleaseStatus } from '@/lib/authority/types';

interface PressRelease {
  id: string;
  organization_id: string;
  title: string;
  subtitle: string | null;
  headline: string;
  body_content: string;
  status: AuthorityPressReleaseStatus;
  boilerplate: string | null;
  contact_info: string | null;
  seo_keywords: string[] | null;
  published_at: string | null;
}

export default function PressReleaseEditorPage() {
  const router = useRouter();
  const params = useParams();
  const releaseId = params.releaseId as string;
  const supabase = createClient();

  const [release, setRelease] = useState<PressRelease | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (data?.organization_id) setOrganizationId(data.organization_id);
    }
    getOrg();
  }, []);

  const loadRelease = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/authority/press-releases/${releaseId}`);
    if (res.ok) setRelease(await res.json());
    setLoading(false);
  }, [releaseId]);

  useEffect(() => {
    loadRelease();
  }, [loadRelease]);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/authority/press-releases/${releaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save press release:', err);
      }
    } catch (err) {
      console.error('Press release save error:', err);
    }
    loadRelease();
  };

  const handleDelete = async () => {
    await fetch(`/api/authority/press-releases/${releaseId}`, { method: 'DELETE' });
    router.push('/authority/press-releases');
  };

  if (loading || !release) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-pulse text-stone text-sm">Loading press release...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => router.push('/authority/press-releases')}
        className="flex items-center gap-1.5 text-xs text-stone hover:text-teal mb-4 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Back to Press Releases
      </button>

      <div className="bg-cream-warm border border-stone/10 rounded-xl p-6 shadow-sm">
        <PressReleaseEditor
          release={release}
          organizationId={organizationId || release.organization_id}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
