'use client';

import { PR_DIRECTORY_CATEGORIES, PR_DIRECTORY_INDUSTRIES } from '@/lib/authority/directory-constants';
import type { PRDirectoryCategory } from '@/types/database';

interface DirectoryFiltersProps {
  category: string;
  onCategoryChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  selectedIndustries: string[];
  onIndustriesChange: (industries: string[]) => void;
  savedOnly: boolean;
  onSavedOnlyChange: (value: boolean) => void;
}

export function DirectoryFilters({
  category,
  onCategoryChange,
  country,
  onCountryChange,
  city,
  onCityChange,
  selectedIndustries,
  onIndustriesChange,
  savedOnly,
  onSavedOnlyChange,
}: DirectoryFiltersProps) {
  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      onIndustriesChange(selectedIndustries.filter(i => i !== industry));
    } else {
      onIndustriesChange([...selectedIndustries, industry]);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Category pills */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !category
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {(Object.entries(PR_DIRECTORY_CATEGORIES) as [PRDirectoryCategory, { label: string; color: string }][]).map(
            ([key, { label }]) => (
              <button
                key={key}
                onClick={() => onCategoryChange(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === key
                    ? 'bg-teal-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Location */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
          <input
            type="text"
            placeholder="e.g. South Africa"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {country && (
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
            <input
              type="text"
              placeholder="e.g. Cape Town"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}
      </div>

      {/* Industry multi-select */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Industry</label>
        <div className="flex flex-wrap gap-2">
          {PR_DIRECTORY_INDUSTRIES.map((industry) => (
            <label
              key={industry}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                selectedIndustries.includes(industry)
                  ? 'bg-teal-100 text-teal-800 border border-teal-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIndustries.includes(industry)}
                onChange={() => toggleIndustry(industry)}
                className="sr-only"
              />
              {industry}
            </label>
          ))}
        </div>
      </div>

      {/* Saved Only toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSavedOnlyChange(!savedOnly)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            savedOnly ? 'bg-teal-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              savedOnly ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">Saved contacts only</span>
      </div>
    </div>
  );
}
