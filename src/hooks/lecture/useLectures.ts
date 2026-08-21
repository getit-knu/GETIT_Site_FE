import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createLecture,
  deleteLecture,
  getLectureDetail,
  getLectures,
  updateLecture,
} from "../../apis/lecture/lecturesApi";
import { queryKeys } from "../../apis/queryKeys";
import type { LectureListParams, LecturePayload } from "../../types/lecture";

export function useLectureBoard(params: LectureListParams) {
  return useQuery({
    queryKey: queryKeys.lectures.board(params),
    queryFn: () => getLectures(params),
    // 탭을 옮길 때 화면이 비었다가 다시 차지 않도록 이전 결과를 유지한다.
    placeholderData: (previous) => previous,
  });
}

export function useDeleteLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteLecture(id),
    onSuccess: async () => {
      // 어느 탭에서 지웠든 다른 탭의 목록도 더는 맞지 않는다.
      await queryClient.invalidateQueries({ queryKey: queryKeys.lectures.all });
    },
  });
}

/** 수정 폼 프리필. 추가 모드면 조회하지 않는다. */
export function useLectureDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.lectures.detail(id ?? 0),
    queryFn: () => getLectureDetail(id!),
    enabled: id !== null,
  });
}

/** 추가와 수정이 같은 폼을 쓴다. 저장도 한 훅에서 갈라 호출부가 신경 쓰지 않게 한다. */
export function useSaveLecture(id: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LecturePayload) => (id === null ? createLecture(payload) : updateLecture(id, payload)),
    onSuccess: async () => {
      // 목록의 제목·주차·공개 여부가 바뀐다. 상세만 갱신하면 카드가 옛 값을 보여준다.
      await queryClient.invalidateQueries({ queryKey: queryKeys.lectures.all });
    },
  });
}
