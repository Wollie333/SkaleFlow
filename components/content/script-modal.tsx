'use client';

import { useState, useCallback } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { type FormatCategory } from '@/config/script-frameworks';
import { CLIENT_MODEL_CATALOG } from '@/lib/ai/client-models';
import { ModelSelector } from '@/components/ai/model-selector';
import { useBrandVariables } from '@/hooks/useBrandVariables';
import { VariableTextarea } from '@/components/content/variable-field';

export interface ScriptData {
  hook: string | null;
  script_body: string | null;
  cta: string | null;
  filming_notes: string | null;
  context_section: string | null;
  teaching_points: string | null;
  reframe: string | null;
  problem_expansion: string | null;
  framework_teaching: string | null;
  case_study: string | null;
}

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptData: ScriptData;
  onSave: (data: ScriptData) => void;
  formatCategory: FormatCategory;
  organizationId: string;
  caption?: string | null;
  hashtags?: string[] | null;
  funnelStage?: string;
  storybrandStage?: string;
  format?: string;
}

const SCRIPT_FIELDS_SHORT: Array<{ key: keyof ScriptData; label: string; rows: number }> = [
  { key: 'hook', label: 'Hook', rows: 3 },
  { key: 'script_body', label: 'Script Body', rows: 8 },
  { key: 'cta', label: 'Call to Action', rows: 2 },
  { key: 'filming_notes', label: 'Filming Notes', rows: 3 },
];

const SCRIPT_FIELDS_MEDIUM: Array<{ key: keyof ScriptData; label: string; rows: number }> = [
  { key: 'hook', label: 'Hook', rows: 3 },
  { key: 'context_section', label: 'Context Section', rows: 4 },
  { key: 'teaching_points', label: 'Teaching Points', rows: 5 },
  { key: 'reframe', label: 'Reframe', rows: 4 },
  { key: 'script_body', label: 'Script Body', rows: 8 },
  { key: 'cta', label: 'Call to Action', rows: 2 },
  { key: 'filming_notes', label: 'Filming Notes', rows: 3 },
];

const SCRIPT_FIELDS_LONG: Array<{ key: keyof ScriptData; label: string; rows: number }> = [
  { key: 'hook', label: 'Hook', rows: 3 },
  { key: 'context_section', label: 'Context Section', rows: 4 },
  { key: 'problem_expansion', label: 'Problem Expansion', rows: 4 },
  { key: 'framework_teaching', label: 'Framework Teaching', rows: 5 },
  { key: 'teaching_points', label: 'Teaching Points', rows: 5 },
  { key: 'case_study', label: 'Case Study', rows: 4 },
  { key: 'reframe', label: 'Reframe', rows: 4 },
  { key: 'script_body', label: 'Script Body', rows: 8 },
  { key: 'cta', label: 'Call to Action', rows: 2 },
  { key: 'filming_notes', label: 'Filming Notes', rows: 3 },
];

function getFieldsForCategory(category: FormatCategory) {
  if (category === 'long') return SCRIPT_FIELDS_LONG;
  if (category === 'medium') return SCRIPT_FIELDS_MEDIUM;
  return SCRIPT_FIELDS_SHORT;
}

export default function ScriptModal({
  isOpen,
  onClose,
  scriptData,
  onSave,
  formatCategory,
  organizationId,
  caption,
  hashtags,
  funnelStage,
  storybrandStage,
  format,
}: ScriptModalProps) {
  const [localData, setLocalData] = useState<ScriptData>({ ...scriptData });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const { categories: brandCategories, flatVariables: brandFlatVariables } = useBrandVariables(organizationId || null);
  const fields = getFieldsForCategory(formatCategory);

  const handleFieldChange = useCallback((key: keyof ScriptData, value: string) => {
    setLocalData(prev => ({ ...prev, [key]: value || null }));
  }, []);

  const handleGenerateScript = useCallback(async () => {
    if (!caption) {
      setGenerateError('Write a caption first, then generate the script from it.');
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/content/ai-assist/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          caption,
          hashtags: hashtags || [],
          format: format || 'short_video_30_60',
          funnelStage: funnelStage || 'awareness',
          storybrandStage: storybrandStage || 'character',
          modelOverride: selectedModelId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(err.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      setLocalData(prev => ({
        ...prev,
        hook: data.hook || prev.hook,
        script_body: data.script_body || prev.script_body,
        cta: data.cta || prev.cta,
        filming_notes: data.filming_notes || prev.filming_notes,
        context_section: data.context_section || prev.context_section,
        teaching_points: data.teaching_points || prev.teaching_points,
        reframe: data.reframe || prev.reframe,
        problem_expansion: data.problem_expansion || prev.problem_expansion,
        framework_teaching: data.framework_teaching || prev.framework_teaching,
        case_study: data.case_study || prev.case_study,
      }));
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [organizationId, caption, hashtags, format, funnelStage, storybrandStage, selectedModelId]);

  const handleSave = useCallback(() => {
    onSave(localData);
    onClose();
  }, [localData, onSave, onClose]);

  if (!isOpen) return null;

  const hasScript = localData.hook || localData.script_body || localData.cta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-cream-warm rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div>
            <h2 className="text-lg font-semibold text-charcoal-900">Script</h2>
            <p className="text-xs text-stone">
              {formatCategory === 'short' ? 'Short-form' : formatCategory === 'medium' ? 'Medium-form' : formatCategory === 'long' ? 'Long-form' : formatCategory} script fields
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-cream transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* AI Generate bar */}
          <div className="flex items-center gap-3 p-3 bg-cream rounded-lg border border-stone/10">
            <div className="flex-1">
              <ModelSelector
                models={CLIENT_MODEL_CATALOG}
                selectedModelId={selectedModelId}
                onSelect={setSelectedModelId}
                compact
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateScript}
              disabled={isGenerating || !caption}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate Script from Post'}
            </button>
          </div>

          {generateError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{generateError}</p>
          )}

          {/* Script fields */}
          {fields.map(({ key, label, rows }) => (
            <VariableTextarea
              key={key}
              label={label}
              value={localData[key] || ''}
              onValueChange={(v) => handleFieldChange(key, v)}
              rows={rows}
              placeholder={`Enter ${label.toLowerCase()}... (~ for brand variables)`}
              className="text-sm border-stone/10 rounded-lg"
              brandFlatVariables={brandFlatVariables}
              brandCategories={brandCategories}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone/10">
          <span className="text-xs text-stone-400">
            {hasScript ? 'Script content added' : 'No script content yet'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone border border-stone/10 rounded-lg hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Save Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
