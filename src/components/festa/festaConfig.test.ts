import { describe, expect, it } from "vitest";

import { entryNumber, pickLatestSemester } from "./festaConfig";

describe("pickLatestSemester", () => {
  it("연도가 같으면 봄 < 여름 < 가을 < 겨울 순으로 가장 늦은 학기를 고른다", () => {
    expect(pickLatestSemester(["2026-SPRING", "2026-FALL", "2026-SUMMER"])).toBe("2026-FALL");
  });

  it("연도가 다르면 연도가 우선한다 — 전년도 겨울보다 올해 봄이 최근이다", () => {
    expect(pickLatestSemester(["2025-WINTER", "2026-SPRING"])).toBe("2026-SPRING");
  });

  it("서버가 준 순서와 상관없이 고른다", () => {
    expect(pickLatestSemester(["2026-FALL", "2024-WINTER", "2026-SUMMER"])).toBe("2026-FALL");
  });

  it("형식이 어긋난 값은 건너뛰고, 고를 게 없으면 null이다", () => {
    expect(pickLatestSemester(["2026 Fall", "2025-SPRING"])).toBe("2025-SPRING");
    expect(pickLatestSemester([])).toBeNull();
    expect(pickLatestSemester(["unknown"])).toBeNull();
  });
});

describe("entryNumber", () => {
  it("0부터 센 순서를 두 자리 출전 번호로 만든다", () => {
    expect(entryNumber(0)).toBe("01");
    expect(entryNumber(9)).toBe("10");
  });
});
