'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PressKitBuilder } from '@/components/authority/press-kit-builder';
import { StoryAngleManager } from '@/components/authority/story-angle-manager';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function AuthorityPressKitPage() {
  const supabase = createClient();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [pressKit, setPressKit] = useState<Record<string, unknown> | null>(null);
  const [storyAngles, setStoryAngles] = useState<Array<{
    id: string; title: string; description: string | null;
    target_outlets: string | null; recommended_format: string | null; created_at: string;
  }>>([]);
  const [brandData, setBrandData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Get organization ID
  useEffect(() => {
    async function getOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (data?.organization_id) setOrganizationId(data.organization_id);
    }
    getOrg();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);

    const [kitRes, anglesRes] = await Promise.all([
      fetch(`/api/authority/press-kit?organizationId=${organizationId}`),
      fetch(`/api/authority/story-angles?organizationId=${organizationId}`),
    ]);

    if (kitRes.ok) {
      const data = await kitRes.json();
      setPressKit(data);
    }
    if (anglesRes.ok) setStoryAngles(await anglesRes.json());

    // Fetch brand data for pre-population
    const { data: outputs } = await supabase
      .from('brand_outputs')
      .select('output_key, output_value')
      .eq('organization_id', organizationId);

    const bd: Record<string, string> = {};
    (outputs || []).forEach((o) => {
      if (o.output_value) bd[o.output_key] = typeof o.output_value === 'string' ? o.output_value : JSON.stringify(o.output_value);
    });
    setBrandData(bd);

    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePressKit = async (data: Record<string, unknown>) => {
    await fetch('/api/authority/press-kit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <DocumentTextIcon className="w-6 h-6 text-teal" />
          <h1 className="text-2xl font-serif font-bold text-charcoal">Press Kit</h1>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse text-stone text-sm">Loading press kit...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <DocumentTextIcon className="w-6 h-6 text-teal" />
        <h1 className="text-2xl font-serif font-bold text-charcoal">Press Kit</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Press Kit Builder - 3 cols */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-stone/10 rounded-xl p-6 shadow-sm">
            <PressKitBuilder
              pressKit={pressKit as Parameters<typeof PressKitBuilder>[0]['pressKit']}
              organizationId={organizationId!}
              brandData={brandData}
              onSave={handleSavePressKit}
            />
          </div>
        </div>

        {/* Story Angles - 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-stone/10 rounded-xl p-6 shadow-sm">
            <StoryAngleManager
              angles={storyAngles}
              organizationId={organizationId!}
              onRefresh={loadData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
