"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { api, type EntryPatch, type NewEntryInput } from "@/lib/api-client";
import { scoreToLevel } from "@/lib/levels";
import { queryKeys } from "@/lib/query-keys";
import { formatScore } from "@/lib/utils/scores";
import type { Entry } from "@/types";
import { useToast } from "@/components/ui/toast";

type Snapshot = [QueryKey, Entry[] | undefined][];

function snapshot(qc: QueryClient): Snapshot {
  return qc.getQueriesData<Entry[]>({ queryKey: queryKeys.allEntries });
}

function restore(qc: QueryClient, snap: Snapshot) {
  for (const [key, data] of snap) qc.setQueryData(key, data);
}

/** Does an entry fall inside a ["entries", from, to] query's range? */
function inRange(key: QueryKey, entry: Entry): boolean {
  const [, from, to] = key as [string, string | null, string | null];
  const t = Date.parse(entry.createdAt);
  return (!from || t >= Date.parse(from)) && (!to || t < Date.parse(to));
}

/** Put an entry into every cached range it belongs to (and remove it from others). */
function upsertInCache(qc: QueryClient, entry: Entry) {
  for (const [key, data] of snapshot(qc)) {
    if (!data) continue;
    const without = data.filter((e) => e.id !== entry.id);
    const next = inRange(key, entry) ? [...without, entry].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : without;
    qc.setQueryData(key, next);
  }
}

function removeFromCache(qc: QueryClient, id: string) {
  for (const [key, data] of snapshot(qc)) {
    if (data) qc.setQueryData(key, data.filter((e) => e.id !== id));
  }
}

function invalidateAfterChange(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.allEntries });
  void qc.invalidateQueries({ queryKey: queryKeys.tags });
  void qc.invalidateQueries({ queryKey: queryKeys.allInsights });
}

export function levelLabel(score: number): string {
  return `${scoreToLevel(score).name} (${formatScore(score)})`;
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewEntryInput) => api.createEntry(input),
    onSuccess: (entry) => {
      upsertInCache(qc, entry);
      invalidateAfterChange(qc);
    },
  });
}

/** Edit an entry. Without `rescore` the change is optimistic and rolls back on error. */
export function useUpdateEntry() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ entry, patch }: { entry: Entry; patch: EntryPatch }) => api.updateEntry(entry.id, patch),
    onMutate: ({ entry, patch }) => {
      const snap = snapshot(qc);
      if (!patch.rescore) {
        upsertInCache(qc, {
          ...entry,
          text: patch.text ?? entry.text,
          timeOfDay: patch.timeOfDay ?? entry.timeOfDay,
          createdAt: patch.createdAt ?? entry.createdAt,
          boosts: patch.boosts ?? entry.boosts,
          drains: patch.drains ?? entry.drains,
          updatedAt: new Date().toISOString(),
        });
      }
      return { snap };
    },
    onError: (err, vars, ctx) => {
      if (ctx) restore(qc, ctx.snap);
      if (!vars.patch.rescore) toast.show({ message: `Edit not saved. ${(err as Error).message}`, tone: "error" });
    },
    onSuccess: (entry) => {
      upsertInCache(qc, entry);
      invalidateAfterChange(qc);
    },
  });
}

/** Re-score from the ⋯ menu, with a toast for the result. */
export function useRescoreEntry() {
  const update = useUpdateEntry();
  const toast = useToast();
  return useCallback(
    (entry: Entry) => {
      toast.show({ message: "Re-scoring with Gemini…", duration: 2500 });
      update.mutate(
        { entry, patch: { rescore: true } },
        {
          onSuccess: (next) => toast.show({ message: `Re-scored: ${levelLabel(next.score)}` }),
          onError: (err) => toast.show({ message: (err as Error).message, tone: "error" }),
        },
      );
    },
    [update, toast],
  );
}

/** Optimistic delete with a 6-second Undo (restored through the API). */
export function useDeleteEntry() {
  const qc = useQueryClient();
  const toast = useToast();

  return useCallback(
    (entry: Entry) => {
      const snap = snapshot(qc);
      removeFromCache(qc, entry.id);

      const deleting = api.deleteEntry(entry.id).then(
        () => {
          invalidateAfterChange(qc);
          return true;
        },
        (err: Error) => {
          restore(qc, snap);
          toast.show({ message: `Could not delete. ${err.message}`, tone: "error" });
          return false;
        },
      );

      toast.show({
        message: "Poof! Update deleted.",
        action: {
          label: "Undo",
          onClick: () => {
            upsertInCache(qc, entry);
            void deleting.then(async (deleted) => {
              if (!deleted) return;
              try {
                await api.restoreEntry(entry);
                invalidateAfterChange(qc);
              } catch (err) {
                removeFromCache(qc, entry.id);
                toast.show({ message: `Could not undo. ${(err as Error).message}`, tone: "error" });
              }
            });
          },
        },
      });
    },
    [qc, toast],
  );
}
