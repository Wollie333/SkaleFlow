import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access to the content item
    const { data: item } = await supabase
      .from('content_items')
      .select('organization_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', item.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: versions, error } = await supabase
      .from('content_versions')
      .select('id, version_number, changed_by, snapshot, created_at')
      .eq('content_item_id', itemId)
      .order('version_number', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to load versions' }, { status: 500 });
    }

    return NextResponse.json({ versions: versions || [] });
  } catch (error) {
    console.error('Load versions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the content item with full data for snapshot
    const { data: item } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', item.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the latest version number
    const { data: latestVersion } = await supabase
      .from('content_versions')
      .select('version_number')
      .eq('content_item_id', itemId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestVersion?.version_number || 0) + 1;

    const { data: version, error } = await supabase
      .from('content_versions')
      .insert({
        content_item_id: itemId,
        version_number: nextVersion,
        changed_by: user.id,
        snapshot: item as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      console.error('Create version error:', error);
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Create version error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
