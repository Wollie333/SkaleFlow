'use client';

import { PageHeader } from '@/components/ui';
import { ReviewDashboard } from '@/components/reviews/review-dashboard';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function ReviewsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon={EyeIcon}
        title="Reviews"
        subtitle="Review and approve changes from your team."
      />
      <ReviewDashboard />
    </div>
  );
}
