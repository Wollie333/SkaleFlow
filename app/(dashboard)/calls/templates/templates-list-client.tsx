'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { templateToMarkdown, markdownToTemplate } from '@/lib/calls/templates/markdown';

interface Template {
  id: string;
  name: string;
  description: string | null;
  call_type: string;
  is_system: boolean;
  phases: unknown[];
  opening_script: string | null;
  closing_script: string | null;
  objection_bank: unknown[];
}

const callTypeLabels: Record<string, string> = {
  discovery: 'Discovery', sales: 'Sales', onboarding: 'Onboarding',
  meeting: 'Meeting', follow_up: 'Follow-up', custom: 'Custom',
};

export function TemplatesListClient({ templates, isAdmin }: { templates: Template[]; isAdmin: boolean }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleDownloadBlank = () => {
    const md = templateToMarkdown();
    downloadFile(md, 'call-template-blank.md');
  };

  const handleDownloadTemplate = (template: Template) => {
    const md = templateToMarkdown({
      name: template.name,
      description: template.description || '',
      call_type: template.call_type,
      opening_script: template.opening_script || '',
      closing_script: template.closing_script || '',
      phases: template.phases as any[],
      objection_bank: template.objection_bank as any[],
    });
    const filename = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    downloadFile(md, filename);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const parsed = markdownToTemplate(text);

      const res = await fetch('/api/calls/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.name,
          description: parsed.description || null,
          callType: parsed.call_type,
          phases: parsed.phases,
          openingScript: parsed.opening_script || null,
          closingScript: parsed.closing_script || null,
          objectionBank: parsed.objection_bank,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/calls/templates/${created.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create template from file');
      }
    } catch {
      alert('Failed to read the file. Make sure it\'s a valid .md file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Call Templates</h1>
          <p className="text-sm text-stone mt-1">Framework templates to guide your conversations</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleDownloadBlank}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal bg-white border border-stone/20 rounded-lg hover:bg-cream/50 transition-colors"
                title="Download a blank template file (.md) to fill in offline"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download Template
              </button>
              <label
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal bg-white border border-stone/20 rounded-lg hover:bg-cream/50 transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                title="Upload a filled .md template file to create a new template"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                {uploading ? 'Importing...' : 'Upload Template'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </>
          )}
          <Link
            href="/calls/templates/new"
            className="px-4 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90 transition-colors"
          >
            New Template
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {templates.map((template) => {
          const phaseCount = Array.isArray(template.phases) ? template.phases.length : 0;
          return (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-stone/10 p-5 hover:border-teal/20 transition-colors"
            >
              <div className="flex items-start justify-between">
                <Link href={`/calls/templates/${template.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-charcoal">{template.name}</h3>
                    {template.is_system && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-teal/10 text-teal rounded-full">System</span>
                    )}
                  </div>
                  <p className="text-sm text-stone mt-1">{template.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-stone">
                    <span className="px-2 py-0.5 bg-cream rounded">{callTypeLabels[template.call_type] || template.call_type}</span>
                    <span>{phaseCount} phases</span>
                  </div>
                </Link>
                {isAdmin && (
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    <button
                      onClick={(e) => { e.preventDefault(); handleDownloadTemplate(template); }}
                      className="p-1.5 text-stone hover:text-teal rounded transition-colors"
                      title="Download as .md file"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone/10">
            <p className="text-stone text-sm mb-2">No templates yet</p>
            <p className="text-xs text-stone">Ask your admin to seed system templates or create your own.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
