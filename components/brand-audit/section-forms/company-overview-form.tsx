'use client';

import { Input } from '@/components/ui/input';
import type { CompanyOverviewData } from '@/lib/brand-audit/types';

interface Props {
  data: CompanyOverviewData;
  onChange: (data: CompanyOverviewData) => void;
}

export function CompanyOverviewForm({ data, onChange }: Props) {
  const update = (field: keyof CompanyOverviewData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Business Name</label>
          <Input value={data.business_name || ''} onChange={(e) => update('business_name', e.target.value)} placeholder="e.g. Acme Corp" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Industry</label>
          <Input value={data.industry || ''} onChange={(e) => update('industry', e.target.value)} placeholder="e.g. Technology" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Years in Business</label>
          <Input type="number" value={data.years_in_business ?? ''} onChange={(e) => update('years_in_business', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g. 5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Business Model</label>
          <Input value={data.business_model || ''} onChange={(e) => update('business_model', e.target.value)} placeholder="e.g. B2B SaaS" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Target Market</label>
        <Input value={data.target_market || ''} onChange={(e) => update('target_market', e.target.value)} placeholder="e.g. Small businesses in South Africa" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Employee Count</label>
          <select value={data.employee_count || ''} onChange={(e) => update('employee_count', e.target.value)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201-500">201-500</option>
            <option value="500+">500+</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Annual Revenue Range</label>
          <select value={data.annual_revenue_range || ''} onChange={(e) => update('annual_revenue_range', e.target.value)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="<R1M">Less than R1M</option>
            <option value="R1M-R5M">R1M - R5M</option>
            <option value="R5M-R20M">R5M - R20M</option>
            <option value="R20M-R100M">R20M - R100M</option>
            <option value=">R100M">More than R100M</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Website URL</label>
        <Input value={data.website_url || ''} onChange={(e) => update('website_url', e.target.value)} placeholder="https://example.com" />
      </div>
    </div>
  );
}
