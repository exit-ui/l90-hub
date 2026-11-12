# Google Stitch prompt — L90 Hub

> Superseded: this prompt describes the earlier dark look. The light design in `docs/ux-spec.md` (round 7) is binding.

Paste the main prompt first. Then use the follow-up prompts one by one to refine each screen.

---

## Main prompt

Design a mobile-first app called **L90**, a 90-day accountability hub, for iPhone (390 × 844) with a matching desktop layout (1440 wide).

**Purpose**
One person uses it every day for 90 days, from 20 Oct 2026 to 17 Jan 2027, with a review day on 18 Jan 2027. The main mission is Instagram creator outreach: send 20 DMs a day. There are four side pillars: Fitness (gym attendance), Learning (Linux and Python sessions), Trading (account snapshots and a trade journal), and Reading (books and chapters). The user has a day job, so each visit must be fast: open, tick, log, close. The app is about data viewing and optimisation. It must never feel like a chore or a to-do list, and it never shames the user for a missed day.

**Mood and visual style**
- Dark, premium, calm. Think Apple's "Liquid Glass" quality on a near-black night-city backdrop: a dark vigilante skyline at night, with soft fog, distant lit windows, and no rain.
- Restrained Greek and classical touches: Roman numerals for day numbers (Day XXIV), thin column-line dividers, a laurel-like accent used once or twice, and a marble-white text colour. Never cartoonish, never gold-heavy.
- Background: #05060A, with deep charcoal surfaces. Text is warm off-white, with muted grey for secondary text. Use one cool accent (steel blue) for interactive elements. Green (#34C759-like) means only "complete".
- Frosted glass appears only on floating controls: the bottom tab bar, toasts, and the expanded-card close button. Content cards are solid dark surfaces with a 1px hairline border and a 24px radius.
- Typography: Inter only. Phone scale: titles 26/30 semibold with tight tracking, body 15/22, secondary 13/18, captions 12/16 in small caps. Large numbers use tabular figures and look like instrument readouts.
- Lots of room to breathe: 16px card padding on phone, 24px on desktop, generous vertical rhythm, one idea per card. Nothing crammed.
- Motion: smooth springs under 400ms; numbers roll digit by digit; cards expand into full-screen detail views (App Store "Today" style).

**Navigation**
A bottom glass tab bar on phone, 56px tall, sitting above the home indicator safe area. It hides when you scroll down and comes back when you scroll up. Four tabs: **Today**, **Outreach**, **Progress**, **More** (More holds Learning, Fitness, Trading, Method, Setup). On desktop, it becomes a slim left sidebar.

**Screen 1 — Today (home)**
- Header: "Day XXIV of XC", the date, the current phase name, and a small momentum line such as "18 days on target".
- A daily line: one short original sentence in plain English, never a quote from a famous person.
- A hero Outreach card: a big rolling number "12 / 20 DMs", a thin progress bar, compact −1 / +1 / +5 buttons (small, 44px tap targets, no giant button), and a mini bar chart of the last 7 days.
- A 2-column grid of square pillar modules: Fitness, Learning, Reading, Trading. Each has an icon, a short metric ("Gym: attended", "1 of 1 session", "Ch. 7", "Journal logged"), and a tick list of 2–3 items for today. When every item is ticked, the whole module turns softly green with a check mark.
- A "Sign off the day" card at the bottom. It glows green when all modules are complete. The user must sign off on purpose.
- Tapping any card expands it into a full-screen detail view with a close button, swipe down to dismiss, and a dark blurred overlay.

**Screen 2 — Outreach**
A funnel view: DMs sent → replies → calls → clients, with conversion percentages. A daily DM log, a follow-up list, and a per-day bar chart against the 20-a-day target line.

**Screen 3 — Progress**
A filterable motion chart that plots daily progression over 90 days. Filter pills: DMs, Gym, Learning, Reading, Trading. Show smooth lines with a hover or tap crosshair. Under it: insight cards ("Best week: week 3, 131 DMs") and a 90-day calendar heatmap with one small square per day, green when on target. No empty-data "0" shaming: before the first activity, show a calm empty state.

**Screen 4 — More**
A clean list of sections (Learning, Fitness, Trading, Method, Setup), each a row with an icon and a chevron. Setup holds data backup and restore, the start date, targets, and a background photo option.

**Screen 5 — Onboarding**
A 4–5 step questionnaire with one question per screen and a step indicator: start date, daily DM target, current numbers (followers, clients, account balance), gym days per week, current book. The last step is a review summary with a "Start day I" button.

**Rules**
- Every tap target is at least 44px. Focus states are visible. Charts have text summaries.
- No horizontal scrolling at 360px width.
- Copy is short and plain: 20 words or fewer per sentence, with no hype, emoji, or exclamation marks.
- Avoid generic AI-dashboard clichés: no neon gradients, no purple glow, no stock 3D blobs, and no dense lists of bullet rows.

---

## Follow-up prompts

1. **Expanded card:** "Show the Outreach card expanded to full screen: the large number at the top, a 30-day bar chart, today's DM log, and a glass close button at the top right."
2. **Complete state:** "Show the Today screen at the end of a finished day: every pillar module is green, and the Sign off card is glowing and ready."
3. **Empty state:** "Show the Today screen on Day I before any activity: calm, inviting, with no zeros shown as failures."
4. **Desktop:** "Create the desktop version of Today: left sidebar, the hero Outreach card spanning two columns, the pillar modules in a row of four, and the motion chart below."
5. **Install hint:** "Add a small dismissible glass hint at the bottom of the iPhone Safari view: 'Add L90 to your Home Screen for full screen', with the Share icon."
