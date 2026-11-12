# L90 Hub: UX spec (binding, round 7: light fintech)

Status: binding for the builder agent. The alignment agent checks the build against section 13.
Scope: the visual layer and the interaction layer. The data model in `src/store/types.ts` stays as it is, except where this spec says otherwise.
Data note (round 2 fix): `DayRecord` gained an optional `signedOff: boolean` (default false; older records load with false). Only "Sign off the day" sets it; a tick on a sign-off task never does.
Words "must", "must not" and "never" are binding. "Should" means "do it unless you write the reason in the PR".
Round 7 (the current round) replaces the dark "night city + liquid glass" look with a light fintech look from the approved mockups (Today, Outreach, Progress, Fitness, Onboarding): a pale page, white cards with one soft shadow, a deep forest green brand and a bright success green. It rewrites sections 2.1, 4, 5.2, 7.2–7.7, 8, 10.4, 14 and the checklist. The backdrop, the background photo and the glass lens are removed. Where an older sentence still names glass, the backdrop or a "white filled button", the round-7 text wins.
Round 2 adds: expandable cards (section 10), a new motion system (section 9), the number roll (9.4) and a new type system (7.2). Round 3 adds: the green completion state (4.3), compact Today controls (4.4), no rain (8.2) and one weight for numbers (7.2). Round 1 rules that still hold are kept. Rules that conflict were rewritten in place.

## 0. The user's brief in one line

Make the hub smooth, calm and spacious. Make it about data and optimisation. It must not feel like a chore. Home is a grid of pillar modules with that day's ticks. A motion chart shows the daily progression with filters. Each card opens into its full view with one continuous motion, like the App Store "Today" cards.

## 1. Principles applied (research, applied to this app)

Sources round 1: Laws of UX (lawsofux.com, J. Yablonski); Apple WWDC25 sessions 219 "Meet Liquid Glass" and 356 "Get to know the new design system", Apple HIG "Materials"; BJ Fogg, *Tiny Habits* (2019) and B=MAP; Lally et al. 2010, *Eur. J. Soc. Psych.* 40:998–1009; Gollwitzer & Sheeran 2006, *Adv. Exp. Soc. Psych.* 38:69–119; Kahneman & Tversky 1979 (prospect theory); Polivy & Herman 1985 ("what-the-hell" effect); Smashing Magazine 2026 "Designing a streak system"; WCAG 2.2 (1.4.3, 1.4.11, 2.5.8, 2.4.7).
Sources round 2: motion.dev/examples/react-app-store (App Store card pattern); motion.dev/plus (Motion+ component catalogue, ideas only, see 9.6); motion.dev docs for `layoutId`, `AnimatePresence`, `LayoutGroup`, drag, `visualDuration`/`bounce` springs; untitledui.com/blog/best-free-fonts (typeface choice, 7.2); Nielsen heuristic 3 "User control and freedom"; WAI-ARIA APG "Dialog (modal)" pattern.

| Principle | What it says | Rule for this app |
|---|---|---|
| Hick's law | Decision time grows with the number of choices. | Navigation has 4 tabs + More. Home has 1 filled button (the round +1 DM). |
| Fitts's law | Big, near targets are fast. | +1 DM is a round 44 px button beside the DM number; every target is ≥ 44 px. A whole task row is the target, not the 24 px circle. The whole module header is the "open" target (10.2). |
| Miller / chunking | Group items into small chunks. | Each module shows ≤ 4 ticks. All ticks show in the expanded view. |
| Jakob's law | Users expect what other apps do. | iOS bottom tab bar, round Reminders-style checks, iOS pull-down menu for metric choice, App Store–style card expansion with swipe-down to close. |
| Doherty threshold | Response < 400 ms keeps flow. | Every tap updates the UI in the same frame (optimistic). Every animation reaches its target < 400 ms (9.1). No spinners. |
| Object constancy (shared-element transition) | People track an object better when it moves than when it is replaced. | The card container, pillar name, big number and progress bar move into the expanded view; they are never replaced (10.3). |
| User control and freedom (Nielsen 3) | Users need a clear exit. | 4 exits from every expanded view: Close button, Escape, tap outside, swipe down (mobile); the browser Back also closes it (10.5). |
| Zeigarnik effect | Open tasks stay in mind. | Each module shows "2 of 3". Sign-off ends with tomorrow's first task (an open loop). |
| Goal-gradient | Effort rises near the goal. | Each module shows a progress bar to today's goal. At ≥ 75 % the bar label says "1 more". |
| Peak-end rule | People judge by the peak and the end. | Sign-off is the designed peak and the end of each day (6.3). |
| Aesthetic-usability | Good looks increase tolerance. | One calm material system, one spacing scale, one type family, no decorative noise. |
| Von Restorff | The different item is remembered. | Exactly one "Next" row on Home. The brand-green fill marks the main act of a card or view (Sign off, Continue); the round black "+" marks +1 DM. |
| Serial position | First and last items are remembered best. | The DM count is first. The Sign-off card is the last card before the chart. |
| Tesler's law | Complexity must live somewhere; put it in the system. | The app maps tasks to pillars, normalises chart data and writes insights. The user configures nothing. |
| Postel's law | Accept loose input, give strict output. | Number fields accept " 20 ", "+5", "20 DMs". Task text accepts "6:20" and "06:20". |
| Gestalt: proximity, common region, similarity | Near, enclosed and similar items read as one group. | One module surface = one pillar. Space inside a group < space between groups (7.1). All ticks look the same in all modules and in the expanded views. |
| Progressive disclosure | Show the core; reveal the rest on demand. | −1 DM, exact count, notes, compare mode, history and all ticks sit one tap deeper, in the expanded view. |
| Cognitive load | Each extra element costs attention. | Home shows 1 prose sentence (the daily line). Directives stay off Home. |
| Fogg B = M × A × P | Behaviour needs motivation, ability and a prompt at the same moment. | Raise ability (one tap per act), give a prompt (the "Next" row with its time cue). Do not rely on motivation. |
| Habit loop (cue–routine–reward) | A cue triggers a routine; a reward closes it. | Cue = time prefix of the task. Routine = the act. Reward = the check, the number roll and the module glint. |
| Immediate / variable reward | Immediate rewards build habits; some variety keeps interest. | Reward is immediate on each tick. Variety only in the sign-off highlight, and it must be true data. |
| Loss aversion and streaks | Losses weigh about 2× gains. A broken streak can trigger "what-the-hell" quitting. | Lead with a cumulative count that never drops. The streak has a "Recover" state after one miss. |
| Two-minute start | A tiny first step beats a big plan. | With 0 DMs after 16:00 the Outreach hint says "Send 1 DM now." |
| Default effect | People keep defaults. | Chart = DMs, 30 days; gym tick logs the next type in the rotation; learning tick logs the last topic. |
| Implementation intentions | "When X, I do Y" plans help. | The "Next" row shows the cue. The plans in `defaults.ts` stay the cue source. |
| Material hierarchy (Apple HIG "Materials") | Content comes first; chrome floats above it. Corners are concentric. | Content sits on white cards on a pale page. Frosted white (92 % white + blur) only on the floating tab bar and toasts. Radii follow 7.3. |
| 8 pt grid | One base unit gives rhythm. | All spacing from 7.1. No arbitrary values (`gap-[3px]`, `p-1.5`, `rounded-[22px]`). |

## 2. Information architecture and navigation

- 2.1 Navigation (round 7). Phone: a frosted white tab bar with 5 slots: **Today**, **Outreach**, a raised 58–60 px dark-green round button in the centre that logs +1 DM (with the short vibration where the API exists), **Progress**, **More**. From 1024 px: a white sidebar on the left with the L90 wordmark, Today, Outreach, Progress, then a "More" group with the 5 other pages, and a "+1 DM" button at the bottom on pages without their own DM controls.
- 2.2 More menu (sheet): Learning, Fitness, Trading, Method, Setup. Max 5 rows.
- 2.3 Progress is its own page. It holds: the full motion chart with compare mode, the 90-day mission grid, the mission stats (total DMs, days on target, days left, phase, level) and the Days tab (old Calendar). The week-template editor is in Setup → "Week".
- 2.4 One tap from Today: tick any task, +1 DM, +5 DMs, +1 check, open any expanded view (module header, chart card header), change chart metric or range, open sign-off.
- 2.5 Two taps (inside an expanded view): −1 DM and exact DM count ("Adjust"), ticks beyond 4, the pillar's 14-day history, compare mode on the expanded chart, the link to the full pillar page. Elsewhere: directives and rules (Method page), XP rules (Setup).
- 2.6 Removed from Today: the 90-cell day strip, the legend, the mission stat block, the level bar, the "Side quests" list, the directive Notice, the separate "Gym attended" row, the separate sign-off sheet (sign-off is now the expanded Sign-off module, 6.3).
- 2.7 Hash routes keep working. `#/calendar` redirects to `#/progress/days`. Old links must not 404. The expanded-view routes are in 10.6.

