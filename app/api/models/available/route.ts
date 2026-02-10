import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableModels } from '@/lib/ai';
import type { AIFeature } from '@/lib/ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const feature = request.nextUrl.searchParams.get('feature') as AIFeature | null;

    const models = await getAvailableModels(user.id, feature || undefined);

    // Return client-safe model info (no server-side pricing details)
    const clientModels = models.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      isFree: m.isFree,
      estimatedCreditsPerMessage: m.estimatedCreditsPerMessage,
      features: m.features,
    }));

    return NextResponse.json({ models: clientModels });
  } catch (error) {
    console.error('Available models GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
