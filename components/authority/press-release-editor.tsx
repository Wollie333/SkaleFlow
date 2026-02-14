'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { CATEGORY_CONFIG } from '@/lib/authority/constants';
import type { AuthorityCategory, AuthorityPressReleaseStatus } from '@/lib/authority/types';

interface PressRelease {
  id: string;
  title: string;
  subtitle: string | null;
  headline: string;
  body_content: string;
  status: AuthorityPressReleaseStatus;
  boilerplate: string | null;
  contact_info: string | null;
  seo_keywords: string[] | null;
  published_at: string | null;
}

interface PressReleaseEditorProps {
  release: PressRelease;
  organizationId: string;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function PressReleaseEditor({ release, organizationId, onSave, onDelete }: PressReleaseEditorProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<AuthorityPressReleaseStatus>('draft');
  const [boilerplate, setBoilerplate] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiCategory, setAiCategory] = useState<AuthorityCategory>('press_release');
  const [aiContext, setAiContext] = useState('');

  useEffect(() => {
    setTitle(release.title);
    setSubtitle(release.subtitle || '');
    setHeadline(release.headline || '');
    setBody(release.body_content);
    setStatus(release.status);
    setBoilerplate(release.boilerplate || '');
    setContactInfo(release.contact_info || '');
  }, [release]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title,
        subtitle: subtitle || null,
        headline: headline || title,
        body_content: body,
        status,
        boilerplate: boilerplate || null,
        contact_info: contactInfo || null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/authority/ai/press-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          category: aiCategory,
          additionalContext: aiContext || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBody(data.text);
      }
    } finally {
      setGenerating(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: '#6b7280',
    in_review: '#f59e0b',
    published: '#22c55e',
    archived: '#9ca3af',
  };

  return (
    <div className="space-y-5">
      {/* Status & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AuthorityPressReleaseStatus)}
            className="px-3 py-1.5 border border-stone/20 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal/30"
            style={{ color: statusColors[status] }}
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          {release.published_at && (
            <span className="text-[10px] text-stone">Published {new Date(release.published_at).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Press Release Headline"
          className="w-full text-xl font-serif font-bold text-charcoal border-0 border-b border-stone/10 pb-2 focus:outline-none focus:border-teal placeholder:text-stone/30"
        />
      </div>

      {/* Subtitle */}
      <div>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subheadline (optional)"
          className="w-full text-sm text-stone border-0 border-b border-stone/5 pb-1.5 focus:outline-none focus:border-teal/30 placeholder:text-stone/20"
        />
      </div>

      {/* AI Generate */}
      <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gold flex items-center gap-1.5">
          <SparklesIcon className="w-3.5 h-3.5" />
          AI Generate
        </p>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={aiCategory}
            onChange={(e) => setAiCategory(e.target.value as AuthorityCategory)}
            className="px-2 py-1.5 border border-stone/15 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gold/30"
          >
            {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            placeholder="Additional context..."
            className="px-2 py-1.5 border border-stone/15 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
        </div>
        <button
          onClick={handleAIGenerate}
          disabled={generating}
          className="w-full py-1.5 text-xs font-medium text-gold border border-gold/30 rounded-lg hover:bg-gold/5 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Press Release'}
        </button>
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none font-mono"
          placeholder="Write your press release here..."
        />
      </div>

      {/* Boilerplate */}
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">Boilerplate ("About" section)</label>
        <textarea
          value={boilerplate}
          onChange={(e) => setBoilerplate(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30 resize-none"
          placeholder="About [Company Name]..."
        />
      </div>

      {/* Contact Info */}
      <div>
        <label className="block text-xs font-semibold text-charcoal mb-1">Media Contact</label>
        <textarea
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30 resize-none"
          placeholder="Name, Title, Email, Phone"
        />
      </div>
    </div>
  );
}
