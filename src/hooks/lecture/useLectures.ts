import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteLecture, getLectures } from "../../apis/lecture/lecturesApi";
import { queryKeys } from "../../apis/queryKeys";
import type { LectureListParams } from "../../types/lecture";

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
