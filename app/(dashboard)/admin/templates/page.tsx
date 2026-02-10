'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui';
import { Button } from '@/components/ui';
import {
  DocumentTextIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { TemplateEditModal } from '@/components/admin/templates/template-edit-modal';
import { TemplateUploadModal } from '@/components/admin/templates/template-upload-modal';
import { BulkImportModal } from '@/components/admin/templates/bulk-import-modal';

interface StageMappingRow {
  id: string;
  template_id: string;
  funnel_stage: string;
  storybrand_stage: string;
  is_primary: boolean;
  confidence_score: number;
}

interface TemplateRow {
  id: string;
  template_key: string;
  name: string;
  category: string;
  content_type: string;
  format_category: string | null;
  tier: string;
  funnel_stages: string[];
  structure: string | null;
  psychology: string | null;
  description: string | null;
  when_to_use: string[] | null;
  when_not_to_use: string[] | null;
  example_content: string | null;
  prompt_instructions: string;
  output_format: string | null;
  markdown_source: string | null;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  template_stage_mappings: StageMappingRow[];
}

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'video_script', label: 'Video Scripts' },
  { value: 'hook', label: 'Hooks' },
  { value: 'cta', label: 'CTAs' },
  { value: 'social_framework', label: 'Social Posts' },
  { value: 'seo_content', label: 'SEO' },
  { value: 'email_outreach', label: 'Email' },
  { value: 'web_copy', label: 'Web Copy' },
];

const CATEGORY_COLORS: Record<string, string> = {
  video_script: 'bg-purple-100 text-purple-800',
  hook: 'bg-indigo-100 text-indigo-800',
  cta: 'bg-cyan-100 text-cyan-800',
  social_framework: 'bg-teal/15 text-teal',
  seo_content: 'bg-green-100 text-green-800',
  email_outreach: 'bg-amber-100 text-amber-800',
  web_copy: 'bg-blue-100 text-blue-800',
};

const TIER_COLORS: Record<string, string> = {
  core_rotation: 'bg-stone/10 text-stone',
  high_impact: 'bg-gold/15 text-gold',
  strategic: 'bg-teal/15 text-teal',
};

const CATEGORY_LABELS: Record<string, string> = {
  video_script: 'Video Script',
  hook: 'Hook',
  cta: 'CTA',
  social_framework: 'Social Post',
  seo_content: 'SEO',
  email_outreach: 'Email',
  web_copy: 'Web Copy',
};

