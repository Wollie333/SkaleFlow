'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, SwatchIcon } from '@heroicons/react/24/outline';

interface TeamRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, Record<string, boolean>>;
  is_system_role: boolean;
}

interface PermissionTemplateSelectorProps {
  onApply: (role: TeamRole) => void;
  disabled?: boolean;
}

export function PermissionTemplateSelector({
  onApply,
  disabled,
}: PermissionTemplateSelectorProps) {
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    if (roles.length > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/team/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [roles.length]);

  useEffect(() => {
    if (isOpen && roles.length === 0) {
      fetchRoles();
    }
  }, [isOpen, fetchRoles, roles.length]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal border border-teal/20 rounded-lg hover:bg-teal/5 transition-colors disabled:opacity-50"
      >
        <SwatchIcon className="w-3.5 h-3.5" />
        Apply Template
        <ChevronDownIcon className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-cream-warm rounded-xl border border-teal/10 shadow-xl w-72 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-xs text-stone text-center">Loading roles...</div>
            ) : roles.length === 0 ? (
              <div className="p-4 text-xs text-stone text-center">No roles available</div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {roles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      onApply(role);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-teal/5 transition-colors border-b border-stone/5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal">{role.name}</span>
                      {role.is_system_role && (
                        <span className="text-[10px] font-semibold text-teal bg-teal/10 px-1.5 py-0.5 rounded">
                          System
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-stone mt-0.5">{role.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
