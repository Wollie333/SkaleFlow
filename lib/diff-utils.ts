export interface DiffSegment {
  type: 'equal' | 'added' | 'removed';
  text: string;
}

/**
 * Word-level diff using a simple LCS (Longest Common Subsequence) algorithm.
 * Suitable for short brand variable text and content descriptions.
 */
export function wordDiff(oldText: string, newText: string): DiffSegment[] {
  if (oldText === newText) {
    return [{ type: 'equal', text: oldText }];
  }

  if (!oldText) {
    return [{ type: 'added', text: newText }];
  }

  if (!newText) {
    return [{ type: 'removed', text: oldText }];
  }

  const oldWords = tokenize(oldText);
  const newWords = tokenize(newText);

  // Build LCS table
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const segments: DiffSegment[] = [];
  let i = m;
  let j = n;

  const pending: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      pending.push({ type: 'equal', text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      pending.push({ type: 'added', text: newWords[j - 1] });
      j--;
    } else {
      pending.push({ type: 'removed', text: oldWords[i - 1] });
      i--;
    }
  }

  pending.reverse();

  // Merge consecutive segments of same type
  for (const seg of pending) {
    const last = segments[segments.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      segments.push({ ...seg });
    }
  }

  return segments;
}

/**
 * Tokenize text into words while preserving whitespace as part of the following word.
 * This allows the diff to show clean word-level changes.
 */
function tokenize(text: string): string[] {
  // Split on word boundaries, keeping whitespace attached to the word after it
  const tokens: string[] = [];
  const regex = /(\s*\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[1]);
  }
  // Handle trailing whitespace
  if (tokens.length === 0 && text.length > 0) {
    tokens.push(text);
  }
  return tokens;
}
