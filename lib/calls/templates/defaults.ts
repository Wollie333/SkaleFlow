/**
 * Default call framework templates.
 * Each template has ordered phases with questions, transition triggers, and AI instructions.
 */

export interface TemplatePhase {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  questions: string[];
  transitionTriggers: string[];
  aiInstructions: string;
}

export interface DefaultTemplate {
  name: string;
  description: string;
  callType: string;
  phases: TemplatePhase[];
  openingScript: string;
  closingScript: string;
  objectionBank: Array<{ objection: string; response: string }>;
}

/**
 * Alex Hormozi's Closer Framework — the default sales call template.
 * Based on $100M Offers methodology: identify conviction, stack value, close on logic.
 */
export const CLOSER_FRAMEWORK_TEMPLATE: DefaultTemplate = {
  name: 'Closer Framework (Hormozi)',
  description: 'Alex Hormozi\'s proven CLOSER framework for high-ticket sales calls. Identify their dream outcome, label the problem, present an irresistible offer, and close with urgency.',
  callType: 'sales',
  phases: [
    {
      id: 'clarify',
      name: 'C — Clarify Why They\'re Here',
      description: 'Understand their reason for showing up. What triggered the call?',
      durationMinutes: 3,
      questions: [
        'So, what made you book this call today?',
        'What\'s going on in your business/life right now that made you reach out?',
        'What were you hoping to get out of this conversation?',
      ],
      transitionTriggers: ['reason for call articulated', 'initial motivation clear'],
      aiInstructions: 'Get them talking about WHY they showed up. Their motivation is the key to the entire close. Listen for emotional triggers and specific goals. Do NOT pitch yet.',
    },
    {
      id: 'label',
      name: 'L — Label the Problem',
      description: 'Restate their problem back to them clearly. Show you understand it better than they do.',
      durationMinutes: 5,
      questions: [
        'So if I\'m hearing you right, the core issue is [restate problem]. Is that accurate?',
        'How long has this been going on?',
        'What have you already tried to fix this?',
        'Why do you think those things didn\'t work?',
      ],
      transitionTriggers: ['problem confirmed', 'past failures acknowledged'],
      aiInstructions: 'Restate their problem in clearer, sharper language than they used. When you label it accurately, they feel understood — this builds massive trust. Dig into what they\'ve already tried and why it failed. This positions your solution as different.',
    },
    {
      id: 'overview',
      name: 'O — Overview Past Pain',
      description: 'Quantify the cost of the problem. Make inaction feel expensive.',
      durationMinutes: 5,
      questions: [
        'What has this problem cost you so far — in money, time, or missed opportunities?',
        'If nothing changes in the next 6-12 months, where does that leave you?',
        'On a scale of 1-10, how serious is this for you right now?',
      ],
      transitionTriggers: ['cost of inaction quantified', 'urgency established'],
      aiInstructions: 'Make them feel the weight of their problem. Use numbers when possible — "So that\'s roughly $X left on the table." If they rate it below 7, probe deeper. The pain has to be real enough to justify action TODAY.',
    },
    {
      id: 'sell',
      name: 'S — Sell the Vacation, Not the Plane Ride',
      description: 'Paint the dream outcome. Focus on where they\'ll be, not the features.',
      durationMinutes: 5,
      questions: [
        'If we could solve this completely, what would your business/life look like in 90 days?',
        'What would that be worth to you?',
        'What would change for you personally if this was handled?',
      ],
      transitionTriggers: ['dream outcome vivid', 'emotional buy-in established'],
      aiInstructions: 'Get them to describe their ideal future in vivid detail. The more specific and emotional, the better. Connect their dream outcome to what you deliver — but frame it as THEIR result, not your process. "So you\'d have [outcome] and [outcome] — that\'s exactly what we help people do."',
    },
    {
      id: 'explain',
      name: 'E — Explain Away Their Concerns',
      description: 'Handle objections by reframing, not arguing. Use their own logic.',
      durationMinutes: 5,
      questions: [
        'What concerns do you have about getting started?',
        'What would need to be true for this to be a no-brainer for you?',
        'Is it the investment, the timing, or something else?',
      ],
      transitionTriggers: ['objections surfaced', 'concerns reframed'],
      aiInstructions: 'Expect 3 main objections: money, time, and "need to think about it." For each, use their earlier answers against the objection: "You said this is costing you $X/month — the investment pays for itself in [timeframe]." Never argue. Reframe using their own words.',
    },
    {
      id: 'reinforce',
      name: 'R — Reinforce the Decision',
      description: 'Close with confidence. Make the next step feel inevitable.',
      durationMinutes: 4,
      questions: [
        'Based on everything we\'ve discussed, it sounds like this is exactly what you need. Would you agree?',
        'The only question is: do you want to start seeing results now, or keep [painful status quo]?',
        'Great — here\'s how we get started...',
      ],
      transitionTriggers: ['commitment obtained', 'next steps confirmed'],
      aiInstructions: 'This is not the time to be soft. Summarise: "You told me [problem], it\'s costing you [amount], and you want [dream outcome]. We do exactly that. The only thing standing between you and [result] is a decision." If they say yes, move fast — take payment or book onboarding immediately. Reinforce that they made the right call.',
    },
  ],
  openingScript: 'Hey [guest_name], thanks for jumping on. I\'ve got a few questions to make sure we\'re a good fit — and if we are, I\'ll show you exactly how we can help. If we\'re not, I\'ll tell you that too. Fair enough?',
  closingScript: 'Awesome, [guest_name]. You made a great decision. Here\'s what happens next: [next_steps]. I\'m going to send you everything we discussed right after this call. Welcome to the family — let\'s get you some results.',
  objectionBank: [
    {
      objection: 'I can\'t afford it',
      response: 'I totally get that. Let me ask you this — you said this problem is costing you [cost_of_inaction] per month. So the real question isn\'t whether you can afford to start — it\'s whether you can afford NOT to. We can also look at a payment plan that makes this comfortable.',
    },
    {
      objection: 'I need to think about it',
      response: 'Of course. What specifically do you need to think about? Is it the money, the fit, or something else? Because if we can address it now, you don\'t have to spend another week stuck in the same spot.',
    },
    {
      objection: 'I need to talk to my spouse/partner',
      response: 'I respect that — it\'s a big decision. What do you think they\'ll want to know? Because I can give you the answers right now so you can have that conversation tonight instead of dragging it out.',
    },
    {
      objection: 'The timing isn\'t right',
      response: 'I hear that a lot. But here\'s the thing — you told me this has been going on for [duration]. When IS the right time? Because waiting hasn\'t solved it yet. What if we could start small and ramp up when you\'re ready?',
    },
    {
      objection: 'I\'ve been burned before',
      response: 'I\'m sorry to hear that. What went wrong? [Listen.] That makes sense. Here\'s how we\'re different: [key_differentiator]. And honestly, if we don\'t deliver on [specific_promise], we have [guarantee/policy].',
    },
    {
      objection: 'Can I get a discount?',
      response: 'I appreciate you asking. Our price reflects the results we deliver — clients typically get [result] within [timeframe], which means the ROI is [X]. What I CAN do is structure the payment in a way that works for your cash flow.',
    },
  ],
};

