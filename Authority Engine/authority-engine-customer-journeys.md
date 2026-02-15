# SkaleFlow Authority Engine — Customer Journeys

## Overview

This document defines the complete user journeys for the Authority Engine. Each journey maps the step-by-step flow a user follows, including UI interactions, system behaviours, data creation, and integration points with other SkaleFlow systems.

---

## Journey 1: First-Time Setup

**Trigger:** User navigates to the Authority Engine for the first time.
**Outcome:** Press kit created, contacts imported, email connected, first quest assigned.

### Step 1 — Press Kit Builder

1. System detects this is the user's first visit to Authority Engine
2. Onboarding wizard launches automatically
3. System pulls existing brand data from SkaleFlow brand profile:
   - Logo (from Phase 7/8 brand identity)
   - Brand colours
   - Founder bio (from Phase 3)
   - Company description / boilerplate
   - Tagline and positioning
4. Pre-populated press kit displayed for review
5. User fills in gaps:
   - Upload headshots (multiple crops: square, landscape, portrait)
   - Company fact sheet details (founding date, milestones, team size, market stats, awards)
   - Speaking topics (free text, multiple entries)
   - Story angles (AI suggests 3-5 based on brand positioning from Phase 3)
6. User can accept AI-suggested story angles, edit them, or add custom ones
7. Each story angle has: title, 2-3 sentence description, relevant PR category, target audience
8. User clicks "Save Press Kit"
9. **Data created:** `authority_press_kit` record with all assets and configuration
10. **Data created:** `authority_story_angles` records for each story angle

### Step 2 — Media Contact Import

1. System presents three options: Manual Add, CSV Upload, or Skip
2. **Manual Add:** Form with fields — Full Name, Outlet/Publication, Role (dropdown: Journalist, Editor, Podcast Host, Event Organiser, PR Agent, Other), Beat/Topic Area, Email, Phone, Social Links, Location, Notes
3. **CSV Upload:** User uploads CSV. System maps columns to contact fields. User confirms mapping. Import runs with validation (email format, required fields)
4. Each contact is created with Warmth Rating defaulting to "Cold" and Source set appropriately
5. **Data created:** `authority_contacts` records

### Step 3 — Connect Email (Optional)

1. System generates unique BCC address: `pr-[org-id]@inbound.skaleflow.app`
2. Displays setup instructions with copy-to-clipboard button:
   - "When emailing PR contacts, add this address to BCC"
   - "We'll automatically track the conversation and attach it to the right pipeline card"
3. Option to send a test email to verify the connection works
4. User can skip and set up later from Settings
5. **Data created:** BCC address configuration stored in organisation settings

### Step 4 — First Quest Assignment

1. System assigns the "Foundation" quest automatically
2. Quest card displayed with requirements:
   - ✅ Complete your press kit (already done if Step 1 finished)
   - ☐ Write your first press release (AI-assisted)
   - ☐ Add 3 media contacts (may already be done if Step 2 completed)
   - ☐ Send your first pitch
3. Progress bar shows completion percentage
4. "Go to Dashboard" button takes user to the Authority Engine main view
5. **Data created:** `authority_quests` record with quest assignment and progress tracking

---

## Journey 2: Creating a New PR Opportunity (Outreach Flow)

**Trigger:** User wants to get featured in a local newspaper.
**Outcome:** Pipeline card created, pitch sent, conversation tracked through to publication and amplification.

### Phase A: Creating the Opportunity

1. User clicks "New PR Opportunity" button on Authority Engine dashboard
2. Authority Engine form opens with fields:
   - **Opportunity Name** — auto-generated from outlet + category, or custom
   - **PR Activity Category** — dropdown: Press Releases, Media Placements, Magazine Features, Podcast Appearances, Live Events, TV/Video, Awards & Recognition, Thought Leadership
   - **Target Outlet** — free text with autocomplete from previously used outlets
   - **Contact Person** — search existing media contacts OR "Add New Contact" inline
   - **Story Angle** — dropdown of pre-built angles from press kit + "Custom Angle" option
   - **Engagement Type** — Paid, Unpaid (Earned Media), Contra/Exchange, Sponsored
   - **Deal Value** — currency field, visible when Engagement Type is Paid or Sponsored
   - **Payment Terms** — dropdown: Upfront, 50/50, On Publication, Net 30, Custom (visible when Paid/Sponsored)
   - **Priority** — Low, Medium, High, Urgent
   - **Target Date** — date picker for desired publication date
   - **Notes** — rich text field
