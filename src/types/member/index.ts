import type { components } from "../../apis/generated";

/**
 * 내 정보·학습 통계. `GET /api/member/me/summary`(명세서 4.5).
 *
 * `apis/generated.ts`에서 재노출한다. 프로필(이름·이메일 등)은 `useSession()`의
 * `Me`와 겹치지만, 이 응답은 학습 통계까지 한 번에 주는 별도 엔드포인트다.
 */
export type MySummaryProfile = Required<components["schemas"]["MeSummaryResultProfile"]>;
export type MySummaryStats = Required<components["schemas"]["MeSummaryResultStats"]>;

/** 미제출·지각 제출 강의 한 건. */
export type LectureBrief = Required<components["schemas"]["MeSummaryResultLectureBrief"]>;

/** `Required<>`가 배열 원소 내부까지 못 채워서(컨벤션 함정 1) 손으로 합성한다. */
export interface MySummary {
  profile: MySummaryProfile;
  stats: MySummaryStats;
  notSubmittedLectures: LectureBrief[];
  lateSubmittedLectures: LectureBrief[];
}
