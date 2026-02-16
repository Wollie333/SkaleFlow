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

export const DISCOVERY_CALL_TEMPLATE: DefaultTemplate = {
  name: 'Discovery Call (SPIN)',
  description: 'Consultative discovery using SPIN Selling methodology. Ideal for first conversations with prospects.',
  callType: 'discovery',
  phases: [
    {
      id: 'rapport',
      name: 'Rapport & Agenda',
      description: 'Build connection and set expectations',
      durationMinutes: 3,
      questions: [
        'How did you hear about us?',
        'What prompted you to book this call today?',
      ],
      transitionTriggers: ['agenda confirmed', 'rapport established'],
      aiInstructions: 'Help the host establish a warm connection. Suggest personalised small talk based on CRM data. Confirm the agenda.',
    },
    {
      id: 'situation',
      name: 'Situation Questions',
      description: 'Understand their current state',
      durationMinutes: 5,
      questions: [
        'Tell me about your business — what do you do and who do you serve?',
        'How are you currently handling [relevant area]?',
        'What does your team look like for this?',
        'What tools/systems are you using today?',
      ],
      transitionTriggers: ['current situation understood', 'baseline established'],
      aiInstructions: 'Listen for specifics about their business model, team size, and current tools. Flag if they mention competitors.',
    },
    {
      id: 'problem',
      name: 'Problem Questions',
      description: 'Uncover pain points and challenges',
      durationMinutes: 5,
      questions: [
        'What challenges are you facing with [area]?',
        'How is that impacting your business?',
        'What have you tried so far to solve this?',
        'What happens if this doesn\'t get resolved?',
      ],
      transitionTriggers: ['pain points identified', 'problem articulated'],
      aiInstructions: 'Probe deeper on pain points. Listen for emotional language. Capture exact phrases they use — these are brand intelligence gold.',
    },
    {
      id: 'implication',
      name: 'Implication Questions',
      description: 'Amplify the cost of inaction',
      durationMinutes: 5,
      questions: [
        'What is this costing you in terms of time/money/opportunity?',
        'How does this affect your team morale?',
        'Where do you see this heading if nothing changes?',
      ],
      transitionTriggers: ['cost of inaction acknowledged', 'urgency felt'],
      aiInstructions: 'Help quantify the impact. If they mention revenue loss, probe for specific numbers. This builds urgency naturally.',
    },
    {
      id: 'need_payoff',
      name: 'Need-Payoff Questions',
      description: 'Let them articulate the desired solution',
      durationMinutes: 3,
      questions: [
        'If you could wave a magic wand, what would the ideal solution look like?',
        'What would it mean for your business if this was solved?',
        'How would you measure success?',
      ],
      transitionTriggers: ['desired outcome articulated', 'success criteria defined'],
      aiInstructions: 'Let them describe the solution. Their language here should map to your value propositions. Suggest offer trigger if their needs match.',
    },
    {
      id: 'bridge',
      name: 'Bridge to Solution',
      description: 'Position your offer as the natural next step',
      durationMinutes: 5,
      questions: [
        'Based on what you\'ve shared, here\'s how we might help...',
        'Does this align with what you\'re looking for?',
        'What questions do you have about the approach?',
      ],
      transitionTriggers: ['interest confirmed', 'questions addressed'],
      aiInstructions: 'Trigger the relevant offer based on their needs. Provide talking points from brand data. Handle objections with prepared responses.',
    },
    {
      id: 'next_steps',
      name: 'Next Steps & Close',
      description: 'Agree on clear next actions',
      durationMinutes: 4,
      questions: [
        'What would be the best next step for you?',
        'Is there anyone else who should be involved in this decision?',
        'When would you like to get started?',
      ],
      transitionTriggers: ['next steps confirmed', 'timeline agreed'],
      aiInstructions: 'Summarise key points. Confirm next steps clearly. Set expectations for follow-up. End with confidence.',
    },
  ],
  openingScript: 'Thanks for taking the time to chat today, [guest_name]. I\'m excited to learn more about your business and see if there\'s a way we can help. Before we dive in, let me quickly set the agenda — I\'ll ask a few questions to understand where you are, then we can explore whether our approach might be a fit. Sound good?',
  closingScript: 'This has been a great conversation. Let me quickly recap what we discussed: [key_points]. The next step would be [next_step]. I\'ll send you a follow-up email with everything we covered. Thanks again for your time, [guest_name]!',
  objectionBank: [
    { objection: 'It\'s too expensive', response: 'I understand budget is important. Let\'s look at the ROI — based on what you shared about [pain_point], the cost of not solving this is [implication]. Our clients typically see [result] within [timeframe].' },
    { objection: 'I need to think about it', response: 'Absolutely, it\'s a big decision. What specific aspects would you like to think through? I want to make sure you have all the information you need.' },
    { objection: 'We\'re looking at other options', response: 'Smart to explore your options. What are the key criteria you\'re evaluating? I\'d love to understand how we compare on the things that matter most to you.' },
    { objection: 'The timing isn\'t right', response: 'Timing is everything. When would be the right time? And in the meantime, what\'s the cost of waiting based on what you shared about [impact]?' },
    { objection: 'I need to talk to my partner/team', response: 'Of course! Would it be helpful if I joined a brief call with them? Or I can prepare a summary document that addresses their likely questions.' },
  ],
};

