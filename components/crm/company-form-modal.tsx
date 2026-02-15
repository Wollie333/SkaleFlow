'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  size: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  company?: Company;
  onSaved: () => void;
}

export default function CompanyFormModal({
  isOpen,
  onClose,
  organizationId,
  company,
  onSaved,
}: CompanyFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    size: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        website: company.website || '',
        size: company.size || '',
        phone: company.phone || '',
        email: company.email || '',
        notes: company.notes || '',
      });
    } else {
      setFormData({
        name: '',
        industry: '',
        website: '',
        size: '',
        phone: '',
        email: '',
        notes: '',
      });
    }
    setError('');
  }, [company, isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = company
        ? `/api/crm/companies/${company.id}`
        : '/api/crm/companies';
      const method = company ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save company');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone/20">
          <h2 className="text-2xl font-bold text-charcoal">
            {company ? 'Edit Company' : 'Add Company'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cream/30 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-charcoal" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="Acme Corp"
              required
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Industry
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="Technology"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="https://example.com"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Company Size
            </label>
            <select
              value={formData.size}
              onChange={(e) => handleChange('size', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="contact@example.com"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="Additional information..."
              rows={4}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone/30 rounded-lg hover:bg-cream/30 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : company ? 'Save Changes' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
