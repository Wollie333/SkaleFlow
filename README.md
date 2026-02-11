# SkaleFlow

AI-powered brand strategy and content engine for businesses. Build your brand from the ground up with expert AI agents, then generate on-brand content at scale.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **AI Providers**: Anthropic (Claude), Google (Gemini), Groq (Llama)
- **Payments**: Paystack
- **Email**: Resend
- **Deployment**: Vercel

## Design Principles

### Mobile-First Development

SkaleFlow follows a mobile-first responsive design approach. All UI components and pages are designed to work seamlessly from 375px mobile screens to large desktop displays.

**Breakpoints:**
- `sm`: 640px - Large phones landscape, small tablets
- `md`: 768px - Tablets
- `lg`: 1024px - Small laptops, tablets landscape
- `xl`: 1280px - Desktops and larger

**Key Patterns:**
- Grid layouts: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Flexbox stacking: `flex flex-col md:flex-row gap-4`
- Responsive padding: `p-4 md:p-6 lg:p-8`
- Tables: Wrap with `overflow-x-auto` for horizontal scroll
- Touch targets: Minimum 44x44px for all interactive elements

## Features

### Brand Engine
10-phase guided brand strategy powered by expert AI agents (Tony Robbins, Seth Godin, Alex Hormozi, and more). Each phase builds on the last to create a complete brand foundation:

1. **Why** — Purpose, vision, mission
2. **Who** — Ideal customer profiling
3. **Category & Positioning** — Market positioning
4. **Offer Architecture** — Product/service structuring
5. **Positioning Statement** — Competitive differentiation
6. **Messaging Framework** — StoryBrand + voice development
7. **Visual Identity** — Logo, color palettes, typography
8. **Design System** — Complete design language
9. **Growth Engine** — Funnel strategy
10. **Authority Platform** — Personal brand strategy

### Content Engine
Unlocks when Brand Engine is 100% complete. AI-generated content that sounds like your brand:

- Campaign-based content calendars
- Queue-based batch generation
- Multi-platform support (LinkedIn, Facebook, Instagram, Twitter, TikTok)
- Content approval workflows with revision requests
- UTM tracking and analytics
- Brand variable filtering for targeted content

### Sales Pipeline
Visual kanban pipeline with drag-and-drop contact management:

- Custom pipeline stages
- Contact tagging system
- Email templates
- Automation workflows (visual builder with ReactFlow)
- Webhook integrations

### Billing & Credits
- Credit-based AI usage with free model options
- Monthly credit allocations by subscription tier
- Top-up credit packs
- Invoice generation with PDF export
- Paystack payment integration

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- API keys for AI providers

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_ai_key
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key

PAYSTACK_SECRET_KEY=your_paystack_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

RESEND_API_KEY=your_resend_key
```

### Installation

```bash
npm install
npm run dev
```

### Database

Run migrations in order against your Supabase project (001-030 in `supabase/migrations/`).

## Project Structure

```
skaleflow-app/
├── app/
│   ├── (dashboard)/       # Authenticated dashboard pages
│   │   ├── admin/         # Super admin pages
│   │   ├── analytics/     # Content analytics
│   │   ├── billing/       # Credits & invoices
│   │   ├── brand/         # Brand Engine phases
│   │   ├── calendar/      # Content calendar
│   │   ├── content/       # Content creation & reviews
│   │   ├── dashboard/     # Main dashboard
│   │   ├── marketing/     # Ads module (admin only)
│   │   ├── pipeline/      # Sales pipeline
│   │   └── settings/      # Org settings
│   ├── api/               # API routes
│   └── brand/playbook/    # Brand playbook (public share)
├── components/            # React components
├── config/                # Phase config, agents, frameworks
├── hooks/                 # Custom React hooks
├── lib/                   # Server utilities & services
│   ├── ai/                # AI provider abstraction
│   ├── automations/       # Pipeline automation engine
│   ├── billing/           # Invoice service
│   ├── content-engine/    # Content generation & queue
│   ├── marketing/         # Ad platform integrations
│   ├── social/            # Social media publishing
│   └── supabase/          # Database clients
├── supabase/migrations/   # Database migrations (001-030)
└── types/                 # TypeScript type definitions
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — deployed to Vercel |
| `dev`  | Development — all changes go here first |

## License

Proprietary. All rights reserved.
