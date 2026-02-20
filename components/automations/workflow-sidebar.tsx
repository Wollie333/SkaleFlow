'use client';

const nodeTypes = [
  { type: 'trigger', label: 'Trigger', color: 'bg-green-100 border-green-300 text-green-800', icon: '⚡' },
  { type: 'send_email', label: 'Send Email', color: 'bg-blue-100 border-blue-300 text-blue-800', icon: '✉' },
  { type: 'move_stage', label: 'Move Stage', color: 'bg-purple-100 border-purple-300 text-purple-800', icon: '→' },
  { type: 'add_tag', label: 'Add Tag', color: 'bg-orange-100 border-orange-300 text-orange-800', icon: '+' },
  { type: 'remove_tag', label: 'Remove Tag', color: 'bg-orange-100 border-orange-300 text-orange-700', icon: '−' },
  { type: 'webhook', label: 'Webhook', color: 'bg-cream border-stone/10 text-charcoal', icon: '🌐' },
  { type: 'delay', label: 'Delay', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', icon: '⏱' },
  { type: 'condition', label: 'Condition', color: 'bg-indigo-100 border-indigo-300 text-indigo-800', icon: '?' },
];

export function WorkflowSidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 bg-cream-warm border-r border-stone/10 p-4 flex-shrink-0">
      <h3 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">Nodes</h3>
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-colors hover:shadow-sm ${node.color}`}
          >
            <span className="text-sm">{node.icon}</span>
            <span className="text-xs font-medium">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
