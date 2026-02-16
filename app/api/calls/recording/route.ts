import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as Blob | null;
  const orgId = formData.get('orgId') as string;
  const callId = formData.get('callId') as string;

  if (!file || !orgId || !callId) {
    return NextResponse.json({ error: 'Missing file, orgId, or callId' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const path = `${orgId}/${callId}.webm`;

  const { error: uploadError } = await serviceClient.storage
    .from('call-recordings')
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = serviceClient.storage
    .from('call-recordings')
    .getPublicUrl(path);

  // Update call record with recording URL
  await serviceClient
    .from('calls')
    .update({ recording_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', callId);

  return NextResponse.json({ url: urlData.publicUrl });
}
