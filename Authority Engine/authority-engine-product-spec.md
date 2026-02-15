# SkaleFlow Authority Engine — Product Specification

## 1. Executive Summary

The Authority Engine is a dedicated PR command centre within SkaleFlow that empowers founder-led businesses to systematically build brand authority through earned and paid media. It provides a visual roadmap, pipeline management, email integration, AI-powered content creation, and a public-facing newsroom — all unified with SkaleFlow's Content Engine for seamless social amplification.

### Core Value Proposition

Most PR tools are built for agencies. The Authority Engine is built for founders who want to build credibility and recognition through channels beyond social media and ads — press releases, magazine features, podcast appearances, live events, news articles, and thought leadership — without needing a PR team.

### Five Core Sub-Systems

- **Authority Pipeline** — A PR-specific CRM for managing outreach, correspondence, and deal tracking from prospect to amplification.
- **Authority Roadmap** — Gamified progress tracking with tiered quests, activity scoring, and visual progression.
- **PR Packages / Newsroom** — A public-facing press page where journalists can access media kits, press releases, story angles, and request interviews.
- **Media Contacts** — PR-specific contact management with warmth tracking and relationship history.
- **PR Calendar** — Deadline, embargo, publication date, and follow-up tracking with calendar overlay.

---

## 2. System Templates for PR

All templates live under the existing SkaleFlow template system, categorised under a "PR & Authority" collection. Templates are available out of the box and are personalised by AI using brand data from earlier SkaleFlow phases (voice, positioning, story, visual identity).

### 2.1 Press Release Templates

| Template Name | Use Case |
|---|---|
| Product/Service Launch | Announcing a new product, service, or feature to market |
| Company Milestone | Revenue targets, anniversaries, expansion, team growth |
| Partnership Announcement | Joint ventures, strategic alliances, co-marketing |
| Award/Recognition | Industry awards, certifications, "Best Of" placements |
| Event Announcement | Conferences, workshops, webinars, speaking engagements |
| Executive Appointment | New hires, promotions, advisory board additions |
| Crisis/Response Statement | Addressing incidents, clarifications, public responses |

### 2.2 Pitch Email Templates

| Template Name | Use Case |
|---|---|
| Cold Outreach to Journalist | First contact with a journalist or editor |
| Cold Outreach to Podcast Host | Pitching yourself as a guest on a podcast |
| Follow-Up (No Response) | Polite follow-up after no reply (5-7 day cadence) |
| Follow-Up (Positive Response) | Advancing the conversation after initial interest |
| Thank You (Post-Publication) | Gratitude after article/episode goes live |
| Introduction via Mutual Connection | Warm intro leveraging a shared contact |
| Event Speaking Proposal | Pitching yourself as a speaker for an event |

### 2.3 PR Document Templates

| Template Name | Use Case |
|---|---|
| Media Advisory | Event invitation specifically for press attendance |
| Speaker One-Sheet | One-page overview for event organisers and podcast hosts |
| Company Fact Sheet | Key stats, milestones, and facts for journalist reference |
| Founder Bio (Short) | 150-word professional biography |
| Founder Bio (Long) | 400-word detailed biography with background and achievements |
| Boilerplate Paragraph | Standard 2-3 sentence company description for press use |

### 2.4 Social Amplification Templates (7-Post Structure)

| Post # | Type | Purpose |
|---|---|---|
| 1 (Day 1) | The Announcement | Official announcement linking to the published piece |
| 2 (Day 2) | The Key Insight | One powerful insight repackaged as thought leadership |
| 3 (Day 3) | Behind-the-Scenes | The story behind the story — humanises the brand |
| 4 (Day 5) | The Data/Proof Point | A specific stat or result as a visual-friendly post |
| 5 (Day 7) | The Audience Question | Engagement post related to the article's theme |
| 6 (Day 10) | The Thank You | Tag the journalist/publication, build relationship |
| 7 (Day 14) | The Callback | Reference the article in context of new insight |

---

## 3. PR Activity Categories

Each pipeline card is assigned to one of these categories. Categories determine available templates, scoring weights, and quest requirements.

