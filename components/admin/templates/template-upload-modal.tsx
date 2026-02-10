'use client';

import { useState, useRef } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface Props {
  onClose: () => void;
  onSaved: () => void;
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
}

export function TemplateUploadModal({ onClose, onSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedTemplate | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [error, setError] = useState('');

  // Form fields for the template being created
  const [category, setCategory] = useState('social_framework');
  const [tier, setTier] = useState('core_rotation');
  const [funnelStages, setFunnelStages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.md')) {
      setError('Only .md files are supported');
      return;
    }

    setFile(selectedFile);
    setError('');
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/admin/templates/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to parse file');
        setParsed(null);
        return;
      }

      setParsed(data.parsed);
      setRawMarkdown(data.rawMarkdown);
    } catch {
      setError('Failed to parse file');
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const toggleFunnelStage = (stage: string) => {
    setFunnelStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const handleCreate = async () => {
    if (!parsed) return;

    setSaving(true);
    setError('');

    try {
      const templateKey = parsed.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);

      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: {
            template_key: templateKey,
            name: parsed.name,
            category,
            content_type: category === 'hook' ? 'hook' : category === 'cta' ? 'cta' : 'post',
            tier,
            funnel_stages: funnelStages,
            structure: parsed.structure,
            psychology: parsed.psychology,
            description: parsed.description,
            when_to_use: parsed.when_to_use.length > 0 ? parsed.when_to_use : null,
            when_not_to_use: parsed.when_not_to_use.length > 0 ? parsed.when_not_to_use : null,
            example_content: parsed.example_content,
            prompt_instructions: parsed.prompt_instructions || `Use the following framework:\n${parsed.structure || parsed.name}`,
            markdown_source: rawMarkdown,
          },
          stageMappings: [],
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-semibold text-charcoal">Upload Template (.md)</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-warm">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          {/* Drop zone */}
          {!parsed && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-stone/30 rounded-xl p-8 text-center cursor-pointer hover:border-teal/50 transition-colors"
            >
              <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-stone/40 mb-3" />
              <p className="text-sm font-medium text-charcoal">
                {parsing ? 'Parsing...' : 'Drop .md file here or click to browse'}
              </p>
              <p className="text-xs text-stone/60 mt-1">Only .md files are supported</p>
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

          {/* Parsed preview */}
          {parsed && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-teal">
                <DocumentTextIcon className="w-4 h-4" />
                Parsed: {file?.name}
              </div>

              <div className="bg-cream-warm rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-stone/60">Name:</span>
                  <span className="ml-2 text-sm text-charcoal">{parsed.name}</span>
                </div>
                {parsed.structure && (
                  <div>
                    <span className="text-xs font-semibold text-stone/60">Structure:</span>
                    <span className="ml-2 text-sm text-charcoal">{parsed.structure}</span>
                  </div>
                )}
                {parsed.psychology && (
                  <div>
                    <span className="text-xs font-semibold text-stone/60">Psychology:</span>
                    <span className="ml-2 text-sm text-charcoal">{parsed.psychology}</span>
                  </div>
                )}
                {parsed.when_to_use.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-stone/60">When to Use:</span>
                    <ul className="ml-4 text-sm text-charcoal">
                      {parsed.when_to_use.map((item, i) => (
                        <li key={i}>+ {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {parsed.prompt_instructions && (
                  <div>
                    <span className="text-xs font-semibold text-stone/60">Prompt Instructions:</span>
                    <pre className="mt-1 text-xs font-mono bg-white rounded p-2 max-h-32 overflow-auto">
                      {parsed.prompt_instructions}
                    </pre>
                  </div>
                )}
              </div>

              {/* Category + Tier + Funnel selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone/20 rounded-lg"
                  >
                    <option value="social_framework">Social Framework</option>
                    <option value="video_script">Video Script</option>
                    <option value="hook">Hook</option>
                    <option value="cta">CTA</option>
                    <option value="seo_content">SEO Content</option>
                    <option value="email_outreach">Email Outreach</option>
                    <option value="web_copy">Web Copy</option>
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

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Funnel Stages</label>
                <div className="flex gap-2">
                  {['awareness', 'consideration', 'conversion'].map((stage) => (
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone/10">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {parsed && (
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Template'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
