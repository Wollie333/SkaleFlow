import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedDriveToken, downloadDriveFile } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileId, mimeType, organizationId, contentItemId } = body;

    if (!fileId || !mimeType || !organizationId) {
      return NextResponse.json({ error: 'fileId, mimeType, and organizationId are required' }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const accessToken = await getAuthenticatedDriveToken(organizationId);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 404 });
    }

    // Download from Drive
    const { buffer, contentType, fileName } = await downloadDriveFile(accessToken, fileId, mimeType);

    // Generate unique filename
    const ext = fileName.split('.').pop()?.toLowerCase() || getExtFromMime(contentType);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filePath = `${organizationId}/${timestamp}-${randomStr}.${ext}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Drive import upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload imported file' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('content-media')
      .getPublicUrl(filePath);

    // If contentItemId provided, append to media_urls
    if (contentItemId) {
      const { data: item } = await supabase
        .from('content_items')
        .select('media_urls')
        .eq('id', contentItemId)
        .single();

      const existingUrls: string[] = (item?.media_urls as string[]) || [];
      await supabase
        .from('content_items')
        .update({ media_urls: [...existingUrls, publicUrl], updated_at: new Date().toISOString() })
        .eq('id', contentItemId);
    }

    return NextResponse.json({
      url: publicUrl,
      fileName,
      fileType: contentType,
      fileSize: buffer.length,
    });
  } catch (error) {
    console.error('Google Drive import error:', error);
    return NextResponse.json({ error: 'Failed to import file' }, { status: 500 });
  }
}

function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'application/pdf': 'pdf',
  };
  return map[mimeType] || 'bin';
}
