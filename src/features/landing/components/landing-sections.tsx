import { Suspense } from "react";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRight, Lock } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { TAGLINE } from "@/lib/constants";
import { Logo } from "@/components/brand/logo";
import { LevelLegend } from "@/components/levels/level-legend";
import { buttonClass } from "@/components/ui/button";
import { LiveDemo } from "@/features/landing/components/live-demo";

const WRAP = "mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8";

export function Hero() {
  return (
    <header>
      <div className={`${WRAP} flex h-20 items-center justify-between`}>
        <Logo size={34} />
        <Suspense>
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className={buttonClass("secondary", "md")}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonClass("primary", "md")}>
                Sign up
              </Link>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <Link href="/app/stats" className={buttonClass("secondary", "md")}>
                Open Rumbodia
              </Link>
              <UserMenu />
            </div>
          </Show>
        </Suspense>
      </div>
      <div className={`${WRAP} grid items-center gap-10 pt-6 pb-16 lg:grid-cols-2 lg:gap-16 lg:pt-12 lg:pb-24`}>
        <div>
          <h1 className="font-display text-[clamp(38px,6vw,64px)] leading-[1.02] font-bold tracking-[-0.02em]">{TAGLINE}</h1>
          <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-ink-soft">
            Write what you did. Gemini reads it against your goals. Your face, color and chart show the direction.
          </p>
          <Link href="/app/stats" className={buttonClass("primary", "lg", "mt-8")}>
            Start logging <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <LiveDemo />
      </div>
    </header>
  );
}

const STEPS = [
  { title: "Set your goals", body: "Up to ten things you want to move forward, like running or getting users." },
  { title: "Log updates any time", body: "Morning, noon, afternoon or night. A short list is enough." },
  { title: "Watch your direction", body: "Every day gets a face and a color. The chart shows where you are heading." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className={`${WRAP} py-14`}>
      <h2 id="how-title" className="font-display text-3xl font-bold tracking-[-0.01em]">
        How it works
      </h2>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {STEPS.map((s, i) => (
          <li key={s.title} className="surface p-6">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand-soft font-display text-lg font-bold text-brand-strong tabular">
              {i + 1}
            </span>
            <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
            <p className="mt-2 text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function LevelsShowcase() {
  return (
    <section aria-labelledby="levels-title" className={`${WRAP} py-14`}>
      <h2 id="levels-title" className="font-display text-3xl font-bold tracking-[-0.01em]">
        The five levels
      </h2>
      <p className="mt-2 max-w-xl text-ink-soft">Gemini scores each update from −10 to +10. Rumbodia turns the score into one of five faces.</p>
      <div className="surface mt-8 p-6 sm:p-8">
        <LevelLegend size={56} />
      </div>
    </section>
  );
}

export function PrivacyNote() {
  return (
    <section aria-label="Privacy" className={`${WRAP} py-10`}>
      <div className="flex items-start gap-4 rounded-[20px] bg-brand-soft p-6">
        <Lock size={22} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
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
        <a href="https://github.com/" className="font-semibold hover:text-ink" rel="noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
