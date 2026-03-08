'use client';

import { useState } from 'react';
import { CONTENT_TYPES, ALL_CONTENT_TYPE_IDS, type ContentTypeId } from '@/config/content-types';
import type { ContentTypeRatio } from '@/config/campaign-objectives';

// ---- Types ----

interface RatioAdjusterProps {
  ratio: ContentTypeRatio;
  onChange: (ratio: ContentTypeRatio) => void;
  defaultRatio?: ContentTypeRatio;
  compact?: boolean;
}

// ---- Helpers ----

const TYPE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6'];

function ratioToArray(r: ContentTypeRatio): number[] {
  return [r.type_1, r.type_2, r.type_3, r.type_4, r.type_5, r.type_6, r.type_7];
}

function arrayToRatio(arr: number[]): ContentTypeRatio {
  return { type_1: arr[0], type_2: arr[1], type_3: arr[2], type_4: arr[3], type_5: arr[4], type_6: arr[5], type_7: arr[6] };
}

function normalizeArray(arr: number[]): number[] {
  const total = arr.reduce((s, v) => s + v, 0);
  if (total === 0 || total === 100) return arr;
  const scale = 100 / total;
  const result = arr.map(v => Math.round(v * scale));
  const diff = 100 - result.reduce((s, v) => s + v, 0);
  if (diff !== 0) {
    const maxIdx = result.indexOf(Math.max(...result));
    result[maxIdx] += diff;
  }
  return result;
}

// ---- Component ----

export function RatioAdjuster({ ratio, onChange, defaultRatio, compact = false }: RatioAdjusterProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const values = ratioToArray(ratio);
  const total = values.reduce((s, v) => s + v, 0);

  function handleSliderChange(idx: number, newValue: number) {
    const arr = [...values];
    const oldValue = arr[idx];
    const diff = newValue - oldValue;
    arr[idx] = newValue;

    // Redistribute the difference proportionally among other non-zero types
    if (diff !== 0) {
      const otherIndices = arr.map((_, i) => i).filter(i => i !== idx && arr[i] > 0);
      if (otherIndices.length > 0) {
        const otherTotal = otherIndices.reduce((s, i) => s + values[i], 0);
        let remaining = -diff;
        for (const i of otherIndices) {
          const proportion = otherTotal > 0 ? values[i] / otherTotal : 1 / otherIndices.length;
          const adjustment = Math.round(remaining * proportion);
          arr[i] = Math.max(0, arr[i] + adjustment);
        }
      }
    }

    // Normalize to 100
    const normalized = normalizeArray(arr);
    onChange(arrayToRatio(normalized));
  }

  function handleReset() {
    if (defaultRatio) onChange(defaultRatio);
  }

  return (
    <div className="space-y-3">
      {/* Visual bar */}
      <div className="relative">
        <div className="flex h-6 rounded-lg overflow-hidden">
          {values.map((pct, i) =>
            pct > 0 ? (
              <div
                key={i}
                className="relative transition-all duration-200 flex items-center justify-center group"
                style={{
                  width: `${pct}%`,
                  backgroundColor: TYPE_COLORS[i],
                  minWidth: pct > 0 ? '16px' : '0',
                }}
              >
                {pct >= 8 && (
                  <span className="text-[10px] font-bold text-white/90">{pct}%</span>
                )}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="bg-dark text-cream text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                    {CONTENT_TYPES[(i + 1) as ContentTypeId].shortName}: {pct}%
                  </div>
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* Total indicator */}
        {total !== 100 && (
          <div className="absolute -right-1 -top-1">
            <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1 rounded">
              {total}%
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {ALL_CONTENT_TYPE_IDS.map((typeId, idx) => {
            const ct = CONTENT_TYPES[typeId];
            return (
              <div key={typeId} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[idx] }}
                />
                <span className="text-[10px] text-stone">
                  T{typeId} {ct.shortName}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Sliders */}
      <div className="space-y-1.5">
        {ALL_CONTENT_TYPE_IDS.map((typeId, idx) => {
          const ct = CONTENT_TYPES[typeId];
          const val = values[idx];
          return (
            <div key={typeId} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: TYPE_COLORS[idx] }}
              />
              <span className={`text-xs text-charcoal flex-shrink-0 ${compact ? 'w-16' : 'w-24'} truncate`}>
                {compact ? `T${typeId}` : ct.shortName}
              </span>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={val}
                onChange={e => handleSliderChange(idx, parseInt(e.target.value))}
                onMouseDown={() => setDragIndex(idx)}
                onMouseUp={() => setDragIndex(null)}
                className="flex-1 accent-teal h-1"
                style={{
                  accentColor: TYPE_COLORS[idx],
                }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={val}
                onChange={e => handleSliderChange(idx, parseInt(e.target.value) || 0)}
                className="w-12 text-xs text-right bg-stone/5 border border-stone/10 rounded px-1 py-0.5 text-charcoal"
              />
              <span className="text-xs text-stone/50">%</span>
            </div>
          );
        })}
      </div>

      {/* Reset button */}
      {defaultRatio && (
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="text-xs text-teal hover:text-teal/80 transition-colors"
          >
            Reset to objective default
          </button>
        </div>
      )}
    </div>
  );
}