| Category | Examples | Base Score |
|---|---|---|
| Press Releases | Product launch, milestone, partnership, award, event | 10 pts |
| Media Placements | Newspaper article, online publication, trade journal | 15-50 pts |
| Magazine Features | Profile piece, expert column, contributed article | 40 pts |
| Podcast Appearances | Guest interview, co-host spot, own podcast launch | 15-30 pts |
| Live Events | Speaking engagement, panel, workshop, webinar | 30 pts |
| TV / Video | News segment, YouTube interview, documentary feature | 35 pts |
| Awards & Recognition | Industry award, "Best of" list, certification | 25 pts |
| Thought Leadership | Op-ed, LinkedIn article, research paper, book | 10 pts |

### Scoring Modifiers

- **Reach Tier** — Local (1x), Regional (1.5x), National (2.5x), International (3.5x)
- **Engagement Type** — Earned media = full points. Paid/Sponsored = 0.65x multiplier.
- **Amplification Bonus** — +25% if a social amplification campaign is run for the activity.
- **Round Completion Bonus** — +15% bonus on all activities within a completed round.
- **Consistency Bonus** — Maintaining 2+ published pipeline cards per month awards 10% bonus for that month.

---

## 4. Authority Pipeline (PR-Specific CRM)

The Authority Pipeline is a **separate entity** from the sales pipeline, built specifically for PR workflow. It uses the same drag-and-drop UI components and notification infrastructure but has its own tables, stages, fields, and relationships.

### 4.1 Pipeline Stages

| Stage | Description | Key Actions |
|---|---|---|
| **Inbound** | A PR contact reached out to YOU via press page form, email, or referral | Review inquiry, respond, qualify opportunity |
| **Prospect** | You've identified a target but haven't made contact | Research contact, review their work, prepare pitch, generate AI pitch email |
| **Pitched** | Outreach has been sent | Track sent date, auto-set 5-day follow-up reminder, attach email thread |
| **In Discussion** | They responded — conversation is active | Log correspondence, phone notes, meeting notes, track requirements |
| **Agreed** | Both parties confirmed the placement | Lock in details: format, angle, deadline, embargo date, publication date. First "Push to Campaign" trigger available (pre-launch hype) |
| **Content Prep** | Preparing the actual content or assets | AI-assisted writing, checklist of required assets, deadline countdown |
| **Submitted** | Content/assets sent to publication or host | Track submission date, expected response timeline, follow-up reminder |
| **Published** | The piece is live | Log live URL, upload screenshots/PDF, auto-update media coverage. Second "Push to Campaign" trigger (full 7-post amplification) |
| **Amplified** | Social campaign launched via Content Engine | Unified view: PR activity + linked social campaign + engagement metrics |
| **Archived** | Completed and closed | Feeds into Authority Score, media coverage log, and public newsroom |

### Additional Statuses (Non-Stage)

- **Declined** — The contact said no. Tracks reason: Not Relevant, Bad Timing, Wrong Contact, Full Editorial Calendar, Budget Constraints, Other (free text).
- **No Response** — Pitched but no reply after follow-up sequence. Can be re-activated later.
- **On Hold** — Paused by either party. Tracks reason and expected resume date.

### 4.2 Pipeline Card Fields

#### Core Fields

- Opportunity Name (auto-generated or custom)
- PR Activity Category (from Section 3)
- Target Outlet / Publication / Platform
- Contact Person (linked to Media Contacts)
- Story Angle (select from pre-built or custom)
- Current Stage
- Priority (Low, Medium, High, Urgent)
- Target Date / Desired Publication Date
- Notes (rich text)

#### Commercial Details

- **Engagement Type** — Paid, Unpaid (earned media), Contra/Exchange, Sponsored
- **Deal Value** — Currency amount (ZAR default, user-selectable). The cost the outlet is charging. Applicable when type is Paid or Sponsored.
- **Payment Status** — Not Yet Invoiced, Invoiced, Paid, Overdue
- **Payment Terms** — Upfront, 50/50, On Publication, Net 30, Custom
- **Invoice Reference** — Optional reference number for bookkeeping
- **Budget Notes** — Free text for negotiation details, contra terms, etc.

#### Publication Details (populated at Agreed stage and beyond)

- Confirmed Format (article, interview, podcast episode, column, etc.)
- Confirmed Angle / Topic
- Content Submission Deadline
- Expected Publication Date
- Embargo Date (if applicable)
- Live URL (populated at Published stage)
- Screenshots / PDF upload

#### Correspondence Log

