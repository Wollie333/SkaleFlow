'use client';

import { useState } from 'react';
import { SparklesIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface PitchEmailGeneratorProps {
  organizationId: string;
  contactName: string;
  contactOutlet?: string | null;
  contactWarmth: string;
  storyAngle?: string | null;
  category: string;
}

export function PitchEmailGenerator({
  organizationId,
  contactName,
  contactOutlet,
  contactWarmth,
  storyAngle,
  category,
}: PitchEmailGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/authority/ai/pitch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          contactName,
          contactOutlet,
          contactWarmth,
          storyAngle,
          category,
          additionalContext: additionalContext || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.text);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] text-stone font-medium mb-0.5">Additional Context (optional)</label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={2}
          className="w-full px-2 py-1.5 border border-stone/15 rounded text-xs focus:ring-1 focus:ring-teal/30 focus:outline-none resize-none"
          placeholder="Any extra details for the pitch..."
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gold border border-gold/30 rounded-lg hover:bg-gold/5 transition-colors disabled:opacity-50"
      >
        <SparklesIcon className="w-3.5 h-3.5" />
        {generating ? 'Generating...' : 'Generate Pitch Email'}
      </button>

      {result && (
        <div className="relative">
          <div className="bg-cream-warm/40 rounded-lg p-3 text-xs text-charcoal whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {result}
          </div>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm border border-stone/10 hover:bg-cream-warm transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckIcon className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="w-3.5 h-3.5 text-stone" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