/**
 * Brand Audit Call Template — guided brand audit collection.
 * Maps to the 8-section audit system. Copilot extracts data into audit fields.
 */
export const BRAND_AUDIT_TEMPLATE: DefaultTemplate = {
  name: 'Brand Audit',
  description: 'Comprehensive brand audit call. Walk through 8 sections to assess the prospect\'s current brand health — company overview, brand foundation, visual identity, messaging, digital presence, customer experience, competitive landscape, and goals.',
  callType: 'discovery',
  phases: [
    {
      id: 'company_overview',
      name: 'Company Overview',
      description: 'Understand the business basics — who they are, what they do, who they serve.',
      durationMinutes: 5,
      questions: [
        'Tell me about your business — what do you do?',
        'What industry are you in?',
        'How long have you been in business?',
        'What\'s your business model? (service-based, product, SaaS, etc.)',
        'Who is your target market?',
        'How big is your team?',
        'What\'s your approximate annual revenue range?',
        'What\'s your website URL?',
        'Which social media platforms are you active on?',
      ],
      transitionTriggers: ['business basics captured', 'target market identified'],
      aiInstructions: 'Capture the business fundamentals. Listen for specifics — industry, business model, target market. Get the website URL and active social channels. Keep it conversational, not interrogative.',
    },
    {
      id: 'brand_foundation',
      name: 'Brand Foundation',
      description: 'Assess the strategic foundation — mission, vision, values, personality, archetype.',
      durationMinutes: 10,
      questions: [
        'What is your mission? In simple terms, why does your business exist?',
        'Where do you see the business in 5-10 years? What\'s the vision?',
        'What are your core values? The 3-5 non-negotiables that guide everything.',
        'If your brand were a person, how would you describe their personality?',
        'What\'s your brand promise — what do customers always get from you?',
        'Do you know your brand archetype? (e.g. Hero, Sage, Creator, Rebel)',
        'What makes you genuinely different? What\'s your unique value proposition?',
      ],
      transitionTriggers: ['mission articulated', 'values clear', 'archetype discussed'],
      aiInstructions: 'This is the most important section. Probe deep on mission and values — vague answers like "quality" or "trust" need specifics. If they don\'t know their archetype, describe a few and let them pick. Their UVP should be specific and defensible, not generic.',
    },
    {
      id: 'visual_identity',
      name: 'Visual Identity',
      description: 'Evaluate their visual brand — logo, colors, typography, consistency.',
      durationMinutes: 5,
      questions: [
        'Do you have a professional logo? Are you happy with it?',
        'What are your brand colors? Primary and secondary.',
        'Do you have defined typography or fonts you use?',
        'Do you have brand guidelines documented?',
        'On a scale of 1-5, how consistent is your visual identity across all touchpoints?',
        'Any notes on what\'s working or not working visually?',
      ],
      transitionTriggers: ['visual assets assessed', 'consistency rated'],
      aiInstructions: 'Assess whether they have professional visual assets. Ask to see their logo if on video. Rate consistency honestly — most small businesses score 2-3. Note specific gaps (e.g. "no brand guidelines", "inconsistent colors across social").',
    },
    {
      id: 'messaging',
      name: 'Messaging',
      description: 'Evaluate their messaging — tagline, elevator pitch, key messages, tone, brand story.',
      durationMinutes: 8,
      questions: [
        'Do you have a tagline? What is it?',
        'Give me your 30-second elevator pitch — how do you explain what you do?',
        'What are the 3-5 key messages you want every customer to hear?',
        'How would you describe your tone of voice? (formal, casual, bold, etc.)',
        'What\'s your brand story? How did this business come to be?',
        'How consistent is your messaging across website, social, and conversations?',
      ],
      transitionTriggers: ['messaging clarity assessed', 'brand story captured'],
      aiInstructions: 'Listen for clarity and consistency. Can they articulate what they do in 30 seconds? If the elevator pitch is rambling, that\'s a finding. The brand story should have emotional resonance — capture it in their exact words.',
    },
    {
      id: 'digital_presence',
      name: 'Digital Presence',
      description: 'Audit their digital footprint — website, SEO, social, content, ads, email.',
      durationMinutes: 8,
      questions: [
        'How would you rate your website quality on a scale of 1-5?',
        'When was the last time you updated your website?',
        'How would you rate your SEO? Are you ranking for anything?',
        'Which social platforms are you active on?',
        'How\'s your social engagement — likes, comments, shares?',
        'Do you have a content strategy?',
        'Are you running any paid advertising?',
        'Are you doing email marketing?',
      ],
      transitionTriggers: ['digital channels mapped', 'gaps identified'],
      aiInstructions: 'Map every digital channel they use. Note what\'s missing — most businesses have major gaps here. Website quality and SEO are often the biggest opportunities. If they say "we post sometimes" on social, that\'s a 2/5.',
    },
    {
      id: 'customer_experience',
      name: 'Customer Experience',
      description: 'Understand their customer journey, feedback systems, reviews, and retention.',
      durationMinutes: 8,
      questions: [
        'Do you have a defined customer journey?',
        'Walk me through what happens from first contact to purchase.',
        'How do you collect customer feedback?',
        'Do you know your NPS score?',
        'What\'s your average review rating? How many reviews do you have?',
        'How do you handle complaints?',
        'What\'s your customer retention like? Any churn issues?',
      ],
      transitionTriggers: ['journey mapped', 'feedback loop assessed'],
      aiInstructions: 'Most businesses don\'t have a defined customer journey — that\'s a key finding. Ask about reviews and NPS. If they don\'t collect feedback, that\'s a major gap. Retention insights reveal the real health of the business.',
    },
    {
      id: 'competitive_landscape',
      name: 'Competitive Landscape',
      description: 'Map their competitive environment — competitors, advantages, threats, opportunities.',
      durationMinutes: 8,
      questions: [
        'Who are your top 3 competitors? What are their websites?',
        'What do they do well? What do they do poorly?',
        'What are your competitive advantages?',
        'How would you describe your market position?',
        'What industry trends are you seeing?',
        'What threats keep you up at night?',
        'Where do you see the biggest opportunities?',
      ],
      transitionTriggers: ['competitors identified', 'market position clear'],
      aiInstructions: 'Get specific competitor names and websites — these are gold for the audit report. Push on competitive advantages — "better service" isn\'t specific enough. What EXACTLY do they do better? Threats and opportunities reveal strategic awareness.',
    },
    {
      id: 'goals_challenges',
      name: 'Goals & Challenges',
      description: 'Close with their goals, biggest challenge, budget, and timeline.',
      durationMinutes: 8,
      questions: [
        'What are your short-term goals for the next 3-6 months?',
        'What are your long-term goals for the next 1-3 years?',
        'What\'s your single biggest challenge right now?',
        'Do you have a budget range in mind for brand/marketing investment?',
        'What\'s your timeline — when do you want to see results?',
        'Anything else I should know?',
      ],
      transitionTriggers: ['goals documented', 'budget discussed', 'timeline set'],
      aiInstructions: 'End strong — their goals and challenges frame the entire audit report. The "biggest challenge" answer is often the key to the proposal. Budget and timeline questions qualify them for next steps. Don\'t be afraid to ask directly.',
    },
  ],
  openingScript: 'Thanks for joining, [guest_name]. Today we\'re going to do a comprehensive brand audit — I\'ll walk through 8 areas of your brand to understand where you are, what\'s working, and where the biggest opportunities are. This usually takes about 60 minutes. Everything you share will go into a detailed audit report with specific recommendations. Ready to dive in?',
  closingScript: 'That was excellent, [guest_name]. I\'ve got everything I need to put together your brand audit report. Here\'s what happens next: I\'ll compile all of this into a detailed assessment with scores across 6 categories and a priority roadmap. You\'ll have it within [timeframe]. Any final questions before we wrap up?',
  objectionBank: [
    {
      objection: 'I don\'t have time for a full audit',
      response: 'I understand you\'re busy. The beauty of this is it\'s a one-time investment of 60 minutes that gives you a complete picture of your brand health. Without it, you\'re making decisions in the dark. Let\'s see how far we get — even partial data is valuable.',
    },
    {
      objection: 'We already know our brand needs work',
      response: 'That\'s actually great awareness. What the audit does is pinpoint EXACTLY what needs work and prioritise it. Knowing "we need to improve" vs. having a scored breakdown with a roadmap are very different starting points.',
    },
    {
      objection: 'I\'m not sure I want to share all this information',
      response: 'Completely understand. Everything shared here is confidential and used solely to help you. Think of it like a doctor\'s checkup — the more honest the answers, the better the diagnosis and prescription.',
    },
  ],
};

export const ALL_DEFAULT_TEMPLATES = [
  CLOSER_FRAMEWORK_TEMPLATE,
  BRAND_AUDIT_TEMPLATE,
];
