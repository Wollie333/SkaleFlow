'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  TagIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';

interface SavedReply {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  body: string;
  category: string;
  shortcut: string | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'greeting', label: 'Greetings' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'faq', label: 'FAQ' },
  { value: 'closing', label: 'Closing' },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-stone/10 text-stone',
  greeting: 'bg-teal/10 text-teal',
  support: 'bg-blue-600/10 text-blue-600',
  sales: 'bg-gold/10 text-gold',
  faq: 'bg-purple-600/10 text-purple-600',
  closing: 'bg-green-600/10 text-green-600',
};

interface SavedRepliesClientProps {
  organizationId: string;
}

export function SavedRepliesClient({ organizationId }: SavedRepliesClientProps) {
  const [replies, setReplies] = useState<SavedReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingReply, setEditingReply] = useState<SavedReply | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formShortcut, setFormShortcut] = useState('');
  const [formError, setFormError] = useState('');

  const fetchReplies = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/social/replies?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReplies(data.replies || []);
    } catch (err) {
      console.error('Error fetching saved replies:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setLoading(true);
    fetchReplies();
  }, [fetchReplies]);

  const openCreateForm = () => {
    setEditingReply(null);
    setFormName('');
    setFormBody('');
    setFormCategory('general');
    setFormShortcut('');
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (reply: SavedReply) => {
    setEditingReply(reply);
    setFormName(reply.name);
    setFormBody(reply.body);
    setFormCategory(reply.category);
    setFormShortcut(reply.shortcut || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formBody.trim()) {
      setFormError('Name and message body are required');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = {
        name: formName,
        body: formBody,
        category: formCategory,
        shortcut: formShortcut || null,
      };

      const url = editingReply
        ? `/api/social/replies/${editingReply.id}`
        : '/api/social/replies';

      const res = await fetch(url, {
        method: editingReply ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Failed to save');
        return;
      }

      setShowForm(false);
      fetchReplies();
    } catch (err) {
      setFormError('Failed to save reply');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved reply?')) return;

    try {
      await fetch(`/api/social/replies/${id}`, { method: 'DELETE' });
      setReplies((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting reply:', err);
    }
  };

  const handleCopy = (reply: SavedReply) => {
    navigator.clipboard.writeText(reply.body);
    setCopiedId(reply.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Saved Replies"
        subtitle="Quick response templates for social inbox conversations"
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search replies..."
            className="w-full pl-10 pr-4 py-2.5 bg-cream-warm border border-stone/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          />
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal text-white rounded-xl text-sm font-medium hover:bg-teal/90 transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          New Reply
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              activeCategory === cat.value
                ? 'bg-teal text-white'
                : 'bg-cream-warm border border-stone/10 text-stone hover:text-charcoal hover:bg-stone/5'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Reply Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-cream-warm rounded-xl border border-stone/10 p-5 animate-pulse">
              <div className="h-4 bg-stone/10 rounded w-2/3 mb-3" />
              <div className="h-3 bg-stone/10 rounded w-full mb-2" />
              <div className="h-3 bg-stone/10 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : replies.length === 0 ? (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal/10 rounded-full flex items-center justify-center">
            <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">
            {searchQuery || activeCategory !== 'all' ? 'No replies found' : 'No saved replies yet'}
          </h3>
          <p className="text-sm text-stone mb-4">
            {searchQuery || activeCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create quick response templates to speed up your inbox replies'}
          </p>
          {!searchQuery && activeCategory === 'all' && (
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal text-white rounded-xl text-sm font-medium hover:bg-teal/90 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create Your First Reply
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden hover:border-teal/30 transition-colors group"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-charcoal text-sm truncate">{reply.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[reply.category] || CATEGORY_COLORS.general)}>
                        {reply.category}
                      </span>
                      {reply.shortcut && (
                        <span className="flex items-center gap-1 text-[10px] text-stone/60">
                          <BoltIcon className="w-3 h-3" />
                          /{reply.shortcut}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-stone/40 ml-2 whitespace-nowrap">
                    {reply.use_count} uses
                  </span>
                </div>

                {/* Body preview */}
                <p className="text-sm text-stone line-clamp-3 leading-relaxed">{reply.body}</p>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-stone/10 bg-cream/30 flex items-center justify-between">
                <button
                  onClick={() => handleCopy(reply)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium transition-colors',
                    copiedId === reply.id
                      ? 'text-green-600'
                      : 'text-teal hover:text-teal-dark'
                  )}
                >
                  <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                  {copiedId === reply.id ? 'Copied!' : 'Copy'}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(reply)}
                    className="p-1.5 text-stone hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(reply.id)}
                    className="p-1.5 text-stone hover:text-red-600 hover:bg-red-600/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-cream-warm rounded-2xl border border-stone/10 shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
              <h3 className="font-semibold text-charcoal">
                {editingReply ? 'Edit Reply' : 'New Saved Reply'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-stone hover:text-charcoal hover:bg-stone/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1.5">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Welcome message"
                  className="w-full px-4 py-2.5 bg-cream/50 border border-stone/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1.5">Message</label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Type your saved reply message..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-cream/50 border border-stone/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal resize-none"
                />
              </div>

              {/* Category + Shortcut */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1.5">
                    <TagIcon className="inline w-3.5 h-3.5 mr-1" />
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream/50 border border-stone/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1.5">
                    <BoltIcon className="inline w-3.5 h-3.5 mr-1" />
                    Shortcut
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/40 text-sm">/</span>
                    <input
                      type="text"
                      value={formShortcut}
                      onChange={(e) => setFormShortcut(e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase())}
                      placeholder="e.g., welcome"
                      className="w-full pl-7 pr-4 py-2.5 bg-cream/50 border border-stone/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone/10 bg-cream/30">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm font-medium text-stone hover:text-charcoal transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-teal text-white rounded-xl text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingReply ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
