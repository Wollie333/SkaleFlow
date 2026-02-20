'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function SendEmailNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-xl border-2 bg-blue-50 min-w-[180px] ${selected ? 'border-blue-500 shadow-lg' : 'border-blue-300'}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
          ✉
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Send Email</p>
          <p className="text-sm text-blue-400 truncate max-w-[140px]">{(data as Record<string, unknown>).label as string || 'Select template...'}</p>
        </div>
      </div>
    </div>
  );
}
