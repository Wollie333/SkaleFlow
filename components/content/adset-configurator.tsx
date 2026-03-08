'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PLATFORM_DEFAULTS,
  AGGRESSIVENESS_TIERS,
  type SocialChannel,
  type Aggressiveness,
  type PlatformConfig,
} from '@/config/platform-defaults';
import { CONTENT_TYPES, type ContentTypeId, ALL_CONTENT_TYPE_IDS } from '@/config/content-types';
import type { ContentTypeRatio } from '@/config/campaign-objectives';

// ---- Types ----

export interface AdSetConfig {
  channel: SocialChannel;
  aggressiveness: Aggressiveness;
  contentTypeRatios: ContentTypeRatio;
  customSchedule: Record<string, string[]> | null;
}

interface AdSetConfiguratorProps {
  adset: AdSetConfig;
  objectiveDefaultRatio: ContentTypeRatio;
  onChange: (updated: AdSetConfig) => void;
  onRemove: () => void;
}

// ---- Helpers ----

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const TIER_ORDER: Aggressiveness[] = ['focused', 'committed', 'aggressive'];

function ratioToArray(ratio: ContentTypeRatio): number[] {
  return [ratio.type_1, ratio.type_2, ratio.type_3, ratio.type_4, ratio.type_5, ratio.type_6, ratio.type_7];
}

function arrayToRatio(arr: number[]): ContentTypeRatio {
  return { type_1: arr[0], type_2: arr[1], type_3: arr[2], type_4: arr[3], type_5: arr[4], type_6: arr[5], type_7: arr[6] };
}

// ---- Component ----

