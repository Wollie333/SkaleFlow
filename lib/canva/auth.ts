import crypto from 'crypto';
import { CANVA_API_BASE, CANVA_SCOPES } from './types';
import type { CanvaTokenData } from './types';

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}

export function getAuthUrlWithPKCE(state: string): { authUrl: string; codeVerifier: string } {
  const clientId = process.env.CANVA_CLIENT_ID;
  if (!clientId) throw new Error('CANVA_CLIENT_ID not configured');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/integrations/canva/callback`;

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: CANVA_SCOPES.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    authUrl: `https://www.canva.com/api/oauth/authorize?${params.toString()}`,
    codeVerifier,
  };
}

export async function exchangeCode(code: string, codeVerifier: string): Promise<CanvaTokenData> {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Canva OAuth credentials not configured');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/integrations/canva/callback`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${CANVA_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[canva-auth] Token exchange failed:', response.status, errorText);
    throw new Error(`Canva token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    canvaUserId: data.user?.id || undefined,
    scopes: data.scope ? data.scope.split(' ') : CANVA_SCOPES,
  };
}

export async function refreshToken(currentRefreshToken: string): Promise<CanvaTokenData> {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Canva OAuth credentials not configured');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${CANVA_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentRefreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[canva-auth] Token refresh failed:', response.status, errorText);
    throw new Error(`Canva token refresh failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || currentRefreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: data.scope ? data.scope.split(' ') : CANVA_SCOPES,
  };
}
