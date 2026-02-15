import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

// Map DB column names to client-expected names
function mapAngleForClient(angle: Record<string, unknown>) {
  return {
    ...angle,
    // Client expects target_outlets & recommended_format
    target_outlets: angle.suggested_outlets ?? null,
    recommended_format: angle.category ?? null,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data, error } = await db
    .from('authority_story_angles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data || []).map(mapAngleForClient));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, title, description } = body;
  if (!organizationId || !title) return NextResponse.json({ error: 'organizationId and title required' }, { status: 400 });

  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Accept both old (target_outlets, recommended_format) and new (suggested_outlets, category) field names
  const suggestedOutlets = body.suggested_outlets || body.target_outlets || null;
  const category = body.category || body.recommended_format || null;

  const { data, error } = await db
    .from('authority_story_angles')
    .insert({
      organization_id: organizationId,
      title,
      description: description || null,
      suggested_outlets: suggestedOutlets,
      category,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapAngleForClient(data), { status: 201 });
}
