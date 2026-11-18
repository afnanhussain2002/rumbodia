"use client";

import { useState } from "react";
import { Ban, CalendarPlus, Gift, ShieldOff, Trash2, Undo2 } from "lucide-react";
import type { AdminUserDetail } from "@/lib/admin";
import { PLANS, type PlanId } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAccess, useAdminDelete, useAdminUser } from "@/features/admin/hooks/use-admin";
import { AuditLine, Avatar, StatusPill, accessLabel, shortDate } from "@/features/admin/components/admin-screen";

/** Drawer with everything about one user, and the actions an admin can take. */
export function UserSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const detail = useAdminUser(userId);
  return (
    <Sheet open={Boolean(userId)} onClose={onClose} title="User" variant="drawer">
      {detail.isPending ? (
        <div className="space-y-3" role="status" aria-label="Loading user">
          <Skeleton className="h-20 rounded-[16px]" />
          <Skeleton className="h-48 rounded-[16px]" />
        </div>
      ) : detail.isError ? (
        <p className="text-danger">{(detail.error as Error).message}</p>
      ) : (
        <UserDetail detail={detail.data} onDeleted={onClose} />
      )}
    </Sheet>
  );
}

const section = "rounded-[18px] border border-line bg-card p-4";
const sectionTitle = "mb-3 text-[13px] font-bold tracking-wide text-ink-soft uppercase";

function UserDetail({ detail, onDeleted }: { detail: AdminUserDetail; onDeleted: () => void }) {
  const { user } = detail;
  const access = accessLabel(user.billing);
  const mutate = useAdminAccess(user.id);
  const busy = mutate.isPending;

  return (
    <div className="space-y-4 pb-4">
      {/* Who */}
      <div className="flex items-center gap-3">
        <Avatar user={user} size={52} />
        <div className="min-w-0">
          <p className="truncate text-[18px] font-bold">{user.name || user.email}</p>
          <p className="text-[13px] break-all text-ink-soft">{user.email}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StatusPill {...access} />
            {user.isAdmin && <StatusPill text="Admin" tone="muted" />}
            {user.banned && <StatusPill text="Blocked" tone="bad" />}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
        <Fact label="Joined" value={shortDate(user.createdAt)} />
        <Fact label="Last active" value={shortDate(user.lastActiveAt)} />
        <Fact label="Updates" value={String(user.entries)} />
        <Fact label="Goals" value={String(detail.goals)} />
      </dl>

      {/* Current access */}
      <div className={section}>
        <p className={sectionTitle}>Access now</p>
        <ul className="space-y-1.5 text-[14px]">
          <li>
            <span className="text-ink-soft">Free trial: </span>
            {Date.parse(detail.trialEndsAt) > Date.now() ? "ends" : "ended"} {shortDate(detail.trialEndsAt)}
            {detail.trialExtraDays > 0 && <span className="text-ink-soft"> (+{detail.trialExtraDays} days added)</span>}
          </li>
          <li>
            <span className="text-ink-soft">Paid with Stripe: </span>
            {detail.stripe.lifetimePaidAt
              ? `Lifetime (paid ${shortDate(detail.stripe.lifetimePaidAt)})`
              : detail.stripe.plan
                ? `${PLANS[detail.stripe.plan].name} · ${detail.stripe.status}`
                : "nothing"}
          </li>
          <li>
            <span className="text-ink-soft">Given by an admin: </span>
            {detail.grant ? (
              <>
                {PLANS[detail.grant.plan].name} {detail.grant.until ? `until ${shortDate(detail.grant.until)}` : "forever"}
                {detail.grant.by && <span className="text-ink-soft"> · by {detail.grant.by}</span>}
              </>
            ) : (
              "nothing"
            )}
          </li>
        </ul>
        {detail.grant && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            loading={busy && mutate.variables?.action === "revoke"}
            disabled={busy}
            icon={<Undo2 size={16} aria-hidden />}
            onClick={() => mutate.mutate({ action: "revoke" })}
          >
            Remove given access
          </Button>
        )}
      </div>

      <GrantAccess busy={busy} pending={busy && mutate.variables?.action === "grant"} onGrant={(plan, days, note) => mutate.mutate({ action: "grant", plan, days, note })} />

      {/* Trial */}
      <div className={section}>
        <p className={sectionTitle}>Extend free trial</p>
        <div className="flex flex-wrap gap-2">
          {[3, 7, 14, 30].map((d) => (
            <Button
              key={d}
              variant="secondary"
              size="sm"
              disabled={busy}
              loading={busy && mutate.variables?.action === "extendTrial" && mutate.variables.days === d}
              icon={<CalendarPlus size={16} aria-hidden />}
              onClick={() => mutate.mutate({ action: "extendTrial", days: d })}
            >
              +{d} days
            </Button>
          ))}
        </div>
      </div>

      {/* Block */}
      {!user.isAdmin && (
        <div className={section}>
          <p className={sectionTitle}>Sign-in</p>
          <p className="mb-3 text-[14px] text-ink-soft">
            {user.banned ? "This user is blocked and can't sign in." : "Blocking signs them out and stops them signing in. Their data stays."}
          </p>
          {user.banned ? (
            <Button variant="secondary" size="sm" disabled={busy} loading={busy && mutate.variables?.action === "unblock"} icon={<ShieldOff size={16} aria-hidden />} onClick={() => mutate.mutate({ action: "unblock" })}>
              Unblock
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled={busy} loading={busy && mutate.variables?.action === "block"} icon={<Ban size={16} aria-hidden />} onClick={() => mutate.mutate({ action: "block" })}>
              Block sign-in
            </Button>
          )}
        </div>
      )}

      {!user.isAdmin && <DeleteAccount userId={user.id} email={user.email} onDeleted={onDeleted} />}

      {/* History */}
      <div className={section}>
        <p className={sectionTitle}>Admin history</p>
        {detail.audit.length === 0 ? (
          <p className="text-[14px] text-ink-soft">No admin changes yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {detail.audit.map((a) => (
              <li key={a.id}>
                <AuditLine item={a} showTarget={false} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-bg px-3 py-2">
      <dt className="text-[12px] text-ink-soft">{label}</dt>
      <dd className="font-semibold tabular">{value}</dd>
    </div>
  );
}

const DURATIONS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "0", label: "Forever" },
] as const;

function GrantAccess({ busy, pending, onGrant }: { busy: boolean; pending: boolean; onGrant: (plan: PlanId, days: number, note?: string) => void }) {
  const [plan, setPlan] = useState<PlanId>("lifetime");
  const [days, setDays] = useState<(typeof DURATIONS)[number]["value"]>("0");
  const [note, setNote] = useState("");
  return (
    <div className={section}>
      <p className={sectionTitle}>Give access (free, no Stripe)</p>
      <div className="space-y-3">
        <SegmentedControl<PlanId>
          label="Plan to give"
          value={plan}
          onChange={setPlan}
          fullWidth
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
            { value: "lifetime", label: "Lifetime" },
          ]}
        />
        {plan !== "lifetime" && (
          <SegmentedControl
            label="For how long"
            value={days}
            onChange={setDays}
            fullWidth
            size="sm"
            options={DURATIONS.map((d) => ({ value: d.value, label: d.label }))}
          />
        )}
        <label className="block">
          <span className="sr-only">Note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Note for the log (optional), e.g. “beta tester”"
            className="h-11 w-full rounded-[12px] border border-line bg-card px-3 text-[15px] text-ink outline-none focus:border-mood-500"
          />
        </label>
        <Button
          disabled={busy}
          loading={pending}
          icon={<Gift size={18} aria-hidden />}
          onClick={() => {
            onGrant(plan, plan === "lifetime" ? 0 : Number(days), note.trim() || undefined);
            setNote("");
          }}
        >
          Give {PLANS[plan].name}
          {plan !== "lifetime" ? ` · ${DURATIONS.find((d) => d.value === days)?.label.toLowerCase()}` : ""}
        </Button>
        <p className="text-[12px] text-ink-soft">Unlocks everything right away. They can still buy a real plan later.</p>
      </div>
    </div>
  );
}

