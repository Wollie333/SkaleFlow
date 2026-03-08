// ============================================================
// V3 Content Engine — Brand Voice Learner
// Tracks user edits, extracts patterns, updates brand_voice_learned
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ---- Types ----

interface EditPattern {
  category: string;
  pattern: string;
  confidence: number;
  examples: string[];
  occurrences: number;
}

interface BrandVoiceLearnings {
  tone_preferences: string[];
  vocabulary_additions: string[];
  vocabulary_removals: string[];
  structure_patterns: string[];
  hook_preferences: string[];
  cta_patterns: string[];
  edit_patterns: EditPattern[];
  last_updated: string;
  total_edits_analyzed: number;
}

// ---- Main functions ----

/**
 * Analyze user edits on AI-generated content to extract brand voice patterns.
 * Call this after a post is edited and saved.
 */
export async function learnFromEdit(
  supabase: SupabaseClient,
  organizationId: string,
  postId: string,
  originalContent: {
    hook: string | null;
    body: string | null;
    cta: string | null;
    caption: string | null;
  },
  editedContent: {
    hook: string | null;
    body: string | null;
    cta: string | null;
    caption: string | null;
  }
): Promise<void> {
  // Get current learnings
  const { data: org } = await supabase
    .from('organizations')
    .select('brand_voice_learned')
    .eq('id', organizationId)
    .single();

  const learnings: BrandVoiceLearnings = (org?.brand_voice_learned as BrandVoiceLearnings) || {
    tone_preferences: [],
    vocabulary_additions: [],
    vocabulary_removals: [],
    structure_patterns: [],
    hook_preferences: [],
    cta_patterns: [],
    edit_patterns: [],
    last_updated: '',
    total_edits_analyzed: 0,
  };

  let hasChanges = false;

  // Analyze hook edits
  if (originalContent.hook && editedContent.hook && originalContent.hook !== editedContent.hook) {
    const hookPattern = extractHookPattern(editedContent.hook);
    if (hookPattern && !learnings.hook_preferences.includes(hookPattern)) {
      learnings.hook_preferences.push(hookPattern);
      if (learnings.hook_preferences.length > 10) learnings.hook_preferences.shift();
      hasChanges = true;
    }
  }

  // Analyze body edits
  if (originalContent.body && editedContent.body && originalContent.body !== editedContent.body) {
    const { additions, removals } = diffWords(originalContent.body, editedContent.body);

    // Track vocabulary preferences
    for (const word of additions) {
      if (word.length > 3 && !learnings.vocabulary_additions.includes(word)) {
        learnings.vocabulary_additions.push(word);
        if (learnings.vocabulary_additions.length > 50) learnings.vocabulary_additions.shift();
        hasChanges = true;
      }
    }
    for (const word of removals) {
      if (word.length > 3 && !learnings.vocabulary_removals.includes(word)) {
        learnings.vocabulary_removals.push(word);
        if (learnings.vocabulary_removals.length > 50) learnings.vocabulary_removals.shift();
        hasChanges = true;
      }
    }

    // Detect tone shift
    const toneShift = detectToneShift(originalContent.body, editedContent.body);
    if (toneShift && !learnings.tone_preferences.includes(toneShift)) {
      learnings.tone_preferences.push(toneShift);
      if (learnings.tone_preferences.length > 10) learnings.tone_preferences.shift();
      hasChanges = true;
    }

    // Detect structure patterns
    const structure = detectStructurePattern(editedContent.body);
    if (structure && !learnings.structure_patterns.includes(structure)) {
      learnings.structure_patterns.push(structure);
      if (learnings.structure_patterns.length > 10) learnings.structure_patterns.shift();
      hasChanges = true;
    }
  }

  // Analyze CTA edits
  if (originalContent.cta && editedContent.cta && originalContent.cta !== editedContent.cta) {
    const ctaPattern = extractCtaPattern(editedContent.cta);
    if (ctaPattern && !learnings.cta_patterns.includes(ctaPattern)) {
      learnings.cta_patterns.push(ctaPattern);
      if (learnings.cta_patterns.length > 10) learnings.cta_patterns.shift();
      hasChanges = true;
    }
  }

  if (hasChanges) {
    learnings.total_edits_analyzed++;
    learnings.last_updated = new Date().toISOString();

    await supabase
      .from('organizations')
      .update({ brand_voice_learned: learnings as unknown as Record<string, unknown> })
      .eq('id', organizationId);
  }
}

/**
 * Get the brand voice learnings for injection into generation prompts.
 */
