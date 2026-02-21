export interface FeaturePainPoint {
  icon: string;
  text: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

export interface BenefitCard {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturePageData {
  slug: string;
  title: string;
  metaDescription: string;
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  emotionSection: {
    painHeadline: string;
    painPoints: FeaturePainPoint[];
    empathyParagraph: string;
  };
  solutionIntro: string;
  logicHeadline: string;
  logicSection: FeatureCard[];
  benefitsHeadline: string;
  benefitsSection: BenefitCard[];
  proofSection: {
    stat: string;
    statLabel: string;
    quote: string;
    quoteAuthor: string;
  };
  ctaSection: {
    headline: string;
    subtitle: string;
  };
}

export const features: FeaturePageData[] = [
  // 1. Brand Strategy Engine
  {
    slug: 'brand-strategy-engine',
    title: 'Brand Strategy Engine | SkaleFlow',
    metaDescription: 'Build a brand strategy that actually works. SkaleFlow\'s AI-powered Brand Strategy Engine helps small businesses define their positioning, messaging, and competitive advantage.',
    heroLabel: 'Brand Strategy',
    heroTitle: 'Stop Guessing What Your Brand Should Say',
    heroSubtitle: 'You know your business is good. But every time you try to explain it, the words fall flat. Your brand strategy shouldn\'t live in your head — it should live in a system.',
    emotionSection: {
      painHeadline: 'You\'ve been winging your brand. That ends here.',
      painPoints: [
        { icon: 'puzzle', text: 'You\'ve rewritten your "About" page five times and it still doesn\'t feel right' },
        { icon: 'eye-slash', text: 'Competitors with worse products are getting more attention than you' },
        { icon: 'chat', text: 'Every time someone asks "What do you do?" you give a different answer' },
        { icon: 'clock', text: 'You\'ve spent months trying to figure out your brand — and you\'re still stuck' },
      ],
      empathyParagraph: 'It\'s not that you don\'t know your business. You know it better than anyone. The problem is turning that knowledge into clear, compelling positioning that makes people pay attention. That\'s not a creativity problem — it\'s a strategy problem.',
    },
    solutionIntro: 'What if your entire brand strategy — your positioning, your messaging, your competitive advantage — could be built in a guided 10-phase process with AI doing the heavy lifting?',
    logicHeadline: 'A strategy engine, not a guessing game.',
    logicSection: [
      { icon: 'compass', title: '10-Phase Strategy Builder', description: 'Walk through a structured process that extracts your brand DNA — from your origin story to your competitive moat.' },
      { icon: 'cpu', title: 'AI-Powered Analysis', description: 'Our AI analyses your inputs against proven frameworks to generate positioning, messaging, and strategy recommendations.' },
      { icon: 'document', title: 'Living Brand Variables', description: 'Every insight becomes a reusable brand variable that feeds into your content, campaigns, and communications.' },
      { icon: 'arrows', title: 'StoryBrand Framework', description: 'Built on the StoryBrand methodology — your customer is the hero, your brand is the guide.' },
      { icon: 'sparkles', title: 'Archetype Matching', description: 'Discover which of the 12 brand archetypes best represents your brand personality and voice.' },
      { icon: 'chart', title: 'Competitive Positioning', description: 'Map your position relative to competitors and find the whitespace where you can win.' },
    ],
    benefitsHeadline: 'Clarity in days, not months.',
    benefitsSection: [
      { icon: 'clock', title: 'Weeks of Strategy Work in Hours', description: 'What normally takes a brand strategist 4-6 weeks is compressed into a guided process you can complete in a day.' },
      { icon: 'target', title: 'Crystal-Clear Messaging', description: 'Never stumble over your elevator pitch again. Get messaging that resonates with your ideal customer.' },
      { icon: 'shield', title: 'Confidence in Every Decision', description: 'When your strategy is clear, every marketing decision becomes easier — from ad copy to pricing.' },
    ],
    proofSection: {
      stat: '10 phases',
      statLabel: 'of guided brand strategy — from brand DNA to competitive positioning',
      quote: 'Before SkaleFlow, my brand was just a logo and vibes. Now I have a strategy that guides every decision.',
      quoteAuthor: 'Founder, Health & Wellness Brand',
    },
    ctaSection: {
      headline: 'Ready to Build a Brand That Actually Means Something?',
      subtitle: 'Apply now and get a brand strategy that turns your expertise into a competitive advantage.',
    },
  },

  // 2. Brand Archetype System
  {
    slug: 'brand-archetype-system',
    title: 'Brand Archetype System | SkaleFlow',
    metaDescription: 'Discover your brand archetype and unlock a consistent personality that attracts your ideal customers. 12 proven archetypes mapped to your brand DNA.',
    heroLabel: 'Brand Archetypes',
    heroTitle: 'Your Brand Has a Personality Problem',
    heroSubtitle: 'One day you sound corporate. The next, casual. Your audience doesn\'t know who you are because you don\'t know who you are. Archetypes fix that.',
    emotionSection: {
      painHeadline: 'Your brand voice is all over the place. We\'ve seen it a hundred times.',
      painPoints: [
        { icon: 'masks', text: 'Your brand sounds different on every platform — professional here, casual there, confusing everywhere' },
        { icon: 'users', text: 'You attract the wrong clients because your brand personality doesn\'t filter for fit' },
        { icon: 'pencil', text: 'Writing content feels impossible because you don\'t have a clear brand voice' },
        { icon: 'mirror', text: 'Your competitors all sound the same — and so do you' },
      ],
      empathyParagraph: 'Brand inconsistency isn\'t a design problem. It\'s an identity problem. Without a clear personality framework, every piece of content becomes a blank canvas — and that\'s exhausting when you\'re running a business.',
    },
    solutionIntro: 'What if your brand had a defined personality — a voice, a tone, a worldview — that made every piece of content feel unmistakably yours?',
    logicHeadline: 'Twelve archetypes. One that\'s unmistakably you.',
    logicSection: [
      { icon: 'user-circle', title: '12 Proven Archetypes', description: 'From The Creator to The Outlaw — discover which archetype matches your brand\'s natural personality.' },
      { icon: 'cpu', title: 'AI-Matched Profiling', description: 'Our system analyses your brand inputs and matches you to the archetype that fits — not the one that sounds cool.' },
      { icon: 'document-text', title: 'Voice & Tone Guide', description: 'Get a complete voice guide: words to use, words to avoid, communication style, and emotional range.' },
      { icon: 'palette', title: 'Visual Personality Cues', description: 'Your archetype influences colour psychology, imagery style, and design direction.' },
    ],
    benefitsHeadline: 'When your personality clicks, everything else follows.',
    benefitsSection: [
      { icon: 'megaphone', title: 'Instant Brand Voice', description: 'Stop second-guessing how to write. Your archetype gives you a voice you can use immediately — across every channel.' },
      { icon: 'magnet', title: 'Attract the Right People', description: 'When your personality is clear, you naturally repel bad-fit clients and attract the ones you actually want.' },
      { icon: 'bolt', title: 'Faster Content Creation', description: 'Content becomes 3x faster when you\'re not reinventing your brand voice every time you sit down to write.' },
    ],
    proofSection: {
      stat: '12 archetypes',
      statLabel: 'each with ~24 personality attributes mapped to your brand',
      quote: 'Finding our archetype was like finding our brand\'s soul. Everything we create now has the same energy.',
      quoteAuthor: 'Founder, Creative Agency',
    },
    ctaSection: {
      headline: 'Ready to Discover Who Your Brand Really Is?',
      subtitle: 'Apply now and unlock a brand personality that makes your marketing effortless.',
    },
  },

  // 3. Brand Playbook Export
  {
    slug: 'brand-playbook-export',
    title: 'Brand Playbook & Guidelines Export | SkaleFlow',
    metaDescription: 'Generate a professional brand playbook with your strategy, visual identity, messaging guidelines, and design system. Export as a browsable guide or print-ready PDF.',
    heroLabel: 'Brand Playbook',
    heroTitle: 'Your Brand Guidelines Shouldn\'t Live in Your Head',
    heroSubtitle: 'Every time you brief a designer or onboard a team member, you explain everything from scratch. Your brand deserves a single source of truth.',
    emotionSection: {
      painHeadline: 'Your brand knowledge is trapped in your head. That\'s a problem.',
      painPoints: [
        { icon: 'folder', text: 'Your brand assets are scattered across Google Drive, Canva, and random email threads' },
        { icon: 'users', text: 'New team members take weeks to understand your brand because nothing is documented' },
        { icon: 'arrows', text: 'Freelancers and agencies deliver off-brand work because they don\'t have guidelines' },
        { icon: 'refresh', text: 'You keep re-explaining the same brand decisions to different people' },
      ],
      empathyParagraph: 'You\'ve done the hard work of figuring out your brand. But if that knowledge only exists in your head, it\'s not a brand system — it\'s a bottleneck. You shouldn\'t have to be in every conversation about how your brand should look, sound, and feel.',
    },
    solutionIntro: 'What if every brand decision you\'ve ever made was captured in a beautiful, shareable playbook — ready to hand to any designer, writer, or team member?',
    logicHeadline: 'Your brand, documented. No more re-explaining.',
    logicSection: [
      { icon: 'book-open', title: 'Auto-Generated Playbook', description: 'Your brand strategy phases automatically compile into a professional 13-section brand playbook.' },
      { icon: 'palette', title: 'Visual Identity System', description: 'Colour palettes with HEX & RGB values, typography scales, and component design guidelines.' },
      { icon: 'printer', title: 'Print-Ready Export', description: 'A4-formatted with proper page breaks, forced background colours, and professional layout.' },
      { icon: 'globe', title: 'Browsable Web Version', description: 'A styled HTML playbook that uses your actual brand colours and fonts — not a generic template.' },
      { icon: 'share', title: 'Shareable Link', description: 'Send your playbook link to any freelancer, agency, or team member for instant brand alignment.' },
    ],
    benefitsHeadline: 'Your brand, out of your head and into everyone\'s hands.',
    benefitsSection: [
      { icon: 'clock', title: 'Onboard Anyone in Minutes', description: 'New designers, writers, and partners get up to speed on your brand instantly — no meetings required.' },
      { icon: 'shield', title: 'Protect Brand Consistency', description: 'Every deliverable stays on-brand because everyone works from the same playbook.' },
      { icon: 'currency', title: 'Save Thousands on Branding', description: 'Professional brand guidelines typically cost R15,000-R50,000. Yours are generated automatically.' },
    ],
    proofSection: {
      stat: '13 sections',
      statLabel: 'of comprehensive brand guidelines — auto-generated from your strategy',
      quote: 'I sent the playbook to my designer and for the first time, they nailed it on the first try.',
      quoteAuthor: 'Founder, E-commerce Brand',
    },
    ctaSection: {
      headline: 'Ready to Document Your Brand Like a Pro?',
      subtitle: 'Apply now and get a professional brand playbook generated from your strategy in minutes.',
    },
  },

  // 4. AI Content Engine
  {
    slug: 'ai-content-engine',
    title: 'AI Content Engine | SkaleFlow',
    metaDescription: 'Generate on-brand content at scale with AI that knows your brand strategy, voice, and audience. Create weeks of content in minutes, not days.',
    heroLabel: 'Content Creation',
    heroTitle: 'Stop Staring at a Blank Screen',
    heroSubtitle: 'You know you need to post. But between running your business and trying to create content, something always gives. Usually it\'s the content.',
    emotionSection: {
      painHeadline: 'Content creation shouldn\'t feel like pulling teeth.',
      painPoints: [
        { icon: 'cursor', text: 'You open your laptop to create content and 45 minutes later you\'ve written nothing' },
        { icon: 'calendar', text: 'Your last Instagram post was three weeks ago and the guilt is constant' },
        { icon: 'cpu', text: 'Generic AI tools give you generic content that sounds like everyone else' },
        { icon: 'fire', text: 'You\'re burning out trying to be a CEO and a content creator at the same time' },
      ],
      empathyParagraph: 'Content creation shouldn\'t be this hard. You\'re not a content creator — you\'re a business owner. The problem isn\'t that you don\'t have ideas. It\'s that you don\'t have a system that turns your brand knowledge into ready-to-publish content.',
    },
    solutionIntro: 'What if you could generate an entire week of on-brand, strategy-aligned content in minutes — without losing your voice or sounding like a robot?',
    logicHeadline: 'AI that actually knows your brand. Not just any brand.',
    logicSection: [
      { icon: 'sparkles', title: 'Brand-Aware AI', description: 'Our AI doesn\'t just generate content — it uses your brand strategy, archetype, messaging, and voice to create content that sounds like you.' },
      { icon: 'squares', title: 'Multi-Format Generation', description: 'Generate posts for LinkedIn, Instagram, Facebook, Twitter, and TikTok — each formatted for the platform.' },
      { icon: 'funnel', title: 'StoryBrand-Aligned', description: 'Every piece maps to a stage in your customer\'s journey — from awareness to action.' },
      { icon: 'sliders', title: 'Customisable Variables', description: 'Choose which brand variables feed into generation — focus on product launches, thought leadership, or customer pain points.' },
      { icon: 'queue', title: 'Batch Generation', description: 'Generate 7-30 pieces at once with queue-based processing. Watch them appear in real-time.' },
      { icon: 'wand', title: 'Content Angles', description: 'Define your own content angles — educational, inspirational, behind-the-scenes — and the AI mixes them into your calendar.' },
    ],
    benefitsHeadline: 'More content. Less effort. Your voice intact.',
    benefitsSection: [
      { icon: 'clock', title: 'Hours Back Every Week', description: 'Generate a full week of content in under 10 minutes. Spend the rest of your time running your business.' },
      { icon: 'fingerprint', title: 'Always On-Brand', description: 'Every piece is built from your brand strategy — not generic prompts. Your audience will think you wrote it yourself.' },
      { icon: 'trending', title: 'Consistent Posting', description: 'Never miss a posting day again. Fill your calendar weeks in advance and stay visible to your audience.' },
    ],
    proofSection: {
      stat: '30 posts',
      statLabel: 'of on-brand content generated in a single batch — ready to review and publish',
      quote: 'I went from posting once a month to five times a week. My engagement tripled in 60 days.',
      quoteAuthor: 'Founder, Consulting Firm',
    },
    ctaSection: {
      headline: 'Ready to Never Struggle with Content Again?',
      subtitle: 'Apply now and let AI create content that actually sounds like your brand.',
    },
  },

  // 5. Content Calendar System
  {
    slug: 'content-calendar-system',
    title: 'Content Calendar Planning Tool | SkaleFlow',
    metaDescription: 'Plan and manage your content calendar with campaign-based scheduling, conflict detection, and multi-platform support. Never miss a posting day again.',
    heroLabel: 'Content Calendar',
    heroTitle: 'Your Content Shouldn\'t Be an Afterthought',
    heroSubtitle: 'Posting when you remember isn\'t a strategy. It\'s a recipe for inconsistency. Your audience notices when you disappear — even if they don\'t say it.',
    emotionSection: {
      painHeadline: 'Winging it week by week? We\'ve been there too.',
      painPoints: [
        { icon: 'calendar-x', text: 'You plan to post every day but by Wednesday you\'ve already fallen behind' },
        { icon: 'shuffle', text: 'Your content has no structure — it\'s random topics in random order with no strategy' },
        { icon: 'clipboard', text: 'You\'re juggling spreadsheets, notes apps, and Canva to manage your content' },
        { icon: 'eye', text: 'You can\'t see what\'s scheduled, what\'s drafted, and what\'s published in one view' },
      ],
      empathyParagraph: 'The founders who look effortlessly consistent on social media? They\'re not more creative than you. They have a system. A content calendar isn\'t about being rigid — it\'s about knowing what you\'re posting before you sit down to post.',
    },
    solutionIntro: 'What if you could see your entire content plan — across every platform, every campaign, every week — in one beautiful calendar that practically manages itself?',
    logicHeadline: 'One calendar. Every platform. Total control.',
    logicSection: [
      { icon: 'calendar', title: 'Campaign-Based Planning', description: 'Name your campaigns, set date ranges, and generate content that fits your marketing initiatives.' },
      { icon: 'clock', title: 'Smart Scheduling', description: 'Automatic conflict detection ensures you never double-book a time slot. 15-minute increments keep things organised.' },
      { icon: 'squares', title: 'Multi-Platform View', description: 'See what\'s going to LinkedIn, Instagram, Facebook, and more — all in one calendar.' },
      { icon: 'filter', title: 'Status Tracking', description: 'Every piece flows through draft → review → approved → published. Know exactly where everything stands.' },
      { icon: 'sparkles', title: 'AI-Powered Filling', description: 'Gaps in your calendar? Generate content to fill them in seconds — already aligned with your brand strategy.' },
    ],
    benefitsHeadline: 'Consistency without the constant hustle.',
    benefitsSection: [
      { icon: 'eye', title: 'Total Visibility', description: 'See your entire content pipeline at a glance. No more wondering what\'s scheduled for next week.' },
      { icon: 'check-circle', title: 'Effortless Consistency', description: 'When your calendar is full, showing up becomes automatic. Your audience gets the consistency they crave.' },
      { icon: 'brain', title: 'Strategic Content Flow', description: 'Content flows through your funnel intentionally — awareness at the top, conversion at the bottom.' },
    ],
    proofSection: {
      stat: '5 platforms',
      statLabel: 'managed from one calendar — with campaign-based scheduling and conflict detection',
      quote: 'I finally stopped panic-posting. My calendar is full two weeks in advance and I actually enjoy content day.',
      quoteAuthor: 'Founder, Fitness Brand',
    },
    ctaSection: {
      headline: 'Ready to Take Control of Your Content?',
      subtitle: 'Apply now and get a content calendar that keeps you consistent without the stress.',
    },
  },

  // 6. Content Approval Workflow
  {
    slug: 'content-approval-workflow',
    title: 'Content Approval Workflow | SkaleFlow',
    metaDescription: 'Streamline your content review process with role-based approvals, revision requests, and real-time notifications. Keep your team aligned and your content quality high.',
    heroLabel: 'Approval Workflow',
    heroTitle: 'Stop Approving Content Over WhatsApp',
    heroSubtitle: 'Screenshots in group chats. "Can you check this?" emails at 11pm. Lost feedback. Missed edits. Your content approval process is broken.',
    emotionSection: {
      painHeadline: 'If your approval process lives in a group chat, it\'s already broken.',
      painPoints: [
        { icon: 'chat', text: 'Content feedback is scattered across WhatsApp, email, and Slack — nothing is centralised' },
        { icon: 'clock', text: 'Content sits in limbo for days because no one knows it needs approval' },
        { icon: 'x-circle', text: 'Unapproved content goes live because the process is too slow' },
        { icon: 'arrows', text: 'Revision requests get lost and the same mistakes keep happening' },
      ],
      empathyParagraph: 'When you\'re a small team, it feels faster to just send a quick message. But that "quick" process costs you hours in miscommunication, rework, and quality issues. You need a system that\'s even faster than a WhatsApp message — but actually tracks everything.',
    },
    solutionIntro: 'What if every piece of content had a clear path from draft to published — with approvals, revisions, and notifications built right in?',
    logicHeadline: 'From draft to live — with guardrails, not bottlenecks.',
    logicSection: [
      { icon: 'check-badge', title: 'One-Click Approvals', description: 'Approve, request revisions, or reject content with a single click. No emails, no messages, no delays.' },
      { icon: 'bell', title: 'Real-Time Notifications', description: 'Creators get notified when content is approved or needs changes. Approvers get notified when content is ready for review.' },
      { icon: 'arrow-path', title: 'Revision Tracking', description: 'Request specific changes with feedback that stays attached to the content — no more lost comments.' },
      { icon: 'inbox', title: 'Approval Queue', description: 'A dedicated inbox shows everything waiting for your review. Nothing falls through the cracks.' },
      { icon: 'users', title: 'Role-Based Access', description: 'Creators create, approvers approve. Everyone sees exactly what they need to see.' },
    ],
    benefitsHeadline: 'Faster publishing. Fewer mistakes. Less stress.',
    benefitsSection: [
      { icon: 'bolt', title: 'Faster Publishing', description: 'Content moves from draft to published in hours, not days. No more bottlenecks waiting for approvals.' },
      { icon: 'shield', title: 'Quality Control', description: 'Nothing goes live without approval. Catch mistakes before your audience does.' },
      { icon: 'heart', title: 'Team Sanity', description: 'No more midnight approval requests. Everyone knows what needs attention and when.' },
    ],
    proofSection: {
      stat: '4 status stages',
      statLabel: 'with real-time notifications — draft, review, revision, approved',
      quote: 'We cut our content approval time from 3 days to 3 hours. And nothing slips through anymore.',
      quoteAuthor: 'Marketing Manager, SaaS Startup',
    },
    ctaSection: {
      headline: 'Ready to Fix Your Content Approval Process?',
      subtitle: 'Apply now and get a workflow that keeps your team aligned and your content quality high.',
    },
  },

  // 7. Sales Pipeline CRM
  {
    slug: 'sales-pipeline-crm',
    title: 'Sales Pipeline & CRM | SkaleFlow',
    metaDescription: 'Manage your sales pipeline with a visual kanban board, contact tracking, automated follow-ups, and deal management. Built for founders who sell.',
    heroLabel: 'Sales Pipeline',
    heroTitle: 'Leads Are Falling Through the Cracks',
    heroSubtitle: 'You get enquiries. People show interest. Then somehow, they disappear. Not because they lost interest — but because you lost track.',
    emotionSection: {
      painHeadline: 'You\'re losing deals you should be closing. Let\'s be honest about why.',
      painPoints: [
        { icon: 'inbox-stack', text: 'You have leads in your email, DMs, WhatsApp, and a spreadsheet you haven\'t updated in weeks' },
        { icon: 'clock', text: 'Hot leads go cold because you forgot to follow up within 24 hours' },
        { icon: 'chart-down', text: 'You have no idea how many leads you\'re actually converting — or why you\'re losing them' },
        { icon: 'currency', text: 'You know you\'re leaving money on the table but you can\'t see where' },
      ],
      empathyParagraph: 'You\'re not bad at sales. You\'re just trying to manage a pipeline in your head while running an entire business. No one can track 20 conversations across 5 platforms without dropping something. You need a system that remembers for you.',
    },
    solutionIntro: 'What if every lead had a home — a visual board where you could see exactly where they are, what they need, and what to do next?',
    logicHeadline: 'Every lead tracked. Every deal visible. Nothing slipping.',
    logicSection: [
      { icon: 'view-columns', title: 'Visual Kanban Board', description: 'Drag-and-drop contacts through your custom pipeline stages. See your entire sales process at a glance.' },
      { icon: 'user-plus', title: 'Contact Management', description: 'Store contact details, notes, tags, and communication history in one place.' },
      { icon: 'tag', title: 'Smart Tagging', description: 'Tag contacts by industry, lead source, deal size, or any custom category. Filter and segment instantly.' },
      { icon: 'envelope', title: 'Email Templates', description: 'Send professional follow-ups using pre-built templates — personalised with merge fields.' },
      { icon: 'chart-bar', title: 'Pipeline Analytics', description: 'Track conversion rates, average deal time, and revenue by stage. Know what\'s working.' },
      { icon: 'cog', title: 'Custom Stages', description: 'Build your pipeline the way you sell. Add, rename, and reorder stages to match your process.' },
    ],
    benefitsHeadline: 'Close more deals. Lose fewer leads.',
    benefitsSection: [
      { icon: 'currency', title: 'More Revenue', description: 'Stop losing deals to poor follow-up. A structured pipeline typically increases conversion by 25-40%.' },
      { icon: 'eye', title: 'Complete Visibility', description: 'See every deal, every contact, every interaction — in one view. No more guesswork.' },
      { icon: 'clock', title: 'Faster Follow-Up', description: 'Know instantly who needs attention. Never let a hot lead go cold again.' },
    ],
    proofSection: {
      stat: 'Kanban + automations',
      statLabel: 'built for founder-led businesses — not enterprise complexity',
      quote: 'I found R180K in deals I\'d completely forgotten about. They were just sitting there waiting for a follow-up.',
      quoteAuthor: 'Founder, Professional Services',
    },
    ctaSection: {
      headline: 'Ready to Stop Losing Leads?',
      subtitle: 'Apply now and get a sales pipeline that works as hard as you do.',
    },
  },

  // 8. Marketing Automation
  {
    slug: 'marketing-automation',
    title: 'Marketing Automation | SkaleFlow',
    metaDescription: 'Automate your marketing workflows with visual builders, trigger-based actions, email sequences, and smart follow-ups. Built for small business.',
    heroLabel: 'Automation',
    heroTitle: 'You Can\'t Follow Up with Everyone Manually',
    heroSubtitle: 'You know follow-up matters. But between sales calls, content creation, and actually delivering your service — there aren\'t enough hours in the day.',
    emotionSection: {
      painHeadline: 'You\'re doing the work of three people. Something has to give.',
      painPoints: [
        { icon: 'refresh', text: 'You\'re doing the same manual tasks over and over — welcome emails, follow-ups, reminders' },
        { icon: 'clock', text: 'Leads expect a response in minutes but you see their message hours later' },
        { icon: 'user-minus', text: 'Prospects fall out of your funnel because no one followed up at the right time' },
        { icon: 'puzzle', text: 'Enterprise automation tools are too expensive and too complex for your team' },
      ],
      empathyParagraph: 'Automation shouldn\'t require an engineering degree. You just want the right message to reach the right person at the right time — without you having to remember to send it. That\'s not lazy. That\'s smart.',
    },
    solutionIntro: 'What if your marketing ran on autopilot — follow-ups sent, leads nurtured, and tasks triggered — while you focused on what only you can do?',
    logicHeadline: 'Set the rules. Let the system do the rest.',
    logicSection: [
      { icon: 'bolt', title: 'Visual Workflow Builder', description: 'Build automations with a drag-and-drop canvas. No code required. See your entire workflow at a glance.' },
      { icon: 'play', title: 'Event-Based Triggers', description: 'Trigger workflows when contacts enter a stage, get tagged, or submit a form. React instantly.' },
      { icon: 'envelope', title: 'Automated Emails', description: 'Send personalised email sequences using your templates and merge fields. Timed delays between steps.' },
      { icon: 'arrows', title: 'Smart Actions', description: 'Move contacts between stages, add/remove tags, send webhooks, and update records — all automatically.' },
      { icon: 'clock', title: 'Time Delays', description: 'Wait 1 hour, 3 days, or 2 weeks between steps. Build nurture sequences that respect your prospect\'s timeline.' },
      { icon: 'shield', title: 'Loop Prevention', description: 'Built-in chain depth limits prevent infinite loops. Your automations stay safe and predictable.' },
    ],
    benefitsHeadline: 'Your time back. Your follow-ups handled.',
    benefitsSection: [
      { icon: 'clock', title: 'Reclaim Your Time', description: 'Automations handle the repetitive work so you can focus on relationships and strategy.' },
      { icon: 'bolt', title: 'Instant Response', description: 'Welcome emails in seconds, follow-ups on schedule. Your prospects feel valued — automatically.' },
      { icon: 'trending', title: 'Scale Without Hiring', description: 'Do the work of a marketing team without actually hiring one. Automations scale as you grow.' },
    ],
    proofSection: {
      stat: 'Visual builder',
      statLabel: 'with drag-and-drop workflow design — no code, no complexity',
      quote: 'My follow-up sequence runs itself now. I closed two deals last month from automated nurture emails.',
      quoteAuthor: 'Founder, Coaching Business',
    },
    ctaSection: {
      headline: 'Ready to Put Your Marketing on Autopilot?',
      subtitle: 'Apply now and build automations that nurture leads while you sleep.',
    },
  },

  // 9. Social Media Management
  {
    slug: 'social-media-management',
    title: 'Social Media Management Tool | SkaleFlow',
    metaDescription: 'Manage all your social media accounts in one place. Connect, schedule, publish, and analyse your content across every platform from a single dashboard.',
    heroLabel: 'Social Media',
    heroTitle: 'Managing 5 Social Platforms Is a Full-Time Job',
    heroSubtitle: 'Login to Instagram. Copy the caption. Open LinkedIn. Reformat. Open Facebook. Paste. Repeat. Every. Single. Day. There has to be a better way.',
    emotionSection: {
      painHeadline: 'You\'re spending more time managing platforms than running your business.',
      painPoints: [
        { icon: 'squares', text: 'You\'re logging into 4-5 different platforms every day just to post the same content' },
        { icon: 'clock', text: 'Formatting content for each platform takes longer than creating it' },
        { icon: 'chart', text: 'You have no idea which platform is actually driving results because data is everywhere' },
        { icon: 'key', text: 'You\'ve given your social passwords to three different tools and none of them work properly' },
      ],
      empathyParagraph: 'Social media management tools are either too expensive, too complex, or too limited. You don\'t need a tool built for agencies managing 50 clients. You need one dashboard where you can see, manage, and publish across all your platforms.',
    },
    solutionIntro: 'What if you could connect all your social accounts, create content once, and publish everywhere — from the same place you manage your brand and pipeline?',
    logicHeadline: 'All your platforms. One place. Finally.',
    logicSection: [
      { icon: 'link', title: 'One-Click Platform Connect', description: 'Connect Facebook, Instagram, LinkedIn, Twitter, and TikTok with OAuth authentication.' },
      { icon: 'globe', title: 'Unified Dashboard', description: 'See all your connected accounts, recent posts, and performance metrics in one view.' },
      { icon: 'calendar', title: 'Integrated Calendar', description: 'Your social calendar lives alongside your content calendar. One view for everything.' },
      { icon: 'shield', title: 'Secure Token Management', description: 'OAuth tokens are encrypted and auto-refreshed. Your accounts stay connected and secure.' },
    ],
    benefitsHeadline: 'One dashboard instead of five logins.',
    benefitsSection: [
      { icon: 'clock', title: 'Save 5+ Hours Per Week', description: 'Stop logging into multiple platforms. Manage everything from one dashboard.' },
      { icon: 'eye', title: 'One Source of Truth', description: 'All your social data, all your content, all your accounts — in one place.' },
      { icon: 'puzzle', title: 'Integrated Ecosystem', description: 'Social media connects to your content engine, pipeline, and analytics. No more siloed tools.' },
    ],
    proofSection: {
      stat: '5 platforms',
      statLabel: 'connected and managed from a single dashboard — no tab-switching required',
      quote: 'I used to spend my entire morning just posting content. Now it\'s done before I finish my coffee.',
      quoteAuthor: 'Founder, Lifestyle Brand',
    },
    ctaSection: {
      headline: 'Ready to Simplify Your Social Media?',
      subtitle: 'Apply now and manage all your social platforms from one powerful dashboard.',
    },
  },

  // 11. Multi-Platform Publishing
  {
    slug: 'multi-platform-publishing',
    title: 'Multi-Platform Social Publishing | SkaleFlow',
    metaDescription: 'Publish content to multiple social media platforms simultaneously. Auto-format for each platform, schedule posts, and track UTM parameters automatically.',
    heroLabel: 'Multi-Platform Publishing',
    heroTitle: 'Publish Once. Reach Everywhere.',
    heroSubtitle: 'You created great content. Now you have to post it to five different platforms, reformatted five different ways. Why is this still a manual process?',
    emotionSection: {
      painHeadline: 'You didn\'t start a business to copy-paste captions all day.',
      painPoints: [
        { icon: 'copy', text: 'You copy the same content and manually adjust it for each platform — every single time' },
        { icon: 'character', text: 'You exceed LinkedIn\'s character limit, forget Instagram hashtags, and miss Twitter\'s formatting' },
        { icon: 'clock', text: 'Scheduling posts on 3+ platforms takes as long as creating the content itself' },
        { icon: 'link', text: 'You can\'t track which platform drives traffic because you never add UTM parameters' },
      ],
      empathyParagraph: 'Cross-posting shouldn\'t feel like data entry. When you\'ve invested time creating quality content, distribution should be the easy part — not another hour of busywork.',
    },
    solutionIntro: 'What if one click could publish your content everywhere — automatically formatted for each platform, with UTM tracking built in?',
    logicHeadline: 'Create once. Distribute everywhere. Track it all.',
    logicSection: [
      { icon: 'rocket', title: 'One-Click Publishing', description: 'Select your platforms, hit publish, and your content goes live everywhere — simultaneously.' },
      { icon: 'adjustments', title: 'Auto-Formatting', description: 'Content is automatically adapted for each platform\'s character limits, hashtag conventions, and formatting rules.' },
      { icon: 'calendar', title: 'Scheduled Publishing', description: 'Set it and forget it. Schedule posts for optimal times on each platform.' },
      { icon: 'chart-bar', title: 'UTM Auto-Tracking', description: 'Every published link gets UTM parameters automatically. Know exactly which platform drives results.' },
      { icon: 'clock', title: 'Cron-Based Scheduling', description: 'Scheduled posts are published automatically every 15 minutes. No manual intervention needed.' },
    ],
    benefitsHeadline: 'Publish everywhere. Track everything. Move on.',
    benefitsSection: [
      { icon: 'bolt', title: 'Instant Distribution', description: 'Content goes from "approved" to "live on 5 platforms" in seconds. Not hours.' },
      { icon: 'chart', title: 'Track Everything', description: 'UTM parameters on every link mean you finally know which platform is worth your time.' },
      { icon: 'refresh', title: 'Set and Forget', description: 'Schedule your content once and let the system handle the rest. Focus on your business.' },
    ],
    proofSection: {
      stat: 'Auto-formatted',
      statLabel: 'for each platform\'s unique requirements — character limits, hashtags, formatting',
      quote: 'Publishing went from a 2-hour task to a 2-minute task. And now I actually track what works.',
      quoteAuthor: 'Founder, Tech Startup',
    },
    ctaSection: {
      headline: 'Ready to Reach Every Platform Without the Hassle?',
      subtitle: 'Apply now and publish to all your social platforms with one click.',
    },
  },

  // 12. Marketing Analytics Dashboard
  {
    slug: 'marketing-analytics-dashboard',
    title: 'Marketing Analytics Dashboard | SkaleFlow',
    metaDescription: 'See all your marketing performance in one dashboard. Track content performance, social media analytics, and campaign ROI across every channel.',
    heroLabel: 'Analytics',
    heroTitle: 'You\'re Flying Blind',
    heroSubtitle: 'You post content. You run campaigns. But do you actually know what\'s working? Or are you just hoping something sticks?',
    emotionSection: {
      painHeadline: 'Hope is not a marketing strategy. You need numbers.',
      painPoints: [
        { icon: 'chart-down', text: 'You have no idea which content actually drives leads — you just post and pray' },
        { icon: 'squares', text: 'Analytics are scattered across 5 platform dashboards you never check' },
        { icon: 'question', text: 'When someone asks "Is your marketing working?" you can\'t give a confident answer' },
        { icon: 'currency', text: 'You\'re spending money on marketing but you can\'t prove the ROI' },
      ],
      empathyParagraph: 'Data-driven marketing sounds great in theory. But when your data lives in Google Analytics, Instagram Insights, LinkedIn Analytics, and Facebook Business Suite — there\'s no single place to see the full picture. You need a dashboard, not a scavenger hunt.',
    },
    solutionIntro: 'What if all your marketing data — content performance, social analytics, campaign metrics — lived in one dashboard that told you exactly what\'s working?',
    logicHeadline: 'The numbers don\'t lie. Now you can actually see them.',
    logicSection: [
      { icon: 'chart-bar', title: 'Performance Overview', description: 'Key metrics at a glance: total reach, engagement rate, content published, and audience growth.' },
      { icon: 'trending', title: 'Performance Charts', description: 'Visual charts showing performance trends over time. Spot patterns and opportunities instantly.' },
      { icon: 'star', title: 'Top Performing Content', description: 'See which posts drove the most engagement, clicks, and conversions. Double down on what works.' },
      { icon: 'squares', title: 'Platform Breakdown', description: 'Compare performance across platforms. Know where your audience is most engaged.' },
      { icon: 'funnel', title: 'Campaign Filtering', description: 'Filter analytics by campaign to see which initiatives drove the best results.' },
    ],
    benefitsHeadline: 'Decisions backed by data, not gut feel.',
    benefitsSection: [
      { icon: 'eye', title: 'See the Full Picture', description: 'One dashboard for all your marketing data. No more switching between platforms.' },
      { icon: 'target', title: 'Make Better Decisions', description: 'When you know what works, you do more of it. Data-driven marketing isn\'t complicated — it\'s just informed.' },
      { icon: 'currency', title: 'Prove Your ROI', description: 'Show stakeholders, partners, and yourself that your marketing is actually driving results.' },
    ],
    proofSection: {
      stat: 'Cross-platform',
      statLabel: 'analytics synced daily — with campaign filtering and performance trending',
      quote: 'For the first time, I can actually prove that our content marketing is driving revenue.',
      quoteAuthor: 'Founder, B2B Services',
    },
    ctaSection: {
      headline: 'Ready to See What\'s Actually Working?',
      subtitle: 'Apply now and get a marketing dashboard that turns data into decisions.',
    },
  },

  // 13. Credit-Based AI Billing
  {
    slug: 'credit-based-ai-billing',
    title: 'AI Usage & Credit Billing | SkaleFlow',
    metaDescription: 'Transparent AI usage billing with credits. Choose free or premium AI models, track usage in real-time, and only pay for what you use. No hidden costs.',
    heroLabel: 'AI Billing',
    heroTitle: 'AI Tools Shouldn\'t Come with Surprise Bills',
    heroSubtitle: 'You\'ve been burned by tools that charge per seat, per feature, or per "AI credit" with no transparency. You deserve to know exactly what you\'re paying for.',
    emotionSection: {
      painHeadline: 'You shouldn\'t need a finance degree to understand your AI bill.',
      painPoints: [
        { icon: 'currency', text: 'You\'re afraid to use AI features because you don\'t know what they\'ll cost' },
        { icon: 'eye-slash', text: 'Other tools hide AI costs behind vague "pro plans" with no usage visibility' },
        { icon: 'lock', text: 'Premium features are locked behind enterprise pricing you can\'t afford' },
        { icon: 'question', text: 'You have no way to predict your monthly AI spending' },
      ],
      empathyParagraph: 'AI should make your business more efficient — not more expensive. You need a billing model that\'s transparent, predictable, and fair. One where you can use free AI models for most tasks and only pay for premium when you need it.',
    },
    solutionIntro: 'What if you could choose between free and premium AI models for every task, track your usage in real-time, and top up only when you need more?',
    logicHeadline: 'Transparent pricing. Real choice. No gotchas.',
    logicSection: [
      { icon: 'sparkles', title: 'Free AI Models', description: 'Gemini 2.0 Flash and Llama 3.3 70B are completely free. Generate content without touching your credits.' },
      { icon: 'cpu', title: 'Premium Options', description: 'Claude Sonnet 4.5 and Claude Sonnet 4 available for when you need maximum quality.' },
      { icon: 'chart-bar', title: 'Real-Time Tracking', description: 'See your credit balance, usage history, and spending trends in your billing dashboard.' },
      { icon: 'shopping-cart', title: 'Top-Up Packs', description: 'Buy additional credits when you need them. No subscriptions, no commitments.' },
      { icon: 'document', title: 'Automatic Invoices', description: 'Professional invoices with 15% SA VAT, generated automatically for every transaction.' },
    ],
    benefitsHeadline: 'Use AI freely. Pay only what\'s fair.',
    benefitsSection: [
      { icon: 'eye', title: 'Total Transparency', description: 'See exactly what every AI generation costs before you run it. No surprises on your bill.' },
      { icon: 'currency', title: 'Pay What\'s Fair', description: 'Use free models for everyday tasks. Save premium credits for when quality matters most.' },
      { icon: 'shield', title: 'No Lock-In', description: 'Top-up credits never expire. No use-it-or-lose-it pressure on purchased credits.' },
    ],
    proofSection: {
      stat: '2 free models',
      statLabel: 'included with every plan — generate content without spending a single credit',
      quote: 'I use the free AI for 80% of my content. Premium credits last me months because I only use them when it matters.',
      quoteAuthor: 'Founder, Marketing Consultancy',
    },
    ctaSection: {
      headline: 'Ready for AI That\'s Honest About Pricing?',
      subtitle: 'Apply now and get AI-powered marketing with transparent, fair billing.',
    },
  },

  // 14. Team Collaboration Hub
  {
    slug: 'team-collaboration-hub',
    title: 'Marketing Team Collaboration | SkaleFlow',
    metaDescription: 'Collaborate with your marketing team in real-time. Shared content calendars, approval workflows, notifications, and role-based access — all in one platform.',
    heroLabel: 'Team Collaboration',
    heroTitle: 'Your Team Is Working in Silos',
    heroSubtitle: 'The designer uses Canva. The copywriter uses Google Docs. The social manager uses Buffer. Nobody sees the full picture. Your marketing suffers.',
    emotionSection: {
      painHeadline: 'Six tools, zero alignment. Sound about right?',
      painPoints: [
        { icon: 'users', text: 'Your team uses 6 different tools and none of them talk to each other' },
        { icon: 'chat', text: 'Important updates get buried in group chats and nobody reads the shared doc' },
        { icon: 'eye-slash', text: 'You have no visibility into what your team is working on until it\'s done' },
        { icon: 'arrows', text: 'Handoffs between team members always result in lost context or missed details' },
      ],
      empathyParagraph: 'Collaboration tools were supposed to make teamwork easier. Instead, you\'re managing tools to manage tools. Your team needs one place where strategy, content, and execution live together — not another app to add to the stack.',
    },
    solutionIntro: 'What if your entire marketing team worked from one platform — with shared calendars, real-time notifications, and clear role definitions?',
    logicHeadline: 'One team. One platform. Zero miscommunication.',
    logicSection: [
      { icon: 'users', title: 'Shared Workspace', description: 'Everyone works from the same platform. Content, calendars, pipeline, and analytics in one place.' },
      { icon: 'bell', title: 'Real-Time Notifications', description: 'Get notified when content needs review, is approved, or is ready to publish. Stay in sync.' },
      { icon: 'calendar', title: 'Shared Calendars', description: 'See what\'s scheduled, what\'s in progress, and what\'s published — as a team.' },
      { icon: 'inbox', title: 'Team Inbox', description: 'A centralised notification centre for approvals, mentions, and updates.' },
      { icon: 'chart', title: 'Team Analytics', description: 'Track team productivity, content output, and approval turnaround times.' },
    ],
    benefitsHeadline: 'One team, one tool, zero excuses.',
    benefitsSection: [
      { icon: 'puzzle', title: 'One Platform, Not Ten', description: 'Stop paying for and managing multiple tools. Everything your marketing team needs in one place.' },
      { icon: 'bolt', title: 'Faster Execution', description: 'When everyone sees the same data, decisions happen faster and handoffs are seamless.' },
      { icon: 'eye', title: 'Full Visibility', description: 'Know what everyone is working on, what\'s blocked, and what\'s next — without asking.' },
    ],
    proofSection: {
      stat: 'Unified platform',
      statLabel: 'combining brand, content, pipeline, and analytics — no more tool-switching',
      quote: 'We replaced 4 marketing tools with SkaleFlow. Our team actually talks to each other now because we\'re all in the same place.',
      quoteAuthor: 'Marketing Director, Growth Agency',
    },
    ctaSection: {
      headline: 'Ready to Get Your Team on the Same Page?',
      subtitle: 'Apply now and give your team a collaboration hub that actually works.',
    },
  },

  // 15. Role-Based Access Control
  {
    slug: 'role-based-access-control',
    title: 'Role-Based Access Control | SkaleFlow',
    metaDescription: 'Control who sees what in your marketing platform. Role-based permissions for owners, admins, and team members. Protect your data and streamline workflows.',
    heroLabel: 'Access Control',
    heroTitle: 'Not Everyone Needs Access to Everything',
    heroSubtitle: 'Your intern can see your revenue dashboard. Your freelancer can edit your brand strategy. Your billing info is one click away from the whole team. That\'s a problem.',
    emotionSection: {
      painHeadline: 'Open access feels easy — until someone breaks something.',
      painPoints: [
        { icon: 'lock-open', text: 'Everyone on your team has the same access level — from your VA to your co-founder' },
        { icon: 'shield-x', text: 'Freelancers and contractors can see sensitive business data they shouldn\'t' },
        { icon: 'pencil', text: 'Someone accidentally edited your brand strategy and you only noticed weeks later' },
        { icon: 'key', text: 'You\'re sharing login credentials because the tool doesn\'t have proper user management' },
      ],
      empathyParagraph: 'Access control sounds like a big-company problem. But the moment you add a team member, a VA, or a freelancer — it becomes your problem. You need to know that your brand, your pipeline, and your billing are safe.',
    },
    solutionIntro: 'What if every team member saw exactly what they need — and nothing more? No shared logins, no accidental edits, no data exposure.',
    logicHeadline: 'The right access for the right people. Nothing more.',
    logicSection: [
      { icon: 'users', title: 'Role Definitions', description: 'Owner, admin, and member roles — each with carefully designed permissions.' },
      { icon: 'shield', title: 'Feature-Level Access', description: 'Control access to brand strategy, content, pipeline, billing, and admin areas independently.' },
      { icon: 'user-plus', title: 'Invite System', description: 'Invite team members by email with a specific role. They get access to exactly what you choose.' },
      { icon: 'eye', title: 'Audit Visibility', description: 'See who has access to what. Review and adjust permissions as your team evolves.' },
    ],
    benefitsHeadline: 'Grow your team without growing your risk.',
    benefitsSection: [
      { icon: 'shield', title: 'Protect Sensitive Data', description: 'Billing, strategy, and admin areas are restricted to those who need them. Period.' },
      { icon: 'users', title: 'Scale Your Team Safely', description: 'Add freelancers, VAs, and contractors without worrying about what they can see or edit.' },
      { icon: 'check-circle', title: 'Compliance Ready', description: 'Proper access control isn\'t just good practice — it\'s essential for POPIA compliance in South Africa.' },
    ],
    proofSection: {
      stat: '3 role levels',
      statLabel: 'with granular feature access — owner, admin, and member',
      quote: 'I finally added my VA to the platform without worrying about her seeing our financials.',
      quoteAuthor: 'Founder, Online Education',
    },
    ctaSection: {
      headline: 'Ready to Control Who Sees What?',
      subtitle: 'Apply now and give every team member the right access — and nothing more.',
    },
  },

  // 16. SkaleFlow Methodology
  {
    slug: 'skaleflow-methodology',
    title: 'The SkaleFlow Methodology | SkaleFlow',
    metaDescription: 'A complete marketing system for founders. The SkaleFlow methodology combines brand strategy, content creation, pipeline management, and analytics into one growth engine.',
    heroLabel: 'The System',
    heroTitle: 'Tactics Won\'t Save Your Business. A System Will.',
    heroSubtitle: 'You\'ve tried social media hacks, paid ads, SEO tricks, and viral formulas. None of them lasted. Because tactics without a system are just expensive experiments.',
    emotionSection: {
      painHeadline: 'You\'ve tried everything. Except an actual system.',
      painPoints: [
        { icon: 'shuffle', text: 'You jump from tactic to tactic — Facebook ads one month, TikTok the next — with no underlying strategy' },
        { icon: 'chart-down', text: 'You\'ve spent thousands on marketing that delivered likes but not leads' },
        { icon: 'puzzle', text: 'Your brand, content, sales, and analytics are disconnected tools that don\'t work together' },
        { icon: 'fire', text: 'You\'re exhausted from doing everything yourself with no clear framework to follow' },
      ],
      empathyParagraph: 'The problem was never your work ethic. It was never your product. The problem is that you\'re trying to build a growth engine by bolting random parts together. You need a system — not another tactic.',
    },
    solutionIntro: 'What if brand strategy, content creation, sales pipeline, and analytics all lived in one connected system — where each piece feeds the next?',
    logicHeadline: 'Four pillars. One flywheel. Compounding results.',
    logicSection: [
      { icon: 'compass', title: 'Brand Foundation First', description: 'Everything starts with strategy. Define your positioning, archetype, and messaging before creating a single piece of content.' },
      { icon: 'sparkles', title: 'AI-Powered Content', description: 'Your brand strategy feeds directly into AI content generation. Every piece is on-brand by default.' },
      { icon: 'funnel', title: 'Content-to-Pipeline', description: 'Content drives leads into your pipeline. Automations nurture them. You close the deals.' },
      { icon: 'chart-bar', title: 'Data-Driven Iteration', description: 'Analytics show what\'s working. You double down on winners and cut the losers. The system gets smarter.' },
      { icon: 'refresh', title: 'Continuous Improvement', description: 'As your brand evolves, your content evolves. As your content performs, your strategy sharpens. It\'s a flywheel.' },
      { icon: 'trophy', title: 'Built for Founders', description: 'This isn\'t enterprise software stripped down. It\'s built from the ground up for founder-led businesses.' },
    ],
    benefitsHeadline: 'Stop experimenting. Start compounding.',
    benefitsSection: [
      { icon: 'brain', title: 'Clarity Over Chaos', description: 'Know exactly what to do next. The system guides you from brand strategy to revenue — step by step.' },
      { icon: 'trending', title: 'Compound Growth', description: 'When brand, content, and sales work together, results compound. Month over month. Quarter over quarter.' },
      { icon: 'heart', title: 'Peace of Mind', description: 'Stop wondering if your marketing is working. Know it is — because the data tells you.' },
    ],
    proofSection: {
      stat: '4 pillars',
      statLabel: 'Brand Strategy → Content Engine → Sales Pipeline → Analytics — one connected system',
      quote: 'SkaleFlow gave me what no agency ever could: a system I understand, control, and can scale myself.',
      quoteAuthor: 'Founder, Professional Services',
    },
    ctaSection: {
      headline: 'Ready to Stop Guessing and Start Growing?',
      subtitle: 'Apply now and get the marketing system that founder-led brands are using to scale.',
    },
  },

  // 17. SEO & UTM Tracking
  {
    slug: 'seo-utm-tracking',
    title: 'SEO & UTM Campaign Tracking | SkaleFlow',
    metaDescription: 'Track every campaign with automatic UTM parameters. Know exactly which content, platform, and campaign drives traffic, leads, and revenue.',
    heroLabel: 'Campaign Tracking',
    heroTitle: 'If You Can\'t Track It, You Can\'t Improve It',
    heroSubtitle: 'You\'re spending time and money on marketing. But when a lead comes in, you have no idea which post, which platform, or which campaign brought them. That\'s marketing in the dark.',
    emotionSection: {
      painHeadline: 'You\'re investing in marketing you can\'t measure. That has to change.',
      painPoints: [
        { icon: 'question', text: 'A new lead signs up and you have no idea where they came from' },
        { icon: 'link', text: 'You share links without UTM parameters so all your traffic shows up as "direct"' },
        { icon: 'chart', text: 'You can\'t tell your best-performing campaign from your worst because you don\'t track properly' },
        { icon: 'currency', text: 'You\'re investing in channels that might not be working — but you\'ll never know' },
      ],
      empathyParagraph: 'UTM tracking sounds technical. It sounds like something a marketing agency handles. But without it, every marketing decision you make is a guess. You\'re not tracking because the tools make it hard. SkaleFlow makes it automatic.',
    },
    solutionIntro: 'What if every link you shared was automatically tracked — so you could see exactly which content, platform, and campaign drove every single lead?',
    logicHeadline: 'Every click tracked. Every source identified. Automatically.',
    logicSection: [
      { icon: 'link', title: 'Auto-Generated UTMs', description: 'Every piece of content gets UTM parameters automatically — source, medium, campaign, and content.' },
      { icon: 'globe', title: 'Platform-Specific Tracking', description: 'UTM source is automatically overridden per platform at publish time. LinkedIn traffic says LinkedIn.' },
      { icon: 'target', title: 'Campaign Attribution', description: 'Connect your campaigns to results. Know which campaign drove which leads and revenue.' },
      { icon: 'chart-bar', title: 'Performance Analytics', description: 'See which channels, campaigns, and content types drive the most valuable traffic.' },
    ],
    benefitsHeadline: 'Know where every lead comes from. Finally.',
    benefitsSection: [
      { icon: 'eye', title: 'Know What Works', description: 'Finally answer the question: "Where do my best leads come from?" with data, not guesses.' },
      { icon: 'currency', title: 'Optimise Spend', description: 'Stop wasting money on channels that don\'t convert. Double down on what actually drives revenue.' },
      { icon: 'brain', title: 'Smarter Decisions', description: 'When you know what works, every marketing decision becomes easier and more confident.' },
    ],
    proofSection: {
      stat: 'Automatic UTMs',
      statLabel: 'on every published link — with platform-specific source tracking',
      quote: 'We discovered that 70% of our leads came from LinkedIn. We had no idea until we started tracking with UTMs.',
      quoteAuthor: 'Founder, B2B Consultancy',
    },
    ctaSection: {
      headline: 'Ready to Know Exactly What\'s Driving Your Growth?',
      subtitle: 'Apply now and get campaign tracking that runs on autopilot.',
    },
  },

  // 18. Authority Engine
  {
    slug: 'authority-engine',
    title: 'Authority Engine — PR & Media Pipeline | SkaleFlow',
    metaDescription: 'Build executive authority and land media coverage with an AI-powered PR pipeline. Manage journalist contacts, craft press releases, and track media opportunities from one dashboard.',
    heroLabel: 'Authority Engine',
    heroTitle: 'You\'re the Best-Kept Secret in Your Industry',
    heroSubtitle: 'You have the expertise. The track record. The results. But nobody outside your client list knows your name. It\'s time to change that.',
    emotionSection: {
      painHeadline: 'Great work means nothing if nobody knows about it.',
      painPoints: [
        { icon: 'eye-slash', text: 'You watch competitors with half your experience get media features and speaking gigs' },
        { icon: 'chat', text: 'Journalists don\'t know you exist because you\'ve never had a system for outreach' },
        { icon: 'clipboard', text: 'You\'ve thought about PR but have no idea where to start — or who to contact' },
        { icon: 'clock', text: 'Building authority feels like a luxury when you\'re buried in client delivery' },
      ],
      empathyParagraph: 'Authority doesn\'t come from being louder. It comes from being strategic. The founders who land features and get invited to speak? They have a system. A pipeline. A plan. That\'s what this gives you.',
    },
    solutionIntro: 'What if you had a complete PR pipeline — from story angles to journalist outreach to published features — managed from the same platform as your brand and content?',
    logicHeadline: 'Your PR pipeline. Organised. Trackable. Effective.',
    logicSection: [
      { icon: 'view-columns', title: 'PR Opportunity Pipeline', description: 'Kanban board for managing media opportunities from pitch to published. Drag, drop, track.' },
      { icon: 'users', title: 'Journalist Contact Database', description: 'Build a CRM of journalists, editors, and media contacts with warmth tracking and beat tagging.' },
      { icon: 'document-text', title: 'Press Release Editor', description: 'Write and manage press releases with a built-in editor. Draft, review, publish workflow.' },
      { icon: 'sparkles', title: 'Story Angle Library', description: 'Pre-built narrative frameworks to help you craft pitches that actually get opened.' },
      { icon: 'globe', title: 'Public Newsroom Page', description: 'A branded press page where journalists can find your latest releases, assets, and contact details.' },
      { icon: 'chart-bar', title: 'PR Analytics & Scoring', description: 'Track your reach, media mentions, and PR performance over time. See what\'s landing.' },
    ],
    benefitsHeadline: 'From invisible expert to recognised authority.',
    benefitsSection: [
      { icon: 'megaphone', title: 'Get Featured', description: 'Stop waiting to be discovered. Proactively pitch to the right journalists with the right story at the right time.' },
      { icon: 'shield', title: 'Build Credibility', description: 'Media features do what ads can\'t — they make people trust you before they\'ve ever spoken to you.' },
      { icon: 'trending', title: 'Compound Your Reach', description: 'Every feature, every quote, every mention compounds. Authority builds on itself once the engine is running.' },
    ],
    proofSection: {
      stat: 'End-to-end PR',
      statLabel: 'pipeline management — from story angles to published media features',
      quote: 'I landed my first media feature within 6 weeks. I\'d been meaning to "do PR" for two years.',
      quoteAuthor: 'Founder, Professional Services',
    },
    ctaSection: {
      headline: 'Ready to Be Known for What You Do Best?',
      subtitle: 'Apply now and start building the authority your expertise deserves.',
    },
  },

  // 19. AI Sales Calls
  {
    slug: 'ai-sales-calls',
    title: 'AI Sales Call Co-Pilot | SkaleFlow',
    metaDescription: 'Close more deals with live AI coaching during sales calls. Get real-time suggestions, automatic transcription, post-call summaries, and strategic insights extraction.',
    heroLabel: 'AI Sales Calls',
    heroTitle: 'You\'re Leaving Money on Every Call',
    heroSubtitle: 'You get on calls. You talk. Sometimes you close, sometimes you don\'t. But you never really know why. What if every call came with a co-pilot who did?',
    emotionSection: {
      painHeadline: 'Sales calls shouldn\'t be a coin flip.',
      painPoints: [
        { icon: 'chat', text: 'You forget key talking points mid-call and only remember them after you hang up' },
        { icon: 'question', text: 'When a prospect raises an objection, you freeze — and the deal goes cold' },
        { icon: 'clipboard', text: 'You never take proper notes during calls and lose critical context for follow-up' },
        { icon: 'eye-slash', text: 'You have no idea what patterns separate your closed deals from your lost ones' },
      ],
      empathyParagraph: 'You\'re not a bad salesperson. You\'re a founder who wears twenty hats, and sales is just one of them. You don\'t need a sales coach on retainer — you need intelligence built into every call.',
    },
    solutionIntro: 'What if you had an AI co-pilot on every call — feeding you suggestions in real-time, capturing everything, and extracting the insights that actually matter?',
    logicHeadline: 'Real-time intelligence. Every call. Every deal.',
    logicSection: [
      { icon: 'bolt', title: 'Live AI Coaching', description: 'Get real-time suggestions for handling objections, asking better questions, and guiding the conversation.' },
      { icon: 'document-text', title: 'Automatic Transcription', description: 'Every call is transcribed automatically. No more scribbling notes while trying to listen.' },
      { icon: 'sparkles', title: 'Post-Call Summaries', description: 'AI-generated summaries with action items, next steps, and key takeaways — delivered instantly.' },
      { icon: 'funnel', title: 'Strategic Insights Extraction', description: 'Automatically extract pain points, budget signals, objections, and competitor mentions from every call.' },
      { icon: 'arrows', title: 'Brand Engine Sync', description: 'Accept extracted insights and feed them directly into your brand strategy. Calls make your brand smarter.' },
      { icon: 'calendar', title: 'Scheduling & Templates', description: 'Schedule calls with built-in templates for discovery, sales, onboarding, and follow-up conversations.' },
    ],
    benefitsHeadline: 'Better conversations. Better data. More closes.',
    benefitsSection: [
      { icon: 'currency', title: 'Higher Close Rate', description: 'Real-time coaching means you handle objections in the moment — not in the shower the next morning.' },
      { icon: 'brain', title: 'Learn From Every Call', description: 'Extracted insights show you patterns across all your calls. See what works and repeat it.' },
      { icon: 'clock', title: 'Zero Post-Call Admin', description: 'No more writing up call notes. Summaries, action items, and follow-ups are generated automatically.' },
    ],
    proofSection: {
      stat: 'AI co-pilot',
      statLabel: 'with live coaching, auto-transcription, and strategic insights extraction',
      quote: 'The AI caught a buying signal I completely missed. That one insight saved a R45K deal.',
      quoteAuthor: 'Founder, Consulting Firm',
    },
    ctaSection: {
      headline: 'Ready to Win More Deals Without Becoming a Sales Expert?',
      subtitle: 'Apply now and let AI turn every call into a strategic advantage.',
    },
  },

  // 20. Brand Audits
  {
    slug: 'brand-audit',
    title: 'Brand Audit & Health Score | SkaleFlow',
    metaDescription: 'Diagnose your brand health with a structured 8-section audit. Get AI-powered scoring across 6 dimensions, a priority roadmap, and professional PDF reports.',
    heroLabel: 'Brand Audits',
    heroTitle: 'You Don\'t Know What\'s Broken Until You Measure It',
    heroSubtitle: 'Your brand feels "off" but you can\'t pinpoint why. Leads aren\'t converting. Your messaging feels scattered. You need a diagnosis, not another opinion.',
    emotionSection: {
      painHeadline: 'Something isn\'t working. You can feel it. Let\'s find it.',
      painPoints: [
        { icon: 'question', text: 'You know your brand needs work but you don\'t know where to start or what to fix first' },
        { icon: 'chart-down', text: 'Leads visit your site, look around, and leave — and you have no idea why' },
        { icon: 'currency', text: 'You\'ve invested in branding before but can\'t tell if it actually moved the needle' },
        { icon: 'puzzle', text: 'Your visual identity says one thing, your messaging says another, and your customers are confused' },
      ],
      empathyParagraph: 'Most founders know something is off with their brand. But without a structured way to evaluate it, you\'re fixing symptoms instead of root causes. A brand audit gives you the X-ray — so you can operate with precision.',
    },
    solutionIntro: 'What if you could score your brand across six critical dimensions, see exactly where you\'re strong, where you\'re bleeding, and what to fix first?',
    logicHeadline: 'A complete brand health check in one structured process.',
    logicSection: [
      { icon: 'clipboard', title: '8-Section Assessment', description: 'Walk through company overview, brand foundation, visual identity, messaging, digital presence, customer experience, competitive landscape, and goals.' },
      { icon: 'chart-bar', title: 'AI-Powered Scoring', description: 'Get scored across 6 dimensions: brand foundation, message consistency, visual identity, digital presence, customer perception, and competitive differentiation.' },
      { icon: 'sparkles', title: 'Traffic Light Dashboard', description: 'Red, amber, green ratings at a glance. Know instantly where you\'re strong and where you need attention.' },
      { icon: 'document-text', title: 'Priority Roadmap', description: 'AI-generated action items ranked by impact. Know exactly what to fix first for maximum results.' },
      { icon: 'printer', title: 'Professional PDF Report', description: 'Export a branded audit report with executive summary, category scores, findings, and recommendations.' },
      { icon: 'refresh', title: 'Track Progress Over Time', description: 'Run audits periodically and compare scores. See your brand health improve as you implement changes.' },
    ],
    benefitsHeadline: 'Stop guessing what\'s wrong. Start fixing what matters.',
    benefitsSection: [
      { icon: 'target', title: 'Precision Over Guesswork', description: 'Six scored dimensions tell you exactly where your brand is strong and where it\'s failing. No more gut feel.' },
      { icon: 'trending', title: 'Measurable Improvement', description: 'Run audits over time and watch your scores climb. Track the impact of every brand investment.' },
      { icon: 'currency', title: 'Save Thousands on Consultants', description: 'A brand audit from an agency costs R20,000+. Yours is built into the platform and gets smarter every time.' },
    ],
    proofSection: {
      stat: '6 scored dimensions',
      statLabel: 'with AI analysis, priority roadmap, and professional PDF reporting',
      quote: 'The audit showed me my messaging was a 38 out of 100. I thought it was fine. That one insight changed everything.',
      quoteAuthor: 'Founder, E-commerce Brand',
    },
    ctaSection: {
      headline: 'Ready to See Your Brand Through Fresh Eyes?',
      subtitle: 'Apply now and get a diagnostic that tells you exactly what to fix — and in what order.',
    },
  },
];

export function getFeatureBySlug(slug: string): FeaturePageData | undefined {
  return features.find(f => f.slug === slug);
}

export function getAllFeatureSlugs(): string[] {
  return features.map(f => f.slug);
}