export const SALES_CALL_TEMPLATE: DefaultTemplate = {
  name: 'Sales Follow-up Call',
  description: 'Structured follow-up and closing call. Use after a discovery call.',
  callType: 'sales',
  phases: [
    {
      id: 'reconnect',
      name: 'Reconnect & Recap',
      description: 'Reconnect and confirm previous discussion',
      durationMinutes: 3,
      questions: ['How have things been since we last spoke?', 'Did anything change since our last conversation?'],
      transitionTriggers: ['recap confirmed'],
      aiInstructions: 'Reference previous call summary. Confirm pain points are still relevant.',
    },
    {
      id: 'address_concerns',
      name: 'Address Outstanding Concerns',
      description: 'Handle any objections or questions from last call',
      durationMinutes: 5,
      questions: ['What questions came up after our last call?', 'Was there anything you wanted more clarity on?'],
      transitionTriggers: ['concerns addressed'],
      aiInstructions: 'Use objection bank. Reference previous call action items.',
    },
    {
      id: 'present_solution',
      name: 'Present Tailored Solution',
      description: 'Walk through the specific offer',
      durationMinutes: 8,
      questions: ['Let me walk you through exactly how this would work for you...', 'Which of these deliverables is most important to you?'],
      transitionTriggers: ['solution presented', 'interest confirmed'],
      aiInstructions: 'Present the matched offer with full details. Emphasise ROI and value propositions.',
    },
    {
      id: 'handle_objections',
      name: 'Handle Objections',
      description: 'Address remaining hesitations',
      durationMinutes: 5,
      questions: ['What would need to be true for you to move forward?', 'Is there anything holding you back?'],
      transitionTriggers: ['objections handled'],
      aiInstructions: 'Use objection responses from the template and Brand Engine data. Stay consultative, not pushy.',
    },
    {
      id: 'close',
      name: 'Close',
      description: 'Ask for the commitment',
      durationMinutes: 3,
      questions: ['Are you ready to get started?', 'Which option works best for you?', 'When would you like to begin?'],
      transitionTriggers: ['decision made'],
      aiInstructions: 'Guide to a clear decision. If yes, confirm next steps. If not yet, set specific follow-up.',
    },
    {
      id: 'onboard_preview',
      name: 'Onboarding Preview',
      description: 'Set expectations for what happens next',
      durationMinutes: 3,
      questions: ['Here\'s what happens after you sign up...', 'Any questions about the process?'],
      transitionTriggers: ['expectations set'],
      aiInstructions: 'Build excitement about working together. Reduce buyer\'s remorse before it happens.',
    },
    {
      id: 'wrap_up',
      name: 'Wrap Up',
      description: 'Confirm everything and end positively',
      durationMinutes: 3,
      questions: ['Let me confirm everything we agreed on...', 'Is there anything else?'],
      transitionTriggers: ['call complete'],
      aiInstructions: 'Summarise commitments. Confirm timeline. End on a high note.',
    },
  ],
  openingScript: 'Great to see you again, [guest_name]! Last time we talked about [previous_key_points]. Today I want to address any questions you had and, if everything looks good, map out how we can get started.',
  closingScript: 'Fantastic! I\'m excited to get going. Here\'s exactly what happens next: [next_steps]. I\'ll send everything over in writing. Welcome aboard, [guest_name]!',
  objectionBank: [
    { objection: 'Can I get a discount?', response: 'Our pricing reflects the value and results we deliver. However, I can explore [payment_plan/alternative_tier] if that works better for your cash flow.' },
    { objection: 'I\'m not sure it will work for us', response: 'That\'s a fair concern. Let me share a case study from a similar business — [reference_case_study]. What specific outcome would make this a clear win for you?' },
  ],
};