export async function getBrandVoiceLearnings(
  supabase: SupabaseClient,
  organizationId: string
): Promise<string> {
  const { data: org } = await supabase
    .from('organizations')
    .select('brand_voice_learned')
    .eq('id', organizationId)
    .single();

  const learnings = org?.brand_voice_learned as BrandVoiceLearnings | null;
  if (!learnings || learnings.total_edits_analyzed < 3) return '';

  const parts: string[] = [];

  if (learnings.tone_preferences.length > 0) {
    parts.push(`Tone preferences: ${learnings.tone_preferences.join(', ')}`);
  }
  if (learnings.vocabulary_additions.length > 0) {
    parts.push(`Preferred vocabulary: ${learnings.vocabulary_additions.slice(-15).join(', ')}`);
  }
  if (learnings.vocabulary_removals.length > 0) {
    parts.push(`Avoid these words: ${learnings.vocabulary_removals.slice(-15).join(', ')}`);
  }
  if (learnings.hook_preferences.length > 0) {
    parts.push(`Hook style preferences: ${learnings.hook_preferences.join('; ')}`);
  }
  if (learnings.cta_patterns.length > 0) {
    parts.push(`CTA style: ${learnings.cta_patterns.join('; ')}`);
  }
  if (learnings.structure_patterns.length > 0) {
    parts.push(`Content structure preferences: ${learnings.structure_patterns.join('; ')}`);
  }

  if (parts.length === 0) return '';

  return `\n\n## Brand Voice Learnings (from ${learnings.total_edits_analyzed} user edits)\n${parts.join('\n')}`;
}

// ---- Analysis helpers ----

function extractHookPattern(hook: string): string | null {
  if (hook.endsWith('?')) return 'question-style hooks';
  if (hook.startsWith('"')) return 'quote-style hooks';
  if (/^\d/.test(hook)) return 'number-led hooks';
  if (/^(stop|don't|never|quit)/i.test(hook)) return 'contrarian/negative hooks';
  if (/^(how|what|why|when)/i.test(hook)) return 'how-to hooks';
  if (/^(i |we |my )/i.test(hook)) return 'personal story hooks';
  return null;
}

function extractCtaPattern(cta: string): string | null {
  const lower = cta.toLowerCase();
  if (lower.includes('dm') || lower.includes('message')) return 'DM-based CTAs';
  if (lower.includes('link') || lower.includes('bio')) return 'link-in-bio CTAs';
  if (lower.includes('comment')) return 'comment-based CTAs';
  if (lower.includes('save') || lower.includes('bookmark')) return 'save-for-later CTAs';
  if (lower.includes('share')) return 'share CTAs';
  if (lower.includes('follow')) return 'follow CTAs';
  return null;
}

function detectToneShift(original: string, edited: string): string | null {
  const origLen = original.length;
  const editLen = edited.length;

  // Shorter = more concise preference
  if (editLen < origLen * 0.7) return 'prefers concise writing';
  if (editLen > origLen * 1.3) return 'prefers detailed explanations';

  // Emoji usage
  const origEmojis = (original.match(/[\u{1F600}-\u{1F9FF}]/gu) || []).length;
  const editEmojis = (edited.match(/[\u{1F600}-\u{1F9FF}]/gu) || []).length;
  if (editEmojis > origEmojis + 2) return 'adds more emojis';
  if (editEmojis < origEmojis - 2) return 'removes emojis';

  // Sentence length
  const origSentences = original.split(/[.!?]+/).filter(s => s.trim());
  const editSentences = edited.split(/[.!?]+/).filter(s => s.trim());
  const origAvgLen = origSentences.reduce((s, v) => s + v.length, 0) / (origSentences.length || 1);
  const editAvgLen = editSentences.reduce((s, v) => s + v.length, 0) / (editSentences.length || 1);
  if (editAvgLen < origAvgLen * 0.6) return 'prefers shorter sentences';

  return null;
}

function detectStructurePattern(body: string): string | null {
  const lines = body.split('\n').filter(l => l.trim());

  // Check for bullet points
  const bulletLines = lines.filter(l => /^[-•*▸→]\s/.test(l.trim()));
  if (bulletLines.length >= 3) return 'uses bullet point lists';

  // Check for numbered lists
  const numberedLines = lines.filter(l => /^\d+[\.\)]\s/.test(l.trim()));
  if (numberedLines.length >= 3) return 'uses numbered lists';

  // Check for line breaks as separators
  if (lines.length > 6 && lines.some(l => l.trim().length < 5)) return 'uses line breaks for emphasis';

  // Check for all caps
  const capsLines = lines.filter(l => l.toUpperCase() === l && l.length > 5);
  if (capsLines.length >= 1) return 'uses ALL CAPS for emphasis';

  return null;
}

function diffWords(original: string, edited: string): { additions: string[]; removals: string[] } {
  const origWords = new Set(original.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const editWords = new Set(edited.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  const additions: string[] = [];
  const removals: string[] = [];

  editWords.forEach(w => {
    if (!origWords.has(w)) additions.push(w);
  });
  origWords.forEach(w => {
    if (!editWords.has(w)) removals.push(w);
  });

  return { additions: additions.slice(0, 10), removals: removals.slice(0, 10) };
}
