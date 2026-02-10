import { PageHeader, Card } from '@/components/ui';
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function BlogArticlesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Articles"
        icon={DocumentTextIcon}
        subtitle="SEO-optimized blog posts and long-form articles"
        breadcrumbs={[
          { label: 'Content Machine', href: '/content/machine' },
          { label: 'Blog Articles' },
        ]}
      />

      <div className="flex items-center justify-center min-h-[40vh]">
        <Card className="max-w-sm text-center p-8">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <ClockIcon className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-charcoal mb-2">Coming Soon</h2>
          <p className="text-sm text-stone">
            Blog article generation is being built. Check back soon!
          </p>
        </Card>
      </div>
    </div>
  );
}