3. User fills form and submits
4. **Data created:** `authority_pipeline_cards` record at **Prospect** stage
5. **Data created:** `authority_commercial` record if engagement type is Paid/Sponsored
6. System prompts: "Would you like to generate a pitch email for this contact?"

### Phase B: Pitching

7. User clicks "Yes" on pitch email prompt
8. AI Pitch Email Generator activates:
   - Pulls brand voice from Phase 3
   - Uses selected story angle
   - References the journalist's beat/publication (from media contact record)
   - Adjusts tone based on warmth rating (Cold = more context/credibility, Warm = more direct)
9. Generated pitch displayed in editor for review and editing
10. User copies the pitch, opens their email client, composes email to journalist with BCC to `pr-[org-id]@inbound.skaleflow.app`
11. Email is sent
12. BCC system receives the email, matches it to the pipeline card via journalist's email address
13. Pipeline card **automatically moves to Pitched** stage
14. System sets a **follow-up reminder for 5 business days** (configurable)
15. **Data created:** `authority_correspondence` record with email content attached to pipeline card
16. Pipeline card now shows: pitch date, pitch content, follow-up reminder date

### Phase C: In Discussion

17. Journalist replies to the email (user replies with BCC)
18. Reply captured by BCC system, threaded under existing correspondence
19. Pipeline card moves to **In Discussion** (automatic if email detected, or manual)
20. All subsequent emails in the thread appear chronologically on the card
21. User can also log phone calls: "Add Phone Note" button → date/time, duration, summary
22. User can add meeting notes: "Add Meeting Note" → date, attendees, notes, action items
23. **Data created:** Additional `authority_correspondence` records for each interaction

### Phase D: Agreed

24. Journalist confirms they want to run the article
25. User updates pipeline card to **Agreed** stage
26. New fields become editable:
    - **Confirmed Format** — dropdown: feature article, news piece, column, interview, etc.
    - **Confirmed Angle/Topic** — text field
    - **Content Submission Deadline** — date picker
    - **Expected Publication Date** — date picker
    - **Embargo Date** — date picker (optional)
27. If embargo date is set: "EMBARGO ACTIVE" badge appears, Push to Campaign is blocked
28. **First "Push to Campaign" trigger becomes available** — pre-launch hype content
29. If user clicks Push to Campaign at this stage: see Journey 4 (Pre-Launch variant)
30. Calendar events auto-created: submission deadline, expected publication date, embargo date
31. **Data updated:** Pipeline card with publication details
32. **Data created:** `authority_calendar_events` records

### Phase E: Content Prep

33. User moves card to **Content Prep** stage
34. System auto-generates an **asset checklist** based on PR Activity Category:
    - For Media Placement: ☐ Headshot sent, ☐ Bio sent, ☐ Fact sheet sent, ☐ Product images sent, ☐ Brand guidelines sent, ☐ Interview questions reviewed
    - For Podcast: ☐ Bio sent, ☐ Headshot sent, ☐ Talking points prepared, ☐ Tech check completed, ☐ Episode details confirmed
    - For Press Release: ☐ Draft written, ☐ Draft reviewed, ☐ Quotes approved, ☐ Supporting images prepared, ☐ Distribution list confirmed
35. User can add custom checklist items
36. Deadline countdown timer visible on card
37. User can use AI Press Release Writer or AI features to prepare content within SkaleFlow
38. User checks off items as they complete them

### Phase F: Submitted

39. User marks card as **Submitted** when all assets/content sent to the publication
40. System records submission date
41. If expected publication date was set, system creates a follow-up reminder for that date
42. Card shows: submission date, days since submission, expected publication countdown

### Phase G: Published

