# Rumbodia: Full Redesign and Feature Spec

> **For Claude Code.** This document describes how to redesign and extend the existing Next.js app (currently called "Daybook") into **Rumbodia**. Read the whole file before writing code. Work phase by phase (see section 13). After each phase, run `npm run typecheck` and `npm run build` and fix every error before moving on.

---

## 0. Context: what already exists

The current codebase (Next.js 16, App Router, TypeScript, Tailwind v4, Zod) already does this:

- The user writes a free-text update ("1. Ran 1 km 2. Talked to customers 3. Got 0 new users").
- `POST /api/entries` sends it to **Gemini (`gemini-3.5-flash`)** with the user's goals and the last 5 entries as context.
- Gemini returns `{ score (-10..10), reason, wins[], slips[] }`, validated with Zod and clamped.
- The entry is saved to `data/entries.json` through a repository (`src/server/repositories/`).
- A diverging bar chart shows the daily average score (up = growth, down = decline).
- Goals are saved in `data/goals.json`.

Existing structure to **keep and extend** (do not throw it away):

```
src/
  app/            routes + api routes (thin)
  components/     UI
  hooks/          browser state
  lib/            gemini client + prompt, storage, schemas, api-client, utils
  server/         env, http errors, repositories, services ("server-only")
  types/          shared types
data/             JSON storage (git-ignored)
```

Keep these rules from the current code:

- The Gemini API key stays on the server. Never expose it to the browser.
- Routes validate input with Zod and call services. Services hold logic. Repositories are the only code that touches storage.
- If Gemini fails, nothing is saved.
- No authentication yet. Single user, local.

---

## 1. Product summary

**Rumbodia** (from Spanish *rumbo*, "direction", + *día*, "day") answers one question every day: **which direction is my life heading?**

The user logs short updates any time (morning, noon, afternoon, night). Gemini reads each update against the user's goals and scores it. Every day gets a **level** (a face and a color), and the charts and calendar show the direction over weeks and months.

The visual reference is a classic mood-tracker layout: a teal app bar, white rounded cards on a soft grey background, a bottom tab bar with a big round **+** button in the middle, a streak card ("Days in a row"), a monthly chart with face icons on the Y axis, a semicircle count chart, and a month calendar where each day is a colored face.

> **Important:** Use that layout as inspiration only. Do **not** copy any existing app's icons, face artwork, logo, or exact colors. All faces and the logo must be original SVGs drawn in code (see section 4). Do **not** add any premium banner, sale countdown, crown icon, or ads.

---

## 2. Brand

| Item | Decision |
|---|---|
| Name | **Rumbodia** (always one word, capital R) |
| Tagline | "Which way is your day going?" |
| Logo | An "R" whose leg turns into a rising trend arrow (dips, then climbs up-right), inside a rounded square. Drawn as inline SVG in `src/components/brand/logo.tsx`. Two variants: icon only, icon + wordmark. |
| Wordmark | "Rumbodia" in the display font, weight 700, tracking slightly tight (-0.01em). |
| Voice | Short, warm, direct. Second person ("you"). Honest about bad days, never harsh. A light Spanish touch is allowed in a few places only (for example the greeting "¡Hola!" and "Buen rumbo" on a good day). The rest of the UI is English. |
| Favicon | The "R" mark. Also provide `apple-touch-icon` and PWA icons (192, 512). |

---

## 3. The level system (core concept)

Gemini still scores every entry from **-10 to +10**. The UI converts scores into **5 levels**. This is the main visual language of the whole app: every face, color, chart segment and calendar day uses it.

| Level key | Name | Score range | Color (light) | Color (dark) | Face |
|---|---|---|---|---|---|
| `soaring` | Soaring | +7 to +10 | `#10A37F` | `#2DD4A7` | Big open smile, raised eyebrows |
| `rising` | Rising | +3 to +6.99 | `#7CB518` | `#A3D94B` | Smile |
| `steady` | Steady | -2.99 to +2.99 | `#3B8FD9` | `#6AB0F0` | Straight mouth |
| `slipping` | Slipping | -6.99 to -3 | `#F08C1A` | `#FFAD4D` | Small frown |
| `falling` | Falling | -10 to -7 | `#E0394A` | `#FF6B78` | Deep frown, squeezed eyes |

Rules:

- **Entry level** = level of the entry score.
- **Day level** = level of the **average** of that day's entry scores.
- **Empty day** = light grey circle, no face.
- Always show the **number** next to color somewhere nearby (tooltip, badge, or label). Color must never be the only signal.

Implement in `src/lib/levels.ts`:

```ts
export type LevelKey = "soaring" | "rising" | "steady" | "slipping" | "falling";

export interface Level {
  key: LevelKey;
  name: string;          // "Soaring"
  min: number;           // inclusive lower bound
  colorVar: string;      // "var(--level-soaring)"
  order: number;         // 4 = soaring ... 0 = falling (for the chart Y axis)
}

export const LEVELS: Level[];               // ordered high to low
export function scoreToLevel(score: number): Level;
export function levelMidpoint(key: LevelKey): number; // for plotting
```

Write unit tests for the boundaries (-10, -7, -6.99, -3, -2.99, 2.99, 3, 6.99, 7, 10).

---

## 4. Design tokens

Put all tokens in `src/app/globals.css` under `@theme inline` (Tailwind v4) and as CSS variables on `:root`, with dark values under `@media (prefers-color-scheme: dark)` **and** `:root[data-theme="dark"]` (the user can force a theme in Settings).

