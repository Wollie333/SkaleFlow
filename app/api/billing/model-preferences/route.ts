import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getModelConfig } from '@/lib/ai';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const { data: preferences } = await supabase
      .from('ai_model_preferences')
      .select('*')
      .eq('organization_id', organizationId);

    return NextResponse.json({ preferences: preferences || [] });
  } catch (error) {
    console.error('Model preferences fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, feature, modelId } = await request.json();

    if (!organizationId || !feature || !modelId) {
      return NextResponse.json({ error: 'organizationId, feature, and modelId are required' }, { status: 400 });
    }

    // Verify org membership (owner/admin only)
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only org owners/admins can update preferences' }, { status: 403 });
    }

    // Validate model exists
    const config = getModelConfig(modelId);
    if (!config) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ai_model_preferences')
      .upsert({
        organization_id: organizationId,
        feature,
        provider: config.provider,
        model: modelId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,feature',
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Model preference update error:', error);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }
}
