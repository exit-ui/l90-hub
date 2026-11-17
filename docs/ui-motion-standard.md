# UI motion and interaction standard

A standard for how an interface moves and responds. It is written to be reused: nothing here depends on the L90 hub except the last section.

**What to copy into a new project**

| File | What it is |
| --- | --- |
| `src/motion-kit.css` | The tokens and the recipes. One file, no dependencies. Import it once. |
| `src/lib/motion.ts` (`DURATION`) | The same durations in seconds, for JavaScript animation. |
| `src/lib/motionKit.test.ts` | Checks the kit against the rules below, so the standard cannot drift. |
| `docs/motion-kit-demo.html` | Before and after, side by side. It imports only the kit, which proves the kit is portable. |

The ideas come from a design reel on the twelve principles of animation and a list of interface laws, plus a second reel of CSS rules. The wording, the numbers and the recipes below are this project's own.

---

## 1. First question: how often does it happen?

Motion has a cost. The more often an action repeats, the less it may animate, because the same flourish stops being a delight and becomes a delay.

| Tier | Examples | Budget | Allowed |
| --- | --- | --- | --- |
| **A. Constant** (dozens of times a day) | a +1, a key press, a tab, an arrow key in a list | 90 to 150 ms | A press state and a number change. No travel, no particles. A run of repeats gets the full answer once and a quiet answer after. |
| **B. Daily** (a few to many times a day) | a tick, a sheet, a page change, a card swap | 150 to 300 ms | One move, one curve. At most one small secondary detail. |
| **C. Rare** (a few times a week) | a finished day, a new record, a finished timer, a refusal | up to 700 ms | Push it past real: overshoot, a spin, a burst. |

The ceiling for the main move of anything in tier A or B is **300 ms**. Past that, the interface feels like it is waiting. A small secondary flourish (a burst, a ring) may trail the main move by up to 100 ms, so it ends by 400 ms.

## 2. Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--mk-dur-instant` | 90 ms | the press going down; keyboard navigation |
| `--mk-dur-quick` | 150 ms | a tooltip, a toggle, an icon swap |
| `--mk-dur-base` | 220 ms | a release, a row, a card |
| `--mk-dur-slow` | 300 ms | a sheet or a view: the ceiling |
| `--mk-dur-ceremony` | 700 ms | tier C only |
| `--mk-ease-out` | `cubic-bezier(.2,.8,.2,1)` | things that arrive |
| `--mk-ease-in` | `cubic-bezier(.4,0,1,1)` | things that leave |
| `--mk-ease-in-out` | `cubic-bezier(.65,0,.35,1)` | things that cross the screen |
| `--mk-ease-overshoot` | `cubic-bezier(.2,.9,.3,1.35)` | things with weight |

Never `linear`, except for a clock or a progress ring that must run at a constant rate. Never a raw number of milliseconds in a component: use a token.

## 3. The twelve principles

For each: the rule, the recipe in the kit, and the trap.

1. **Squash and stretch.** Things deform on impact, and that is what gives them weight.
   *Recipe:* `mk-press` (a small control flattens and widens under the finger and overshoots on release); `mk-pop` (a landing stretches, squashes, settles).
   *Trap:* a non-uniform squash on a wide card distorts its text. Squash small controls only. Cards tilt (`mk-tilt`) or scale evenly.
2. **Anticipation.** A small wind-up tells the eye a big move is coming.
   *Recipe:* `mk-windup-out`: a lean back for the first sixteenth, then the exit.
   *Trap:* a wind-up that delays the answer. The thing must start to move within about 50 ms of the tap.
3. **Staging.** Direct the eye to one thing at a time.
   *Rule:* one focal element per view and one primary action. A sheet dims what is behind it. Do not run two attention-grabbing moves at once.
4. **Pose to pose.** Decide the key poses, then let the curve fill in the rest.
   *Rule:* write keyframes with named poses (rest, wind-up, impact, settle) and test those poses. Do not tune a long animation by eye.
5. **Follow-through and overlap.** Parts keep moving after the main body stops, and they do not all start together.
   *Recipe:* `mk-settle` with `--mk-i`: the card lands, then its parts rise into place 45 ms apart.
6. **Slow in, slow out.** Everything speeds up and slows down.
   *Rule:* use the ease tokens. `linear` is for clocks.
7. **Arcs.** Natural motion follows curves.
   *Recipe:* the exit and the arrival rise and fall while they travel (`mk-windup-out`, `mk-arc-in`): the vertical path peaks mid-way, so the path bends.
8. **Secondary action.** A small flourish backs up the main action. It never competes with it.
   *Rule:* a check gets a burst or a ring; a Done chip gets a pop. One flourish, smaller than the main move.
9. **Timing.** Duration is the feel. Small UI is 150 ms or less; nothing in daily use is above 300 ms.
10. **Exaggeration.** Push feedback past real so the moment lands, in tier C and for refusals.
    *Recipe:* `mk-shake` (a decaying shake on a wrong value; toggle the class, never remount the field, so the keyboard stays), `mk-flip` (a badge that spins in perspective and lands).
11. **Solid drawing.** Give flat things depth and volume.
    *Recipe:* `mk-tilt` (a card tips away in perspective under the finger), layered shadows, a lighter top edge on dark surfaces.
12. **Appeal.** The sum of the details. Review the whole path of a feature, not one animation.

## 4. The interface laws

