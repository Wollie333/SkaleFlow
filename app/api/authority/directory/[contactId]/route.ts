import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;

  const { data: contact, error } = await supabase
    .from('pr_directory_contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  // Look up added_by user name
  let addedByName: string | null = null;
  if (contact.added_by) {
    const { data: addedByUser } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', contact.added_by)
      .single();
    addedByName = addedByUser?.full_name || null;
  }

  // Check if user saved this contact
  const { data: save } = await supabase
    .from('pr_directory_saves')
    .select('id')
    .eq('contact_id', contactId)
    .eq('user_id', user.id)
    .maybeSingle();

  // Get total save count via service (all users)
  const { count: saveCount } = await supabase
    .from('pr_directory_saves')
    .select('id', { count: 'exact', head: true })
    .eq('contact_id', contactId);

  return NextResponse.json({
    ...contact,
    added_by_name: addedByName,
    is_saved: !!save,
    save_count: saveCount || 0,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;

  // Check ownership or super_admin
  const { data: existing } = await supabase
    .from('pr_directory_contacts')
    .select('added_by')
    .eq('id', contactId)
    .single();

  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (existing.added_by !== user.id && userRecord?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only the creator or admin can edit this contact' }, { status: 403 });
  }

  const body = await request.json();
  const { data: updated, error } = await supabase
    .from('pr_directory_contacts')
    .update({
      full_name: body.full_name,
      company: body.company,
      job_title: body.job_title,
      email: body.email,
      phone: body.phone,
      photo_url: body.photo_url,
      description: body.description,
      website_url: body.website_url,
      social_links: body.social_links,
      category: body.category,
      industry_types: body.industry_types,
      country: body.country,
      city: body.city,
      province_state: body.province_state,
    })
    .eq('id', contactId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;

  // Super admin only
  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRecord?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only admins can remove contacts' }, { status: 403 });
  }

  // Soft delete
  const { error } = await supabase
    .from('pr_directory_contacts')
    .update({ status: 'removed' })
    .eq('id', contactId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
