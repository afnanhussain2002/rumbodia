"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { ADMIN_ACTION_LABELS, type AdminAuditItem, type AdminUserRow } from "@/lib/admin";
import { PLANS, type BillingStatus } from "@/lib/billing";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAudit, useAdminTeam, useAdminUsers } from "@/features/admin/hooks/use-admin";
import { UserSheet } from "@/features/admin/components/user-sheet";

type Tab = "users" | "activity" | "team";

export const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** "Lifetime", "Monthly (given)", "Trial · 3 days left", "Expired". */
export function accessLabel(b: BillingStatus): { text: string; tone: "good" | "warn" | "bad" | "muted" } {
  if (b.state === "active" && b.plan) return { text: `${PLANS[b.plan].name}${b.granted ? " · given" : ""}`, tone: "good" };
  if (b.state === "trial") {
    const d = Math.max(0, Math.ceil((Date.parse(b.trialEndsAt) - Date.now()) / 86_400_000));
    return { text: `Trial · ${d} day${d === 1 ? "" : "s"} left`, tone: "warn" };
  }
  return { text: "Expired", tone: "bad" };
}

export function StatusPill({ text, tone }: { text: string; tone: "good" | "warn" | "bad" | "muted" }) {
  const cls = {
    good: "bg-[var(--level-soaring)] text-[var(--level-soaring-ink)]",
    warn: "bg-[var(--level-steady)] text-[var(--level-steady-ink)]",
    bad: "bg-[var(--level-falling)] text-[var(--level-falling-ink)]",
    muted: "bg-line text-ink-soft",
  }[tone];
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold whitespace-nowrap", cls)}>{text}</span>;
}

export function AdminScreen({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("users");
  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-bold tracking-wide text-ink-soft uppercase">
            <ShieldCheck size={16} aria-hidden /> Admin
          </p>
          <h1 className="font-display text-[28px] leading-tight font-extrabold">Control room</h1>
          <p className="mt-1 text-[14px] break-words text-ink-soft">
            Signed in as <span className="font-semibold break-all text-ink">{email}</span>. Every change is recorded in Activity.
          </p>
        </div>
        <SegmentedControl<Tab>
          label="Admin section"
          value={tab}
          onChange={setTab}
          options={[
            { value: "users", label: "Users" },
            { value: "activity", label: "Activity" },
            { value: "team", label: "Admins" },
          ]}
        />
      </div>
      {tab === "users" && <UsersPanel />}
      {tab === "activity" && <ActivityPanel />}
      {tab === "team" && <TeamPanel />}
    </div>
  );
}

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function UsersPanel() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDebounced(search.trim());
  const users = useAdminUsers(q, page);

  useEffect(() => setPage(1), [q]);

  return (
    <Card className="p-0 lg:p-0">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-[360px]">
          <span className="sr-only">Search users</span>
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name"
            className="h-11 w-full rounded-full border-2 border-line bg-card pr-4 pl-10 text-[15px] text-ink outline-none focus:border-mood-500"
          />
        </label>
        {users.data && (
          <p className="text-[13px] font-semibold text-ink-soft">
            {users.data.total} user{users.data.total === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {users.isPending ? (
        <div className="space-y-2 p-4" role="status" aria-label="Loading users">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-[16px]" />
          ))}
        </div>
      ) : users.isError ? (
        <p className="p-4 text-danger">{(users.error as Error).message}</p>
      ) : users.data.items.length === 0 ? (
        <p className="p-6 text-center text-ink-soft">No users match “{q}”.</p>
      ) : (
        <ul className={cn("divide-y divide-line", users.isFetching && "opacity-70")}>
          {users.data.items.map((u) => (
            <li key={u.id}>
              <UserRowButton user={u} onOpen={() => setOpenId(u.id)} />
            </li>
          ))}
        </ul>
      )}

      {users.data && users.data.pages > 1 && (
        <div className="flex items-center justify-between border-t border-line p-3">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={<ChevronLeft size={16} aria-hidden />}>
            Previous
          </Button>
          <span className="text-[13px] font-semibold text-ink-soft tabular">
            Page {users.data.page} of {users.data.pages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= users.data.pages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight size={16} aria-hidden />
          </Button>
        </div>
      )}

      <UserSheet userId={openId} onClose={() => setOpenId(null)} />
    </Card>
  );
}