- Email threads (synced via BCC integration or manual attachment)
- Phone call notes (manual entry with date/time)
- Meeting notes
- File attachments

#### Asset Checklist (auto-generated based on activity category)

The system generates a task checklist at the Content Prep stage based on the activity type. Example for a magazine feature: headshot sent, bio sent, fact sheet sent, product images sent, brand guidelines sent, draft approved.

### 4.3 Financial Summary Bar

The pipeline view displays a financial summary bar at the top:

- **Total Committed Spend** — sum of deal values across all active pipeline cards where engagement type is Paid or Sponsored
- **Total Paid** — sum where payment status is Paid
- **Total Pending** — sum where payment status is Not Yet Invoiced or Invoiced
- **Total Overdue** — sum where payment status is Overdue

### 4.4 Pipeline Entry Points

- **Entry Point A: Authority Engine Form** — User clicks "New PR Opportunity" and completes a structured form: target outlet, contact person, opportunity type, desired story angle, engagement type, deal value (if paid), target date, and notes. Card created at Prospect stage.
- **Entry Point B: Public Press Page Inquiry** — A journalist finds the user's newsroom, clicks "Request Interview" or "Media Inquiry," and fills in their details and interest area. Auto-creates a pipeline card at Inbound stage with the journalist's details pre-filled.
- **Entry Point C: Manual Quick-Add** — Popup form for on-the-go logging. Fields: name, outlet, quick note, opportunity type. Card created at Prospect.
- **Entry Point D: Email Capture** — User emails a PR contact with the BCC address. System creates or matches a pipeline card, attaches the email thread, and places it at Pitched stage automatically.

---

## 5. Email Integration

### 5.1 Phase 1: BCC/Forwarding Method (Launch)

Each organisation gets a unique inbound email address: `pr-[org-id]@inbound.skaleflow.app`. When the user BCCs or forwards an email to this address, the system:

1. Receives the email via inbound webhook (e.g. SendGrid, Postmark, or Mailgun inbound parse)
2. Extracts sender, recipient, subject, body, and attachments
3. Matches the external email address against existing Media Contacts
4. If matched: attaches the email to the relevant pipeline card as a correspondence entry
5. If no match: creates a new Media Contact and a new pipeline card at Prospect/Pitched stage
6. Threads subsequent emails in the same conversation together using subject line and email headers

### 5.2 Phase 2: Gmail OAuth Integration (Post-Launch)

Full two-way sync via Gmail API with OAuth 2.0:

- Read emails from Gmail and display within pipeline cards
- Send emails directly from SkaleFlow (appears in Gmail sent folder)
- Auto-detect PR-related threads based on linked Media Contact email addresses
- Thread tracking with real-time sync

Note: Gmail API requires Google's verification process (privacy policy review, security assessment). Plan 4-6 weeks for approval.

### 5.3 Phase 3: Outlook/Microsoft 365 (Future)

IMAP/SMTP integration for custom email domains and Microsoft 365 accounts.

---

## 6. Media Contacts Management

### 6.1 Contact Record Fields

- Full Name
- Outlet / Publication / Platform
- Role (Journalist, Editor, Podcast Host, Event Organiser, PR Agent, Other)
- Beat / Topic Area (e.g. Technology, Business, Lifestyle, Industry-Specific)
- Email Address (primary)
- Phone Number
- Social Media Links (LinkedIn, X/Twitter)
- Location / Region
- Notes (free text)
- Warmth Rating: Cold → Warm → Hot → Active → Published
- Source (manual entry, press page inquiry, email capture, CSV import)

### 6.2 Relationship Timeline

Each media contact profile displays a full chronological history:

- Every pipeline card they are associated with (with current stage and outcome)
- Every email exchanged (synced via BCC or Gmail integration)
- Every published piece resulting from the relationship
- Phone call and meeting notes
- Warmth rating changes over time

### 6.3 Duplicate Detection

Matching logic when a new contact is added:

- Primary match: email address (exact match)
- Secondary match: name + outlet combination (fuzzy match)
- When a potential duplicate is detected, the user is prompted to merge or keep separate
- Merge combines all pipeline history, correspondence, and notes into a single record

### 6.4 Contact Database Approach

For launch, users build their own contact lists. No shared/curated journalist database. Future consideration: opt-in community sharing.

---

