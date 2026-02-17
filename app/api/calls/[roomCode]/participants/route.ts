import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET — list participants for a call by room code
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Find call by room code
  const { data: call } = await serviceClient
    .from('calls')
    .select('id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  // Exclude left/denied/kicked — only show active or pending participants
  const { data: participants, error } = await serviceClient
    .from('call_participants')
    .select('id, call_id, user_id, guest_name, guest_email, role, status, joined_at, left_at, consent_given, invite_method, created_at')
    .eq('call_id', call.id)
    .not('status', 'in', '("left","denied")')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Resolve user names for authenticated participants
  const userIds = participants
    .filter(p => p.user_id)
    .map(p => p.user_id as string);

  let userMap: Record<string, { full_name: string; email: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await serviceClient
      .from('users')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds);

    if (users) {
      userMap = Object.fromEntries(users.map(u => [u.id, { full_name: u.full_name || 'Unknown', email: u.email, avatar_url: u.avatar_url }]));
    }
  }

  const enriched = participants.map(p => ({
    ...p,
    name: p.guest_name || userMap[p.user_id || '']?.full_name || 'Unknown',
    email: p.guest_email || userMap[p.user_id || '']?.email || null,
    avatar_url: userMap[p.user_id || '']?.avatar_url || null,
  }));

  // Deduplicate: keep one entry per user_id (prefer in_call > waiting > invited)
  const statusPriority: Record<string, number> = { in_call: 3, waiting: 2, invited: 1 };
  const seen = new Map<string, typeof enriched[0]>();
  const deduped: typeof enriched = [];

  for (const p of enriched) {
    if (p.user_id) {
      const prev = seen.get(p.user_id);
      if (prev) {
        // Keep the one with higher-priority status
        if ((statusPriority[p.status] || 0) > (statusPriority[prev.status] || 0)) {
          seen.set(p.user_id, p);
        }
        continue;
      }
      seen.set(p.user_id, p);
    }
    deduped.push(p);
  }

  // Replace any swapped entries
  const result = deduped.map(p => p.user_id && seen.has(p.user_id) ? seen.get(p.user_id)! : p);

  return NextResponse.json(result);
}

// POST — register a participant (guest or authenticated user joining)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const serviceClient = createServiceClient();

  // Find call by room code
  const { data: call } = await serviceClient
    .from('calls')
    .select('id, host_user_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const body = await request.json();
  const { userId, guestName, guestEmail, role } = body as {
    userId?: string;
    guestName?: string;
    guestEmail?: string;
    role?: string;
  };

  // Check if participant already exists (use limit(1) — .single() fails on multiple rows)
  if (userId) {
    const { data: existingRows } = await serviceClient
      .from('call_participants')
      .select('id, status')
      .eq('call_id', call.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    const existing = existingRows?.[0] || null;

    if (existing) {
      // Update status to in_call if they were invited/left
      const newStatus = userId === call.host_user_id ? 'in_call' : existing.status;
      if (existing.status === 'invited' || existing.status === 'left') {
        await serviceClient
          .from('call_participants')
          .update({ status: newStatus === 'invited' ? 'in_call' : newStatus, joined_at: new Date().toISOString() })
          .eq('id', existing.id);
      }

      // Clean up any duplicate rows for this user
      if (existingRows && existingRows.length > 1) {
        const dupeIds = existingRows.slice(1).map(r => r.id);
        await serviceClient.from('call_participants').delete().in('id', dupeIds);
      }

      return NextResponse.json({ ...existing, status: newStatus === 'invited' ? 'in_call' : existing.status });
    }
  }

  // Check for existing guest by email
  if (guestEmail) {
    const { data: existingRows } = await serviceClient
      .from('call_participants')
      .select('id, status')
      .eq('call_id', call.id)
      .eq('guest_email', guestEmail)
      .order('created_at', { ascending: true })
      .limit(1);

    const existing = existingRows?.[0] || null;

    if (existing) {
      return NextResponse.json(existing);
    }
  }

  // Determine initial status: host/team = in_call, guest = waiting
  const isHost = userId === call.host_user_id;
  const participantRole = (role || (isHost ? 'host' : (userId ? 'team_member' : 'guest'))) as 'host' | 'team_member' | 'guest';
  const initialStatus: 'waiting' | 'in_call' = participantRole === 'guest' ? 'waiting' : 'in_call';

  const { data: participant, error } = await serviceClient
    .from('call_participants')
    .insert({
      call_id: call.id,
      user_id: userId || null,
      guest_name: guestName || null,
      guest_email: guestEmail || null,
      role: participantRole,
      status: initialStatus,
      joined_at: initialStatus === 'in_call' ? new Date().toISOString() : null,
      consent_given: true,
      invite_method: 'link',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(participant, { status: 201 });
}
