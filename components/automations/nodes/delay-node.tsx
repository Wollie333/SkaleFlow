'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function DelayNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-xl border-2 bg-yellow-50 min-w-[180px] ${selected ? 'border-yellow-500 shadow-lg' : 'border-yellow-300'}`}>
      <Handle type="target" position={Position.Top} className="!bg-yellow-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs">
          ⏱
        </div>
        <div>
          <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wider">Delay</p>
          <p className="text-sm text-yellow-700">{(data as Record<string, unknown>).label as string || 'Set duration...'}</p>
        </div>
      </div>
    </div>
  );
}
