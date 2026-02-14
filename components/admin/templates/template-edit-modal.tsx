'use client';

import { useState } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
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
  hook_rules: string | null;
  body_rules: string | null;
  cta_rules: string | null;
  tone_voice: string | null;
  formatting_rules: string | null;
  is_standardised: boolean;
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

type TabId = 'basics' | 'sections' | 'ai' | 'mappings';

export function TemplateEditModal({ template, onClose, onSaved }: Props) {
  const isCreate = !template;

  const [activeTab, setActiveTab] = useState<TabId>('basics');

  // Basics
  const [name, setName] = useState(template?.name || '');
  const [templateKey, setTemplateKey] = useState(template?.template_key || '');
  const [category, setCategory] = useState(template?.category || 'social_framework');
  const [contentType, setContentType] = useState(template?.content_type || 'post');
  const [formatCategory, setFormatCategory] = useState(template?.format_category || '');
  const [tier, setTier] = useState(template?.tier || 'core_rotation');
  const [funnelStages, setFunnelStages] = useState<string[]>(template?.funnel_stages || []);
  const [description, setDescription] = useState(template?.description || '');
  const [structure, setStructure] = useState(template?.structure || '');
  const [psychology, setPsychology] = useState(template?.psychology || '');
  const [whenToUse, setWhenToUse] = useState((template?.when_to_use || []).join('\n'));
  const [whenNotToUse, setWhenNotToUse] = useState((template?.when_not_to_use || []).join('\n'));
  const [exampleContent, setExampleContent] = useState(template?.example_content || '');

  // Standardised sections
  const [hookRules, setHookRules] = useState(template?.hook_rules || '');
  const [bodyRules, setBodyRules] = useState(template?.body_rules || '');
  const [ctaRules, setCtaRules] = useState(template?.cta_rules || '');
  const [toneVoice, setToneVoice] = useState(template?.tone_voice || '');
  const [formattingRules, setFormattingRules] = useState(template?.formatting_rules || '');

  // AI instructions
  const [promptInstructions, setPromptInstructions] = useState(template?.prompt_instructions || '');
  const [outputFormat, setOutputFormat] = useState(template?.output_format || '');

  // Settings
  const [isActive, setIsActive] = useState(template?.is_active !== false);
  const [sortOrder, setSortOrder] = useState(template?.sort_order || 0);

  // Stage mappings
  const [mappings, setMappings] = useState<Set<string>>(() => {
    const set = new Set<string>();
    (template?.template_stage_mappings || []).forEach(m => {
      set.add(`${m.funnel_stage}_${m.storybrand_stage}`);
    });
    return set;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiStandardising, setAiStandardising] = useState(false);

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

  // Compute standardised completeness
  const sectionFields = [
    { label: 'Hook Rules', filled: !!hookRules },
    { label: 'Body Rules', filled: !!bodyRules },
    { label: 'CTA Rules', filled: !!ctaRules },
    { label: 'Tone & Voice', filled: !!toneVoice },
    { label: 'Formatting', filled: !!formattingRules },
  ];
  const filledCount = sectionFields.filter(s => s.filled).length;
  const isStandardised = filledCount === 5;

  // AI auto-fill sections from existing template data
  const handleAIStandardise = async () => {
    if (!template?.id) return;
    setAiStandardising(true);
    setError('');

    try {
      const res = await fetch('/api/admin/templates/standardise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });

      const data = await res.json();
      if (res.ok && data.sections) {
        setHookRules(data.sections.hook_rules || '');
        setBodyRules(data.sections.body_rules || '');
        setCtaRules(data.sections.cta_rules || '');
        setToneVoice(data.sections.tone_voice || '');
        setFormattingRules(data.sections.formatting_rules || '');
      } else {
        setError(data.error || 'AI standardisation failed');
      }
    } catch {
      setError('Failed to standardise with AI');
    } finally {
      setAiStandardising(false);
    }
  };

  const handleSave = async () => {
    if (!name || !templateKey || (!promptInstructions && !isStandardised)) {
      setError('Name, template key, and either prompt instructions or all 5 standardised sections are required.');
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
        hook_rules: hookRules || null,
        body_rules: bodyRules || null,
        cta_rules: ctaRules || null,
        tone_voice: toneVoice || null,
        formatting_rules: formattingRules || null,
        is_standardised: isStandardised,
        is_active: isActive,
        sort_order: sortOrder,
      };

      const stageMappingsArray = Array.from(mappings).map(key => {
        const [funnel_stage, ...rest] = key.split('_');
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

  const TABS: Array<{ id: TabId; label: string; badge?: string }> = [
    { id: 'basics', label: 'Basics' },
    { id: 'sections', label: 'Sections', badge: `${filledCount}/5` },
    { id: 'ai', label: 'AI Prompt' },
    { id: 'mappings', label: 'Mappings', badge: `${mappings.size}` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-charcoal">
              {isCreate ? 'Add Template' : `Edit: ${template.name}`}
            </h2>
            {isStandardised ? (
              <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium">
                Standardised
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium">
                {filledCount}/5 sections
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-warm">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 px-6 pt-3 bg-cream-warm/30">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-charcoal border-t border-x border-stone/10'
                  : 'text-stone hover:text-charcoal'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                  activeTab === tab.id ? 'bg-teal/15 text-teal' : 'bg-stone/10 text-stone'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          {/* ── Tab: Basics ── */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
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
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg">
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
                  <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg">
                    <option value="post">Post</option>
                    <option value="script">Script</option>
                    <option value="hook">Hook</option>
                    <option value="cta">CTA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Format</label>
                  <select value={formatCategory} onChange={(e) => setFormatCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg">
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
                  <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg">
                    <option value="core_rotation">Core Rotation</option>
                    <option value="high_impact">High Impact</option>
                    <option value="strategic">Strategic</option>
                  </select>
                </div>
              </div>

              {/* Funnel stages */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Funnel Stages</label>
                <div className="flex gap-2">
                  {FUNNEL_STAGES.map(stage => (
                    <button key={stage} onClick={() => toggleFunnelStage(stage)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${funnelStages.includes(stage) ? 'bg-teal/15 text-teal border-teal/30' : 'bg-white text-stone border-stone/20 hover:border-stone/40'}`}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content fields */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" placeholder="Brief description" />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Structure</label>
                <input type="text" value={structure} onChange={(e) => setStructure(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" placeholder="Hook > Problem > Insight > CTA" />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Psychology</label>
                <textarea value={psychology} onChange={(e) => setPsychology(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">When to Use (one per line)</label>
                  <textarea value={whenToUse} onChange={(e) => setWhenToUse(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">When NOT to Use (one per line)</label>
                  <textarea value={whenNotToUse} onChange={(e) => setWhenNotToUse(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Example Content</label>
                <textarea value={exampleContent} onChange={(e) => setExampleContent(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" />
              </div>

              {/* Settings */}
              <div className="flex items-center gap-6 pt-2 border-t border-stone/10">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-stone/30 text-teal focus:ring-teal/30" />
                  Active
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-charcoal">Sort Order</label>
                  <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 text-sm border border-stone/20 rounded-lg" />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Standardised Sections ── */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              {/* Completeness indicator */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {sectionFields.map(s => (
                    <span key={s.label} className={`px-2 py-0.5 rounded text-[10px] font-medium ${s.filled ? 'bg-green-50 text-green-700' : 'bg-stone/10 text-stone/50'}`}>
                      {s.label}
                    </span>
                  ))}
                </div>
                {!isCreate && (
                  <button
                    onClick={handleAIStandardise}
                    disabled={aiStandardising}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    {aiStandardising ? 'Extracting...' : 'AI Auto-Fill'}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Hook Rules
                  <span className="text-stone/50 font-normal ml-1">How to open — grab attention in 1-2 lines</span>
                </label>
                <textarea value={hookRules} onChange={(e) => setHookRules(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" placeholder="Open with a bold, specific claim. Use second person. Under 2 sentences. Must create curiosity gap or name a pain point directly..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Body Rules
                  <span className="text-stone/50 font-normal ml-1">Main content structure, depth, evidence</span>
                </label>
                <textarea value={bodyRules} onChange={(e) => setBodyRules(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" placeholder="Follow the 3-point structure. Each point should have a clear heading. Include specific numbers or examples. Escalate stakes with each point..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  CTA Rules
                  <span className="text-stone/50 font-normal ml-1">How to close — what action to drive</span>
                </label>
                <textarea value={ctaRules} onChange={(e) => setCtaRules(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" placeholder="End with a single direct question that makes the reader reflect. Don't sell anything. The question should reference the named concept..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Tone & Voice
                  <span className="text-stone/50 font-normal ml-1">Writing style and personality</span>
                </label>
                <textarea value={toneVoice} onChange={(e) => setToneVoice(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" placeholder="Conversational but authoritative. Use short sentences. No jargon — a 16-year-old should understand. Slightly provocative without being preachy..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Formatting Rules
                  <span className="text-stone/50 font-normal ml-1">Word count, line breaks, platform rules</span>
                </label>
                <textarea value={formattingRules} onChange={(e) => setFormattingRules(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg" placeholder="200-350 words. Single-sentence paragraphs with blank lines. No emojis in body. Bold sparingly. 3-5 hashtags at end only if desired..." />
              </div>
            </div>
          )}

          {/* ── Tab: AI Prompt ── */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {isStandardised && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                  This template is standardised. The AI prompt will be auto-assembled from the 5 sections.
                  The field below serves as additional instructions appended after the standardised prompt.
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  {isStandardised ? 'Additional Prompt Instructions' : 'Prompt Instructions *'}
                </label>
                <textarea
                  value={promptInstructions}
                  onChange={(e) => setPromptInstructions(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone/20 rounded-lg"
                  placeholder="Instructions injected into the AI prompt..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Output Format (optional)</label>
                <textarea
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone/20 rounded-lg"
                  placeholder="Expected JSON schema"
                />
              </div>
            </div>
          )}

          {/* ── Tab: Stage Mappings ── */}
          {activeTab === 'mappings' && (
            <div>
              <h3 className="text-xs font-semibold text-stone/60 uppercase mb-3">
                Stage Mappings ({mappings.size} selected)
              </h3>
              <div className="overflow-x-auto">
                <table className="text-[10px] w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-1 px-1 text-stone/60"></th>
                      {STORYBRAND_STAGES.map(sb => (
                        <th key={sb} className="py-1 px-1 text-stone/60 font-medium">
                          {sb.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).substring(0, 8)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FUNNEL_STAGES.map(funnel => (
                      <tr key={funnel}>
                        <td className="py-1 px-1 font-medium text-charcoal">
                          {funnel.charAt(0).toUpperCase() + funnel.slice(1)}
                        </td>
                        {STORYBRAND_STAGES.map(sb => {
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
            </div>
          )}
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
