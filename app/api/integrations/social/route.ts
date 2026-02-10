import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: List all social connections for user's org
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const { data: connections, error } = await supabase
    .from('social_media_connections')
    .select('id, organization_id, platform, platform_username, platform_page_name, is_active, connected_at, token_expires_at')
    .eq('organization_id', membership.organization_id)
    .order('platform');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connections });
}