43. Article/piece goes live
44. User clicks "Mark as Published" and fills in:
    - **Live URL** — the link to the published piece
    - **Screenshot upload** — optional, for paywalled content or backup
    - **PDF upload** — optional, for print publications
    - **Publication logo** — upload once per outlet, auto-associated with future placements from same outlet
    - **Key quotes/highlights** — user tags specific quotes for social amplification use
45. System prompts two actions:
    - "Create amplification campaign?" → triggers Journey 4 (Full Amplification)
    - "Add to your public newsroom?" → if yes, creates a newsroom card (see Journey 5)
46. Media contact warmth auto-updates to "Published" if not already
47. **Authority Score points awarded** (based on category, reach tier, engagement type modifiers)
48. **Data created:** `authority_assets` records (clippings, screenshots, logos)
49. **Data created:** `authority_scores` record with point transaction

### Phase H: Amplified

50. After Push to Campaign completes (see Journey 4), card moves to **Amplified**
51. Card now shows unified view:
    - Original PR activity details
    - All linked social media posts from Content Engine campaign
    - Engagement metrics per social post (impressions, clicks, likes, shares)
    - Total amplification reach
52. Link from pipeline card to Content Engine campaign and vice versa

### Phase I: Archived

53. After amplification campaign completes, user can archive the card
54. Card moves to **Archived** status
55. Remains searchable and visible in analytics
56. Feeds into: Authority Score history, media coverage log, public newsroom, and analytics dashboard

---

## Journey 3: Handling Inbound Press Inquiries

**Trigger:** A journalist finds the user's public newsroom and submits an inquiry.
**Outcome:** Pipeline card auto-created, user responds, opportunity managed through pipeline.

1. Journalist visits `skaleflow.app/press/[org-slug]`
2. Browses newsroom: reads press releases, reviews story angles, checks media kit
3. Clicks "Request Interview" button
4. Form appears with fields:
   - Journalist Name (required)
   - Outlet / Publication (required)
   - Email (required)
   - Phone (optional)
   - Topic of Interest (required — free text or select from displayed story angles)
   - Preferred Format (dropdown: article, podcast, video interview, written Q&A, other)
   - Deadline (optional date picker — "When do you need this by?")
   - Additional Notes (optional)
5. Journalist submits form
6. **System automatically:**
   - Creates an `authority_contacts` record (or matches existing contact via email)
   - Creates an `authority_pipeline_cards` record at **Inbound** stage
   - Pre-fills card with all submitted details
   - Sends in-app notification to user: "[Journalist Name] from [Outlet] submitted an interview request via your press page"
   - Sends email notification if enabled
7. User sees the Inbound card on their pipeline
8. User reviews the inquiry and decides to proceed
9. User responds via email (with BCC) or moves card to Prospect/Pitched and follows Journey 2 from Phase B

---

## Journey 4: Push to Campaign (Social Amplification)

**Trigger:** Pipeline card reaches Agreed stage (pre-launch) or Published stage (full amplification).
**Outcome:** Social media campaign created in Content Engine, linked back to Authority Engine.

### Variant A: Pre-Launch Hype (Triggered at Agreed Stage)

1. User clicks "Push to Campaign" on a pipeline card at Agreed stage
2. If embargo is active: button is disabled with message "Embargo active until [date]"
3. If no embargo: system presents pre-launch campaign option
4. Configuration screen:
   - Campaign type: "Pre-Launch Teaser" (2-3 posts)
   - Select social channels (LinkedIn, Facebook, Instagram, X — from connected accounts)
   - Campaign duration: spread over how many days (default: 5 days)
5. AI generates 2-3 teaser posts:
   - Post 1: "Exciting news coming soon — we'll be sharing something special with [Publication]. Stay tuned!"
   - Post 2: "Behind the scenes: we've been working on something big with [Publication]. Can't wait to share more..."
   - Post 3 (optional): Countdown or hint post
6. User reviews, edits each post, adjusts scheduling
7. User approves and launches
8. **Data created:** Campaign in Content Engine with `authority_card_id` back-reference
9. Posts scheduled in Content Engine scheduler

