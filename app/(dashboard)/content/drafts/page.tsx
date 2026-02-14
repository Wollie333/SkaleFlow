import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { DraftsTable } from '@/components/content/drafts-table';

export default async function DraftsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) redirect('/dashboard');

  const { data: drafts } = await supabase
    .from('content_items')
    .select('id, topic, platforms, format, ai_model, created_at, caption')
    .eq('organization_id', membership.organization_id)
    .eq('status', 'scripted')
    .order('created_at', { ascending: false })
    .limit(100);

  const items = (drafts || []).map(d => ({
    ...d,
    platforms: (d.platforms || []) as string[],
  }));

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Drafts"
        subtitle={`${items.length} draft${items.length !== 1 ? 's' : ''} ready for review and scheduling`}
      />

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No drafts yet</h3>
          <p className="text-sm text-stone mb-6">Generate some content from the Content Machine and it will appear here.</p>
          <Link
            href="/content/machine"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
          >
            <SparklesIcon className="w-4 h-4" />
            Go to Content Machine
          </Link>
        </div>
      ) : (
        <DraftsTable items={items} />
      )}
    </div>
  );
}
