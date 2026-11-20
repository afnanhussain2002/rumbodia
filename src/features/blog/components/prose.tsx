import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Building blocks for article bodies. Server components, no client JS. */

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 scroll-mt-24 font-display text-[28px] leading-tight font-extrabold tracking-[-0.01em] sm:text-[32px]">
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mt-8 scroll-mt-24 font-display text-[21px] leading-snug font-bold sm:text-[23px]">
      {children}
    </h3>
  );
}

export function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-4 text-[18px] leading-[1.7] text-ink/90", className)}>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-4 list-disc space-y-2.5 pl-6 text-[18px] leading-[1.65] text-ink/90 marker:text-mood-500">{children}</ul>;
}

export function OL({ children }: { children: React.ReactNode }) {
  return <ol className="mt-4 list-decimal space-y-2.5 pl-6 text-[18px] leading-[1.65] text-ink/90 marker:font-bold">{children}</ol>;
}

export function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-bold text-ink">{children}</strong>;
}

const linkClass = "font-semibold text-ink underline decoration-mood-500 decoration-2 underline-offset-[3px] hover:decoration-ink";

/** Outside source. Opens in a new tab. */
export function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

/** Link inside the site (other posts, the app). */
export function In({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

/** An example entry, set apart like a note. */
export function Example({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="mt-5 rounded-2xl border-2 border-outline bg-bubble px-5 py-4 font-hand text-[21px] leading-snug text-ink-fixed shadow-[3px_3px_0_var(--outline)]">
      {children}
    </blockquote>
  );
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full min-w-[520px] border-collapse text-left text-[16px] leading-snug">
        <thead>
          <tr className="bg-mood-50">
            {head.map((h) => (
              <th key={h} scope="col" className="border-b border-line px-4 py-3 font-display font-bold text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {row.map((cell, j) => (
                <td key={j} className={cn("px-4 py-3 align-top text-ink/90", j === 0 && "font-semibold text-ink")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
