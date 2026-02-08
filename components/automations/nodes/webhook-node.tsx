'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function WebhookNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-xl border-2 bg-gray-50 min-w-[180px] ${selected ? 'border-gray-500 shadow-lg' : 'border-gray-300'}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">
          🌐
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Webhook</p>
          <p className="text-sm text-gray-600 truncate max-w-[140px]">{(data as Record<string, unknown>).label as string || 'Configure...'}</p>
        </div>
      </div>
    </div>
  );
}
