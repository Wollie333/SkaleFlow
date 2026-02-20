'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function TriggerNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-xl border-2 bg-green-50 min-w-[180px] ${selected ? 'border-green-500 shadow-lg' : 'border-green-300'}`}>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
          ⚡
        </div>
        <div>
          <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Trigger</p>
          <p className="text-sm font-medium text-green-900">{(data as Record<string, unknown>).label as string || 'Select trigger...'}</p>
        </div>
      </div>
    </div>
  );
}
