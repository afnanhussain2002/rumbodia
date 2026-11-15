import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/** Centers Clerk's prebuilt sign-in / sign-up card under the Rumbodia logo. */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" aria-label="Rumbodia home" className="rounded-xl">
        <Logo size={40} />
      </Link>
      {children}
    </main>
  );
}
