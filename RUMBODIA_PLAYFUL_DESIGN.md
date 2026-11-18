# Rumbodia — Playful Redesign Spec (Web App)

> **Goal:** Make Rumbodia feel fun, warm and alive, like the "Moe" habit app reference: chunky type, friendly geometric mascots, speech bubbles and confetti. It also has to work as a **desktop-first web app**, not a phone app, and the **whole app's color and mascot change with your current level (mood)**.

---

## 0. Design principles

1. **A character, not a dashboard.** Every screen has a mascot ("Rumbo") that reacts to your day. The numbers are still there, but the first thing you see is a face.
2. **The color is the mood.** The app's accent color changes with your level: green when you're soaring, blue when you're rising, red when you're falling. You can tell how your day is going without reading anything.
3. **Shape *and* color.** Each level has its own mascot shape too, so color-blind users can still read the level (accessibility).
4. **Honest, never mean.** The mascot can be playful when you're down, but it never mocks you. On bad days it's supportive ("Rough one. Tomorrow's a new rumbo.").
5. **Big, bold, lots of air.** Large headings, rounded cards, a soft cream background and generous whitespace, as in the reference.
6. **Fun scales down on desktop.** On a wide screen the fun lives in the hero areas and moments (after you submit, when you open a streak). Tables and charts stay clean.

---

## 1. The mascot: "Rumbo"

One character that changes **shape + color + expression** by level, just as the reference uses a pentagon, a triangle and a blob.

| Level | Score | Shape | Color name | Expression / pose | Idle animation |
|---|---|---|---|---|---|
| 😄 **Soaring** | +7 → +10 | ⭐ Rounded **star / burst** | **Green** | Huge grin, arms up, sparkles | Bounces, little sparkles pop |
| 🙂 **Rising** | +3 → +6.99 | 🔺 **Triangle** pointing up | **Blue** | Smile, thumbs up | Gentle hop |
| 😐 **Steady** | −2.99 → +2.99 | ⚪ **Circle / pill** | **Yellow** | Calm, half-closed eyes | Slow breathing (scale 1 → 1.03) |
| 🙁 **Slipping** | −6.99 → −3 | ⬟ **Pentagon**, tilted 10° | **Orange** | Worried eyebrows, small frown | Slight wobble |
| 😞 **Falling** | −10 → −7 | 🔻 **Droopy blob** (melting square) | **Red** | Sad eyes, little rain cloud above | Slow sag + rain drops |

**Build notes**
- Draw each mascot as **one SVG component** (`<Rumbo level="rising" size="lg" />`). Use `currentColor` for the body so it inherits the theme color automatically.
- Eyes and mouth are separate SVG groups, so you can animate blinks (every 4–6 s at random) and swap expressions.
- Sizes: `xs` 24px (calendar cells, badges), `sm` 40px (entry rows), `md` 96px (cards), `lg` 200–280px (hero, success screen).
- The current icon set (emoji faces) becomes these mascots everywhere: the calendar, the level filter chips, the chart legend and the share card.

**Speech bubbles** (like "GOOD JOB!" in the reference)
- Cream bubble with a dark 2px outline, handwritten font, a small tail pointing at the mascot.
- Copy changes by level and time of day. Examples:

| Level | Sample lines |
|---|---|
| Soaring | "LOOK AT YOU GO!" · "Today's on fire 🔥" · "Screenshot this day." |
| Rising | "Nice direction!" · "Up and to the right." · "Keep that rumbo." |
| Steady | "Holding the line." · "Steady wins too." · "One small push?" |
| Slipping | "Hey, it happens." · "What's one easy win?" · "Let's turn this around." |
| Falling | "Rough one. I'm here." · "Tomorrow's a new rumbo." · "Be kind to yourself today." |

Keep 6–10 lines per level and pick one at random. Gemini's `reason` can also be shown in the bubble after scoring (truncated, with "more" to expand).

---

## 2. Mood-based theming (the core idea)

### 2.1 Which level drives the theme?

