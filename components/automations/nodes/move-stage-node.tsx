'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function MoveStageNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-xl border-2 bg-purple-50 min-w-[180px] ${selected ? 'border-purple-500 shadow-lg' : 'border-purple-300'}`}>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
          →
        </div>
        <div>
          <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Move Stage</p>
          <p className="text-sm text-purple-700 truncate max-w-[140px]">{(data as Record<string, unknown>).label as string || 'Select stage...'}</p>
        </div>
      </div>
    </div>
  );
}