### Variant B: Full Amplification (Triggered at Published Stage)

1. User clicks "Push to Campaign" on a pipeline card at Published stage
2. If embargo is active: button is disabled (should not happen at Published stage, but safety check)
3. System displays PR activity summary:
   - Publication name
   - Article/piece title
   - Live URL
   - Key quotes/highlights (from clipping data)
   - Story angle used
4. Configuration screen:
   - Campaign type: "Standard Amplification" (7 posts / 14 days) or "Express" (3 posts / 5 days)
   - Select social channels
   - Campaign start date (default: today)
5. AI generates posts using the 7-post structure:
   - **Post 1 (Day 1) — The Announcement:** "We're proud to share that [Brand] was featured in [Publication]..." with link
   - **Post 2 (Day 2) — The Key Insight:** One powerful insight from the piece repackaged as thought leadership
   - **Post 3 (Day 3) — Behind-the-Scenes:** "Here's the story behind the story..." humanises the brand
   - **Post 4 (Day 5) — The Data/Proof Point:** A specific stat or result as visual-friendly post
   - **Post 5 (Day 7) — The Audience Question:** Engagement post related to the article's theme
   - **Post 6 (Day 10) — The Thank You:** Tag journalist/publication, express gratitude publicly
   - **Post 7 (Day 14) — The Callback:** Reference article in context of new insight, extends shelf life
6. Each post is platform-adapted: LinkedIn gets professional tone, Instagram gets visual-first copy, X gets punchy takes
7. User reviews all posts in a scrollable preview
8. User can edit any individual post, regenerate it, or remove it
9. User adjusts scheduling per post if needed
10. User approves and launches
11. **Data created:** Campaign in Content Engine with `authority_card_id` back-reference
12. **Data created:** Individual scheduled posts in Content Engine, each tagged with Authority Engine reference
13. Pipeline card moves to **Amplified** stage
14. Pipeline card now displays: linked campaign, scheduled/published posts, engagement metrics (updated as posts go live)

---

## Journey 5: Building the Public Newsroom

**Trigger:** User wants to publish a press release or add a published piece to their newsroom.
**Outcome:** Content published on public press page.

### Variant A: Creating a New Press Release

1. User navigates to "PR Packages" in Authority Engine
2. Clicks "Create New Release"
3. Template selector appears with press release templates:
   - Product/Service Launch
   - Company Milestone
   - Partnership Announcement
   - Award/Recognition
   - Event Announcement
   - Executive Appointment
   - Crisis/Response Statement
4. User selects template
5. AI-assisted editor opens with template structure pre-loaded
6. User fills in key details (varies by template):
   - Headline
   - Subheadline
   - Date
   - Location (e.g. "Nelspruit, South Africa")
   - Body content (guided sections based on template)
   - Quotes (from founder or key stakeholders)
   - Supporting facts/stats
   - Call to action
   - Contact information
7. AI drafts the full press release using:
   - Brand voice from Phase 3
   - Template structure
   - User-provided details
   - Boilerplate paragraph from press kit
8. User reviews and edits in rich text editor
9. Press release status: **Draft** → **In Review** → **Published**
10. At "In Review": if team roles apply, owner/admin must approve
11. At "Published": press release goes live on the public newsroom page
12. **Data created:** `authority_press_releases` record with content, status, and metadata
13. Public newsroom auto-updates: new card appears under "Latest News" with headline, date, excerpt

### Variant B: Adding a Published Piece to Newsroom

1. From a pipeline card at Published stage, system prompts "Add to your public newsroom?"
2. User clicks yes
3. System creates a newsroom card using:
   - Article title / piece name (from pipeline card)
   - Publication name and logo (from outlet data / uploaded logo)
   - Date published
   - Short excerpt (user-written or AI-generated summary)
   - Live URL link
   - Category tag
   - **Engagement type tag:** If Paid or Sponsored, card displays subtle "Paid Partnership" tag. Earned media gets no tag.
4. User reviews the newsroom card preview
5. User approves for public display
6. **Data updated:** `authority_assets` record flagged as public
7. Press page updates: card appears in Latest News, publication logo added to "As Seen In" bar

