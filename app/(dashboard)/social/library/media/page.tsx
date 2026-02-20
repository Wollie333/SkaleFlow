import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Media Library | SkaleFlow',
  description: 'Organize and manage your social media assets',
};

export default async function MediaLibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id').eq('user_id', user.id)
    
    .single();

  if (!membership?.organization_id) {
    redirect('/dashboard');
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-12 text-center">
        <h2 className="text-2xl font-bold text-charcoal mb-2">Media Library</h2>
        <p className="text-stone mb-4">Coming soon - Centralized media asset management</p>
      </div>
    </div>
  );
}
