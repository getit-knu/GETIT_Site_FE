/**
 * 내 정보(마이페이지)의 학습 통계 · 과제 제출 내역.
 *
 * 프로필(이름·이메일·학과·학번)은 실제 `GET /api/auth/me`(`useSession`)를 그대로 쓰지만,
 * 이 수치들은 BE `lecture` 도메인이 관리자 전용(`/api/admin/lectures`)만 있어 아직
 * 부원 본인 기준 집계를 낼 방법이 없다 — mock으로 둔다.
 */
export interface SubmissionHistoryEntry {
  status: "미제출" | "지각 제출";
  count: number;
  /** 해당하는 주차 라벨. 예: "Week 1, Week 5". */
  weeks: string;
}

export interface MyPageStats {
  lecturesTaken: number;
  assignmentsSubmitted: number;
  submissionHistory: SubmissionHistoryEntry[];
}

const STATS: MyPageStats = {
  lecturesTaken: 8,
  assignmentsSubmitted: 10,
  submissionHistory: [
    { status: "미제출", count: 1, weeks: "Week 3 - 금융 이론" },
    { status: "지각 제출", count: 2, weeks: "Week 1, Week 5" },
  ],
};

export function getMyPageStats(): MyPageStats {
  return structuredClone(STATS);
}
