export interface ComplianceIssue {
  type: 'character_limit' | 'text_ratio' | 'prohibited_content' | 'special_category' | 'missing_field' | 'landing_page';
  severity: 'error' | 'warning';
  field: string;
  message: string;
  recommendation?: string;
}

// Prohibited language patterns (regex strings)
export const PROHIBITED_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  message: string;
  severity: 'error' | 'warning';
}> = [
  // Medical/health claims
  {
    pattern: /\b(cure[sd]?|heal[sd]?|treat[sd]?|remedy|miracle)\s+(for|your|any|all)\b/i,
    category: 'medical_claims',
    message: 'Unsubstantiated medical/health claims detected',
    severity: 'error',
  },
  {
    pattern: /\b(guaranteed?\s+(results?|weight\s+loss|cure)|100%\s+(effective|guaranteed?))\b/i,
    category: 'false_guarantees',
    message: 'Absolute guarantee claims are prohibited',
    severity: 'error',
  },
  // Sensational language
  {
    pattern: /\b(you won'?t believe|shocking|insane|unbelievable|mind[\s-]?blow(ing|n))\b/i,
    category: 'sensational',
    message: 'Sensational or clickbait language detected',
    severity: 'warning',
  },
  // Discriminatory content
  {
    pattern: /\b(you (are|look|seem) (fat|ugly|old|stupid|poor|sick))\b/i,
    category: 'discrimination',
    message: 'Potentially discriminatory or body-shaming language detected',
    severity: 'error',
  },
  // Personal attributes (prohibited in ads)
  {
    pattern: /\b(are you (struggling|suffering|dealing) with)\b/i,
    category: 'personal_attributes',
    message: 'Direct personal attribute assumptions may violate ad policies',
    severity: 'warning',
  },
  // Financial claims
  {
    pattern: /\b(get rich|make\s+\$?\d+[k,]?\d*\s*(per|a|every)\s*(day|week|month|hour)|easy money|financial freedom guaranteed)\b/i,
    category: 'financial_claims',
    message: 'Unrealistic financial claims detected',
    severity: 'error',
  },
  // Deceptive urgency
  {
    pattern: /\b(act now or (lose|miss)|last chance ever|closing (forever|permanently)|once[\s-]in[\s-]a[\s-]lifetime)\b/i,
    category: 'deceptive_urgency',
    message: 'Potentially deceptive urgency tactics detected',
    severity: 'warning',
  },
  // Illegal products/services
  {
    pattern: /\b(buy\s+(drugs?|weapons?|firearms?|steroids?|counterfeit))\b/i,
    category: 'illegal_products',
    message: 'References to prohibited products detected',
    severity: 'error',
  },
  // Before/after claims without context
  {
    pattern: /\b(before\s+and\s+after|transformation\s+results?)\b/i,
    category: 'before_after',
    message: 'Before/after claims may require disclaimers on some platforms',
    severity: 'warning',
  },
];

// Special ad category keywords (Meta)
export const SPECIAL_CATEGORY_KEYWORDS: Record<string, RegExp[]> = {
  housing: [
    /\b(apartment|rental|mortgage|real\s+estate|housing|home\s+loan|rent|lease|condo|property\s+for\s+(sale|rent))\b/i,
  ],
  employment: [
    /\b(job|hiring|career|employment|work\s+from\s+home|salary|apply\s+for\s+position|we'?re\s+hiring)\b/i,
  ],
  credit: [
    /\b(credit\s+(card|score|report|line)|loan|financing|apr|interest\s+rate|debt\s+consolidation|mortgage)\b/i,
  ],
  social_issues: [
    /\b(vote|election|political|ballot|candidate|campaign\s+for|referendum)\b/i,
  ],
};

/**
 * Run shared prohibited content checks on any text field
 */
export function checkProhibitedContent(text: string, fieldName: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  for (const rule of PROHIBITED_PATTERNS) {
    if (rule.pattern.test(text)) {
      issues.push({
        type: 'prohibited_content',
        severity: rule.severity,
        field: fieldName,
        message: rule.message,
        recommendation: `Review the ${fieldName} for ${rule.category} content and rephrase if needed.`,
      });
    }
  }

  return issues;
}

/**
 * Detect special ad category keywords in text
 */
export function detectSpecialCategoryKeywords(text: string): string[] {
  const detected: string[] = [];

  for (const [category, patterns] of Object.entries(SPECIAL_CATEGORY_KEYWORDS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        detected.push(category);
        break;
      }
    }
  }

  return detected;
}

/**
 * Check if a URL is accessible (HEAD request)
 */
export async function checkUrlAccessibility(url: string): Promise<{ accessible: boolean; statusCode?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    return {
      accessible: response.ok,
      statusCode: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      accessible: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
