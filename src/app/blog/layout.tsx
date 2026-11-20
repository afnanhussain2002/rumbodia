import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { Footer, WRAP } from "@/features/landing/components/landing-sections";
import { TRIAL_DAYS } from "@/lib/billing";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className={`${WRAP} flex items-center justify-between gap-4 py-5`}>
        <Link href="/" aria-label="Rumbodia home" className="rounded-xl">
          <Logo variant="full" size={30} />
        </Link>
        <nav aria-label="Blog" className="flex items-center gap-4">
          <Link href="/blog" className="text-[15px] font-semibold hover:underline">
            Blog
          </Link>
          <Link href="/sign-up" className={buttonClass("primary", "sm", "btn-pop whitespace-nowrap")}>
            Start free<span className="hidden sm:inline"> · {TRIAL_DAYS} days</span>
          </Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
