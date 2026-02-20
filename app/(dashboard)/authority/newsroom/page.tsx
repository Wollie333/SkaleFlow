'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  GlobeAltIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
  InboxArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Inquiry {
  id: string;
  journalist_name: string;
  journalist_outlet: string;
  journalist_email: string;
  topic_of_interest: string;
  deadline: string | null;
  is_processed: boolean;
  created_at: string;
}

export default function NewsroomManagePage() {
  const supabase = createClient();
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (data?.organization_id) {
        setOrgId(data.organization_id);
        const { data: org } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', data.organization_id)
          .single();
        if (org) setOrgSlug(org.slug);
      }
    }
    init();
  }, []);

  const loadInquiries = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from('authority_press_page_inquiries')
      .select('id, journalist_name, journalist_outlet, journalist_email, topic_of_interest, deadline, is_processed, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);
    setInquiries(data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleMarkProcessed = async (id: string) => {
    await supabase
      .from('authority_press_page_inquiries')
      .update({ is_processed: true, processed_at: new Date().toISOString() })
      .eq('id', id);
    loadInquiries();
  };

  const pressUrl = orgSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/press/${orgSlug}` : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(pressUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <GlobeAltIcon className="w-6 h-6 text-teal" />
        <h1 className="text-2xl font-serif font-bold text-charcoal">Newsroom</h1>
      </div>

      {/* Public URL */}
      {orgSlug && (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5 mb-6">
          <h2 className="text-sm font-semibold text-charcoal mb-2">Public Press Page</h2>
          <p className="text-xs text-stone mb-3">
            Share this URL with journalists and media professionals.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-cream-warm/50 rounded-lg px-3 py-2 text-sm text-charcoal font-mono truncate">
              {pressUrl}
            </div>
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <a
              href={pressUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              Preview
            </a>
          </div>
        </div>
      )}

      {/* Inquiries */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <InboxArrowDownIcon className="w-5 h-5 text-teal" />
          <h2 className="text-sm font-semibold text-charcoal">Press Inquiries</h2>
          <span className="text-xs text-stone ml-auto">
            {inquiries.filter(i => !i.is_processed).length} pending
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-stone animate-pulse">Loading inquiries...</p>
        ) : inquiries.length === 0 ? (
          <p className="text-sm text-stone text-center py-8">
            No inquiries yet. Share your press page to start receiving inquiries.
          </p>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className={`p-4 rounded-lg border transition-colors ${
                  inq.is_processed
                    ? 'border-stone/10 bg-cream-warm/20 opacity-60'
                    : 'border-teal/20 bg-teal/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-charcoal">{inq.journalist_name}</span>
                      <span className="text-xs text-stone">{inq.journalist_outlet}</span>
                    </div>
                    <p className="text-xs text-charcoal mt-1">{inq.topic_of_interest}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <a
                        href={`mailto:${inq.journalist_email}`}
                        className="text-xs text-teal hover:underline"
                      >
                        {inq.journalist_email}
                      </a>
                      {inq.deadline && (
                        <span className="text-[10px] text-stone flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          Deadline: {new Date(inq.deadline).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-[10px] text-stone">
                        {new Date(inq.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {!inq.is_processed && (
                    <button
                      onClick={() => handleMarkProcessed(inq.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
