import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InboxClient } from './inbox-client';

export const metadata = {
  title: 'Social Inbox | SkaleFlow',
  description: 'Manage all your social media interactions in one place',
};

export default async function SocialInboxPage({
  searchParams,
}: {
  searchParams: { type?: string; platform?: string; sentiment?: string; status?: string };
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role, org_role')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    redirect('/onboarding');
  }

  // Initialize data with defaults
  let interactions: any[] = [];
  let unreadCount = 0;
  let teamMembers: any[] = [];
  let savedReplies: any[] = [];

  try {
    // Fetch interactions with filters
    const type = searchParams.type || 'all';
    const platform = searchParams.platform || 'all';
    const sentiment = searchParams.sentiment || 'all';
    const status = searchParams.status === 'unread' ? false : searchParams.status === 'read' ? true : undefined;

    // Simplified query without complex joins for now
    let query = supabase
      .from('social_interactions')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('interaction_timestamp', { ascending: false })
      .limit(50);

    // Apply filters
    if (type !== 'all') {
      query = query.eq('interaction_type', type);
    }

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (sentiment !== 'all') {
      query = query.eq('sentiment', sentiment);
    }

    if (status !== undefined) {
      query = query.eq('is_read', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching interactions:', error);
    } else {
      interactions = data || [];
    }

    // Get unread count
    const { count } = await supabase
      .from('social_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id)
      .eq('is_read', false);

    unreadCount = count || 0;

    // Get team members for assignment
    const { data: members } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organization_id', userData.organization_id)
      .order('full_name');

    teamMembers = members || [];

    // Get saved replies
    const { data: replies } = await supabase
      .from('saved_replies')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('use_count', { ascending: false });

    savedReplies = replies || [];
  } catch (error) {
    console.error('Error loading inbox data:', error);
    // Continue with empty data - UI will show empty states
  }

  return (
    <InboxClient
      interactions={interactions || []}
      unreadCount={unreadCount || 0}
      teamMembers={teamMembers || []}
      savedReplies={savedReplies || []}
      initialFilters={{
        type: type as any,
        platform: platform as any,
        sentiment: sentiment as any,
        status: searchParams.status as any,
      }}
    />
  );
}
