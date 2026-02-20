'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import ProductFormModal from './product-form-modal';

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

interface ProductListProps {
  organizationId: string;
}

export default function ProductList({ organizationId }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/crm/products?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchProducts();
    }
  }, [organizationId]);

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await fetch(`/api/crm/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !product.is_active }),
      });

      if (!response.ok) throw new Error('Failed to update product');

      fetchProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const handleSaved = () => {
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleAddProduct}
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Product Table */}
      {products.length === 0 ? (
        <div className="bg-cream-warm rounded-lg border border-stone/10 p-12 text-center">
          <p className="text-stone mb-4">No products yet</p>
          <button
            onClick={handleAddProduct}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="bg-cream-warm rounded-lg border border-stone/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-stone uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-charcoal">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-stone mt-1 line-clamp-1">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone">
                    {product.sku || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal font-medium">
                    R{(product.price_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {product.recurring ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal border border-teal/20">
                        {product.billing_interval.charAt(0).toUpperCase() + product.billing_interval.slice(1)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone/10 text-stone border border-stone/20">
                        One-time
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className="flex items-center gap-2 group"
                    >
                      <div
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${
                          product.is_active ? 'bg-green-500' : 'bg-stone/40'
                        }`}
                      />
                      <span className="text-xs text-stone group-hover:text-charcoal transition-colors">
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-2 hover:bg-cream/50 rounded-lg transition-colors"
                      title="Edit product"
                    >
                      <PencilIcon className="h-4 w-4 text-stone hover:text-charcoal" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showForm}
        onClose={handleFormClose}
        organizationId={organizationId}
        product={editingProduct}
        onSaved={handleSaved}
      />
    </div>
  );
}
