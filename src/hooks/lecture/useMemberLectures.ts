import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../../apis/lecture/memberLecturesApi";
import { queryKeys } from "../../apis/queryKeys";
import type { MemberLectureListParams, SubmissionPayload } from "../../types/lecture";

export function useMemberTracks() {
  return useQuery({ queryKey: queryKeys.memberLectures.tracks(), queryFn: api.getMemberTracks });
}

export function useMemberLectures(params: MemberLectureListParams) {
  return useQuery({
    queryKey: queryKeys.memberLectures.board(params),
    queryFn: () => api.getMemberLectures(params),
  });
}

export function useMemberLectureDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.memberLectures.detail(id),
    queryFn: () => api.getMemberLectureDetail(id),
  });
}

/** 과제 제출. 성공하면 상세(내 제출물)를 다시 조회해 화면을 갱신한다. */
export function useSubmitAssignment(lectureId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: number; payload: SubmissionPayload }) =>
      api.submitAssignment(assignmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.memberLectures.detail(lectureId) });
    },
  });
}

/** 재제출(덮어쓰기). */
export function useResubmitAssignment(lectureId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, payload }: { submissionId: number; payload: SubmissionPayload }) =>
      api.resubmitAssignment(submissionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.memberLectures.detail(lectureId) });
    },
  });
}

/** 4.6. 본인이 그 강의에 남긴 질문만 온다. */
export function useMyLectureQuestions(lectureId: number) {
  return useQuery({
    queryKey: queryKeys.memberLectures.questions(lectureId),
    queryFn: () => api.getMyLectureQuestions(lectureId),
  });
}

/** 4.7. 등록 후 목록을 다시 조회해 화면을 갱신한다. */
export function useCreateLectureQuestion(lectureId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => api.createLectureQuestion(lectureId, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.memberLectures.questions(lectureId) });
    },
  });
}
