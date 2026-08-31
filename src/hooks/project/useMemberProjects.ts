import { useMutation } from "@tanstack/react-query";

import { submitProject } from "../../apis/project/memberProjectsApi";

/** 재조회할 목록이 없다 — BE에 "내가 낸 프로젝트 조회" 엔드포인트가 아직 없다(`types/project` 참고). */
export function useSubmitProject() {
  return useMutation({ mutationFn: submitProject });
}
