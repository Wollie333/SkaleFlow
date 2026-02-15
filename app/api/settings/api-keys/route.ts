import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { encryptApiKey, maskApiKey } from '@/lib/encryption';
import { invalidateUserKeyCache } from '@/lib/ai/user-keys';

const VALID_PROVIDERS = ['anthropic', 'google', 'groq', 'openai'];

async function getAuthenticatedBetaUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('id, ai_beta_enabled')
    .eq('id', user.id)
    .single();

  if (!userData?.ai_beta_enabled) return null;
  return userData;
}

export async function GET() {
  try {
    const user = await getAuthenticatedBetaUser();
    if (!user) {
      return NextResponse.json({ error: 'AI Beta not enabled' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();
    const { data: keys, error } = await serviceSupabase
      .from('user_api_keys')
      .select('provider, key_hint, is_valid, updated_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to fetch user API keys:', error);
      return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
    }

    return NextResponse.json({
      keys: (keys || []).map(k => ({
        provider: k.provider,
        keyHint: k.key_hint,
        isValid: k.is_valid,
        updatedAt: k.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedBetaUser();
    if (!user) {
      return NextResponse.json({ error: 'AI Beta not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }

    const { encrypted, iv } = encryptApiKey(apiKey);
    const keyHint = maskApiKey(apiKey);

    const serviceSupabase = createServiceClient();

    // Upsert: insert or update on (user_id, provider)
    const { error } = await serviceSupabase
      .from('user_api_keys')
      .upsert(
        {
          user_id: user.id,
          provider,
          encrypted_key: encrypted,
          key_iv: iv,
          key_hint: keyHint,
          is_valid: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) {
      console.error('Failed to save API key:', error);
      return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
    }

    invalidateUserKeyCache(user.id);

    return NextResponse.json({ keyHint });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedBetaUser();
    if (!user) {
      return NextResponse.json({ error: 'AI Beta not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { provider } = body;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    const { error } = await serviceSupabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      console.error('Failed to delete API key:', error);
      return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
    }

    invalidateUserKeyCache(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
  }
}