Use a **"current mood"** value, in this order:
1. **Today's average score**, if there's at least one entry today.
2. Otherwise, **yesterday's average** (so the app doesn't go grey every morning).
3. Otherwise (a new user or no recent entries), the **neutral brand theme** (Steady / yellow, or a brand purple; see 2.4).

On screens that are about a specific day or entry (a day sheet, an entry detail), that day's/entry's level overrides the global theme locally, inside that card or sheet only.

Add a setting: **"Color follows my mood" (On / Off)**. When off, the app uses the neutral brand theme. Some people won't want a red app on a bad day.

### 2.2 Color tokens per level

Each level defines the same set of tokens. Light theme values:

| Token | Soaring (green) | Rising (blue) | Steady (yellow) | Slipping (orange) | Falling (red) |
|---|---|---|---|---|---|
| `--mood-500` (main) | `#3FA34D` | `#3B82F6` | `#F2C230` | `#F28C28` | `#E5484D` |
| `--mood-600` (hover / pressed) | `#2F8A3C` | `#2563EB` | `#D9A81A` | `#D9731A` | `#CC3338` |
| `--mood-100` (tint, chips, bubbles) | `#DDF2DF` | `#DCEAFE` | `#FCF1C7` | `#FDE5CC` | `#FBDCDD` |
| `--mood-50` (page wash) | `#F1FAF0` | `#EFF5FF` | `#FEF9E7` | `#FEF4EA` | `#FDF0F0` |
| `--mood-ink` (text on `-500`) | `#0F2E14` | `#FFFFFF` | `#3A2C00` | `#2E1600` | `#FFFFFF` |
| Background shape blobs | `#CFEBD2` | `#CFE0FC` | `#F9E7A6` | `#FBD6B0` | `#F8C6C8` |

**Fixed (non-mood) tokens**

| Token | Value | Use |
|---|---|---|
| `--cream` | `#FBF8EE` | Main app background (as in the reference) |
| `--ink` | `#1C1C1A` | Text, outlines, the dark hero panel |
| `--ink-soft` | `#5E5E57` | Secondary text |
| `--card` | `#FFFFFF` | Cards |
| `--line` | `#E8E4D6` | Borders |

**Dark theme:** use `--ink` (`#161614`) as the page background and `#22221F` for cards, keep `--mood-500` as is (check contrast), and replace `--mood-50/100` with the main color at 12% / 20% opacity.

> Always check contrast: white text on yellow and orange fails, which is why those use dark `--mood-ink`. Run the tokens through a WCAG checker (target 4.5:1 for body text, 3:1 for large text and icons).

### 2.3 Implementation (Tailwind v4 + CSS variables)

Put the level on the root element and let CSS variables do the rest:

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-cream: #FBF8EE;
  --color-ink: #1C1C1A;
  --color-mood-50:  var(--mood-50);
  --color-mood-100: var(--mood-100);
  --color-mood-500: var(--mood-500);
  --color-mood-600: var(--mood-600);
  --color-mood-ink: var(--mood-ink);
  --font-display: "Bricolage Grotesque", system-ui, sans-serif;
  --font-hand: "Gaegu", "Patrick Hand", cursive;
  --radius-blob: 2rem;
}

