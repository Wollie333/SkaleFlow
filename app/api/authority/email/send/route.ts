import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { getAuthenticatedGmailToken, sendGmailMessage } from '@/lib/email/gmail';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, contactId, cardId, to, cc, bcc, subject, bodyHtml, bodyText, inReplyTo, threadId } = body;

  if (!organizationId || !to || !subject) {
    return NextResponse.json({ error: 'organizationId, to, and subject are required' }, { status: 400 });
  }

  // Auth check
  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Get user's Gmail token
  const token = await getAuthenticatedGmailToken(user.id);
  if (!token) {
    return NextResponse.json({ error: 'No active Gmail connection. Please connect Gmail in Settings.' }, { status: 400 });
  }

  try {
    // Send via Gmail API
    const result = await sendGmailMessage(token, {
      to,
      cc,
      bcc,
      subject,
      bodyHtml: bodyHtml || `<p>${(bodyText || '').replace(/\n/g, '<br/>')}</p>`,
      bodyText: bodyText || '',
      inReplyTo,
      threadId,
    });

    // Record in authority_correspondence
    const db = access.queryClient;
    const { data: correspondence, error } = await db
      .from('authority_correspondence')
      .insert({
        organization_id: organizationId,
        card_id: cardId || null,
        contact_id: contactId || null,
        type: 'email' as const,
        direction: 'outbound' as const,
        email_subject: subject,
        email_from: user.email,
        email_to: to,
        email_cc: cc || null,
        email_bcc: bcc || null,
        email_body_text: bodyText || null,
        email_body_html: bodyHtml || null,
        email_message_id: result.messageId,
        email_thread_id: result.threadId,
        email_in_reply_to: inReplyTo || null,
        occurred_at: new Date().toISOString(),
        created_by: user.id,
        synced_by_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to record correspondence:', error);
    }

    // Auto-update contact last_contacted_at
    if (contactId) {
      const svc = createServiceClient();
      await svc
        .from('authority_contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', contactId);
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
      correspondenceId: correspondence?.id || null,
    });
  } catch (err) {
    console.error('Gmail send error:', err);
    return NextResponse.json({ error: 'Failed to send email via Gmail' }, { status: 500 });
  }
}
