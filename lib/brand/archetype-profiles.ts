export interface BrandArchetypeProfile {
  name: string;
  motto: string;
  core_desire: string;
  goal: string;
  greatest_fear: string;
  strategy: string;
  weakness: string;
  talent: string;
  brand_voice: string[];
  brand_message_themes: string[];
  customer_experience: string;
  customer_promise: string;
  brand_culture: string;
  color_associations: string[];
  visual_style: string;
  content_approach: string;
  shadow_traits: string[];
  complementary_archetypes: string[];
  real_world_examples: string[];
  storybrand_guide_style: string;
  differentiation_angle: string;
  emotional_hook: string;
  content_pillars: string[];
  sales_approach: string;
}

export const ARCHETYPE_PROFILES: Record<string, BrandArchetypeProfile> = {
  sage: {
    name: 'The Sage',
    motto: 'The truth will set you free',
    core_desire: 'To find truth and understanding',
    goal: 'To use intelligence and analysis to understand the world',
    greatest_fear: 'Being duped, misled, or remaining ignorant',
    strategy: 'Seek information and knowledge; self-reflect and understand processes',
    weakness: 'Analysis paralysis; can study details forever without acting',
    talent: 'Wisdom, intelligence, and the ability to see patterns others miss',
    brand_voice: ['Authoritative', 'Factual', 'Thoughtful', 'Precise', 'Intelligent'],
    brand_message_themes: ['Enlightenment', 'Knowledge', 'Truth', 'Expertise', 'Clarity'],
    customer_experience: 'Feels educated, informed, and deeply engaged — like gaining access to insider knowledge',
    customer_promise: 'We will help you understand what others cannot and make better decisions because of it',
    brand_culture: 'Research-driven, evidence-based, intellectually curious, values depth over speed',
    color_associations: ['Navy', 'Forest green', 'Deep purple', 'Silver', 'White'],
    visual_style: 'Clean, structured, minimal, data-rich with elegant whitespace',
    content_approach: 'Deep-dive educational content, frameworks, data-backed insights, research summaries, and thought leadership',
    shadow_traits: ['Ivory tower detachment', 'Condescension', 'Over-complication', 'Intellectual snobbery'],
    complementary_archetypes: ['Explorer', 'Ruler', 'Creator'],
    real_world_examples: ['Google', 'TED', 'Harvard', 'The Economist', 'McKinsey'],
    storybrand_guide_style: 'The wise mentor who gives the hero the knowledge they need — shows the map, explains the terrain, reveals what others have missed',
    differentiation_angle: 'Depth of understanding — we know more, research deeper, and share insights competitors keep hidden',
    emotional_hook: 'The relief of finally understanding WHY something works (or does not), and the confidence that comes with real knowledge',
    content_pillars: ['Deep analysis', 'Industry research', 'Frameworks and models', 'Myth-busting with evidence', 'Expert interviews'],
    sales_approach: 'Educate to convert — lead with value, demonstrate expertise through free teaching, let the quality of insight create trust',
  },
  hero: {
    name: 'The Hero',
    motto: 'Where there is a will, there is a way',
    core_desire: 'To prove worth through courageous action',
    goal: 'To exert mastery and improve the world through competence and courage',
    greatest_fear: 'Weakness, vulnerability, being perceived as incapable',
    strategy: 'Become as competent and strong as possible; push through obstacles',
    weakness: 'Arrogance; always needing another battle to fight',
    talent: 'Competence, courage, and the determination to overcome any obstacle',
    brand_voice: ['Bold', 'Empowering', 'Direct', 'Action-oriented', 'Confident'],
    brand_message_themes: ['Achievement', 'Mastery', 'Overcoming', 'Discipline', 'Transformation'],
    customer_experience: 'Feels empowered, capable, and inspired to take action — like gaining a competitive edge',
    customer_promise: 'We will give you the tools and strategy to win — no excuses, no shortcuts',
    brand_culture: 'Performance-driven, results-obsessed, celebrates effort and achievement over comfort',
    color_associations: ['Red', 'Black', 'Gold', 'Steel grey', 'Deep blue'],
    visual_style: 'Bold, high-contrast, dynamic imagery, strong typography, action shots',
    content_approach: 'Challenge-based content, transformation stories, tactical how-tos, performance benchmarks, accountability frameworks',
    shadow_traits: ['Burnout culture', 'Win-at-all-costs mentality', 'Dismissing vulnerability', 'Toxic hustle narrative'],
    complementary_archetypes: ['Sage', 'Ruler', 'Explorer'],
    real_world_examples: ['Nike', 'Under Armour', 'FedEx', 'US Army', 'Gatorade'],
    storybrand_guide_style: 'The battle-tested coach who has been through the fight before — gives the hero a clear plan and pushes them to execute',
    differentiation_angle: 'Results and performance — we deliver measurable outcomes where others deliver vague promises',
    emotional_hook: 'The desire to prove yourself, to not settle, and to become the strongest version of who you are',
    content_pillars: ['Transformation stories', 'Tactical playbooks', 'Performance metrics', 'Challenge content', 'Behind-the-scenes grind'],
    sales_approach: 'Challenge to convert — call out mediocrity, present the higher standard, make inaction feel costly',
  },
  creator: {
    name: 'The Creator',
    motto: 'If you can imagine it, it can be made',
    core_desire: 'To create something of enduring value and meaning',
    goal: 'To realize a vision and give form to imagination',
    greatest_fear: 'Mediocrity, having a mundane or uninspired vision',
    strategy: 'Develop artistic control and skill; cultivate imagination and innovation',
    weakness: 'Perfectionism; creating for self rather than audience',
    talent: 'Creativity, imagination, and the ability to bring new things into existence',
    brand_voice: ['Imaginative', 'Expressive', 'Innovative', 'Authentic', 'Visionary'],
    brand_message_themes: ['Innovation', 'Self-expression', 'Originality', 'Vision', 'Craft'],
    customer_experience: 'Feels inspired, creatively empowered, and part of something beautifully crafted',
    customer_promise: 'We will help you bring your vision to life with craft, originality, and meaning',
    brand_culture: 'Innovation-first, artistic expression valued, celebrates originality and creative risk-taking',
    color_associations: ['Purple', 'Teal', 'Coral', 'Warm gold', 'Rich earth tones'],
    visual_style: 'Artful, distinctive, strong visual identity, custom illustrations, rich textures',
    content_approach: 'Showcase creative process, behind-the-scenes of innovation, portfolio-style proof, design thinking content',
    shadow_traits: ['Perfectionism that blocks shipping', 'Self-indulgence', 'Impracticality', 'Over-styling at the expense of clarity'],
    complementary_archetypes: ['Magician', 'Explorer', 'Sage'],
    real_world_examples: ['Apple', 'Adobe', 'LEGO', 'Pinterest', 'Canva'],
    storybrand_guide_style: 'The visionary architect who shows the hero what is possible — paints the picture of the extraordinary outcome and provides the tools to build it',
    differentiation_angle: 'Original craft — we build what has never been built before, not templates or copies',
    emotional_hook: 'The thrill of seeing something you imagined come to life — and the pride of being part of something truly original',
    content_pillars: ['Creative process', 'Innovation showcases', 'Design thinking', 'Craft deep-dives', 'Visionary futures'],
    sales_approach: 'Inspire to convert — show the extraordinary possibility, demonstrate the craft difference, let beauty and innovation sell itself',
  },
  explorer: {
    name: 'The Explorer',
    motto: 'Do not fence me in',
    core_desire: 'The freedom to discover and experience new things',
    goal: 'To experience a more authentic, fulfilling life through discovery',
    greatest_fear: 'Getting trapped, conformity, inner emptiness',
    strategy: 'Seek out new experiences; escape boredom and routine',
    weakness: 'Aimless wandering; inability to commit or settle down',
    talent: 'Autonomy, ambition, and the ability to be true to one\'s own soul',
    brand_voice: ['Adventurous', 'Independent', 'Authentic', 'Curious', 'Free-spirited'],
    brand_message_themes: ['Freedom', 'Discovery', 'Authenticity', 'Adventure', 'Self-reliance'],
    customer_experience: 'Feels liberated, excited, and like they are charting their own path — not following the crowd',
    customer_promise: 'We will help you break free from the conventional and discover what truly works for YOU',
    brand_culture: 'Freedom-loving, values independence and self-discovery, anti-establishment, celebrates the unconventional',
    color_associations: ['Earth tones', 'Forest green', 'Burnt orange', 'Sky blue', 'Sand'],
    visual_style: 'Natural, open spaces, adventure photography, organic textures, wide-angle perspectives',
    content_approach: 'Journey stories, unconventional approaches, discovery-led content, "what I learned" narratives, anti-mainstream takes',
    shadow_traits: ['Restlessness', 'Commitment issues', 'Reinventing the wheel', 'Never finishing what they start'],
    complementary_archetypes: ['Sage', 'Creator', 'Rebel'],
    real_world_examples: ['Patagonia', 'Jeep', 'REI', 'National Geographic', 'Airbnb'],
    storybrand_guide_style: 'The seasoned trail guide who has explored the wilderness before — shows the hero the path less traveled and equips them for the journey',
    differentiation_angle: 'Unconventional approach — we go where others will not, find what others miss, and bring back insights from the frontier',
    emotional_hook: 'The excitement of a new path and the deep satisfaction of discovering something authentic — not pre-packaged',
    content_pillars: ['Unconventional strategies', 'Discovery stories', 'Behind-the-curtain looks', 'Path-breaking case studies', 'Freedom frameworks'],
    sales_approach: 'Invite to convert — show the adventure, paint the new territory, make staying still feel like the real risk',
  },
  rebel: {
    name: 'The Rebel',
    motto: 'Rules are meant to be broken',
    core_desire: 'Revolution — to overturn what is not working',
    goal: 'To destroy what is not working and build something better in its place',
    greatest_fear: 'Being powerless, ineffectual, or co-opted by the system',
    strategy: 'Disrupt, shock, challenge the status quo, break conventions',
    weakness: 'Crossing into truly destructive territory; rebellion for its own sake',
    talent: 'Radical freedom, outrageousness, and the courage to tear down broken systems',
    brand_voice: ['Provocative', 'Bold', 'Unapologetic', 'Raw', 'Disruptive'],
    brand_message_themes: ['Disruption', 'Revolution', 'Anti-establishment', 'Liberation', 'Breaking rules'],
    customer_experience: 'Feels like part of a movement — rebellious, empowered, and finally free from the status quo',
    customer_promise: 'We will tear down the broken system and build something that actually works — no sacred cows',
    brand_culture: 'Challenger mentality, questions everything, values disruption and radical honesty over comfort',
    color_associations: ['Black', 'Red', 'Electric blue', 'Neon accents', 'Dark grey'],
    visual_style: 'Edgy, high-contrast, raw textures, grunge elements, bold typography, street art influences',
    content_approach: 'Hot takes, controversial opinions, industry call-outs, myth-busting, counter-narrative content',
    shadow_traits: ['Nihilism', 'Outrage addiction', 'Destroying without building', 'Alienating potential allies'],
    complementary_archetypes: ['Hero', 'Magician', 'Explorer'],
    real_world_examples: ['Harley-Davidson', 'Virgin', 'Diesel', 'BrewDog', 'Cards Against Humanity'],
    storybrand_guide_style: 'The renegade mentor who calls out the lies the hero has been told — names the real villain and gives permission to fight back',
    differentiation_angle: 'Radical honesty — we say what the industry whispers, call out what is broken, and offer the antidote',
    emotional_hook: 'The visceral satisfaction of finally hearing someone say what you have been thinking — and the courage to act on it',
    content_pillars: ['Industry call-outs', 'Myth destruction', 'Counter-narratives', 'Hot takes', 'Movement building'],
    sales_approach: 'Provoke to convert — call out the problem, name the enemy publicly, make inaction feel like complicity',
  },
  magician: {
    name: 'The Magician',
    motto: 'I make things happen',
    core_desire: 'To understand the fundamental laws of the universe and create transformation',
    goal: 'To make dreams come true through mastery of transformative processes',
    greatest_fear: 'Unintended negative consequences; manipulation',
    strategy: 'Develop a vision and live by it; find win-win solutions',
    weakness: 'Manipulation; becoming disconnected from reality',
    talent: 'Finding win-win outcomes and catalyzing transformation that seems impossible',
    brand_voice: ['Transformative', 'Visionary', 'Charismatic', 'Mystical', 'Confident'],
    brand_message_themes: ['Transformation', 'Possibility', 'Breakthrough', 'Magic', 'Catalytic change'],
    customer_experience: 'Feels like experiencing a breakthrough — seeing possibilities they never knew existed',
    customer_promise: 'We will transform your current reality into the extraordinary outcome you thought was impossible',
    brand_culture: 'Transformation-obsessed, believes in extraordinary outcomes, pushes the boundaries of what seems possible',
    color_associations: ['Deep purple', 'Gold', 'Midnight blue', 'Emerald', 'Iridescent tones'],
    visual_style: 'Mystical, premium, transformative imagery, dramatic lighting, before/after contrasts',
    content_approach: 'Transformation case studies, "aha moment" content, paradigm-shifting frameworks, visualizing possibilities',
    shadow_traits: ['Manipulation', 'Over-promising', 'Guru complex', 'Creating dependency rather than capability'],
    complementary_archetypes: ['Creator', 'Sage', 'Hero'],
    real_world_examples: ['Disney', 'Tesla', 'Dyson', 'Masterclass', 'Tony Robbins'],
    storybrand_guide_style: 'The powerful mentor who reveals the hidden mechanism — shows the hero that transformation is possible through a specific, almost magical process',
    differentiation_angle: 'Transformative process — we do not just improve, we fundamentally transform the outcome through a proprietary mechanism',
    emotional_hook: 'The awe of seeing what seemed impossible become real — and realizing you can access that transformation too',
    content_pillars: ['Transformation stories', 'Paradigm shifts', 'Before/after reveals', 'Hidden mechanisms', 'Breakthrough moments'],
    sales_approach: 'Transform to convert — show the dramatic before/after, reveal the mechanism, make the transformation feel inevitable with your system',
  },
  ruler: {
    name: 'The Ruler',
    motto: 'Power is not everything — it is the only thing',
    core_desire: 'Control and order — to create a prosperous, successful environment',
    goal: 'To create a prosperous, successful family, company, or community',
    greatest_fear: 'Chaos, being overthrown, losing control',
    strategy: 'Exercise power and leadership; create order from chaos',
    weakness: 'Being authoritarian; inability to delegate or trust',
    talent: 'Responsibility, leadership, and the ability to create order and prosperity',
    brand_voice: ['Commanding', 'Authoritative', 'Premium', 'Structured', 'Decisive'],
    brand_message_themes: ['Control', 'Success', 'Leadership', 'Order', 'Excellence'],
    customer_experience: 'Feels powerful, in control, and like they are accessing the premium tier — the best of the best',
    customer_promise: 'We will give you control, structure, and the leadership tools to dominate your domain',
    brand_culture: 'Excellence-driven, hierarchical clarity, values accountability and structured achievement',
    color_associations: ['Black', 'Gold', 'Deep burgundy', 'Navy', 'Platinum'],
    visual_style: 'Premium, structured, architectural photography, symmetry, luxury materials, bold serif typography',
    content_approach: 'Leadership frameworks, success systems, structured methodologies, exclusive insights, standards and benchmarks',
    shadow_traits: ['Rigidity', 'Control-freakery', 'Elitism', 'Inability to be vulnerable'],
    complementary_archetypes: ['Hero', 'Sage', 'Magician'],
    real_world_examples: ['Rolex', 'Mercedes-Benz', 'Microsoft', 'American Express', 'Bloomberg'],
    storybrand_guide_style: 'The powerful sponsor who gives the hero the resources and structure to succeed — provides the system, the standards, and the authority',
    differentiation_angle: 'Premium standard — we operate at a level of excellence that others aspire to but cannot sustain',
    emotional_hook: 'The satisfaction of being in control, having the premium solution, and knowing you chose the best',
    content_pillars: ['Leadership strategies', 'Systems and frameworks', 'Industry standards', 'Success metrics', 'Executive insights'],
    sales_approach: 'Command to convert — position as the premium choice, emphasize exclusivity and standards, make the alternative feel risky',
  },
  caregiver: {
    name: 'The Caregiver',
    motto: 'Love your neighbor as yourself',
    core_desire: 'To protect and care for others',
    goal: 'To help others through service, generosity, and compassion',
    greatest_fear: 'Selfishness, ingratitude, being unable to help',
    strategy: 'Do things for others; anticipate needs and respond with generosity',
    weakness: 'Martyrdom; being exploited; enabling dependency',
    talent: 'Compassion, generosity, and the ability to create environments of safety and belonging',
    brand_voice: ['Warm', 'Nurturing', 'Supportive', 'Gentle', 'Reassuring'],
    brand_message_themes: ['Care', 'Protection', 'Service', 'Community', 'Belonging'],
    customer_experience: 'Feels safe, supported, and genuinely cared for — like someone finally has their back',
    customer_promise: 'We will take care of you through every step — you are not alone in this',
    brand_culture: 'Service-first, empathetic, values people over profits, celebrates generosity and genuine care',
    color_associations: ['Soft blue', 'Warm white', 'Sage green', 'Peach', 'Soft lavender'],
    visual_style: 'Warm, soft, human photography, gentle gradients, rounded shapes, approachable typography',
    content_approach: 'Helpful guides, supportive community content, customer success stories, behind-the-care content, empathetic problem-solving',
    shadow_traits: ['Over-giving to the point of burnout', 'Guilt-based marketing', 'Creating dependency', 'Avoiding tough love'],
    complementary_archetypes: ['Innocent', 'Everyman', 'Sage'],
    real_world_examples: ['Johnson & Johnson', 'UNICEF', 'Campbell\'s', 'Volvo', 'Dove'],
    storybrand_guide_style: 'The nurturing mentor who provides safety and support — shows the hero they are cared for, removes fear, and walks beside them',
    differentiation_angle: 'Genuine care — we do not just deliver a service, we genuinely invest in your wellbeing and success',
    emotional_hook: 'The relief of being genuinely supported and the trust that comes from knowing someone truly cares about your outcome',
    content_pillars: ['Helpful how-tos', 'Customer care stories', 'Community building', 'Supportive frameworks', 'Wellness and wellbeing'],
    sales_approach: 'Nurture to convert — build trust through genuine help, reduce fear and risk, demonstrate care before asking for commitment',
  },
  innocent: {
    name: 'The Innocent',
    motto: 'Free to be you and me',
    core_desire: 'To experience happiness and get to paradise',
    goal: 'To be happy and create a simple, honest experience',
    greatest_fear: 'Doing something wrong or bad; being punished for it',
    strategy: 'Do things right; be optimistic, pure, and good',
    weakness: 'Being naive; denial that problems exist; boring others',
    talent: 'Faith, optimism, and the ability to see the good in everything',
    brand_voice: ['Optimistic', 'Honest', 'Simple', 'Pure', 'Wholesome'],
    brand_message_themes: ['Simplicity', 'Happiness', 'Goodness', 'Purity', 'Nostalgia'],
    customer_experience: 'Feels refreshed, hopeful, and like things can be simple and good again — no complexity, no catch',
    customer_promise: 'We will keep it simple, honest, and good — what you see is what you get',
    brand_culture: 'Integrity-driven, values simplicity and transparency, celebrates goodness over cleverness',
    color_associations: ['White', 'Sky blue', 'Soft yellow', 'Pastel pink', 'Light green'],
    visual_style: 'Clean, bright, minimal, lots of whitespace, natural light, simple photography',
    content_approach: 'Simple tips, feel-good stories, transparency content, simplification guides, honest reviews',
    shadow_traits: ['Naivety', 'Over-simplification of complex issues', 'Avoidance of hard truths', 'Dullness'],
    complementary_archetypes: ['Caregiver', 'Everyman', 'Sage'],
    real_world_examples: ['Coca-Cola', 'Dove', 'Whole Foods', 'Innocent Drinks', 'McDonald\'s (classic)'],
    storybrand_guide_style: 'The trusted friend who shows the hero that the path forward is simpler than they think — removes complexity and restores hope',
    differentiation_angle: 'Radical simplicity — in a world of over-complicated solutions, we make it honest and simple',
    emotional_hook: 'The relief of simplicity and the joy of something that just works — no hidden agenda, no fine print',
    content_pillars: ['Simplification guides', 'Feel-good stories', 'Transparency reports', 'Simple solutions', 'Honest comparisons'],
    sales_approach: 'Simplify to convert — remove complexity, be radically transparent, make the buying decision feel safe and easy',
  },
  lover: {
    name: 'The Lover',
    motto: 'You are the only one',
    core_desire: 'To attain intimacy, connection, and sensory experience',
    goal: 'To be in relationship with the people, experiences, and work they love',
    greatest_fear: 'Being alone, unwanted, unloved, disconnected',
    strategy: 'Become more physically and emotionally attractive; create beautiful experiences',
    weakness: 'People-pleasing; losing identity in others; obsession',
    talent: 'Passion, gratitude, appreciation, and the ability to create deep emotional connections',
    brand_voice: ['Passionate', 'Sensory', 'Intimate', 'Elegant', 'Emotional'],
    brand_message_themes: ['Connection', 'Passion', 'Beauty', 'Intimacy', 'Experience'],
    customer_experience: 'Feels desired, special, and emotionally connected — an indulgent, sensory-rich experience',
    customer_promise: 'We will create an experience so beautiful and personal that it feels made exclusively for you',
    brand_culture: 'Passion-driven, values beauty and emotional connection, celebrates relationships and sensory excellence',
    color_associations: ['Deep red', 'Rose gold', 'Champagne', 'Rich plum', 'Warm ivory'],
    visual_style: 'Luxurious, sensory, intimate photography, warm tones, flowing typography, tactile textures',
    content_approach: 'Emotional storytelling, sensory descriptions, personal connection content, behind-the-experience content',
    shadow_traits: ['Superficiality', 'People-pleasing', 'Losing substance for style', 'Manipulation through desire'],
    complementary_archetypes: ['Creator', 'Magician', 'Caregiver'],
    real_world_examples: ['Chanel', 'Godiva', 'Victoria\'s Secret', 'Häagen-Dazs', 'Hallmark'],
    storybrand_guide_style: 'The passionate mentor who shows the hero what a deeply fulfilling experience looks like — awakens desire and shows the path to getting it',
    differentiation_angle: 'Emotional experience — we do not just deliver a product, we create an experience that resonates emotionally',
    emotional_hook: 'The longing for something beautiful and the deep satisfaction of an experience that truly connects',
    content_pillars: ['Emotional stories', 'Sensory showcases', 'Relationship content', 'Beauty in process', 'Personal connection'],
    sales_approach: 'Seduce to convert — create desire through beauty and emotion, make the experience irresistible, appeal to what they truly want',
  },
  jester: {
    name: 'The Jester',
    motto: 'You only live once',
    core_desire: 'To live in the moment with full enjoyment and levity',
    goal: 'To have a great time and lighten up the world',
    greatest_fear: 'Being boring, bored, or causing boredom in others',
    strategy: 'Play, make jokes, be funny — connect through shared laughter and joy',
    weakness: 'Frivolity; wasting time; using humor to avoid real issues',
    talent: 'Joy, humor, and the ability to see the funny side of everything — making people feel good',
    brand_voice: ['Playful', 'Witty', 'Fun', 'Irreverent', 'Light-hearted'],
    brand_message_themes: ['Joy', 'Humor', 'Fun', 'Lightness', 'Living in the moment'],
    customer_experience: 'Feels entertained, delighted, and refreshed — like a breath of fresh air in a serious world',
    customer_promise: 'We will make this fun, memorable, and a hell of a lot more enjoyable than the alternative',
    brand_culture: 'Fun-first, values creativity and humor, celebrates spontaneity and joy over rigidity',
    color_associations: ['Bright yellow', 'Orange', 'Electric pink', 'Lime green', 'Bright blue'],
    visual_style: 'Playful, colorful, cartoon elements, fun illustrations, quirky typography, unexpected layouts',
    content_approach: 'Humor-driven content, memes, playful takes on industry topics, entertainment-first with value baked in',
    shadow_traits: ['Being taken as unserious', 'Using humor to deflect real problems', 'Offensive humor', 'Shallow content'],
    complementary_archetypes: ['Everyman', 'Explorer', 'Rebel'],
    real_world_examples: ['Old Spice', 'M&M\'s', 'Dollar Shave Club', 'Ben & Jerry\'s', 'Mailchimp'],
    storybrand_guide_style: 'The witty companion who makes the hero\'s journey fun — uses humor to disarm, reframe problems playfully, and make the solution feel easy',
    differentiation_angle: 'Entertainment value — in a sea of boring content and dull brands, we are the one you actually enjoy engaging with',
    emotional_hook: 'The pure joy of laughing and the relief of not having to take everything so seriously',
    content_pillars: ['Industry humor', 'Playful how-tos', 'Meme-worthy takes', 'Fun experiments', 'Entertaining stories'],
    sales_approach: 'Entertain to convert — make them laugh, be memorable, lower barriers through fun, then deliver real value underneath the humor',
  },
  everyman: {
    name: 'The Everyman',
    motto: 'All people are created equal',
    core_desire: 'Connection and belonging — to fit in and be accepted',
    goal: 'To belong, connect with others, and create genuine community',
    greatest_fear: 'Standing out, seeming elitist, being left out or exiled',
    strategy: 'Develop ordinary solid virtues; be relatable, be real, blend in',
    weakness: 'Losing yourself to fit in; giving up originality for popularity',
    talent: 'Realism, empathy, and the lack of pretense that makes everyone feel welcome',
    brand_voice: ['Relatable', 'Honest', 'Friendly', 'Down-to-earth', 'Unpretentious'],
    brand_message_themes: ['Belonging', 'Relatability', 'Community', 'Authenticity', 'Equality'],
    customer_experience: 'Feels welcome, understood, and like they belong — no gatekeeping, no pretense',
    customer_promise: 'We are just like you — real, honest, and here to help without the fancy jargon or exclusivity',
    brand_culture: 'Inclusive, no-nonsense, values authenticity and community over status and exclusivity',
    color_associations: ['Warm grey', 'Soft blue', 'Olive green', 'Tan', 'Rust'],
    visual_style: 'Friendly, approachable, real photography (not stock), warm tones, informal layouts, handwritten elements',
    content_approach: 'Relatable stories, community-driven content, "real talk" posts, practical tips without jargon, user-generated content',
    shadow_traits: ['Bland sameness', 'Fear of standing out', 'Mediocrity disguised as humility', 'Lack of aspiration'],
    complementary_archetypes: ['Caregiver', 'Jester', 'Innocent'],
    real_world_examples: ['IKEA', 'Target', 'Budweiser', 'Gap', 'eBay'],
    storybrand_guide_style: 'The relatable neighbor who has been through the same struggle — speaks their language, shares honestly, removes all pretense',
    differentiation_angle: 'Radical relatability — we are not the fancy option, we are the honest one that actually understands your real life',
    emotional_hook: 'The comfort of being understood without judgment and the belonging that comes from a brand that gets your real life',
    content_pillars: ['Real stories', 'Community spotlights', 'Practical tips', 'Behind-the-scenes honesty', 'No-jargon guides'],
    sales_approach: 'Relate to convert — build trust through shared experience, remove all pretension, make the solution feel accessible to everyone',
  },
};