export function Avatar({ user, size = 40 }: { user: Pick<AdminUserRow, "imageUrl" | "email" | "name">; size?: number }) {
  const letter = (user.name || user.email || "?").charAt(0).toUpperCase();
  return user.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.imageUrl} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-mood-100 font-bold text-ink" style={{ width: size, height: size }}>
      {letter}
    </span>
  );
}

function UserRowButton({ user, onOpen }: { user: AdminUserRow; onOpen: () => void }) {
  const access = accessLabel(user.billing);
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg focus-visible:bg-bg">
      <Avatar user={user} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[15px] font-semibold">{user.name || user.email || user.id}</span>
          {user.isAdmin && <StatusPill text="Admin" tone="muted" />}
          {user.banned && <StatusPill text="Blocked" tone="bad" />}
        </span>
        <span className="block truncate text-[13px] text-ink-soft">
          {user.name ? `${user.email} · ` : ""}
          {user.entries} update{user.entries === 1 ? "" : "s"} · joined {shortDate(user.createdAt)}
        </span>
      </span>
      <span className="hidden sm:block">
        <StatusPill {...access} />
      </span>
      <ChevronRight size={18} className="shrink-0 text-ink-soft" aria-hidden />
    </button>
  );
}

/** One line of the activity log. */
export function AuditLine({ item, showTarget = true }: { item: AdminAuditItem; showTarget?: boolean }) {
  const d = item.details ?? {};
  let extra = "";
  if (item.action === "access.grant") {
    const plan = PLANS[d.plan as keyof typeof PLANS]?.name ?? String(d.plan);
    extra = `${plan}${d.until ? ` until ${shortDate(String(d.until))}` : " forever"}`;
  } else if (item.action === "trial.extend") extra = `+${d.days} days`;
  else if (item.action === "access.revoke") extra = PLANS[d.plan as keyof typeof PLANS]?.name ?? "";
  else if (item.action === "user.delete") {
    extra = `${d.entries ?? 0} updates removed${d.canceledSubscriptions ? `, ${d.canceledSubscriptions} subscription(s) canceled` : ""}`;
  }
  return (
    <div className="min-w-0 py-2.5">
      <p className="text-[14px] break-words">
        <span className="font-semibold">{ADMIN_ACTION_LABELS[item.action] ?? item.action}</span>
        {extra && <span className="text-ink-soft"> · {extra}</span>}
        {showTarget && item.targetEmail && <span className="break-all"> · {item.targetEmail}</span>}
      </p>
      <p className="text-[12px] break-all text-ink-soft">
        {dateTime(item.createdAt)} by {item.adminEmail}
        {typeof d.note === "string" && d.note ? ` · “${d.note}”` : ""}
      </p>
    </div>
  );
}

function ActivityPanel() {
  const audit = useAdminAudit();
  return (
    <Card>
      <CardHeader title="Activity" subtitle="The last 100 admin actions" />
      {audit.isPending ? (
        <Skeleton className="h-40 rounded-[16px]" />
      ) : audit.isError ? (
        <p className="text-danger">{(audit.error as Error).message}</p>
      ) : audit.data.length === 0 ? (
        <p className="text-ink-soft">Nothing yet. Changes you make to users show up here.</p>
      ) : (
        <ul className="divide-y divide-line">
          {audit.data.map((a) => (
            <li key={a.id}>
              <AuditLine item={a} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TeamPanel() {
  const team = useAdminTeam();
  return (
    <Card>
      <CardHeader title="Admins" subtitle="Who can open this page" />
      {team.isPending ? (
        <Skeleton className="h-24 rounded-[16px]" />
      ) : team.isError ? (
        <p className="text-danger">{(team.error as Error).message}</p>
      ) : (
        <ul className="divide-y divide-line">
          {team.data.members.map((m) => (
            <li key={m.email} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold break-all">{m.email}</span>
                <span className="block text-[13px] text-ink-soft">{m.userId ? m.name || "Signed up" : "Hasn't signed up yet"}</span>
              </span>
              {m.email === team.data.you && <StatusPill text="You" tone="muted" />}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 rounded-[14px] bg-bg p-3 text-[13px] text-ink-soft">
        To add or remove an admin, change <code className="font-mono text-ink">ADMIN_EMAILS</code> in{" "}
        <code className="font-mono text-ink">wrangler.jsonc</code> (comma separated) and deploy. Only a verified email on the account counts.
      </p>
    </Card>
  );
}
