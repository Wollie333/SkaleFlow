import { PageHeader, Card } from '@/components/ui';
import { VideoCameraIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function VideoScriptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Video Scripts"
        icon={VideoCameraIcon}
        subtitle="YouTube, Reels, and TikTok video scripts"
        breadcrumbs={[
          { label: 'Content Machine', href: '/content/machine' },
          { label: 'Video Scripts' },
        ]}
      />

      <div className="flex items-center justify-center min-h-[40vh]">
        <Card className="max-w-sm text-center p-8">
          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <ClockIcon className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-charcoal mb-2">Coming Soon</h2>
          <p className="text-sm text-stone">
            Video script generation is being built. Check back soon!
          </p>
        </Card>
      </div>
    </div>
  );
}