### 4.1 Colors

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#13A38B` | `#22C3A6` | App bar, bottom bar, primary buttons, links, today marker |
| `--brand-strong` | `#0E8572` | `#4FD8BF` | Hover / pressed |
| `--brand-soft` | `#E3F6F2` | `#123B35` | Selected chips, focus backgrounds |
| `--bg` | `#F2F3F7` | `#0F1216` | Page background (soft grey, like the reference) |
| `--card` | `#FFFFFF` | `#191D23` | Cards, sheets |
| `--ink` | `#16181D` | `#ECEEF2` | Main text |
| `--ink-soft` | `#6B7280` | `#9AA3AF` | Secondary text, axis labels |
| `--line` | `#E5E7EB` | `#2A3038` | Dividers, grid lines, borders |
| `--empty` | `#ECEDF2` | `#252A32` | Empty calendar day circle |
| `--on-brand` | `#FFFFFF` | `#0F1216` | Text/icons on brand color |
| `--level-*` | see section 3 | see section 3 | Levels |
| `--danger` | `#E0394A` | `#FF6B78` | Delete, errors |
| `--focus` | `#2563EB` | `#7AA7FF` | Focus ring |

### 4.2 Typography

- **Display / headings:** `Bricolage Grotesque` (already loaded via `next/font/google`), weights 600 and 700.
- **Body / UI:** `Figtree` (replace Instrument Sans), weights 400, 500, 600, 700.
- All numbers (scores, counts, streaks, axis labels) use `font-variant-numeric: tabular-nums`.

Type scale (mobile → desktop):

| Role | Size | Weight | Font |
|---|---|---|---|
| Page title (month header, "April 2026") | 22px → 24px | 700 | Display |
| Card title ("Days in a row") | 20px → 22px | 700 | Display |
| Body | 16px | 400 | Body |
| Small / caption | 13px | 500 | Body |
| Big score in feedback sheet | 56px | 700 | Display |
| Streak number pill | 22px | 600 | Body |

Sentence case everywhere. No all-caps labels.

### 4.3 Shape, spacing, depth

- Card radius **20px**. Buttons and inputs **14px**. Pills and chips **999px**. Face circles are full circles.
- Card padding: 20px mobile, 24px desktop. Gap between cards: 16px mobile, 20px desktop.
- Card shadow (light): `0 1px 2px rgb(16 24 40 / .04), 0 4px 16px rgb(16 24 40 / .06)`. Dark mode: no shadow, use a 1px `--line` border instead.
- Bottom tab bar height 64px + safe-area inset. The center **+** button is a 64px circle, white fill with a 3px `--brand` ring and a brand-colored plus icon, raised 20px above the bar (exactly like the reference layout).
- Icons: `lucide-react`, 22px, stroke 2.

### 4.4 Faces (original SVG)

Create `src/components/levels/face-icon.tsx`:

```ts
interface FaceIconProps {
  level: LevelKey | null;   // null = empty grey circle
  size?: number;            // default 40
  muted?: boolean;          // for days outside the current month (40% opacity)
  label?: string;           // aria-label override
}
```

- Circle filled with the level color. Eyes and mouth in white (`--card` in dark mode looks wrong; always use `#FFFFFF`).
- Draw the mouth as one quadratic curve whose curvature depends on the level (soaring = wide smile, falling = deep frown). Eyes are small dots; `falling` uses short slanted lines (squeezed). `soaring` adds two small eyebrow arcs.
- Default `aria-label` = level name, for example "Rising".
- Must look crisp from 16px to 72px.

### 4.5 Motion

- One orchestrated moment: when a new update is scored, the result face **pops** (scale 0.6 → 1.08 → 1, 450ms) and the matching chart bar/point animates to its new value (600ms ease-out).
- Bottom sheets slide up (250ms). Tab switches have no animation.
- Respect `prefers-reduced-motion`: disable all of the above.

---

## 5. Information architecture and routes

```
/                       Landing page (marketing, public)
/app                    → redirect to /app/stats
/app/stats              Stats (default tab)
/app/entries            Entries timeline
/app/calendar           Month calendar
/app/more               More menu
/app/more/goals         Goals
/app/more/settings      Settings
/app/more/data          Export / import / delete all
```

- The **+** button is not a route. It opens the **New update sheet** from any tab.
- The selected month lives in the URL: `?month=2026-11`. All three main tabs read it, so switching tabs keeps the same month.
- Tapping a day (in the calendar or chart) opens the **Day sheet** (`?day=2026-11-04` added to the URL, so the back button closes it).

### 5.1 App shell

**Mobile (< 1024px):**

```
┌─────────────────────────────────┐
│ (☰ logo)  ‹   November 2026   › 🔍│  ← month header (sticky)
├─────────────────────────────────┤
│                                 │
│   cards…                        │  ← scrolling content, bg = --bg
│                                 │
├─────────────────────────────────┤
│ Entries  Stats  ( + )  Calendar  More │ ← bottom bar, bg = --brand
└─────────────────────────────────┘
```

- The bottom bar is brand-colored with white icons and labels. The active tab is full white, inactive tabs are white at 65% opacity.
- The month header shows ‹ and › round outline buttons (40px). › is disabled for future months. The search icon opens entry search (section 6.6).
- The logo icon on the left (instead of a crown) links to `/`.

**Desktop (≥ 1024px):**

```
┌──────────────┬──────────────────────────────────────────┐
│ ◉ Rumbodia   │  ‹  November 2026  ›            🔍  [+ New update] │
│              ├──────────────────────────────────────────┤
│ ▸ Stats      │                                          │
│   Entries    │   cards in a 2-column grid (max 1100px)  │
│   Calendar   │                                          │
│   Goals      │                                          │
│   Settings   │                                          │
│              │                                          │
│ [+ New update]                                          │
└──────────────┴──────────────────────────────────────────┘
```

- Left sidebar 240px, `--card` background, brand-colored active item with `--brand-soft` background.
- Keyboard shortcut **N** opens the New update sheet (ignored when typing in an input). **Esc** closes sheets. **←/→** change month when no input is focused.

### 5.2 Responsive design (mobile, tablet, desktop)

Rumbodia is a web app that must feel native on a phone **and** look intentional on a large monitor. Build **mobile-first** (base styles = phone), then add larger layouts with Tailwind breakpoints. Never just stretch the mobile layout across a wide screen.

