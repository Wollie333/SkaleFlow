'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CONTACT_ROLES, WARMTH_CONFIG } from '@/lib/authority/constants';
import type { AuthorityContactWarmth } from '@/lib/authority/types';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<{ duplicates?: Array<{ id: string; full_name: string; email: string }> } | void>;
  editData?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    outlet: string | null;
    role: string | null;
    beat: string | null;
    location: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    warmth: AuthorityContactWarmth;
    notes: string | null;
  } | null;
}

export function CreateContactModal({ isOpen, onClose, onSubmit, editData }: CreateContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ id: string; full_name: string; email: string }> | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    outlet: '',
    role: '',
    beat: '',
    location: '',
    linkedin_url: '',
    twitter_url: '',
    warmth: 'cold' as AuthorityContactWarmth,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setDuplicates(null);
      if (editData) {
        setFormData({
          full_name: editData.full_name,
          email: editData.email || '',
          phone: editData.phone || '',
          outlet: editData.outlet || '',
          role: editData.role || '',
          beat: editData.beat || '',
          location: editData.location || '',
          linkedin_url: editData.linkedin_url || '',
          twitter_url: editData.twitter_url || '',
          warmth: editData.warmth,
          notes: editData.notes || '',
        });
      } else {
        setFormData({
          full_name: '', email: '', phone: '', outlet: '', role: '',
          beat: '', location: '', linkedin_url: '', twitter_url: '',
          warmth: 'cold', notes: '',
        });
      }
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    setLoading(true);
    setDuplicates(null);
    try {
      const result = await onSubmit({
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        outlet: formData.outlet || null,
        role: formData.role || null,
        beat: formData.beat || null,
        location: formData.location || null,
        linkedin_url: formData.linkedin_url || null,
        twitter_url: formData.twitter_url || null,
        notes: formData.notes || null,
        force,
      });

      if (result?.duplicates) {
        setDuplicates(result.duplicates);
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-serif font-semibold text-charcoal">
            {editData ? 'Edit Contact' : 'New Media Contact'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-cream-warm rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Duplicate Warning */}
        {duplicates && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Possible duplicate found</p>
                <ul className="mt-1 text-xs text-amber-700 space-y-0.5">
                  {duplicates.map((d) => (
                    <li key={d.id}>{d.full_name} ({d.email})</li>
                  ))}
                </ul>
                <button
                  onClick={(e) => handleSubmit(e, true)}
                  className="mt-2 text-xs font-medium text-amber-700 underline hover:text-amber-900"
                >
                  Create anyway
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              placeholder="Jane Smith"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                placeholder="jane@outlet.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </div>

          {/* Outlet + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Outlet / Publication</label>
              <input
                type="text"
                value={formData.outlet}
                onChange={(e) => setFormData({ ...formData, outlet: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                placeholder="Business Day"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="">Select role</option>
                {CONTACT_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Beat + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Beat / Topic</label>
              <input
                type="text"
                value={formData.beat}
                onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                placeholder="Tech, Business"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                placeholder="Johannesburg"
              />
            </div>
          </div>

          {/* Warmth */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Warmth</label>
            <select
              value={formData.warmth}
              onChange={(e) => setFormData({ ...formData, warmth: e.target.value as AuthorityContactWarmth })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {Object.entries(WARMTH_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Social URLs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Twitter / X URL</label>
              <input
                type="url"
                value={formData.twitter_url}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.full_name}
              className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editData ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
