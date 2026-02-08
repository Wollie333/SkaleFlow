'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  tags: Tag[];
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, name: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#06B6D4',
];

export function TagManager({ tags, onCreate, onUpdate, onDelete }: TagManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onCreate(name.trim(), color);
    setName('');
    setColor('#3B82F6');
    setShowCreate(false);
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setColor(tag.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !name.trim()) return;
    await onUpdate(editingId, name.trim(), color);
    setEditingId(null);
    setName('');
    setColor('#3B82F6');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-charcoal">Tags</h3>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null); setName(''); setColor('#3B82F6'); }}
          className="flex items-center gap-1 text-xs text-teal hover:text-teal/80"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add Tag
        </button>
      </div>

      {(showCreate || editingId) && (
        <div className="p-3 bg-cream rounded-lg border border-stone/10 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            className="w-full px-3 py-1.5 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-colors ${
                  color === c ? 'border-charcoal scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={editingId ? handleSaveEdit : handleCreate}
              disabled={!name.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50"
            >
              {editingId ? 'Save' : 'Create'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setEditingId(null); }}
              className="px-3 py-1.5 text-xs text-stone hover:text-charcoal"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream transition-colors group"
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
            <span className="text-sm text-charcoal flex-1">{tag.name}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(tag)} className="text-stone hover:text-charcoal">
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(tag.id)} className="text-stone hover:text-red-500">
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && !showCreate && (
          <p className="text-xs text-stone text-center py-4">No tags created yet</p>
        )}
      </div>
    </div>
  );
}
