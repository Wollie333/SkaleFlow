'use client';

import Link from 'next/link';
import { UsersIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  color: string;
  is_default: boolean;
  member_count?: number;
  content_count?: number;
}

interface WorkspaceListProps {
  workspaces: Workspace[];
  isAdmin: boolean;
}

export function WorkspaceList({ workspaces, isAdmin }: WorkspaceListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <div
          key={workspace.id}
          className="bg-cream-warm rounded-lg border border-stone/15 p-6 hover:border-teal/30 hover:shadow-md transition-all group relative"
        >
          {/* Settings icon (top right) */}
          {isAdmin && (
            <Link
              href={`/workspaces/${workspace.id}`}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="p-2 rounded-lg hover:bg-stone/10 transition-colors">
                <Cog6ToothIcon className="w-4 h-4 text-stone" />
              </div>
            </Link>
          )}

          {/* Workspace info */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-sm"
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-charcoal truncate">
                  {workspace.name}
                </h3>
                {workspace.is_default && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-stone/10 text-stone rounded">
                    Default
                  </span>
                )}
              </div>
              {workspace.description && (
                <p className="text-sm text-stone line-clamp-2">{workspace.description}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-stone mt-4 pt-4 border-t border-stone/10">
            <div className="flex items-center gap-1.5">
              <UsersIcon className="w-4 h-4" />
              <span>{workspace.member_count || 0} members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChartBarIcon className="w-4 h-4" />
              <span>{workspace.content_count || 0} posts</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
