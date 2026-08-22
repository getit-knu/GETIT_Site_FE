import { describe, expect, it } from "vitest";

import type { SiteSchedule } from "../../../types/site";

import { invalidReason, toDraft, toIso, toLocalInput, toSchedule } from "./scheduleDraft";

const VALID: SiteSchedule = {
  totalStartAt: "2026-09-01T00:00:00+09:00",
  totalEndAt: "2026-09-30T23:59:00+09:00",
  documentStartAt: "2026-09-01T00:00:00+09:00",
  documentEndAt: "2026-09-10T23:59:00+09:00",
  interviewStartAt: "2026-09-15T00:00:00+09:00",
};

const draft = () => toDraft(VALID);

describe("toLocalInput · toIso", () => {
  it("서버가 준 오프셋을 한국 시간으로 옮긴다", () => {
    // 문자열을 그냥 자르면 오프셋이 다를 때 시각이 어긋난다.
    expect(toLocalInput("2026-09-01T00:00:00+09:00")).toBe("2026-09-01T00:00");
    expect(toLocalInput("2026-08-31T15:00:00Z")).toBe("2026-09-01T00:00");
  });

  it("입력값을 KST 로 읽어 ISO 로 되돌린다", () => {
    expect(toIso("2026-09-01T00:00")).toBe("2026-08-31T15:00:00.000Z");
  });

  it("왕복해도 같은 시각이다", () => {
    const back = toSchedule(draft());
    expect(new Date(back.totalStartAt).getTime()).toBe(new Date(VALID.totalStartAt).getTime());
    expect(new Date(back.interviewStartAt).getTime()).toBe(new Date(VALID.interviewStartAt).getTime());
  });

  it("빈 값과 깨진 값을 견딘다", () => {
    // V8 은 "아무거나:00Z" 를 2000-01-01 로 읽어 준다. Date 파싱만 믿으면
    // 깨진 값이 엉뚱한 날짜로 조용히 저장된다.
    expect(toIso("")).toBe("");
    expect(toIso("아무거나")).toBe("");
    expect(toIso("2026-09-01")).toBe("");
    expect(toIso("2026-13-45T99:99")).toBe("");
    expect(toLocalInput("아무거나")).toBe("");
  });
});

describe("invalidReason", () => {
  it("올바른 입력은 막지 않는다", () => {
    expect(invalidReason("9", "2026", draft())).toBeNull();
  });

  it("기수와 연도를 검사한다", () => {
    expect(invalidReason("0", "2026", draft())).toBe("기수는 1 이상의 정수여야 합니다.");
    expect(invalidReason("", "2026", draft())).toBe("기수는 1 이상의 정수여야 합니다.");
    expect(invalidReason("9.5", "2026", draft())).toBe("기수는 1 이상의 정수여야 합니다.");
    expect(invalidReason("9", "1999", draft())).toBe("연도를 올바르게 입력해 주세요.");
  });

  it("빈 일시를 어느 칸인지 짚어 알린다", () => {
    expect(invalidReason("9", "2026", { ...draft(), documentEndAt: "" })).toBe("서류 접수 마감 일시를 입력해 주세요.");
  });

  it("마감이 시작보다 빠르면 막는다", () => {
    expect(invalidReason("9", "2026", { ...draft(), totalEndAt: "2026-08-01T00:00" })).toBe(
      "전체 모집 마감이 시작보다 빠릅니다.",
    );
    expect(invalidReason("9", "2026", { ...draft(), documentEndAt: "2026-08-01T00:00" })).toBe(
      "서류 접수 마감이 시작보다 빠릅니다.",
    );
  });

  it("서류 · 면접이 전체 모집 기간을 벗어나면 막는다", () => {
    // 벗어나면 공개 사이트의 단계 표기가 어긋난다.
    expect(invalidReason("9", "2026", { ...draft(), documentStartAt: "2026-08-01T00:00" })).toBe(
      "서류 접수가 전체 모집 시작보다 빠릅니다.",
    );
    expect(invalidReason("9", "2026", { ...draft(), interviewStartAt: "2026-09-05T00:00" })).toBe(
      "면접이 서류 마감보다 빠릅니다.",
    );
    expect(invalidReason("9", "2026", { ...draft(), interviewStartAt: "2026-10-05T00:00" })).toBe(
      "면접이 전체 모집 마감보다 늦습니다.",
    );
  });

  it("시작과 마감이 같은 것도 막는다", () => {
    const d = draft();
    expect(invalidReason("9", "2026", { ...d, totalEndAt: d.totalStartAt })).toBe(
      "전체 모집 마감이 시작보다 빠릅니다.",
    );
  });
});
