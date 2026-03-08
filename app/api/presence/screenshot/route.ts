import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const organizationId = formData.get('organizationId') as string;
    const platformKey = formData.get('platformKey') as string;
    const file = formData.get('file') as File;

    if (!organizationId || !platformKey || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upload to storage
    const fileName = `${organizationId}/${platformKey}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const serviceClient = createServiceClient();
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('presence-screenshots')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = serviceClient.storage
      .from('presence-screenshots')
      .getPublicUrl(fileName);

    // Save record
    const { data: screenshot, error: dbError } = await serviceClient
      .from('presence_profile_screenshots')
      .insert({
        organization_id: organizationId,
        platform_key: platformKey,
        screenshot_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ screenshot });
  } catch (error) {
    logger.error('Screenshot upload error', { error: String(error) });
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const platformKey = searchParams.get('platformKey');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('presence_profile_screenshots')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (platformKey) {
      query = query.eq('platform_key', platformKey);
    }

    const { data: screenshots, error } = await query;
    if (error) throw error;

    return NextResponse.json({ screenshots: screenshots || [] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}