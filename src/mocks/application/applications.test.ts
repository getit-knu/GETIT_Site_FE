import { describe, expect, it } from "vitest";

import { fetchApplicants, fetchApplicationDetail } from "./applications";

/**
 * 목이지만 목록과 상세가 같은 평가 데이터를 봐야 한다는 규칙을 담고 있다.
 * 어긋나면 평가 완료 지원자를 열었을 때 빈 점수가 보이고, 그대로 저장하면 기존 평가가 지워진다.
 * BE 가 붙으면 이 파일과 함께 지운다.
 */
describe("fetchApplicationDetail", () => {
  it("목록에서 평가 완료인 지원자는 상세에서도 평가 완료다", async () => {
    const page = await fetchApplicants({ evaluated: true });
    const first = page.content[0];

    const detail = await fetchApplicationDetail(first.id, {});

    expect(detail.evaluation.evaluated).toBe(true);
    expect(detail.evaluation.totalScore).toBe(first.totalScore);
  });

  it("평가 완료 지원자는 기준별 점수가 채워져 있다", async () => {
    // 비어 있으면 그대로 저장했을 때 기존 평가를 0 점으로 덮어쓴다.
    const page = await fetchApplicants({ evaluated: true });
    const detail = await fetchApplicationDetail(page.content[0].id, {});

    expect(detail.evaluation.scores.every((s) => s.score !== null)).toBe(true);
  });

  it("기준별 점수의 합이 총점과 같다", async () => {
    const page = await fetchApplicants({ evaluated: true });

    for (const applicant of page.content) {
      const detail = await fetchApplicationDetail(applicant.id, {});
      const sum = detail.evaluation.scores.reduce((total, s) => total + (s.score ?? 0), 0);

      expect(sum).toBe(applicant.totalScore);
    }
  });

  it("어느 기준도 배점을 넘지 않는다", async () => {
    const page = await fetchApplicants({ evaluated: true });

    for (const applicant of page.content) {
      const detail = await fetchApplicationDetail(applicant.id, {});
      for (const score of detail.evaluation.scores) {
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(score.maxScore);
      }
    }
  });

  it("미평가 지원자는 상세에서도 미평가이고 점수가 비어 있다", async () => {
    const page = await fetchApplicants({ evaluated: false });
    const detail = await fetchApplicationDetail(page.content[0].id, {});

    expect(detail.evaluation.evaluated).toBe(false);
    expect(detail.evaluation.totalScore).toBeNull();
    expect(detail.evaluation.scores.every((s) => s.score === null)).toBe(true);
  });
});
