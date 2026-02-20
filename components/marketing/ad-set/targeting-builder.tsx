'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

export interface TargetingConfig {
  ageMin: number;
  ageMax: number;
  gender: 'all' | 'male' | 'female';
  locations: string[];
  interests: string[];
  customAudiences: string[];
}

interface TargetingBuilderProps {
  value: TargetingConfig;
  onChange: (config: TargetingConfig) => void;
  audiences?: Array<{ id: string; name: string }>;
}

const GENDER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

export function TargetingBuilder({ value, onChange, audiences }: TargetingBuilderProps) {
  const [locationInput, setLocationInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const update = (partial: Partial<TargetingConfig>) => {
    onChange({ ...value, ...partial });
  };

  const addLocation = () => {
    const trimmed = locationInput.trim();
    if (trimmed && !value.locations.includes(trimmed)) {
      update({ locations: [...value.locations, trimmed] });
      setLocationInput('');
    }
  };

  const removeLocation = (loc: string) => {
    update({ locations: value.locations.filter((l) => l !== loc) });
  };

  const addInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !value.interests.includes(trimmed)) {
      update({ interests: [...value.interests, trimmed] });
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => {
    update({ interests: value.interests.filter((i) => i !== interest) });
  };

  const toggleAudience = (audienceId: string) => {
    const current = value.customAudiences;
    if (current.includes(audienceId)) {
      update({ customAudiences: current.filter((id) => id !== audienceId) });
    } else {
      update({ customAudiences: [...current, audienceId] });
    }
  };

  return (
    <div className="space-y-5">
      <label className="block text-sm font-medium text-charcoal">
        Audience Targeting
      </label>

      {/* Age Range */}
      <div>
        <label className="block text-xs font-medium text-stone mb-2">Age Range</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              min={13}
              max={65}
              value={value.ageMin}
              onChange={(e) =>
                update({ ageMin: Math.max(13, Math.min(parseInt(e.target.value) || 13, value.ageMax)) })
              }
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border bg-cream-warm transition-all duration-200 text-center',
                'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                'border-stone/20 hover:border-stone/40 text-sm'
              )}
            />
            <p className="text-[10px] text-stone text-center mt-0.5">Min age</p>
          </div>
          <span className="text-stone text-sm font-medium mt-[-16px]">to</span>
          <div className="flex-1">
            <input
              type="number"
              min={13}
              max={65}
              value={value.ageMax}
              onChange={(e) =>
                update({ ageMax: Math.max(value.ageMin, Math.min(parseInt(e.target.value) || 65, 65)) })
              }
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border bg-cream-warm transition-all duration-200 text-center',
                'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
                'border-stone/20 hover:border-stone/40 text-sm'
              )}
            />
            <p className="text-[10px] text-stone text-center mt-0.5">Max age</p>
          </div>
        </div>
      </div>

      {/* Gender Selection */}
      <div>
        <label className="block text-xs font-medium text-stone mb-2">Gender</label>
        <div className="flex gap-2">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ gender: opt.value })}
              className={cn(
                'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                value.gender === opt.value
                  ? 'border-teal bg-teal/5 text-teal ring-1 ring-teal/20'
                  : 'border-stone/20 bg-cream-warm text-stone hover:border-stone/40'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div>
        <label className="block text-xs font-medium text-stone mb-2">Locations</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLocation();
              }
            }}
            placeholder="e.g., South Africa, Cape Town"
            className={cn(
              'flex-1 px-4 py-2.5 rounded-xl border bg-cream-warm transition-all duration-200 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'placeholder:text-stone/60 border-stone/20 hover:border-stone/40'
            )}
          />
          <button
            type="button"
            onClick={addLocation}
            disabled={!locationInput.trim()}
            className={cn(
              'px-3 py-2.5 rounded-xl border border-teal/20 bg-teal/5 text-teal',
              'hover:bg-teal/10 transition-all duration-200',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        {value.locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {value.locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal/10 text-teal text-xs font-medium"
              >
                {loc}
                <button
                  type="button"
                  onClick={() => removeLocation(loc)}
                  className="hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interests */}
      <div>
        <label className="block text-xs font-medium text-stone mb-2">Interests</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addInterest();
              }
            }}
            placeholder="e.g., Fitness, Technology, Travel"
            className={cn(
              'flex-1 px-4 py-2.5 rounded-xl border bg-cream-warm transition-all duration-200 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'placeholder:text-stone/60 border-stone/20 hover:border-stone/40'
            )}
          />
          <button
            type="button"
            onClick={addInterest}
            disabled={!interestInput.trim()}
            className={cn(
              'px-3 py-2.5 rounded-xl border border-teal/20 bg-teal/5 text-teal',
              'hover:bg-teal/10 transition-all duration-200',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        {value.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {value.interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Custom Audiences */}
      {audiences && audiences.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-stone mb-2">
            Custom Audiences
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {audiences.map((audience) => (
              <label
                key={audience.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200',
                  value.customAudiences.includes(audience.id)
                    ? 'border-teal/30 bg-teal/5'
                    : 'border-stone/10 hover:bg-cream-warm/20'
                )}
              >
                <input
                  type="checkbox"
                  checked={value.customAudiences.includes(audience.id)}
                  onChange={() => toggleAudience(audience.id)}
                  className="w-4 h-4 rounded border-stone/30 text-teal focus:ring-teal/20"
                />
                <span className="text-sm text-charcoal">{audience.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
