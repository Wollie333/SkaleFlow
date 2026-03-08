import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateConsistencyScore } from '@/lib/presence/consistency-scorer';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { organizationId } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const score = await calculateConsistencyScore(organizationId);

    return NextResponse.json({ score });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Presence audit error', { error: errorMessage });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}