'use client';

import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface DirectorySearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function DirectorySearchBar({
  search,
  onSearchChange,
  activeFilterCount,
  showFilters,
  onToggleFilters,
}: DirectorySearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, company, or description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={onToggleFilters}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
          showFilters
            ? 'bg-teal-50 border-teal-200 text-teal-700'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <FunnelIcon className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-600 text-white text-xs">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