## 7. Public Newsroom / Press Page

Accessible at `skaleflow.app/press/[org-slug]`. No authentication required.

### 7.1 Page Sections

**Hero Section** — Brand name, logo, tagline, and a one-liner. Auto-populated from brand profile.

**Latest News** — Published press releases and media coverage cards in reverse chronological order. Each card shows: headline, date, source/publication name, short excerpt, category tag, and read-more link. Cards for paid/sponsored placements display a subtle "Paid Partnership" tag for transparency. Earned media cards get no tag, which implicitly signals their legitimacy.

**Media Kit** — Downloadable assets: headshots (multiple crops), logos (PNG, SVG), fact sheet (PDF), boilerplate (copyable text), brand guidelines summary. All downloadable individually or as zip.

**Story Angles** — Pre-packaged story ideas with brief descriptions. Each angle has a title, 2-3 sentence description, relevant category, and a "Pitch Me About This" button that pre-fills the inquiry form.

**About / Bio** — Founder bio (long version), company overview, key milestones timeline.

**"As Seen In" Bar** — Logos of publications where the brand has been featured. Auto-populated from Published pipeline cards.

**Contact & Request Forms** — Two forms: "Media Inquiry" (general press question) and "Request Interview" (specific interview request). Both capture: journalist name, outlet, email, topic of interest, deadline. Both feed directly into the Authority Pipeline as Inbound cards.

### 7.2 Hosting Approach

Launch: path-based URL (`skaleflow.app/press/[org-slug]`). Future premium feature: custom domain support (`press.clientbrand.com`) with SSL provisioning and DNS verification.

---

## 8. Authority Roadmap & Scoring System

### 8.1 Authority Tiers

| Tier | Name | Points | Requirements |
|---|---|---|---|
| 1 | Foundation | 0–50 | Press kit complete, first press release written, 3 media contacts added, first pitch sent |
| 2 | Emerging | 50–150 | First published article, first podcast appearance, first amplification campaign, 5 media contacts |
| 3 | Rising | 150–400 | 5+ published placements, 2+ podcast appearances, 1 speaking engagement, consistent monthly PR activity |
| 4 | Established | 400–800 | Magazine feature, 10+ total placements, 3+ contacts at "Published" warmth, recurring media opportunities |
| 5 | Authority | 800+ | Keynote invitations, national media coverage, thought leader recognition, inbound exceeds outbound |

Scoring visibility is **internal only**. The public press page shows social proof ("Featured in 12 publications") and "As Seen In" logos rather than a numerical score.

### 8.2 Activity Scoring

| Activity | Base | Local | Regional | National | International |
|---|---|---|---|---|---|
| Press Release Published | 10 | 10 | 15 | 25 | 35 |
| News Article / Media Placement | 15 | 15 | 23 | 38 | 53 |
| Magazine Feature | 40 | 40 | 60 | 100 | 140 |
| Podcast (Niche/Small) | 15 | 15 | 23 | 38 | 53 |
| Podcast (Established) | 30 | 30 | 45 | 75 | 105 |
| Speaking Engagement | 30 | 30 | 45 | 75 | 105 |
| TV / Video Segment | 35 | 35 | 53 | 88 | 123 |
| Award / Recognition | 25 | 25 | 38 | 63 | 88 |
| Thought Leadership Piece | 10 | 10 | 15 | 25 | 35 |

### 8.3 Quests

Quests are structured bundles of activities that guide the user through each tier. Can be SkaleFlow-prescribed (recommended path) or user-customised.

**Example Quest: "Media Debut" (Tier 2)**

- Get 1 article published in any outlet
- Complete 1 podcast appearance
- Run 1 full amplification campaign via Push to Campaign
- Reach 5 media contacts in your database
- Earn 50+ total authority points

**Round Structure** — A "round" is a user-defined or system-suggested bundle of activities. Default round template: 1 press release + 1 podcast appearance + 1 news article + 1 magazine pitch + 5 social amplification posts. Completing a full round within 60 days earns the round completion bonus.

---

## 9. Push to Campaign (Content Engine Integration)

### 9.1 At Agreed Stage (Pre-Launch Hype)

1. User clicks "Push to Campaign" on the pipeline card
2. System presents a pre-launch campaign option: 2-3 teaser posts
3. AI generates anticipation posts: "Exciting news coming soon — we'll be sharing a big announcement with [Publication]. Stay tuned!"
4. User reviews, edits, selects channels, sets schedule, approves

