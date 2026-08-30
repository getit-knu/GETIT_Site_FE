import { describe, expect, it } from "vitest";

import { toIso, toLocalInput } from "./datetimeLocalInput";

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
    const iso = "2026-09-01T00:00:00+09:00";
    const back = toIso(toLocalInput(iso));
    expect(new Date(back).getTime()).toBe(new Date(iso).getTime());
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
