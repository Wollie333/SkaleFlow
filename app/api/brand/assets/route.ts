import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = request.nextUrl.searchParams.get('organizationId');
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const { data: assets, error } = await supabase
      .from('brand_visual_assets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('asset_type')
      .order('sort_order');

    if (error) {
      console.error('Error fetching brand assets:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    return NextResponse.json({ assets: assets || [] });
  } catch (error) {
    console.error('Brand assets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const organizationId = formData.get('organizationId') as string | null;
    const assetType = formData.get('assetType') as string | null;

    if (!file || !organizationId || !assetType) {
      return NextResponse.json({ error: 'file, organizationId, and assetType are required' }, { status: 400 });
    }

    const validTypes = ['primary_logo', 'logo_dark', 'logo_light', 'logo_icon', 'pattern', 'mood_board'];
    if (!validTypes.includes(assetType)) {
      return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 });
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

    // Validate file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG, JPG, SVG, and WebP files are allowed' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
    }

    // For single-slot types (logos), remove existing asset of same type
    const singleSlotTypes = ['primary_logo', 'logo_dark', 'logo_light', 'logo_icon'];
    if (singleSlotTypes.includes(assetType)) {
      const { data: existing } = await supabase
        .from('brand_visual_assets')
        .select('id, file_url')
        .eq('organization_id', organizationId)
        .eq('asset_type', assetType);

      if (existing && existing.length > 0) {
        for (const asset of existing) {
          // Delete from storage
          const path = extractStoragePath(asset.file_url);
          if (path) {
            await supabase.storage.from('brand-assets').remove([path]);
          }
          await supabase.from('brand_visual_assets').delete().eq('id', asset.id);
        }
      }
    }

    // Upload
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const filePath = `${organizationId}/${assetType}/${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('Brand asset upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(filePath);

    // Get sort_order
    const { count } = await supabase
      .from('brand_visual_assets')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('asset_type', assetType);

    const { data: asset, error: insertError } = await supabase
      .from('brand_visual_assets')
      .insert({
        organization_id: organizationId,
        asset_type: assetType,
        file_url: publicUrl,
        file_name: file.name,
        sort_order: (count || 0),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Brand asset insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save asset record' }, { status: 500 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error('Brand assets POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetId, organizationId } = await request.json();
    if (!assetId || !organizationId) {
      return NextResponse.json({ error: 'assetId and organizationId required' }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Get asset to find storage path
    const { data: asset } = await supabase
      .from('brand_visual_assets')
      .select('file_url')
      .eq('id', assetId)
      .eq('organization_id', organizationId)
      .single();

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Delete from storage
    const path = extractStoragePath(asset.file_url);
    if (path) {
      await supabase.storage.from('brand-assets').remove([path]);
    }

    // Delete record
    await supabase.from('brand_visual_assets').delete().eq('id', assetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Brand assets DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function extractStoragePath(publicUrl: string): string | null {
  // Extract path after /brand-assets/
  const match = publicUrl.match(/\/brand-assets\/(.+)$/);
  return match ? match[1] : null;
}
