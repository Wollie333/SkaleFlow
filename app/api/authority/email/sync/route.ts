import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthenticatedGmailToken, getGmailProfile, getGmailHistory } from '@/lib/email/gmail';
import type { SyncedEmail } from '@/lib/email/types';

export const maxDuration = 60;

function extractEmailAddress(header: string): string {
  const match = header.match(/<([^>]+)>/);
  return (match ? match[1] : header).toLowerCase().trim();
}

function extractAllEmailAddresses(headers: string): string[] {
  return headers.split(',').map(h => extractEmailAddress(h)).filter(Boolean);
}

export async function GET() {
  const supabase = createServiceClient();
  let totalSynced = 0;

  try {
    // Get connections that need syncing, oldest first
    const { data: connections, error: connError } = await supabase
      .from('authority_email_connections')
      .select('*')
      .eq('sync_enabled', true)
      .eq('is_active', true)
      .order('last_sync_at', { ascending: true, nullsFirst: true })
      .limit(10);

    if (connError || !connections?.length) {
      return NextResponse.json({ synced: 0, message: 'No connections to sync' });
    }

    for (const connection of connections) {
      try {
        const token = await getAuthenticatedGmailToken(connection.user_id);
        if (!token) {
          console.log(`No valid token for user ${connection.user_id}, skipping`);
          continue;
        }

        // First sync — just store historyId, don't import old messages
        if (!connection.last_history_id) {
          const profile = await getGmailProfile(token);
          await supabase
            .from('authority_email_connections')
            .update({
              last_history_id: profile.historyId,
              last_sync_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);
          continue;
        }

        // Incremental sync
        const result = await getGmailHistory(token, connection.last_history_id);

        if (result.messages.length === 0) {
          await supabase
            .from('authority_email_connections')
            .update({
              last_history_id: result.newHistoryId,
              last_sync_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);
          continue;
        }

        // Get all contacts for this org (for matching)
        const { data: orgContacts } = await supabase
          .from('authority_contacts')
          .select('id, email')
          .eq('organization_id', connection.organization_id)
          .not('email', 'is', null);

        const contactsByEmail = new Map<string, string>();
        for (const c of orgContacts || []) {
          if (c.email) contactsByEmail.set(c.email.toLowerCase().trim(), c.id);
        }

        for (const msg of result.messages) {
          await processMessage(supabase, connection, msg, contactsByEmail);
          totalSynced++;
        }

        // Update connection
        await supabase
          .from('authority_email_connections')
          .update({
            last_history_id: result.newHistoryId,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

      } catch (err) {
        console.error(`Sync error for connection ${connection.id}:`, err);
      }
    }

    return NextResponse.json({ synced: totalSynced });
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

async function processMessage(
  supabase: ReturnType<typeof createServiceClient>,
  connection: Record<string, unknown>,
  msg: SyncedEmail,
  contactsByEmail: Map<string, string>
) {
  // Extract all email addresses from the message
  const fromAddr = extractEmailAddress(msg.from);
  const toAddrs = extractAllEmailAddresses(msg.to);
  const ccAddrs = msg.cc ? extractAllEmailAddresses(msg.cc) : [];
  const allAddrs = [fromAddr, ...toAddrs, ...ccAddrs];

  // Check if any address matches a known contact
  let matchedContactId: string | null = null;
  for (const addr of allAddrs) {
    const contactId = contactsByEmail.get(addr);
    if (contactId) {
      matchedContactId = contactId;
      break;
    }
  }

  // Skip if no matching contact
  if (!matchedContactId) return;

  // Dedup by email_message_id
  const { data: existing } = await supabase
    .from('authority_correspondence')
    .select('id')
    .eq('email_message_id', msg.messageId)
    .maybeSingle();

  if (existing) return;

  // Determine direction: from user's gmail = outbound, else inbound
  const userEmail = (connection.email_address as string).toLowerCase();
  const direction = fromAddr === userEmail ? 'outbound' : 'inbound';

  // Find related card_id (latest pipeline card for this contact, nullable)
  const { data: latestCard } = await supabase
    .from('authority_pipeline_cards')
    .select('id')
    .eq('contact_id', matchedContactId)
    .eq('organization_id', connection.organization_id as string)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Insert correspondence
  await supabase
    .from('authority_correspondence')
    .insert({
      organization_id: connection.organization_id as string,
      card_id: latestCard?.id || null,
      contact_id: matchedContactId,
      type: 'email' as const,
      direction: direction as 'inbound' | 'outbound',
      email_subject: msg.subject,
      email_from: msg.from,
      email_to: msg.to,
      email_cc: msg.cc || null,
      email_body_text: msg.bodyText || null,
      email_body_html: msg.bodyHtml || null,
      email_message_id: msg.messageId,
      email_thread_id: msg.threadId,
      email_in_reply_to: msg.inReplyTo || null,
      occurred_at: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
      created_by: connection.user_id as string,
      synced_by_user_id: connection.user_id as string,
    });

  // Auto-update contact last_contacted_at
  await supabase
    .from('authority_contacts')
    .update({ last_contacted_at: new Date().toISOString() })
    .eq('id', matchedContactId);
}
