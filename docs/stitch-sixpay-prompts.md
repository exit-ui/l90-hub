# L90 in the Sixpay style — Google Stitch prompts

Reference: "Sixpay Mobile App Dashboard UI UX Design" by six2eight on Dribbble.
Frames captured from the shot are in `docs/stitch-reference/`. Upload them to Stitch as **style references only**. Use L90's own content and a different logo. Do not copy Sixpay's brand.

| File | What to take from it |
| --- | --- |
| `01-dashboard-balance.png` | Header with logo, bell, and avatar. A huge balance number with grey decimals. Round black "+" button. Horizontal cards with sparklines. Tab bar with a raised dark-green centre button. |
| `02-bar-chart-segmented.png` | Pill segmented control (dark green active pill). Rounded green bars, with lighter "target" bars beside them. |
| `03-hero-card-status-tiles.png` | Gradient hero card (black to deep blue). Three small square status tiles with an icon, a label, a green "On" pill, and a tiny status dot. A ring gauge ("2.5/5 GB"). |
| `04-sparklines-icon-grid.png` | Sparkline cards with a red/green change line. A grid of round icon chips with a label and a small value. |

---

## Style DNA (paste before every prompt)

> Style: clean fintech dashboard, in the manner of the attached references. Off-white app background (#F4F5F2), with pure white cards at a 20–24px radius and no borders, only a very soft shadow. One brand colour: deep forest green (#0F3D24), used for the active pill, the raised centre tab button, and primary actions. Success green (#3DDC84) is for bars, "On" pills, and positive change; muted red (#E5484D) is for negative change. Near-black text (#111) with grey secondary text (#8A8F98). Type: a geometric sans (Inter or Satoshi). Huge numbers at 40px semibold, with the decimals in grey at the same size. Section titles 17px semibold, each with a "View details >" link on the right. Generous 20px side margins and 24px between sections. Icons are thin 1.5px outline. Bottom tab bar: white, 4 items with a raised 56px dark-green circular centre button holding a sparkle icon. iPhone 15 frame, 390 × 844.

---

## Prompt 1 — Today dashboard

> [Style DNA] Design the home screen of **L90**, a 90-day accountability app.
> Header: an "L90" wordmark with a small laurel mark on the left; a bell and a round avatar on the right.
> Under it: the caption "Day 24 of 90 · Phase 2", then a huge number "12/20" with "/20" in grey, labelled "DMs sent today". A round black "+" button sits on the right to log a DM.
> Section "My pillars" with "View details >": a horizontal scroll of white cards (160 × 150), one each for Outreach, Fitness, Learning, Reading, Trading. Each card has a round icon chip top right, a name, a big value (for example "4 / 5 gym days"), a small green or red change line ("↑ 2 vs last week"), and a soft area sparkline at the bottom.
> Section "Today's ticks": three small square status tiles in a row (Gym, Study, Read), each with an outline icon, a label, a green "Done" pill or a grey "To do" pill, and a tiny dot top right.
> A "Sign off the day" card at the bottom with a progress ring "4/5".
> Tab bar: Today, Outreach, [raised centre "+" log button], Progress, More.

## Prompt 2 — Outreach detail

> [Style DNA] Design the **Outreach** screen. Top: a back arrow in a circle, and the centred title "Outreach".
> A gradient hero card (black to deep forest green, with a soft light glow at the bottom right): "Instagram outreach", "Target 20 a day", a big "1,840 DMs sent", and an "Edit target" link at the bottom right.
> A segmented pill control: Week | Month | 90 days (the active one dark green).
> A bar chart: rounded green bars for DMs per day, with a pale green "target" bar beside each one. A big number "16.4 avg" with "+12%" in green above the chart.
> Section "Funnel": four stat rows, Sent → Replies → Calls → Clients, each with a value and a % on the right in a grey "High/Low" style table.

## Prompt 3 — Progress

> [Style DNA] Design the **Progress** screen. Segmented pill filter: DMs | Gym | Learning | Reading | Trading.
> A line chart card for daily progression over 90 days, with a soft gradient fill under the line and a tap crosshair showing "Day 31 · 22 DMs".
> Section "Insights": two white cards side by side ("Best week: Week 3, 131 DMs", "Gym streak: 9 days").
> Section "90 days": a calendar heatmap of 90 small rounded squares in 13 rows of 7; green when on target, pale grey when not yet reached. No red.

## Prompt 4 — Pillar detail (Fitness example)

> [Style DNA] Design the **Fitness** detail screen. A back arrow and the centred title.
> A ring gauge card: "4 / 5 sessions this week", with a blue-to-green arc and the caption "Attended on Mon, Tue, Thu, Fri".
> A large "Gym attended today" toggle row with a green "On" pill.
> Section "History": a grid of round icon chips (one per week, W1–W13). Each shows a small value ("5/5") in green, or grey when the week is not reached yet.

## Prompt 5 — Onboarding

> [Style DNA] Design a 5-step onboarding flow with one question per screen and a thin dark-green progress bar at the top. Step 1: "When do you start?" with a date picker card. Step 2: "Daily DM target" with a big stepper number "20". Step 3: "Where are you now?" with three input cards (followers, clients, account balance). Step 4: "Gym days per week" with chips 3 to 6. Step 5: a review card listing every answer, and a full-width dark-green button "Start day 1".

## Prompt 6 — Dark variant (to keep L90's night look)

> Make a dark version of the same screens. Background #05060A, cards #111318 with a 1px hairline (#FFFFFF10), white text, grey secondary text (#8A8F98). Keep forest green as the brand colour, but lift it to #1F6B45 for contrast; keep success green #3DDC84. The hero card is a gradient from black to deep navy with a faint city-light glow. The tab bar becomes frosted dark glass, and the raised centre button stays green.

---

## Tips for Stitch

- Generate one screen per prompt. Then say "apply the same style to…" so the screens stay consistent.
- If Stitch drifts, re-attach `01-dashboard-balance.png` and say "match this spacing and type scale exactly".
- Export to Figma or code once the five screens look right. Then I can rebuild the live app to match them.