export function AdSetConfigurator({ adset, objectiveDefaultRatio, onChange, onRemove }: AdSetConfiguratorProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showRatios, setShowRatios] = useState(false);

  const platform = PLATFORM_DEFAULTS[adset.channel];
  const tierConfig = AGGRESSIVENESS_TIERS[adset.aggressiveness];
  const schedule = adset.customSchedule || platform.defaultSchedule;

  function setAggressiveness(tier: Aggressiveness) {
    onChange({ ...adset, aggressiveness: tier });
  }

  function resetRatios() {
    onChange({ ...adset, contentTypeRatios: objectiveDefaultRatio });
  }

  function updateRatio(typeIndex: number, value: number) {
    const arr = ratioToArray(adset.contentTypeRatios);
    arr[typeIndex] = Math.max(0, Math.min(100, value));

    // Normalize to 100%
    const total = arr.reduce((s, v) => s + v, 0);
    if (total > 0 && total !== 100) {
      const scale = 100 / total;
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.round(arr[i] * scale);
      }
      // Fix rounding
      const diff = 100 - arr.reduce((s, v) => s + v, 0);
      if (diff !== 0) {
        const maxIdx = arr.indexOf(Math.max(...arr));
        arr[maxIdx] += diff;
      }
    }

    onChange({ ...adset, contentTypeRatios: arrayToRatio(arr) });
  }

  function toggleScheduleDay(day: string) {
    const current = { ...schedule };
    if (current[day]) {
      delete current[day];
    } else {
      current[day] = ['09:00'];
    }
    onChange({ ...adset, customSchedule: current });
  }

  function addTimeSlot(day: string) {
    const current = { ...schedule };
    const times = [...(current[day] || [])];
    times.push('12:00');
    current[day] = times;
    onChange({ ...adset, customSchedule: current });
  }

  function removeTimeSlot(day: string, idx: number) {
    const current = { ...schedule };
    const times = [...(current[day] || [])];
    times.splice(idx, 1);
    if (times.length === 0) {
      delete current[day];
    } else {
      current[day] = times;
    }
    onChange({ ...adset, customSchedule: current });
  }

  function updateTimeSlot(day: string, idx: number, time: string) {
    const current = { ...schedule };
    const times = [...(current[day] || [])];
    times[idx] = time;
    current[day] = times;
    onChange({ ...adset, customSchedule: current });
  }

  const ratioArr = ratioToArray(adset.contentTypeRatios);
  const ratioTotal = ratioArr.reduce((s, v) => s + v, 0);

  return (
    <Card className="relative">
      <CardContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal/10 rounded-lg flex items-center justify-center">
              <span className="text-teal text-sm font-bold">{platform.label[0]}</span>
            </div>
            <div>
              <h3 className="text-heading-sm text-charcoal">{platform.label}</h3>
              <p className="text-xs text-stone">
                {tierConfig.postsPerWeek} posts/week · Max {platform.limits.maxPerDay}/day
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="text-stone/40 hover:text-red-400 transition-colors text-sm"
          >
            Remove
          </button>
        </div>

        {/* Aggressiveness Tier Selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-stone uppercase tracking-wider mb-2 block">
            Posting Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIER_ORDER.map(tier => {
              const config = AGGRESSIVENESS_TIERS[tier];
              const isActive = adset.aggressiveness === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setAggressiveness(tier)}
                  className={`px-3 py-2 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'border-teal bg-teal/5 text-charcoal'
                      : 'border-stone/10 bg-stone/5 text-stone hover:border-stone/20'
                  }`}
                >
                  <div className="text-sm font-medium">{config.label}</div>
                  <div className="text-xs opacity-70">{config.postsPerWeek}/wk</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Type Ratios */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowRatios(!showRatios)}
              className="text-xs font-medium text-stone uppercase tracking-wider flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showRatios ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6 4l8 6-8 6V4z" />
              </svg>
              Content Type Ratios
              {ratioTotal !== 100 && (
                <span className="text-red-400 ml-1">({ratioTotal}%)</span>
              )}
            </button>
            <button
              onClick={resetRatios}
              className="text-xs text-teal hover:text-teal/80 transition-colors"
            >
              Reset to default
            </button>
          </div>

          {/* Ratio bar preview */}
          <div className="flex h-3 rounded-full overflow-hidden mb-1">
            {ratioArr.map((pct, i) => (
              pct > 0 ? (
                <div
                  key={i}
                  className="transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: TYPE_COLORS[i],
                  }}
                />
              ) : null
            ))}
          </div>

          {/* Expanded ratio sliders */}
          {showRatios && (
            <div className="mt-3 space-y-2">
              {ALL_CONTENT_TYPE_IDS.map((typeId, idx) => {
                const ct = CONTENT_TYPES[typeId];
                return (
                  <div key={typeId} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TYPE_COLORS[idx] }}
                    />
                    <span className="text-xs text-charcoal w-20 truncate">{ct.shortName}</span>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={ratioArr[idx]}
                      onChange={e => updateRatio(idx, parseInt(e.target.value))}
                      className="flex-1 accent-teal h-1"
                    />
                    <span className="text-xs text-stone w-8 text-right">{ratioArr[idx]}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Posting Schedule */}
        <div>
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="text-xs font-medium text-stone uppercase tracking-wider flex items-center gap-1 mb-2"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showSchedule ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6 4l8 6-8 6V4z" />
            </svg>
            Posting Schedule
          </button>

          {/* Day pills (always visible) */}
          <div className="flex gap-1 flex-wrap">
            {DAYS.map(day => {
              const isActive = !!schedule[day];
              const slotCount = schedule[day]?.length || 0;
              return (
                <button
                  key={day}
                  onClick={() => showSchedule ? toggleScheduleDay(day) : setShowSchedule(true)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    isActive
                      ? 'bg-teal/10 text-teal border border-teal/20'
                      : 'bg-stone/5 text-stone/40 border border-transparent'
                  }`}
                >
                  {DAY_LABELS[day]}
                  {slotCount > 1 && <span className="ml-0.5 text-[10px]">×{slotCount}</span>}
                </button>
              );
            })}
          </div>

          {/* Expanded schedule editor */}
          {showSchedule && (
            <div className="mt-3 space-y-2">
              {DAYS.filter(day => !!schedule[day]).map(day => (
                <div key={day} className="flex items-start gap-2">
                  <span className="text-xs text-stone w-10 pt-1">{DAY_LABELS[day]}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(schedule[day] || []).map((time, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <input
                          type="time"
                          value={time}
                          onChange={e => updateTimeSlot(day, idx, e.target.value)}
                          className="px-1.5 py-0.5 text-xs bg-stone/5 border border-stone/10 rounded text-charcoal"
                        />
                        <button
                          onClick={() => removeTimeSlot(day, idx)}
                          className="text-stone/30 hover:text-red-400 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addTimeSlot(day)}
                      className="px-1.5 py-0.5 text-xs text-teal/60 hover:text-teal border border-dashed border-teal/20 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supported formats */}
        <div className="mt-3 flex gap-1 flex-wrap">
          {platform.supportedFormats.map(fmt => (
            <span key={fmt} className="px-1.5 py-0.5 text-[10px] bg-stone/5 text-stone rounded capitalize">
              {fmt.replace('_', ' ')}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const TYPE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6'];
