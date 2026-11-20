import { describe, expect, it } from "vitest";

import { festaDeadline, formatRemaining } from "./festaDeadline";

const ENDS_AT = Date.parse("2026-11-30T00:00:00+09:00");
const at = (iso: string) => Date.parse(iso);

describe("festaDeadline (#377)", () => {
  it("마지막 날 전에는 한국 날짜로 마지막 날까지 남은 날을 센다", () => {
    expect(festaDeadline(at("2026-11-21T09:00:00+09:00"), ENDS_AT)).toEqual({ kind: "days", days: 8 });
    expect(festaDeadline(at("2026-11-26T23:59:59+09:00"), ENDS_AT)).toEqual({ kind: "days", days: 3 });
    expect(festaDeadline(at("2026-11-28T00:00:00+09:00"), ENDS_AT)).toEqual({ kind: "days", days: 1 });
  });

  it("기기 시간대와 상관없이 한국 날짜로 센다 — UTC로는 아직 11/28이어도 한국은 마지막 날이다", () => {
    expect(festaDeadline(at("2026-11-28T15:00:00Z"), ENDS_AT)).toEqual({
      kind: "lastDay",
      remainingMs: 24 * 3_600_000,
    });
  });

  it("마지막 날에는 마감까지 남은 시간을 준다", () => {
    expect(festaDeadline(at("2026-11-29T18:47:27+09:00"), ENDS_AT)).toEqual({
      kind: "lastDay",
      remainingMs: (5 * 3_600 + 12 * 60 + 33) * 1_000,
    });
  });

  it("마감 시각부터는 마감으로 본다", () => {
    expect(festaDeadline(ENDS_AT, ENDS_AT)).toEqual({ kind: "closed" });
    expect(festaDeadline(at("2026-12-01T12:00:00+09:00"), ENDS_AT)).toEqual({ kind: "closed" });
  });
});

describe("formatRemaining", () => {
  it("시:분:초를 두 자리씩 채운다", () => {
    expect(formatRemaining((5 * 3_600 + 12 * 60 + 33) * 1_000)).toBe("05:12:33");
    expect(formatRemaining(24 * 3_600_000)).toBe("24:00:00");
  });

  it("남은 초는 올림한다", () => {
    expect(formatRemaining(400)).toBe("00:00:01");
    expect(formatRemaining(59_001)).toBe("00:01:00");
  });
});
