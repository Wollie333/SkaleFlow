'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

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
  template_stage_mappings: StageMappingRow[];
}

interface Props {
  template: TemplateRow | null;
  onClose: () => void;
  onSaved: () => void;
}

const FUNNEL_STAGES = ['awareness', 'consideration', 'conversion'];
const STORYBRAND_STAGES = [
  'character', 'external_problem', 'internal_problem', 'philosophical_problem',
  'guide', 'plan', 'call_to_action', 'failure', 'success',
];

function generateKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

export function TemplateEditModal({ template, onClose, onSaved }: Props) {
  const isCreate = !template;

  const [name, setName] = useState(template?.name || '');
  const [templateKey, setTemplateKey] = useState(template?.template_key || '');
  const [category, setCategory] = useState(template?.category || 'social_framework');
  const [contentType, setContentType] = useState(template?.content_type || 'post');
  const [formatCategory, setFormatCategory] = useState(template?.format_category || '');
  const [tier, setTier] = useState(template?.tier || 'core_rotation');
  const [funnelStages, setFunnelStages] = useState<string[]>(template?.funnel_stages || []);
  const [structure, setStructure] = useState(template?.structure || '');
  const [psychology, setPsychology] = useState(template?.psychology || '');
  const [description, setDescription] = useState(template?.description || '');
  const [whenToUse, setWhenToUse] = useState((template?.when_to_use || []).join('\n'));
  const [whenNotToUse, setWhenNotToUse] = useState((template?.when_not_to_use || []).join('\n'));
  const [exampleContent, setExampleContent] = useState(template?.example_content || '');
  const [promptInstructions, setPromptInstructions] = useState(template?.prompt_instructions || '');
  const [outputFormat, setOutputFormat] = useState(template?.output_format || '');
  const [isActive, setIsActive] = useState(template?.is_active !== false);
  const [sortOrder, setSortOrder] = useState(template?.sort_order || 0);

  // Stage mappings as a Set of "funnel_storybrand" strings
  const [mappings, setMappings] = useState<Set<string>>(() => {
    const set = new Set<string>();
    (template?.template_stage_mappings || []).forEach(m => {
      set.add(`${m.funnel_stage}_${m.storybrand_stage}`);
    });
    return set;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (isCreate) {
      setTemplateKey(generateKey(newName));
    }
  };

  const toggleFunnelStage = (stage: string) => {
    setFunnelStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const toggleMapping = (key: string) => {
    setMappings(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!name || !templateKey || !promptInstructions) {
      setError('Name, template key, and prompt instructions are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const templateData = {
        template_key: templateKey,
        name,
        category,
        content_type: contentType,
        format_category: formatCategory || null,
        tier,
        funnel_stages: funnelStages,
        structure: structure || null,
        psychology: psychology || null,
        description: description || null,
        when_to_use: whenToUse ? whenToUse.split('\n').filter(Boolean) : null,
        when_not_to_use: whenNotToUse ? whenNotToUse.split('\n').filter(Boolean) : null,
        example_content: exampleContent || null,
        prompt_instructions: promptInstructions,
        output_format: outputFormat || null,
        is_active: isActive,
        sort_order: sortOrder,
      };

      const stageMappingsArray = Array.from(mappings).map(key => {
        const [funnel_stage, ...rest] = key.split('_');
        // storybrand_stage might contain underscores, so rejoin
        const storybrand_stage = rest.join('_');
        return {
          funnel_stage,
          storybrand_stage,
          is_primary: true,
          confidence_score: 80,
        };
      });

      let res;
      if (isCreate) {
        res = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: templateData, stageMappings: stageMappingsArray }),
        });
      } else {
        res = await fetch('/api/admin/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: template.id, template: templateData, stageMappings: stageMappingsArray }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save template');
        return;
      }

      onSaved();
    } catch {
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-semibold text-charcoal">
            {isCreate ? 'Add Template' : `Edit: ${template.name}`}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-warm">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          {/* Section: Basics */}
          <section>
            <h3 className="text-xs font-semibold text-stone/60 uppercase mb-3">Basics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                  placeholder="The Uncomfortable Truth"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Template Key *</label>
                <input
                  type="text"
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg font-mono"
                  placeholder="uncomfortable_truth"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                >
                  <option value="video_script">Video Script</option>
                  <option value="hook">Hook</option>
                  <option value="cta">CTA</option>
                  <option value="social_framework">Social Framework</option>
                  <option value="seo_content">SEO Content</option>
                  <option value="email_outreach">Email Outreach</option>
                  <option value="web_copy">Web Copy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                >
                  <option value="post">Post</option>
                  <option value="script">Script</option>
                  <option value="hook">Hook</option>
                  <option value="cta">CTA</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Format Category</label>
                <select
                  value={formatCategory}
                  onChange={(e) => setFormatCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                >
                  <option value="">None</option>
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                  <option value="carousel">Carousel</option>
                  <option value="static">Static</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                >
                  <option value="core_rotation">Core Rotation</option>
                  <option value="high_impact">High Impact</option>
                  <option value="strategic">Strategic</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Funnel Stages */}
          <section>
            <h3 className="text-xs font-semibold text-stone/60 uppercase mb-3">Funnel Stages</h3>
            <div className="flex gap-2">
              {FUNNEL_STAGES.map((stage) => (
                <button
                  key={stage}
                  onClick={() => toggleFunnelStage(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    funnelStages.includes(stage)
                      ? 'bg-teal/15 text-teal border-teal/30'
                      : 'bg-white text-stone border-stone/20 hover:border-stone/40'
                  }`}
                >
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Section: Content */}
          <section>
            <h3 className="text-xs font-semibold text-stone/60 uppercase mb-3">Content</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                  placeholder="Brief description for the admin list"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Structure</label>
                <input
                  type="text"
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                  placeholder="Hook → Problem → Insight → CTA"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Psychology</label>
                <textarea
                  value={psychology}
                  onChange={(e) => setPsychology(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                  placeholder="Why this framework works psychologically"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">When to Use (one per line)</label>
                  <textarea
                    value={whenToUse}
                    onChange={(e) => setWhenToUse(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">When NOT to Use (one per line)</label>
                  <textarea
                    value={whenNotToUse}
                    onChange={(e) => setWhenNotToUse(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Example Content</label>
                <textarea
                  value={exampleContent}
                  onChange={(e) => setExampleContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                  placeholder="Full example post/script"
                />
              </div>
            </div>
          </section>

          {/* Section: AI Instructions */}
          <section>
            <h3 className="text-xs font-semibold text-stone/60 uppercase mb-3">AI Instructions</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Prompt Instructions *</label>
                <textarea
                  value={promptInstructions}
                  onChange={(e) => setPromptInstructions(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone/20 rounded-lg"
                  placeholder="Instructions injected verbatim into the AI prompt..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Output Format (optional)</label>
                <textarea
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone/20 rounded-lg"
                  placeholder='Expected JSON schema for AI response (optional)'
                />
              </div>
            </div>
          </section>

          {/* Section: Stage Mappings Grid */}
          <section>
            <h3 className="text-xs font-semibold text-stone/60 uppercase mb-3">
              Stage Mappings ({mappings.size} selected)
            </h3>
            <div className="overflow-x-auto">
              <table className="text-[10px] w-full">
                <thead>
                  <tr>
                    <th className="text-left py-1 px-1 text-stone/60"></th>
                    {STORYBRAND_STAGES.map((sb) => (
                      <th key={sb} className="py-1 px-1 text-stone/60 font-medium">
                        {sb.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).substring(0, 8)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FUNNEL_STAGES.map((funnel) => (
                    <tr key={funnel}>
                      <td className="py-1 px-1 font-medium text-charcoal">
                        {funnel.charAt(0).toUpperCase() + funnel.slice(1)}
                      </td>
                      {STORYBRAND_STAGES.map((sb) => {
                        const key = `${funnel}_${sb}`;
                        return (
                          <td key={sb} className="py-1 px-1 text-center">
                            <input
                              type="checkbox"
                              checked={mappings.has(key)}
                              onChange={() => toggleMapping(key)}
                              className="w-3.5 h-3.5 rounded border-stone/30 text-teal focus:ring-teal/30"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section: Settings */}
          <section>
            <h3 className="text-xs font-semibold text-stone/60 uppercase mb-3">Settings</h3>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-stone/30 text-teal focus:ring-teal/30"
                />
                Active
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-charcoal">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm border border-stone/20 rounded-lg"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone/10">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isCreate ? 'Create Template' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
