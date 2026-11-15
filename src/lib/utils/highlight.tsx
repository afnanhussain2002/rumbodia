import { Fragment } from "react";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wrap case-insensitive matches of `query` in <mark>. */
export function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "ig"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function matchesQuery(fields: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((f) => f.toLowerCase().includes(q));
}
