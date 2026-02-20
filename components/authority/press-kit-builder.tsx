'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { FactSheet } from '@/lib/authority/types';

interface PressKitData {
  id?: string;
  company_overview: string | null;
  founder_bio: string | null;
  mission_statement: string | null;
  fact_sheet: FactSheet | null;
  speaking_topics: string[] | null;
  brand_guidelines_url: string | null;
}

interface PressKitBuilderProps {
  pressKit: PressKitData | null;
  organizationId: string;
  brandData: Record<string, string>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  selectedModelId?: string;
  defaultPlaybookUrl?: string;
}

type AiFieldName = 'company_overview' | 'mission_statement' | 'founder_bio' | 'speaking_topics' | 'milestones' | 'awards' | 'key_stats';
type AiModalStatus = 'generating' | 'done' | 'error';

const AI_FIELD_LABELS: Record<AiFieldName, string> = {
  company_overview: 'Company Overview',
  mission_statement: 'Mission Statement',
  founder_bio: 'Founder Bio',
  speaking_topics: 'Speaking Topics',
  milestones: 'Key Milestones',
  awards: 'Awards & Recognition',
  key_stats: 'Key Statistics',
};

export function PressKitBuilder({ pressKit, organizationId, brandData, onSave, selectedModelId, defaultPlaybookUrl }: PressKitBuilderProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [saving, setSaving] = useState(false);

  // AI modal state
  const [aiModalField, setAiModalField] = useState<AiFieldName | null>(null);
  const [aiModalStatus, setAiModalStatus] = useState<AiModalStatus>('generating');
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [aiGeneratedItems, setAiGeneratedItems] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');

  // Form state
  const [companyOverview, setCompanyOverview] = useState('');
  const [founderBio, setFounderBio] = useState('');
  const [missionStatement, setMissionStatement] = useState('');
  const [speakingTopics, setSpeakingTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [brandGuidelinesUrl, setBrandGuidelinesUrl] = useState('');

  // Fact sheet
  const [foundingDate, setFoundingDate] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [markets, setMarkets] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [awards, setAwards] = useState<string[]>([]);
  const [newAward, setNewAward] = useState('');
  const [keyStats, setKeyStats] = useState<string[]>([]);
  const [newStat, setNewStat] = useState('');

  // Initialize from existing data or brand data
  useEffect(() => {
    if (pressKit) {
      setCompanyOverview(pressKit.company_overview || '');
      setFounderBio(pressKit.founder_bio || '');
      setMissionStatement(pressKit.mission_statement || '');
      setSpeakingTopics(pressKit.speaking_topics || []);
      setBrandGuidelinesUrl(pressKit.brand_guidelines_url || defaultPlaybookUrl || '');

      const fs = pressKit.fact_sheet;
      if (fs) {
        setFoundingDate(fs.founding_date || '');
        setTeamSize(fs.team_size || '');
        setMarkets(fs.markets || '');
        setMilestones(fs.milestones || []);
        setAwards(fs.awards || []);
        setKeyStats(fs.key_stats || []);
      }
    } else {
      // Pre-populate from brand data
      setCompanyOverview(brandData['brand_positioning'] || brandData['brand_story'] || '');
      setFounderBio(brandData['founder_bio'] || '');
      setMissionStatement(brandData['brand_mission'] || brandData['mission_statement'] || '');
      setBrandGuidelinesUrl(defaultPlaybookUrl || '');
    }
  }, [pressKit, brandData, defaultPlaybookUrl]);

  // Get current value for the field being written
  const getCurrentValue = (field: AiFieldName): string => {
    switch (field) {
      case 'company_overview': return companyOverview;
      case 'mission_statement': return missionStatement;
      case 'founder_bio': return founderBio;
      default: return '';
    }
  };

  // AI write handler
  const handleAiWrite = async (field: AiFieldName) => {
    setAiModalField(field);
    setAiModalStatus('generating');
    setAiGeneratedText('');
    setAiGeneratedItems([]);
    setAiError('');

    try {
      const res = await fetch('/api/authority/ai/press-kit-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          fieldName: field,
          modelId: selectedModelId || null,
          currentValue: getCurrentValue(field) || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();
      if (data.type === 'list') {
        setAiGeneratedItems(data.items || []);
      } else {
        setAiGeneratedText(data.text || '');
      }
      setAiModalStatus('done');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generation failed');
      setAiModalStatus('error');
    }
  };

  // Accept AI generated content
  const handleAcceptAi = () => {
    if (!aiModalField) return;

    if (aiGeneratedText) {
      switch (aiModalField) {
        case 'company_overview': setCompanyOverview(aiGeneratedText); break;
        case 'mission_statement': setMissionStatement(aiGeneratedText); break;
        case 'founder_bio': setFounderBio(aiGeneratedText); break;
      }
    }

    if (aiGeneratedItems.length > 0) {
      switch (aiModalField) {
        case 'speaking_topics': setSpeakingTopics(prev => [...prev, ...aiGeneratedItems]); break;
        case 'milestones': setMilestones(prev => [...prev, ...aiGeneratedItems]); break;
        case 'awards': setAwards(prev => [...prev, ...aiGeneratedItems]); break;
        case 'key_stats': setKeyStats(prev => [...prev, ...aiGeneratedItems]); break;
      }
    }

    setAiModalField(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        organizationId,
        company_overview: companyOverview || null,
        founder_bio: founderBio || null,
        mission_statement: missionStatement || null,
        brand_guidelines_url: brandGuidelinesUrl || null,
        speaking_topics: speakingTopics.length > 0 ? speakingTopics : null,
        fact_sheet: {
          founding_date: foundingDate || undefined,
          team_size: teamSize || undefined,
          markets: markets || undefined,
          milestones: milestones.length > 0 ? milestones : undefined,
          awards: awards.length > 0 ? awards : undefined,
          key_stats: keyStats.length > 0 ? keyStats : undefined,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const addToList = (list: string[], setter: (v: string[]) => void, value: string, resetSetter: (v: string) => void) => {
    if (!value.trim()) return;
    setter([...list, value.trim()]);
    resetSetter('');
  };

  const removeFromList = (list: string[], setter: (v: string[]) => void, index: number) => {
    setter(list.filter((_, i) => i !== index));
  };

  const sections = [
    { key: 'overview', label: 'Company Overview' },
    { key: 'founder', label: 'Founder Bio' },
    { key: 'facts', label: 'Fact Sheet' },
    { key: 'speaking', label: 'Speaking Topics' },
    { key: 'brand', label: 'Brand Guidelines' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-1 bg-cream-warm/40 p-1 rounded-xl">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeSection === s.key
                ? 'bg-cream-warm text-charcoal shadow-sm'
                : 'text-stone hover:text-charcoal'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Company Overview */}
      {activeSection === 'overview' && (
        <div className="space-y-3">
          <div>
            <FieldLabel label="Company Overview" onAiWrite={() => handleAiWrite('company_overview')} />
            <p className="text-[10px] text-stone mb-2">A concise summary for journalists. Pre-populated from your Brand Engine.</p>
            <textarea
              value={companyOverview}
              onChange={(e) => setCompanyOverview(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
              placeholder="A brief overview of your company, what you do, and who you serve..."
            />
          </div>
          <div>
            <FieldLabel label="Mission Statement" onAiWrite={() => handleAiWrite('mission_statement')} />
            <textarea
              value={missionStatement}
              onChange={(e) => setMissionStatement(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
              placeholder="Your company's mission..."
            />
          </div>
        </div>
      )}

      {/* Founder Bio */}
      {activeSection === 'founder' && (
        <div>
          <FieldLabel label="Founder / CEO Bio" onAiWrite={() => handleAiWrite('founder_bio')} />
          <p className="text-[10px] text-stone mb-2">Pre-populated from your Brand Engine. Edit for media use.</p>
          <textarea
            value={founderBio}
            onChange={(e) => setFounderBio(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none"
            placeholder="A professional bio of the founder or CEO..."
          />
        </div>
      )}

      {/* Fact Sheet */}
      {activeSection === 'facts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Founded</label>
              <input
                type="text"
                value={foundingDate}
                onChange={(e) => setFoundingDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
                placeholder="2020"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Team Size</label>
              <input
                type="text"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
                placeholder="10-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Markets</label>
              <input
                type="text"
                value={markets}
                onChange={(e) => setMarkets(e.target.value)}
                className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal/30"
                placeholder="South Africa, Africa"
              />
            </div>
          </div>

          {/* Milestones */}
          <ListEditor
            label="Key Milestones"
            items={milestones}
            newValue={newMilestone}
            setNewValue={setNewMilestone}
            onAdd={() => addToList(milestones, setMilestones, newMilestone, setNewMilestone)}
            onRemove={(i) => removeFromList(milestones, setMilestones, i)}
            placeholder="e.g., Launched in 2020, Series A in 2022"
            onAiWrite={() => handleAiWrite('milestones')}
          />

          {/* Awards */}
          <ListEditor
            label="Awards & Recognition"
            items={awards}
            newValue={newAward}
            setNewValue={setNewAward}
            onAdd={() => addToList(awards, setAwards, newAward, setNewAward)}
            onRemove={(i) => removeFromList(awards, setAwards, i)}
            placeholder="e.g., Top 50 Startups 2024"
            onAiWrite={() => handleAiWrite('awards')}
          />

          {/* Key Stats */}
          <ListEditor
            label="Key Statistics"
            items={keyStats}
            newValue={newStat}
            setNewValue={setNewStat}
            onAdd={() => addToList(keyStats, setKeyStats, newStat, setNewStat)}
            onRemove={(i) => removeFromList(keyStats, setKeyStats, i)}
            placeholder="e.g., 10,000+ users"
            onAiWrite={() => handleAiWrite('key_stats')}
          />
        </div>
      )}

      {/* Speaking Topics */}
      {activeSection === 'speaking' && (
        <ListEditor
          label="Speaking Topics"
          items={speakingTopics}
          newValue={newTopic}
          setNewValue={setNewTopic}
          onAdd={() => addToList(speakingTopics, setSpeakingTopics, newTopic, setNewTopic)}
          onRemove={(i) => removeFromList(speakingTopics, setSpeakingTopics, i)}
          placeholder="e.g., The Future of African Tech"
          description="Topics the founder/team can speak about in media, podcasts, and events."
          onAiWrite={() => handleAiWrite('speaking_topics')}
        />
      )}

      {/* Brand Guidelines */}
      {activeSection === 'brand' && (
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">Brand Visual Guide URL</label>
          <p className="text-[10px] text-stone mb-2">
            Link to your public brand visual guide. Defaults to your SkaleFlow brand guide page.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={brandGuidelinesUrl}
              onChange={(e) => setBrandGuidelinesUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              placeholder="https://..."
            />
            {defaultPlaybookUrl && brandGuidelinesUrl !== defaultPlaybookUrl && (
              <button
                type="button"
                onClick={() => setBrandGuidelinesUrl(defaultPlaybookUrl)}
                className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-medium text-teal border border-teal/30 rounded-lg hover:bg-teal/5 transition-colors whitespace-nowrap"
                title="Restore default SkaleFlow brand guide link"
              >
                <ArrowPathIcon className="w-3 h-3" />
                Restore default
              </button>
            )}
          </div>
          {defaultPlaybookUrl && brandGuidelinesUrl === defaultPlaybookUrl && (
            <p className="text-[10px] text-teal mt-1.5 flex items-center gap-1">
              <CheckIcon className="w-3 h-3" />
              Using your SkaleFlow brand visual guide
            </p>
          )}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Press Kit'}
      </button>

      {/* AI Write Modal */}
      {aiModalField && (
        <AiWriteModal
          fieldName={AI_FIELD_LABELS[aiModalField]}
          status={aiModalStatus}
          generatedText={aiGeneratedText}
          generatedItems={aiGeneratedItems}
          error={aiError}
          onAccept={handleAcceptAi}
          onRetry={() => handleAiWrite(aiModalField)}
          onClose={() => setAiModalField(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Field Label with AI Write Button
// ============================================================================

function FieldLabel({ label, onAiWrite }: { label: string; onAiWrite: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <label className="text-xs font-semibold text-charcoal">{label}</label>
      <button
        type="button"
        onClick={onAiWrite}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gold bg-gold/10 rounded-md hover:bg-gold/20 transition-colors"
        title="Write with AI"
      >
        <SparklesIcon className="w-3 h-3" />
        AI
      </button>
    </div>
  );
}

// ============================================================================
// AI Write Modal
// ============================================================================

function AiWriteModal({
  fieldName,
  status,
  generatedText,
  generatedItems,
  error,
  onAccept,
  onRetry,
  onClose,
}: {
  fieldName: string;
  status: AiModalStatus;
  generatedText: string;
  generatedItems: string[];
  error: string;
  onAccept: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-cream-warm rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone/10">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-charcoal">Write with AI</h3>
            <span className="text-xs text-stone">— {fieldName}</span>
          </div>
          <button onClick={onClose} className="text-stone hover:text-charcoal transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-3" />
              <p className="text-sm text-charcoal font-medium">Generating {fieldName}...</p>
              <p className="text-xs text-stone mt-1">Using your brand profile to write tailored content</p>
            </div>
          )}

          {status === 'done' && generatedText && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-stone">Generated Content</p>
              <div className="p-3 bg-cream-warm/30 rounded-lg border border-stone/10">
                <p className="text-sm text-charcoal leading-relaxed whitespace-pre-line">{generatedText}</p>
              </div>
            </div>
          )}

          {status === 'done' && generatedItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-stone">Generated Items</p>
              <div className="space-y-1.5">
                {generatedItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-cream-warm/30 rounded-lg border border-stone/10">
                    <CheckIcon className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                    <span className="text-sm text-charcoal">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <XMarkIcon className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-charcoal mb-1">Generation Failed</p>
              <p className="text-xs text-stone text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-stone/10 bg-cream-warm/20">
          {status === 'done' && (
            <>
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-xs font-medium text-stone hover:text-charcoal transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={onAccept}
                className="px-4 py-1.5 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors"
              >
                Accept
              </button>
            </>
          )}
          {status === 'error' && (
            <button
              onClick={onRetry}
              className="px-4 py-1.5 text-xs font-medium text-white bg-teal rounded-lg hover:bg-teal-dark transition-colors"
            >
              Try Again
            </button>
          )}
          {status === 'generating' && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-stone hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// List Editor Helper
// ============================================================================

function ListEditor({
  label,
  items,
  newValue,
  setNewValue,
  onAdd,
  onRemove,
  placeholder,
  description,
  onAiWrite,
}: {
  label: string;
  items: string[];
  newValue: string;
  setNewValue: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder: string;
  description?: string;
  onAiWrite?: () => void;
}) {
  return (
    <div>
      {onAiWrite ? (
        <FieldLabel label={label} onAiWrite={onAiWrite} />
      ) : (
        <label className="block text-xs font-semibold text-charcoal mb-1">{label}</label>
      )}
      {description && <p className="text-[10px] text-stone mb-2">{description}</p>}
      <div className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-cream-warm/40 rounded-lg">
            <span className="flex-1 text-xs text-charcoal">{item}</span>
            <button
              onClick={() => onRemove(i)}
              className="text-stone hover:text-red-500 transition-colors"
            >
              <span className="text-xs">&times;</span>
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 border border-stone/20 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal/30"
        />
        <button
          onClick={onAdd}
          disabled={!newValue.trim()}
          className="px-3 py-1.5 text-xs font-medium text-teal border border-teal/30 rounded-lg hover:bg-teal/5 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