const TIER_LABELS: Record<string, string> = {
  core_rotation: 'Core Rotation',
  high_impact: 'High Impact',
  strategic: 'Strategic',
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<TemplateRow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (tierFilter) params.set('tier', tierFilter);
      if (activeFilter) params.set('active', activeFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/templates?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load templates');
        return;
      }

      setTemplates(data.templates);
    } catch {
      setError('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, tierFilter, activeFilter, search]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleToggleActive = async (template: TemplateRow) => {
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active }),
      });

      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error('Failed to toggle template:', err);
    }
  };

  const handleDelete = async (template: TemplateRow) => {
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleSaved = () => {
    setEditTemplate(null);
    setShowCreateModal(false);
    fetchTemplates();
  };

  const filteredTemplates = templates;
  const totalActive = templates.filter(t => t.is_active).length;
  const totalInactive = templates.filter(t => !t.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DocumentTextIcon}
        title="Content Templates"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/users' },
          { label: 'Templates' },
        ]}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadModal(true)}
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1.5" />
              Upload .md
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkImportModal(true)}
            >
              <DocumentDuplicateIcon className="w-4 h-4 mr-1.5" />
              Bulk Import
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              Add Template
            </Button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="flex gap-4 text-sm text-stone">
        <span>{templates.length} templates</span>
        <span className="text-stone/30">|</span>
        <span className="text-teal">{totalActive} active</span>
        <span className="text-stone/30">|</span>
        <span className="text-stone/50">{totalInactive} inactive</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category tabs */}
        <div className="flex gap-1 bg-cream-warm rounded-lg p-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === cat.value
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-stone hover:text-charcoal'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tier filter */}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="text-xs border border-stone/20 rounded-lg px-2.5 py-1.5 bg-white"
        >
          <option value="">All Tiers</option>
          <option value="core_rotation">Core Rotation</option>
          <option value="high_impact">High Impact</option>
          <option value="strategic">Strategic</option>
        </select>

        {/* Active filter */}
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="text-xs border border-stone/20 rounded-lg px-2.5 py-1.5 bg-white"
        >
          <option value="">All Status</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/40" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone/20 rounded-lg bg-white"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-stone/60">Loading templates...</div>
      )}

      {/* Templates list */}
      {!isLoading && (
        <div className="space-y-2">
          {filteredTemplates.map((template) => {
            const isExpanded = expandedId === template.id;

            return (
              <div
                key={template.id}
                className={`border rounded-lg transition-colors ${
                  template.is_active ? 'border-stone/15 bg-white' : 'border-stone/10 bg-stone/5'
                }`}
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : template.id)}
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-stone/40 shrink-0" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-stone/40 shrink-0" />
                  )}

                  {/* Active indicator */}
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      template.is_active ? 'bg-green-400' : 'bg-stone/30'
                    }`}
                  />

                  {/* Name + key */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal truncate">
                        {template.name}
                      </span>
                      <span className="text-[10px] text-stone/50 font-mono">
                        {template.template_key}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[template.category] || 'bg-stone/10 text-stone'}`}>
                    {CATEGORY_LABELS[template.category] || template.category}
                  </span>

                  {template.format_category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone/10 text-stone">
                      {template.format_category}
                    </span>
                  )}

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TIER_COLORS[template.tier] || 'bg-stone/10 text-stone'}`}>
                    {TIER_LABELS[template.tier] || template.tier}
                  </span>

                  {/* Funnel stages */}
                  <div className="flex gap-1">
                    {(template.funnel_stages || []).map((stage) => (
                      <span
                        key={stage}
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-teal/10 text-teal"
                      >
                        {stage.charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>

                  {/* System badge */}
                  {template.is_system && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-stone/10 text-stone/60">
                      System
                    </span>
                  )}

                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditTemplate(template);
                    }}
                    className="p-1.5 rounded-lg hover:bg-cream-warm text-stone hover:text-charcoal transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-stone/10 px-4 py-4 space-y-4">
                    {template.structure && (
                      <div>
                        <h4 className="text-xs font-semibold text-stone/60 uppercase mb-1">Structure</h4>
                        <p className="text-sm text-charcoal">{template.structure}</p>
                      </div>
                    )}

                    {template.psychology && (
                      <div>
                        <h4 className="text-xs font-semibold text-stone/60 uppercase mb-1">Psychology</h4>
                        <p className="text-sm text-charcoal">{template.psychology}</p>
                      </div>
                    )}

                    {template.when_to_use && template.when_to_use.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-green-700 uppercase mb-1">When to Use</h4>
                        <ul className="text-sm text-charcoal space-y-0.5">
                          {template.when_to_use.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-green-500 mt-1">+</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {template.when_not_to_use && template.when_not_to_use.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-700 uppercase mb-1">When NOT to Use</h4>
                        <ul className="text-sm text-charcoal space-y-0.5">
                          {template.when_not_to_use.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-red-500 mt-1">-</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {template.example_content && (
                      <div>
                        <h4 className="text-xs font-semibold text-stone/60 uppercase mb-1">Example</h4>
                        <pre className="text-xs bg-cream-warm rounded-lg p-3 whitespace-pre-wrap font-mono">
                          {template.example_content}
                        </pre>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-stone/60 uppercase mb-1">Prompt Instructions</h4>
                      <pre className="text-xs bg-dark/5 rounded-lg p-3 whitespace-pre-wrap font-mono text-charcoal max-h-40 overflow-auto">
                        {template.prompt_instructions}
                      </pre>
                    </div>

                    {/* Stage mappings */}
                    {template.template_stage_mappings.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-stone/60 uppercase mb-1">
                          Stage Mappings ({template.template_stage_mappings.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {template.template_stage_mappings.map((m) => (
                            <span
                              key={m.id}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                m.is_primary ? 'bg-teal/15 text-teal' : 'bg-stone/10 text-stone'
                              }`}
                            >
                              {m.funnel_stage}/{m.storybrand_stage}
                              {m.is_primary && ' *'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2 border-t border-stone/10">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditTemplate(template)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(template)}
                      >
                        {template.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      {!template.is_system && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(template)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredTemplates.length === 0 && !isLoading && (
            <div className="text-center py-12 text-stone/60">
              No templates found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editTemplate && (
        <TemplateEditModal
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <TemplateEditModal
          template={null}
          onClose={() => setShowCreateModal(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <TemplateUploadModal
          onClose={() => setShowUploadModal(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          onClose={() => setShowBulkImportModal(false)}
          onSaved={() => {
            setShowBulkImportModal(false);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}
