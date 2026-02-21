'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PR_DIRECTORY_CATEGORIES, DIRECTORY_TO_AUTHORITY_CATEGORY } from '@/lib/authority/directory-constants';
import type { PRDirectoryCategory } from '@/types/database';
import { CATEGORY_CONFIG } from '@/lib/authority/constants';

interface DirectoryReachOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactCategory: PRDirectoryCategory;
  onConfirm: (data: { category: string; opportunityName: string }) => Promise<void>;
}

export function DirectoryReachOutModal({
  isOpen,
  onClose,
  contactName,
  contactCategory,
  onConfirm,
}: DirectoryReachOutModalProps) {
  const defaultAuthorityCategory = DIRECTORY_TO_AUTHORITY_CATEGORY[contactCategory] || 'media_placement';
  const [category, setCategory] = useState(defaultAuthorityCategory);
  const [opportunityName, setOpportunityName] = useState(`Outreach: ${contactName}`);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm({ category, opportunityName });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Reach Out</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleConfirm} className="p-4 space-y-4">
          <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
            <p className="text-sm text-teal-800">
              This will add <span className="font-semibold">{contactName}</span> to your contacts and create a PR opportunity card in your pipeline.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name</label>
            <input
              type="text"
              value={opportunityName}
              onChange={(e) => setOpportunityName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {(config as { label: string }).label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Reach Out & Compose Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
