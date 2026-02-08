'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function RemoveTagNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-xl border-2 bg-orange-50 min-w-[180px] ${selected ? 'border-orange-500 shadow-lg' : 'border-orange-300'}`}>
      <Handle type="target" position={Position.Top} className="!bg-orange-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs">
          −
        </div>
        <div>
          <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider">Remove Tag</p>
          <p className="text-sm text-orange-700 truncate max-w-[140px]">{(data as Record<string, unknown>).label as string || 'Select tag...'}</p>
        </div>
      </div>
    </div>
  );
}
