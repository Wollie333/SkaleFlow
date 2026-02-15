import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getContacts, createContact } from '@/lib/crm/contacts';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || undefined;
    const lifecycleStage = searchParams.get('lifecycleStage') || undefined;
    const companyId = searchParams.get('companyId') || undefined;
    const tagId = searchParams.get('tagId') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await getContacts({
      organizationId,
      page,
      limit,
      search,
      lifecycleStage,
      companyId,
      tagId,
      assignedTo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      companyId,
      lifecycleStage,
      source,
      assignedTo,
    } = body;

    if (!organizationId || !firstName || !email) {
      return NextResponse.json(
        { error: 'Organization ID, first name, and email are required' },
        { status: 400 }
      );
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const contact = await createContact({
      organizationId,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      companyId,
      lifecycleStage,
      source,
      assignedTo,
      performedBy: user.id,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
