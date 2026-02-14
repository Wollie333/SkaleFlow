'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, CONTACT_ROLES } from '@/lib/authority/constants';
import type { AuthorityCategory, AuthorityPriority, AuthorityReachTier } from '@/lib/authority/types';

interface Contact {
  id: string;
  full_name: string;
  outlet: string | null;
}

interface StoryAngle {
  id: string;
  title: string;
}

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    opportunity_name: string;
    category: AuthorityCategory;
    priority: AuthorityPriority;
    target_outlet: string;
    contact_id: string | null;
    new_contact?: { full_name: string; email: string; outlet: string; role: string };
    story_angle_id: string | null;
    custom_story_angle: string;
    target_date: string;
    reach_tier: AuthorityReachTier;
    engagement_type: string;
    deal_value: number;
    notes: string;
  }) => Promise<void>;
  contacts: Contact[];
  storyAngles: StoryAngle[];
  stageId?: string;
}

export function CreateCardModal({
  isOpen,
  onClose,
  onSubmit,
  contacts,
  storyAngles,
}: CreateCardModalProps) {
  const [loading, setLoading] = useState(false);
  const [addNewContact, setAddNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ full_name: '', email: '', outlet: '', role: '' });
  const [formData, setFormData] = useState({
    opportunity_name: '',
    category: 'media_placement' as AuthorityCategory,
    priority: 'medium' as AuthorityPriority,
    target_outlet: '',
    contact_id: '' as string,
    story_angle_id: '' as string,
    custom_story_angle: '',
    target_date: '',
    reach_tier: 'local' as AuthorityReachTier,
    engagement_type: 'earned',
    deal_value: 0,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        opportunity_name: '',
        category: 'media_placement',
        priority: 'medium',
        target_outlet: '',
        contact_id: '',
        story_angle_id: '',
        custom_story_angle: '',
        target_date: '',
        reach_tier: 'local',
        engagement_type: 'earned',
        deal_value: 0,
        notes: '',
      });
      setAddNewContact(false);
      setNewContact({ full_name: '', email: '', outlet: '', role: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        contact_id: addNewContact ? null : (formData.contact_id || null),
        new_contact: addNewContact && newContact.full_name.trim()
          ? { ...newContact, full_name: newContact.full_name.trim(), email: newContact.email.trim(), outlet: newContact.outlet.trim(), role: newContact.role.trim() }
          : undefined,
        story_angle_id: formData.story_angle_id || null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-serif font-semibold text-charcoal">New PR Opportunity</h2>
          <button onClick={onClose} className="p-1 hover:bg-cream-warm rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Opportunity Name */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Opportunity Name *</label>
            <input
              type="text"
              required
              value={formData.opportunity_name}
              onChange={(e) => setFormData({ ...formData, opportunity_name: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              placeholder="e.g., Business Day Feature Interview"
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AuthorityCategory })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as AuthorityPriority })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Outlet */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Target Outlet / Publication</label>
            <input
              type="text"
              value={formData.target_outlet}
              onChange={(e) => setFormData({ ...formData, target_outlet: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              placeholder="e.g., Business Day, Forbes Africa"
            />
          </div>

          {/* Contact Person */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-charcoal">Contact Person</label>
              <button
                type="button"
                onClick={() => { setAddNewContact(!addNewContact); setFormData({ ...formData, contact_id: '' }); }}
                className="text-[10px] font-medium text-teal hover:text-teal-dark transition-colors"
              >
                {addNewContact ? 'Select existing' : '+ Add new'}
              </button>
            </div>
            {!addNewContact ? (
              <select
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}{c.outlet ? ` (${c.outlet})` : ''}</option>
                ))}
              </select>
            ) : (
              <div className="space-y-2 p-3 bg-cream-warm/30 rounded-lg border border-stone/10">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newContact.full_name}
                    onChange={(e) => setNewContact({ ...newContact, full_name: e.target.value })}
                    className="px-3 py-1.5 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
                    placeholder="Full name *"
                  />
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="px-3 py-1.5 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
                    placeholder="Email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newContact.outlet}
                    onChange={(e) => setNewContact({ ...newContact, outlet: e.target.value })}
                    className="px-3 py-1.5 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
                    placeholder="Outlet / Publication"
                  />
                  <select
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    className="px-3 py-1.5 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
                  >
                    <option value="">Role (optional)</option>
                    {CONTACT_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-stone">
                  If a contact with this email already exists, their details will be updated.
                </p>
              </div>
            )}
          </div>

          {/* Story Angle */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Story Angle</label>
            <select
              value={formData.story_angle_id}
              onChange={(e) => setFormData({ ...formData, story_angle_id: e.target.value })}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">None / Custom</option>
              {storyAngles.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          {/* Custom Story Angle */}
          {!formData.story_angle_id && (
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Custom Story Angle</label>
              <input
                type="text"
                value={formData.custom_story_angle}
                onChange={(e) => setFormData({ ...formData, custom_story_angle: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                placeholder="Describe your pitch angle"
              />
            </div>
          )}

          {/* Target Date + Reach Tier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Target Date</label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Reach Tier</label>
              <select
                value={formData.reach_tier}
                onChange={(e) => setFormData({ ...formData, reach_tier: e.target.value as AuthorityReachTier })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="local">Local</option>
                <option value="regional">Regional</option>
                <option value="national">National</option>
                <option value="international">International</option>
              </select>
            </div>
          </div>

          {/* Engagement Type + Deal Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Engagement Type</label>
              <select
                value={formData.engagement_type}
                onChange={(e) => setFormData({ ...formData, engagement_type: e.target.value })}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="earned">Earned (Free)</option>
                <option value="paid">Paid</option>
                <option value="contra">Contra / Exchange</option>
                <option value="sponsored">Sponsored</option>
              </select>
            </div>
            {['paid', 'sponsored'].includes(formData.engagement_type) && (
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Deal Value (R)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.deal_value || ''}
                  onChange={(e) => setFormData({ ...formData, deal_value: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
              placeholder="Additional notes..."
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
              disabled={loading || !formData.opportunity_name}
              className="px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