function DeleteAccount({ userId, email, onDeleted }: { userId: string; email: string | null; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const del = useAdminDelete(() => {
    setOpen(false);
    onDeleted();
  });
  const matches = Boolean(email) && typed.trim().toLowerCase() === email!.toLowerCase();

  return (
    <div className="rounded-[18px] border-2 border-danger/40 p-4">
      <p className="mb-1 text-[13px] font-bold tracking-wide text-danger uppercase">Danger zone</p>
      <p className="mb-3 text-[14px] text-ink-soft">
        Cancels any Stripe subscription, deletes all their updates, goals, settings and billing records, and deletes the login. This can't be undone.
      </p>
      <Button variant="danger" size="sm" icon={<Trash2 size={16} aria-hidden />} onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <ConfirmDialog
        open={open}
        tone="danger"
        title="Delete this account?"
        description={
          <>
            Type <span className="font-semibold break-all text-ink">{email}</span> to confirm.
          </>
        }
        confirmLabel="Delete forever"
        confirmDisabled={!matches}
        loading={del.isPending}
        onConfirm={() => del.mutate({ userId, confirmEmail: typed })}
        onCancel={() => {
          setOpen(false);
          setTyped("");
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-label="User's email"
          placeholder={email ?? ""}
          className="mt-3 h-11 w-full rounded-[12px] border border-line bg-card px-3 text-[15px] text-ink outline-none focus:border-danger"
        />
      </ConfirmDialog>
    </div>
  );
}
