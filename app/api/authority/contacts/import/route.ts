import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, contacts, columnMapping } = body;

  if (!organizationId || !contacts || !Array.isArray(contacts)) {
    return NextResponse.json({ error: 'organizationId and contacts array required' }, { status: 400 });
  }

  // Verify owner/admin (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized || !['owner', 'admin'].includes(access.role!)) {
    return NextResponse.json({ error: 'Only owners and admins can import contacts' }, { status: 403 });
  }
  const db = access.queryClient;

  // Get existing emails for duplicate detection
  const { data: existingContacts } = await db
    .from('authority_contacts')
    .select('email_normalised')
    .eq('organization_id', organizationId)
    .not('email_normalised', 'is', null);

  const existingEmails = new Set(
    (existingContacts || []).map(c => c.email_normalised).filter(Boolean)
  );

  const imported: string[] = [];
  const skipped: { name: string; reason: string }[] = [];

  // Column mapping: map CSV headers to DB fields
  const mapping = columnMapping || {
    full_name: 'full_name',
    email: 'email',
    phone: 'phone',
    outlet: 'outlet',
    role: 'role',
    beat: 'beat',
    location: 'location',
    linkedin_url: 'linkedin_url',
    twitter_url: 'twitter_url',
    notes: 'notes',
  };

  const toInsert: Array<{
    organization_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    outlet: string | null;
    role: string | null;
    beat: string | null;
    location: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    notes: string | null;
    warmth: import('@/types/database').AuthorityContactWarmth;
    source: import('@/types/database').AuthorityContactSource;
    created_by: string;
  }> = [];

  for (const row of contacts) {
    const name = row[mapping.full_name]?.trim();
    if (!name) {
      skipped.push({ name: '(empty)', reason: 'Missing name' });
      continue;
    }

    const email = row[mapping.email]?.trim() || null;

    // Skip duplicates
    if (email && existingEmails.has(email.toLowerCase().trim())) {
      skipped.push({ name, reason: 'Duplicate email' });
      continue;
    }

    if (email) {
      existingEmails.add(email.toLowerCase().trim());
    }

    toInsert.push({
      organization_id: organizationId,
      full_name: name,
      email,
      phone: row[mapping.phone]?.trim() || null,
      outlet: row[mapping.outlet]?.trim() || null,
      role: row[mapping.role]?.trim() || null,
      beat: row[mapping.beat]?.trim() || null,
      location: row[mapping.location]?.trim() || null,
      linkedin_url: row[mapping.linkedin_url]?.trim() || null,
      twitter_url: row[mapping.twitter_url]?.trim() || null,
      notes: row[mapping.notes]?.trim() || null,
      warmth: 'cold' as const,
      source: 'csv_import' as const,
      created_by: user.id,
    });

    imported.push(name);
  }

  // Batch insert
  if (toInsert.length > 0) {
    const { error } = await db
      .from('authority_contacts')
      .insert(toInsert);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported_count: imported.length,
    skipped_count: skipped.length,
    skipped,
  });
}
