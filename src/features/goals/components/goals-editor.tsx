"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import type { Goal } from "@/types";
import { GOAL_ICONS, MAX_GOAL_TARGET, MAX_GOAL_TITLE, MAX_GOALS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { IconButton } from "@/components/ui/icon-button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { GoalIcon } from "@/features/goals/components/goal-icons";
import { useGoalsQuery, useSaveGoals } from "@/features/goals/hooks/use-goals";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const sameGoals = (a: Goal[], b: Goal[]) =>
  a.length === b.length &&
  a.every((g, i) => g.id === b[i]!.id && g.title === b[i]!.title && g.target === b[i]!.target && g.icon === b[i]!.icon);

export function GoalsEditor() {
  const query = useGoalsQuery();
  const save = useSaveGoals();
  const toast = useToast();
  const [draft, setDraft] = useState<Goal[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data && draft === null) setDraft(query.data);
  }, [query.data, draft]);

  if (query.isLoading || !draft) return <SkeletonCard height={220} label="Loading goals" />;

  const dirty = !sameGoals(draft, query.data ?? []);
  const update = (i: number, patch: Partial<Goal>) => setDraft(draft.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= draft.length || from === to) return;
    const next = [...draft];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setDraft(next);
  };

  function onSave() {
    const goals = draft!.map((g, order) => ({ ...g, title: g.title.trim(), target: g.target.trim(), order }));
    if (goals.some((g) => !g.title)) {
      setError("Every goal needs a title. Remove empty rows or fill them in.");
      return;
    }
    setError(null);
    save.mutate(goals, {
      onSuccess: (saved) => {
        setDraft(saved);
        toast.show({ message: "Goals saved. Gemini will score against these." });
      },
      onError: (err) => setError((err as Error).message),
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-[15px] text-ink-soft">Gemini scores every update against these goals. Add up to {MAX_GOALS}.</p>

      <Card>
        {draft.length === 0 ? (
          <p className="py-6 text-center text-ink-soft">No goals yet. Add the things you want to move forward.</p>
        ) : (
          <ol className="divide-y divide-line" aria-label="Your goals">
            {draft.map((goal, i) => (
              <li
                key={goal.id}
                className={cn("flex items-start gap-2 py-3 first:pt-0 last:pb-0", dragIndex === i && "opacity-50")}
                draggable={armed === goal.id}
                onDragStart={(e) => {
                  setDragIndex(i);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== i) {
                    move(dragIndex, i);
                    setDragIndex(i);
                  }
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setArmed(null);
                }}
              >
                <span
                  className="hidden h-11 w-6 shrink-0 cursor-grab items-center justify-center text-ink-soft sm:inline-flex"
                  aria-hidden
                  title="Drag to reorder"
                  onPointerDown={() => setArmed(goal.id)}
                  onPointerUp={() => setArmed(null)}
                >
                  <GripVertical size={18} />
                </span>

                <Dropdown
                  label="Choose an icon"
                  checkable
                  items={GOAL_ICONS.map((name) => ({
                    key: name,
                    label: name.replace("-", " "),
                    icon: <GoalIcon name={name} size={18} />,
                    selected: goal.icon === name,
                    onSelect: () => update(i, { icon: name }),
                  }))}
                  trigger={(props) => (
                    <button
                      type="button"
                      {...props}
                      aria-label={`Icon: ${goal.icon}. Change icon`}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-brand-soft text-brand-strong hover:opacity-80"
                    >
                      <GoalIcon name={goal.icon} />
                    </button>
                  )}
                />

                <div className="grid min-w-0 flex-1 gap-1.5">
                  <label className="sr-only" htmlFor={`goal-title-${goal.id}`}>
                    Goal {i + 1} title
                  </label>
                  <input
                    id={`goal-title-${goal.id}`}
                    value={goal.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    maxLength={MAX_GOAL_TITLE}
                    placeholder="Run or work out"
                    className="h-11 w-full rounded-[12px] border border-line bg-card px-3 text-[16px] font-semibold"
                  />
                  <label className="sr-only" htmlFor={`goal-target-${goal.id}`}>
                    Goal {i + 1} target (optional)
                  </label>
                  <input
                    id={`goal-target-${goal.id}`}
                    value={goal.target}
                    onChange={(e) => update(i, { target: e.target.value })}
                    maxLength={MAX_GOAL_TARGET}
                    placeholder="Target, e.g. 4 times a week (optional)"
                    className="h-10 w-full rounded-[12px] border border-line bg-card px-3 text-[15px] text-ink-soft"
                  />
                </div>

                <div className="flex shrink-0 flex-col items-center sm:flex-row">
                  <IconButton label={`Move "${goal.title || "goal"}" up`} size="sm" onClick={() => move(i, i - 1)} disabled={i === 0}>
                    <ArrowUp size={18} aria-hidden />
                  </IconButton>
                  <IconButton label={`Move "${goal.title || "goal"}" down`} size="sm" onClick={() => move(i, i + 1)} disabled={i === draft.length - 1}>
                    <ArrowDown size={18} aria-hidden />
                  </IconButton>
                  <IconButton label={`Delete "${goal.title || "goal"}"`} size="sm" onClick={() => setDraft(draft.filter((_, j) => j !== i))} className="hover:text-danger">
                    <Trash2 size={18} aria-hidden />
                  </IconButton>
                </div>
              </li>
            ))}
          </ol>
        )}

        <Button
          variant="secondary"
          className="mt-4 w-full"
          icon={<Plus size={18} aria-hidden />}
          disabled={draft.length >= MAX_GOALS}
          onClick={() => {
            setDraft([...draft, { id: newId(), title: "", target: "", icon: "target", order: draft.length }]);
            requestAnimationFrame(() => {
              const inputs = document.querySelectorAll<HTMLInputElement>('input[id^="goal-title-"]');
              inputs[inputs.length - 1]?.focus();
            });
          }}
        >
          {draft.length >= MAX_GOALS ? `You have ${MAX_GOALS} goals` : "Add a goal"}
        </Button>
      </Card>

      {error && (
        <p role="alert" className="rounded-[14px] bg-danger-soft p-3 text-[15px] text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={onSave} loading={save.isPending} disabled={!dirty} size="lg" className="flex-1 sm:flex-none">
          Save goals
        </Button>
        {dirty && (
          <Button variant="ghost" size="lg" onClick={() => setDraft(query.data ?? [])}>
            Discard changes
          </Button>
        )}
      </div>
    </div>
  );
}
