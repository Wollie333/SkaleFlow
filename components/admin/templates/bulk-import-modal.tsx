'use client';

import { useState, useRef } from 'react';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

interface ParsedTemplate {
  name: string;
  template_key: string;
  structure: string | null;
  psychology: string | null;
  when_to_use: string[];
  when_not_to_use: string[];
  example_content: string | null;
  prompt_instructions: string | null;
  description: string | null;
  markdown_source: string;
}

type Step = 'upload' | 'preview' | 'success';

export function BulkImportModal({ onClose, onSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');

  // Preview state
  const [templates, setTemplates] = useState<ParsedTemplate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [editedKeys, setEditedKeys] = useState<Record<number, string>>({});

  // Config state
  const [category, setCategory] = useState('social_framework');
  const [tier, setTier] = useState('core_rotation');
  const [funnelStages, setFunnelStages] = useState<string[]>([]);

  // Import state
  const [importing, setImporting] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.md')) {
      setError('Only .md files are supported');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    setFile(selectedFile);
    setError('');
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/admin/templates/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to parse file');
        return;
      }

      const parsed: ParsedTemplate[] = data.templates;
      setTemplates(parsed);
      // Select all by default
      setSelected(new Set(parsed.map((_, i) => i)));
      setEditedKeys({});
      setStep('preview');
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

  const toggleSelection = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === templates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(templates.map((_, i) => i)));
    }
  };

  const toggleFunnelStage = (stage: string) => {
    setFunnelStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const getTemplateKey = (idx: number): string => {
    return editedKeys[idx] ?? templates[idx].template_key;
  };

  const handleKeyEdit = (idx: number, value: string) => {
    setEditedKeys(prev => ({ ...prev, [idx]: value }));
  };

  const handleImport = async () => {
    const selectedTemplates = templates
      .filter((_, i) => selected.has(i))
      .map((t, _originalIndex) => {
        // Find the original index in the full templates array
        const origIdx = templates.indexOf(t);
        return {
          ...t,
          template_key: getTemplateKey(origIdx),
        };
      });

    if (selectedTemplates.length === 0) {
      setError('Please select at least one template');
      return;
    }

    setImporting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/templates/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templates: selectedTemplates,
          category,
          tier,
          funnel_stages: funnelStages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to import templates');
        return;
      }

      setCreatedCount(data.created);
      setStep('success');
    } catch {
      setError('Failed to import templates');
    } finally {
      setImporting(false);
    }
  };

  const handleDone = () => {
    onSaved();
    onClose();
  };

  const selectedCount = selected.size;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-cream-warm rounded-xl shadow-xl w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-semibold text-charcoal">
            {step === 'upload' && 'Bulk Import Templates'}
            {step === 'preview' && 'Review & Import'}
            {step === 'success' && 'Import Complete'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-warm">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-400 text-sm rounded-lg mb-4">{error}</div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-stone/30 rounded-xl p-8 text-center cursor-pointer hover:border-teal/50 transition-colors"
            >
              <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-stone/40 mb-3" />
              <p className="text-sm font-medium text-charcoal">
                {parsing ? 'Parsing templates...' : 'Drop .md file here or click to browse'}
              </p>
              <p className="text-xs text-stone/60 mt-1">
                Separate templates with # H1 headings. Max 5MB.
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

          {/* Step 2: Preview + Configure */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-2 text-sm font-medium text-teal">
                <DocumentTextIcon className="w-4 h-4" />
                {templates.length} template{templates.length !== 1 ? 's' : ''} found in {file?.name}
              </div>

              {/* Config row */}
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

              {/* Funnel stages */}
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
                          : 'bg-cream-warm text-stone border-stone/20 hover:border-stone/40'
                      }`}
                    >
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select all toggle */}
              <div className="flex items-center justify-between border-b border-stone/10 pb-2">
                <button
                  onClick={toggleAll}
                  className="text-xs font-medium text-teal hover:underline"
                >
                  {selected.size === templates.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-xs text-stone/60">
                  {selectedCount} of {templates.length} selected
                </span>
              </div>

              {/* Template list */}
              <div className="max-h-[40vh] overflow-y-auto space-y-1.5 pr-1">
                {templates.map((t, idx) => {
                  const isExpanded = expandedIdx === idx;
                  const isSelected = selected.has(idx);

                  return (
                    <div
                      key={idx}
                      className={`border rounded-lg transition-colors ${
                        isSelected ? 'border-teal/30 bg-teal/5' : 'border-stone/15 bg-cream-warm opacity-60'
                      }`}
                    >
                      {/* Row */}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(idx)}
                          className="w-4 h-4 rounded border-stone/30 text-teal focus:ring-teal/30"
                        />

                        <button
                          onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                          className="p-0.5 rounded hover:bg-stone/10"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="w-3.5 h-3.5 text-stone/40" />
                          ) : (
                            <ChevronRightIcon className="w-3.5 h-3.5 text-stone/40" />
                          )}
                        </button>

                        <span className="text-sm font-medium text-charcoal flex-1 truncate">
                          {t.name}
                        </span>

                        <input
                          type="text"
                          value={getTemplateKey(idx)}
                          onChange={(e) => handleKeyEdit(idx, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-mono text-stone/60 bg-stone/5 border border-stone/15 rounded px-2 py-1 w-48"
                        />
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-stone/10 px-4 py-3 space-y-2 text-xs">
                          {t.structure && (
                            <div>
                              <span className="font-semibold text-stone/60">Structure: </span>
                              <span className="text-charcoal">{t.structure}</span>
                            </div>
                          )}
                          {t.psychology && (
                            <div>
                              <span className="font-semibold text-stone/60">Psychology: </span>
                              <span className="text-charcoal">{t.psychology}</span>
                            </div>
                          )}
                          {t.when_to_use.length > 0 && (
                            <div>
                              <span className="font-semibold text-stone/60">When to Use: </span>
                              <span className="text-charcoal">{t.when_to_use.join(', ')}</span>
                            </div>
                          )}
                          {t.prompt_instructions && (
                            <div>
                              <span className="font-semibold text-stone/60">Prompt: </span>
                              <pre className="mt-1 font-mono bg-stone/5 rounded p-2 max-h-24 overflow-auto whitespace-pre-wrap text-charcoal">
                                {t.prompt_instructions}
                              </pre>
                            </div>
                          )}
                          {!t.prompt_instructions && (
                            <div className="text-amber-600 italic">
                              No prompt instructions found — will use fallback
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-lg font-semibold text-charcoal">
                {createdCount} template{createdCount !== 1 ? 's' : ''} imported successfully
              </p>
              <p className="text-sm text-stone/60 mt-1">
                They are now active and ready for use.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone/10">
          {step === 'upload' && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep('upload');
                  setTemplates([]);
                  setFile(null);
                  setError('');
                }}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
              >
                {importing
                  ? 'Importing...'
                  : `Import ${selectedCount} Template${selectedCount !== 1 ? 's' : ''}`
                }
              </Button>
            </>
          )}

          {step === 'success' && (
            <Button size="sm" onClick={handleDone}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
