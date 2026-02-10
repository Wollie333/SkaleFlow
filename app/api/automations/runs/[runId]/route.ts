import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: run, error } = await supabase
    .from('automation_runs')
    .select('*, pipeline_contacts(full_name, email), automation_workflows(name, organization_id)')
    .eq('id', runId)
    .single();

  if (error || !run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

  const orgId = (run.automation_workflows as unknown as { organization_id: string })?.organization_id;
  if (orgId) {
    const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', orgId).eq('user_id', user.id).single();
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get step logs
  const { data: stepLogs } = await supabase
    .from('automation_step_logs')
    .select('*, automation_steps(step_type, config, reactflow_node_id)')
    .eq('run_id', runId)
    .order('started_at', { ascending: true });

  return NextResponse.json({ ...run, step_logs: stepLogs || [] });
}
