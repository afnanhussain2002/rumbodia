import { Suspense } from "react";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRight, ChartNoAxesColumn, Lock, PenLine, Sparkles } from "lucide-react";
import { TRIAL_DAYS } from "@/lib/billing";
import { LEVELS, type LevelKey } from "@/lib/levels";
import { UserMenu } from "@/components/auth/user-menu";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { Sparks, Squiggle, Sticker } from "@/components/fun/decor";
import { Hl } from "@/components/fun/ink-hero";
import { Rumbo } from "@/features/mascot/rumbo";
import { SpeechBubble } from "@/features/mascot/speech-bubble";
import { LiveDemo } from "@/features/landing/components/live-demo";

export const WRAP = "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8";

function Nav() {
  return (
    <div className={`${WRAP} flex h-20 items-center justify-between`}>
      <Link href="/" aria-label="Rumbodia home" className="rounded-xl">
        <Logo size={34} />
      </Link>
      <nav aria-label="Landing" className="hidden items-center gap-6 text-[15px] font-semibold text-ink-soft md:flex">
        <a href="#demo" className="hover:text-ink">Try it</a>
        <a href="#levels" className="hover:text-ink">Levels</a>
        <a href="#pricing" className="hover:text-ink">Pricing</a>
        <a href="#faq" className="hover:text-ink">FAQ</a>
      </nav>
      <Suspense>
        <Show when="signed-out">
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className={buttonClass("ghost", "md")}>
              Sign in
            </Link>
            <Link href="/sign-up" className={buttonClass("primary", "md", "btn-pop")}>
              Start free
            </Link>
          </div>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-3">
            <Link href="/app" className={buttonClass("primary", "md", "btn-pop")}>
              Open Rumbodia
            </Link>
            <UserMenu />
          </div>
        </Show>
      </Suspense>
    </div>
  );
}

/** Dark hero panel: huge two-color caps headline, the mascot peeking from the corner, a bubble. */
export function Hero() {
  return (
    <header>
      <Nav />
      <HeroPanel />
    </header>
  );
}

export function HeroPanel() {
  return (
    <>
      <div className={`${WRAP} pt-2 pb-10`}>
        <section className="ink-hero min-h-[560px] px-6 py-12 sm:px-12 sm:py-16 lg:min-h-[600px]">
          <div className="relative z-[2] max-w-[640px]">
            <Sticker tone="cream" className="mb-6 text-[15px]" rotate={-3}>
              {TRIAL_DAYS} days free · no card
            </Sticker>
            <h1 className="font-display text-[clamp(44px,8vw,92px)] leading-[0.92] font-extrabold tracking-[-0.03em] uppercase">
              Which way
              <br />
              is <Hl>your day</Hl>
              <Sparks className="ml-1 inline-block -translate-y-6 align-top" />
              <br />
              going?
            </h1>
            <Squiggle className="mt-3" width={170} />
            <p className="mt-6 max-w-[460px] text-[18px] leading-relaxed text-cream/75">
              Write what you did. Gemini reads it against your goals and scores it from −10 to +10. Rumbo, your little buddy, shows you the direction.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={buttonClass("primary", "lg", "btn-pop !border-cream h-14 px-7 text-[17px]")}>
                Start free · {TRIAL_DAYS} days <ArrowRight size={20} aria-hidden />
              </Link>
              <a href="#demo" className={buttonClass("ghost", "lg", "h-14 text-cream hover:bg-white/10")}>
                Try the demo
              </a>
            </div>
          </div>

          {/* Rumbo peeking in from the bottom-right edge, like the reference */}
          <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-28 z-[1] sm:-right-10 lg:right-6 lg:-bottom-24">
            <Rumbo level="steady" size={360} color="var(--mood-500)" decorative limbs={false} animated className="max-sm:size-[220px]" />
          </div>
          <div className="absolute right-[150px] bottom-[150px] z-[3] hidden md:block lg:right-[300px] lg:bottom-[190px]">
            <SpeechBubble tail="bottom-right" size="lg" className="-rotate-3">
              I&rsquo;ll keep you honest!
            </SpeechBubble>
          </div>
        </section>
      </div>
    </>
  );
}

export function DemoSection() {
  return (
    <section id="demo" aria-labelledby="demo-title" className={`${WRAP} scroll-mt-6 py-14`}>
      <div className="mb-8 max-w-2xl">
        <h2 id="demo-title" className="font-display text-[clamp(32px,4vw,48px)] leading-none font-extrabold tracking-[-0.02em] uppercase">
          Try it. <Hl marker>Watch Rumbo react.</Hl>
        </h2>
        <p className="mt-3 text-[17px] text-ink-soft">Pick a sample day (or write your own). The whole page changes color with the mood.</p>
      </div>
      <LiveDemo />
    </section>
  );
}

