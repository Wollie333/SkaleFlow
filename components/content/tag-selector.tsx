'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  organizationId: string;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagSelector({ organizationId, selectedTagIds, onTagsChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadTags();
  }, [organizationId]);

  const loadTags = async () => {
    try {
      const res = await fetch(`/api/content/tags?organizationId=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setAllTags(data.tags || []);
      }
    } catch {
      // silently fail
    }
    setIsLoading(false);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch('/api/content/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, name: newTagName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setAllTags(prev => [...prev, data.tag]);
        onTagsChange([...selectedTagIds, data.tag.id]);
        setNewTagName('');
        setShowCreate(false);
      }
    } catch {
      // silently fail
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  if (isLoading) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {allTags.map(tag => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selected
                  ? 'text-white'
                  : 'bg-stone/5 text-stone hover:bg-stone/10'
              }`}
              style={selected ? { backgroundColor: tag.color } : undefined}
            >
              {tag.name}
              {selected && <XMarkIcon className="w-3 h-3 ml-1 inline" />}
            </button>
          );
        })}

        {showCreate ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
              placeholder="Tag name"
              className="px-2 py-1 text-xs rounded-lg border border-stone/20 w-24 focus:outline-none focus:ring-1 focus:ring-teal"
              autoFocus
            />
            <button onClick={handleCreateTag} className="text-teal hover:text-teal/80">
              <PlusIcon className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowCreate(false); setNewTagName(''); }} className="text-stone">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone/5 text-stone hover:bg-stone/10 flex items-center gap-1"
          >
            <PlusIcon className="w-3 h-3" />
            New Tag
          </button>
        )}
      </div>
    </div>
  );
}
