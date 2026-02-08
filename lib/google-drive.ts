import { OAuth2Client } from 'google-auth-library';
import { createServiceClient } from '@/lib/supabase/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const REDIRECT_URI = `${SITE_URL}/api/integrations/google-drive/callback`;

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
];

export function getDriveOAuth2Client(): OAuth2Client {
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
}

export function getDriveAuthUrl(state: string): string {
  const client = getDriveOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: DRIVE_SCOPES,
    state,
    prompt: 'consent',
  });
}

export async function exchangeDriveCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}> {
  const client = getDriveOAuth2Client();
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
  };
}

export async function refreshDriveToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date: number;
}> {
  const client = getDriveOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
  };
}

export async function getAuthenticatedDriveToken(organizationId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from('google_drive_connections')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (!connection) return null;

  // Check if token is expired (with 5-minute buffer)
  const expiresAt = new Date(connection.token_expires_at).getTime();
  const bufferMs = 5 * 60 * 1000;

  if (Date.now() + bufferMs >= expiresAt) {
    try {
      const refreshed = await refreshDriveToken(connection.refresh_token);

      await supabase
        .from('google_drive_connections')
        .update({
          access_token: refreshed.access_token,
          token_expires_at: new Date(refreshed.expiry_date).toISOString(),
        })
        .eq('id', connection.id);

      return refreshed.access_token;
    } catch {
      // Token refresh failed — mark inactive
      await supabase
        .from('google_drive_connections')
        .update({ is_active: false })
        .eq('id', connection.id);
      return null;
    }
  }

  return connection.access_token;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink: string | null;
  size: string | null;
  modifiedTime: string | null;
  iconLink: string | null;
}

export interface DriveListResult {
  files: DriveFile[];
  nextPageToken: string | null;
}

export async function listDriveFiles(
  accessToken: string,
  options: {
    query?: string;
    folderId?: string;
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<DriveListResult> {
  const { query, folderId, pageToken, pageSize = 20 } = options;

  let q = 'trashed = false';
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }
  if (query) {
    q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
  }

  const params = new URLSearchParams({
    q,
    pageSize: String(pageSize),
    fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink,size,modifiedTime,iconLink)',
    orderBy: 'modifiedTime desc',
  });
  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive API error: ${err}`);
  }

  const data = await res.json();
  return {
    files: (data.files || []).map((f: Record<string, unknown>) => ({
      id: f.id as string,
      name: f.name as string,
      mimeType: f.mimeType as string,
      thumbnailLink: (f.thumbnailLink as string) || null,
      size: (f.size as string) || null,
      modifiedTime: (f.modifiedTime as string) || null,
      iconLink: (f.iconLink as string) || null,
    })),
    nextPageToken: data.nextPageToken || null,
  };
}

export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  // For Google Docs/Sheets/Slides, export as PDF or relevant format
  const googleDocTypes: Record<string, string> = {
    'application/vnd.google-apps.document': 'application/pdf',
    'application/vnd.google-apps.spreadsheet': 'application/pdf',
    'application/vnd.google-apps.presentation': 'application/pdf',
    'application/vnd.google-apps.drawing': 'image/png',
  };

  const exportMimeType = googleDocTypes[mimeType];
  let url: string;

  if (exportMimeType) {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download file: ${res.statusText}`);
  }

  // Get filename
  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meta = await metaRes.json();

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: exportMimeType || mimeType,
    fileName: meta.name || 'file',
  };
}
