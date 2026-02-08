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

    const { data: tags } = await supabase
      .from('content_tags')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    return NextResponse.json({ tags: tags || [] });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json({ error: 'Failed to load tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, name, color } = await request.json();

    if (!organizationId || !name) {
      return NextResponse.json({ error: 'organizationId and name are required' }, { status: 400 });
    }

    // Random color if not provided
    const tagColor = color || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    const { data: tag, error } = await supabase
      .from('content_tags')
      .insert({ organization_id: organizationId, name, color: tagColor })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tagId } = await request.json();

    await supabase.from('content_tags').delete().eq('id', tagId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
