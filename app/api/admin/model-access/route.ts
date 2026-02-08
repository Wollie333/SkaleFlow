import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();

    // Fetch all rules
    const { data: rules, error: rulesError } = await serviceSupabase
      .from('model_access_rules')
      .select('*')
      .order('created_at', { ascending: true });

    if (rulesError) {
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    // Fetch tiers
    const { data: tiers } = await serviceSupabase
      .from('subscription_tiers')
      .select('id, name, slug, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Fetch users for user-override section (include org membership for playbook link)
    const { data: users } = await serviceSupabase
      .from('users')
      .select('id, email, full_name, role, org_members!org_members_user_id_fkey(organization_id)')
      .order('full_name', { ascending: true });

    return NextResponse.json({
      rules: rules || [],
      tiers: tiers || [],
      users: users || [],
    });
  } catch (error) {
    console.error('Model access GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { modelId, scopeType, scopeId, isEnabled } = await request.json();

    if (!modelId || !scopeType || !scopeId || typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields: modelId, scopeType, scopeId, isEnabled' }, { status: 400 });
    }

    if (!['tier', 'user'].includes(scopeType)) {
      return NextResponse.json({ error: 'scopeType must be "tier" or "user"' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    const { data: rule, error } = await serviceSupabase
      .from('model_access_rules')
      .upsert({
        model_id: modelId,
        scope_type: scopeType,
        scope_id: scopeId,
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'model_id,scope_type,scope_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Upsert rule error:', error);
      return NextResponse.json({ error: 'Failed to save rule' }, { status: 500 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Model access POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { modelId, scopeType, scopeId } = await request.json();

    if (!modelId || !scopeType || !scopeId) {
      return NextResponse.json({ error: 'Missing required fields: modelId, scopeType, scopeId' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    const { error } = await serviceSupabase
      .from('model_access_rules')
      .delete()
      .eq('model_id', modelId)
      .eq('scope_type', scopeType)
      .eq('scope_id', scopeId);

    if (error) {
      console.error('Delete rule error:', error);
      return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Model access DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
