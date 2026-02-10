import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get('workflowId');
  const status = searchParams.get('status');

  if (!workflowId) return NextResponse.json({ error: 'workflowId required' }, { status: 400 });

  const { data: workflow } = await supabase.from('automation_workflows').select('organization_id').eq('id', workflowId).single();
  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', workflow.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let query = supabase
    .from('automation_runs')
    .select('*, pipeline_contacts(full_name, email)')
    .eq('workflow_id', workflowId)
    .order('started_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
