import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'social-media';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

// GET - List media files for the org
export async function GET(request: NextRequest) {
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

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const orgPath = membership.organization_id;
  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(orgPath, { sortBy: { column: 'created_at', order: 'desc' } });

  if (error) {
    console.error('Error listing media:', error);
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 });
  }

  // Get public URLs for each file
  const mediaFiles = (files || [])
    .filter((f) => !f.name.startsWith('.'))
    .map((f) => {
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(`${orgPath}/${f.name}`);

      return {
        id: f.id,
        name: f.name,
        url: urlData?.publicUrl || '',
        size: f.metadata?.size || 0,
        type: f.metadata?.mimetype || 'unknown',
        createdAt: f.created_at,
      };
    });

  return NextResponse.json({ files: mediaFiles });
}

// POST - Upload a media file
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

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = `${membership.organization_id}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return NextResponse.json({
    file: {
      name: fileName,
      url: urlData?.publicUrl || '',
      size: file.size,
      type: file.type,
      path: data?.path,
    },
  }, { status: 201 });
}

// DELETE - Delete a media file
export async function DELETE(request: NextRequest) {
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

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const { fileName } = await request.json();
  if (!fileName) {
    return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
  }

  const filePath = `${membership.organization_id}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
