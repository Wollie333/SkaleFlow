import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  // Look up contact org
  const svc = createServiceClient();
  const { data: contact } = await svc
    .from('authority_contacts')
    .select('organization_id')
    .eq('id', contactId)
    .single();
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, contact.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Fetch all correspondence for this contact (all types for activity, filtered for emails)
  const { data: emails, error, count } = await db
    .from('authority_correspondence')
    .select('*', { count: 'exact' })
    .eq('contact_id', contactId)
    .eq('type', 'email')
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by thread_id
  const threads = new Map<string, typeof emails>();
  for (const email of emails || []) {
    const threadId = email.email_thread_id || email.id;
    if (!threads.has(threadId)) {
      threads.set(threadId, []);
    }
    threads.get(threadId)!.push(email);
  }

  // Sort each thread's messages chronologically
  const threadList = Array.from(threads.entries()).map(([threadId, messages]) => {
    messages.sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
    return {
      threadId,
      subject: messages[0]?.email_subject || '(No subject)',
      messageCount: messages.length,
      latestDate: messages[messages.length - 1]?.occurred_at,
      messages,
    };
  });

  // Sort threads by latest message
  threadList.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

  return NextResponse.json({
    threads: threadList,
    total: count || 0,
    page,
    limit,
  });
}
