"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Goal } from "@/types";

export function useGoalsQuery() {
  return useQuery({ queryKey: queryKeys.goals, queryFn: api.getGoals });
}

export function useSaveGoals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goals: Goal[]) => api.saveGoals(goals),
    onSuccess: (goals) => qc.setQueryData(queryKeys.goals, goals),
  });
}
