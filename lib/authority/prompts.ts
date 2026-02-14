/**
 * AI prompt templates for Authority Engine press releases and pitch emails.
 */

export function buildPressReleasePrompt(params: {
  companyName: string;
  brandContext: string;
  storyAngle?: string;
  category: string;
  outlet?: string;
  additionalContext?: string;
}) {
  return `You are an expert PR copywriter. Write a professional press release for ${params.companyName}.

BRAND CONTEXT:
${params.brandContext}

DETAILS:
- Category: ${params.category}
${params.storyAngle ? `- Story Angle: ${params.storyAngle}` : ''}
${params.outlet ? `- Target Outlet: ${params.outlet}` : ''}
${params.additionalContext ? `- Additional Context: ${params.additionalContext}` : ''}

Write the press release following this structure:
1. **Headline** — Newsworthy, concise (under 100 chars)
2. **Subheadline** — Supporting detail (1 line)
3. **Dateline** — [City, Date]
4. **Lead Paragraph** — Who, What, When, Where, Why in 2-3 sentences
5. **Body** — 2-3 paragraphs expanding on the story with data, context, and impact
6. **Quote** — A quote from the founder/CEO (write this in their brand voice)
7. **Boilerplate** — "About [Company]" paragraph
8. **Contact** — Media contact placeholder

Use a professional, newsworthy tone. Avoid jargon and marketing speak.
Keep the total length under 600 words.

Return the complete press release text with clear section formatting.`;
}

export function buildPitchEmailPrompt(params: {
  companyName: string;
  brandContext: string;
  contactName: string;
  contactOutlet?: string;
  contactWarmth: string;
  storyAngle?: string;
  category: string;
  additionalContext?: string;
}) {
  const toneMap: Record<string, string> = {
    cold: 'Professional and credibility-focused. Lead with impressive stats or achievements. Be respectful of their time.',
    warm: 'Direct and conversational. Reference any previous interactions. Get to the point quickly.',
    hot: 'Familiar and enthusiastic. Use first names. Build on the established relationship.',
    active: 'Collaborative. Reference ongoing work together. Position as a natural next step.',
    published: 'Grateful and forward-looking. Thank them and pitch the next story.',
  };
  const toneGuide = toneMap[params.contactWarmth] || toneMap.cold;

  return `You are an expert PR strategist writing a pitch email for ${params.companyName}.

BRAND CONTEXT:
${params.brandContext}

PITCH DETAILS:
- Contact: ${params.contactName}${params.contactOutlet ? ` at ${params.contactOutlet}` : ''}
- Relationship warmth: ${params.contactWarmth}
- Category: ${params.category}
${params.storyAngle ? `- Story Angle: ${params.storyAngle}` : ''}
${params.additionalContext ? `- Context: ${params.additionalContext}` : ''}

TONE GUIDE (based on relationship warmth):
${toneGuide}

Write a concise pitch email with:
1. **Subject Line** — Compelling, under 60 chars
2. **Opening** — Hook relevant to the journalist's beat/outlet
3. **The Pitch** — 2-3 sentences on why this is newsworthy NOW
4. **The Angle** — What makes this story unique
5. **The Ask** — Clear CTA (interview, feature, quote)
6. **Sign-off** — Professional close

Keep it under 200 words total. Journalists are busy.
Format: Start with "Subject: ..." then the email body.`;
}
