'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@heroicons/react/24/outline';

interface LineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  productId?: string;
}

interface Product {
  id: string;
  name: string;
  price_cents: number;
}

interface InvoiceLineItemRowProps {
  item: LineItem;
  index: number;
  onChange: (index: number, updates: Partial<LineItem>) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
  products: Product[];
}

export function InvoiceLineItemRow({
  item,
  index,
  onChange,
  onRemove,
  disabled,
  products,
}: InvoiceLineItemRowProps) {
  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      onChange(index, {
        productId: product.id,
        description: product.name,
        unitPriceCents: product.price_cents,
        totalCents: item.quantity * product.price_cents,
      });
    } else {
      onChange(index, {
        productId: undefined,
      });
    }
  };

  const handleDescriptionChange = (description: string) => {
    onChange(index, { description, productId: undefined });
  };

  const handleQuantityChange = (quantity: number) => {
    onChange(index, {
      quantity,
      totalCents: quantity * item.unitPriceCents,
    });
  };

  const handleUnitPriceChange = (unitPrice: number) => {
    const unitPriceCents = Math.round(unitPrice * 100);
    onChange(index, {
      unitPriceCents,
      totalCents: item.quantity * unitPriceCents,
    });
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="flex items-start gap-2 p-3 bg-cream rounded-lg border border-stone/10">
      <div className="flex-1 grid grid-cols-12 gap-2 items-start">
        {/* Product Selector */}
        <div className="col-span-3">
          <label className="text-xs text-stone mb-1 block">Product</label>
          <select
            value={item.productId || ''}
            onChange={(e) => handleProductSelect(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-stone/20 rounded-md focus:ring-2 focus:ring-teal focus:border-transparent disabled:bg-cream disabled:cursor-not-allowed"
          >
            <option value="">Custom item...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="col-span-4">
          <label className="text-xs text-stone mb-1 block">Description</label>
          <Input
            value={item.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            disabled={disabled}
            placeholder="Item description"
            className="text-sm"
          />
        </div>

        {/* Quantity */}
        <div className="col-span-1">
          <label className="text-xs text-stone mb-1 block">Qty</label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(Number(e.target.value))}
            disabled={disabled}
            min="1"
            step="1"
            className="text-sm"
          />
        </div>

        {/* Unit Price */}
        <div className="col-span-2">
          <label className="text-xs text-stone mb-1 block">Unit Price</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-charcoal">R</span>
            <Input
              type="number"
              value={formatCurrency(item.unitPriceCents)}
              onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
              disabled={disabled}
              min="0"
              step="0.01"
              className="text-sm pl-7"
            />
          </div>
        </div>

        {/* Total */}
        <div className="col-span-2">
          <label className="text-xs text-stone mb-1 block">Total</label>
          <div className="px-3 py-2 bg-cream border border-stone/10 rounded-md text-sm font-medium text-dark">
            R{formatCurrency(item.totalCents)}
          </div>
        </div>
      </div>

      {/* Remove Button */}
      {!disabled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="mt-6 text-red-600 hover:text-red-400 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
