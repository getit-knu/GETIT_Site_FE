import type { RecruitmentSchedule } from "../../types/recruitment";

/**
 * 공개 홈 화면(D-Day 배지)용 동기 스냅샷.
 *
 * 관리자용 일정/문항/평가기준 조회·저장은 #190에서 실제 BE로 연동됐다(`recruitmentApi.ts`
 * 참고). 이 mock은 아직 공개 모집 상태 API로 옮기지 않은 `DdayBadge`(#187에서 처리)만
 * 쓴다 — 그 작업이 이 브랜치에 합쳐지면 이 파일도 통째로 지워도 된다.
 */
const schedule: RecruitmentSchedule = {
  generationId: 9,
  generationNo: 9,
  year: 2026,
  totalStartAt: "2026-09-01T00:00",
  totalEndAt: "2026-09-30T23:59",
  documentStartAt: "2026-09-01T00:00",
  documentEndAt: "2026-09-10T23:59",
  interviewStartAt: "2026-09-15T00:00",
  interviewEndAt: "2026-09-30T23:59",
};

export function getScheduleSnapshot(): RecruitmentSchedule {
  return { ...schedule };
}
