'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';
import type { Database } from '@/types/database';

const AVAILABLE_MERGE_FIELDS = [
  '{{contact.full_name}}',
  '{{contact.email}}',
  '{{contact.phone}}',
  '{{contact.company}}',
  '{{pipeline.name}}',
  '{{stage.name}}',
  '{{org.name}}',
  '{{date.today}}',
];

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  merge_fields: string[];
  created_at: string;
}

export default function EmailTemplatesPage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contactId');
  const pipelineId = searchParams.get('pipelineId');

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; bodyHtml: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return;
    setOrganizationId(membership.organization_id);

    const response = await fetch(`/api/pipeline/email-templates?organizationId=${membership.organization_id}`);
    if (response.ok) {
      const data = await response.json();
      setTemplates(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!organizationId || !name.trim() || !subject.trim() || !bodyHtml.trim()) return;
    setSaving(true);

    try {
      if (editingTemplate) {
        const response = await fetch(`/api/pipeline/email-templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, subject, body_html: bodyHtml }),
        });
        if (response.ok) {
          await loadData();
          setShowEditor(false);
          setEditingTemplate(null);
        }
      } else {
        const response = await fetch('/api/pipeline/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId, name, subject, body_html: bodyHtml }),
        });
        if (response.ok) {
          await loadData();
          setShowEditor(false);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/pipeline/email-templates/${id}`, { method: 'DELETE' });
    await loadData();
  };

  const handlePreview = async (id: string) => {
    const response = await fetch(`/api/pipeline/email-templates/${id}/preview`, { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      setPreview(data);
    }
  };

  const handleSendToContact = async (templateId: string) => {
    if (!contactId || !pipelineId) return;
    setSending(true);
    try {
      const response = await fetch(`/api/pipeline/${pipelineId}/contacts/${contactId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId }),
      });
      if (response.ok) {
        alert('Email sent successfully!');
      } else {
        const data = await response.json();
        alert(`Failed: ${data.error}`);
      }
    } finally {
      setSending(false);
    }
  };

  const openEditor = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setSubject(template.subject);
      setBodyHtml(template.body_html);
    } else {
      setEditingTemplate(null);
      setName('');
      setSubject('');
      setBodyHtml('');
    }
    setShowEditor(true);
  };

  const insertMergeField = (field: string) => {
    setBodyHtml((prev) => prev + field);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Email Templates"
        icon={EnvelopeIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: 'Email Templates' },
        ]}
        subtitle="Create reusable email templates with merge fields"
        action={
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Template
          </button>
        }
        className="mb-6"
      />

      {contactId && (
        <div className="bg-teal/5 border border-teal/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-teal font-medium">Select a template to send to this contact</p>
        </div>
      )}

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-cream-warm rounded-xl border border-stone/10 p-5">
            <h3 className="font-semibold text-charcoal">{template.name}</h3>
            <p className="text-sm text-stone mt-1 truncate">{template.subject}</p>
            <div className="flex items-center gap-2 mt-4">
              <button onClick={() => openEditor(template)} className="text-xs text-teal hover:text-teal/80 flex items-center gap-1">
                <PencilIcon className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handlePreview(template.id)} className="text-xs text-stone hover:text-charcoal flex items-center gap-1">
                <EyeIcon className="w-3.5 h-3.5" /> Preview
              </button>
              <button onClick={() => handleDelete(template.id)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <TrashIcon className="w-3.5 h-3.5" /> Delete
              </button>
              {contactId && (
                <button
                  onClick={() => handleSendToContact(template.id)}
                  disabled={sending}
                  className="ml-auto text-xs font-medium text-white bg-teal hover:bg-teal/90 px-3 py-1 rounded-lg disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !showEditor && (
        <div className="text-center py-16">
          <p className="text-stone mb-4">No email templates yet</p>
          <button onClick={() => openEditor()} className="text-sm text-teal hover:text-teal/80">
            Create your first template
          </button>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-cream-warm rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-stone/10">
              <h2 className="text-lg font-semibold text-charcoal">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Template Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Welcome Email"
                  className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Welcome to {{org.name}}!"
                  className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-charcoal">Body (HTML)</label>
                  <div className="flex gap-1 flex-wrap">
                    {AVAILABLE_MERGE_FIELDS.map((field) => (
                      <button key={field} onClick={() => insertMergeField(field)}
                        className="text-[10px] px-1.5 py-0.5 bg-teal/10 text-teal rounded hover:bg-teal/20">{field}</button>
                    ))}
                  </div>
                </div>
                <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={10} placeholder="<h1>Hello {{contact.full_name}}</h1>..."
                  className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowEditor(false)} className="px-4 py-2 text-sm text-stone hover:text-charcoal">Cancel</button>
                <button onClick={handleSave} disabled={saving || !name.trim() || !subject.trim() || !bodyHtml.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-cream-warm rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-stone/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal">Preview</h2>
              <button onClick={() => setPreview(null)} className="text-stone hover:text-charcoal text-sm">Close</button>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-charcoal mb-1">Subject: {preview.subject}</p>
              <div className="mt-4 border border-stone/10 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: preview.bodyHtml }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