:root, [data-mood="steady"] {
  --mood-50:#FEF9E7; --mood-100:#FCF1C7; --mood-500:#F2C230; --mood-600:#D9A81A; --mood-ink:#3A2C00;
}
[data-mood="soaring"]  { --mood-50:#F1FAF0; --mood-100:#DDF2DF; --mood-500:#3FA34D; --mood-600:#2F8A3C; --mood-ink:#0F2E14; }
[data-mood="rising"]   { --mood-50:#EFF5FF; --mood-100:#DCEAFE; --mood-500:#3B82F6; --mood-600:#2563EB; --mood-ink:#FFFFFF; }
[data-mood="slipping"] { --mood-50:#FEF4EA; --mood-100:#FDE5CC; --mood-500:#F28C28; --mood-600:#D9731A; --mood-ink:#2E1600; }
[data-mood="falling"]  { --mood-50:#FDF0F0; --mood-100:#FBDCDD; --mood-500:#E5484D; --mood-600:#CC3338; --mood-ink:#FFFFFF; }

/* Smooth color change when the mood switches */
:root * { transition: background-color .6s ease, color .6s ease, border-color .6s ease, fill .6s ease; }
@media (prefers-reduced-motion: reduce) { :root * { transition: none; } }
```

```tsx
// src/features/theme/MoodProvider.tsx
"use client";
export function MoodProvider({ children }: { children: React.ReactNode }) {
  const { data } = useCurrentMood();            // React Query: today's avg → yesterday → null
  const { followMood } = useSettings();
  const level = followMood && data ? data.level : "steady";
  useEffect(() => { document.documentElement.dataset.mood = level; }, [level]);
  return <>{children}</>;
}
```

Then components only use mood classes: `bg-mood-500 text-mood-ink`, `bg-mood-100`, `ring-mood-500`. A sticky "local" mood for a card is just `<div data-mood="falling">…</div>`.

- **Favicon + PWA theme color** change too: update `<meta name="theme-color">` and swap the favicon to the matching mascot face. People will see the tab icon change color during the day, which is a nice "alive" touch.
- **Level colors in charts and the calendar stay fixed** (Soaring is always green, and so on), whatever the global theme. Only the "chrome" (buttons, header, accents, background blobs) follows the current mood.

### 2.4 Neutral / brand theme

For the landing page, sign-in and new users, use **Steady yellow** with the dark ink hero (closest to the reference), or add a sixth "brand" set (for example a violet `#7C5CFA`) if you want the brand to stand apart from the levels. Recommendation: keep it simple and use Steady.

---

## 3. Typography

| Role | Font | Size (desktop) | Notes |
|---|---|---|---|
| Hero headline | **Bricolage Grotesque** ExtraBold (800) | 64–88px, line-height 0.95 | ALL CAPS on landing; mixed case in app |
| Page title | Bricolage Grotesque Bold | 36–44px | "Hey, George!" style greeting |
| Card title | Bricolage Grotesque SemiBold | 18–20px | |
| Body | **Inter** or Bricolage Regular | 15–16px | |
| Speech bubbles, stickers | **Gaegu** Bold or **Patrick Hand** | 18–24px, ALL CAPS | The handwritten "GOOD JOB!" feel |
| Numbers (scores) | Bricolage Grotesque with `tabular-nums` | | |

All are free on Google Fonts; load them with `next/font/google`.

**Two-color headlines** (as in "GO FOR **BETTER HABITS** WITH MOE"): write headings in `--ink` with one or two key words in `--mood-500`. Example: "WHICH WAY IS **YOUR DAY** GOING?" Add a small hand-drawn squiggle SVG under a word for extra charm.

---

## 4. Shapes, surfaces and decoration

- **Radius:** cards 24px, buttons are full pills (999px), inputs 16px, mascot cards 32px.
- **Borders:** soft 1px `--line` on cards. Speech bubbles and "sticker" elements get a **2px `--ink` outline**, which gives the cartoon look.
- **Shadows:** very soft (`0 2px 0 rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)`). For stickers and the main CTA, use a **hard offset shadow** (`4px 4px 0 var(--ink)`) for a playful, tactile feel.
- **Background blobs:** 2–3 big, soft, rotated rounded squares behind the layout in the mood's blob color (as in the reference's green shapes). Fixed position, `z-index: -1`, slow drift animation (60 s loop).
- **Confetti:** small triangles, circles, stars and squiggles in mixed colors (pink `#E84393`, blue, yellow, green), the way the reference's success screen does it. Use only for wins.
- **Squiggles and sparkles:** small SVG doodles near headings and the mascot.

---

## 5. Web layout

### 5.1 App shell (desktop ≥ 1024px)

```
┌──────────────┬───────────────────────────────────────────────┬─────────────────┐
│  SIDEBAR     │  MAIN                                         │  RIGHT RAIL     │
│  (240px)     │  (fluid, max 880px)                           │  (320px, ≥1280) │
│              │                                               │                 │
│ ◉ Rumbodia   │  Hey, George!            [ + New update  N ]  │  Rumbo mascot   │
│              │  Tue 17 Nov · afternoon                       │  + speech bubble│
│ ⌂ Today      │  ┌─ week strip: Mo Tu We Th Fr Sa Su ──────┐ │                 │
│ ☰ Entries    │  │  each day = tiny mascot in level color  │ │  Today's score  │
│ ▦ Calendar   │  └──────────────────────────────────────────┘ │  big number     │
│ ↗ Stats      │                                               │                 │
│ ◎ Goals      │  Today's updates (cards)                      │  Streak 🔥 12   │
│ ⚙ Settings   │                                               │  Goals progress │
│              │                                               │                 │
│ [trial pill] │                                               │                 │
└──────────────┴───────────────────────────────────────────────┴─────────────────┘
```

- **Sidebar:** cream background, active item is a pill in `bg-mood-500 text-mood-ink`. A tiny mascot next to the logo always shows the current mood.
- **Right rail:** the "companion" area, with the big mascot, speech bubble, today's score and streak. It hides below 1280px and moves to the top of the main column as a hero card.
- **Tablet (768–1023px):** collapsed icon-only sidebar (72px).
- **Mobile (< 768px):** keep your current bottom tab bar, styled as the reference's dark floating pill bar ("+ New habit" style) with the **+** button in `bg-mood-500`.

### 5.2 The dark hero panel

Borrow the reference's first screen (dark panel, huge text, mascot peeking from the corner) for:
- the **landing page hero**
- the **empty state** of Today ("No updates yet. Which way is your day going?")
- the **paywall / trial-ended** screen

The panel is `bg-ink text-cream` with highlight words in `--mood-500`, and a large mascot cut off at the bottom-right edge.

---

## 6. Screen-by-screen

### 6.1 Landing page (`/`)
1. **Hero (dark panel):** "WHICH WAY IS **YOUR DAY** GOING?" + subline + [Start free — 7 days] (hard-shadow pill) + mascot peeking + bubble "IT'S MORE FUN TOGETHER!"-style line, e.g. "I'LL KEEP YOU HONEST!"
2. **Live demo:** a fake composer where visitors type an update and see the mascot react through all five levels (canned responses, no Gemini call needed). The page color changes live, which shows off the mood theming.
3. **"Meet the levels" strip:** five mascots in a row, each with its color, name and score range. On hover they do their idle animation.
4. **How it works:** three steps with illustrations (Write → Get scored → See your direction).
5. **Stats preview:** a screenshot or animated Rumbo chart.
6. **Pricing:** three cards, Yearly highlighted with a sticker "BEST VALUE". **Black Friday banner** at the top (see Improvements).
7. **FAQ + footer.**

### 6.2 Today / Home (`/app`)
- Greeting "Hey, {firstName}!" + date + time of day.
- **Week strip** (as in the reference's date pills): 7 days, each with a small mascot in that day's level color. Today is the dark filled pill. Click → day sheet.
- **Companion card:** big mascot + speech bubble tip. Tips can come from goals ("You've run 2/4 times this week. One more today?").
- **Today's updates** as cards: left = small mascot + score, middle = text, wins (✓ green) and slips (✗ red) chips, tags; right = time + ⋯ menu.
- **Goals progress row:** each goal as a rounded card with its icon and a progress ring (e.g. 2/4 this week), like the reference's "Go for a walk / 25 min" rows.

### 6.3 New update (composer)
- Opens as a **centered modal** on desktop (560px wide), a bottom sheet on mobile.
- Large textarea with placeholder "1. Ran 1 km  2. Talked to customers…".
- Boost / Drain chips: rounded pills with ⬆/⬇ icons, max 3 each.
- **While Gemini scores** (can take several seconds): the mascot "thinks", cycling through shapes with a "Hmm, let me see…" bubble. Never a plain spinner.
- **Result screen** (like the reference's success screen):
  - The mascot morphs into the result level with a bounce, the whole app theme transitions to the new color.
  - Big score number counts up/down to the value.
  - Bubble with a level line + Gemini's `reason`.
  - Wins and slips as checklist cards (like "Helpful tips" in the reference).
  - **Confetti only for Rising and Soaring.** Slipping/Falling get a gentle, supportive animation (a small rain cloud that turns into a sun after 2 s).
  - [Done] button (big pill in `bg-mood-500`) + "Edit" text button.

### 6.4 Entries (`/app/entries`)
- Keep the structure (month grouped by day), but each day header gets the day's mascot + average score as a colored pill.
- Level filter chips use the mascot shapes in their colors.
- Delete toast with Undo: playful copy ("Poof! Undo?").

### 6.5 Calendar (`/app/calendar`)
- Month grid where each day cell is a **tiny mascot in that day's color**. Empty days are a faint dotted circle.
- Today's cell has a dark ring.
- Month trend card: "This month you're **Rising** 📈" with the mascot and a mini sparkline.
- Year view: a GitHub-style heatmap using the five level colors.

### 6.6 Stats (`/app/stats`)
- Charts stay clean and readable; the fun goes into card headers and small stickers.
- Rumbo chart: line uses a gradient through the level colors by value (green at top, red at bottom); points are small mascot dots. Background bands show the 5 level zones in very light tints.
- Streak card: big flame + number, sticker "12 DAYS!".
- Weekly AI insight: shown as a "letter from Rumbo" card with a handwritten title.
- **Share card:** redesign as a poster in the reference style: dark or mood-colored background, big mascot, "MY WEEK: RISING", score and streak. Square (1080×1080) and story (1080×1920) sizes.

### 6.7 Goals, Settings, Data, Billing
- Goals: each goal is a chunky card with a big icon and its target as a pill ("4×/week").
- Settings: add **"Color follows my mood"**, **"Mascot animations" (On / Reduced / Off)** and **"Sounds" (Off by default)**.
- Billing: plan cards with stickers; the current plan gets a mascot badge "YOU'RE HERE".

---

## 7. Motion

| Moment | Animation | Duration |
|---|---|---|
| Theme change | Colors cross-fade | 600 ms |
| Mascot idle | Per level (see §1) | Loop |
| Mascot blink | Eyes scaleY 1 → 0.1 → 1 | 150 ms, every 4–6 s |
| Scoring | Shape morph cycle | Until response |
| Result reveal | Spring bounce (scale 0.6 → 1.1 → 1) + count-up | 700 ms |
| Confetti | 40–60 pieces, gravity fall | 1.5 s |
| Card hover | translateY(-2px) + shadow grows | 150 ms |
| Button press | Hard shadow collapses (translate 4px) | 80 ms |

- Use **Framer Motion** (`motion`) for springs and SVG morphs, and `canvas-confetti` for confetti.
- Respect `prefers-reduced-motion`: no confetti, no bouncing, only fades.

---

## 8. Voice & microcopy

- Short, warm, a little cheeky. Second person ("you").
- ALL CAPS only in stickers and bubbles.
- Examples:
  - Empty state: "Nothing yet today. Which way is it going?"
  - Gemini error: "My brain glitched 🤯 Your text is saved, try again?"
  - Trial ending: "3 days left with me. Let's keep going?"
  - Paywall: "Your free week's up! Keep your rumbo going."
  - Streak lost: "Streak reset. No drama, start a new one today."

---

## 9. Accessibility checklist

- [ ] Level is shown by **shape + color + label**, never color alone.
- [ ] Text contrast ≥ 4.5:1 on every mood theme (yellow/orange use dark ink).
- [ ] Mascots have `aria-label` (e.g. "Rising, score 4.5"); decorative blobs and confetti are `aria-hidden`.
- [ ] All animations respect `prefers-reduced-motion` and the in-app setting.
- [ ] Focus rings use `ring-2 ring-ink ring-offset-2` (visible on every mood color).
- [ ] Keyboard shortcuts stay (N, ← →, Esc) and are listed in a `?` help sheet.

---

## 10. Suggested component list

```
src/features/mascot/
  Rumbo.tsx            // <Rumbo level size expression animated />
  shapes/*.tsx         // star, triangle, circle, pentagon, blob paths
  SpeechBubble.tsx
  lines.ts             // bubble copy per level + time of day
src/features/theme/
  MoodProvider.tsx     // sets data-mood on <html>, favicon, theme-color
  useCurrentMood.ts
  tokens.css
src/components/fun/
  Confetti.tsx
  BackgroundBlobs.tsx
  Sticker.tsx          // hard-shadow, outlined label
  Squiggle.tsx
  WeekStrip.tsx
```

---

## 11. Improvements to add (beyond the redesign)

### High impact, quick
1. **Black Friday banner + countdown.** Your BLACKFRIDAY code ends **2026-12-02 23:59 UTC**, about two weeks away. Add a dismissible top banner with a live countdown on the landing page, billing page and trial-ending screens. Turn it off automatically after the deadline.
2. **Trial countdown pill** in the sidebar ("4 days left"), turning into a friendly paywall at the end.
3. **Don't lose text when Gemini fails.** Right now nothing is saved if scoring fails. Keep the draft (you already store drafts locally) and show a "Retry" button, plus an optional "Save unscored, score later" queue.
4. **Onboarding wizard (3 steps):** pick your name for the greeting → add 3 goals with icons → write your first update and watch Rumbo react. This is where users "get it".
5. **Mood-colored favicon and tab title** ("🙂 Rising · Rumbodia").

### Engagement
6. **Real Web Push notifications** (service worker + VAPID). Reminders currently only work with a tab open; push makes them work when the app is closed.
7. **Streak freeze:** one free "skip day" per week so a missed day doesn't kill a long streak.
8. **Achievements / stickers:** "First Soaring day", "7-day streak", "Bounced back" (Falling → Rising within 2 days), "30 updates". Show them as a sticker book.
9. **Weekly recap email** (Monday morning) with the week's mascot, average and top win. Good for retention.
10. **Comeback moment:** when someone goes from Slipping/Falling to Rising+, play a special "COMEBACK!" animation.

### Product
11. **Command palette (⌘K):** new update, jump to a date, search, switch theme. It suits a desktop web app.
12. **Voice input** in the composer (Web Speech API), for quick updates.
13. **Goal-linked progress:** let Gemini mark which goals each update touched, and show weekly progress rings against targets ("Ran 3/4").
14. **Mascot customization** (paid perk or achievement unlock): accessories such as a hat, glasses or a cape.
15. **Accountability buddy (later):** share a read-only weekly card or link with a friend.

### Technical
16. Add tests for `lib/gemini` (prompt building, schema validation, fallback) and the Stripe webhook handler; currently tests cover stats and billing status only.
17. Visual regression: extend `npm run screenshots` to capture each route **in all 5 mood themes**, so contrast or layout issues don't slip through.
18. Remove or start using `STRIPE_PUBLISHABLE_KEY` (listed but unused).
19. Basic product analytics (e.g. PostHog): trial → paid conversion, updates per user per day, where people drop off in onboarding.

---

## 12. Rollout order

1. **Tokens + MoodProvider** (theme switching works everywhere with existing UI).
2. **Mascot component** + replace emoji faces app-wide.
3. **Composer result screen** (the biggest "wow" moment).
4. **Home / Today** redesign with week strip and companion card.
5. **Landing page** with live demo + Black Friday banner (do this early because of the Dec 2 deadline).
6. Calendar, Stats and share card.
7. Onboarding, achievements, push notifications.
