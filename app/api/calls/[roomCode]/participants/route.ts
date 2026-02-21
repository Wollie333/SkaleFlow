import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Force dynamic — never cache participant list
export const dynamic = 'force-dynamic';

// GET — list participants for a call by room code
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
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

  // Simple dedup: keep one entry per user_id (highest-priority status wins)
  const statusPriority: Record<string, number> = { in_call: 3, waiting: 2, invited: 1 };
  const seenUserIds = new Map<string, number>();
  const result: typeof enriched = [];

  for (const p of enriched) {
    if (p.user_id) {
      const prevIdx = seenUserIds.get(p.user_id);
      if (prevIdx !== undefined) {
        // Replace if this entry has higher priority
        if ((statusPriority[p.status] || 0) > (statusPriority[result[prevIdx].status] || 0)) {
          result[prevIdx] = p;
        }
        continue;
      }
      seenUserIds.set(p.user_id, result.length);
    }
    result.push(p);
  }

  return NextResponse.json(result);
}

// POST — register a participant (guest or authenticated user joining)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const serviceClient = createServiceClient();

  // Find call by room code (include org_id for CRM contact creation)
  const { data: call } = await serviceClient
    .from('calls')
    .select('id, host_user_id, organization_id, crm_contact_id')
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
      // Reset to waiting if they previously left or were denied (so host can re-admit)
      if (existing.status === 'left' || existing.status === 'denied') {
        await serviceClient
          .from('call_participants')
          .update({ status: 'waiting', left_at: null })
          .eq('id', existing.id);
        return NextResponse.json({ ...existing, status: 'waiting' });
      }
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

  // Auto-create CRM contact for guests with email (non-blocking)
  if (participantRole === 'guest' && guestEmail && call.organization_id) {
    try {
      await ensureCrmContact(serviceClient, call, guestName || 'Unknown', guestEmail, roomCode);
    } catch {
      // Non-blocking — don't fail participant registration
    }
  }

  return NextResponse.json(participant, { status: 201 });
}

/**
 * Find or create a CRM contact for the guest, and link it to the call.
 */
async function ensureCrmContact(
  supabase: ReturnType<typeof createServiceClient>,
  call: { id: string; organization_id: string; crm_contact_id: string | null },
  guestName: string,
  guestEmail: string,
  roomCode: string
) {
  const normalizedEmail = guestEmail.toLowerCase().trim();

  // Check if contact already exists by normalised email
  const { data: existing } = await supabase
    .from('crm_contacts')
    .select('id')
    .eq('organization_id', call.organization_id)
    .eq('email_normalised', normalizedEmail)
    .limit(1);

  let contactId: string;

  if (existing && existing.length > 0) {
    contactId = existing[0].id;
    // Update last_contacted_at
    await supabase
      .from('crm_contacts')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', contactId);
  } else {
    // Parse name into first/last
    const nameParts = guestName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data: newContact } = await supabase
      .from('crm_contacts')
      .insert({
        organization_id: call.organization_id,
        first_name: firstName,
        last_name: lastName || firstName,
        email: guestEmail,
        email_normalised: normalizedEmail,
        source: 'other',
        lifecycle_stage: 'lead',
        last_contacted_at: new Date().toISOString(),
        custom_fields: { source_detail: 'video_call' },
      })
      .select('id')
      .single();

    if (!newContact) return;
    contactId = newContact.id;

    // Log activity for new contact creation
    await supabase.from('crm_activity').insert({
      organization_id: call.organization_id,
      contact_id: contactId,
      activity_type: 'contact_created',
      title: 'Contact created from video call',
      description: `${guestName} joined call room ${roomCode} and was automatically added as a CRM contact.`,
    });
  }

  // Link contact to call if not already linked
  if (!call.crm_contact_id) {
    await supabase
      .from('calls')
      .update({ crm_contact_id: contactId, updated_at: new Date().toISOString() })
      .eq('id', call.id);
  }
}
