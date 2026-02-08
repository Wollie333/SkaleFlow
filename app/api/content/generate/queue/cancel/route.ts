import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cancelBatch } from '@/lib/content-engine/queue-service';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { batchId } = body;

  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
  }

  // Verify user has access to this batch
  const serviceClient = createServiceClient();
  const { data: batch } = await serviceClient
    .from('generation_batches')
    .select('organization_id')
    .eq('id', batchId)
    .single();

  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', batch.organization_id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
  }

  const result = await cancelBatch(serviceClient, batchId);
  return NextResponse.json(result);
}
