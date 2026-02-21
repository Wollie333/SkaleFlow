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

export const ALL_DEFAULT_TEMPLATES = [
  CLOSER_FRAMEWORK_TEMPLATE,
];
