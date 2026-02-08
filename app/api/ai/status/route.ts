import { NextResponse } from 'next/server';

// Maps provider name → required env var
const PROVIDER_ENV_KEYS: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_AI_API_KEY',
  groq: 'GROQ_API_KEY',
};

export async function GET() {
  const statuses: Record<string, 'active' | 'offline'> = {};

  for (const [provider, envKey] of Object.entries(PROVIDER_ENV_KEYS)) {
    statuses[provider] = process.env[envKey] ? 'active' : 'offline';
  }

  return NextResponse.json({ statuses });
}
