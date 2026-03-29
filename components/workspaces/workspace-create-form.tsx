'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';

interface WorkspaceCreateFormProps {
  organizationId: string;
}

const PRESET_COLORS = [
  { name: 'Teal', value: '#0891b2' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
];

export function WorkspaceCreateForm({ organizationId }: WorkspaceCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0891b2', // Default teal
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create workspace');
      }

      // Redirect to workspace list on success
      router.push('/workspaces');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Workspace Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Product Launch Team, Client: Nike"
              className="w-full px-4 py-2 border border-stone/20 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="text-xs text-stone mt-1">
              Choose a descriptive name for this workspace
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this workspace..."
              rows={3}
              className="w-full px-4 py-2 border border-stone/20 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3">
              Workspace Color
            </label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  disabled={isSubmitting}
                  className={`relative h-12 rounded-lg transition-all ${
                    formData.color === color.value
                      ? 'ring-2 ring-offset-2 ring-teal scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {formData.color === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-stone mt-2">
              This color will help you identify the workspace in the sidebar
            </p>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3">
              Preview
            </label>
            <div className="flex items-center gap-3 p-4 bg-cream rounded-lg">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: formData.color }}
              >
                {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'WS'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal truncate">
                  {formData.name || 'Workspace Name'}
                </p>
                {formData.description && (
                  <p className="text-xs text-stone truncate">{formData.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-stone/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