#### Breakpoints

| Name | Width | Tailwind | Typical device |
|---|---|---|---|
| Mobile | 0–639px | base | Phones (design for 360px minimum, test 375 and 430) |
| Tablet | 640–1023px | `sm:` / `md:` | Tablets, small laptops in split screen |
| Desktop | 1024–1439px | `lg:` | Laptops |
| Wide | ≥ 1440px | `2xl:` (set `--breakpoint-2xl: 90rem`) | Large monitors |

#### Shell per breakpoint

| Element | Mobile | Tablet | Desktop | Wide |
|---|---|---|---|---|
| Navigation | Bottom tab bar + raised + button | Bottom tab bar (wider, labels always shown), + button | Left sidebar 240px | Left sidebar 260px |
| New update | + button opens full-height sheet | + button opens a centered 560px modal | "+ New update" button in sidebar and header, opens 560px modal | Same as desktop |
| Day sheet | Bottom sheet (up to 90% height, drag handle, swipe down to close) | Bottom sheet, max width 640px, centered | Right-side drawer 420px; content stays visible behind it | Drawer 460px |
| Month header | Sticky, compact (title 22px) | Sticky | Sticky inside the content area, with search field shown inline (not an icon) | Same |
| Content width | Full width, 16px side padding | 24px side padding, max 720px centered | Max 1100px, 32px padding | Max 1240px |
| Toasts | Bottom center, above tab bar | Bottom center | Bottom right | Bottom right |

Use `100dvh` (not `100vh`) for full-height sheets, and add `env(safe-area-inset-bottom)` padding to the tab bar and sheets so they clear the iPhone home bar. Add `viewport-fit=cover` to the viewport meta tag.

#### Screen layouts per breakpoint

**Stats**

| Mobile | Tablet | Desktop | Wide |
|---|---|---|---|
| One column: Streak, Rumbo chart, Level count, Weekly insight, Tag impact, Time of day | One column, but Streak and Level count side by side in a 2-column row | 12-column grid. Row 1: Rumbo chart (8 cols) + Streak and Weekly insight stacked (4 cols). Row 2: Level count (4), Tag impact (4), Time of day (4) | Same grid, chart taller (380px) |

**Entries**

| Mobile | Tablet | Desktop | Wide |
|---|---|---|---|
| Day cards stacked, filters bar scrolls horizontally | Same, filters fully visible | Two panes: day list on the left (60%), and on the right a sticky "Month summary" panel (level count mini + top tags + time of day) | Same, list max 760px |

**Calendar**

| Mobile | Tablet | Desktop | Wide |
|---|---|---|---|
| Grid full width, faces 40px, Level count card below | Faces 48px | Two panes: calendar on the left (faces 52px), and on the right the selected day's entries shown **inline** (no drawer needed), with Level count below the calendar | Faces 60px |

**New update sheet:** on mobile the textarea fills the available height and the "Log update" button sticks to the bottom above the keyboard (use `position: sticky; bottom: 0` inside the sheet, and test with the on-screen keyboard open). On tablet and desktop the textarea has 8 rows.

**Goals, Settings, Your data:** single column, max width 640px on every breakpoint, centered on desktop. On desktop, the More menu doesn't exist as a page: its items are in the sidebar, and `/app/more` redirects to `/app/more/goals`.

**Landing page:** on mobile the live demo phone frame sits under the headline; on desktop the hero is two columns (text left, phone frame right). The "How it works" steps stack on mobile and sit in a row of 3 from tablet up.

#### Component rules

- **Rumbo chart:** width comes from a `ResizeObserver`, never fixed. X-axis labels: every 5 days below 400px wide, every 3 days below 700px, every day above that. Y-axis face icons 16px on mobile, 20px on desktop. On touch devices, a tap selects a day and a horizontal drag scrubs across days. On mouse devices, hover shows the tooltip and click opens the day.
- **Tooltip:** on mobile it's a fixed card at the bottom of the chart card (not floating near the finger, where it would be hidden). On desktop it floats near the pointer and never overflows the card.
- **Calendar grid:** always 7 equal columns (`grid-cols-7`). Face size is set with a CSS variable per breakpoint. Date numbers never wrap.
- **Level count donut:** scales with its card width (SVG `viewBox`), faces below wrap into a 5-column grid that never overflows; below 360px, hide the level names and keep faces and counts.
- **Filters bar:** horizontal scroll with fade edges on mobile; wraps onto two lines on tablet and up.
- **Tables and long text:** entry text uses `break-words`; nothing may cause horizontal page scroll at any width.
- **Hover styles** only apply on devices that support hover: use `@media (hover: hover)` (Tailwind v4 already does this for `hover:`). Touch devices get pressed (`active:`) styles instead.
- **Tap targets** at least 44 × 44px on touch; on desktop, small icon buttons may be 36px.
- **Fonts:** use `clamp()` for the page title and big score so they scale smoothly between breakpoints.
- **Images and SVGs:** `max-width: 100%`; logo and faces are SVG so they stay sharp on retina screens.

#### Orientation and input

