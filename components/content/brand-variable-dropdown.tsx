'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { FlatBrandVariable } from '@/hooks/useBrandVariables';
import type { FilteredCategory } from '@/hooks/useBrandVariableTrigger';

interface BrandVariableDropdownProps {
  isOpen: boolean;
  position: { top: number; left: number };
  searchQuery: string;
  filteredCategories: FilteredCategory[];
  selectedIndex: number;
  onSelect: (variable: FlatBrandVariable) => void;
  onClose: () => void;
}

export function BrandVariableDropdown({
  isOpen,
  position,
  searchQuery,
  filteredCategories,
  selectedIndex,
  onSelect,
  onClose,
}: BrandVariableDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build flat index for tracking selectedIndex
  let flatIndex = -1;

  const totalVars = filteredCategories.reduce((sum, c) => sum + c.variables.length, 0);

  // Clamp position so dropdown doesn't go off-screen
  const clampedTop = Math.min(position.top, window.innerHeight - 320);
  const clampedLeft = Math.min(position.left, window.innerWidth - 340);

  const dropdown = (
    <div
      ref={containerRef}
      className="fixed z-[60] w-[320px] max-h-[300px] overflow-y-auto bg-cream-warm rounded-xl border border-stone/15 shadow-xl"
      style={{ top: clampedTop, left: clampedLeft }}
    >
      {/* Header */}
      {searchQuery && (
        <div className="px-3 py-2 border-b border-stone/10">
          <span className="text-xs text-teal/70 font-mono">~{searchQuery}</span>
        </div>
      )}

      {/* Empty state */}
      {totalVars === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-stone/60">No matching variables</p>
        </div>
      )}

      {/* Categories and variables */}
      {filteredCategories.map(cat => (
        <div key={cat.key}>
          <div className="text-[10px] uppercase tracking-wider text-stone font-semibold bg-cream/50 px-3 py-1.5 sticky top-0">
            {cat.label}
          </div>
          {cat.variables.map(variable => {
            flatIndex++;
            const isSelected = flatIndex === selectedIndex;
            const currentIndex = flatIndex;
            const hasValue = !!variable.value;
            const preview = variable.value
              ? variable.value.length > 60
                ? variable.value.substring(0, 60) + '...'
                : variable.value
              : '(not set)';

            return (
              <button
                key={variable.key}
                ref={isSelected ? selectedItemRef : null}
                // Use mouseDown + preventDefault to avoid blur race
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(variable);
                }}
                className={`w-full text-left px-3 py-2 transition-colors ${
                  isSelected
                    ? 'bg-teal/10 border-l-2 border-teal'
                    : 'border-l-2 border-transparent hover:bg-stone/5'
                } ${!hasValue ? 'opacity-50' : ''}`}
              >
                <div className="text-sm font-medium text-charcoal truncate">
                  {variable.displayName}
                </div>
                <div className="text-xs text-stone/60 truncate mt-0.5">
                  {preview}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  return createPortal(dropdown, document.body);
}
