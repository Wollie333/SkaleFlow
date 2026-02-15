'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CompanyPicker } from '@/components/crm/company-picker';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  lifecycle_stage: string;
  source: string;
  company_id?: string;
  assigned_to?: string;
}

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  contact?: Contact;
  onSaved: () => void;
}

export function ContactFormModal({
  isOpen,
  onClose,
  organizationId,
  contact,
  onSaved,
}: ContactFormModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    lifecycleStage: 'lead',
    source: 'manual',
    companyId: '',
    assignedTo: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.first_name || '',
        lastName: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        jobTitle: contact.job_title || '',
        lifecycleStage: contact.lifecycle_stage || 'lead',
        source: contact.source || 'manual',
        companyId: contact.company_id || '',
        assignedTo: contact.assigned_to || '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        lifecycleStage: 'lead',
        source: 'manual',
        companyId: '',
        assignedTo: '',
      });
    }
    setError('');
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        organizationId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        jobTitle: formData.jobTitle || null,
        lifecycleStage: formData.lifecycleStage,
        source: formData.source,
        companyId: formData.companyId || null,
        assignedTo: formData.assignedTo || null,
      };

      const url = contact
        ? `/api/crm/contacts/${contact.id}`
        : '/api/crm/contacts';
      const method = contact ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save contact');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone">
          <h2 className="text-xl font-bold text-dark">
            {contact ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button
            onClick={onClose}
            className="text-charcoal hover:text-dark transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) =>
                setFormData({ ...formData, jobTitle: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Company
            </label>
            <CompanyPicker
              organizationId={organizationId}
              value={formData.companyId || null}
              onChange={(companyId) =>
                setFormData({ ...formData, companyId: companyId || '' })
              }
            />
          </div>

          {/* Lifecycle Stage & Source Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Lifecycle Stage
              </label>
              <select
                value={formData.lifecycleStage}
                onChange={(e) =>
                  setFormData({ ...formData, lifecycleStage: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="opportunity">Opportunity</option>
                <option value="customer">Customer</option>
                <option value="churned">Churned</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
              >
                <option value="manual">Manual</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="pipeline">Pipeline</option>
                <option value="import">Import</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Assigned To
            </label>
            <input
              type="text"
              placeholder="User ID or email"
              value={formData.assignedTo}
              onChange={(e) =>
                setFormData({ ...formData, assignedTo: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-stone rounded-lg text-charcoal hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'flex-1 px-4 py-2 bg-teal text-white rounded-lg transition-colors',
                saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal/90'
              )}
            >
              {saving ? 'Saving...' : contact ? 'Save Changes' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
