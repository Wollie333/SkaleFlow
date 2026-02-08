import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

interface GraphNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: workflow } = await supabase.from('automation_workflows').select('*').eq('id', params.id).single();
  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', workflow.organization_id).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const graphData = workflow.graph_data as unknown as { nodes?: GraphNode[]; edges?: GraphEdge[] };
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  // Validate
  const triggerNodes = nodes.filter(n => n.type === 'trigger');
  if (triggerNodes.length === 0) return NextResponse.json({ error: 'Workflow must have a trigger node' }, { status: 400 });
  if (triggerNodes.length > 1) return NextResponse.json({ error: 'Workflow can only have one trigger node' }, { status: 400 });

  const triggerNode = triggerNodes[0];

  // Build adjacency from edges
  const edgeMap: Record<string, { default?: string; true?: string; false?: string }> = {};
  for (const edge of edges) {
    if (!edgeMap[edge.source]) edgeMap[edge.source] = {};
    if (edge.sourceHandle === 'true') {
      edgeMap[edge.source].true = edge.target;
    } else if (edge.sourceHandle === 'false') {
      edgeMap[edge.source].false = edge.target;
    } else {
      edgeMap[edge.source].default = edge.target;
    }
  }

  // Delete old steps
  await supabase.from('automation_steps').delete().eq('workflow_id', params.id);

  // Traverse graph from trigger, create steps
  // First pass: create all steps with placeholder IDs
  const nodeToStepId: Record<string, string> = {};
  const stepInserts: Array<{
    workflow_id: string;
    step_order: number;
    step_type: string;
    config: Json;
    reactflow_node_id: string;
  }> = [];

  // BFS from trigger
  const visited = new Set<string>();
  let order = 0;

  // Get outgoing nodes from trigger
  const triggerEdges = edgeMap[triggerNode.id];
  const firstActionId = triggerEdges?.default;

  if (!firstActionId) {
    // Workflow with just a trigger, no actions
    await supabase.from('automation_workflows').update({
      is_active: true,
      trigger_type: (triggerNode.data?.triggerType as string) || workflow.trigger_type,
      trigger_config: (triggerNode.data?.triggerConfig || {}) as unknown as Json,
      version: workflow.version + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', params.id);

    return NextResponse.json({ success: true, steps: 0 });
  }

  // Collect all action nodes in BFS order
  visited.add(triggerNode.id);
  const actionQueue = [firstActionId];

  while (actionQueue.length > 0) {
    const nodeId = actionQueue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;

    stepInserts.push({
      workflow_id: params.id,
      step_order: order++,
      step_type: (node.data?.stepType as string) || node.type || 'unknown',
      config: (node.data?.config || {}) as unknown as Json,
      reactflow_node_id: nodeId,
    });

    // Queue connected nodes
    const connections = edgeMap[nodeId];
    if (connections?.default && !visited.has(connections.default)) actionQueue.push(connections.default);
    if (connections?.true && !visited.has(connections.true)) actionQueue.push(connections.true);
    if (connections?.false && !visited.has(connections.false)) actionQueue.push(connections.false);
  }

  if (stepInserts.length === 0) {
    await supabase.from('automation_workflows').update({
      is_active: true,
      trigger_type: (triggerNode.data?.triggerType as string) || workflow.trigger_type,
      trigger_config: (triggerNode.data?.triggerConfig || {}) as unknown as Json,
      version: workflow.version + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', params.id);
    return NextResponse.json({ success: true, steps: 0 });
  }

  // Insert steps
  const { data: insertedSteps, error: insertError } = await supabase
    .from('automation_steps')
    .insert(stepInserts)
    .select();

  if (insertError || !insertedSteps) {
    return NextResponse.json({ error: insertError?.message || 'Failed to create steps' }, { status: 500 });
  }

  // Build nodeId -> stepId map
  for (const step of insertedSteps) {
    if (step.reactflow_node_id) {
      nodeToStepId[step.reactflow_node_id] = step.id;
    }
  }

  // Second pass: update next_step_id pointers
  for (const step of insertedSteps) {
    if (!step.reactflow_node_id) continue;
    const connections = edgeMap[step.reactflow_node_id];
    if (!connections) continue;

    const updateData: Record<string, string | null> = {};
    if (connections.default && nodeToStepId[connections.default]) {
      updateData.next_step_id = nodeToStepId[connections.default];
    }
    if (connections.true && nodeToStepId[connections.true]) {
      updateData.condition_true_step_id = nodeToStepId[connections.true];
    }
    if (connections.false && nodeToStepId[connections.false]) {
      updateData.condition_false_step_id = nodeToStepId[connections.false];
    }

    if (Object.keys(updateData).length > 0) {
      await supabase.from('automation_steps').update(updateData).eq('id', step.id);
    }
  }

  // Update workflow
  await supabase.from('automation_workflows').update({
    is_active: true,
    trigger_type: (triggerNode.data?.triggerType as string) || workflow.trigger_type,
    trigger_config: (triggerNode.data?.triggerConfig || {}) as unknown as Json,
    version: workflow.version + 1,
    updated_at: new Date().toISOString(),
  }).eq('id', params.id);

  return NextResponse.json({ success: true, steps: insertedSteps.length });
}
