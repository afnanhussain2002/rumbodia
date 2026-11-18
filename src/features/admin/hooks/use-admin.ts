"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { AdminAccessInput } from "@/lib/schemas";
import { useToast } from "@/components/ui/toast";

/** Whether the signed-in user is an admin. Only decides whether to show the link; the server checks every call. */
export function useIsAdmin(): boolean {
  const q = useQuery({ queryKey: queryKeys.adminMe, queryFn: api.adminMe, staleTime: 10 * 60_000, retry: false });
  return Boolean(q.data?.isAdmin);
}

export function useAdminUsers(q: string, page: number) {
  return useQuery({
    queryKey: queryKeys.adminUsers(q, page),
    queryFn: () => api.adminUsers(q, page),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useAdminUser(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.adminUser(userId ?? ""),
    queryFn: () => api.adminUser(userId!),
    enabled: Boolean(userId),
  });
}

export const useAdminAudit = () => useQuery({ queryKey: queryKeys.adminAudit, queryFn: api.adminAudit });
export const useAdminTeam = () => useQuery({ queryKey: queryKeys.adminTeam, queryFn: api.adminTeam });

/** Give / remove access, extend trial, block, unblock. Refreshes the list, the user and the log. */
export function useAdminAccess(userId: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: AdminAccessInput) => api.adminAccess(userId, input),
    onSuccess: (detail) => {
      qc.setQueryData(queryKeys.adminUser(userId), detail);
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      void qc.invalidateQueries({ queryKey: queryKeys.adminAudit });
      // An admin changing their own access should see it right away.
      void qc.invalidateQueries({ queryKey: queryKeys.billing });
      toast.show({ message: "Saved." });
    },
    onError: (err) => toast.show({ message: (err as Error).message, tone: "error" }),
  });
}

export function useAdminDelete(onDone: () => void) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ userId, confirmEmail }: { userId: string; confirmEmail: string }) => api.adminDeleteUser(userId, confirmEmail),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      void qc.invalidateQueries({ queryKey: queryKeys.adminAudit });
      toast.show({ message: "Account deleted." });
      onDone();
    },
    onError: (err) => toast.show({ message: (err as Error).message, tone: "error" }),
  });
}
