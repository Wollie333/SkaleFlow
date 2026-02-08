import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedDriveToken, listDriveFiles } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const accessToken = await getAuthenticatedDriveToken(membership.organization_id);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 404 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('query') || undefined;
    const folderId = url.searchParams.get('folderId') || undefined;
    const pageToken = url.searchParams.get('pageToken') || undefined;
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

    const result = await listDriveFiles(accessToken, {
      query,
      folderId,
      pageToken,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Google Drive files error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