## 3. Pillars and the task-to-pillar mapping

- 3.1 Pillars, in this fixed order: `outreach`, `fitness`, `learning`, `reading`, `trading`, `signoff`. Sign-off is a pillar because each day has close-out tasks and it is the peak-end moment.
- 3.2 Decision: **keyword rules**, no schema change. `src/lib/pillars.ts` exports `pillarOfTask(text: string): PillarId`. Rules are an ordered array; the first match wins; matching is case-insensitive on word boundaries:
  1. `signoff`: `log the numbers`, `write one win`, `weekly review`, `before bed`
  2. `trading`: `trade`, `trading`, `tranche`, `crypto`, `wallet`, `chart`, `setup`, `payout`
  3. `outreach`: `dm`, `dms`, `creator`, `vet`, `pipeline`, `funnel`, `loom`, `outreach`, `pilot`
  4. `fitness`: `gym`, `train`, `workout`, `run`, `rest`, `walk`
  5. `learning`: `linux`, `python`, `code`, `lesson`, `flashcard`, `cards`, `course`
  6. `reading`: `read`, `chapter`, `book`
  7. Fallback: `signoff`.
- 3.3 Expected results for the default template (unit tests must assert each): "06:20 Send the drafted DMs…" → outreach; "On the bus home: read 1 chapter." → reading; "Evening block 1 (90 min): vet 20 creators…" → outreach; "Go to the gym." → fitness; "Do the Linux and Python session." → learning; "Rest." → fitness; "Before bed: log the numbers…" → signoff; "Do the weekly review. Compare the funnel…" → signoff; "Make the monthly crypto tranche decision." → trading; "Fix the pipeline. Stop after 3 hours." → outreach; "Vet 20 creators. Draft the DMs for Monday." → outreach.
- 3.4 `splitTask(text): { cue: string | null; action: string }`. A leading time (`6:20`, `06:20`) or a leading phrase before the first colon (≤ 40 chars) becomes `cue`. The rest becomes `action`, first letter upper case. The `done` key stays the full original text.
- 3.5 `tasksByPillar(template, date): Record<PillarId, string[]>` groups the day's tasks. Pure, tested.
- 3.6 The Setup → Week editor shows the detected pillar as a small label next to each line.
- 3.7 One act = one tap. Ticking a fitness task that matches `gym` also logs a gym session (next in Push → Pull → Legs). Unticking removes it. Ticking a learning task that matches `linux|python|code` also logs a learning session (last topic, 60 min). Ticking a reading task adds 1 to the current book's `read`. Unticking reverses each. "Rest." ticks only the task. This is the same in a module and in its expanded view.
- 3.8 `pillarMetric(id: PillarId): Metric` in `src/lib/pillars.ts` (pure, tested): outreach → `dm`, fitness → `gym`, learning → `learning`, reading → `reading`, trading → `r`, signoff → `tasks`. The expanded view's history chart uses it.

## 4. Today (Home) layout

### 4.1 Order of content (both widths)

1. Header: the L90 wordmark with the small laurel mark on the left (below 1024 px; from 1024 px the sidebar holds it and the header shows the long date). On the right: the momentum chip (flame and one number, the label holds the words; tap opens Progress) and a round 44 px profile button that opens Setup. No bell: there are no notifications.
2. The DM counter: a caption "Day XXIV of XC · Phase 1 · Level 8" (Roman numerals visually, "Day 24 of 90, phase 1" for screen readers; the level opens Progress), the hero number "12/20" (the "/20" in the faint colour), the label "DMs sent today", the "+5" pill and the round black 52 px "+" on the right, a 6 px green progress bar, and the daily line in the secondary grey (plain, not italic).
3. Install hint (iOS Safari only), the recover notice (only in the "recover" state, 6.2) and, when every module is done, one calm green line "All modules are done today. Rest and come back tomorrow." with a check icon.
4. "My pillars" with "View details ›" (opens Progress): four white cards (about 156–160 px square) in a row that scrolls sideways inside the page: Fitness, Learning, Reading, Trading. Each has the name, a round icon chip, one big metric (22 px, the tail in the faint colour), one change line and a soft area sparkline of the last 14 days at the bottom (`pillarCards` in `src/lib/pillarCards.ts`, pure, tested). Up is green text; same or fewer is grey; only a trading loss is red (line, fill and text). A pillar with no data shows a calm line ("No sessions yet") and a dashed baseline, never a zero.
5. "Today's ticks" with "Tap to tick": the tick cards of Outreach, Fitness, Learning, Reading and Trading (4.3).
6. "Sign off the day" card (6.3): a 56 px ring with done/total ticks of the day, one line, and the "Sign off" button; after the sign-off a "Done" pill. The sign-off ticks follow below.
7. The progress chart card (section 5, compact variant).
8. Bottom space so the tab bar never covers content: 96 px + safe-area inset on a phone.

### 4.2 Grid

- Below 768 px: one column, gutter 16 px, gap 12 px between tick cards. The pillar row bleeds to the screen edges and scrolls sideways inside itself; the page never scrolls sideways at 360 px.
- 768–1279 px: tick cards in 2 columns, gap 16 px. From 1280 px: 3 columns. From 1024 px the pillar cards sit in a 4-column grid with no inner scroll.
- Content max width 1120 px beside the 256 px sidebar.
- Tick cards in one row have equal heights (CSS grid stretch). The grid itself never animates layout (no `layout` prop on grid cells). A cell whose card is open keeps its size (10.3).

### 4.3 Tick card anatomy (all modules)

- Surface: a white card (7.4), radius 24 px, padding 16 px (< 640 px) / 20 px.
- Header = one `<button>` (the "open" target, 10.2): a 36 px round icon chip, the pillar name (module name style) with the number under it (section size, the unit in label style), and the ratio "2 of 3" in a chip pill on the right. Min height 44 px. Hover: the inset fill on the header only; press scale 0.98 on the card.
- The tick list (4.5) follows. Ticks are siblings of the header button, never inside it.
- Bottom: a thin round progress bar, track `--hub-track`, fill `--hub-bar-fill` (success green).
- Complete state: `isModuleComplete` in `src/lib/moduleView.ts` (pure, tested). Then the card turns the done tint (`--hub-done-bg`) with a green 1 px rim (`--hub-done-rim`), the icon chip turns pale green, the number turns `--hub-positive`, and a "Done" pill (`--hub-done-pill`, check icon + word, never colour alone) replaces the ratio. The check springs in once (`CHECK_SPRING`); reduced motion fades. The rim glints once in green (6.1). The card does not move, resize or reorder.
- Empty state (no task for this pillar today): the card keeps its cell and shows one body line, for example "No task today." The header still opens the view.

### 4.4 Module content

| Card | Number | Bar | Ticks | Extra control |
|---|---|---|---|---|
| Outreach | DMs today, "/ 20" | DMs / dmTarget | outreach tasks | the hint line under the header (the +5 and "+" sit in the DM counter, 4.1) |
| Fitness | gym this week, "/ 3" | fitTarget per week | fitness tasks | none |
| Learning | sessions this week, "/ 2" | learnTarget per week | learning tasks + "Review N cards" row when cards are due | none |
| Reading | chapter X "of Y" | 1 chapter today | reading tasks | none |
| Trading | cumulative R, signed | chart checks used vs limit (amber at the limit) | trading tasks | "+1 check" pill |
| Sign-off | ring: ticks done / total of the day | – | sign-off tasks | "Sign off" (brand green) until the sign-off, then "Done" |

- "Adjust" (−1 DM and the exact count) lives in the Outreach expanded view and on the Outreach page.
- The round "+" for +1 DM is black (`--hub-black`); the brand green fill is the main act of a card (Sign off, Continue, Start). The tab bar's centre button is the same +1 DM act in brand green. There is no full-width +1 DM bar.

### 4.5 Tick rows (the anti-"AI list" rule)

- A row is: 24 px check circle + action text (body style, 2 lines max, then ellipsis; full text in `aria-label`) + optional cue (label style, above the action, one line). Row min-height 44 px, row gap 4 px, no dividers, no chevrons, no subtitles that repeat the title.
- Done row: the circle fills success green with a dark green check; the text changes to label-strong colour. No strike-through.
- The "Next" row: exactly one row on Home, chosen by `nextTask(tasks, done, now)` (pure, tested). It has a 2 px left inset bar in the brand green and the cue in the text colour. No other row is highlighted. The same row keeps the marker in its expanded view.
- Icons appear only where they carry meaning: the pillar icon chip, the check state, the flame on the momentum chip, the X on a Close button.
- More than 4 ticks on Home: show 3, then a text button "Show N more" that opens the expanded view. The expanded view shows all ticks.

## 5. The motion chart

### 5.1 Data (pure, in `src/lib/progressSeries.ts`, tested in `progressSeries.test.ts`)

