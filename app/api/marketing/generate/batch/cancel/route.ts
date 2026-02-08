import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { batchId } = body;

  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Get batch to verify ownership
  const { data: batch, error: fetchError } = await serviceClient
    .from('ad_generation_batches')
    .select('id, organization_id, status')
    .eq('id', batchId)
    .single();

  if (fetchError || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', batch.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
  }

  // Can only cancel pending or processing batches
  if (batch.status !== 'pending' && batch.status !== 'processing') {
    return NextResponse.json({ error: `Cannot cancel batch with status: ${batch.status}` }, { status: 400 });
  }

  const { error: updateError } = await serviceClient
    .from('ad_generation_batches')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log(`[AD-GEN-CANCEL] Batch ${batchId} cancelled by user ${user.id}`);
  return NextResponse.json({ success: true, status: 'cancelled' });
}
