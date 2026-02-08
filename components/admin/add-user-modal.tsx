'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  tiers: SubscriptionTier[];
}

export function AddUserModal({ isOpen, onClose, onCreated, tiers }: AddUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [tierId, setTierId] = useState(tiers[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setOrganizationName('');
    setTierId(tiers[0]?.id || '');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !organizationName.trim() || !tierId) {
      setError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          organizationName: organizationName.trim(),
          tierId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }

      resetForm();
      onCreated();
      onClose();
    } catch {
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-teal/[0.08] w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div>
            <h2 className="text-lg font-semibold text-charcoal">Add User</h2>
            <p className="text-sm text-stone mt-0.5">Create a fully provisioned user account</p>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="p-1.5 rounded-lg hover:bg-cream text-stone hover:text-charcoal transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoFocus
              className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Organization Name</label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Subscription Tier</label>
            <select
              value={tierId}
              onChange={(e) => setTierId(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            >
              {tiers.map(tier => (
                <option key={tier.id} value={tier.id}>{tier.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="text-sm font-medium text-stone hover:text-charcoal px-4 py-2.5 rounded-lg hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2.5"
            >
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
