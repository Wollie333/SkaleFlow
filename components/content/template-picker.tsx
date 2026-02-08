'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  format: string;
  template_fields: Record<string, string>;
  created_at: string;
}

interface TemplatePickerProps {
  organizationId: string;
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function TemplatePicker({ organizationId, onSelect, onClose }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [organizationId]);

  const loadTemplates = async () => {
    try {
      const res = await fetch(`/api/content/templates?organizationId=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      // silently fail
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-heading-md text-charcoal">Content Templates</h2>
          <button onClick={onClose} className="p-2 hover:bg-cream-warm rounded-lg">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <DocumentDuplicateIcon className="w-12 h-12 mx-auto text-stone/30 mb-2" />
              <p className="text-sm text-stone">No templates saved yet.</p>
              <p className="text-xs text-stone/60 mt-1">Use "Save as Template" in the editor to create one.</p>
            </div>
          ) : (
            templates.map(template => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="w-full text-left p-4 rounded-xl border border-stone/10 hover:border-teal/50 hover:bg-teal/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-charcoal">{template.name}</h3>
                  <span className="text-xs text-stone bg-cream-warm px-2 py-0.5 rounded-full">
                    {template.format.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-stone line-clamp-2">
                  {template.template_fields.topic || template.template_fields.hook || 'No preview'}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-stone/10 px-6 py-4">
          <Button onClick={onClose} variant="ghost" className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}
