'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price_cents: number;
  currency: string;
  recurring: boolean;
  billing_interval: string;
  sort_order: number;
  is_active: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  product?: Product;
  onSaved: () => void;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  organizationId,
  product,
  onSaved,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '0',
    currency: 'ZAR',
    recurring: false,
    billingInterval: 'once',
    sortOrder: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: (product.price_cents / 100).toFixed(2),
        currency: product.currency || 'ZAR',
        recurring: product.recurring || false,
        billingInterval: product.billing_interval || 'once',
        sortOrder: product.sort_order || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        sku: '',
        price: '0',
        currency: 'ZAR',
        recurring: false,
        billingInterval: 'once',
        sortOrder: 0,
      });
    }
    setError('');
  }, [product, isOpen]);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = product
        ? `/api/crm/products/${product.id}`
        : '/api/crm/products';
      const method = product ? 'PATCH' : 'POST';

      const body: any = {
        name: formData.name,
        description: formData.description || null,
        sku: formData.sku || null,
        priceCents: Math.round(parseFloat(formData.price) * 100),
        currency: formData.currency,
        recurring: formData.recurring,
        billingInterval: formData.recurring ? formData.billingInterval : 'once',
        sortOrder: formData.sortOrder,
      };

      if (!product) {
        body.organizationId = organizationId;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save product');
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
            {product ? 'Edit Product' : 'Add Product'}
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
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="Premium Package"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="Product description..."
              rows={3}
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              SKU
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="PROD-001"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Price (Rands)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="0.00"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Currency
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="ZAR"
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.recurring}
              onChange={(e) => handleChange('recurring', e.target.checked)}
              className="h-4 w-4 text-teal border-stone/30 rounded focus:ring-teal"
            />
            <label htmlFor="recurring" className="text-sm font-medium text-charcoal">
              Recurring billing
            </label>
          </div>

          {/* Billing Interval - only show if recurring */}
          {formData.recurring && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Billing Interval
              </label>
              <select
                value={formData.billingInterval}
                onChange={(e) => handleChange('billingInterval', e.target.value)}
                className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              >
                <option value="once">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          )}

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-stone/30 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
              placeholder="0"
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
              {loading ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
