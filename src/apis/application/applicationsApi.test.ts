import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import { getApplicants } from "./applicationsApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getApplicants", () => {
  /**
   * 실제 BE 응답(`ApplicantListResult`) 그대로다 — `applicants` 아래 페이지가 감싸여 온다.
   * 이 테스트가 없으면 화면 쪽 목이 이미 "펴진" 형태로 짜여 있어 잘못된 가정이 그대로
   * 통과한다(실제로 그래서 프로덕션까지 나갔다) — 반드시 이 감싸인 모양으로 목을 만든다.
   */
  it("applicants 아래 감싸여 온 페이지를 최상위로 풀어서 준다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({
      data: {
        applicants: {
          content: [
            {
              id: 1,
              name: "김지원",
              studentNumber: "202012345",
              college: "경영대학",
              grade: 2,
              status: "SUBMITTED",
              submittedAt: "2026-09-08T12:00:00+09:00",
              totalScore: null,
              evaluatorCount: 0,
            },
          ],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
        summary: { averageTotalScore: null, evaluatedCount: 0 },
      },
    });

    const result = await getApplicants({ page: 0, size: 10 });

    expect(get).toHaveBeenCalledWith("/api/admin/recruitment/applications", { params: { page: 0, size: 10 } });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].name).toBe("김지원");
    expect(result.totalElements).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.summary).toEqual({ averageTotalScore: null, evaluatedCount: 0 });
  });

  it("summary 필드 자체가 없으면 undefined 그대로 둔다", async () => {
    // BE가 응답에 summary를 아예 안 실은 경우(필드가 없음)와 `summary: null`(값이 빔)은
    // 화면(`summaryText`)에서 다른 뜻이다 — 여기서 하나로 뭉개면 안 된다.
    vi.spyOn(client, "get").mockResolvedValue({
      data: {
        applicants: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true },
      },
    });

    const result = await getApplicants({});

    expect(result.summary).toBeUndefined();
  });
});
