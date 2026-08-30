import { describe, expect, it } from "vitest";

import type { SiteSchedule } from "../../../types/site";

import { invalidReason, toDraft, toSchedule } from "./scheduleDraft";

const VALID: SiteSchedule = {
  totalStartAt: "2026-09-01T00:00:00+09:00",
  totalEndAt: "2026-09-30T23:59:00+09:00",
  documentStartAt: "2026-09-01T00:00:00+09:00",
  documentEndAt: "2026-09-10T23:59:00+09:00",
  interviewStartAt: "2026-09-15T00:00:00+09:00",
};

const draft = () => toDraft(VALID);

describe("toDraft · toSchedule", () => {
  it("왕복해도 같은 시각이다", () => {
    const back = toSchedule(draft());
    expect(new Date(back.totalStartAt).getTime()).toBe(new Date(VALID.totalStartAt).getTime());
    expect(new Date(back.interviewStartAt).getTime()).toBe(new Date(VALID.interviewStartAt).getTime());
  });
});

describe("invalidReason", () => {
  it("올바른 입력은 막지 않는다", () => {
    expect(invalidReason(draft())).toBeNull();
  });

  it("빈 일시를 어느 칸인지 짚어 알린다", () => {
    expect(invalidReason({ ...draft(), documentEndAt: "" })).toBe("서류 접수 마감 일시를 입력해 주세요.");
  });

  it("마감이 시작보다 빠르면 막는다", () => {
    expect(invalidReason({ ...draft(), totalEndAt: "2026-08-01T00:00" })).toBe("전체 모집 마감이 시작보다 빠릅니다.");
    expect(invalidReason({ ...draft(), documentEndAt: "2026-08-01T00:00" })).toBe(
      "서류 접수 마감이 시작보다 빠릅니다.",
    );
  });

  it("서류 · 면접이 전체 모집 기간을 벗어나면 막는다", () => {
    // 벗어나면 공개 사이트의 단계 표기가 어긋난다.
    expect(invalidReason({ ...draft(), documentStartAt: "2026-08-01T00:00" })).toBe(
      "서류 접수가 전체 모집 시작보다 빠릅니다.",
    );
    expect(invalidReason({ ...draft(), interviewStartAt: "2026-09-05T00:00" })).toBe("면접이 서류 마감보다 빠릅니다.");
    expect(invalidReason({ ...draft(), interviewStartAt: "2026-10-05T00:00" })).toBe(
      "면접이 전체 모집 마감보다 늦습니다.",
    );
  });

  it("시작과 마감이 같은 것도 막는다", () => {
    const d = draft();
    expect(invalidReason({ ...d, totalEndAt: d.totalStartAt })).toBe("전체 모집 마감이 시작보다 빠릅니다.");
  });

  it("형태가 어긋난 일시는 어느 칸인지 짚어 막는다", () => {
    /*
      비어 있지 않다고 쓸 수 있는 값은 아니다. 막지 않으면 저장 버튼이 열린 채
      빈 일정이 서버로 나간다.
    */
    expect(invalidReason({ ...draft(), interviewStartAt: "2026-09-15" })).toBe(
      "면접 시작 일시 형식이 올바르지 않습니다.",
    );
    expect(invalidReason({ ...draft(), totalStartAt: "아무거나" })).toBe(
      "전체 모집 시작 일시 형식이 올바르지 않습니다.",
    );
  });

  it("서류가 전체 마감을 넘으면 서류 칸을 짚는다", () => {
    // 면접 검사에도 걸리지만 "면접이 늦습니다" 로는 고쳐야 할 칸을 알 수 없다.
    expect(invalidReason({ ...draft(), documentEndAt: "2026-10-15T23:59", interviewStartAt: "2026-10-20T00:00" })).toBe(
      "서류 접수 마감이 전체 모집 마감보다 늦습니다.",
    );

    expect(
      invalidReason({
        ...draft(),
        documentStartAt: "2026-10-01T00:00",
        documentEndAt: "2026-10-15T23:59",
        interviewStartAt: "2026-10-20T00:00",
      }),
    ).toBe("서류 접수 시작이 전체 모집 마감보다 늦습니다.");
  });
});
