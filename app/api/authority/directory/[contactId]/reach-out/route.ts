import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;
  const body = await request.json();
  const { organizationId, category, opportunityName } = body;

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
  }

  // Verify authority access
  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const db = access.queryClient;

  // Fetch directory contact
  const { data: dirContact, error: fetchError } = await supabase
    .from('pr_directory_contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (fetchError || !dirContact) {
    return NextResponse.json({ error: 'Directory contact not found' }, { status: 404 });
  }

  // Check for duplicate in authority_contacts by email
  let existingContact = null;
  if (dirContact.email) {
    const normalised = dirContact.email.toLowerCase().trim();
    const { data: existing } = await db
      .from('authority_contacts')
      .select('id, full_name, email')
      .eq('organization_id', organizationId)
      .eq('email_normalised', normalised)
      .limit(1);

    if (existing && existing.length > 0) {
      existingContact = existing[0];
    }
  }

  let authorityContactId: string;

  if (existingContact) {
    authorityContactId = existingContact.id;
  } else {
    // Import directory contact → authority_contacts
    const { data: newContact, error: insertError } = await db
      .from('authority_contacts')
      .insert({
        organization_id: organizationId,
        full_name: dirContact.full_name,
        email: dirContact.email || null,
        phone: dirContact.phone || null,
        outlet: dirContact.company || null,
        role: dirContact.job_title ? 'other' : null,
        location: [dirContact.city, dirContact.province_state, dirContact.country].filter(Boolean).join(', ') || null,
        linkedin_url: (dirContact.social_links as Record<string, string> | null)?.linkedin || null,
        twitter_url: (dirContact.social_links as Record<string, string> | null)?.twitter || null,
        website_url: dirContact.website_url || null,
        warmth: 'cold',
        source: 'directory_import',
        notes: dirContact.description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    authorityContactId = newContact.id;
  }

  // Find the first active stage (Prospect) for this org
  const { data: stages } = await db
    .from('authority_pipeline_stages')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('stage_type', 'active')
    .order('position', { ascending: true })
    .limit(1);

  const stageId = stages?.[0]?.id;
  if (!stageId) {
    return NextResponse.json({ error: 'No pipeline stages found. Please set up your Authority Pipeline first.' }, { status: 400 });
  }

  // Create pipeline card
  const resolvedCategory = category || 'media_placement';
  const { data: card, error: cardError } = await db
    .from('authority_pipeline_cards')
    .insert({
      organization_id: organizationId,
      stage_id: stageId,
      contact_id: authorityContactId,
      opportunity_name: opportunityName || `Outreach: ${dirContact.full_name}`,
      category: resolvedCategory,
      priority: 'medium',
      created_by: user.id,
    })
    .select()
    .single();

  if (cardError) {
    return NextResponse.json({ error: cardError.message }, { status: 500 });
  }

  return NextResponse.json({
    contact: { id: authorityContactId, email: dirContact.email },
    card,
  }, { status: 201 });
}
