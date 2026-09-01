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
});
