import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — list booking pages for org
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data, error } = await supabase
    .from('booking_pages')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create booking page
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('booking_pages')
    .insert({
      organization_id: member.organization_id,
      slug: body.slug,
      title: body.title,
      description: body.description || null,
      available_durations: body.availableDurations || [15, 30, 60],
      available_hours: body.availableHours || { start: '09:00', end: '17:00', timezone: 'Africa/Johannesburg', days: [1,2,3,4,5] },
      buffer_minutes: body.bufferMinutes || 15,
      max_advance_days: body.maxAdvanceDays || 30,
      intake_questions: body.intakeQuestions || [],
      branding: body.branding || {},
      default_call_type: body.defaultCallType || 'discovery',
      is_active: body.isActive !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
