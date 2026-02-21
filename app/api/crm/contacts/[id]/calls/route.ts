import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contactId } = await params;

    // Get contact to verify org membership
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('organization_id')
      .eq('id', contactId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', contact.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Query calls linked to this contact, with summary and participant count
    const { data: calls, error } = await supabase
      .from('calls')
      .select(`
        id,
        title,
        call_type,
        call_status,
        room_code,
        scheduled_start,
        actual_start,
        actual_end,
        scheduled_duration_min,
        created_at,
        call_summaries (
          id,
          summary_text,
          overall_score,
          deal_stage_recommendation
        ),
        call_participants (
          id,
          guest_name,
          user_id,
          role
        )
      `)
      .eq('crm_contact_id', contactId)
      .eq('organization_id', contact.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ calls: calls || [] });
  } catch (error) {
    console.error('Error fetching contact calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
