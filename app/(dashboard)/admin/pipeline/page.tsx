'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import type { PipelineStage } from '@/types/database';

interface Application {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  pipeline_stage: PipelineStage;
  created_at: string;
}

const STAGES: { key: PipelineStage; label: string; color: string; bgColor: string }[] = [
  { key: 'application', label: 'Application', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { key: 'declined', label: 'Declined', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  { key: 'approved', label: 'Approved', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  { key: 'booking_made', label: 'Booking Made', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  { key: 'lost', label: 'Lost', color: 'text-stone', bgColor: 'bg-stone/5 border-stone/20' },
  { key: 'won', label: 'Won', color: 'text-teal', bgColor: 'bg-teal/5 border-teal/20' },
];

export default function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/admin/pipeline');
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageApplications = (stage: PipelineStage) =>
    applications.filter(a => a.pipeline_stage === stage);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-stone">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={ClipboardDocumentListIcon}
        title="Applications"
        subtitle={`${applications.length} total application${applications.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Admin' }, { label: 'Applications' }]}
        className="mb-8"
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageApps = getStageApplications(stage.key);
          return (
            <div key={stage.key} className="min-w-[260px] flex-shrink-0">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 border ${stage.bgColor}`}>
                <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
                <span className={`text-xs font-bold ${stage.color} bg-white/60 px-2 py-0.5 rounded-full`}>
                  {stageApps.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {stageApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/admin/pipeline/${app.id}`}
                    className="block p-4 bg-white rounded-lg border border-stone/10 hover:border-teal/20 hover:shadow-sm transition-all group"
                  >
                    <div className="font-semibold text-sm text-charcoal group-hover:text-teal transition-colors">
                      {app.full_name}
                    </div>
                    <div className="text-xs text-stone mt-1">{app.business_name}</div>
                    <div className="text-xs text-stone/70 mt-0.5 truncate">{app.email}</div>
                    <div className="text-[11px] text-stone/50 mt-2">{formatDate(app.created_at)}</div>
                  </Link>
                ))}
                {stageApps.length === 0 && (
                  <div className="p-4 text-center text-xs text-stone/40 border border-dashed border-stone/10 rounded-lg">
                    No applications
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
