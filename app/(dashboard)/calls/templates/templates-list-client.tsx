'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
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

interface Props {
  templates: Template[];
  isAdmin: boolean;
  isSuperAdmin?: boolean;
}

export function TemplatesListClient({ templates, isAdmin, isSuperAdmin = false }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const canManage = isAdmin || isSuperAdmin;

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
          // Super admin uploads as system template
          ...(isSuperAdmin ? { isSystem: true } : {}),
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

  const handleDelete = async (template: Template) => {
    if (confirmDelete !== template.id) {
      setConfirmDelete(template.id);
      return;
    }

    setDeleting(template.id);
    try {
      const res = await fetch(`/api/calls/templates/${template.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete template');
      }
    } catch {
      alert('Network error');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const canDelete = (template: Template) => {
    if (isSuperAdmin) return true;
    if (isAdmin && !template.is_system) return true;
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Call Templates</h1>
          <p className="text-sm text-stone mt-1">Framework templates to guide your conversations</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={handleDownloadBlank}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal bg-cream-warm border border-stone/20 rounded-lg hover:bg-cream/50 transition-colors"
                title="Download a blank template file (.md) to fill in offline"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Blank .md</span>
              </button>
              <label
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal bg-cream-warm border border-stone/20 rounded-lg hover:bg-cream/50 transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                title={isSuperAdmin ? 'Upload .md file as system template' : 'Upload .md file as org template'}
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                {uploading ? 'Importing...' : (
                  <span className="hidden sm:inline">
                    Upload .md{isSuperAdmin ? ' (System)' : ''}
                  </span>
                )}
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

      {/* Super admin controls */}
      {isSuperAdmin && (
        <div className="mb-6 px-4 py-3 bg-teal/5 border border-teal/15 rounded-xl text-xs text-charcoal space-y-2">
          <p className="font-semibold text-teal text-sm">System Template Management</p>
          <p>Download the blank .md file for the standardised format. Upload back to create a system template.</p>
          <p className="text-stone">Valid call types: discovery, sales, onboarding, meeting, follow_up, custom</p>
          <div className="flex items-center gap-2 pt-1">
            {confirmPurge ? (
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-medium">Delete all system templates from DB and re-seed?</span>
                <button
                  onClick={async () => {
                    setPurging(true);
                    try {
                      const res = await fetch('/api/calls/templates/seed', { method: 'DELETE' });
                      const data = await res.json();
                      if (res.ok) {
                        alert(`Purged ${data.purged} old templates, re-seeded ${data.seeded} fresh.`);
                        router.refresh();
                      } else {
                        alert(data.error || 'Failed to purge');
                      }
                    } catch { alert('Network error'); }
                    setPurging(false);
                    setConfirmPurge(false);
                  }}
                  disabled={purging}
                  className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {purging ? 'Purging...' : 'Yes, Purge & Re-seed'}
                </button>
                <button
                  onClick={() => setConfirmPurge(false)}
                  className="px-3 py-1 text-xs font-medium text-charcoal bg-cream border border-stone/20 rounded-lg hover:bg-stone/10"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPurge(true)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Purge & Re-seed System Templates
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map((template) => {
          const phaseCount = Array.isArray(template.phases) ? template.phases.length : 0;
          const isConfirming = confirmDelete === template.id;
          const isDeleting = deleting === template.id;

          return (
            <div
              key={template.id}
              className="bg-cream-warm rounded-xl border border-stone/10 p-5 hover:border-teal/20 transition-colors"
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
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  {canManage && (
                    <button
                      onClick={(e) => { e.preventDefault(); handleDownloadTemplate(template); }}
                      className="p-1.5 text-stone hover:text-teal rounded transition-colors"
                      title="Download as .md file"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                  )}
                  {canManage && (
                    <Link
                      href={`/calls/templates/${template.id}`}
                      className="p-1.5 text-stone hover:text-teal rounded transition-colors"
                      title="Edit template"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </Link>
                  )}
                  {canDelete(template) && (
                    isConfirming ? (
                      <div className="flex items-center gap-1 ml-1">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          onClick={() => handleDelete(template)}
                          disabled={isDeleting}
                          className="px-2 py-0.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? '...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-0.5 text-xs font-medium text-charcoal bg-cream border border-stone/20 rounded hover:bg-stone/10"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(template)}
                        className="p-1.5 text-stone hover:text-red-600 rounded transition-colors"
                        title="Delete template"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="text-center py-12 bg-cream-warm rounded-xl border border-stone/10">
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
