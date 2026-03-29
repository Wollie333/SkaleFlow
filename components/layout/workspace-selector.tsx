'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChevronUpDownIcon,
  PlusIcon,
  CheckIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  color: string;
  is_default: boolean;
}

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  canCreateWorkspace?: boolean;
  className?: string;
}

export function WorkspaceSelector({
  workspaces,
  currentWorkspaceId,
  canCreateWorkspace = false,
  className,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle workspace switch
  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (workspaceId === currentWorkspaceId) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);

    try {
      const response = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch workspace');
      }

      // Refresh the page to load new workspace context
      router.refresh();
    } catch (error) {
      console.error('Error switching workspace:', error);
      alert('Failed to switch workspace. Please try again.');
    } finally {
      setSwitching(false);
      setIsOpen(false);
    }
  };

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 border-b border-stone/10',
          'bg-cream-warm hover:bg-cream transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {/* Workspace logo/icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
          style={{ backgroundColor: currentWorkspace?.color || '#0891b2' }}
        >
          {currentWorkspace?.logo_url ? (
            <img
              src={currentWorkspace.logo_url}
              alt=""
              className="w-full h-full rounded-lg object-cover"
            />
          ) : currentWorkspace ? (
            currentWorkspace.name.substring(0, 2).toUpperCase()
          ) : (
            <BuildingOfficeIcon className="w-6 h-6" />
          )}
        </div>

        {/* Workspace name and label */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-charcoal truncate">
            {currentWorkspace?.name || 'Select Workspace'}
          </p>
          <p className="text-xs text-stone">
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Dropdown icon */}
        <ChevronUpDownIcon className="w-5 h-5 text-stone flex-shrink-0" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-cream-warm rounded-lg shadow-xl border border-stone/15 py-1 max-h-80 overflow-y-auto">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleWorkspaceSwitch(workspace.id)}
              disabled={switching}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cream transition-colors text-left',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                workspace.id === currentWorkspaceId && 'bg-teal/5'
              )}
            >
              {/* Workspace logo/icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: workspace.color }}
              >
                {workspace.logo_url ? (
                  <img
                    src={workspace.logo_url}
                    alt=""
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  workspace.name.substring(0, 2).toUpperCase()
                )}
              </div>

              {/* Workspace name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">
                  {workspace.name}
                </p>
                {workspace.description && (
                  <p className="text-xs text-stone truncate">
                    {workspace.description}
                  </p>
                )}
              </div>

              {/* Check icon if current */}
              {workspace.id === currentWorkspaceId && (
                <CheckIcon className="w-4 h-4 text-teal flex-shrink-0" />
              )}
            </button>
          ))}

          {/* Create new workspace button */}
          {canCreateWorkspace && (
            <>
              <div className="border-t border-stone/10 my-1" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/workspaces/new');
                }}
                disabled={switching}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cream transition-colors text-teal',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <PlusIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Create New Workspace</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