export const ONBOARDING_TEMPLATE: DefaultTemplate = {
  name: 'Client Onboarding',
  description: 'Structured onboarding call for new clients.',
  callType: 'onboarding',
  phases: [
    {
      id: 'welcome',
      name: 'Welcome & Intro',
      description: 'Welcome the new client',
      durationMinutes: 3,
      questions: ['Welcome! How are you feeling about getting started?'],
      transitionTriggers: ['client comfortable'],
      aiInstructions: 'Be warm and excited. Reference their specific goals from discovery.',
    },
    {
      id: 'expectations',
      name: 'Set Expectations',
      description: 'Outline what the engagement looks like',
      durationMinutes: 5,
      questions: ['Here\'s what the first 30 days look like...', 'What does success look like for you in month one?'],
      transitionTriggers: ['expectations aligned'],
      aiInstructions: 'Be clear about timelines and deliverables. Manage expectations proactively.',
    },
    {
      id: 'gather_info',
      name: 'Gather Information',
      description: 'Collect what you need to get started',
      durationMinutes: 10,
      questions: ['I\'ll need access to [systems]...', 'Can you share your brand guidelines?', 'Who are the key contacts on your side?'],
      transitionTriggers: ['info gathered'],
      aiInstructions: 'Use a checklist approach. Note what\'s provided and what\'s still needed.',
    },
    {
      id: 'quick_wins',
      name: 'Identify Quick Wins',
      description: 'Find easy early victories',
      durationMinutes: 5,
      questions: ['Is there a quick win we can tackle this week?', 'What would make the biggest immediate impact?'],
      transitionTriggers: ['quick wins identified'],
      aiInstructions: 'Look for low-hanging fruit that builds momentum and confidence.',
    },
    {
      id: 'communication',
      name: 'Communication Preferences',
      description: 'Agree on how you\'ll work together',
      durationMinutes: 3,
      questions: ['How do you prefer to communicate?', 'How often would you like updates?'],
      transitionTriggers: ['comm preferences set'],
      aiInstructions: 'Document preferences clearly for the CRM.',
    },
    {
      id: 'next_steps',
      name: 'Next Steps',
      description: 'Confirm immediate action items',
      durationMinutes: 4,
      questions: ['Here\'s what I\'ll do by [date]...', 'Here\'s what I need from you by [date]...'],
      transitionTriggers: ['action items confirmed'],
      aiInstructions: 'Be specific with dates and owners. Create clear accountability.',
    },
  ],
  openingScript: 'Welcome to the team, [guest_name]! I\'m thrilled to be working with you. Today we\'ll map out everything needed to hit the ground running.',
  closingScript: 'You\'re all set! I\'ll have [deliverable] ready by [date]. If anything comes up before then, just reach out. Excited to get started!',
  objectionBank: [],
};

export const MEETING_TEMPLATE: DefaultTemplate = {
  name: 'General Meeting',
  description: 'Lightweight framework for team or client meetings.',
  callType: 'meeting',
  phases: [
    {
      id: 'agenda',
      name: 'Agenda Review',
      description: 'Confirm meeting purpose and agenda',
      durationMinutes: 2,
      questions: ['Here\'s what I\'d like to cover today...', 'Anything you want to add to the agenda?'],
      transitionTriggers: ['agenda confirmed'],
      aiInstructions: 'Keep it brief. Confirm time allocation.',
    },
    {
      id: 'discussion',
      name: 'Discussion',
      description: 'Main discussion items',
      durationMinutes: 20,
      questions: [],
      transitionTriggers: ['topics covered'],
      aiInstructions: 'Track discussion points. Flag action items as they emerge. Keep time awareness.',
    },
    {
      id: 'decisions',
      name: 'Decisions & Actions',
      description: 'Confirm decisions and assign actions',
      durationMinutes: 5,
      questions: ['Let me recap the decisions we made...', 'Who owns each action item?'],
      transitionTriggers: ['decisions confirmed'],
      aiInstructions: 'Summarise all decisions and action items with clear owners and deadlines.',
    },
    {
      id: 'close',
      name: 'Close',
      description: 'Wrap up and set next meeting',
      durationMinutes: 3,
      questions: ['When should we meet next?', 'Anything else before we wrap?'],
      transitionTriggers: ['meeting complete'],
      aiInstructions: 'Confirm next meeting date. End efficiently.',
    },
  ],
  openingScript: 'Thanks everyone for joining. Let\'s jump right in — here\'s what we need to cover today.',
  closingScript: 'Great meeting. I\'ll send the notes with action items. Next check-in is [date].',
  objectionBank: [],
};

export const ALL_DEFAULT_TEMPLATES = [
  DISCOVERY_CALL_TEMPLATE,
  SALES_CALL_TEMPLATE,
  ONBOARDING_TEMPLATE,
  MEETING_TEMPLATE,
];
