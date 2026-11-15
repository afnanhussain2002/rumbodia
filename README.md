# Rumbodia

**Which way is your day going?**

Log short updates any time of day. Gemini reads each one against your goals and scores it from −10 to +10. Every day gets a face and a color (Soaring, Rising, Steady, Slipping, Falling), and the charts and calendar show your direction over weeks and months.

## Run it

```bash
npm install
cp .env.example .env.local     # then fill in the keys (see below)
npm run dev
```

Open http://localhost:3000 for the landing page, or http://localhost:3000/app for the app.

Environment variables (`.env` or `.env.local`):

| Variable | What it is |
|---|---|
| `GEMINI_API_KEY` | From https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-3.5-flash` |
| `MONGO_URI` | MongoDB connection string. Data lives in the `entries`, `goals`, `settings` and `insights` collections |
| `MONGODB_DB` | Optional database name. Defaults to the one in the URI, or `rumbodia` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | From the Clerk Dashboard → API keys |

Sign-in and sign-up are handled by Clerk. See `clerk.md` for the setup notes.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (Vitest): levels, streaks, series, level counts, schemas, migrations |
| `npm run screenshots` | With the server running, captures every route at 390px and 1440px into `screenshots/` using your local Chrome or Edge, and reports any horizontal scrolling. Options: `BASE_URL`, `WIDTHS=360,390,768,1440`, `THEME=dark` |
| `npm run icons` | Re-renders the PWA and touch icons in `public/` |

## How to use it

1. **Goals** (More → Goals): up to 10 goals with an icon and an optional target. Gemini scores every update against them.
2. **+** (or press **N**): write an update. Use a numbered list. Enter continues the list, and Ctrl/⌘ + Enter submits. The part of the day is picked from the clock, and you can change it. Tap the date to backfill an earlier day.
3. **Stats**: streak, Rumbo chart (line or bar, colored by level), level count, the weekly read from Gemini, tag impact, and time of day.
4. **Entries**: your month, grouped by day. Filter by level, time of day or tag. Use the ⋯ menu to edit, re-score or delete (with Undo).
5. **Calendar**: a face for every day. Tap a day to open it. There is also a Year view.

Keyboard: **N** opens a new update, **←/→** change the month, **Esc** closes sheets.

## Folder structure

```
src/
  proxy.ts             Clerk middleware: /app/* needs a signed-in user
  app/                 Routes (thin). / = landing, /sign-in, /sign-up, /app/* = the app, /api/* = JSON API
  components/          brand/ (logo), levels/ (faces), shell/ (app shell, nav), ui/ (primitives)
  features/            entries, new-update, stats (incl. rumbo-chart/), calendar, goals, settings, data, landing
  hooks/               URL month param, resize observer, media queries, keyboard shortcuts
  lib/                 levels.ts, stats/ (pure, tested), gemini/ (client + prompts), schemas, api-client, utils
  server/              env, auth (requireUserId), db/ (MongoDB client), http errors, timezone, repositories/ (only code that touches storage), services/
  types/               Shared types
tests/                 Vitest unit tests
```

Request flow: `route.ts` → `services` → `lib/gemini` + `repositories`. Routes validate input with Zod. Services hold the logic. Repositories hold storage (MongoDB), and each one upgrades old records when it reads them.

## Notes

- Your API key stays on the server. The browser never sees it.
- If Gemini fails, nothing is saved, so every entry in your log has a score.
- The browser sends its time zone (`x-timezone`). Days are always your local days.
- Data is stored in MongoDB. Every document carries the Clerk `userId`, and every repository method takes it first, so users only ever see their own log.
- API routes call `requireUserId()` and answer `401` when signed out. `/app/*` pages redirect to sign-in.
- To bring in a log from the old local-file version, sign in and import `data/entries.json` (or any JSON export) at More → Your data → Import.
- Reminders (Settings) only work while Rumbodia is open in a browser tab.
