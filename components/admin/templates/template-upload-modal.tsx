'use client';

import { useState, useRef } from 'react';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

interface StoryBrandMapping {
  stage: string;
  is_primary: boolean;
}

interface ParsedTemplate {
  name: string;
  structure: string | null;
  psychology: string | null;
  when_to_use: string[];
  when_not_to_use: string[];
  example_content: string | null;
  prompt_instructions: string | null;
  description: string | null;
  hook_rules: string | null;
  body_rules: string | null;
  cta_rules: string | null;
  tone_voice: string | null;
  formatting_rules: string | null;
  category: string | null;
  content_type: string | null;
  format_category: string | null;
  tier: string | null;
  funnel_stages: string[];
  storybrand_stages: StoryBrandMapping[];
  platforms: string[];
  word_count: string | null;
  has_front_matter: boolean;
  missing_sections: string[];
}

type InputMode = 'upload' | 'paste';

const CATEGORIES = [
  { value: 'social_framework', label: 'Social Framework' },
  { value: 'video_script', label: 'Video Script' },
  { value: 'hook', label: 'Hook' },
  { value: 'cta', label: 'CTA' },
  { value: 'seo_content', label: 'SEO Content' },
  { value: 'email_outreach', label: 'Email Outreach' },
  { value: 'web_copy', label: 'Web Copy' },
];

const CONTENT_TYPES = [
  { value: 'post', label: 'Post' },
  { value: 'script', label: 'Script' },
  { value: 'hook', label: 'Hook' },
  { value: 'cta', label: 'CTA' },
];

const FORMAT_CATEGORIES = [
  { value: '', label: 'Auto' },
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'static', label: 'Static' },
];

const TIERS = [
  { value: 'core_rotation', label: 'Core Rotation' },
  { value: 'high_impact', label: 'High Impact' },
  { value: 'strategic', label: 'Strategic' },
];

const FUNNEL_STAGES = ['awareness', 'consideration', 'conversion'];

const STORYBRAND_STAGES = [
  'character', 'external_problem', 'internal_problem', 'philosophical_problem',
  'guide', 'plan', 'call_to_action', 'failure', 'success',
];

const STORYBRAND_LABELS: Record<string, string> = {
  character: 'Character',
  external_problem: 'External Problem',
  internal_problem: 'Internal Problem',
  philosophical_problem: 'Philosophical',
  guide: 'Guide',
  plan: 'Plan',
  call_to_action: 'Call to Action',
  failure: 'Failure',
  success: 'Success',
};