- `dailySeries(state, metric, range, today): Point[]`, `Point = { date: DateKey; value: number | null }`. Days before `startDate` and after `today` give `null`, never 0.
- Metrics: `dm` (DMs that day); `tasks` (done ÷ total × 100, null when total = 0); `gym`, `learning`, `reading` (rolling 7-day counts); `r` (cumulative R); `xp` (dm×5 + ticks×10 + win×20 + gym×30 + learning×30, dated sources only, documented in the function comment).
- Ranges: `7`, `14`, `30`, `90`. Range 14 is used only by the expanded pillar views (10.4); the chart controls offer 7/30/90. Range 90 = mission days 1–90 (future days are null and show the projection).
- `normalise(metric, value, settings)`: value as % of its own target (dm → dmTarget; tasks → 100; gym → fitTarget; learning → learnTarget; reading → 7). Clamp 0–150. `r` and `xp` have no target and cannot be overlaid.
- `rollingMean(points, 7)`: the trend line in single mode at ranges 30 and 90.

### 5.2 Modes and filters

- Single (Home, expanded chart, Progress): bars for the daily value, a 7-day mean line (ranges 30/90), a dashed target line, a dashed projection after today (range 90).
- Compare (expanded chart and Progress only): 2–3 metrics from {dm, tasks, gym, learning, reading} as lines in "% of target"; a 100 % reference line; y-axis label "% of target". Colours `--hub-accent`, `--hub-amber`, `--hub-positive` in that order; each line also has a different dash or marker.
- Controls: on Today the metric is an iOS-style pull-down menu; on Progress and in the expanded chart a row of metric pills (DMs, Gym, Learning, Reading, Trading, Ticks, XP; the active pill brand green with white text) scrolls sideways inside the card, and the menu returns for compare mode. Range = a 3-segment control "7D · 30D · 90D" with the active segment in brand green; compare = a toggle (expanded chart and Progress only). Nothing scrolls the page sideways at 360 px.
- Look (round 7): single mode draws the daily values as a green line (`--hub-chart-line`) over a soft green gradient fill, the 7-day mean as a blue line, the target as a dashed line with a legend line under the chart. Days after today sit on a pale "Days ahead" band. Pointer down or move shows a dashed crosshair, a white dot with a green ring on the value, and a dark tooltip pill with the date and value. `look="bars"` keeps the bar form for a caller that wants it.
- Default: metric `dm`, range `30` (range `7` while mission day < 8), single. The last choice is kept per device in `localStorage` (try/catch). Home card and expanded chart share the same choice.

### 5.3 Chart motion

- The chart never remounts on a filter change (stable React key). Paths morph from old to new data.
- Range change: x-domain and y-domain animate together, 300 ms, ease `cubic-bezier(0.2, 0.8, 0.2, 1)` (`CHART_EASE`).
- Metric change: bars and line morph, 300 ms. Series add/remove in compare: draw-on / fade 250 ms.
- A new filter during an animation starts from the current frame. Total time from tap to rest < 400 ms.
- The chart SVG never carries `layoutId` or `layout` (a scaled SVG distorts strokes). In an expansion it cross-fades (10.3).
- Reduced motion: no morph; the new state renders at once.

### 5.4 Insights (pure, in `src/lib/insights.ts`, tested)

`chartInsights(series, metric, settings, today): Insight[]`, by priority. A card shows the first 2; on Progress they sit as tiles in a 2-column grid. Each text is STE (≤ 20 words, active voice). Rules: 1 target gap; 2 period change (N = 7, ≥ 4 non-null days each side; "up from 0" when previous mean is 0); 3 best weekday (≥ 2 values per weekday); 4 projection (dm, reading; range 90); 5 compare mode weakest series this week. No insight when data is too thin. Never invent an insight. Never compare the user with other persons.

### 5.5 Accessibility

- Every chart (Home, expanded chart, expanded pillar history, Progress) has `role="img"` and an `aria-label` from `chartSummary(series)` (pure): metric, range, last value, mean, trend.
- A "Show data as a table" disclosure under each chart renders a real `<table>` of the visible points.
- Controls are buttons with `aria-pressed` / a menu with arrow-key support. Focus is visible on each.

### 5.6 Sizes

Home compact: chart area 200 px tall at 390 px, 240 px at 1280 px. Expanded chart and Progress: 320 px. Expanded pillar history: 120 px.

## 6. Reward and momentum

### 6.1 Completion feedback (each tick)

- Same frame: the check fills (scale 0.6 → 1, `CHECK_SPRING`), the big number rolls (9.4), the bar grows (≤ 300 ms).
- `navigator.vibrate?.(8)` where the API exists. No sound.
- Module complete: one rim glint (a light gradient sweeps along the border once, 400 ms) + the ratio becomes "Done". Never confetti on a single tick.
- +1 DM at the target (20th DM): the Outreach number pulses once (scale 1 → 1.04 → 1, 300 ms) and the hint says "Target hit. Each extra DM is a bonus."

### 6.2 Momentum and missed days

- Pure `momentum(days, today, target): { daysOnTarget; streak; best; state: 'active' | 'recover' | 'ended' }` in `src/lib/streak.ts`, tested.
- The headline momentum number is `daysOnTarget`. It never decreases.
- After 1 missed day the state is `recover`; the streak number stays and the chip says "Recover today" in amber. After 2 missed days in sequence the state is `ended`; the chip shows only "Best: 9 days"; the next on-target day starts a new streak at 1. No "0".
- The recover notice on Home (one line, NOTE style): "You missed yesterday. Send the DMs today to keep the streak."
- Never show: a red 0, the words "failed", "lost", "broke", "lazy", a count of missed days as a headline, a broken-streak animation, red badges on tab icons, comparisons with other persons, guilt copy.

### 6.3 Sign-off (the peak and the end)

- Sign-off is the expanded view of the Sign-off module (`#/home/signoff`, section 10). It replaces `SignOffSheet`.
- "Sign off the day" (module button) records the sign-off (`signOffDay(today)`) and opens the expanded view in its summary state. A tap on the Sign-off module header opens the same view without a sign-off; that view then shows the sign-off ticks and the "Sign off the day" button.
- Summary state holds: one line "Day 23 is complete." (expanded title style), 3 numbers (DMs, ticks, XP gained today), 1 highlight from `signOffHighlights(state, today)` (pure, tested; the first true item from: personal best DMs, streak milestone 7/14/30, funnel stage moved, module all-done for 7 days, phase progress %), the win field (1 line, optional), and "Tomorrow: 06:20 Send the drafted DMs at the bus stop."
- The 3 numbers roll from 0 one after the other, 80 ms apart, after the container settles (total ≤ 700 ms from tap). The highlight is the variable reward and it must be true data.
- Closing returns to Today with the Sign-off module in the complete state and focus on its header button.

## 7. Spacing, type, density

### 7.1 Spacing scale (8 pt, with 4 as the half step)

Tokens: `4, 8, 12, 16, 24, 32, 48, 64` px only. Mapping:
- Inside a row (icon to text): 12. Between rows: 4. Between a module's header, number and list: 8, 8, 16.
- Module padding: 16 (< 768 px) / 24 (≥ 768 px). Expanded view padding: 16 (< 768 px) / 32 (≥ 768 px). Between sections inside an expanded view: 24 (< 768 px) / 32 (≥ 768 px).
- Between modules: 12 (mobile) / 16 (≥ 768 px). Between page sections: 32 (mobile) / 48 (≥ 768 px).
- Page gutter: 16 (< 768), 24 (768–1023), 32 (≥ 1024). Top of page to title: 24 (mobile, below the safe area) / 96 (desktop, below the floating top bar).
- Rule: the gap inside a group is always smaller than the gap between groups.

### 7.2 Typography (round 2, from untitledui.com "best free fonts")

**Choice: Inter, one family, no companion.** Package: `@fontsource-variable/inter` (npm, v5.3.0, licence OFL-1.1, already installed). Import exactly these two files in `src/index.css`:
`@import "@fontsource-variable/inter/opsz.css";` and `@import "@fontsource-variable/inter/opsz-italic.css";` (both declare `font-family: 'Inter Variable'`, weight 100–900, plus the optical-size axis). Remove `@import "@fontsource-variable/inter";` and `@import "@fontsource-variable/cormorant";`. Remove the packages `@fontsource-variable/cormorant` and `@fontsource-variable/outfit` from `package.json` (Outfit is installed but not used). The fonts are bundled by Vite and work offline.

