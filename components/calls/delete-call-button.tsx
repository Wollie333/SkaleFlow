'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteCallButtonProps {
  callId: string;
  callTitle: string;
}

export function DeleteCallButton({ callId, callTitle }: DeleteCallButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete call');
      }
    } catch {
      alert('Failed to delete call');
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  if (deleting) {
    return (
      <span className="px-3 py-1.5 text-xs text-stone animate-pulse">Deleting...</span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
        <span className="text-[10px] text-red-500 mr-1">Delete &quot;{callTitle}&quot;?</span>
        <button
          onClick={handleDelete}
          className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={handleCancel}
          className="px-2 py-1 text-xs rounded bg-stone/20 text-charcoal hover:bg-stone/30 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 rounded-lg text-stone hover:text-red-500 hover:bg-red-50 transition-colors"
      title="Delete call (super admin)"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