---

## Journey 6: Quest Progression and Authority Score

**Trigger:** User completes PR activities over time.
**Outcome:** Points earned, tiers unlocked, quests completed, badges awarded.

### Earning Points

1. When a pipeline card reaches **Published** stage, the system calculates points:
   - Base points from PR Activity Category (e.g. Magazine Feature = 40 base)
   - Reach Tier multiplier applied (e.g. Regional = 1.5x → 60 points)
   - Engagement Type modifier applied (e.g. Earned = 1x → 60 points; Paid = 0.65x → 39 points)
2. Points are provisional at this stage
3. When user runs an amplification campaign (Push to Campaign), Amplification Bonus applies (+25%)
4. If the activity completes a "round," Round Completion Bonus applies (+15%)
5. At month end, if user had 2+ Published cards that month, Consistency Bonus applies (+10% on all that month's points)
6. **Data created:** `authority_scores` record per activity with: base points, modifiers applied, final points, linked pipeline card

### Quest Tracking

7. Dashboard shows current quest with:
   - Quest name and tier
   - Requirements checklist with completion status
   - Progress bar (percentage complete)
   - Points earned vs. tier threshold
8. As user completes activities, quest requirements auto-update:
   - "Get 1 article published" ✅ (when a Media Placement card reaches Published)
   - "Complete 1 podcast appearance" ☐ (still pending)
9. When all quest requirements are met:
   - Celebration animation (confetti, badge unlock)
   - New tier unlocked
   - Next quest presented with clear requirements
   - Badge displayed on Authority Dashboard
10. **Data updated:** `authority_quests` record with completion timestamp and badge reference

### Authority Dashboard Display

11. Dashboard shows at all times:
    - Current tier badge and name (e.g. "Tier 2: Emerging")
    - Points bar showing progress to next tier
    - Current quest card with requirements
    - Recent activity timeline (last 10 scored activities)
    - Authority Score total
    - Next recommended action (AI-suggested: "Your best next move is to pitch [Publication] with your [Story Angle]")

---

## Journey 7: Email Correspondence Tracking

**Trigger:** User sends or receives a PR-related email.
**Outcome:** Email threaded into the correct pipeline card automatically.

### Outbound Email (BCC Method)

1. User composes email in Gmail/Outlook to a journalist
2. User adds `pr-[org-id]@inbound.skaleflow.app` to BCC
3. Email is sent — journalist receives the email normally (no BCC visible)
4. SkaleFlow inbound webhook receives the BCC'd copy
5. System extracts: sender email, recipient email, subject, body (plain text + HTML), attachments, date/time, message ID, and in-reply-to header
6. System matches recipient email against `authority_contacts` records
7. **If match found:**
   - Looks for active pipeline card linked to that contact
   - If found: attaches email as `authority_correspondence` record to that card
   - If no active card: creates new card at Pitched stage, links contact
8. **If no match:**
   - Creates new `authority_contacts` record from recipient email (name parsed from email headers)
   - Creates new `authority_pipeline_cards` record at Pitched stage
   - Attaches email to the new card
9. Subsequent emails in the thread are matched via in-reply-to headers and subject line
10. Pipeline card correspondence section shows the full email thread chronologically

### Inbound Email (Journalist Replies)

11. Journalist replies to the user's email
12. User replies back with BCC (or the thread already has BCC from original email)
13. Same matching logic applies — email is threaded into existing correspondence
14. If the reply indicates a new stage (e.g. journalist agrees), user manually updates pipeline stage

### Manual Correspondence Entry

15. For phone calls, in-person meetings, or emails sent without BCC:
    - User clicks "Add Note" on the pipeline card
    - Selects type: Email, Phone Call, Meeting, Other
    - Fills in: date/time, summary/content, attachments (optional)
    - Saves — appears in correspondence timeline

---

## Journey 8: Declined and No Response Handling

**Trigger:** A pitch is rejected or goes unanswered.
**Outcome:** Data captured for analytics, opportunity properly closed or shelved.

### Declined

1. Journalist explicitly declines the pitch (via email or phone)
2. User moves pipeline card to **Declined** status
3. Decline form appears:
   - **Decline Reason** (dropdown): Not Relevant, Bad Timing, Wrong Contact, Full Editorial Calendar, Budget Constraints, Other
   - **Other Reason** (free text, shown when "Other" selected)
   - **Suggested Try Again Later?** (yes/no + date if yes)
   - **Referred to Someone Else?** (yes/no + new contact details if yes)
4. If referred: system offers to create a new Media Contact and a new pipeline card linked to the referral
5. If "try again later": system creates a future reminder on the specified date
6. Card moves to Declined column, visible in pipeline but visually distinct (greyed out or different colour)
7. **Data updated:** Pipeline card with decline metadata

### No Response

8. System tracks follow-up sequence: initial pitch → follow-up 1 (day 5) → follow-up 2 (day 12) → follow-up 3 (day 21)
9. At each follow-up interval, system sends reminder: "Follow-up due for [Journalist]"
10. After final follow-up with no response, system suggests: "Mark as No Response?"
11. User confirms, card moves to **No Response** status
12. Options presented:
    - "Archive" — closes the opportunity
    - "Try Again in X Months" — sets a reactivation reminder, card stays in No Response
    - "Try Different Angle" — creates a new pipeline card for the same contact with a different story angle
13. When a "try again" reminder fires, user can reactivate: card moves back to Prospect with all original correspondence and notes preserved

---

## Journey 9: Embargo Management

**Trigger:** A publication requires an embargo on the news.
**Outcome:** Embargo tracked, social amplification blocked until embargo lifts.

1. At Agreed stage, user sets an embargo date on the pipeline card
2. System immediately:
   - Displays "EMBARGO ACTIVE" badge on the card (red, prominent)
   - Shows countdown: "Embargo lifts in X days"
   - Disables "Push to Campaign" button with tooltip: "Embargo active until [date]. Social amplification will be available after the embargo lifts."
   - Creates calendar event for embargo lift date
3. If user tries to push to campaign: blocked with explanation
4. One day before embargo lift: notification sent: "Embargo on [Article Name] lifts tomorrow — pre-schedule your campaign?"
5. On embargo lift date:
   - "EMBARGO ACTIVE" badge changes to "EMBARGO LIFTED"
   - "Push to Campaign" button becomes active
   - Notification: "Embargo lifted for [Article Name]. Ready to amplify?"
6. User can now proceed with Push to Campaign (Journey 4)

---

## Journey 10: Financial Tracking and Budget Management

**Trigger:** User creates or manages paid PR opportunities.
**Outcome:** PR spend tracked, budget visibility on pipeline.

### Setting Up Commercial Details

1. On pipeline card creation or edit, user selects Engagement Type:
   - **Unpaid (Earned Media)** — no commercial fields shown
   - **Paid** — commercial fields expand: Deal Value, Payment Terms, Invoice Reference, Budget Notes
   - **Contra/Exchange** — Deal Value shows estimated value, Budget Notes describes the exchange terms
   - **Sponsored** — same as Paid fields
2. Deal Value entered in ZAR (default) or user-selected currency
3. Payment Terms selected from dropdown
4. As card progresses through pipeline, user updates Payment Status:
   - **Not Yet Invoiced** → **Invoiced** → **Paid**
   - Or: **Not Yet Invoiced** → **Invoiced** → **Overdue** (system flags automatically if not marked Paid by due date)

### Pipeline Financial Summary

5. Top of pipeline view shows financial summary bar:
   - **Total Committed:** R25,000 (sum of all active Paid/Sponsored deal values)
   - **Total Paid:** R12,000 (sum where Payment Status = Paid)
   - **Total Pending:** R8,000 (sum where Payment Status = Not Yet Invoiced or Invoiced)
   - **Total Overdue:** R5,000 (sum where Payment Status = Overdue, highlighted in red)
6. Clicking any figure filters the pipeline to show only those cards
7. Overdue payments trigger notification: "Invoice for [Publication] is overdue by [X] days"
