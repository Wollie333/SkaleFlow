'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface WebhookFormProps {
  isOpen: boolean;
  endpoint?: { id: string; name: string; url: string; method: string; headers: Record<string, string>; is_active: boolean } | null;
  onClose: () => void;
  onSave: (data: { name: string; url: string; method: string; headers: Record<string, string> }) => Promise<void>;
}

export function WebhookForm({ isOpen, endpoint, onClose, onSave }: WebhookFormProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('POST');
  const [headersStr, setHeadersStr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (endpoint) {
      setName(endpoint.name);
      setUrl(endpoint.url);
      setMethod(endpoint.method);
      setHeadersStr(JSON.stringify(endpoint.headers || {}, null, 2));
    } else {
      setName('');
      setUrl('');
      setMethod('POST');
      setHeadersStr('{}');
    }
  }, [endpoint]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let headers: Record<string, string> = {};
      try { headers = JSON.parse(headersStr); } catch {}
      await onSave({ name, url, method, headers });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-semibold text-charcoal">{endpoint ? 'Edit' : 'New'} Webhook Endpoint</h2>
          <button onClick={onClose} className="text-stone hover:text-charcoal"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">URL</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://..."
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm">
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Headers (JSON)</label>
            <textarea value={headersStr} onChange={(e) => setHeadersStr(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-stone hover:text-charcoal">Cancel</button>
            <button type="submit" disabled={saving || !name || !url}
              className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal/90 rounded-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