### 9.2 At Published Stage (Full Amplification)

1. User clicks "Push to Campaign." System shows summary of the PR activity
2. User selects connected social channels and campaign type: Standard (7 posts / 14 days) or Express (3 posts / 5 days)
3. AI generates posts using the 7-post structure from Section 2.4, personalised with brand voice
4. User reviews all posts, edits as needed, adjusts scheduling, approves
5. Posts scheduled in Content Engine, each tagged with back-reference to Authority Engine pipeline card
6. Pipeline card's Amplified view shows: original PR activity + linked social posts + engagement metrics

---

## 10. PR Calendar

### 10.1 Calendar Events (Auto-Populated)

- Content submission deadlines (from pipeline cards at Agreed/Content Prep)
- Expected publication dates
- Embargo lift dates (blocks Push to Campaign until lifted)
- Follow-up reminders (auto-set at Pitched stage, customisable cadence)
- Scheduled speaking engagements and live events
- Amplification campaign post dates (synced from Content Engine)
- Quest deadlines (if the user sets a target completion date)

### 10.2 Calendar Views

- Monthly view — overview of all PR activities and deadlines
- Weekly view — detailed day-by-day with time slots
- List/Agenda view — chronological list of upcoming events and deadlines
- Pipeline overlay — calendar entries colour-coded by pipeline stage

---

## 11. Embargo Management

### 11.1 Embargo Workflow

1. User sets an embargo date on the pipeline card at the Agreed stage
2. System displays a visible "EMBARGO ACTIVE" badge on the card with countdown
3. "Push to Campaign" button is disabled with tooltip: "Embargo active until [date]. Social amplification will be available after the embargo lifts."
4. On embargo lift date, system sends notification: "Embargo lifted for [Article Name]. Ready to amplify?"
5. Push to Campaign button becomes active

This prevents accidental premature social posting, which can destroy journalist relationships and result in pulled articles.

---

## 12. Notification System

### 12.1 Notification Triggers

| Trigger | Message Example | Timing |
|---|---|---|
| Follow-up due | "Follow-up due for [Journalist] — last contact 7 days ago" | 5 days after pitch (configurable) |
| Publication date approaching | "Your article in [Publication] is expected to publish in 3 days" | 3 days before expected date |
| Embargo lifting | "Embargo on [Article] lifts tomorrow — pre-schedule your campaign?" | 1 day before embargo date |
| Inbound inquiry | "[Journalist] submitted an inquiry via your press page 2 hours ago" | Immediately |
| Content deadline approaching | "Content submission due in 2 days for [Publication]" | 3 days and 1 day before deadline |
| Published piece detected | "Your article in [Publication] was published — ready to amplify?" | When user logs Published status |
| Quest milestone reached | "You're 1 activity away from completing the Media Debut quest!" | When close to completion |
| Payment overdue | "Invoice for [Publication] is overdue by 7 days" | On overdue date, then weekly |
| No activity warning | "You haven't had any PR activity in 30 days. Your consistency bonus is at risk." | After 30 days inactivity |
| Seasonal PR prompt | "International Women's Day is in 3 weeks — do you have a story angle?" | 3-4 weeks before key dates |

### 12.2 Notification Channels

- In-app notification centre (bell icon with badge count)
- Email digest (daily or weekly summary of pending actions, configurable)
- Push notifications (mobile app, if applicable)

---

## 13. Analytics Dashboard

### 13.1 Key Metrics

- **Total Media Placements** — Cumulative count over time, with trend line
- **Pipeline Conversion Rate** — Pitched → Published percentage
- **Average Time to Publication** — Days from Pitched to Published
- **PR Activity Breakdown** — Pie/bar chart by category
- **Top Performing Publications** — Ranked by social amplification engagement
- **Earned vs Paid Split** — Ratio of earned media to paid placements
- **Budget Spend vs Activity** — Total spend mapped against published placements
- **Contact Relationship Health** — Distribution of contacts by warmth level
- **Monthly Activity Trend** — Line chart showing PR activities per month

### 13.2 Per-Activity ROI (Future Feature)

When a paid placement is amplified and engagement data is available: spend (deal value) vs. social reach, engagement, and link clicks. Tangible ROI metric for paid PR.

