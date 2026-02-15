'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  organizationId: string;
  contactId: string;
  assignedTags: Tag[];
  onTagsChange?: () => void;
}

export function TagManager({ organizationId, contactId, assignedTags, onTagsChange }: TagManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');

  useEffect(() => {
    fetchTags();
  }, [organizationId]);

  const fetchTags = async () => {
    try {
      const res = await fetch(`/api/crm/tags?organizationId=${organizationId}`);
      const data = await res.json();
      setAllTags(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const addTag = async (tagId: string) => {
    try {
      await fetch(`/api/crm/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      onTagsChange?.();
    } catch { /* ignore */ }
  };

  const removeTag = async (tagId: string) => {
    try {
      await fetch(`/api/crm/contacts/${contactId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      onTagsChange?.();
    } catch { /* ignore */ }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch('/api/crm/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, name: newTagName.trim(), color: newTagColor }),
      });
      const tag = await res.json();
      if (tag.id) {
        setAllTags(prev => [...prev, tag]);
        await addTag(tag.id);
        setNewTagName('');
      }
    } catch { /* ignore */ }
  };

  const assignedIds = new Set(assignedTags.map(t => t.id));
  const availableTags = allTags.filter(t => !assignedIds.has(t.id));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {assignedTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button type="button" onClick={() => removeTag(tag.id)} className="hover:opacity-75">
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-stone hover:bg-gray-200 transition-colors"
        >
          <PlusIcon className="w-3 h-3" /> Add
        </button>
      </div>

      {showPicker && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
          {availableTags.length > 0 && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-medium text-stone mb-1">Existing tags</p>
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => { addTag(tag.id); setShowPicker(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1 hover:bg-cream-warm rounded text-sm text-left transition-colors"
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs font-medium text-stone mb-1">Create new tag</p>
            <div className="flex gap-2">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-8 h-8 rounded border-0 cursor-pointer"
              />
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal"
                onKeyDown={(e) => { if (e.key === 'Enter') createTag(); }}
              />
              <button
                type="button"
                onClick={createTag}
                className="px-2 py-1 bg-teal text-white rounded text-sm hover:bg-teal-dark transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