- Phone landscape: the tab bar stays, sheets become max 90% height with internal scroll, the chart keeps its height (doesn't fill the screen).
- Support keyboard + mouse on desktop, touch on phones and tablets, and both together (touch laptops). Never rely on hover alone to reveal an action: the `⋯` menu on each entry is always visible.

#### Responsive testing (required before each phase is done)

Check every screen at these widths, in light and dark mode: **360, 390, 430** (phones), **768, 1024** (tablet / small laptop), **1280, 1440, 1920** (desktop). For each, confirm:

1. No horizontal scrolling anywhere.
2. Nothing is hidden behind the tab bar, the home indicator, or the on-screen keyboard.
3. The chart labels don't overlap.
4. Sheets and drawers open, scroll, and close correctly.
5. Text stays readable (body never below 15px on mobile).

If Playwright is available, add a script `npm run screenshots` that captures every route at 390px and 1440px into `screenshots/` for quick review.

---

## 6. Screens

### 6.1 Stats (`/app/stats`) — default tab

Cards top to bottom on mobile. On desktop, a 2-column grid: the chart card spans both columns.

#### Card A: "Days in a row" (streak)

```
┌──────────────────────────────────────┐
│ Days in a row                    ⤴  │
│ ─(✓)──(✓)──(✓)──(✓)──(✓)──── [ 10 ] │
│  Mon   Tue   Wed   Thu   Fri         │
│ ──────────────────────────────────── │
│ 🏆 Longest chain: 14                  │
└──────────────────────────────────────┘
```

- A day **counts** if it has at least 1 entry.
- Show the last 5 days ending today (or yesterday if today has no entry yet). Each is a 44px circle: filled `--brand` with a white check if logged, `--empty` outline if not. A thin `--line` runs behind the circles.
- The pill on the right shows the current streak number.
- "Longest chain" shows the all-time longest streak with a trophy icon (lucide `Trophy`, amber).
- If today has no entry yet but yesterday does, show the hint "Log today to keep your chain." under the circles.
- ⤴ = share (phase 4, see section 9). Hide the button until then.

Logic in `src/lib/stats/streaks.ts` (pure function, unit tested): `computeStreaks(dayKeys: string[], today: string) → { current: number; longest: number; lastFiveDays: { day: string; logged: boolean }[] }`.

#### Card B: "Rumbo chart" (the main chart)

```
┌──────────────────────────────────────┐
│ Rumbo chart                     🔍 ⤴ │
│ Tap the chart to see a day           │
│ (😄)┤          /\        /\    /\    │
│ (🙂)┤   /\    /  \  /\  /  \  /  \   │
│ (😐)┤──/──\──/────\/──\/────\/────── │  ← line colored by level
│ (🙁)┤ /    \/                        │
│ (😣)┤/                               │
│      1   4   7  10  13  16  19  22   │
│ [ 📈 | ▮▮ ]          [ All goals  › ] │
└──────────────────────────────────────┘
```

Two modes, switched by a segmented control at the bottom left (icons: line chart, bar chart):

1. **Line mode** (like the reference):
   - X axis = days of the selected month (labels every 3 days on mobile, every day on desktop if it fits).
   - Y axis = the 5 levels, shown as **small face icons** (20px) instead of numbers, highest at the top. Horizontal grid lines at each level in `--line`.
   - Plot the **day average score** (continuous, -10..10), not just the level, so the line has real shape. Map -10..10 linearly to the Y range.
   - **Color each line segment by level**: where the line crosses a level boundary, split it and color each part with its level color (do this by computing intersection points with the boundary values, then drawing separate `<path>`s). Line width 3px, round joins.
   - Soft area fill under the line using a vertical gradient of `--brand` at 12% → 0%.
   - Days with no entries break the line (no fake connection across gaps). Show a small dot for an isolated single day.
   - Points: 6px dots only on hover/focus, and always on the selected day.
2. **Bar mode** (the original Rumbodia idea, keep it):
   - Diverging bars from a zero line, up for positive, down for negative, but **colored by the day level** (not just green/red).
   - Value label above/below each bar when the month view has ≤ 14 visible days (on mobile, show labels only on the selected day).

Shared behavior:

- Tap/click (or arrow keys when focused) selects a day: show a tooltip card with the face, date, day average ("+4.5"), number of updates, and a "Open day" link that opens the Day sheet.
- 🔍 (zoom) toggles a **range switch**: Month (default) / Last 7 days / Last 30 days / Year. Year mode shows weekly averages (52 points).
- **Goal filter** pill at the bottom right: "All goals ›" opens a sheet listing the user's tags (see section 8.2) with counts. Choosing one filters the chart to entries with that tag. The pill then shows the tag name with an × to clear.
- Build the chart as custom SVG in `src/features/stats/components/rumbo-chart/` (no chart library). Use a `ResizeObserver` hook for width. Height 260px mobile, 320px desktop.
- Accessible: the SVG has `role="img"` and an `aria-label` summary; also render a visually hidden `<table>` of day → average.

#### Card C: "Level count"

```
┌──────────────────────────────────────┐
│ Level count                       ⤴  │
│ Tap a level to see those days        │
│           ╭─────────────╮            │
│        ╭──╯     23      ╰──╮         │  ← semicircle donut
│      (😄)  (🙂)  (😐)  (🙁)  (😣)      │
│       3     6     7     3     4      │  ← count badges on faces
│    Soaring Rising Steady Slipping Falling │
└──────────────────────────────────────┘
```

- Semicircle (180°) donut, 18px thick, segments in level order from left (soaring) to right (falling), each segment proportional to the **number of days** at that level in the selected month. 2px gaps between segments.
- Center: total logged days (big number) with the caption "days logged".
- Below: 5 face icons (44px) with a small count badge (level-colored circle, white number) at the top right of each face, and the level name under it.
- Tapping a level opens the Entries tab filtered to days at that level (`/app/entries?month=…&level=rising`).
- Toggle in the card header: "Days | Updates" (count days by day level, or individual entries by entry level). Default: Days.

#### Card D: "This week in a sentence" (Gemini weekly insight)

```
┌──────────────────────────────────────┐
│ This week in a sentence      ↻       │
│ "Your best days started with a run.  │
│  Customer calls lifted you; zero-    │
│  user days pulled you down."          │
│ Best day: Wed (+6.5)  ·  Hard day: Sat (−4) │
│ Try next week: Call 2 customers      │
│ before noon.                          │
└──────────────────────────────────────┘
```

- Generated by a new endpoint (section 8.3) for the week containing the selected day (week start from Settings).
- Cached: generate once per week; show a ↻ "Refresh" icon button to regenerate (disabled while loading, max once per 10 minutes, enforced on the server).
- If the week has fewer than 3 entries, show: "Log at least 3 updates this week to get your weekly read." and no API call.
- Loading state: 3 shimmering text lines.

#### Card E: "What lifts you, what drags you"

- Horizontal list of the user's tags with the **average score** of entries that have that tag in the selected month, sorted from highest to lowest.
- Each row: tag name, small face for its level, a thin horizontal bar (diverging from center), the average number, and "(n updates)".
- Show top 5 by default with "Show all".
- Empty state: "Tags appear after a few updates."

#### Card F: "Time of day"

- 4 columns: Morning, Noon, Afternoon, Night. Each shows a face for the average level, the average score, and the count.
- One-line caption that names the best part of the day, for example "Your mornings are your strongest time." (computed locally, no Gemini call).

### 6.2 Entries (`/app/entries`)

A timeline of the selected month, newest first, grouped by day.

```
┌──────────────────────────────────────┐
│ (🙂) Today, Wed Nov 4        +3.7   │  ← day header row
│ ──────────────────────────────────── │
│ [Morning] 7:42 AM        (🙂) +6  ⋯ │
│ 1. Ran 1 km, did 5 push-ups          │
│ 2. Planned the day                   │
│ "You started the day moving…"  ▾     │
│ #exercise  #planning                 │
│ ──────────────────────────────────── │
│ [Afternoon] 3:10 PM      (🙁) −4  ⋯ │
│ Got 0 new users today                │
│ …                                    │
└──────────────────────────────────────┘
```

- Each day is a card. Header: day face (32px), "Today" / "Yesterday" / "Mon, Nov 2", and the day average on the right in the level color.
- Each entry row:
  - Time-of-day chip (`--brand-soft` background, brand text), then the time.
  - Entry face (24px) + score on the right, then a `⋯` menu (Edit, Re-score, Delete).
  - The text, with line breaks kept.
  - Gemini's reason in `--ink-soft`, collapsed to 2 lines with a ▾ to expand. Expanded view also shows "Went well" and "Slipped" lists.
  - Tags as small chips (`#exercise`). Tapping a tag filters the list.
- Filters bar (sticky under the header, horizontal scroll on mobile): "All levels ▾", "All times ▾", active tag chip with ×. Filters sync to URL params (`level`, `time`, `tag`).
- Empty month: big empty face + "No updates in November yet." + primary button "Log your first update".
- Paginate by month (the month header controls it). No infinite scroll needed.

**Edit:** opens the New update sheet prefilled. Saving edited text asks: "Re-score with Gemini?" with buttons "Re-score" (default) and "Keep score". Store `updatedAt`.

**Re-score:** calls Gemini again with current goals and replaces score/reason/wins/slips/tags. Show the new result in a toast: "Re-scored: Rising (+4)".

**Delete:** confirm dialog "Delete this update? Your charts will change." Then an **Undo** toast for 6 seconds (delete is delayed on the client until the toast closes, or restore via API).

### 6.3 Calendar (`/app/calendar`)

```
┌──────────────────────────────────────┐
│ (😄) Soaring days  4×      ▾ │ filter │  ← level/tag filter row
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun   │
│  (·)  (·)  (·)  (😐) (😐) (🙁) (😣)   │  ← prev month days muted
│  27   28   29   30   31    1    2    │
│  (·)  (😐) (🙂) (🙁) (·)  (😐) (🙂)   │
│   3    4    5    6    7    8    9    │
│  …                                   │
│  (🙂) (😄) (😐) (🙁) (🙂) (·)  (·)    │
│  24   25   26   27  [28]  29   30    │  ← today = bold brand number
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ Level count  (same component as 6.1C)│
└──────────────────────────────────────┘
```

- 7-column grid. Week start (Monday or Sunday) from Settings. Show leading/trailing days from adjacent months, muted at 40% opacity.
- Each cell: face (40px mobile, 52px desktop) for the day level, or an `--empty` circle; the date number under it in `--ink`. Today's number is bold and brand-colored. Future days show the date only, no circle.
- Filter row at the top: a dropdown "All days ▾" with options: each level (with face and count, like "Soaring 4×") and each tag. Non-matching days fade to 25% opacity. The right side of the row has "add +" which opens the New update sheet **for the selected day** (backfilling, see section 7).
- Tapping a day opens the Day sheet.
- Below the grid: the Level count card (reuse the component).

### 6.4 Day sheet (bottom sheet on mobile, right-side drawer on desktop)

- Header: big face (56px), "Wednesday, November 4", day average, number of updates.
- Mini timeline of that day's entries (same row component as Entries).
- Button "Add an update to this day".
- Close with ×, swipe down (mobile), Esc, or browser back.

### 6.5 New update sheet (the + button)

Full-height sheet on mobile, centered 560px modal on desktop.

**Step 1: write**

```
┌──────────────────────────────────────┐
│ ×        New update                  │
│ ¡Hola! How did it go?                │
│ [Morning][Noon][Afternoon][Night]    │  ← auto-selected by current time
│ ┌──────────────────────────────────┐ │
│ │ 1. Ran 1 km, did 5 push-ups      │ │
│ │ 2. Talked with 2 customers       │ │
│ │ 3. Got 0 new users today         │ │
│ └──────────────────────────────────┘ │
│ Today, 7:42 AM ▾          0 / 4000   │  ← date/time picker for backfill
│ [           Log update            ]  │
└──────────────────────────────────────┘
```

- Time-of-day segmented control, auto-selected from the current hour using the bounds in Settings (defaults: Morning 05:00–10:59, Noon 11:00–13:59, Afternoon 14:00–17:59, Night 18:00–04:59). The user can change it.
- Textarea autofocus, auto-grows, keeps line breaks. Pressing Enter on a line that starts with "N." inserts the next number automatically ("1." → Enter → "2. "). Ctrl/⌘ + Enter submits.
- Date/time row: defaults to now. Tapping it lets the user pick an earlier date and time (no future). Used for backfilling.
- Draft is kept in `localStorage` (wrapped in try/catch) so closing the sheet doesn't lose text.
- Submit button disabled when empty. While scoring, the button shows a spinner and "Reading your update…", and the textarea is read-only.

**Step 2: result** (same sheet, replaces the form)

```
┌──────────────────────────────────────┐
│                (🙂)                  │  ← 96px face, pops in
│               Rising                 │
│                 +5                   │
│ You moved on two goals today; zero   │
│ new users is the one to fix.         │
│ Went well        Slipped             │
│ • Exercise       • 0 new users       │
│ • 2 customer calls                   │
│ #exercise #customers #users          │
│ [ See my chart ]   [ Done ]          │
└──────────────────────────────────────┘
```

- The sheet background tints with the level color at 10%.
- On a Soaring result, show "Buen rumbo." above the face. On Falling, show "Tomorrow is a new rumbo." Keep these two only.
- "See my chart" closes the sheet and scrolls to/highlights today on the Rumbo chart.
- Errors: show the error message from the API in a red callout above the button, keep the text, and offer "Try again".

### 6.6 Search

- The 🔍 in the header opens a full-width search field (sheet on mobile).
- Searches entry text, reasons and tags (case-insensitive, client-side over all entries; fine for local single-user data).
- Results grouped by day, matches highlighted with `<mark>` (brand-soft background).

### 6.7 More (`/app/more`) and sub-pages

List of rows with icons and chevrons:

- **Goals** → `/app/more/goals`
- **Settings** → `/app/more/settings`
- **Your data** → `/app/more/data`
- **About Rumbodia** (version, model in use from the server, link to landing page)

#### Goals (`/app/more/goals`)

- Instead of one big textarea, a **list of goals**: each goal is a row with an emoji/icon picker (from a small fixed set of lucide icons), a title ("Run or work out"), and an optional target note ("4 times a week").
- Add, edit, reorder (drag handle, plus up/down buttons for keyboard), delete.
- Max 10 goals. Explain at the top: "Gemini scores every update against these goals."
- Store as structured data (section 8.1). The prompt receives them as a numbered list.
- Migration: if old `goals.json` has `text`, split it by lines into goals.

#### Settings (`/app/more/settings`)

- Theme: System / Light / Dark.
- Week starts on: Monday / Sunday.
- Time-of-day bounds: 4 time inputs (start of each part).
- Show scores as: Numbers (+5) / Levels only (hide numbers in lists; charts still use numbers internally).
- Gemini model (read-only display of `GEMINI_MODEL` from the server, with a note that it's set in `.env.local`).

#### Your data (`/app/more/data`)

- Export JSON (all entries, goals, settings) and Export CSV (entries only).
- Import JSON (validate with Zod; show a summary "142 entries, 4 goals" and a confirm step; options: merge by id or replace all).
- Delete all data (type "DELETE" to confirm).

### 6.8 Landing page (`/`)

A simple public page that explains the app and links into `/app`. Same tokens and fonts.

1. **Hero:** logo + wordmark top left, "Open Rumbodia" button top right. Headline: "Which way is your day going?" Sub: "Write what you did. Gemini reads it against your goals. Your face, color and chart show the direction." Primary button "Start logging" → `/app/stats`.
2. **Live demo (the memorable part):** a phone-shaped frame showing a fake New update sheet with a typed example, then the result face popping in and a mini Rumbo chart moving. Driven by a small scripted animation on loop (no API call, static data). Respect reduced motion (show the final state).
3. **How it works:** three steps in a row (this is a real sequence, so numbering is fine): 1. Set your goals. 2. Log updates any time. 3. Watch your direction.
4. **The 5 levels:** the five faces with names and score ranges.
5. **Privacy note:** "Your log stays on your computer. Only the text of each update is sent to Gemini to score it."
6. **Footer:** name, year, link to GitHub (placeholder).

---

## 7. Behaviors and rules

- **Time of day:** stored on each entry. Auto-detected from the entry time and Settings bounds; editable.
- **Backfill:** an entry can have a `createdAt` in the past (chosen in the sheet). The server must reject future timestamps (> now + 5 minutes).
- **Day grouping** always uses the user's **local** timezone. The client sends its IANA timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) in the `x-timezone` header on every request; the server uses it when it needs local days (weekly insights, streaks if ever computed on the server).
- **Streaks, level counts, tag averages, time-of-day averages** are computed **on the client** from the month's entries, in pure functions under `src/lib/stats/` with unit tests.
- **Optimistic UI:** delete and edit update the UI first and roll back on error with a toast.
- **Toasts:** bottom-center on mobile (above the tab bar), bottom-right on desktop, auto-dismiss after 4s (6s for Undo).
- **Loading states:** skeleton cards with the same shapes as the real ones. Never a blank screen.
- **Errors:** every error message says what happened and what to do, in the interface's voice (keep the existing messages from `src/lib/gemini/client.ts`).

---

## 8. Data, API and Gemini changes

### 8.1 Types (`src/types/index.ts`)

```ts
export type TimeOfDay = "morning" | "noon" | "afternoon" | "night";

export interface Entry {
  id: string;
  text: string;
  score: number;            // -10..10 (integer from Gemini)
  reason: string;
  wins: string[];
  slips: string[];
  tags: string[];           // NEW: 1–4 lowercase tags from Gemini
  timeOfDay: TimeOfDay;     // NEW
  createdAt: string;        // ISO; may be in the past (backfill)
  updatedAt: string | null; // NEW
  model: string;            // NEW: which Gemini model scored it
}

export interface Goal {
  id: string;
  title: string;            // "Run or work out"
  target: string;           // "4 times a week" (may be empty)
  icon: string;             // lucide icon name from an allowed list
  order: number;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  weekStartsOn: 0 | 1;      // 0 = Sunday, 1 = Monday
  timeOfDayStarts: { morning: string; noon: string; afternoon: string; night: string }; // "05:00"
  scoreDisplay: "numbers" | "levels";
}

export interface WeeklyInsight {
  weekStart: string;        // YYYY-MM-DD (local)
  headline: string;         // the one sentence
  bestDay: { day: string; average: number } | null;
  hardDay: { day: string; average: number } | null;
  suggestion: string;
  generatedAt: string;
  entryCount: number;
}
```

**Storage files** (`data/`): `entries.json`, `goals.json`, `settings.json`, `insights.json`. Each file gets a `version` number. Write a `normalize` function per repository that upgrades old records on read (missing `tags` → `[]`, missing `timeOfDay` → derived from `createdAt`, missing `updatedAt` → `null`, missing `model` → `"unknown"`; old `goals.text` → list of goals).

Keep the repository interface clean so a database (SQLite/Postgres) can replace JSON later without touching services or routes.

### 8.2 API routes

| Method | Route | Body / query | Returns |
|---|---|---|---|
| GET | `/api/entries` | `?from=ISO&to=ISO&tag=&q=` | `{ entries }` (sorted oldest first) |
| POST | `/api/entries` | `{ text, timeOfDay?, createdAt? }` | `{ entry }` 201 |
| PATCH | `/api/entries/:id` | `{ text?, timeOfDay?, createdAt?, rescore?: boolean }` | `{ entry }` |
| POST | `/api/entries/:id/restore` | full entry (for Undo) | `{ entry }` |
| DELETE | `/api/entries/:id` | – | `{ ok: true }` |
| GET | `/api/tags` | – | `{ tags: { name, count }[] }` |
| GET / PUT | `/api/goals` | `{ goals: Goal[] }` | `{ goals }` |
| GET / PUT | `/api/settings` | `Partial<Settings>` | `{ settings }` |
| GET | `/api/insights/weekly` | `?weekStart=YYYY-MM-DD` | `{ insight \| null, reason? }` |
| POST | `/api/insights/weekly` | `{ weekStart }` (regenerate) | `{ insight }` (429 if < 10 min since last) |
| GET | `/api/export` | `?format=json\|csv` | file download |
| POST | `/api/import` | `{ data, mode: "merge" \| "replace" }` | `{ imported: { entries, goals } }` |
| DELETE | `/api/data` | `{ confirm: "DELETE" }` | `{ ok: true }` |
| GET | `/api/meta` | – | `{ model, version }` |

All bodies validated with Zod in `src/lib/schemas.ts`. All errors go through `toErrorResponse`.

### 8.3 Gemini prompt changes (`src/lib/gemini/prompt.ts`)

**Entry scoring:** keep the current system instruction and add:

- The goals arrive as a numbered list with targets.
- The time of day of the update (morning/noon/afternoon/night) and its local timestamp.
- The list of **existing tags** (top 30 by count). Instruction: "Return 1 to 4 short lowercase tags (one or two words) for what this update is about. Reuse an existing tag when it fits instead of inventing a new one."
- Add `tags` (array of strings) to `RESPONSE_SCHEMA` and to `analysisResultSchema` (Zod: lowercase, trimmed, max 24 chars each, deduplicated, max 4).

**Weekly insight:** new `src/lib/gemini/weekly-prompt.ts` and `src/server/services/insights-service.ts`.

- Input: goals, and all entries of that week (date, time of day, score, text, tags).
- Output schema: `{ headline: string, bestDay: string | null, hardDay: string | null, suggestion: string }`. Compute `bestDay`/`hardDay` averages on the server from the data (don't trust Gemini's numbers); use Gemini only for the words.
- Instructions: headline is one sentence, max 25 words, names concrete patterns ("Your best days started with a run"), second person, honest and kind. Suggestion is one small concrete action for next week, max 15 words. Same language as most entries.

### 8.4 Client data layer

- Add `@tanstack/react-query`. One `QueryClientProvider` in the app layout.
- Query keys: `["entries", from, to]`, `["goals"]`, `["settings"]`, `["tags"]`, `["insight", weekStart]`, `["meta"]`.
- After creating, editing or deleting an entry, invalidate `entries`, `tags`, and the current week's `insight`.
- Keep `src/lib/api-client.ts` as the only place that calls `fetch`.
- Replace the current `use-entries`/`use-goals` hooks with React Query hooks in each feature folder.

---

## 9. Phase 4 extras (build last, only if phases 1–3 are done)

- **Share card:** the ⤴ buttons render the card (streak, chart, or level count) as a PNG with the Rumbodia logo, using an offscreen canvas or `html-to-image`, then call the Web Share API (fallback: download).
- **Year in faces:** a 12 × 31 grid of tiny faces (or colored dots) for the whole year, reachable from the Calendar header (toggle "Month | Year").
- **PWA:** `manifest.webmanifest` (name Rumbodia, theme color `--brand`, standalone display, icons) so the user can install it on their phone home screen. No offline write support needed.
- **Reminders (browser only):** optional local notifications at chosen times ("Time for your noon update?") using the Notifications API while the tab is open. Mark clearly as "only works while Rumbodia is open."

---

## 10. Folder structure (target)

```
src/
  app/
    layout.tsx                    fonts, theme script, metadata
    globals.css                   tokens (section 4)
    page.tsx                      landing page (6.8)
    app/
      layout.tsx                  AppShell + QueryClientProvider
      page.tsx                    redirect → /app/stats
      stats/page.tsx
      entries/page.tsx
      calendar/page.tsx
      more/page.tsx
      more/goals/page.tsx
      more/settings/page.tsx
      more/data/page.tsx
    api/
      entries/route.ts
      entries/[id]/route.ts
      entries/[id]/restore/route.ts
      tags/route.ts
      goals/route.ts
      settings/route.ts
      insights/weekly/route.ts
      export/route.ts
      import/route.ts
      data/route.ts
      meta/route.ts
  components/
    brand/          logo.tsx
    levels/         face-icon.tsx, level-badge.tsx, level-legend.tsx
    shell/          app-shell.tsx, bottom-tab-bar.tsx, sidebar.tsx, month-header.tsx, fab-button.tsx
    ui/             card.tsx, sheet.tsx, dialog.tsx, segmented-control.tsx, icon-button.tsx,
                    button.tsx, chip.tsx, toast.tsx, skeleton.tsx, empty-state.tsx, dropdown.tsx
  features/
    entries/        components/ (entry-row, day-card, filters-bar, search-panel)
                    hooks/ (use-entries-query, use-entry-mutations)
    new-update/     components/ (new-update-sheet, update-form, result-view), hooks/ (use-draft)
    stats/          components/ (streak-card, rumbo-chart/, level-count-card, weekly-insight-card,
                                 tag-impact-card, time-of-day-card)
    calendar/       components/ (month-grid, day-cell, calendar-filter, day-sheet)
    goals/          components/, hooks/
    settings/       components/, hooks/
    data/           components/ (export, import, delete-all)
    landing/        components/ (hero, live-demo, how-it-works, levels-showcase)
  hooks/            use-month-param.ts, use-resize-observer.ts, use-keyboard-shortcuts.ts, use-media-query.ts
  lib/
    levels.ts
    stats/          streaks.ts, series.ts, level-counts.ts, tag-impact.ts, time-of-day.ts
    gemini/         client.ts, prompt.ts, weekly-prompt.ts
    storage/        json-file-store.ts
    schemas.ts, constants.ts, api-client.ts, query-keys.ts
    utils/          cn.ts, date.ts, scores.ts, csv.ts
  server/
    env.ts, http.ts, timezone.ts
    repositories/   entries-, goals-, settings-, insights-repository.ts
    services/       analysis-service.ts, entries-service.ts, insights-service.ts, data-service.ts
  types/
    index.ts
tests/
  levels.test.ts, streaks.test.ts, series.test.ts, level-counts.test.ts, schemas.test.ts
```

New dependencies (keep the list short): `@tanstack/react-query`, `lucide-react`, `vitest` (dev). Optional in phase 4: `html-to-image`.

---

## 11. Accessibility checklist

- Every face has an `aria-label` with the level name; decorative duplicates use `aria-hidden`.
- Charts have text alternatives (summary label + hidden table).
- All interactive elements are reachable by keyboard with a visible focus ring (`--focus`, 2px, offset 2px).
- Sheets and dialogs trap focus, restore focus on close, and close with Esc.
- Tap targets ≥ 44 × 44px.
- Text contrast ≥ 4.5:1 on cards in both themes (check the lime and amber level colors when used as text; use a darker shade for text if needed: rising text `#5E8C10`, slipping text `#B8650A` in light mode).
- `prefers-reduced-motion` respected.
- Layout works from 360px wide to 1440px wide.

---

## 12. Copy reference

| Place | Text |
|---|---|
| Empty Stats (no entries ever) | "Your direction starts with one update." + button "Log your first update" |
| Empty month | "No updates in November yet." |
| Sheet title | "New update" |
| Sheet greeting | "¡Hola! How did it go?" |
| Submit | "Log update" → loading "Reading your update…" |
| Result buttons | "See my chart", "Done" |
| Saved toast | "Logged. Rising (+5)" |
| Streak hint | "Log today to keep your chain." |
| Weekly empty | "Log at least 3 updates this week to get your weekly read." |
| Delete confirm | "Delete this update? Your charts will change." |
| Undo toast | "Update deleted." + "Undo" |
| Missing API key (keep existing) | "GEMINI_API_KEY is missing. Copy .env.example to .env.local, add your key, then restart the dev server." |

---

## 13. Build phases and acceptance criteria

### Phase 1: Foundation and shell
- Rename the app to Rumbodia everywhere (package name `rumbodia`, metadata, README).
- Tokens, fonts (Figtree + Bricolage), light/dark themes with a no-flash theme script.
- `levels.ts` + `FaceIcon` + tests.
- App shell: month header, bottom tab bar with raised + button (mobile), sidebar (desktop), routes from section 5 with placeholder pages.
- React Query set up; data model migration + normalize functions; new fields on entries.
- **Done when:** all routes render, month switching updates the URL, theme toggle works, old `data/*.json` files still load, tests pass, build passes, and the shell passes the responsive checks in section 5.2 (bottom bar on mobile and tablet, sidebar on desktop).

### Phase 2: Core loop
- New update sheet (write → result) with time of day, backfill, draft saving, numbered-list helper.
- Gemini prompt returns tags; entries store `tags`, `timeOfDay`, `model`.
- Stats: Streak card, Rumbo chart (line + bar, level-colored segments, tap a day), Level count card.
- Entries tab with day cards, filters, edit / re-score / delete + undo.
- **Done when:** logging an update shows the face pop, the chart updates, the streak and level count update, edit/re-score/delete all work with correct toasts, and every Phase 2 screen passes the responsive checks in section 5.2.

### Phase 3: Depth
- Calendar tab with faces, filters, Day sheet, backfill from a day.
- Goals as a structured list (with migration from old text).
- Settings page, Your data page (export/import/delete).
- Weekly insight card + endpoint with caching and rate limit.
- Tag impact card, Time of day card, Search.
- Landing page with the scripted live demo.
- **Done when:** every screen in section 6 matches its description on mobile, tablet and desktop (section 5.2), keyboard shortcuts work, and the accessibility checklist passes a manual check.

### Phase 4: Extras (section 9)

---

## 14. Do not

- Do not copy another app's face icons, logo, colors, or screenshots. Draw original SVGs.
- Do not add a premium banner, countdown, crown, upsell, or ads.
- Do not add authentication or user accounts yet.
- Do not call Gemini from the browser or expose `GEMINI_API_KEY`.
- Do not add a chart library; the charts are custom SVG.
- Do not change the default model (`gemini-3.5-flash`); it stays configurable with `GEMINI_MODEL`.
- Do not save an entry if Gemini fails.
- Do not use `localStorage` for anything except the unsent draft and UI preferences cache.
