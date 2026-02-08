import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const organizationId = formData.get('organizationId') as string | null;
    const contentItemId = formData.get('contentItemId') as string | null;

    if (!file || !organizationId) {
      return NextResponse.json({ error: 'File and organizationId are required' }, { status: 400 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only images (PNG, JPG, WebP, GIF), videos (MP4, MOV, WebM), and PDFs are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (100MB max for video, 10MB for images/PDF)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File must be under ${isVideo ? '100MB' : '10MB'}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filePath = `${organizationId}/${timestamp}-${randomStr}.${ext}`;

    // Upload to Supabase storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Content media upload error:', uploadError);
      // Provide specific error messages
      const errorMessage = uploadError.message || '';
      if (errorMessage.includes('Bucket not found') || errorMessage.includes('bucket')) {
        return NextResponse.json({ error: 'Storage bucket "content-media" not found. Please contact your administrator to create it.' }, { status: 500 });
      }
      if (errorMessage.includes('too large') || errorMessage.includes('payload')) {
        return NextResponse.json({ error: `File is too large. Maximum: ${isVideo ? '100MB' : '10MB'}` }, { status: 413 });
      }
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        return NextResponse.json({ error: 'A file with this name already exists. Please rename and try again.' }, { status: 409 });
      }
      return NextResponse.json({ error: `Upload failed: ${errorMessage || 'Unknown error'}` }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-media')
      .getPublicUrl(filePath);

    // If contentItemId provided, append to the item's media_urls
    if (contentItemId) {
      const { data: item } = await supabase
        .from('content_items')
        .select('media_urls')
        .eq('id', contentItemId)
        .single();

      const existingUrls: string[] = (item?.media_urls as string[]) || [];
      const updatedUrls = [...existingUrls, publicUrl];

      await supabase
        .from('content_items')
        .update({ media_urls: updatedUrls, updated_at: new Date().toISOString() })
        .eq('id', contentItemId);
    }

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Content media upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, organizationId, contentItemId } = await request.json();

    if (!url || !organizationId) {
      return NextResponse.json({ error: 'url and organizationId are required' }, { status: 400 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Extract file path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/content-media/');
    if (pathParts.length < 2) {
      return NextResponse.json({ error: 'Invalid media URL' }, { status: 400 });
    }

    const filePath = decodeURIComponent(pathParts[1]);

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('content-media')
      .remove([filePath]);

    if (deleteError) {
      console.error('Content media delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    // If contentItemId provided, remove from the item's media_urls
    if (contentItemId) {
      const { data: item } = await supabase
        .from('content_items')
        .select('media_urls')
        .eq('id', contentItemId)
        .single();

      const existingUrls: string[] = (item?.media_urls as string[]) || [];
      const updatedUrls = existingUrls.filter(u => u !== url);

      await supabase
        .from('content_items')
        .update({ media_urls: updatedUrls, updated_at: new Date().toISOString() })
        .eq('id', contentItemId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Content media delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
