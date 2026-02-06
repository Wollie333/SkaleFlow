'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button, Input, Textarea, Badge, StatusBadge } from '@/components/ui';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
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

interface ContentEditorProps {
  item: ContentItem;
  onSave: (item: ContentItem) => Promise<void>;
  onClose: () => void;
  onGenerate: (itemId: string) => Promise<Partial<ContentItem>>;
}

export function ContentEditor({ item, onSave, onClose, onGenerate }: ContentEditorProps) {
  const [formData, setFormData] = useState(item);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await onGenerate(item.id);
      setFormData(prev => ({ ...prev, ...generated }));
    } catch (error) {
      console.error('Generation failed:', error);
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    }
    setIsSaving(false);
  };

  const updateField = <K extends keyof ContentItem>(field: K, value: ContentItem[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-stone/10 overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone/10 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-heading-md text-charcoal">Edit Content</h2>
          <p className="text-sm text-stone">
            {format(new Date(item.scheduled_date), 'EEEE, MMMM d')} • {item.time_slot}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-cream-warm rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-stone" />
        </button>
      </div>

      {/* Metadata badges */}
      <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-stone/5">
        <Badge variant={item.funnel_stage}>{item.funnel_stage}</Badge>
        <Badge>{item.storybrand_stage.replace(/_/g, ' ')}</Badge>
        <Badge>{item.format.replace(/_/g, ' ')}</Badge>
        <StatusBadge status={item.status} />
      </div>

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
          variant="secondary"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate with AI'}
        </Button>

        {/* Topic */}
        <Input
          label="Topic"
          value={formData.topic || ''}
          onChange={(e) => updateField('topic', e.target.value)}
          placeholder="Content topic..."
        />

        {/* Hook */}
        <Textarea
          label="Hook"
          hint="First 3 seconds / first line that stops the scroll"
          value={formData.hook || ''}
          onChange={(e) => updateField('hook', e.target.value)}
          placeholder="Attention-grabbing opening..."
          rows={2}
        />
        <p className="text-xs text-stone -mt-4">
          {(formData.hook || '').length}/100 characters
        </p>

        {/* Script Body */}
        <Textarea
          label="Script Body"
          value={formData.script_body || ''}
          onChange={(e) => updateField('script_body', e.target.value)}
          placeholder="Main content..."
          rows={6}
        />

        {/* CTA */}
        <Input
          label="Call to Action"
          value={formData.cta || ''}
          onChange={(e) => updateField('cta', e.target.value)}
          placeholder="What should they do next?"
        />

        {/* Caption */}
        <Textarea
          label="Platform Caption"
          value={formData.caption || ''}
          onChange={(e) => updateField('caption', e.target.value)}
          placeholder="Caption with hashtags..."
          rows={4}
        />

        {/* Hashtags */}
        <Input
          label="Hashtags"
          value={(formData.hashtags || []).join(' ')}
          onChange={(e) => updateField('hashtags', e.target.value.split(/\s+/).filter(Boolean))}
          placeholder="#content #marketing #strategy"
        />

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as ContentStatus)}
            className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            <option value="idea">Idea</option>
            <option value="scripted">Scripted</option>
            <option value="approved">Approved</option>
            <option value="filming">Filming</option>
            <option value="filmed">Filmed</option>
            <option value="designing">Designing</option>
            <option value="designed">Designed</option>
            <option value="editing">Editing</option>
            <option value="edited">Edited</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-stone/10 px-6 py-4 flex gap-3">
        <Button
          onClick={onClose}
          variant="ghost"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          className="flex-1"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