---

## 14. AI-Powered Features

- **AI Press Release Writer** — Generates complete press releases from minimal inputs using brand voice from Phase 3 and selected template.
- **AI Pitch Email Generator** — Personalised pitch emails based on journalist's beat, story angle, and relationship warmth.
- **AI Story Angle Finder** — Analyses brand outputs, milestones, and trends to suggest 3-5 newsworthy angles with headline, pitch summary, and target publications.
- **AI Follow-Up Intelligence** — Smart follow-up suggestions based on time since contact, response patterns, and optimal cadence. Generates follow-up copy.
- **AI Social Amplification** — The 7-post generation engine for Push to Campaign. Platform-specific content maintaining brand voice.
- **AI Content Repurposing Suggestions** — Analyses published PR pieces and suggests: standalone social posts, infographics, blog transcriptions, visual quote cards.
- **AI Seasonal/Timely PR Prompts** — Proactive notifications about upcoming events, awareness days, and industry dates relevant to the user's brand.

---

## 15. Decline and Dead Opportunity Tracking

### 15.1 Declined Status

When a pitch is explicitly declined, user records:

- Decline reason: Not Relevant, Bad Timing, Wrong Contact, Full Editorial Calendar, Budget Constraints, Other
- Whether the contact suggested trying again later (and when)
- Whether the contact referred the user to someone else

### 15.2 No Response Status

After follow-up sequence (default 3 attempts over 21 days), card moves to No Response. User can:

- Archive the opportunity
- Re-activate later (moves back to Prospect with history preserved)
- Set a "try again in X months" reminder

### 15.3 Analytics from Declined/Dead Data

- Pitch success rate: (Published / Total Pitched) × 100
- Decline rate by category, outlet, and story angle
- Average follow-ups before response
- Best time-of-week and time-of-month for successful pitches

---

## 16. Content Clipping and Proof Collection

### 16.1 Clipping Workflow

- Live URL — direct link to the published piece
- Screenshot upload — for paywalled content or backup
- PDF upload — for print publications or formatted downloads
- Publication logo — uploaded once per outlet, auto-associated with future placements
- Key quotes / highlights — tagged for use in social amplification

### 16.2 Auto-Feed to Newsroom

When a clipping is saved and approved for public display, it automatically appears on the press page under Latest News and adds the publication logo to the "As Seen In" bar.

---

## 17. Team Roles

No new PR-specific roles for launch. Uses existing role system:

- **Owner** — Full access + approval authority
- **Admin** — Full access to pipeline and newsroom management
- **Member** — Can view and contribute but cannot publish to newsroom or approve press releases

Post-launch consideration: granular PR permissions if agency clients need them.

---

## 18. Launch Priorities and Phasing

### 18.1 MVP (April Launch)

- Authority Pipeline with all stages (Inbound through Archived, plus Declined/No Response)
- Pipeline card form with all core fields including commercial details
- Media Contacts management with warmth rating
- Press Kit Builder (pre-populated from brand profile)
- PR system templates (press releases, pitch emails, PR documents)
- AI Press Release Writer and AI Pitch Email Generator
- Push to Campaign integration with Content Engine (7-post amplification)
- Public newsroom page (`skaleflow.app/press/[org-slug]`)
- BCC email capture for correspondence tracking
- Authority Score and tier progression (internal)
- Basic quest system (Foundation and Media Debut quests)
- Notification system for follow-ups, deadlines, and inbound inquiries
- Financial summary bar on pipeline view
- Embargo management with campaign blocking

### 18.2 Phase 2 (Post-Launch)

- Full Gmail OAuth integration (two-way email sync)
- PR Calendar view with all event types
- Analytics dashboard with conversion rates and trend charts
- AI Story Angle Finder
- AI Content Repurposing Suggestions
- Decline analytics
- Contact relationship timeline
- Duplicate contact detection and merge
- Seasonal/timely AI PR prompts
- Advanced quest system (all 5 tiers with custom quests)
- Per-activity ROI tracking

### 18.3 Phase 3 (Future)

- Custom domain support for press pages
- Outlook/Microsoft 365 email integration
- Opt-in community media contact sharing
- Password-protected press pages
- PR-specific team roles and granular permissions
- Multi-language press release generation
- Media monitoring integration
