import { describe, expect, it } from "vitest";

import { createFeedback, fetchSubmissionDetail, updateFeedback } from "./feedbacks";

/**
 * 목이지만 명세서 8.7 ~ 8.10 의 규칙을 담고 있다. BE 가 붙으면 이 파일과 함께 지운다.
 *
 * 상태를 공유하는 목이라 테스트끼리 순서에 기대지 않도록 각자 다른 제출물을 쓴다.
 */
describe("feedbacks 목", () => {
  it("제출물마다 순차 탐색 위치를 계산한다", async () => {
    const first = await fetchSubmissionDetail(3005);
    const last = await fetchSubmissionDetail(3007);

    expect(first.navigation).toMatchObject({ current: 1, total: 3, prevSubmissionId: null, nextSubmissionId: 3006 });
    expect(last.navigation).toMatchObject({ current: 3, total: 3, prevSubmissionId: 3006, nextSubmissionId: null });
  });

  it("피드백은 그 제출물 것만 딸려 온다", async () => {
    // submission 1 : N feedback. 남의 피드백이 섞이면 안 된다.
    const withFeedback = await fetchSubmissionDetail(3005);
    const without = await fetchSubmissionDetail(3006);

    expect(withFeedback.feedbacks.map((f) => f.id)).toContain(9001);
    expect(without.feedbacks).toHaveLength(0);
  });

  it("zip 은 미리보기를 못 하고 pdf · 이미지는 된다", async () => {
    // 판정은 서버 몫이다(명세서 8.7). previewable 이 false 면 previewUrl 도 null 이다.
    const zip = await fetchSubmissionDetail(3005);
    const pdf = await fetchSubmissionDetail(3006);

    expect(zip.file).toMatchObject({ previewable: false, previewUrl: null });
    expect(pdf.file.previewable).toBe(true);
    expect(pdf.file.previewUrl).not.toBeNull();
  });

  it("마감을 넘긴 제출은 LATE 다", async () => {
    expect((await fetchSubmissionDetail(3007)).status).toBe("LATE");
    expect((await fetchSubmissionDetail(3005)).status).toBe("SUBMITTED");
  });

  it("작성한 피드백이 그 제출물에 붙는다", async () => {
    const created = await createFeedback(3006, "잘 했습니다.");
    const after = await fetchSubmissionDetail(3006);

    expect(created.content).toBe("잘 했습니다.");
    expect(created.updatedAt).toBeNull();
    expect(after.feedbacks.map((f) => f.id)).toContain(created.id);
    // 남의 제출물에는 붙지 않는다.
    expect((await fetchSubmissionDetail(3005)).feedbacks.map((f) => f.id)).not.toContain(created.id);
  });

  it("수정하면 내용과 updatedAt 이 바뀐다", async () => {
    const created = await createFeedback(3007, "처음 내용");
    const updated = await updateFeedback(created.id, "고친 내용");

    expect(updated.content).toBe("고친 내용");
    expect(updated.updatedAt).not.toBeNull();
    expect((await fetchSubmissionDetail(3007)).feedbacks.find((f) => f.id === created.id)?.content).toBe("고친 내용");
  });

  it("없는 제출물 · 피드백은 거절한다", async () => {
    await expect(fetchSubmissionDetail(9999)).rejects.toMatchObject({ code: "SUBMISSION_NOT_FOUND" });
    await expect(createFeedback(9999, "…")).rejects.toMatchObject({ code: "SUBMISSION_NOT_FOUND" });
    await expect(updateFeedback(9999, "…")).rejects.toMatchObject({ code: "FEEDBACK_NOT_FOUND" });
  });
});
