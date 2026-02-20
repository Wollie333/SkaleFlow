'use client';

import { Input } from '@/components/ui/input';
import type { CustomerExperienceData } from '@/lib/brand-audit/types';

interface Props {
  data: CustomerExperienceData;
  onChange: (data: CustomerExperienceData) => void;
}

export function CustomerExperienceForm({ data, onChange }: Props) {
  const update = (field: keyof CustomerExperienceData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Customer Journey Defined?</label>
          <select value={data.customer_journey_defined === true ? 'yes' : data.customer_journey_defined === false ? 'no' : ''} onChange={(e) => update('customer_journey_defined', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Feedback Collection Method</label>
          <Input value={data.feedback_collection_method || ''} onChange={(e) => update('feedback_collection_method', e.target.value)} placeholder="e.g. Surveys, Google Reviews" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Customer Journey Notes</label>
        <textarea value={data.customer_journey_notes || ''} onChange={(e) => update('customer_journey_notes', e.target.value)} placeholder="Describe the customer journey from discovery to purchase..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[80px]" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">NPS Score</label>
          <Input type="number" min={-100} max={100} value={data.nps_score ?? ''} onChange={(e) => update('nps_score', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="-100 to 100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Review Rating</label>
          <Input type="number" min={0} max={5} step={0.1} value={data.review_rating ?? ''} onChange={(e) => update('review_rating', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="e.g. 4.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Review Count</label>
          <Input type="number" min={0} value={data.review_count ?? ''} onChange={(e) => update('review_count', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g. 150" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Complaint Handling Process</label>
        <textarea value={data.complaint_handling_process || ''} onChange={(e) => update('complaint_handling_process', e.target.value)} placeholder="How does the business handle customer complaints?" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Customer Retention Notes</label>
        <textarea value={data.customer_retention_notes || ''} onChange={(e) => update('customer_retention_notes', e.target.value)} placeholder="Retention strategies, loyalty programs, churn rate..." className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm min-h-[60px]" />
      </div>
    </div>
  );
}
