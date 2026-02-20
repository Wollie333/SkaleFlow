'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TriggerNode } from './nodes/trigger-node';
import { SendEmailNode } from './nodes/send-email-node';
import { MoveStageNode } from './nodes/move-stage-node';
import { AddTagNode } from './nodes/add-tag-node';
import { RemoveTagNode } from './nodes/remove-tag-node';
import { WebhookNode } from './nodes/webhook-node';
import { DelayNode } from './nodes/delay-node';
import { ConditionNode } from './nodes/condition-node';
import { WorkflowSidebar } from './workflow-sidebar';
import { NodeConfigPanel } from './node-config-panel';

const nodeTypes = {
  trigger: TriggerNode,
  send_email: SendEmailNode,
  move_stage: MoveStageNode,
  add_tag: AddTagNode,
  remove_tag: RemoveTagNode,
  webhook: WebhookNode,
  delay: DelayNode,
  condition: ConditionNode,
};

interface Stage { id: string; name: string; color: string; }
interface Tag { id: string; name: string; color: string; }
interface Template { id: string; name: string; }
interface Endpoint { id: string; name: string; }

interface WorkflowBuilderProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  stages: Stage[];
  tags: Tag[];
  templates: Template[];
  endpoints: Endpoint[];
  workflowName?: string;
  onNameChange?: (name: string) => void;
  onSave: (graphData: { nodes: Node[]; edges: Edge[] }) => Promise<void>;
  onPublish: () => Promise<void>;
}

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

export function WorkflowBuilder({
  initialNodes = [],
  initialEdges = [],
  stages,
  tags,
  templates,
  endpoints,
  workflowName,
  onNameChange,
  onSave,
  onPublish,
}: WorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6B7280' } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getNodeId(),
        type,
        position,
        data: { label: '', stepType: type, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data } : n))
      );
      setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data } : prev));
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ nodes, edges });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onSave({ nodes, edges });
      await onPublish();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] rounded-xl border border-stone/10 overflow-hidden">
      <WorkflowSidebar />

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {/* Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="px-3 py-1.5 text-xs font-medium bg-cream-warm border border-stone/20 rounded-lg hover:bg-cream text-charcoal disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={handlePublish} disabled={publishing}
            className="px-3 py-1.5 text-xs font-medium bg-teal text-white rounded-lg hover:bg-teal/90 disabled:opacity-50">
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
        >
          <Controls className="!bg-cream-warm !border-stone/10 !rounded-lg !shadow-sm" />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        </ReactFlow>
      </div>

      <NodeConfigPanel
        node={selectedNode}
        stages={stages}
        tags={tags}
        templates={templates}
        endpoints={endpoints}
        onUpdate={handleNodeUpdate}
        onDelete={handleDeleteNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
