'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WizardSidebar } from '@/components/brand-audit/wizard-sidebar';
import { SectionForm } from '@/components/brand-audit/section-forms';
import { AuditStatusBadge } from '@/components/brand-audit/audit-status-badge';
import { ResultsDashboard } from '@/components/brand-audit/results-dashboard';
import { SECTION_ORDER, SECTION_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditSectionKey } from '@/types/database';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface AuditSection {
  id: string;
  section_key: BrandAuditSectionKey;
  data: Record<string, unknown>;
  is_complete: boolean;
  data_source: string;
  extraction_confidence: number | null;
  notes: string | null;
}

interface AuditScore {
  id: string;
  category: string;
  score: number;
  rating: string;
  analysis: string | null;
  key_finding: string | null;
  actionable_insight: string | null;
}

interface Audit {
  id: string;
  organization_id: string;
  contact_id: string | null;
  status: string;
  source: string;
  overall_score: number | null;
  overall_rating: string | null;
  executive_summary: string | null;
  sections_completed: number;
  total_sections: number;
  created_at: string;
  contact?: {
    first_name: string;
    last_name: string;
    email: string | null;
    crm_companies?: { name: string } | null;
  } | null;
  sections: AuditSection[];
  scores: AuditScore[];
}

export default function BrandAuditWizardPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [activeSection, setActiveSection] = useState<BrandAuditSectionKey>('company_overview');
  const [sectionData, setSectionData] = useState<Record<string, unknown>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch(`/api/brand-audits/${auditId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAudit(data);
      // Set initial section data
      const currentSection = data.sections?.find((s: AuditSection) => s.section_key === activeSection);
      if (currentSection) {
        setSectionData(currentSection.data || {});
      }
    } catch (error) {
      console.error('Error fetching audit:', error);
    } finally {
      setLoading(false);
    }
  }, [auditId, activeSection]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  // When activeSection changes, load that section's data
  useEffect(() => {
    if (!audit) return;
    const section = audit.sections?.find((s) => s.section_key === activeSection);
    setSectionData(section?.data || {});
    setHasUnsavedChanges(false);
  }, [activeSection, audit]);

  const handleSave = async (markComplete = false) => {
    if (!audit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/brand-audits/${auditId}/sections/${activeSection}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: sectionData,
          is_complete: markComplete || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setHasUnsavedChanges(false);
      await fetchAudit();
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!audit) return;

    // First transition to review if needed
    if (audit.status === 'in_progress' || audit.status === 'call_complete') {
      await fetch(`/api/brand-audits/${auditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'review' }),
      });
    }

    setScoring(true);
    try {
      const res = await fetch(`/api/brand-audits/${auditId}/generate`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to generate scores');
        return;
      }
      await fetchAudit();
    } catch (error) {
      console.error('Error generating scores:', error);
    } finally {
      setScoring(false);
    }
  };

  const goToSection = (direction: 'prev' | 'next') => {
    const currentIdx = SECTION_ORDER.indexOf(activeSection);
    const newIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx >= 0 && newIdx < SECTION_ORDER.length) {
      if (hasUnsavedChanges) handleSave();
      setActiveSection(SECTION_ORDER[newIdx]);
    }
  };

  const isResultsView = audit && ['complete', 'report_generated', 'delivered'].includes(audit.status);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse bg-white rounded-xl h-96 border border-stone/10" />
      </div>
    );
  }

  if (!audit) {
    return <div className="p-6 text-stone">Audit not found</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-stone/10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/brand-audit')} className="text-stone hover:text-charcoal">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-charcoal">
              {audit.contact ? `${audit.contact.first_name} ${audit.contact.last_name}` : 'Brand Audit'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-stone">
              {audit.contact?.crm_companies?.name && <span>{audit.contact.crm_companies.name}</span>}
              <AuditStatusBadge status={audit.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isResultsView && audit.sections_completed >= 5 && (
            <Button
              onClick={handleGenerate}
              disabled={scoring}
              className="bg-gold hover:bg-gold/90 text-dark"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              {scoring ? 'Scoring...' : 'Generate Audit Scores'}
            </Button>
          )}
          {isResultsView && (
            <Button
              onClick={() => router.push(`/brand-audit/${auditId}`)}
              variant="outline"
            >
              View Report
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      {isResultsView ? (
        <div className="p-6 overflow-y-auto h-[calc(100%-3.5rem)]">
          <ResultsDashboard
            audit={audit}
            scores={audit.scores}
            onRegenerate={handleGenerate}
          />
        </div>
      ) : (
        <div className="flex h-[calc(100%-3.5rem)]">
          {/* Wizard sidebar */}
          <WizardSidebar
            sections={audit.sections}
            activeSection={activeSection}
            onSectionClick={(key) => {
              if (hasUnsavedChanges) handleSave();
              setActiveSection(key);
            }}
            sectionsCompleted={audit.sections_completed}
            totalSections={audit.total_sections}
          />

          {/* Form area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-charcoal">
                  {SECTION_LABELS[activeSection]}
                </h2>
                <p className="text-sm text-stone mt-1">
                  Fill in the details for this section. Press Enter to add items to lists.
                </p>
              </div>

              <Card className="p-6 border border-stone/10">
                <SectionForm
                  sectionKey={activeSection}
                  data={sectionData}
                  onChange={(newData) => {
                    setSectionData(newData);
                    setHasUnsavedChanges(true);
                  }}
                />
              </Card>

              {/* Navigation + Save */}
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => goToSection('prev')}
                  disabled={SECTION_ORDER.indexOf(activeSection) === 0}
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saving || !hasUnsavedChanges}
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="bg-teal hover:bg-teal-dark text-white"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Mark Complete'}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => goToSection('next')}
                  disabled={SECTION_ORDER.indexOf(activeSection) === SECTION_ORDER.length - 1}
                >
                  Next
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
