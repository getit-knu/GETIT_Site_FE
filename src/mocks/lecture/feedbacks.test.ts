import { describe, expect, it } from "vitest";

import { fetchSubmissionDetail } from "./feedbacks";

/**
 * 목이지만 명세서 8.7 의 규칙을 담고 있다. BE 가 붙으면 이 파일과 함께 지운다.
 */
describe("fetchSubmissionDetail", () => {
  it("시각에 오프셋이 붙어 있다", async () => {
    /*
      오프셋을 빼면 브라우저가 실행 환경의 시간대로 읽는다. 한국 밖에서 열면
      제출 시각이 몇 시간씩 밀려 보이고, 지각 여부까지 다르게 읽힌다.
    */
    const detail = await fetchSubmissionDetail(3005);

    expect(detail.submittedAt).toMatch(/[+-]\d{2}:\d{2}$|Z$/);
    for (const feedback of detail.feedbacks) {
      expect(feedback.createdAt).toMatch(/[+-]\d{2}:\d{2}$|Z$/);
    }
  });

  it("읽으면 기대한 순간이 된다", async () => {
    /*
      ⚠️ 이 단언은 **한국 시간대 기기에서는 오프셋이 없어도 통과한다.** 오프셋이 빠진 것을
      잡아 주는 것은 위의 형식 검사이고, 이 검사는 CI 처럼 UTC 로 도는 환경에서만
      함께 걸린다. 값 자체가 맞는지 보는 용도로 남긴다.
    */
    const detail = await fetchSubmissionDetail(3005);

    // 2026-06-04 20:11 KST = 11:11 UTC
    expect(new Date(detail.submittedAt).toISOString()).toBe("2026-06-04T11:11:00.000Z");
  });

  it("순차 탐색은 같은 강의 안에서만 움직인다", async () => {
    const first = await fetchSubmissionDetail(3005);

    expect(first.navigation).toMatchObject({ current: 1, total: 3, prevSubmissionId: null });
    expect(first.navigation.nextSubmissionId).toBe(3006);
  });

  it("끝 제출물은 다음이 없다", async () => {
    const last = await fetchSubmissionDetail(3007);

    expect(last.navigation.nextSubmissionId).toBeNull();
    expect(last.navigation.current).toBe(3);
  });

  it("없는 제출물은 SUBMISSION_NOT_FOUND 로 거절한다", async () => {
    await expect(fetchSubmissionDetail(9999)).rejects.toMatchObject({ code: "SUBMISSION_NOT_FOUND" });
  });
});
