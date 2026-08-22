import { describe, expect, it } from "vitest";

import { fetchSubmissions } from "./submissions";

/**
 * 목이지만 명세서 8.6 의 규칙을 담고 있다. 여기가 틀리면 브라우저로 본 화면이 거짓말을 한다.
 * BE 가 붙으면 이 파일과 함께 지운다.
 */
describe("fetchSubmissions", () => {
  it("미제출자도 행으로 돌려준다", async () => {
    // user LEFT JOIN submission. 대상은 기수의 활동 중인 부원 전체다.
    const board = await fetchSubmissions({ lectureId: 101 });

    expect(board.content).toHaveLength(6);
    expect(board.content.filter((row) => !row.submitted)).not.toHaveLength(0);
  });

  it("미제출 행은 제출물에 딸린 값을 전부 비운다", async () => {
    const board = await fetchSubmissions({ lectureId: 101 });
    const notSubmitted = board.content.find((row) => !row.submitted);

    expect(notSubmitted).toMatchObject({ submissionId: null, status: null, submittedAt: null, feedbackDone: false });
  });

  it("마감을 넘긴 제출은 LATE 로 표시한다", async () => {
    const board = await fetchSubmissions({ lectureId: 101 });

    expect(board.content.find((row) => row.userId === 25)?.status).toBe("LATE");
    expect(board.content.find((row) => row.userId === 24)?.status).toBe("SUBMITTED");
  });

  it("집계는 필터와 무관하게 전체 기준이다", async () => {
    // 필터를 걸었다고 모집단이 줄지 않는다. 줄면 '48명 중 12명' 같은 표기가 어긋난다.
    // 값을 그대로 못박는다 — 두 응답이 똑같이 틀려도 통과하는 비교로는 못 잡는다.
    const all = await fetchSubmissions({ lectureId: 101 });
    const filtered = await fetchSubmissions({ lectureId: 101, submitted: true });

    expect(all.counts).toEqual({ submitted: 3, notSubmitted: 3, total: 6 });
    expect(filtered.counts).toEqual(all.counts);
    expect(filtered.content).toHaveLength(3);
  });

  it("제출 · 피드백 · 조 필터를 각각 적용한다", async () => {
    const submitted = await fetchSubmissions({ lectureId: 101, submitted: false });
    expect(submitted.content.every((row) => !row.submitted)).toBe(true);

    const feedback = await fetchSubmissions({ lectureId: 101, feedbackDone: true });
    expect(feedback.content.every((row) => row.feedbackDone)).toBe(true);

    const group = await fetchSubmissions({ lectureId: 101, groupId: 2 });
    expect(group.content.map((row) => row.userId)).toEqual([23, 24]);
  });

  it("강의마다 제출 내역이 다르다", async () => {
    const first = await fetchSubmissions({ lectureId: 101 });
    const second = await fetchSubmissions({ lectureId: 102 });

    expect(first.content.filter((row) => row.submitted)).toHaveLength(3);
    expect(second.content.filter((row) => row.submitted)).toHaveLength(1);
  });

  it("없는 강의는 LECTURE_NOT_FOUND 로 거절한다", async () => {
    await expect(fetchSubmissions({ lectureId: 999 })).rejects.toMatchObject({ code: "LECTURE_NOT_FOUND" });
  });
});
