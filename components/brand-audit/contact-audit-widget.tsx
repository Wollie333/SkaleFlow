'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScoreGauge } from './score-gauge';
import { TrafficLight } from './traffic-light';
import { AuditStatusBadge } from './audit-status-badge';
import type { BrandAuditCategory, BrandAuditRating } from '@/types/database';
import {
  PlusIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface AuditSummary {
  latest_audit_id: string;
  status: string;
  overall_score: number | null;
  overall_rating: string | null;
  source: string;
  audit_date: string;
  total_audits: number;
  scores?: Array<{ category: BrandAuditCategory; rating: BrandAuditRating }>;
}

interface ContactAuditWidgetProps {
  contactId: string;
  organizationId: string;
}

export function ContactAuditWidget({ contactId, organizationId }: ContactAuditWidgetProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/crm/contacts/${contactId}/audit-summary`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch { /* no audit data */ }
      setLoading(false);
    };
    fetchSummary();
  }, [contactId]);

  if (loading) {
    return <div className="animate-pulse bg-white rounded-xl h-32 border border-stone/10" />;
  }

  if (!summary) {
    return (
      <Card className="p-6 border border-stone/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-stone" />
            <div>
              <h3 className="font-semibold text-charcoal text-sm">Brand Audit</h3>
              <p className="text-xs text-stone">No audits yet for this contact</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => router.push(`/brand-audit?newAudit=true&contactId=${contactId}`)}
            className="bg-teal hover:bg-teal-dark text-white"
          >
            <PlusIcon className="w-4 h-4 mr-1" /> New Audit
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border border-stone/10">
      <div className="flex items-start gap-4">
        {/* Score gauge */}
        {summary.overall_score != null && (
          <div className="relative">
            <ScoreGauge
              score={summary.overall_score}
              rating={summary.overall_rating || 'red'}
              size={80}
              showLabel={false}
            />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-charcoal text-sm">Brand Audit</h3>
              <div className="flex items-center gap-2 mt-1">
                <AuditStatusBadge status={summary.status} />
                {summary.scores && summary.scores.length > 0 && (
                  <TrafficLight ratings={summary.scores} size="sm" />
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-stone mt-2">
            {summary.total_audits} audit{summary.total_audits !== 1 ? 's' : ''}
            {' · '}
            Last: {new Date(summary.audit_date).toLocaleDateString('en-ZA')}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/brand-audit/${summary.latest_audit_id}`)}
            >
              <EyeIcon className="w-3 h-3 mr-1" /> View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/brand-audit?newAudit=true&contactId=${contactId}`)}
            >
              <PlusIcon className="w-3 h-3 mr-1" /> New
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/brand-audit?contactId=${contactId}`)}
            >
              History
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
