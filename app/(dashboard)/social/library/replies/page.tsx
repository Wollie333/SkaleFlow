import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Saved Replies | SkaleFlow',
  description: 'Manage quick response templates for social media',
};

export default async function SavedRepliesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    redirect('/onboarding');
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
        <h2 className="text-2xl font-bold text-charcoal mb-2">Saved Replies</h2>
        <p className="text-stone mb-4">Coming soon - Quick response templates for social engagement</p>
      </div>
    </div>
  );
}
