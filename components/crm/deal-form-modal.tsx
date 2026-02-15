'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactPicker } from '@/components/crm/contact-picker';
import { CompanyPicker } from '@/components/crm/company-picker';

interface Deal {
  id: string;
  title: string;
  value_cents: number;
  probability: number;
  expected_close_date: string | null;
  status: 'open' | 'won' | 'lost';
  lost_reason: string | null;
  contact_id: string | null;
  company_id: string | null;
}

interface DealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  deal?: Deal;
  onSaved: () => void;
  initialContactId?: string;
  initialCompanyId?: string;
}

export default function DealFormModal({
  isOpen,
  onClose,
  organizationId,
  deal,
  onSaved,
  initialContactId,
  initialCompanyId,
}: DealFormModalProps) {
  const [title, setTitle] = useState('');
  const [valueRands, setValueRands] = useState('');
  const [probability, setProbability] = useState(50);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [status, setStatus] = useState<'open' | 'won' | 'lost'>('open');
  const [lostReason, setLostReason] = useState('');
  const [contactId, setContactId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!deal;

  useEffect(() => {
    if (isOpen) {
      if (deal) {
        // Edit mode
        setTitle(deal.title);
        setValueRands((deal.value_cents / 100).toFixed(2));
        setProbability(deal.probability);
        setExpectedCloseDate(
          deal.expected_close_date ? deal.expected_close_date.split('T')[0] : ''
        );
        setStatus(deal.status);
        setLostReason(deal.lost_reason || '');
        setContactId(deal.contact_id);
        setCompanyId(deal.company_id);
      } else {
        // Create mode
        resetForm();
        if (initialContactId) setContactId(initialContactId);
        if (initialCompanyId) setCompanyId(initialCompanyId);
      }
      setError('');
    }
  }, [isOpen, deal, initialContactId, initialCompanyId]);

  function resetForm() {
    setTitle('');
    setValueRands('');
    setProbability(50);
    setExpectedCloseDate('');
    setStatus('open');
    setLostReason('');
    setContactId(null);
    setCompanyId(null);
    setSaving(false);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!valueRands || isNaN(parseFloat(valueRands))) {
      setError('Valid deal value is required');
      return;
    }

    setSaving(true);

    try {
      const valueCents = Math.round(parseFloat(valueRands) * 100);

      const payload = {
        organization_id: organizationId,
        title: title.trim(),
        value_cents: valueCents,
        probability,
        expected_close_date: expectedCloseDate || null,
        status,
        lost_reason: status === 'lost' ? lostReason.trim() || null : null,
        contact_id: contactId,
        company_id: companyId,
      };

      let res;
      if (isEdit) {
        res = await fetch(`/api/crm/deals/${deal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/crm/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save deal');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving deal:', err);
      setError(err.message || 'Failed to save deal');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-2xl font-bold text-dark">
            {isEdit ? 'Edit Deal' : 'Create Deal'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-dark mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter deal title"
              required
              className="w-full"
            />
          </div>

          {/* Contact Picker */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Contact</label>
            <ContactPicker
              organizationId={organizationId}
              value={contactId}
              onChange={(id) => setContactId(id)}
              label=""
            />
          </div>

          {/* Company Picker */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Company</label>
            <CompanyPicker
              organizationId={organizationId}
              value={companyId}
              onChange={(id) => setCompanyId(id)}
              label=""
            />
          </div>

          {/* Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-dark mb-2">
              Deal Value (R) <span className="text-red-500">*</span>
            </label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={valueRands}
              onChange={(e) => setValueRands(e.target.value)}
              placeholder="0.00"
              required
              className="w-full"
            />
          </div>

          {/* Probability */}
          <div>
            <label htmlFor="probability" className="block text-sm font-medium text-dark mb-2">
              Probability ({probability}%)
            </label>
            <input
              id="probability"
              type="range"
              min="0"
              max="100"
              step="5"
              value={probability}
              onChange={(e) => setProbability(parseInt(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal"
            />
            <div className="flex justify-between text-xs text-stone-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Expected Close Date */}
          <div>
            <label
              htmlFor="expectedCloseDate"
              className="block text-sm font-medium text-dark mb-2"
            >
              Expected Close Date
            </label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Status (only show for edit) */}
          {isEdit && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-dark mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'open' | 'won' | 'lost')}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              >
                <option value="open">Open</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          )}

          {/* Lost Reason (only show when status is lost) */}
          {status === 'lost' && (
            <div>
              <label htmlFor="lostReason" className="block text-sm font-medium text-dark mb-2">
                Lost Reason
              </label>
              <textarea
                id="lostReason"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Why was this deal lost?"
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={saving}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="px-6 bg-teal text-white hover:bg-teal/90"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Deal' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