export function LevelsShowcase() {
  return (
    <section id="levels" aria-labelledby="levels-title" className={`${WRAP} scroll-mt-6 py-14`}>
      <h2 id="levels-title" className="font-display text-[clamp(32px,4vw,48px)] leading-none font-extrabold tracking-[-0.02em] uppercase">
        Meet the levels
      </h2>
      <p className="mt-3 max-w-xl text-[17px] text-ink-soft">
        Five moods, five shapes, five colors. You can tell how your day is going without reading a thing.
      </p>
      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {LEVELS.map((l) => (
          <li
            key={l.key}
            className="group surface lift flex flex-col items-center px-3 pt-6 pb-5 text-center"
            style={{ background: `color-mix(in srgb, ${l.colorVar} 12%, var(--card))` }}
            tabIndex={0}
          >
            <Rumbo level={l.key} size={120} hoverOnly label={`${l.name}, ${l.range}`} />
            <span className="mt-2 font-display text-[22px] font-extrabold" style={{ color: l.textColorVar }}>
              {l.name}
            </span>
            <span className="text-[14px] font-semibold text-ink-soft tabular">{l.range}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS: { title: string; body: string; icon: React.ReactNode; level: LevelKey }[] = [
  { title: "Write", body: "A short numbered list of what you did. Morning, noon or night.", icon: <PenLine size={22} aria-hidden />, level: "steady" },
  { title: "Get scored", body: "Gemini reads it against your goals: −10 to +10, with wins and slips.", icon: <Sparkles size={22} aria-hidden />, level: "rising" },
  { title: "See your direction", body: "Faces, colors and charts show where your weeks and months are heading.", icon: <ChartNoAxesColumn size={22} aria-hidden />, level: "soaring" },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className={`${WRAP} py-14`}>
      <h2 id="how-title" className="font-display text-[clamp(32px,4vw,48px)] leading-none font-extrabold tracking-[-0.02em] uppercase">
        How it <Hl marker>works</Hl>
      </h2>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="surface lift relative overflow-hidden p-6 pb-28">
            <span className="sticker bg-mood-500 px-3.5 py-1.5 text-[18px] text-mood-ink" style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
              {i + 1}
            </span>
            <h3 className="mt-5 flex items-center gap-2 font-display text-2xl font-extrabold">
              <span className="text-mood-strong">{s.icon}</span>
              {s.title}
            </h3>
            <p className="mt-2 text-[16px] text-ink-soft">{s.body}</p>
            <Rumbo level={s.level} size={110} decorative className="absolute -right-3 -bottom-5" />
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A small static month-in-faces preview, like the Stats screen. */
export function StatsPreview() {
  const week: number[] = [-1, 2, 4, -4, 1, 3, 8, 5, -2, 6, 7, 9, 4, 5];
  return (
    <section aria-labelledby="stats-title" className={`${WRAP} py-14`}>
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 id="stats-title" className="font-display text-[clamp(32px,4vw,48px)] leading-none font-extrabold tracking-[-0.02em] uppercase">
            Your <Hl marker>rumbo</Hl>, over weeks and months
          </h2>
          <p className="mt-4 max-w-md text-[17px] text-ink-soft">
            Streaks, a Rumbo chart colored by level, a calendar of faces, tag impact and a weekly letter from Rumbo.
          </p>
        </div>
        <div className="surface p-6" role="img" aria-label="Example two weeks of daily scores, mostly rising">
          <div className="flex items-end justify-between gap-1.5" style={{ height: 180 }} aria-hidden>
            {week.map((v, i) => {
              const level = v >= 7 ? "soaring" : v >= 3 ? "rising" : v > -3 ? "steady" : v > -7 ? "slipping" : "falling";
              return (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-center">
                  <div className="flex h-1/2 w-full items-end">
                    {v > 0 && <div className="w-full rounded-t-[8px]" style={{ height: `${v * 10}%`, background: `var(--level-${level})` }} />}
                  </div>
                  <div className="h-0.5 w-full bg-line" />
                  <div className="flex h-1/2 w-full items-start">
                    {v < 0 && <div className="w-full rounded-b-[8px]" style={{ height: `${-v * 10}%`, background: `var(--level-${level})` }} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between gap-1" aria-hidden>
            {week.slice(-7).map((v, i) => (
              <Rumbo
                key={i}
                level={v >= 7 ? "soaring" : v >= 3 ? "rising" : v > -3 ? "steady" : v > -7 ? "slipping" : "falling"}
                size={34}
                decorative
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "What does Gemini see?",
    a: "Only the text of each update, your goals and your last few updates for context. Your log is private to your account.",
  },
  { q: "Is Rumbo going to judge me?", a: "Never mean. Honest, yes: a bad day gets a negative score. But Rumbo is supportive on rough days." },
  { q: "What if I don't want a red app on a bad day?", a: 'Turn off "Color follows my mood" in Settings and the app stays a calm yellow.' },
  { q: "Can I log days I missed?", a: "Yes. Tap the date in the composer to backfill an earlier day." },
  { q: "Can I take my data with me?", a: "Export everything as JSON or CSV anytime, even after your trial." },
];

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={`${WRAP} scroll-mt-6 py-14`}>
      <h2 id="faq-title" className="font-display text-[clamp(32px,4vw,48px)] leading-none font-extrabold tracking-[-0.02em] uppercase">
        Questions?
      </h2>
      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        {FAQ.map((f) => (
          <details key={f.q} className="group surface p-5 open:bg-mood-50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-[18px] font-bold">
              {f.q}
              <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-mood-100 text-[20px] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-[16px] text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function PrivacyNote() {
  return (
    <section aria-label="Privacy" className={`${WRAP} py-10`}>
      <div className="flex items-start gap-4 rounded-[24px] bg-mood-100 p-6">
        <Lock size={22} className="mt-0.5 shrink-0 text-mood-strong" aria-hidden />
        <p className="text-[17px]">Your log is private to your account. Only the text of each update is sent to Gemini to score it.</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className={`${WRAP} flex flex-col gap-3 py-8 text-[15px] text-ink-soft sm:flex-row sm:items-center sm:justify-between`}>
        <span className="inline-flex items-center gap-3">
          <Logo variant="icon" size={24} />
          Rumbodia · {new Date().getFullYear()}
        </span>
        <span className="font-hand text-[18px]">Made with a lot of good days (and a few rough ones).</span>
      </div>
    </footer>
  );
}
