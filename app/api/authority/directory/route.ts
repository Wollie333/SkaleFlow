import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeSearch } from '@/lib/sanitize-search';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const country = searchParams.get('country');
  const city = searchParams.get('city');
  const industry = searchParams.get('industry');
  const savedOnly = searchParams.get('savedOnly') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  // If savedOnly, get saved contact IDs first
  let savedContactIds: string[] = [];
  if (savedOnly) {
    const { data: saves } = await supabase
      .from('pr_directory_saves')
      .select('contact_id')
      .eq('user_id', user.id);
    savedContactIds = (saves || []).map(s => s.contact_id);
    if (savedContactIds.length === 0) {
      return NextResponse.json({ contacts: [], total: 0, page, totalPages: 0 });
    }
  }

  // Build query
  let query = supabase
    .from('pr_directory_contacts')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const s = sanitizeSearch(search);
    query = query.or(`full_name.ilike.%${s}%,company.ilike.%${s}%,description.ilike.%${s}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (country) {
    query = query.eq('country', country);
  }
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }
  if (industry) {
    query = query.contains('industry_types', [industry]);
  }
  if (savedOnly && savedContactIds.length > 0) {
    query = query.in('id', savedContactIds);
  }

  const { data: contacts, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get user's saves to mark is_saved
  const { data: userSaves } = await supabase
    .from('pr_directory_saves')
    .select('contact_id')
    .eq('user_id', user.id);
  const savedSet = new Set((userSaves || []).map(s => s.contact_id));

  // Look up added_by user names
  const addedByIds = Array.from(new Set((contacts || []).map((c: Record<string, unknown>) => c.added_by as string).filter(Boolean)));
  const nameMap: Record<string, string> = {};
  if (addedByIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', addedByIds);
    (users || []).forEach((u: { id: string; full_name: string | null }) => {
      if (u.full_name) nameMap[u.id] = u.full_name;
    });
  }

  const enriched = (contacts || []).map((c: Record<string, unknown>) => ({
    ...c,
    added_by_name: nameMap[(c.added_by as string) || ''] || null,
    is_saved: savedSet.has(c.id as string),
  }));

  const total = count || 0;

  return NextResponse.json({
    contacts: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { full_name, category, ...rest } = body;

  if (!full_name || !category) {
    return NextResponse.json({ error: 'full_name and category are required' }, { status: 400 });
  }

  // Get user's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const { data: contact, error } = await supabase
    .from('pr_directory_contacts')
    .insert({
      full_name,
      category,
      company: rest.company || null,
      job_title: rest.job_title || null,
      email: rest.email || null,
      phone: rest.phone || null,
      photo_url: rest.photo_url || null,
      description: rest.description || null,
      website_url: rest.website_url || null,
      social_links: rest.social_links || {},
      industry_types: rest.industry_types || [],
      country: rest.country || null,
      city: rest.city || null,
      province_state: rest.province_state || null,
      added_by: user.id,
      added_by_org_id: membership?.organization_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(contact, { status: 201 });
}
