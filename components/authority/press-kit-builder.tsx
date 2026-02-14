'use client';

import { useState, useEffect } from 'react';
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
}

export function PressKitBuilder({ pressKit, organizationId, brandData, onSave }: PressKitBuilderProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [saving, setSaving] = useState(false);

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
      setBrandGuidelinesUrl(pressKit.brand_guidelines_url || '');

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
    }
  }, [pressKit, brandData]);

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
                ? 'bg-white text-charcoal shadow-sm'
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
            <label className="block text-xs font-semibold text-charcoal mb-1">Company Overview</label>
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
            <label className="block text-xs font-semibold text-charcoal mb-1">Mission Statement</label>
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
          <label className="block text-xs font-semibold text-charcoal mb-1">Founder / CEO Bio</label>
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
        />
      )}

      {/* Brand Guidelines */}
      {activeSection === 'brand' && (
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">Brand Guidelines URL</label>
          <p className="text-[10px] text-stone mb-2">Link to your downloadable brand guide (or your playbook page).</p>
          <input
            type="url"
            value={brandGuidelinesUrl}
            onChange={(e) => setBrandGuidelinesUrl(e.target.value)}
            className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            placeholder="https://..."
          />
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
}: {
  label: string;
  items: string[];
  newValue: string;
  setNewValue: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder: string;
  description?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-charcoal mb-1">{label}</label>
      {description && <p className="text-[10px] text-stone mb-2">{description}</p>}
      <div className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-cream-warm/40 rounded-lg">
            <span className="flex-1 text-xs text-charcoal">{item}</span>
            <button
              onClick={() => onRemove(i)}
              className="text-stone hover:text-red-500 transition-colors"
            >
              <span className="text-xs">×</span>
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