Why Inter (the list's #1) over the other candidates:
- It has true tabular figures (`tnum`), an optical-size axis (large numbers get the tighter "Display" design automatically) and a true italic. This app is mostly numbers, small labels and one italic line; Inter covers all three in one file family.
- Outfit (#24, the round-1 candidate): the article notes it has no italics; it has no optical sizes; its geometric figures read wider in a dense 2-column module. Rejected.
- Cormorant (round 1 daily line): not on the list; a high-contrast serif at 17 px over the night-city backdrop loses thin strokes; a second family costs bytes. Removed. The daily line uses Inter italic.
- Geist, Manrope, Mona Sans, DM Sans, Instrument Sans: good, but each one adds a new package for no gain over the installed Inter, and Geist has no italic for the daily line. Rejected.

Tokens in `src/index.css`:
- `--font-sans: "Inter Variable", ui-sans-serif, system-ui, -apple-system, sans-serif;` (Inter first, so every device gets the same metrics; the round-1 SF-first stack is removed). `--font-heading: var(--font-sans)`. Delete `--font-display`; `font-display` utilities become `font-sans italic`.
- `body { font-optical-sizing: auto; font-feature-settings: "cv11"; }` (single-storey a, calmer at small sizes).
- Utility `.num` = `font-variant-numeric: tabular-nums; font-feature-settings: "tnum", "cv11";`. Every number that can change (big numbers, ratios, chart labels, table cells, stats) uses `.num`.

Type scale (size / line-height in px, weight, tracking in em):

| Role | 390 px | 1280 px | Weight | Tracking |
|---|---|---|---|---|
| Page title | 28 / 34 | 32 / 38 | 600 | −0.02 |
| Expanded title (pillar name in an expanded view, sign-off line) | 28 / 34 | 32 / 38 | 600 | −0.02 |
| Hero number (the Today DM counter, every expanded big number) | 44 / 48 | 44 / 48 | 600 | −0.03 |
| Module number | 28 / 32 | 32 / 36 | 600 | −0.02 |
| Pillar card metric | 22 / 28 | 22 / 28 | 600 | −0.02 |
| Field value | 20 / 26 | 20 / 26 | 600 | −0.01 |
| Section / sheet title | 17 / 22 | 18 / 24 | 600 | −0.01 |
| Module name | 15 / 20 | 16 / 22 | 600 | −0.01 |
| Body, task action | 15 / 20 | 16 / 22 | 400 | −0.005 |
| Daily line | 15 / 22 | 17 / 24 | 400 | −0.005 |
| Label, cue, ratio, chart label | 13 / 18 | 13 / 18 | 500 | 0 |

- Round 3: one weight system. Every number is 600 with tight tracking (the optical-size axis gives the display cut); titles 600; labels 500; body 400. No light (300) or bold (700) text anywhere.
- The 1280 px column applies from 1024 px up. No text smaller than 13 px. Max 3 sizes per module. Numbers use `.num`. Units next to a number use the body style, label colour.
- Each role is one utility class in `index.css` (`.type-title`, `.type-hero`, `.type-number`, `.type-metric`, `.type-value`, `.type-section`, `.type-name`, `.type-body`, `.type-line`, `.type-label`, `.type-caption`). Components use these classes, not ad-hoc `text-[..]` values.
- Round 7: the daily line is plain (not italic) in the secondary grey. The italic font file stays imported for any later use.

### 7.3 Radii (round 7)

Cards and the hero card 24; tick tiles, field cards and choice chips 20; controls inside a card 12; sheets and expanded views 32 (top corners only on a phone); pills, chips, check circles, the tab bar's centre button and Close buttons full round. A radius that animates (10.3) is set as an inline `style` number (`CARD_RADIUS` 24 → `VIEW_RADIUS` 32), so Motion corrects it.

### 7.4 Materials (round 7)

- Page: `--hub-bg-from` #F4F5F2.
- Card: `surface-card`: white, no border, radius 24, shadow `--hub-shadow` (0 1px 2px rgb(15 30 20 / 0.04), 0 10px 30px rgb(15 30 20 / 0.06)). Modules, the chart card, stat cards, field cards and the Sign-off card use it.
- Done card: `rim-positive`: the done tint `--hub-done-bg` #E6F7EC with a 1 px `--hub-done-rim` and the same shadow.
- Hero card: `bg-hero`, the only gradient: `radial-gradient(120% 140% at 100% 100%, rgba(125,220,160,0.55) 0%, rgba(125,220,160,0) 48%), linear-gradient(135deg, #070908 0%, #0F3D24 100%)` with white text. Small text on it stays on the dark part; its one control is a white pill.
- Expanded view: `surface-solid`, white with the raised shadow. Overlay: `--hub-overlay` (11 % to 28 % ink) plus a 6 px blur; under `prefers-reduced-transparency` no blur and a solid alpha.
- Frosted white (`glass`): 92 % white + `blur(20px) saturate(160%)` + a hairline. Only the phone tab bar and the update toast. Menus and sheets (`glass-thick`, `glass-sheet`) are solid white with the raised shadow. The active pill (`glass-pill`) is solid brand green.
- All colours are tokens in `src/index.css`. No colour literals in components.

### 7.5 Density

- Home holds: the DM counter, 4 pillar cards in one sideways row, 5 tick cards, the Sign-off card, the chart card and at most 1 notice.
- First viewport at 390×844 (above the tab bar) shows: the header, the full DM counter with the "+" button and the daily line, the pillar row and the top of the first tick card. Home total height at 390 px with `?sample=1` is about 2,400 px or less (round 7).
- Max 4 ticks visible per card, max 2 insights per chart card, max 1 notice, max 1 prose sentence (the daily line).

### 7.6 Type floor, spacing and the field system

- Type floor: body and list rows 15 / 22 on a phone, 16 / 24 from 640 px; secondary text 13 / 18 on a phone (`.type-label`); captions 12 / 16 (`.type-caption`) only for chart axes, units, tab labels, cues and small pills. Tight tracking only on numbers and titles.
- Spacing: cards use 16 px padding on a phone and 20 px from 640 px. Tick rows have 16 px between the check and the text. Sections on Today are 32 px apart.
- Fields (`src/components/shared/Field.tsx`, round 7): one system for every input, select, date, number and text area. Each field is a white field card (`field-box`, radius 20, a hairline edge, 12 × 16 px padding) with the label (12–13 px, secondary grey) inside at the top and the value under it in 20 px semibold (text areas keep 16 px regular). Focus: a 3 px green ring (`--hub-focus`) on the whole card, no layout shift. An error shows a danger edge and a line with an icon below. A control outside a field card (a table cell) keeps a white 44 px surface with a hairline (`field-surface`). Selects are native with a chevron; dates are native. Fields that save as you type show a quiet "Saved" tick after the blur.
- DM controls (`DmControls.tsx`): every screen that changes the DM count uses the same "+5" pill and round black "+" button and the same "Adjust" pill (−1 and the exact count).
- Charts: every line or bar chart over time is the motion chart (`MotionChart`, `ProgressChart`, `MetricChart`) with 12–13 px axes, except the Outreach range bars (checklist 105) and the pillar sparklines. The target label is a legend line under the chart, never a pill on the bars.

### 7.7 Round 6: the phone fit (below 640 px only)

The user said the phone view was too big and that the tab bar sat on the Safari toolbar. From 640 px up nothing changes.

- Compact scale (`@media (max-width: 639px)` in `src/index.css`, token overrides only): body and list rows 15 / 22, secondary 13 / 18, captions 12 / 16 (chart axes, units, tab labels only), the daily line 15 / 22, section titles 17 / 22, page titles 26 / 30, module numbers 28 / 32, the hero number 44 / 48 at every width (round 7). Field values are 20 px, so iOS does not zoom.
- Spacing on a phone: card padding 16 (`p-4 sm:p-5 lg:p-6`), grid gaps 12, section gaps 20 (`mb-5`, `gap-5`). The Today chart is 160 px tall on a phone (expanded 260).
- Targets: tick rows stay 44 px or more. Fields are 44 px tall on a phone (48 from 640 px). Buttons look 40 px and chips 32 px, ghost pills 36 px, but `hit-area` grows each touch target to 44 × 44 px with a pseudo element.
- Header on a phone (round 7): the wordmark on the left, the momentum chip and the profile button on the right, all on one line. The day, phase and level share the caption over the DM count.
- Tab bar (round 7; `AppShell` `TabBar`, `useBarVisible`, pure rule `nextBarState` in `src/lib/barScroll.ts`, tested): frosted white, flush with the bottom edge, a hairline on top, the safe-area inset as bottom padding. Five slots: Today, Outreach, the raised round +1 DM button (60 px, brand green, a 4 px ring in the page colour, lifted 16 px), Progress, More. Items are 48 px tall with a 24 px icon and a 12 px label; the active item is dark and semibold, the others grey. It slides down out of view on a scroll down of 12 px or more and comes back on a scroll up, within 32 px of the top or the end, and on a new page. It never hides while a field or the bar has focus. Spring `SPRING`; reduced motion: instant. Content keeps `env(safe-area-inset-bottom) + 96 px` at the bottom.
- Safari in a tab: the bar uses `position: fixed` at the bottom of the layout viewport, so it sits above Safari's toolbar, never under it; it hides on a scroll down, so Safari's own bars and the page get the room. In the home-screen app the page uses the full screen with `viewport-fit=cover`, and the top safe area pads the header (`pt-shell`).
- Install offer (`src/lib/platform.ts`, tested; `src/pages/home/InstallHint.tsx`; `src/pwa/installPrompt.ts`): in iOS Safari in a tab, Today shows one white card: "Install the app for full screen. Tap Share, then Add to Home Screen." with "Not now". "Not now" is kept in localStorage `l90-hub-install-hint` (try/catch) and focus moves to the page. Never in the home-screen app, on a desktop, in other iOS browsers or in in-app views. On Android Chrome, when `beforeinstallprompt` fires, Today shows an "Install the app" pill that opens the browser dialog.
- Expanded views on a phone: the title is 17 / 22 semibold, the grabber and header padding are smaller, so content starts about 20 px sooner. Close (44 px, a round chip) and the swipe close stay.

## 8. Light theme, colour and contrast (round 7)

- 8.1 No backdrop. The night-city canvas, the bokeh, the skyline asset, the background photo setting (Setup → Appearance), the glass lens (`useLens`) and the photo store code are removed. A photo that an older version stored in IndexedDB (`hub-media`) is left as it is and is not read; the hub record, `sanitizeState` and backups do not change. The app must not ship the user's Instagram reference images (copyright).
- 8.2 Colour tokens (`src/index.css` `:root`, mapped to Tailwind colours in `@theme inline`): page `--hub-bg-from` #F4F5F2; card `--hub-surface` #FFFFFF; text `--hub-text` #111311; secondary `--hub-label` #5F6670 (passes 4.5:1); `--hub-label-strong` #3D434A; faint `--hub-faint` #A3A8AF only for large number tails such as "/20"; brand `--hub-brand` #0F3D24 (active pills, primary buttons, the centre tab button) with `--hub-on-brand` white; black button `--hub-black` #111311; success `--hub-success` #3DDC84 for bars, fills and rings with a dark green check (`--hub-on-success`); green text `--hub-positive` #14703D (slightly darker than the mockup's #177A43, so it passes 4.5:1 on the done pill); done tint `--hub-done-bg` #E6F7EC and pill `--hub-done-pill` #CFF3DC; partial `--hub-partial` #BDEFD0; chip `--hub-chip` #F1F2EF; track `--hub-track` #E7E9E4; hairline rgb(17 19 17 / 0.07); negative `--hub-negative` #E5484D with text `--hub-negative-text` #C2373C, only for trading down moves; secondary accent `--hub-accent` #5B6CFF (the learning sparkline and the ring gradient start) with text `--hub-accent-text` #4353E0; amber text `--hub-amber` #A15C07.
- 8.3 Missed days are never red: the 90-day heatmap uses success green (signed off), pale green (partly done) and greys (missed, ahead); today has a brand-green outline.
- 8.4 Contrast: body text, secondary text, green text, red text, blue text, amber text and danger text are ≥ 4.5:1 on a white card and on the page; text on the brand and on the black button ≥ 4.5:1; the check on the success fill ≥ 3:1. Unit test `src/lib/contrast.test.ts` reads the tokens from `src/index.css` and checks each pair. The faint colour stays below 4.5:1 and is never used for small text.

## 9. Motion system

### 9.1 Presets (all in `src/lib/motion.ts`; components import them, never inline numbers)

"Reaches target" = the spring's `visualDuration`, or a tween's duration. Every value below is < 400 ms, except the sign-off count sequence (≤ 700 ms).

| Preset | Value | Use |
|---|---|---|
| `SPRING` | spring, stiffness 520, damping 38, mass 0.9 | small UI: active pill, segment indicator |
| `CHECK_SPRING` | spring, stiffness 700, damping 32, mass 0.6 | the check fill |
| `EXPAND_OPEN` | spring, `visualDuration: 0.35`, `bounce: 0.12` | card → expanded view (shared elements) |
| `EXPAND_CLOSE` | spring, `visualDuration: 0.3`, `bounce: 0` | expanded view → card (no overshoot into the grid) |
| `DRAG_RETURN` | spring, `visualDuration: 0.25`, `bounce: 0.2` | swipe-down released below the close threshold |
| `DIGIT_SPRING` | spring, `visualDuration: 0.32`, `bounce: 0.1` | each digit column of the number roll (9.4) |
| `SHEET_SPRING` | spring, stiffness 420, damping 40, mass 0.9 | sheets (Adjust, menus) |
| `DISCLOSE` | spring, stiffness 600, damping 50, mass 0.8 (was `EXPAND`) | in-place disclosures ("Show data as a table") |
| `OVERLAY_FADE` | tween 200 ms in / 150 ms out, ease-out | the overlay |
| `CONTENT_IN` | tween 150 ms, delay 120 ms, ease-out | non-shared content inside an expanded view |
| `CONTENT_OUT` | tween 100 ms, no delay | non-shared content on close and on the card while it opens |
| `STAGGER` | 30 ms per item, start 120 ms, max 6 items staggered (item 7+ uses the item-6 delay) | tick rows in an expanded view |
| `FADE` | tween 150 ms ease-out | generic fades and every reduced-motion fallback |
| `CHART_EASE` / `CHART_MORPH_MS` | `[0.2, 0.8, 0.2, 1]` / 300 ms | chart morphs |
| `BUTTON_TAP` | scale 0.96, 100 ms | buttons; cards use scale 0.98 |
| `PULSE` | scale 1 → 1.04 → 1, 300 ms | Outreach number at the target |

`VALUE_SPRING` and `CountUp` are removed (replaced by 9.4).

### 9.2 Layout animation rules

- `layoutId` is used only on the shared elements in 10.3 and on the existing active pill / segment indicators. No other element has `layoutId`.
- The Today grid and its cells never have `layout`. Modules never animate position on a tick.
- All Today cards sit in one `<LayoutGroup id="today">`; ids are `card-<id>`, `title-<id>`, `number-<id>`, `bar-<id>` with `<id>` from 10.1.
- A shared text element is `display: inline-block; width: fit-content` so its aspect ratio stays the same and the scale does not stretch the text.
- `border-radius` of a shared container is an inline `style` number (24 → 32), never a class only, so Motion corrects it.
- Content that is not shared never rides a scale: it fades out (`CONTENT_OUT`) before the container moves and fades in (`CONTENT_IN`) after.
- Animate only `transform` and `opacity` (plus Motion's layout projection). Never animate `width`, `height`, `top` or `left` directly.

### 9.3 What moves, what never moves

- Moves: check fill, number rolls, progress bars, the module glint, chart morphs, card ↔ expanded view, the overlay, sheets, the active tab pill.
- Never moves: module positions and order, the page on a tick (no layout shift), text while it is read, hover lifts on cards (no `CARD_HOVER`), anything on its own (no auto-play, no loops).

### 9.4 Number roll (built in-house with the free `motion` package)

- Component `RollingNumber` in `src/components/shared/RollingNumber.tsx` replaces `AnimatedNumber` and `CountUp` for every big number: module numbers, hero numbers, expanded-view numbers, sign-off numbers, Progress mission stats.
- Pure helper `digitColumns(text: string): Column[]` in `src/lib/digits.ts` (tested), `Column = { key: string; kind: 'digit' | 'static'; char: string }`. Keys count from the right ("d0" = units, "d1" = tens; static characters such as `,` `.` `−` `+` `%` `R` get "s<n>" by position from the right), so the units column keeps its identity when the number grows from 9 to 10.
- Each digit column is a 1-line-high mask (`overflow: hidden`, height = 1 line-height) over a vertical strip 0–9; the strip's `y` springs to `−digit × 1lh` with `DIGIT_SPRING`. All columns move at the same time. Static characters do not move.
- A new column (9 → 10) enters with opacity 0 → 1 and width via `AnimatePresence` + `layout="position"` on its siblings, inside the same `DIGIT_SPRING`. A removed column exits the same way.
- The roll interrupts from the current frame when the value changes again mid-roll (multiple +1 DM taps).
- `.num` (tabular figures) is mandatory, so column widths never change.
- Accessibility: the full formatted value is in a visually hidden span; the visual columns are `aria-hidden`. The module's (or expanded view's) single `aria-live` region announces the change; `RollingNumber` adds no live region of its own.
- Reduced motion: no strip movement; the new value replaces the old one with a 150 ms opacity cross-fade.
- First mount: no roll (the number shows its value). Exception: the sign-off numbers roll from 0 (6.3).

### 9.5 Reduced motion (`prefers-reduced-motion: reduce`)

- Every transform, layout animation, morph and stagger becomes a 150 ms opacity cross-fade (`FADE`) or an instant change. No `layoutId` animation: the card stays still and the expanded view fades in over the faded-in overlay.
- Swipe-down to close stays available (it is user-driven), but release closes with a fade, not a slide.
- No glint, no pulse. Numbers cross-fade (9.4).
- `<MotionConfig reducedMotion="user">` stays at the app root; components also check `useReducedMotion()` where they choose between a transform and a fade.

### 9.6 Motion+ (ideas only, no paid code)

Motion+ is a paid, licensed product (one-time purchase, private repo). The user has not said they own a licence. Therefore:
- The build must not install, import or copy any Motion+ package, component or example source (including the full App Store example source, which sits behind the Motion+ paywall). Only the free `motion` package (`motion/react`) is allowed.
- Taken as ideas and rebuilt in-house: AnimateNumber (odometer roll) → `RollingNumber` (9.4); the App Store card pattern → section 10, built from the public free APIs `layoutId`, `AnimatePresence`, `LayoutGroup`, drag and springs; the gesture idea (drag with elastic and velocity) → swipe-down to close (10.5).
- Rejected (see 10.9 for reasons): Ticker, Typewriter, Cursor, Carousel, ScrambleText, AnimateText/splitText, Curtains.

## 10. Expandable cards (the App Store pattern)

### 10.1 Which cards expand

| Card on Today | id | Route | Expanded view holds |
|---|---|---|---|
| Outreach module | `outreach` | `#/home/outreach` | header (name, ratio, hero number, bar); all outreach ticks; +1 DM, +5 (normal 44 px buttons), "Adjust" (−1 and exact count); "Last 14 days" history chart (`dm`); 1 insight; link "Open the Outreach page" |
| Fitness module | `fitness` | `#/home/fitness` | header; all fitness ticks; "Last 14 days" (`gym`); 1 insight; link "Open the Fitness page" |
| Learning module | `learning` | `#/home/learning` | header; all learning ticks; "Review N cards" row; "Last 14 days" (`learning`); 1 insight; link "Open the Learning page" |
| Reading module | `reading` | `#/home/reading` | header; all reading ticks; current book "Chapter X of Y"; "Last 14 days" (`reading`); 1 insight; link "Open Reading" (`#/learning/reading`) |
| Trading module | `trading` | `#/home/trading` | header; all trading ticks; "+1 check" with the limit text; "Last 14 days" (`r`); link "Open the Trading page" |
| Sign-off module | `signoff` | `#/home/signoff` | 6.3 (ticks + "Sign off the day", or the summary) |
| Motion chart card | `progress` | `#/home/progress` | the full chart (320 px) with metric, range and compare; 2 insights; data table; the mission stats (total DMs, days on target, days left, phase, level) as rolling numbers; link "Open the Progress page" (the 90-day grid and Days stay on the Progress page) |

- The history chart is the existing chart in single mode with range 14, no controls, 120 px tall, with its `aria-label` and table (5.5).
- The insight is the first item of `chartInsights` for `pillarMetric(id)` at range 30. No insight when none is true.
- Inside an expanded view there is at most one filled button: the black "+" (Outreach) or the brand-green "Sign off the day" (Sign-off, before the sign-off); others: none.

### 10.2 The open target

- Module: the header button (4.3) and "Show N more". `aria-label`: "Open the Outreach details." (pillar name varies). `aria-expanded` = open state, `aria-controls` = the view id.
- Chart card: the card title "Progress" is the open button (44 px target) with a small chevron as the visible affordance. There is no separate "Open full view" button.
- Ticks, +1 DM, +5, +1 check and chart controls on Home keep their own action and never open the view.

### 10.3 Shared elements and the open/close sequence

- Shared (`layoutId`): `card-<id>` (the surface: grid card ↔ expanded panel), `title-<id>` (pillar name; for the chart: the card title "Progress"), `number-<id>` (the big number; the chart card has none), `bar-<id>` (the progress bar; the chart card has none). No icon is shared (the icon chip of a tick card fades with the other content). The Sign-off card shares only `card-signoff` and `title-signoff`; its ring is not shared.
- The card's grid cell keeps its exact size while the view is open: the cell renders a placeholder with the card's measured height and the material at opacity 0. No other card moves.
- Open (`EXPAND_OPEN`): frame 0 the overlay starts its fade (`OVERLAY_FADE`), the card's non-shared content fades out (`CONTENT_OUT`), the shared elements fly to their expanded positions, radius 24 → 32. From 120 ms the expanded content fades in (`CONTENT_IN`) and the ticks stagger in (`STAGGER`: opacity 0 → 1, y 8 → 0). The container reaches its target by 350 ms.
- Close (`EXPAND_CLOSE`): expanded content fades out (`CONTENT_OUT`), the shared elements fly back, radius 32 → 24, the overlay fades out, the card's own content fades in. The container reaches the card by 300 ms. Then the placeholder is replaced by the real card (no flash).
- The shared title and number change size (for example 40 → 64 px) through the layout scale, with 9.2's inline-block rule. The rendered font size switches at the start of the animation, not at the end.
- Deep link or reload on an expanded route (no card rect to fly from, or the card is out of view): no shared flight; the panel fades in with `opacity 0 → 1` and `scale 0.98 → 1` in `EXPAND_OPEN`.

### 10.4 Layout of the expanded view

- < 768 px: `position: fixed`, left 0, right 0, bottom 0, top = safe-area inset + 16 px; radius 32 on the top corners only; padding 16; bottom padding 24 + safe-area inset. It covers the tab bar.
- ≥ 768 px: centred, width `min(720px, 100vw − 64px)`, max-height `calc(100dvh − 96px)`, radius 32, padding 32.
- Order: grabber (mobile only, 48 × 4 px, `--hub-track`) → header row (shared title left, Close button right) → shared big number + unit → shared bar → ticks → quick actions → history chart → insight → page link.
- Close button: 44 × 44 px, a round chip (`--hub-chip`), X icon, `aria-label="Close"`, top right, sticky (stays visible when the view scrolls).
- The panel scrolls inside itself (`overflow-y: auto; overscroll-behavior: contain`). Nothing scrolls sideways at 360 px.
- Layers: overlay `z-40`, expanded panel `z-50`. Only one expanded view at a time. A sheet opened from inside (Adjust) sits above it and closes first on Escape.

### 10.5 Closing

All of these close the view with the close sequence (10.3):
1. The Close button.
2. Escape (when no menu or sheet is open above it).
3. A tap on the overlay (outside the panel).
4. Swipe down (< 768 px): drag on the grabber or the header row with `dragControls` (so the tick list still scrolls); `drag="y"`, `dragConstraints={{ top: 0 }}`, `dragElastic={{ top: 0, bottom: 0.5 }}`. Release with offset.y > 120 px or velocity.y > 600 px/s closes; else the panel returns with `DRAG_RETURN`. The swipe starts only when the panel's scrollTop is 0. The overlay opacity follows the drag (1 → 0.4 over 0–240 px).
5. The browser Back button or the mobile back gesture (10.6).

### 10.6 Route and history

- The open state comes from the hash only. `expandedFrom(route: Route): ExpandId | null` in `src/lib/routes.ts` (pure, tested): page `home` + first segment in {outreach, fitness, learning, reading, trading, signoff, progress} gives that id; anything else gives null. An unknown segment (`#/home/foo`) shows Today with no view and replaces the hash with `#/home`.
- Open from a tap: push the new hash (one history entry). If the hash is already that route, push nothing (a double tap makes one entry).
- Close: when the app pushed the entry in this session, call `history.back()`; when the view came from a deep link or reload, replace the hash with `#/home` (the user never leaves the app by closing). Pure helper `closeAction(openedByPush: boolean): 'back' | 'replace'`, tested.
- Back, forward and hand-typed hashes drive the same open/close animation.
- `#/home` and `#/` behave as before. Existing routes (`#/calendar` redirect, tab routes) do not change.

### 10.7 Scroll lock and focus

- While a view is open: the page under it does not scroll. Save `window.scrollY`, set `overflow: hidden` on `html` and `body`, keep `scrollbar-gutter: stable` on `html` so the page does not shift sideways. On close restore the exact scroll position (no jump).
- The content behind (app shell, tab bar, Today grid) gets `inert` and `aria-hidden` is not needed (inert covers it).
- The panel is `role="dialog"`, `aria-modal="true"`, `aria-labelledby` = the expanded title id.
- On open, focus moves to the expanded title (`tabIndex={-1}`, `focus({ preventScroll: true })`) at the start of the animation. Tab order inside: Close, then content in visual order; Tab wraps inside the panel (focus trap).
- On close, focus returns to the card's header button (or the "Progress" title button for the chart) with `preventScroll: true`. After a deep-link open, focus returns to the module header of that id.
- The focus ring (11) is visible on every control inside the view.

### 10.8 Interruption

- Close during the open animation: the shared elements reverse from their current frame (no jump to the end first).
- Open during the close animation (tap the same card again): the view re-opens from the current frame.
- A tap on a different card while one is closing: the first close finishes from its frame; the second opens at once (two shared flights may overlap; they use different `layoutId`s).
- Ticks and buttons inside the view work during the animation (optimistic, same frame).
- Rapid +1 DM taps inside the view: the number roll interrupts (9.4), the view does not re-animate.

### 10.9 Rejected from the round-2 sources

- Motion+ Ticker (endless scrolling strip): constant motion pulls attention and breaks "nothing moves on its own" (9.3).
- Motion+ Typewriter, ScrambleText, AnimateText/splitText: they delay reading and move text while it is read (9.3); the daily line must read at once.
- Motion+ Cursor: this is a touch-first app; a custom cursor adds noise and hurts precision.
- Motion+ Carousel and Gallery: they hide content behind swipes (fails progressive disclosure for core data) and add a sideways gesture next to the no-sideways-scroll rule.
- Motion+ Curtains and page-level reveals: decorative, no data value.
- App Store example parts: big hero images per card (no images in modules; the content is the number), a separate image `layoutId` (no icons or images to share), long open springs above 400 ms (Doherty rule). The example's full source is Motion+ only and is not used.
- Untitled UI list: Satoshi, Switzer, General Sans, Supreme (custom Fontshare licences, not on Fontsource as OFL); Neue Haas Grotesk, Aktiv Grotesk, Futura PT (Adobe CC subscription). Outfit, Geist and others: see 7.2.

## 11. Accessibility (must not regress)

- Every interactive target ≥ 44 × 44 px (the 90-day grid on Progress uses ≥ 44 px cells by wrapping into 10 columns at 390 px).
- Visible focus ring (3 px, offset 3 px) on every control, including rows, module header buttons, chart controls and the Close button.
- Full keyboard use: Tab through modules in visual order; Enter/Space on a module header opens its view; Space/Enter toggles a tick; Escape closes the top layer; the metric menu works with arrow keys and Escape.
- Each tick is a native checkbox or a button with `aria-pressed`, labelled with the full task text.
- Numbers that change announce via one `aria-live="polite"` region per module and one per expanded view (not per number).
- Every chart: `aria-label` summary + data table (5.5).
- Expanded views follow the modal dialog pattern (10.7).
- No sideways scroll at 360 px on any page or expanded view.
- Respect `prefers-reduced-motion` (9.5) and `prefers-reduced-transparency` (7.4).

## 12. Copy rules (ASD-STE100) and code rules

- Max 20 words per sentence. Active voice. Instructions start with a verb ("Send 1 DM now.", "Open the Fitness page."). One meaning per word: "task", "tick", "module", "sign off", "view", "page" are the fixed terms ("view" = expanded view on Today; "page" = a tab page).
- No quotations from real persons. The daily line stays from `DAILY_LINES`.
- Never use shame words (6.2).
- Code: pure logic lives in `src/lib` with a unit test (`pillarMetric`, `digitColumns`, `expandedFrom`, `closeAction` are new). No colour literals in components (all colours are tokens in `src/index.css`). Motion values come from `src/lib/motion.ts` only. Strict TS, no `any`.

## 14. Home-screen app (PWA, round 4)

- 14.1 Install: `vite-plugin-pwa` (generateSW, `registerType: 'prompt'`). The service worker precaches the app shell, every lazy page chunk, the Inter font files and the icons; navigation falls back to `index.html`. After the first load the app starts and works fully offline.
- 14.2 Update: a new version never reloads by itself. A small frosted white toast above the tab bar says "A new version is ready." with the button "Reload the app" and a Close button.
- 14.3 Manifest (`src/lib/manifest.ts`, validated by `manifestProblems`, tested): name "90-day hub", short_name "L90", `display: standalone`, `start_url: ./#/home`, `scope: ./`, portrait, `background_color` = `theme_color` = `--hub-bg-from` (#f4f5f2, round 7), icons 64/192/512 and a maskable 512.
- 14.4 Icon (unchanged in round 7): `public/icon.svg`, a full-bleed dark tile (#0b0e15) with a geometric white "L90" mark and a short green progress bar under it; PNGs come from `@vite-pwa/assets-generator` (`pwa-assets.config.ts`): favicon.ico, 64/192/512, maskable 512, opaque 180 × 180 apple-touch-icon.
- 14.5 iOS: `apple-mobile-web-app-capable`, `mobile-web-app-capable`, status bar `default` (round 7: dark status bar text on the light page), `<meta name="theme-color" content="#f4f5f2">`, title "L90", apple-touch-icon, `viewport-fit=cover`, theme-color. Safe-area insets pad the page top, the tab bar, expanded views, sheets and the update toast. `overscroll-behavior: none` on the root. Inputs are 16 px so iOS does not zoom. Pinch-zoom stays on.
- 14.6 Data: after the first tap the app asks for persistent storage one time (`requestPersistentStorage`, tested). Setup → Backup says: "The app on the home screen keeps its own data. Load a backup to move data from Safari."
- 14.7 Base: Vite `base: './'`, so the build runs from any host path.
- 14.8 Install offer (round 6): see 7.7. iOS Safari in a tab gets a one-time hint card; Android Chrome gets an "Install the app" pill after `beforeinstallprompt`; standalone and desktop get nothing.

## 13. Acceptance checklist (each item: yes / no)

Navigation and structure
1. `docs/ux-spec.md` exists and no other doc contradicts it.
2. The phone tab bar shows exactly: Today, Outreach, the raised +1 DM button, Progress, More. From 1024 px the sidebar shows Today, Outreach, Progress and the 5 More pages (+ the +1 DM button on pages without DM controls).
3. The More menu lists Learning, Fitness, Trading, Method, Setup and nothing else.
4. `#/calendar` opens Progress → Days.
5. Today shows, in this order: the header, the DM counter, "My pillars" (Fitness, Learning, Reading, Trading cards), "Today's ticks" (Outreach, Fitness, Learning, Reading, Trading), the Sign-off card and the chart card.
6. At 390 px the tick cards are one column and the pillar cards scroll sideways inside their row; the page does not scroll sideways.
7. At 1280 px the sidebar is on the left, the pillar cards sit in 4 columns and the tick cards in 3 columns.

Modules and ticks
8. Each tick card shows an icon chip, a name, one number, a ratio (or "Done") and a progress bar; each pillar card shows a metric, a change line or a calm empty line, and a sparkline.
9. Each module shows only the ticks of its pillar for today.
10. `pillarOfTask` returns the results in 3.3 for all 11 default lines (unit test passes).
11. `splitTask` returns the cue/action pairs of 3.4 (unit test passes).
12. One tap on a gym task ticks the task and logs 1 gym session; a second tap reverses both (on Home and in the expanded view).
13. One tap on a reading task ticks it and adds 1 chapter to the current book; a second tap reverses both.
14. The "Gym attended" row no longer exists.
15. Done ticks have no strike-through.
16. Exactly 1 row on Today has the "Next" marker.
17. Filled buttons are limited: the black "+" for +1 DM, the brand-green main act of a card or view (Sign off, Continue, Start), and the tab bar's centre button.
18. −1 DM and the exact count are behind "Adjust" in the Outreach expanded view, not on Home.
19. A module with no tasks today shows its empty line and no tick list.
20. Modules do not move, resize or reorder when a tick changes or when another card opens.
21. Today has no day strip, no legend, no stat block, no level bar, no "Side quests" list, no directive.

Chart
22. The chart on Today shows a metric menu and a 7D/30D/90D control in one row at 360 px.
23. The default chart is DMs, 30 days (7 days before mission day 8).
24. Changing a filter morphs the chart and it rests in < 400 ms (Performance panel).
25. The expanded chart and Progress offer compare mode with 2–3 metrics in "% of target" and a 100 % line.
26. R and XP cannot be added to compare mode.
27. `progressSeries.test.ts` covers null days, rolling counts, range 14, normalisation and clamping; all pass.
28. `insights.test.ts` covers all 5 rules and the "too little data" case; all pass.
29. Every chart (Home, expanded chart, history charts, Progress) has an `aria-label` summary and a "Show data as a table" table.
30. Max 2 insight lines show per card; each is ≤ 20 words.

Reward and sign-off
31. `momentum` tests cover active, recover (1 miss) and ended (2 misses); `daysOnTarget` never decreases.
32. No screen shows a red 0, "failed", "lost" or "broke".
33. "Sign off the day" opens `#/home/signoff` with 3 numbers rolling from 0 (80 ms apart), 1 true highlight and tomorrow's first task; `SignOffSheet` no longer exists.

Layout, materials, colour
34. All spacing values in changed files come from 4/8/12/16/24/32/48/64 (no arbitrary px utilities).
35. Only the radii 12, 20, 24, 32 and full round exist in changed components.
36. Cards and expanded views have no `backdrop-filter`; only the overlay, the tab bar and the update toast have one.
37. Frosted white appears only on the phone tab bar and the update toast; every content surface is a white card on #F4F5F2.
38. There is no backdrop canvas, no backdrop asset and no glass lens code in the app.
39. The only gradient is the Outreach hero card (and the soft chart and sparkline fills).
40. `pillarCards` gives a calm empty state with no data, and only a trading loss is negative (test passes).
41. Setup has no Appearance tab; `#/setup/appearance` falls back to the first Setup tab; the stored hub record and backups are unchanged.
42. `contrast.test.ts` passes: every small text colour ≥ 4.5:1 on white and on the page, green text ≥ 4.5:1 on the done tint and pill.

Accessibility, copy, build
43. Every interactive element on Today, Progress and every expanded view is ≥ 44 × 44 px.
44. Every control shows a visible focus ring; Today and every expanded view work with the keyboard alone.
45. No page and no expanded view scrolls sideways at 360 px.
46. Home height at 390 px with `?sample=1` is about 2,400 px or less (round 7 adds the pillar row and gives each tick card its own row).
47. All new UI copy is STE: ≤ 20 words per sentence, active voice, instructions start with a verb.
48. `npm run build`, `npm test` and the linter pass with no new warnings.

Typography (new)
49. `src/index.css` imports `@fontsource-variable/inter/opsz.css` and `@fontsource-variable/inter/opsz-italic.css` and no other font file; `package.json` has no `@fontsource-variable/cormorant` or `@fontsource-variable/outfit`.
50. `--font-sans` starts with "Inter Variable"; `--font-display` and the Cormorant font no longer exist; the daily line renders in plain Inter in the secondary grey.
51. The type roles in 7.2 exist as `.type-*` classes with the listed sizes, weights and tracking at 390 px and 1280 px; no text is smaller than 13 px.
52. Every changing number uses `.num` (tabular figures); a number change does not shift the width of the text next to it.

Motion system (new)
53. `src/lib/motion.ts` exports `EXPAND_OPEN`, `EXPAND_CLOSE`, `DRAG_RETURN`, `DIGIT_SPRING`, `DISCLOSE`, `OVERLAY_FADE`, `CONTENT_IN`, `CONTENT_OUT`, `STAGGER` with the values in 9.1; `VALUE_SPRING` and `CountUp` are gone; no component inlines spring or duration numbers.
54. Every animation except the sign-off count sequence reaches its target in < 400 ms (Performance panel).
55. No element outside 10.3 and the pill/segment indicators has `layoutId`; no Today grid cell has `layout`.
56. Every big number (modules, expanded views, sign-off, Progress stats) is a `RollingNumber`; each digit column springs on change; `digitColumns` tests pass (including 9 → 10, decimals, signs, "%" and "R").
57. A second +1 DM tap during a roll continues from the current frame (no jump, no restart from the old value).
58. Ticks in an expanded view stagger in 30 ms apart, starting at 120 ms; Home ticks do not stagger.
59. Under `prefers-reduced-motion` no element moves (no transform, no layout flight, no digit roll); views and numbers cross-fade in 150 ms.
60. No Motion+ package, import or copied Motion+ source exists in the repo; only `motion` is used for animation.

Expandable cards (new)
61. The 6 modules and the chart card each open an expanded view from their open target (10.2); ticks and action buttons on Home do not open it.
62. Each expanded view holds the content listed in 10.1 for its id.
63. During open and close, the container, title, number and bar fly between card and view (shared `layoutId`); non-shared content fades and is never visibly stretched.
64. While a view is open, its grid cell keeps its size and no other card moves.
65. The overlay dims the page behind with a light blur; under `prefers-reduced-transparency` it has no blur.
66. The Close button, Escape, a tap on the overlay, swipe down (< 768 px, > 120 px or > 600 px/s) and browser Back each close the view.
67. A short swipe (< 120 px, slow) returns the panel; the tick list still scrolls with a finger.
68. Each view has its route from 10.1; reload on that route shows the view (fade-in); `#/home/foo` shows Today with no view.
69. Closing a view opened by a tap goes back one history entry; closing a deep-linked view replaces the hash with `#/home`; a double tap creates one history entry. `expandedFrom` and `closeAction` tests pass.
70. While a view is open the page behind does not scroll and is `inert`; on close the scroll position is exactly the same as before.
71. On open, focus moves to the view title; Tab stays inside the view; on close, focus returns to the card's open target.
72. The panel has `role="dialog"`, `aria-modal="true"` and an accessible name; the module header has `aria-expanded`.
73. Tapping Close during the open animation reverses from the current frame; tapping the card during the close animation re-opens from the current frame.
74. The open container reaches its target in ≤ 350 ms and the close in ≤ 300 ms (Performance panel).
75. At < 768 px the view covers the tab bar with 32 px top corners; at ≥ 768 px it is a centred panel ≤ 720 px wide with 32 px corners.

Round 3 (user feedback)
76. `isModuleComplete` and `allModulesComplete` in `src/lib/moduleView.ts` are pure and tested (ticks; Outreach target; Sign-off sign-off).
77. A done tick card turns the pale done green with a green rim, a green number, and a "Done" pill with a check; the expanded view header shows the green number; the change animates once (< 400 ms) or fades under reduced motion.
78. When every module is done, Today shows one calm green line with a check icon.
79. Today has no full-width +1 DM bar: the DM counter has a round black 52 px "+" ("Add 1 DM") and a "+5" pill ("Add 5 DMs"); "Adjust" is in the Outreach view and on the Outreach page.
80. "+1 check" and "Sign off" are pills; the chart card has no "Open full view" button (its "Progress" title opens the view, with a chevron); day, phase and level share the caption line over the DM count.
81. Numbers, titles, labels and body follow one weight system (600 / 600 / 500 / 400); no light or bold text.
82. Round 3: Home height at 390 px was lower than in round 2 (1,726 px). Round 5 raises it with the type floor (item 46).

Round 4 (home-screen app)
83. The build has a valid `manifest.webmanifest` (14.3) and `manifestProblems` returns no problem (test passes).
84. The service worker registers on the built app, and after the first load a reload with the network off shows Today, lazy pages and an expanded view.
85. A new version shows the update toast; the app never reloads by itself.
86. `index.html` has the iOS meta tags and the apple-touch-icon (14.5); the apple-touch-icon is 180 × 180 and opaque.
87. Inputs are 16 px or larger on phones; pinch-zoom is not locked.
88. Setup → Backup shows the home-screen data line; the app asks for persistent storage one time.
89. `vite.config.ts` uses `base: './'`; the built app loads its chunks, fonts and service worker from a subpath.

Round 5 (polish)
90. Every input, select, date, number and text area uses the shared field system (7.6): a white field card with the label inside and a green focus ring; no page has its own input styling (the onboarding DM stepper is the one large exception).
91. No screen shows a full-width "+1 DM" bar; "+5" and the round "+" are the same everywhere; "Adjust" is a ghost pill with an icon and a 44 px target.
92. A font-size audit of every page and view at 390 px finds no text below 14 px outside captions and chart axes.
93. Cards use 16 px padding on a phone and 20 px from 640 px; tick rows keep 16 px between the check and the text.
94. Every line or bar chart on every page is the motion chart; the target label is a legend line under the chart.
95. Each page shows one title, then content (no subtitle that repeats the title).

Round 6 (phone fit)
96. Below 640 px the compact scale in 7.7 applies; from 640 px up every size is as in round 5.
97. A font-size audit of every page, tab and expanded view at 390 px finds no text below 13 px outside captions, and no caption below 12 px.
98. Fields are 44 px tall with 16 px text on a phone; every button, chip, pill and tick row has a 44 × 44 px touch target.
99. Home at 375, 390 and 430 px with `?sample=1` is about 2,400 px or less; at 390×844 the header, the DM counter and the pillar row sit above the tab bar.
100. The phone tab bar is frosted white, flush with the bottom with the safe area as padding, with the raised centre +1 DM button; it hides on a scroll down, shows on a scroll up, at the top, at the end and on a new page, and never hides while a field has focus. Reduced motion: no slide.
101. On the phone header the wordmark, the momentum chip and the profile button share one line, with no truncation at 375 px.
102. iOS Safari in a tab shows the install hint one time; "Not now" keeps it closed (`l90-hub-install-hint`). The home-screen app, a desktop and Android without the prompt event show nothing; Android with the event shows "Install the app".
103. Expanded views on a phone have the smaller header and keep Close and the swipe close.

Round 7 (light fintech)
104. The page is #F4F5F2, cards are white with the soft shadow and no border; `index.html` has `theme-color` #f4f5f2, the status bar style `default` and no `dark` class; the manifest colours are #f4f5f2 (test passes).
105. Outreach shows the back button and the centred title on a phone, the gradient hero card, a Week | Month | 90 days pill control (active pill brand green), rounded green bars in front of pale target bars with a dashed "20 target" line, and the funnel rows Sent, Replies, Calls, Clients with % pills (`outreachBars` and `funnelSummary` tests pass).
106. Progress shows the metric pills, the green area chart with the crosshair dot and tooltip, insight tiles in 2 columns, and the 90-day heatmap of small rounded squares (15 a row, today outlined, no red) with a link to the Days tab.
107. Fitness shows the ring gauge (blue into green) for the week, the week chips, the "Gym attended today" switch (`role="switch"`, adds or removes a session of today), the 13-week history chips, the totals and the daily heatmap.
108. Onboarding shows a back button, "Step N of M", a thin brand-green progress bar, one big title, the DM target stepper, the gym-day chips, a review list where each row opens its step, and a full-width brand-green button ("Continue", then "Start day 1"). The logic in `src/lib/onboarding.ts` is unchanged.
109. Learning, Fitness, Trading, Method and Setup show a back button and a centred title below 1024 px.
