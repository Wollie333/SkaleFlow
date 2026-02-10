'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getCaretCoordinates } from '@/lib/caret-coordinates';
import type { FlatBrandVariable, BrandVariableCategory } from '@/hooks/useBrandVariables';

export interface FilteredCategory {
  key: string;
  label: string;
  variables: FlatBrandVariable[];
}

export interface DropdownState {
  isOpen: boolean;
  position: { top: number; left: number };
  searchQuery: string;
  filteredCategories: FilteredCategory[];
  selectedIndex: number;
}

interface UseBrandVariableTriggerOptions {
  flatVariables: FlatBrandVariable[];
  categories: BrandVariableCategory[];
  value: string;
  onValueChange: (newValue: string) => void;
}

export function useBrandVariableTrigger({
  flatVariables,
  categories,
  value,
  onValueChange,
}: UseBrandVariableTriggerOptions) {
  const elementRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const triggerStartRef = useRef<number | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dropdownState, setDropdownState] = useState<DropdownState>({
    isOpen: false,
    position: { top: 0, left: 0 },
    searchQuery: '',
    filteredCategories: [],
    selectedIndex: 0,
  });

  // Filter variables by search query, grouped by category
  const filterVariables = useCallback(
    (query: string): FilteredCategory[] => {
      const q = query.toLowerCase();
      if (!q) {
        return categories
          .map(cat => ({
            key: cat.key,
            label: cat.label,
            variables: cat.variables,
          }))
          .filter(cat => cat.variables.length > 0);
      }

      return categories
        .map(cat => ({
          key: cat.key,
          label: cat.label,
          variables: cat.variables.filter(
            v =>
              v.displayName.toLowerCase().includes(q) ||
              v.key.toLowerCase().includes(q)
          ),
        }))
        .filter(cat => cat.variables.length > 0);
    },
    [categories]
  );

  // Count total filtered items
  const getFlatFilteredList = useCallback(
    (filtered: FilteredCategory[]): FlatBrandVariable[] => {
      return filtered.flatMap(c => c.variables);
    },
    []
  );

  // Update dropdown position based on caret
  const updatePosition = useCallback(() => {
    const el = elementRef.current;
    if (!el || triggerStartRef.current === null) return;

    const coords = getCaretCoordinates(el, triggerStartRef.current);
    const rect = el.getBoundingClientRect();

    setDropdownState(prev => ({
      ...prev,
      position: {
        top: rect.top + coords.top + coords.height + 4,
        left: rect.left + coords.left,
      },
    }));
  }, []);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    triggerStartRef.current = null;
    setDropdownState(prev => ({
      ...prev,
      isOpen: false,
      searchQuery: '',
      filteredCategories: [],
      selectedIndex: 0,
    }));
  }, []);

  // Select a variable and insert its value
  const handleSelect = useCallback(
    (variable: FlatBrandVariable) => {
      const el = elementRef.current;
      const start = triggerStartRef.current;
      if (!el || start === null) return;

      const cursorPos = el.selectionStart ?? value.length;
      const before = value.substring(0, start);
      const after = value.substring(cursorPos);
      const insertValue = variable.value || '';
      const newValue = before + insertValue + after;

      onValueChange(newValue);
      closeDropdown();

      // Restore cursor position after React re-render
      const newCursorPos = start + insertValue.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [value, onValueChange, closeDropdown]
  );

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const newValue = e.target.value;
      onValueChange(newValue);

      const cursorPos = e.target.selectionStart ?? newValue.length;

      // Check if ~ was just typed
      if (
        triggerStartRef.current === null &&
        cursorPos > 0 &&
        newValue[cursorPos - 1] === '~'
      ) {
        triggerStartRef.current = cursorPos - 1;
        const filtered = filterVariables('');
        setDropdownState({
          isOpen: true,
          position: { top: 0, left: 0 },
          searchQuery: '',
          filteredCategories: filtered,
          selectedIndex: 0,
        });
        // Position after state update
        requestAnimationFrame(() => updatePosition());
        return;
      }

      // If dropdown is open, update search query
      if (triggerStartRef.current !== null) {
        // Check if cursor moved before trigger
        if (cursorPos <= triggerStartRef.current) {
          closeDropdown();
          return;
        }

        const query = newValue.substring(triggerStartRef.current + 1, cursorPos);

        // Close if user typed a newline or space after the trigger start
        if (query.includes('\n')) {
          closeDropdown();
          return;
        }

        const filtered = filterVariables(query);
        setDropdownState(prev => ({
          ...prev,
          searchQuery: query,
          filteredCategories: filtered,
          selectedIndex: 0,
        }));
        requestAnimationFrame(() => updatePosition());
      }
    },
    [onValueChange, filterVariables, updatePosition, closeDropdown]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (!dropdownState.isOpen) return;

      const flatList = getFlatFilteredList(dropdownState.filteredCategories);
      const totalItems = flatList.length;
      if (totalItems === 0 && e.key !== 'Escape') return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setDropdownState(prev => ({
            ...prev,
            selectedIndex: (prev.selectedIndex + 1) % totalItems,
          }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setDropdownState(prev => ({
            ...prev,
            selectedIndex: (prev.selectedIndex - 1 + totalItems) % totalItems,
          }));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatList[dropdownState.selectedIndex]) {
            handleSelect(flatList[dropdownState.selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeDropdown();
          break;
        case 'Tab':
          closeDropdown();
          break;
      }
    },
    [dropdownState, getFlatFilteredList, handleSelect, closeDropdown]
  );

  // Handle blur with delay to allow click-through
  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      closeDropdown();
    }, 200);
  }, [closeDropdown]);

  // Handle focus — clear blur timeout
  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  // Ref callback to attach to the element
  const setRef = useCallback(
    (el: HTMLTextAreaElement | HTMLInputElement | null) => {
      elementRef.current = el;
    },
    []
  );

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!dropdownState.isOpen) return;

    const onReposition = () => updatePosition();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [dropdownState.isOpen, updatePosition]);

  // Cleanup blur timeout
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return {
    setRef,
    triggerProps: {
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      onFocus: handleFocus,
    },
    dropdownState,
    onSelect: handleSelect,
    onClose: closeDropdown,
  };
}
