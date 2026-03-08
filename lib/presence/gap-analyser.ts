// Gap Analyser — Analyses profile screenshots using AI to identify gaps
// Sends screenshot to Claude for structured gap analysis

import { createServiceClient } from '@/lib/supabase/server';
import { readBrandOutputsForPresence, formatBrandContextForPresence } from './brand-variable-reader';
import type { PlatformKey } from '@/types/presence';
import { PLATFORM_CONFIGS } from '@/config/platform-configs';

export interface GapAnalysisResult {
  platformKey: PlatformKey;
  overallAssessment: string;
  score: number;
  findings: GapFinding[];
  recommendations: string[];
}

export interface GapFinding {
  area: string;
  severity: 'critical' | 'warning' | 'info';
  currentState: string;
  recommendation: string;
}

/**
 * Analyses a profile screenshot and returns structured gap analysis.
 * This is called by the API route that handles screenshot uploads.
 */
export async function analyzeProfileScreenshot(
  orgId: string,
  platformKey: PlatformKey,
  screenshotUrl: string
): Promise<GapAnalysisResult> {
  const brandOutputs = await readBrandOutputsForPresence(orgId);
  const platformConfig = PLATFORM_CONFIGS[platformKey];
  const brandContext = formatBrandContextForPresence(brandOutputs, platformKey);

  // Build the analysis prompt
  const prompt = buildAnalysisPrompt(platformKey, platformConfig?.name || platformKey, brandContext);

  // Use AI to analyse the screenshot
  try {
    const { resolveModel } = await import('@/lib/ai');
    const modelId = await resolveModel(orgId);

    // Dynamic import based on model provider
    const result = await callAIWithImage(modelId, prompt, screenshotUrl);
    return parseAnalysisResult(platformKey, result);
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return {
      platformKey,
      overallAssessment: 'Unable to analyse screenshot. Please try again.',
      score: 0,
      findings: [],
      recommendations: ['Upload a clearer screenshot and try again'],
    };
  }
}

function buildAnalysisPrompt(
  platformKey: PlatformKey,
  platformName: string,
  brandContext: string
): string {
  return `You are a ${platformName} profile optimisation expert. Analyse this profile screenshot and compare it against the brand guidelines below.

${brandContext}

## Your Task
1. Assess the current profile against brand guidelines
2. Identify gaps — what's missing, inconsistent, or suboptimal
3. Score the profile 0-100
4. Provide specific, actionable recommendations

## Response Format (YAML)
\`\`\`yaml
overall_assessment: "Brief 2-3 sentence assessment"
score: 72
findings:
  - area: "Headline"
    severity: "critical"
    current_state: "Generic headline that doesn't mention expertise"
    recommendation: "Replace with: [specific headline recommendation]"
  - area: "About Section"
    severity: "warning"
    current_state: "About section exists but doesn't use StoryBrand structure"
    recommendation: "Restructure to: Problem → Guide → Plan → Results → CTA"
recommendations:
  - "Top priority: Update headline to include category claim"
  - "Add featured section with lead magnet"
  - "Update banner image to include tagline"
\`\`\`

Severity levels:
- critical: Missing or severely misaligned element
- warning: Present but suboptimal
- info: Minor improvement opportunity

Be specific and actionable. Reference the brand variables when recommending copy.`;
}

async function callAIWithImage(
  modelId: string,
  prompt: string,
  imageUrl: string
): Promise<string> {
  // Use Anthropic directly for image analysis (Claude has best image understanding)
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();

  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const mediaType = imageResponse.headers.get('content-type') || 'image/png';

  const response = await client.messages.create({
    model: modelId.startsWith('claude') ? modelId : 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
              data: base64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

function parseAnalysisResult(platformKey: PlatformKey, aiResponse: string): GapAnalysisResult {
  // Extract YAML from response
  const yamlMatch = aiResponse.match(/```yaml\n([\s\S]*?)```/);
  const yamlContent = yamlMatch ? yamlMatch[1] : aiResponse;

  // Simple YAML parsing
  const lines = yamlContent.split('\n');
  let overallAssessment = '';
  let score = 0;
  const findings: GapFinding[] = [];
  const recommendations: string[] = [];

  let currentSection = '';
  let currentFinding: Partial<GapFinding> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('overall_assessment:')) {
      overallAssessment = trimmed.replace('overall_assessment:', '').trim().replace(/^["']|["']$/g, '');
    } else if (trimmed.startsWith('score:')) {
      score = parseInt(trimmed.replace('score:', '').trim(), 10) || 0;
    } else if (trimmed === 'findings:') {
      currentSection = 'findings';
    } else if (trimmed === 'recommendations:') {
      currentSection = 'recommendations';
      if (currentFinding && currentFinding.area) {
        findings.push(currentFinding as GapFinding);
        currentFinding = null;
      }
    } else if (currentSection === 'findings') {
      if (trimmed.startsWith('- area:')) {
        if (currentFinding && currentFinding.area) {
          findings.push(currentFinding as GapFinding);
        }
        currentFinding = { area: trimmed.replace('- area:', '').trim().replace(/^["']|["']$/g, '') };
      } else if (currentFinding) {
        if (trimmed.startsWith('severity:')) {
          currentFinding.severity = trimmed.replace('severity:', '').trim().replace(/^["']|["']$/g, '') as GapFinding['severity'];
        } else if (trimmed.startsWith('current_state:')) {
          currentFinding.currentState = trimmed.replace('current_state:', '').trim().replace(/^["']|["']$/g, '');
        } else if (trimmed.startsWith('recommendation:')) {
          currentFinding.recommendation = trimmed.replace('recommendation:', '').trim().replace(/^["']|["']$/g, '');
        }
      }
    } else if (currentSection === 'recommendations') {
      if (trimmed.startsWith('- ')) {
        recommendations.push(trimmed.substring(2).replace(/^["']|["']$/g, ''));
      }
    }
  }

  if (currentFinding && currentFinding.area) {
    findings.push(currentFinding as GapFinding);
  }

  return {
    platformKey,
    overallAssessment,
    score,
    findings,
    recommendations,
  };
}

/**
 * Save screenshot analysis result to the database.
 */
export async function saveScreenshotAudit(
  screenshotId: string,
  result: GapAnalysisResult
): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from('presence_profile_screenshots')
    .update({
      audit_result: result as unknown as Record<string, unknown>,
    })
    .eq('id', screenshotId);
}
