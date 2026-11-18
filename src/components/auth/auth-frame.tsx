import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BackgroundBlobs } from "@/components/fun/decor";
import { Rumbo } from "@/features/mascot/rumbo";
import { SpeechBubble } from "@/features/mascot/speech-bubble";

/** Centers Clerk's sign-in / sign-up card under the logo, with Rumbo saying hi. */
export function AuthFrame({ children, greeting = "Hi! Let's go!" }: { children: React.ReactNode; greeting?: string }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-10">
      <BackgroundBlobs />
      <Link href="/" aria-label="Rumbodia home" className="rounded-xl">
        <Logo size={40} />
      </Link>
      <div className="flex items-end gap-2" aria-hidden>
        <Rumbo level="rising" size={92} color="var(--mood-500)" decorative />
        <SpeechBubble tail="left" size="sm" className="mb-10 -rotate-3">
          {greeting}
        </SpeechBubble>
      </div>
      {children}
    </main>
  );
}
