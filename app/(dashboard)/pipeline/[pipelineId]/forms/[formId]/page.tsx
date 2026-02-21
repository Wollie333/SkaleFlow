'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LinkIcon,
  CodeBracketIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface Stage {
  id: string;
  name: string;
  sort_order: number;
}

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder: string | null;
  is_required: boolean;
  options: string[] | null;
  mapping: string;
  sort_order: number;
}

interface FormData {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  stage_id: string;
  submit_button_text: string;
  success_message: string;
  pipeline_form_fields: FormField[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select / Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

const MAPPING_OPTIONS = [
  { value: 'full_name', label: 'Full Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
];

function inferMapping(fieldType: string): string {
  switch (fieldType) {
    case 'email': return 'email';
    case 'phone': return 'phone';
    default: return 'full_name';
  }
}

function newField(sortOrder: number, fieldType = 'text'): FormField {
  return {
    id: crypto.randomUUID(),
    label: '',
    field_type: fieldType,
    placeholder: null,
    is_required: false,
    options: null,
    mapping: inferMapping(fieldType),
    sort_order: sortOrder,
  };
}

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.pipelineId as string;
  const formId = params.formId as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form settings
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitText, setSubmitText] = useState('Submit');
  const [successMessage, setSuccessMessage] = useState('');
  const [stageId, setStageId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [customMappingField, setCustomMappingField] = useState('');

  const loadForm = useCallback(async () => {
    const res = await fetch(`/api/pipeline/${pipelineId}/forms/${formId}`);
    if (res.ok) {
      const data: FormData = await res.json();
      setForm(data);
      setName(data.name);
      setDescription(data.description || '');
      setSubmitText(data.submit_button_text);
      setSuccessMessage(data.success_message);
      setStageId(data.stage_id);
      setIsPublished(data.is_published);

      const sortedFields = [...(data.pipeline_form_fields || [])].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      setFields(sortedFields.length > 0 ? sortedFields : [newField(0)]);
    }
    setLoading(false);
  }, [pipelineId, formId]);

  const loadStages = useCallback(async () => {
    const res = await fetch(`/api/pipeline/${pipelineId}`);
    if (res.ok) {
      const data = await res.json();
      const sorted = [...(data.pipeline_stages || [])].sort(
        (a: Stage, b: Stage) => a.sort_order - b.sort_order
      );
      setStages(sorted);
    }
  }, [pipelineId]);

  useEffect(() => {
    loadForm();
    loadStages();
  }, [loadForm, loadStages]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    // Save form settings
    await fetch(`/api/pipeline/${pipelineId}/forms/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description || null,
        submit_button_text: submitText,
        success_message: successMessage,
        stage_id: stageId,
        is_published: isPublished,
      }),
    });

    // Save fields
    const validFields = fields.filter((f) => f.label.trim() !== '');
    await fetch(`/api/pipeline/${pipelineId}/forms/${formId}/fields`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: validFields.map((f, i) => ({
          label: f.label,
          field_type: f.field_type,
          placeholder: f.placeholder,
          is_required: f.is_required,
          options: f.options,
          mapping: f.mapping,
          sort_order: i,
        })),
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addField = () => {
    setFields((prev) => [...prev, newField(prev.length)]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFields(updated);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const addCustomMapping = (index: number) => {
    if (!customMappingField.trim()) return;
    updateField(index, { mapping: `custom:${customMappingField.trim()}` });
    setCustomMappingField('');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied!`);
    } catch {
      prompt(`Copy this ${label}:`, text);
    }
  };

  const getFormUrl = () => {
    if (!form) return '';
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/f/${form.slug}`;
  };

  const getEmbedCode = () => {
    const url = getFormUrl();
    return `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-16">
        <p className="text-stone">Form not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/pipeline/${pipelineId}/forms`)}
            className="p-2 text-stone hover:text-charcoal rounded-lg hover:bg-cream-warm transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-charcoal">{name || 'Form Builder'}</h1>
            <p className="text-sm text-stone">Configure your form fields and settings</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-stone/30 text-teal focus:ring-teal"
            />
            <span className={isPublished ? 'text-teal font-medium' : 'text-stone'}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal/90 disabled:opacity-50 transition-colors"
          >
            {saved ? (
              <>
                <CheckIcon className="w-4 h-4" />
                Saved
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>

      {/* Main layout: config left, preview right */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
        {/* Left: Config */}
        <div className="space-y-6">
          {/* Form Settings */}
          <div className="bg-white rounded-xl border border-stone/10 p-6">
            <h2 className="text-sm font-semibold text-charcoal mb-4 uppercase tracking-wide">Form Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Form Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  placeholder="e.g. Contact Us"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  rows={2}
                  placeholder="Shown above the form fields"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Submit Button Text</label>
                  <input
                    type="text"
                    value={submitText}
                    onChange={(e) => setSubmitText(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Entry Stage</label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Success Message</label>
                <textarea
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  rows={2}
                  placeholder="Shown after successful submission"
                />
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-xl border border-stone/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wide">Form Fields</h2>
              <button
                onClick={addField}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal bg-teal/10 rounded-md hover:bg-teal/20 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Field
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-stone/10 rounded-lg p-4 bg-cream/30"
                >
                  <div className="flex items-start gap-3">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5 pt-1">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-stone hover:text-charcoal disabled:opacity-30 transition-colors"
                      >
                        <ArrowUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === fields.length - 1}
                        className="p-1 text-stone hover:text-charcoal disabled:opacity-30 transition-colors"
                      >
                        <ArrowDownIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Field config */}
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-stone mb-1">Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm border border-stone/10 rounded-md focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                            placeholder="Field label"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone mb-1">Type</label>
                          <select
                            value={field.field_type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              updateField(index, { field_type: newType, mapping: inferMapping(newType) });
                            }}
                            className="w-full px-2.5 py-1.5 text-sm border border-stone/10 rounded-md focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-stone mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(index, { placeholder: e.target.value || null })}
                            className="w-full px-2.5 py-1.5 text-sm border border-stone/10 rounded-md focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                            placeholder="Optional placeholder"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone mb-1">Maps To</label>
                          <select
                            value={field.mapping.startsWith('custom:') ? '__custom__' : field.mapping}
                            onChange={(e) => {
                              if (e.target.value === '__custom__') {
                                updateField(index, { mapping: 'custom:' });
                              } else {
                                updateField(index, { mapping: e.target.value });
                              }
                            }}
                            className="w-full px-2.5 py-1.5 text-sm border border-stone/10 rounded-md focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
                          >
                            {MAPPING_OPTIONS.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                            <option value="__custom__">Custom Field</option>
                          </select>
                        </div>
                      </div>

                      {/* Custom mapping key input */}
                      {field.mapping.startsWith('custom:') && (
                        <div>
                          <label className="block text-xs font-medium text-stone mb-1">Custom Field Key</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={field.mapping === 'custom:' ? customMappingField : field.mapping.slice(7)}
                              onChange={(e) => {
                                if (field.mapping === 'custom:') {
                                  setCustomMappingField(e.target.value);
                                } else {
                                  updateField(index, { mapping: `custom:${e.target.value}` });
                                }
                              }}
                              onBlur={() => {
                                if (field.mapping === 'custom:' && customMappingField.trim()) {
                                  addCustomMapping(index);
                                }
                              }}
                              className="flex-1 px-2.5 py-1.5 text-sm border border-stone/10 rounded-md focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                              placeholder="e.g. budget, industry"
                            />
                          </div>
                        </div>
                      )}

                      {/* Select options */}
                      {field.field_type === 'select' && (
                        <div>
                          <label className="block text-xs font-medium text-stone mb-1">Options (one per line)</label>
                          <textarea
                            value={(field.options || []).join('\n')}
                            onChange={(e) =>
                              updateField(index, {
                                options: e.target.value.split('\n').filter((o) => o.trim()),
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-sm border border-stone/10 rounded-md focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                            rows={3}
                            placeholder="Option A&#10;Option B&#10;Option C"
                          />
                        </div>
                      )}

                      <label className="flex items-center gap-2 text-xs text-stone">
                        <input
                          type="checkbox"
                          checked={field.is_required}
                          onChange={(e) => updateField(index, { is_required: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-stone/30 text-teal focus:ring-teal"
                        />
                        Required
                      </label>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeField(index)}
                      disabled={fields.length <= 1}
                      className="p-1.5 text-stone hover:text-red-600 disabled:opacity-30 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share section */}
          {isPublished && (
            <div className="bg-white rounded-xl border border-stone/10 p-6">
              <h2 className="text-sm font-semibold text-charcoal mb-4 uppercase tracking-wide">Share</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone mb-1">Direct Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getFormUrl()}
                      className="flex-1 px-3 py-2 text-sm bg-cream/50 border border-stone/10 rounded-lg text-stone"
                    />
                    <button
                      onClick={() => copyToClipboard(getFormUrl(), 'Link')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone mb-1">Embed Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getEmbedCode()}
                      className="flex-1 px-3 py-2 text-sm bg-cream/50 border border-stone/10 rounded-lg text-stone font-mono text-xs"
                    />
                    <button
                      onClick={() => copyToClipboard(getEmbedCode(), 'Embed code')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
                    >
                      <CodeBracketIcon className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white rounded-xl border border-stone/10 overflow-hidden">
            <div className="bg-cream-warm/50 px-4 py-2 text-xs font-medium text-stone uppercase tracking-wide">
              Live Preview
            </div>
            <div className="p-6">
              <FormPreview
                name={name}
                description={description}
                fields={fields}
                submitText={submitText}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Live preview component
function FormPreview({
  name,
  description,
  fields,
  submitText,
}: {
  name: string;
  description: string;
  fields: FormField[];
  submitText: string;
}) {
  return (
    <div className="space-y-4">
      {name && <h2 className="text-lg font-bold text-charcoal">{name}</h2>}
      {description && <p className="text-sm text-stone">{description}</p>}

      {fields
        .filter((f) => f.label.trim())
        .map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-charcoal mb-1">
              {field.label}
              {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {field.field_type === 'textarea' ? (
              <textarea
                placeholder={field.placeholder || ''}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg bg-cream/30"
                rows={3}
                disabled
              />
            ) : field.field_type === 'select' ? (
              <select
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg bg-cream/30"
                disabled
              >
                <option>{field.placeholder || 'Select...'}</option>
                {(field.options || []).map((opt, i) => (
                  <option key={i}>{opt}</option>
                ))}
              </select>
            ) : field.field_type === 'checkbox' ? (
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <input type="checkbox" disabled className="w-4 h-4 rounded border-stone/30" />
                {field.placeholder || field.label}
              </label>
            ) : (
              <input
                type={field.field_type}
                placeholder={field.placeholder || ''}
                className="w-full px-3 py-2 text-sm border border-stone/10 rounded-lg bg-cream/30"
                disabled
              />
            )}
          </div>
        ))}

      <button
        disabled
        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-teal rounded-lg"
      >
        {submitText || 'Submit'}
      </button>
    </div>
  );
}
