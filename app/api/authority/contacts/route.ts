import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // hasPipelineCard filter — only return contacts that have pipeline cards
  const hasPipelineCard = searchParams.get('hasPipelineCard');
  let pipelineContactIds: string[] | null = null;
  if (hasPipelineCard === 'true') {
    const { data: cards } = await db
      .from('authority_pipeline_cards')
      .select('contact_id')
      .eq('organization_id', organizationId)
      .not('contact_id', 'is', null);

    pipelineContactIds = Array.from(new Set((cards || []).map((c: { contact_id: string | null }) => c.contact_id).filter(Boolean) as string[]));
    if (pipelineContactIds.length === 0) {
      return NextResponse.json([]);
    }
  }

  // Build query
  let query = db
    .from('authority_contacts')
    .select('*')
    .eq('organization_id', organizationId);

  if (pipelineContactIds) {
    query = query.in('id', pipelineContactIds);
  }

  // Search filter
  const search = searchParams.get('search');
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,outlet.ilike.%${search}%`);
  }

  // Warmth filter
  const warmth = searchParams.get('warmth') as import('@/types/database').AuthorityContactWarmth | null;
  if (warmth) {
    query = query.eq('warmth', warmth);
  }

  // Role filter
  const role = searchParams.get('role');
  if (role) {
    query = query.eq('role', role);
  }

  // Outlet filter
  const outlet = searchParams.get('outlet');
  if (outlet) {
    query = query.ilike('outlet', `%${outlet}%`);
  }

  const { data: contacts, error } = await query.order('full_name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(contacts || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, full_name, email, ...rest } = body;

  if (!organizationId || !full_name) {
    return NextResponse.json({ error: 'organizationId and full_name required' }, { status: 400 });
  }

  // Verify owner/admin (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized || !['owner', 'admin'].includes(access.role!)) {
    return NextResponse.json({ error: 'Only owners and admins can create contacts' }, { status: 403 });
  }
  const db = access.queryClient;

  // Duplicate detection by email
  let duplicates: { id: string; full_name: string; email: string | null; outlet: string | null }[] = [];
  if (email) {
    const normalised = email.toLowerCase().trim();
    const { data: existing } = await db
      .from('authority_contacts')
      .select('id, full_name, email, outlet')
      .eq('organization_id', organizationId)
      .eq('email_normalised', normalised);

    if (existing && existing.length > 0) {
      duplicates = existing;
    }
  }

  // If duplicates found and not force-creating, return them
  if (duplicates.length > 0 && !body.force) {
    return NextResponse.json({
      warning: 'potential_duplicate',
      duplicates,
      message: `A contact with email "${email}" already exists`,
    }, { status: 409 });
  }

  const { data: contact, error } = await db
    .from('authority_contacts')
    .insert({
      organization_id: organizationId,
      full_name,
      email: email || null,
      phone: rest.phone || null,
      outlet: rest.outlet || null,
      role: rest.role || null,
      beat: rest.beat || null,
      location: rest.location || null,
      linkedin_url: rest.linkedin_url || null,
      twitter_url: rest.twitter_url || null,
      website_url: rest.website_url || null,
      warmth: rest.warmth || 'cold',
      source: rest.source || 'manual',
      notes: rest.notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create pipeline card so contact appears in My Contacts
  if (contact) {
    const { data: firstStage } = await db
      .from('authority_pipeline_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .order('position', { ascending: true })
      .limit(1)
      .single();

    if (firstStage) {
      await db.from('authority_pipeline_cards').insert({
        organization_id: organizationId,
        contact_id: contact.id,
        stage_id: firstStage.id,
        opportunity_name: full_name,
        category: 'media_placement',
      });
    }
  }

  return NextResponse.json(contact, { status: 201 });
}
