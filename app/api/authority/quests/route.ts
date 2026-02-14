import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { evaluateQuests } from '@/lib/authority/quest-evaluator';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = request.nextUrl.searchParams.get('organizationId');
  if (!orgId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, orgId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Evaluate quests (seeds if needed)
  const result = await evaluateQuests(orgId);

  return NextResponse.json(result);
}
