'use client';

import { type TextareaHTMLAttributes, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useBrandVariableTrigger } from '@/hooks/useBrandVariableTrigger';
import { BrandVariableDropdown } from '@/components/content/brand-variable-dropdown';
import type { FlatBrandVariable, BrandVariableCategory } from '@/hooks/useBrandVariables';

// ─── Shared types ──────────────────────────────────────────

interface BrandVariableProps {
  brandFlatVariables: FlatBrandVariable[];
  brandCategories: BrandVariableCategory[];
}

// ─── VariableTextarea ──────────────────────────────────────

interface VariableTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>,
    BrandVariableProps {
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function VariableTextarea({
  brandFlatVariables,
  brandCategories,
  label,
  hint,
  error,
  value,
  onValueChange,
  className,
  placeholder,
  ...rest
}: VariableTextareaProps) {
  const trigger = useBrandVariableTrigger({
    flatVariables: brandFlatVariables,
    categories: brandCategories,
    value,
    onValueChange,
  });

  const hintedPlaceholder = placeholder
    ? placeholder.includes('~') ? placeholder : `${placeholder}`
    : 'Type ~ for brand variables...';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-charcoal mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={trigger.setRef as React.Ref<HTMLTextAreaElement>}
        value={value}
        onChange={trigger.triggerProps.onChange}
        onKeyDown={trigger.triggerProps.onKeyDown}
        onBlur={trigger.triggerProps.onBlur}
        onFocus={trigger.triggerProps.onFocus}
        placeholder={hintedPlaceholder}
        className={cn(
          'w-full px-4 py-3 rounded-xl border bg-cream-warm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
          'placeholder:text-stone/60 resize-y',
          error
            ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
            : 'border-stone/20 hover:border-stone/40',
          className
        )}
        {...rest}
      />
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-stone">{hint}</p>}
      <BrandVariableDropdown
        isOpen={trigger.dropdownState.isOpen}
        position={trigger.dropdownState.position}
        searchQuery={trigger.dropdownState.searchQuery}
        filteredCategories={trigger.dropdownState.filteredCategories}
        selectedIndex={trigger.dropdownState.selectedIndex}
        onSelect={trigger.onSelect}
        onClose={trigger.onClose}
      />
    </div>
  );
}

// ─── VariableInput ─────────────────────────────────────────

interface VariableInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>,
    BrandVariableProps {
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function VariableInput({
  brandFlatVariables,
  brandCategories,
  label,
  hint,
  error,
  value,
  onValueChange,
  className,
  placeholder,
  ...rest
}: VariableInputProps) {
  const trigger = useBrandVariableTrigger({
    flatVariables: brandFlatVariables,
    categories: brandCategories,
    value,
    onValueChange,
  });

  const hintedPlaceholder = placeholder
    ? placeholder.includes('~') ? placeholder : `${placeholder}`
    : 'Type ~ for brand variables...';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-charcoal mb-2">
          {label}
        </label>
      )}
      <input
        ref={trigger.setRef as React.Ref<HTMLInputElement>}
        value={value}
        onChange={trigger.triggerProps.onChange}
        onKeyDown={trigger.triggerProps.onKeyDown}
        onBlur={trigger.triggerProps.onBlur}
        onFocus={trigger.triggerProps.onFocus}
        placeholder={hintedPlaceholder}
        className={cn(
          'w-full px-4 py-3 rounded-xl border bg-cream-warm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
          'placeholder:text-stone/60',
          error
            ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
            : 'border-stone/20 hover:border-stone/40',
          className
        )}
        {...rest}
      />
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-stone">{hint}</p>}
      <BrandVariableDropdown
        isOpen={trigger.dropdownState.isOpen}
        position={trigger.dropdownState.position}
        searchQuery={trigger.dropdownState.searchQuery}
        filteredCategories={trigger.dropdownState.filteredCategories}
        selectedIndex={trigger.dropdownState.selectedIndex}
        onSelect={trigger.onSelect}
        onClose={trigger.onClose}
      />
    </div>
  );
}
