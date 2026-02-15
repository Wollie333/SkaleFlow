import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/crm/activity';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Get contact to get organization_id
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('organization_id')
      .eq('id', id)
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

    // Add tag to contact
    const { data: contactTag, error } = await supabase
      .from('crm_contact_tags')
      .insert({
        contact_id: id,
        tag_id: tagId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Tag already added to contact' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Log activity
    await logActivity({
      organizationId: contact.organization_id,
      contactId: id,
      activityType: 'tag_added',
      title: 'Tag added',
      description: `Tag added to contact`,
      performedBy: user.id,
    });

    return NextResponse.json(contactTag, { status: 201 });
  } catch (error) {
    console.error('Error adding tag to contact:', error);
    return NextResponse.json(
      { error: 'Failed to add tag to contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Get contact to get organization_id
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('organization_id')
      .eq('id', id)
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

    // Remove tag from contact
    const { error } = await supabase
      .from('crm_contact_tags')
      .delete()
      .eq('contact_id', id)
      .eq('tag_id', tagId);

    if (error) {
      throw error;
    }

    // Log activity
    await logActivity({
      organizationId: contact.organization_id,
      contactId: id,
      activityType: 'tag_removed',
      title: 'Tag removed',
      description: `Tag removed from contact`,
      performedBy: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tag from contact:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag from contact' },
      { status: 500 }
    );
  }
}
