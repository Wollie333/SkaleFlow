// ============================================================
// Style Learning Service
// Tracks user edits → extracts patterns → updates style profile
// Future generations use the style profile for personalization
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';

export interface StyleProfile {
  tone_adjustments: Record<string, number>;
  vocabulary_adds: string[];
  vocabulary_removes: string[];
  length_preferences: Record<string, string>;
  structural_patterns: Record<string, string>;
  style_summary: string | null;
  edit_count: number;
}

interface EditDiff {
  field: string;
  original: string;
  edited: string;
  change_type: 'shortened' | 'lengthened' | 'rewritten' | 'minor_edit';
}

/**
 * Record a user edit: compares original AI output with user's version.
 * Extracts patterns and updates the org's style profile.
 */
export async function recordUserEdit(
  supabase: SupabaseClient<Database>,
  orgId: string,
  postId: string,
  originalOutput: Record<string, unknown>,
  userEdited: Record<string, unknown>
): Promise<void> {
  // Build diffs for text fields
  const textFields = ['topic', 'hook', 'body', 'cta', 'caption'];
  const diffs: EditDiff[] = [];

  for (const field of textFields) {
    const original = String(originalOutput[field] || '');
    const edited = String(userEdited[field] || '');

    if (!original || !edited || original === edited) continue;

    const changeType = classifyChange(original, edited);
    diffs.push({ field, original, edited, change_type: changeType });
  }

  if (diffs.length === 0) return; // No meaningful edits

  // Get or create style profile
  const profile = await getOrCreateProfile(supabase, orgId);

  // Update edit samples (keep last 20)
  const samples = Array.isArray(profile.edit_samples) ? profile.edit_samples : [];
  const newSample = {
    post_id: postId,
    timestamp: new Date().toISOString(),
    diffs: diffs.map(d => ({
      field: d.field,
      original_length: d.original.length,
      edited_length: d.edited.length,
      change_type: d.change_type,
      // Store short snippets, not full text (to keep JSONB small)
      original_snippet: d.original.slice(0, 100),
      edited_snippet: d.edited.slice(0, 100),
    })),
  };

  const updatedSamples = [...samples.slice(-19), newSample];

  // Update length preferences from diffs
  const lengthPrefs = (profile.length_preferences || {}) as Record<string, string>;
  for (const diff of diffs) {
    if (diff.change_type === 'shortened') {
      lengthPrefs[diff.field] = 'shorter';
    } else if (diff.change_type === 'lengthened') {
      lengthPrefs[diff.field] = 'longer';
    }
  }

  // Extract vocabulary patterns
  const vocabAdds = new Set<string>(profile.vocabulary_adds || []);
  const vocabRemoves = new Set<string>(profile.vocabulary_removes || []);

  for (const diff of diffs) {
    const originalWords = new Set(diff.original.toLowerCase().split(/\s+/));
    const editedWords = new Set(diff.edited.toLowerCase().split(/\s+/));

    // Words added by user (appear in edited but not original)
    for (const word of editedWords) {
      if (!originalWords.has(word) && word.length > 3) {
        vocabAdds.add(word);
      }
    }
    // Words removed by user (appear in original but not edited)
    for (const word of originalWords) {
      if (!editedWords.has(word) && word.length > 3) {
        vocabRemoves.add(word);
      }
    }
  }

  // Keep vocab lists manageable (last 50 each)
  const vocabAddsArr = Array.from(vocabAdds).slice(-50);
  const vocabRemovesArr = Array.from(vocabRemoves).slice(-50);

  const newEditCount = (profile.edit_count || 0) + 1;

  await supabase
    .from('user_style_profiles')
    .update({
      edit_count: newEditCount,
      edit_samples: updatedSamples as unknown as Json,
      length_preferences: lengthPrefs as unknown as Json,
      vocabulary_adds: vocabAddsArr,
      vocabulary_removes: vocabRemovesArr,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);
}

/**
 * Get the style profile for an org (for use in generation prompts).
 */
export async function getStyleProfile(
  supabase: SupabaseClient<Database>,
  orgId: string
): Promise<StyleProfile | null> {
  const { data } = await supabase
    .from('user_style_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!data) return null;

  return {
    tone_adjustments: (data.tone_adjustments || {}) as Record<string, number>,
    vocabulary_adds: data.vocabulary_adds || [],
    vocabulary_removes: data.vocabulary_removes || [],
    length_preferences: (data.length_preferences || {}) as Record<string, string>,
    structural_patterns: (data.structural_patterns || {}) as Record<string, string>,
    style_summary: data.style_summary,
    edit_count: data.edit_count || 0,
  };
}

/**
 * Build a prompt section from the style profile for AI generation.
 */
export function buildStylePromptBlock(profile: StyleProfile): string {
  if (profile.edit_count < 3) return ''; // Not enough data to be useful

  const sections: string[] = [];
  sections.push('## User Style Preferences (learned from their edits)');

  // Natural language summary (best signal if available)
  if (profile.style_summary) {
    sections.push(profile.style_summary);
  }

  // Length preferences
  const lengthEntries = Object.entries(profile.length_preferences).filter(([, v]) => v);
  if (lengthEntries.length > 0) {
    sections.push('Length preferences:');
    for (const [field, pref] of lengthEntries) {
      sections.push(`- ${field}: user prefers ${pref}`);
    }
  }

  // Vocabulary
  if (profile.vocabulary_adds.length > 5) {
    sections.push(`Words this user likes: ${profile.vocabulary_adds.slice(-15).join(', ')}`);
  }
  if (profile.vocabulary_removes.length > 5) {
    sections.push(`Words to AVOID (user consistently removes these): ${profile.vocabulary_removes.slice(-15).join(', ')}`);
  }

  return sections.join('\n');
}

// ── Internal helpers ──

async function getOrCreateProfile(
  supabase: SupabaseClient<Database>,
  orgId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const { data } = await supabase
    .from('user_style_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (data) return data;

  // Create new profile
  const { data: created } = await supabase
    .from('user_style_profiles')
    .insert({
      organization_id: orgId,
      tone_adjustments: {} as unknown as Json,
      length_preferences: {} as unknown as Json,
      structural_patterns: {} as unknown as Json,
      edit_samples: [] as unknown as Json,
    })
    .select()
    .single();

  return created || {
    edit_samples: [],
    length_preferences: {},
    vocabulary_adds: [],
    vocabulary_removes: [],
    edit_count: 0,
  };
}

function classifyChange(original: string, edited: string): EditDiff['change_type'] {
  const lenRatio = edited.length / original.length;

  if (lenRatio < 0.7) return 'shortened';
  if (lenRatio > 1.3) return 'lengthened';

  // Check word-level similarity
  const origWords = original.toLowerCase().split(/\s+/);
  const editWords = edited.toLowerCase().split(/\s+/);
  const origSet = new Set(origWords);
  const commonCount = editWords.filter(w => origSet.has(w)).length;
  const similarity = commonCount / Math.max(origWords.length, editWords.length);

  if (similarity < 0.5) return 'rewritten';
  return 'minor_edit';
}
