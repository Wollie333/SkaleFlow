'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function ConditionNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-xl border-2 bg-indigo-50 min-w-[180px] ${selected ? 'border-indigo-500 shadow-lg' : 'border-indigo-300'}`}>
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="!bg-green-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="!bg-red-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs rotate-45">
          <span className="-rotate-45">?</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Condition</p>
          <p className="text-sm text-indigo-700 truncate max-w-[140px]">{(data as Record<string, unknown>).label as string || 'Set condition...'}</p>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[10px]">
        <span className="text-green-600 font-medium">Yes</span>
        <span className="text-red-600 font-medium">No</span>
      </div>
    </div>
  );
}
