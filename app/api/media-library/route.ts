import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

    const search = url.searchParams.get('search');
    const folder = url.searchParams.get('folder');

    let query = supabase
      .from('media_assets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (search) {
      query = query.ilike('file_name', `%${search}%`);
    }
    if (folder) {
      query = query.eq('folder', folder);
    }

    const { data: assets } = await query;

    return NextResponse.json({ assets: assets || [] });
  } catch (error) {
    console.error('Media library error:', error);
    return NextResponse.json({ error: 'Failed to load assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, file_url, file_name, file_type, file_size, tags, folder } = await request.json();

    if (!organizationId || !file_url) {
      return NextResponse.json({ error: 'organizationId and file_url required' }, { status: 400 });
    }

    const { data: asset, error } = await supabase
      .from('media_assets')
      .insert({
        organization_id: organizationId,
        file_url,
        file_name: file_name || 'Untitled',
        file_type: file_type || 'application/octet-stream',
        file_size: file_size || 0,
        tags: tags || [],
        folder: folder || null,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error('Media library save error:', error);
    return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { assetId } = await request.json();

    await supabase.from('media_assets').delete().eq('id', assetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media library delete error:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