/** Get all archetype names for display */
export function getArchetypeNames(): string[] {
  return Object.values(ARCHETYPE_PROFILES).map(a => a.name);
}

/** Get archetype profile by key (lowercase) or by name */
export function getArchetypeProfile(nameOrKey: string): BrandArchetypeProfile | undefined {
  const key = nameOrKey.toLowerCase().replace(/^the\s+/, '');
  if (ARCHETYPE_PROFILES[key]) return ARCHETYPE_PROFILES[key];
  // Search by name
  return Object.values(ARCHETYPE_PROFILES).find(
    a => a.name.toLowerCase() === nameOrKey.toLowerCase() ||
         a.name.toLowerCase().replace(/^the\s+/, '') === key
  );
}

/** Format archetype profile as a summary string for system prompts */
export function formatArchetypeForPrompt(profile: BrandArchetypeProfile): string {
  return `## BRAND ARCHETYPE PROFILE: ${profile.name}
Motto: "${profile.motto}"
Core Desire: ${profile.core_desire}
Goal: ${profile.goal}
Greatest Fear: ${profile.greatest_fear}
Strategy: ${profile.strategy}
Talent: ${profile.talent}
Weakness: ${profile.weakness}
Brand Voice: ${profile.brand_voice.join(', ')}
Message Themes: ${profile.brand_message_themes.join(', ')}
Customer Experience: ${profile.customer_experience}
Customer Promise: ${profile.customer_promise}
Brand Culture: ${profile.brand_culture}
Content Approach: ${profile.content_approach}
Sales Approach: ${profile.sales_approach}
StoryBrand Guide Style: ${profile.storybrand_guide_style}
Differentiation Angle: ${profile.differentiation_angle}
Emotional Hook: ${profile.emotional_hook}
Content Pillars: ${profile.content_pillars.join(', ')}
Color Associations: ${profile.color_associations.join(', ')}
Visual Style: ${profile.visual_style}
Shadow Traits (avoid): ${profile.shadow_traits.join(', ')}
Complementary Archetypes: ${profile.complementary_archetypes.join(', ')}
Real-World Examples: ${profile.real_world_examples.join(', ')}`;
}

/** Summarize all 12 archetypes for archetype selection question */
export function getAllArchetypesSummary(): string {
  return Object.values(ARCHETYPE_PROFILES).map(a =>
    `**${a.name}** — "${a.motto}"\n  Core desire: ${a.core_desire}. Voice: ${a.brand_voice.join(', ')}. Sales: ${a.sales_approach.split('—')[0].trim()}. Examples: ${a.real_world_examples.slice(0, 3).join(', ')}.`
  ).join('\n\n');
}
