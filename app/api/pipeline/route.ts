import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership
  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  const { data: pipelines, error } = await supabase
    .from('pipelines')
    .select('*, pipeline_stages(id, name, color, sort_order, is_win_stage, is_loss_stage), pipeline_contacts(id)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add contact counts
  const result = (pipelines || []).map(p => ({
    ...p,
    contact_count: p.pipeline_contacts?.length || 0,
    pipeline_contacts: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, name, description, template } = body;
  if (!organizationId || !name) return NextResponse.json({ error: 'organizationId and name required' }, { status: 400 });

  // Verify admin/owner
  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can create pipelines' }, { status: 403 });
  }

  // Check 2-pipeline limit
  const { count } = await supabase
    .from('pipelines')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if ((count ?? 0) >= 2) {
    return NextResponse.json({ error: 'Pipeline limit reached. You can have a maximum of 2 pipelines.' }, { status: 400 });
  }

  // Create pipeline
  const { data: pipeline, error } = await supabase
    .from('pipelines')
    .insert({ organization_id: organizationId, name, description: description || null, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create default stages based on template
  const templates: Record<string, Array<{ name: string; color: string; sort_order: number; is_win_stage?: boolean; is_loss_stage?: boolean }>> = {
    sales: [
      { name: 'New Lead', color: '#6B7280', sort_order: 0 },
      { name: 'Contacted', color: '#3B82F6', sort_order: 1 },
      { name: 'Qualified', color: '#8B5CF6', sort_order: 2 },
      { name: 'Proposal Sent', color: '#F59E0B', sort_order: 3 },
      { name: 'Negotiation', color: '#EC4899', sort_order: 4 },
      { name: 'Won', color: '#10B981', sort_order: 5, is_win_stage: true },
      { name: 'Lost', color: '#EF4444', sort_order: 6, is_loss_stage: true },
    ],
    onboarding: [
      { name: 'Signed Up', color: '#6B7280', sort_order: 0 },
      { name: 'Welcome Sent', color: '#3B82F6', sort_order: 1 },
      { name: 'Onboarding Call', color: '#8B5CF6', sort_order: 2 },
      { name: 'Onboarding Complete', color: '#F59E0B', sort_order: 3 },
      { name: 'Active', color: '#10B981', sort_order: 4, is_win_stage: true },
    ],
    blank: [
      { name: 'New', color: '#6B7280', sort_order: 0 },
      { name: 'In Progress', color: '#3B82F6', sort_order: 1 },
      { name: 'Done', color: '#10B981', sort_order: 2, is_win_stage: true },
    ],
  };

  const stageTemplate = templates[template || 'sales'] || templates.sales;
  const stages = stageTemplate.map(s => ({
    pipeline_id: pipeline.id,
    name: s.name,
    color: s.color,
    sort_order: s.sort_order,
    is_win_stage: s.is_win_stage || false,
    is_loss_stage: s.is_loss_stage || false,
  }));

  await supabase.from('pipeline_stages').insert(stages);

  // Return pipeline with stages
  const { data: fullPipeline } = await supabase
    .from('pipelines')
    .select('*, pipeline_stages(id, name, color, sort_order, is_win_stage, is_loss_stage)')
    .eq('id', pipeline.id)
    .single();

  return NextResponse.json(fullPipeline, { status: 201 });
}
