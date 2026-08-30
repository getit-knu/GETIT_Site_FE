import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../../apis/site/siteApi";
import { queryKeys } from "../../apis/queryKeys";
import type { CurriculumPayload, FaqPayload, SiteEventPayload } from "../../types/site";

export function useCurriculums() {
  return useQuery({ queryKey: queryKeys.site.curriculums(), queryFn: api.getCurriculums });
}

/** `id` 유무로 생성·수정을 가른다 — 폼은 한 벌만 있으면 된다. */
export function useSaveCurriculum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: CurriculumPayload }) =>
      id === null ? api.createCurriculum(payload) : api.updateCurriculum(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.curriculums() });
    },
  });
}

export function useDeleteCurriculum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteCurriculum(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.curriculums() });
    },
  });
}

export function useEvents() {
  return useQuery({ queryKey: queryKeys.site.events(), queryFn: api.getEvents });
}

export function useSaveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: SiteEventPayload }) =>
      id === null ? api.createEvent(payload) : api.updateEvent(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.events() });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteEvent(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.events() });
    },
  });
}

export function useFaqs() {
  return useQuery({ queryKey: queryKeys.site.faqs(), queryFn: api.getFaqs });
}

export function useSaveFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: FaqPayload }) =>
      id === null ? api.createFaq(payload) : api.updateFaq(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.faqs() });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteFaq(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.faqs() });
    },
  });
}
