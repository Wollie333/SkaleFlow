import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getActiveConnection } from '@/lib/canva/token-manager';
import { CanvaClient } from '@/lib/canva/client';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const active = await getActiveConnection(membership.organization_id);
  if (!active) {
    return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
  }

  const body = await request.json();
  const { designId, format = 'png' } = body;

  if (!designId) {
    return NextResponse.json({ error: 'designId is required' }, { status: 400 });
  }

  try {
    const client = new CanvaClient(active.accessToken);

    // Create export job and poll until ready
    const exportId = await client.createExport(designId, format);
    const job = await client.pollExportUntilReady(exportId);

    if (!job.urls || job.urls.length === 0) {
      return NextResponse.json({ error: 'No export URL returned' }, { status: 500 });
    }

    // Download the exported image from Canva CDN
    const exportUrl = job.urls[0];
    const imageResponse = await fetch(exportUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download exported image: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get('content-type') || `image/${format}`;
    const extension = format === 'jpg' ? 'jpg' : format === 'pdf' ? 'pdf' : 'png';
    const fileName = `canva-${designId}-${Date.now()}.${extension}`;

    // Upload to Supabase content-media bucket
    const serviceClient = createServiceClient();
    const storagePath = `${membership.organization_id}/${fileName}`;

    const { error: uploadError } = await serviceClient.storage
      .from('content-media')
      .upload(storagePath, imageBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[canva-export] Storage upload failed:', uploadError);
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    const { data: publicUrlData } = serviceClient.storage
      .from('content-media')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('[canva-export] Failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to export design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
