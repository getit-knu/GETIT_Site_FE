import { describe, expect, it } from "vitest";

import { createMockApi } from "./mockApi";

const params = new URLSearchParams();

describe("createMockApi", () => {
  it("공개 홈을 envelope으로 감싸 준다", () => {
    const api = createMockApi();
    const res = api.resolve("GET", "/api/public/home", params);

    expect(res?.status).toBe(200);
    expect(res?.body).toMatchObject({ success: true, error: null });
  });

  it("모르는 경로는 null — 미들웨어가 404로 처리한다", () => {
    const api = createMockApi();
    expect(api.resolve("GET", "/api/unknown", params)).toBeNull();
  });

  it("임시 저장하면 내 지원서 조회에 반영된다", () => {
    const api = createMockApi();
    const before = api.resolve("GET", "/api/applications/me", params);
    expect((before?.body as { data: unknown }).data).toBeNull();

    api.resolve("PUT", "/api/applications/me/draft", params, {
      basicInfo: {
        name: "홍길동",
        email: "a@b.c",
        phoneNumber: "010-1234-5678",
        collegeId: 1,
        majorId: 11,
        grade: 2,
        studentNumber: null,
      },
      answers: [{ questionId: 101, answerText: "동기", selectedOptions: null }],
    });

    const after = api.resolve("GET", "/api/applications/me", params);
    expect((after?.body as { data: { basicInfo: { name: string } } }).data.basicInfo.name).toBe("홍길동");
  });

  it("제출하면 상태가 SUBMITTED가 된다", () => {
    const api = createMockApi();
    api.resolve("POST", "/api/applications/me/submit", params, {
      basicInfo: {
        name: "홍길동",
        email: "a@b.c",
        phoneNumber: "010-1234-5678",
        collegeId: 1,
        majorId: 11,
        grade: 2,
        studentNumber: null,
      },
      answers: [],
    });
    const mine = api.resolve("GET", "/api/applications/me", params);
    expect((mine?.body as { data: { status: string } }).data.status).toBe("SUBMITTED");
  });

  // 미들웨어는 본문이 없거나 JSON 파싱에 실패하면 undefined를 넘긴다. 예전엔 그대로
  // 단언해 넘기는 바람에 예외가 나서 응답 자체가 안 나갔다 — 이제 400 envelope으로 끊는다.
  it.each([
    ["본문 없음", undefined],
    ["빈 객체", {}],
    ["basicInfo 누락", { answers: [] }],
    ["answers 누락", { basicInfo: {} }],
    ["answers가 배열이 아님", { basicInfo: {}, answers: "nope" }],
  ])("임시 저장 본문이 올바르지 않으면 400을 준다 — %s", (_label, body) => {
    const api = createMockApi();
    const res = api.resolve("PUT", "/api/applications/me/draft", params, body);

    expect(res?.status).toBe(400);
    expect(res?.body).toMatchObject({ success: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("제출 본문이 올바르지 않아도 400을 주고 저장 상태를 건드리지 않는다", () => {
    const api = createMockApi();
    const res = api.resolve("POST", "/api/applications/me/submit", params, undefined);

    expect(res?.status).toBe(400);
    expect((api.resolve("GET", "/api/applications/me", params)?.body as { data: unknown }).data).toBeNull();
  });
});
