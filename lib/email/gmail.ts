import { OAuth2Client } from 'google-auth-library';
import { createServiceClient } from '@/lib/supabase/server';
import type { EmailSendParams, EmailSendResult, SyncedEmail, EmailSyncResult } from './types';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const REDIRECT_URI = `${SITE_URL}/api/integrations/gmail/callback`;

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function getGmailOAuth2Client(): OAuth2Client {
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
}

export function getGmailAuthUrl(state: string): string {
  const client = getGmailOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    state,
    prompt: 'consent',
  });
}

export async function exchangeGmailCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}> {
  const client = getGmailOAuth2Client();
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
  };
}

export async function refreshGmailToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date: number;
}> {
  const client = getGmailOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
  };
}

/**
 * Get a valid access token for a user's Gmail connection.
 * Auto-refreshes if expired. Marks inactive on failure.
 */
export async function getAuthenticatedGmailToken(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from('authority_email_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .eq('is_active', true)
    .single();

  if (!connection) return null;

  const expiresAt = new Date(connection.token_expires_at).getTime();
  const bufferMs = 5 * 60 * 1000;

  if (Date.now() + bufferMs >= expiresAt) {
    try {
      const refreshed = await refreshGmailToken(connection.refresh_token);

      await supabase
        .from('authority_email_connections')
        .update({
          access_token: refreshed.access_token,
          token_expires_at: new Date(refreshed.expiry_date).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      return refreshed.access_token;
    } catch {
      await supabase
        .from('authority_email_connections')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', connection.id);
      return null;
    }
  }

  return connection.access_token;
}

/**
 * Get the user's Gmail profile (email + initial historyId).
 */
export async function getGmailProfile(accessToken: string): Promise<{ email: string; historyId: string }> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Gmail profile error: ${await res.text()}`);
  const data = await res.json();
  return { email: data.emailAddress, historyId: String(data.historyId) };
}

// ─── Sending ──────────────────────────────────────────────────────────────────

function buildRawMessage(params: EmailSendParams, senderEmail: string): string {
  const boundary = `boundary_${Date.now()}`;
  const headers = [
    `From: ${senderEmail}`,
    `To: ${params.to}`,
    ...(params.cc ? [`Cc: ${params.cc}`] : []),
    ...(params.bcc ? [`Bcc: ${params.bcc}`] : []),
    `Subject: ${params.subject}`,
    'MIME-Version: 1.0',
    ...(params.inReplyTo ? [`In-Reply-To: ${params.inReplyTo}`, `References: ${params.references || params.inReplyTo}`] : []),
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    params.bodyText,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    params.bodyHtml,
    `--${boundary}--`,
  ];

  const raw = [...headers, '', ...body].join('\r\n');
  // URL-safe base64 encoding
  return Buffer.from(raw).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailMessage(
  accessToken: string,
  params: EmailSendParams
): Promise<EmailSendResult> {
  // Get sender email for From header
  const profile = await getGmailProfile(accessToken);
  const raw = buildRawMessage(params, profile.email);

  const body: Record<string, string> = { raw };
  if (params.threadId) body.threadId = params.threadId;

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gmail send error: ${await res.text()}`);
  const data = await res.json();
  return { messageId: data.id, threadId: data.threadId };
}

// ─── Sync / History ──────────────────────────────────────────────────────────

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function extractBody(payload: Record<string, unknown>): { text: string; html: string } {
  let text = '';
  let html = '';

  const mimeType = payload.mimeType as string;
  const body = payload.body as { data?: string } | undefined;
  const parts = payload.parts as Array<Record<string, unknown>> | undefined;

  if (mimeType === 'text/plain' && body?.data) {
    text = decodeBase64Url(body.data);
  } else if (mimeType === 'text/html' && body?.data) {
    html = decodeBase64Url(body.data);
  }

  if (parts) {
    for (const part of parts) {
      const partResult = extractBody(part);
      if (partResult.text && !text) text = partResult.text;
      if (partResult.html && !html) html = partResult.html;
    }
  }

  return { text, html };
}

function parseGmailMessage(msg: Record<string, unknown>): SyncedEmail {
  const payload = msg.payload as Record<string, unknown>;
  const headers = (payload.headers || []) as Array<{ name: string; value: string }>;
  const { text, html } = extractBody(payload);

  return {
    messageId: msg.id as string,
    threadId: msg.threadId as string,
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    cc: getHeader(headers, 'Cc') || undefined,
    subject: getHeader(headers, 'Subject'),
    bodyText: text,
    bodyHtml: html,
    date: getHeader(headers, 'Date'),
    inReplyTo: getHeader(headers, 'In-Reply-To') || undefined,
  };
}

export async function getGmailMessage(accessToken: string, messageId: string): Promise<SyncedEmail> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Gmail message error: ${await res.text()}`);
  const data = await res.json();
  return parseGmailMessage(data);
}

/**
 * Incremental sync using Gmail History API.
 * Returns new messages and the latest historyId for next sync.
 */
export async function getGmailHistory(
  accessToken: string,
  startHistoryId: string
): Promise<EmailSyncResult> {
  const messages: SyncedEmail[] = [];
  let pageToken: string | undefined;
  let newHistoryId = startHistoryId;

  do {
    const params = new URLSearchParams({
      startHistoryId,
      historyTypes: 'messageAdded',
      maxResults: '100',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.status === 404) {
      // historyId too old — return empty, caller should re-init
      return { messages: [], newHistoryId: startHistoryId };
    }
    if (!res.ok) throw new Error(`Gmail history error: ${await res.text()}`);

    const data = await res.json();
    newHistoryId = String(data.historyId || startHistoryId);

    const history = (data.history || []) as Array<{
      messagesAdded?: Array<{ message: { id: string } }>;
    }>;

    const messageIds = new Set<string>();
    for (const entry of history) {
      for (const added of entry.messagesAdded || []) {
        messageIds.add(added.message.id);
      }
    }

    // Fetch full message for each new message
    for (const msgId of messageIds) {
      try {
        const msg = await getGmailMessage(accessToken, msgId);
        messages.push(msg);
      } catch (err) {
        console.error(`Failed to fetch Gmail message ${msgId}:`, err);
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { messages, newHistoryId };
}
