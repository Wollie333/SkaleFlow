'use client';

import { useState } from 'react';
import { CONTENT_TYPES, ALL_CONTENT_TYPE_IDS, SPECTRUM, type ContentTypeId } from '@/config/content-types';

// ---- Types ----

interface ContentTypeExplainerProps {
  highlightTypes?: ContentTypeId[];
  onTypeClick?: (typeId: ContentTypeId) => void;
  compact?: boolean;
}

// ---- Constants ----

const TYPE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6'];

const SPECTRUM_POSITIONS: Record<string, number> = {
  left: 0,
  'center-left': 20,
  center: 42,
  'center-right': 64,
  right: 85,
};

// ---- Component ----

export function ContentTypeExplainer({ highlightTypes, onTypeClick, compact = false }: ContentTypeExplainerProps) {
  const [expandedType, setExpandedType] = useState<ContentTypeId | null>(null);

  function handleTypeClick(typeId: ContentTypeId) {
    if (onTypeClick) {
      onTypeClick(typeId);
    } else {
      setExpandedType(expandedType === typeId ? null : typeId);
    }
  }

  return (
    <div className="space-y-4">
      {/* Spectrum bar */}
      <div>
        <div className="flex justify-between text-[10px] text-stone/60 mb-1.5">
          <span>{SPECTRUM.left.label}</span>
          <span>{SPECTRUM.right.label}</span>
        </div>

        {/* Gradient spectrum */}
        <div className="relative h-8 rounded-lg overflow-hidden bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-blue-500/20">
          {ALL_CONTENT_TYPE_IDS.map((typeId, idx) => {
            const ct = CONTENT_TYPES[typeId];
            const position = SPECTRUM_POSITIONS[ct.spectrumPosition] ?? 50;
            const isHighlighted = !highlightTypes || highlightTypes.includes(typeId);
            const isExpanded = expandedType === typeId;

            return (
              <button
                key={typeId}
                onClick={() => handleTypeClick(typeId)}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all z-10 ${
                  isHighlighted ? 'opacity-100' : 'opacity-30'
                } ${isExpanded ? 'scale-125' : 'hover:scale-110'}`}
                style={{ left: `${position + (idx * 2)}%` }}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                  style={{ backgroundColor: TYPE_COLORS[idx] }}
                >
                  <span className="text-[9px] font-bold text-white">{typeId}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between text-[9px] text-stone/40 mt-1">
          <span>{SPECTRUM.left.description}</span>
          <span>{SPECTRUM.right.description}</span>
        </div>
      </div>

      {/* Type cards */}
      {!compact && (
        <div className="grid grid-cols-7 gap-1.5">
          {ALL_CONTENT_TYPE_IDS.map((typeId, idx) => {
            const ct = CONTENT_TYPES[typeId];
            const isHighlighted = !highlightTypes || highlightTypes.includes(typeId);
            const isExpanded = expandedType === typeId;

            return (
              <button
                key={typeId}
                onClick={() => handleTypeClick(typeId)}
                className={`text-left p-2 rounded-lg border transition-all ${
                  isExpanded
                    ? 'border-teal bg-teal/5 col-span-7 md:col-span-7'
                    : isHighlighted
                      ? 'border-stone/10 bg-white hover:border-stone/20'
                      : 'border-transparent bg-stone/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[idx] }}
                  />
                  <span className="text-[10px] font-semibold text-charcoal truncate">
                    T{typeId}
                  </span>
                </div>
                <p className="text-[9px] text-stone leading-tight truncate">
                  {ct.shortName}
                </p>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-charcoal font-medium">{ct.name}</p>
                    <p className="text-xs text-stone">{ct.description}</p>

                    <div>
                      <p className="text-[10px] text-stone/60 uppercase tracking-wider mb-1">Examples</p>
                      <ul className="space-y-0.5">
                        {ct.examples.map((ex, i) => (
                          <li key={i} className="text-xs text-stone italic">
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-stone/60 uppercase tracking-wider">Outcome</p>
                        <p className="text-xs text-charcoal">{ct.primaryOutcome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone/60 uppercase tracking-wider">Best Formats</p>
                        <div className="flex gap-1 mt-0.5">
                          {ct.bestFormats.map(fmt => (
                            <span
                              key={fmt}
                              className="px-1.5 py-0.5 text-[10px] bg-stone/5 text-stone rounded capitalize"
                            >
                              {fmt.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone/60 uppercase tracking-wider">Target</span>
                      <span className="text-xs text-teal capitalize">
                        {ct.audienceTarget.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Compact legend */}
      {compact && (
        <div className="flex flex-wrap gap-2">
          {ALL_CONTENT_TYPE_IDS.map((typeId, idx) => {
            const ct = CONTENT_TYPES[typeId];
            const isHighlighted = !highlightTypes || highlightTypes.includes(typeId);
            return (
              <div
                key={typeId}
                className={`flex items-center gap-1.5 ${isHighlighted ? 'opacity-100' : 'opacity-30'}`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
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
    </div>
  );
}