export function TemplateUploadModal({ onClose, onSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [pastedMarkdown, setPastedMarkdown] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [parsed, setParsed] = useState<ParsedTemplate | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [error, setError] = useState('');
  const [classificationSource, setClassificationSource] = useState<'frontmatter' | 'ai' | 'manual'>('manual');
  const [aiReasoning, setAiReasoning] = useState('');

  // Editable form fields (populated from parse/classify, overridable by user)
  const [category, setCategory] = useState('social_framework');
  const [contentType, setContentType] = useState('post');
  const [formatCategory, setFormatCategory] = useState('');
  const [tier, setTier] = useState('core_rotation');
  const [funnelStages, setFunnelStages] = useState<string[]>([]);
  const [storybrandMappings, setStorybrandMappings] = useState<StoryBrandMapping[]>([]);
  const [saving, setSaving] = useState(false);

  // ── Parse markdown (file or pasted) ──────────────────────────────────
  const handleParse = async (markdown?: string, uploadFile?: File) => {
    setError('');
    setParsing(true);

    try {
      let res: Response;

      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        res = await fetch('/api/admin/templates/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        const md = markdown || pastedMarkdown;
        if (!md.trim()) {
          setError('Please paste some markdown content');
          setParsing(false);
          return;
        }
        res = await fetch('/api/admin/templates/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown: md }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to parse');
        setParsed(null);
        return;
      }

      const p: ParsedTemplate = data.parsed;
      setParsed(p);
      setRawMarkdown(data.rawMarkdown);

      // Populate form fields from front matter if available
      if (p.has_front_matter) {
        setClassificationSource('frontmatter');
        if (p.category) setCategory(p.category);
        if (p.content_type) setContentType(p.content_type);
        if (p.format_category) setFormatCategory(p.format_category);
        if (p.tier) setTier(p.tier);
        if (p.funnel_stages.length > 0) setFunnelStages(p.funnel_stages);
        if (p.storybrand_stages.length > 0) setStorybrandMappings(p.storybrand_stages);
      } else {
        // No front matter — auto-classify with AI
        setClassificationSource('manual');
        await runAIClassification(p, data.rawMarkdown);
      }
    } catch {
      setError('Failed to parse markdown');
    } finally {
      setParsing(false);
    }
  };

  // ── AI Classification ────────────────────────────────────────────────
  const runAIClassification = async (p: ParsedTemplate, rawMd: string) => {
    setClassifying(true);
    try {
      const res = await fetch('/api/admin/templates/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: p.name,
          description: p.description,
          structure: p.structure,
          psychology: p.psychology,
          prompt_instructions: p.prompt_instructions,
          rawMarkdown: rawMd,
        }),
      });

      const data = await res.json();
      if (res.ok && data.classification) {
        const c = data.classification;
        setClassificationSource('ai');
        setCategory(c.category);
        setContentType(c.content_type);
        setFormatCategory(c.format_category || '');
        setTier(c.tier);
        setFunnelStages(c.funnel_stages);
        setStorybrandMappings(c.storybrand_stages);
        setAiReasoning(c.reasoning || '');
      }
    } catch {
      // Silently fail — user can still set fields manually
    } finally {
      setClassifying(false);
    }
  };

  // ── File select handler ──────────────────────────────────────────────
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.md')) {
      setError('Only .md files are supported');
      return;
    }
    setFile(selectedFile);
    await handleParse(undefined, selectedFile);
  };

  // ── Toggle helpers ───────────────────────────────────────────────────
  const toggleFunnelStage = (stage: string) => {
    setFunnelStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const toggleStorybrandStage = (stage: string) => {
    setStorybrandMappings(prev => {
      const exists = prev.find(m => m.stage === stage);
      if (exists) return prev.filter(m => m.stage !== stage);
      return [...prev, { stage, is_primary: false }];
    });
  };

  const toggleStorybrandPrimary = (stage: string) => {
    setStorybrandMappings(prev =>
      prev.map(m => m.stage === stage ? { ...m, is_primary: !m.is_primary } : m)
    );
  };

  // ── Create template ──────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!parsed) return;

    // Strict validation: block creation if sections are missing
    if (parsed.missing_sections.length > 0) {
      setError(
        `Cannot create template — missing sections: ${parsed.missing_sections.join(', ')}. ` +
        'Download the layout file for the required format.'
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const templateKey = parsed.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);

      // Build stage mappings for each funnel + storybrand combination
      const stageMappings: Array<{
        funnel_stage: string;
        storybrand_stage: string;
        is_primary: boolean;
        confidence_score: number;
      }> = [];

      const activeFunnelStages = funnelStages.length > 0 ? funnelStages : ['awareness'];

      for (const sb of storybrandMappings) {
        for (const fs of activeFunnelStages) {
          stageMappings.push({
            funnel_stage: fs,
            storybrand_stage: sb.stage,
            is_primary: sb.is_primary,
            confidence_score: sb.is_primary ? 90 : 75,
          });
        }
      }

      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: {
            template_key: templateKey,
            name: parsed.name,
            category,
            content_type: contentType,
            format_category: formatCategory || null,
            tier,
            funnel_stages: funnelStages,
            structure: parsed.structure,
            psychology: parsed.psychology,
            description: parsed.description,
            when_to_use: parsed.when_to_use.length > 0 ? parsed.when_to_use : null,
            when_not_to_use: parsed.when_not_to_use.length > 0 ? parsed.when_not_to_use : null,
            example_content: parsed.example_content,
            prompt_instructions: parsed.prompt_instructions || `Use the following framework:\n${parsed.structure || parsed.name}`,
            hook_rules: parsed.hook_rules,
            body_rules: parsed.body_rules,
            cta_rules: parsed.cta_rules,
            tone_voice: parsed.tone_voice,
            formatting_rules: parsed.formatting_rules,
            markdown_source: rawMarkdown,
          },
          stageMappings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create template');
        return;
      }

      onSaved();
    } catch {
      setError('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  // ── Source indicator badge ───────────────────────────────────────────
  const SourceBadge = () => {
    if (classifying) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
          <SparklesIcon className="w-3.5 h-3.5 animate-pulse" />
          AI classifying...
        </div>
      );
    }
    if (classificationSource === 'frontmatter') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          From front matter
        </div>
      );
    }
    if (classificationSource === 'ai') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
          <SparklesIcon className="w-3.5 h-3.5" />
          AI classified
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone/10 text-stone text-xs font-medium">
        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
        Manual
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-charcoal">Import Template</h2>
            {parsed && <SourceBadge />}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-warm">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          {/* Input mode toggle */}
          {!parsed && (
            <>
              <div className="flex gap-1 bg-cream-warm rounded-lg p-0.5 w-fit">
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'upload'
                      ? 'bg-white text-charcoal shadow-sm'
                      : 'text-stone hover:text-charcoal'
                  }`}
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'paste'
                      ? 'bg-white text-charcoal shadow-sm'
                      : 'text-stone hover:text-charcoal'
                  }`}
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  Paste Markdown
                </button>
              </div>

              {/* Upload file mode */}
              {inputMode === 'upload' && (
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile) handleFileSelect(droppedFile);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-stone/30 rounded-xl p-8 text-center cursor-pointer hover:border-teal/50 transition-colors"
                >
                  <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-stone/40 mb-3" />
                  <p className="text-sm font-medium text-charcoal">
                    {parsing ? 'Parsing...' : 'Drop .md file here or click to browse'}
                  </p>
                  <p className="text-xs text-stone/60 mt-1">
                    Supports YAML front matter for auto-classification
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".md"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                  />
                </div>
              )}

              {/* Paste markdown mode */}
              {inputMode === 'paste' && (
                <div className="space-y-3">
                  <textarea
                    value={pastedMarkdown}
                    onChange={(e) => setPastedMarkdown(e.target.value)}
                    placeholder={`Paste your .md template here...\n\nTip: Include YAML front matter between --- fences for auto-classification:\n---\ncategory: social_framework\ntier: high_impact\nfunnel_stages: awareness, consideration\n---\n\n# Template Name\n...`}
                    rows={14}
                    className="w-full px-4 py-3 text-sm font-mono border border-stone/20 rounded-lg resize-y focus:outline-none focus:border-teal/50 bg-stone/5"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleParse()}
                    disabled={parsing || !pastedMarkdown.trim()}
                  >
                    {parsing ? 'Parsing...' : 'Parse & Classify'}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Parsed preview + classification form */}
          {parsed && (
            <div className="space-y-5">
              {/* AI reasoning */}
              {aiReasoning && classificationSource === 'ai' && (
                <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-700">
                  <span className="font-semibold">AI reasoning:</span> {aiReasoning}
                </div>
              )}

              {/* Template name preview */}
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-teal" />
                <span className="text-base font-semibold text-charcoal">{parsed.name}</span>
                {file && (
                  <span className="text-xs text-stone/50">{file.name}</span>
                )}
              </div>

              {/* Parsed content preview (collapsible) */}
              <details className="bg-cream-warm rounded-lg">
                <summary className="px-4 py-2.5 text-xs font-semibold text-stone/60 cursor-pointer hover:text-charcoal">
                  Parsed Content Preview
                </summary>
                <div className="px-4 pb-3 space-y-2 text-sm">
                  {parsed.description && (
                    <div>
                      <span className="text-xs font-semibold text-stone/60">Description:</span>
                      <p className="text-charcoal">{parsed.description.substring(0, 200)}</p>
                    </div>
                  )}
                  {parsed.structure && (
                    <div>
                      <span className="text-xs font-semibold text-stone/60">Structure:</span>
                      <p className="text-charcoal">{parsed.structure.substring(0, 200)}</p>
                    </div>
                  )}
                  {parsed.psychology && (
                    <div>
                      <span className="text-xs font-semibold text-stone/60">Psychology:</span>
                      <p className="text-charcoal">{parsed.psychology.substring(0, 200)}</p>
                    </div>
                  )}
                  {parsed.when_to_use.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-stone/60">When to Use:</span>
                      <ul className="ml-2">
                        {parsed.when_to_use.slice(0, 4).map((item, i) => (
                          <li key={i} className="text-charcoal">+ {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {parsed.prompt_instructions && (
                    <div>
                      <span className="text-xs font-semibold text-stone/60">Prompt Instructions:</span>
                      <pre className="mt-1 text-xs font-mono bg-white rounded p-2 max-h-24 overflow-auto whitespace-pre-wrap">
                        {parsed.prompt_instructions.substring(0, 500)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>

              {/* Missing sections — blocks creation */}
              {parsed.missing_sections.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-800 mb-1">
                    Missing required sections ({parsed.missing_sections.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {parsed.missing_sections.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-red-600 mt-1.5">
                    Template cannot be created until all sections are present. Download the layout file for the required format.
                  </p>
                </div>
              )}

              {parsed.missing_sections.length === 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">All standardised sections present — template is fully standardised</span>
                </div>
              )}

              {/* ── Classification Fields ─────────────────────────── */}
              <div className="border-t border-stone/10 pt-4">
                <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wide mb-3">
                  Classification
                </h3>

                {/* Category + Content Type + Format */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-charcoal mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg bg-white"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-charcoal mb-1">Content Type</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg bg-white"
                    >
                      {CONTENT_TYPES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-charcoal mb-1">Format</label>
                    <select
                      value={formatCategory}
                      onChange={(e) => setFormatCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg bg-white"
                    >
                      {FORMAT_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tier */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-charcoal mb-1">Tier</label>
                  <div className="flex gap-2">
                    {TIERS.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setTier(t.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          tier === t.value
                            ? 'bg-teal/15 text-teal border-teal/30'
                            : 'bg-white text-stone border-stone/20 hover:border-stone/40'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Funnel Stages */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-charcoal mb-1">Funnel Stages</label>
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
                </div>

                {/* StoryBrand Stage Mappings */}
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">
                    StoryBrand Stages
                    <span className="text-stone/50 font-normal ml-1">(click to toggle, double-click for primary)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STORYBRAND_STAGES.map((stage) => {
                      const mapping = storybrandMappings.find(m => m.stage === stage);
                      const isSelected = !!mapping;
                      const isPrimary = mapping?.is_primary || false;

                      return (
                        <button
                          key={stage}
                          onClick={() => toggleStorybrandStage(stage)}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            if (isSelected) toggleStorybrandPrimary(stage);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isPrimary
                              ? 'bg-teal text-white border-teal'
                              : isSelected
                              ? 'bg-teal/15 text-teal border-teal/30'
                              : 'bg-white text-stone border-stone/20 hover:border-stone/40'
                          }`}
                        >
                          {STORYBRAND_LABELS[stage]}
                          {isPrimary && ' *'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Re-classify button */}
              {parsed && !classifying && (
                <button
                  onClick={() => runAIClassification(parsed, rawMarkdown)}
                  className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Re-classify with AI
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone/10">
          <div>
            {parsed && (
              <button
                onClick={() => {
                  setParsed(null);
                  setFile(null);
                  setPastedMarkdown('');
                  setRawMarkdown('');
                  setError('');
                  setClassificationSource('manual');
                  setAiReasoning('');
                }}
                className="text-xs text-stone hover:text-charcoal font-medium"
              >
                Start Over
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {parsed && (
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={saving || classifying || parsed.missing_sections.length > 0}
              >
                {saving ? 'Creating...' : 'Create Template'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
