'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CalendarView, ContentEditor } from '@/components/content';
import { Button, Card } from '@/components/ui';
import { DocumentArrowDownIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { exportToCSV, downloadCSV } from '@/lib/content-engine/export';
import type { FunnelStage, StoryBrandStage, TimeSlot, ContentStatus } from '@/types/database';

interface ContentItem {
  id: string;
  scheduled_date: string;
  time_slot: TimeSlot;
  funnel_stage: FunnelStage;
  storybrand_stage: StoryBrandStage;
  format: string;
  topic: string | null;
  hook: string | null;
  script_body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[] | null;
  platforms: string[];
  status: ContentStatus;
}

interface Calendar {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export default function CalendarPage() {
  const supabase = createClient();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [currentCalendar, setCurrentCalendar] = useState<Calendar | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [contentEngineEnabled, setContentEngineEnabled] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load calendars and items
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get organization
      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id, organizations(content_engine_enabled)')
        .eq('user_id', user.id)
        .single();

      if (!membership?.organization_id) {
        setIsLoading(false);
        return;
      }

      setOrganizationId(membership.organization_id);
      setContentEngineEnabled((membership.organizations as { content_engine_enabled: boolean })?.content_engine_enabled || false);

      // Get calendars
      const { data: calendarsData } = await supabase
        .from('content_calendars')
        .select('id, name, start_date, end_date')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (calendarsData && calendarsData.length > 0) {
        setCalendars(calendarsData);
        setCurrentCalendar(calendarsData[0]);

        // Get items for current calendar
        const { data: itemsData } = await supabase
          .from('content_items')
          .select('*')
          .eq('calendar_id', calendarsData[0].id)
          .order('scheduled_date');

        setItems(itemsData || []);
      }

      setIsLoading(false);
    }

    loadData();
  }, [supabase]);

  const handleCreateCalendar = async (month: Date, frequency: 'aggressive' | 'moderate' | 'light') => {
    if (!organizationId) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          year: month.getFullYear(),
          month: month.getMonth(),
          frequency,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Reload calendars
      const { data: calendarsData } = await supabase
        .from('content_calendars')
        .select('id, name, start_date, end_date')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (calendarsData && calendarsData.length > 0) {
        setCalendars(calendarsData);
        setCurrentCalendar(calendarsData[0]);

        const { data: itemsData } = await supabase
          .from('content_items')
          .select('*')
          .eq('calendar_id', calendarsData[0].id)
          .order('scheduled_date');

        setItems(itemsData || []);
      }

      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create calendar:', error);
    }

    setIsGenerating(false);
  };

  const handleItemClick = useCallback((item: ContentItem) => {
    setSelectedItem(item);
  }, []);

  const handleSaveItem = async (updatedItem: ContentItem) => {
    const { error } = await supabase
      .from('content_items')
      .update({
        topic: updatedItem.topic,
        hook: updatedItem.hook,
        script_body: updatedItem.script_body,
        cta: updatedItem.cta,
        caption: updatedItem.caption,
        hashtags: updatedItem.hashtags,
        status: updatedItem.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedItem.id);

    if (!error) {
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    }
  };

  const handleGenerateContent = async (itemId: string): Promise<Partial<ContentItem>> => {
    const response = await fetch('/api/content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        contentItemIds: [itemId],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Update the item in state
    const generated = data.results?.[0]?.content || {};
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, ...generated, status: 'scripted' as ContentStatus } : i
    ));

    return generated;
  };

  const handleExport = () => {
    const csv = exportToCSV(items);
    const filename = `content-calendar-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(csv, filename);
  };

  const handleBulkGenerate = async () => {
    if (!organizationId || !currentCalendar) return;

    setIsGenerating(true);

    try {
      // Get all items that don't have content yet
      const itemsToGenerate = items
        .filter(i => i.status === 'idea' && !i.script_body)
        .slice(0, 10); // Limit to 10 at a time

      if (itemsToGenerate.length === 0) {
        alert('No items to generate');
        setIsGenerating(false);
        return;
      }

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          contentItemIds: itemsToGenerate.map(i => i.id),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update items in state
      if (data.results) {
        setItems(prev => prev.map(item => {
          const generated = data.results.find((r: { id: string }) => r.id === item.id);
          if (generated) {
            return { ...item, ...generated.content, status: 'scripted' as ContentStatus };
          }
          return item;
        }));
      }
    } catch (error) {
      console.error('Bulk generation failed:', error);
    }

    setIsGenerating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  if (!contentEngineEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <SparklesIcon className="w-16 h-16 text-stone/30 mb-4" />
        <h2 className="text-heading-lg text-charcoal mb-2">Content Engine Locked</h2>
        <p className="text-stone max-w-md">
          Complete all phases in the Brand Engine to unlock the Content Engine.
          Your brand strategy powers the AI content generation.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = '/brand'}>
          Continue Brand Engine
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md text-charcoal">Content Calendar</h1>
          <p className="text-body-lg text-stone mt-1">
            Plan, create, and schedule your content
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleExport} variant="ghost">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleBulkGenerate} variant="secondary" isLoading={isGenerating}>
            <SparklesIcon className="w-4 h-4 mr-2" />
            Generate Week
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Calendar
          </Button>
        </div>
      </header>

      {/* Calendar selector */}
      {calendars.length > 1 && (
        <div className="flex gap-2">
          {calendars.map(cal => (
            <button
              key={cal.id}
              onClick={() => {
                setCurrentCalendar(cal);
                // Reload items
                supabase
                  .from('content_items')
                  .select('*')
                  .eq('calendar_id', cal.id)
                  .order('scheduled_date')
                  .then(({ data }) => setItems(data || []));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentCalendar?.id === cal.id
                  ? 'bg-teal text-cream'
                  : 'bg-cream-warm text-charcoal hover:bg-stone/10'
              }`}
            >
              {cal.name}
            </button>
          ))}
        </div>
      )}

      {/* Calendar or empty state */}
      {items.length > 0 ? (
        <CalendarView items={items} onItemClick={handleItemClick} />
      ) : (
        <Card className="text-center py-16">
          <SparklesIcon className="w-16 h-16 mx-auto text-stone/30 mb-4" />
          <h3 className="text-heading-md text-charcoal mb-2">No Calendar Yet</h3>
          <p className="text-stone mb-6">
            Create your first content calendar to start planning and generating content.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Calendar
          </Button>
        </Card>
      )}

      {/* Content editor slide panel */}
      {selectedItem && (
        <ContentEditor
          item={selectedItem}
          onSave={handleSaveItem}
          onClose={() => setSelectedItem(null)}
          onGenerate={handleGenerateContent}
        />
      )}

      {/* Create calendar modal */}
      {showCreateModal && (
        <CreateCalendarModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCalendar}
          isLoading={isGenerating}
        />
      )}
    </div>
  );
}

function CreateCalendarModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (month: Date, frequency: 'aggressive' | 'moderate' | 'light') => void;
  isLoading: boolean;
}) {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [frequency, setFrequency] = useState<'aggressive' | 'moderate' | 'light'>('aggressive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [year, mon] = month.split('-').map(Number);
    onCreate(new Date(year, mon - 1), frequency);
  };

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-heading-lg text-charcoal mb-6">Create Content Calendar</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone/20 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Posting Frequency
            </label>
            <div className="space-y-2">
              {[
                { value: 'aggressive', label: 'Aggressive', desc: '~88 posts/month (3-4 per day)' },
                { value: 'moderate', label: 'Moderate', desc: '~50 posts/month (1-2 per day)' },
                { value: 'light', label: 'Light', desc: '~32 posts/month (1 per day)' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    frequency === opt.value
                      ? 'border-teal bg-teal/5'
                      : 'border-stone/20 hover:border-stone/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={opt.value}
                    checked={frequency === opt.value}
                    onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                    className="sr-only"
                  />
                  <div>
                    <p className="font-medium text-charcoal">{opt.label}</p>
                    <p className="text-xs text-stone">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={onClose} variant="ghost" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Create Calendar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