| Law | Rule | How to check |
| --- | --- | --- |
| **Fitts** | Bigger and closer targets are faster to hit. Put the primary action in the thumb's reach. | The main button of a view sits at the bottom. |
| **Bigger hit areas** | The target may be larger than it looks. | Every control has a 44 px target (a pseudo-element if the icon is small). |
| **Hick** | More choices, slower decisions. | One primary action per view. A list of options is chunked or hidden behind one tap. |
| **Miller** | People hold about seven things. Chunk. | A group of more than seven items is split, folded or paged. |
| **Doherty** | Answer within 400 ms or it feels slow. | The press state is instant; slow work shows a placeholder of the same size at once. |
| **Postel** | Accept messy input; give back clean output. | A field takes what a person would type (a unit, a space, a currency sign) and shows the clean value. Never guess a comma as a decimal point: it could mean either. |
| **Jakob** | People expect your app to work like the others they use. | Tab bar at the bottom, a sheet that swipes down, a back gesture that goes back. |
| **Frequency of use** | The more it is used, the less it should animate. | Section 1. Press the arrow key twenty times in a list: if the highlight slides each time, remove the slide. |

## 5. CSS craft

Small rules that separate a careful interface from a default one.

- **Nested radius.** The inner radius is the outer radius minus the padding. A 24 px card with 6 px padding has 18 px inner rows.
- **Alpha borders.** A border is a translucent colour, so it blends with whatever is behind it (a gradient, a photo). A solid grey border looks pasted on.
- **Perceptual colour.** Choose and mix colours in OKLCH (or `oklab`): equal steps look equal. A gradient between two bright hues goes grey in the middle in sRGB; interpolate in OKLCH, or add a middle stop.
- **Icon beside text.** The icon's stroke weight matches the text's weight, and its height matches the text's cap height.
- **Edges that scroll.** A strip or a ruler that scrolls sideways fades out at its ends with `mask-image`, instead of cutting at a hard edge.
- **Icons that swap.** A swapped icon (Pause to Play, a copy icon to a check) turns in and settles over 150 to 180 ms. It does not snap.
- **Depth on dark.** A shadow barely shows on a dark surface. Raise a surface with a lighter fill and a thin light top edge.
- **Viewport height.** Use `dvh`, not `vh`, so the phone's moving address bar does not push content off the screen.
- **White-background images** on a coloured surface: `mix-blend-mode: multiply` makes the white vanish.

## 6. Performance rules

1. Animate `transform` and `opacity` only. Never width, height, top, left, margin, a filter or a blur. The test fails a keyframe that does.
2. Prefer a CSS keyframe or transition to a script that sets a value every frame.
3. A repeating animation (a drifting glow) is the first thing to cut if a phone gets warm.
4. No `transition: all`.
5. Every recipe has a reduced-motion rule that stops it and leaves the plain end state. The test fails a recipe without one.
6. A tap must not cost more than a few milliseconds of script. Measure on a production build.

## 7. Review checklist

Before a feature that moves ships, answer each:

1. How often does it happen? Which tier is it in?
2. Is the longest duration within the tier's budget?
3. Does it start to move within 50 ms of the tap?
4. Does it ease in and out (no `linear`)?
5. Is it one move plus at most one small secondary detail?
6. Do the parts land after the body (follow-through)?
7. Is the 44 px target in place?
8. Does it stop under reduced motion, and is the end state correct?
9. Does a screenshot of the middle of the move look good, not only the end? (Section 8.)
10. Did the cost in script time stay a few milliseconds?

## 8. How to verify motion

A screenshot is one instant. To see a move, check its poses:

```js
// Pause an animation and read its pose at chosen times.
const a = element.getAnimations().find((x) => x.animationName === 'mk-pop');
a.pause();
for (const t of [0, 120, 186, 300]) {
  a.currentTime = t;
  await new Promise(requestAnimationFrame);
  console.log(t, getComputedStyle(element).transform);
}
```

- Read the keyframes (`a.effect.getKeyframes()`): only `transform` and `opacity` should appear.
- A/B the cost: inject `*{animation:none!important;transition:none!important}` and compare the median time of a tap with and without.
- `:active` cannot be held from a script. Give the element a temporary class with the same rules, or test on the device.
- Record the phone. Frame by frame, the first frame after the tap should come within 100 ms.

---

## 9. Appendix: where L90 uses it

| Recipe | Where |
| --- | --- |
| `mk-press` | the check on the Up next card, the timer buttons |
| `mk-tilt` | the pillar tiles on Today |
| `mk-windup-out`, `mk-arc-in`, `mk-settle` | the Up next card: it leans back, leaves on an arc, the next card arrives on an arc and its parts land after it |
| `mk-pop` | the timer's running ring, the "Done" chip at the top of the page |
| `mk-flip` | the check badge when a timer finishes |
| `mk-shake` | a field with a wrong value (trade journal, payouts) |
| Frequency of use | a run of +1 DM taps: only the first of a run (and the one that reaches the target) flashes the glow |
| Miller (chunking) | Progress is three tabs, Pillars, Focus and Days, instead of one long page |
| Depth on dark | the white controls on the dark theme (`raised`): a bright top edge and a deep drop |
| OKLCH | the DM segments and the centre button |

Kept as they were, on purpose: the burst and ring on a tick (tier B, already one move plus one flourish; shortened to 400 ms and 300 ms to meet the budget), the glow, the page and view motion (already under 300 ms).

Not done, and why: OKLCH for every colour token (the contrast tests read hex and rgb, and the pillar gradients are single hue, so nothing goes grey in the middle; only the two-colour greens use it); number-field leniency (the fields are `type="number"`, so the browser already rejects messy text before it arrives).
