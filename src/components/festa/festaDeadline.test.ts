import { describe, expect, it } from "vitest";

import { festaDeadline, festaPhase, formatRemaining, phaseLockReason, toWindow } from "./festaDeadline";

const at = (iso: string) => Date.parse(iso);
/** 11/23 10:00 시작, 11/29 하루 끝(11/30 0시) 마감. */
const PERIOD = toWindow({ startAt: "2026-11-23T10:00:00+09:00", endAt: "2026-11-30T00:00:00+09:00" });

describe("festaPhase (#379)", () => {
  it("기간을 정하지 않았으면 unscheduled, 정했으면 시작 전·진행 중·마감으로 나눈다", () => {
    expect(festaPhase(at("2026-11-21T09:00:00+09:00"), null)).toBe("unscheduled");
    expect(festaPhase(at("2026-11-23T09:59:59+09:00"), PERIOD)).toBe("before");
    expect(festaPhase(PERIOD.start, PERIOD)).toBe("open");
    expect(festaPhase(PERIOD.end - 1, PERIOD)).toBe("open");
    expect(festaPhase(PERIOD.end, PERIOD)).toBe("closed");
  });

  it("기간 밖이면 막는 이유를 한국 시각으로 알려준다", () => {
    expect(phaseLockReason("before", PERIOD, "투표")).toBe("투표는 11월 23일 10:00에 시작해요.");
    expect(phaseLockReason("closed", PERIOD, "투표")).toBe("투표가 마감됐어요.");
    expect(phaseLockReason("open", PERIOD, "투표")).toBeNull();
    expect(phaseLockReason("unscheduled", null, "투표")).toBeNull();
  });
});

describe("festaDeadline (#377, #379)", () => {
  it("시작 전에는 한국 날짜로 시작일까지 남은 날을 센다", () => {
    expect(festaDeadline(at("2026-11-21T09:00:00+09:00"), PERIOD)).toEqual({ kind: "days", target: "start", days: 2 });
  });

  it("시작 당일에는 시작까지 남은 시간을 준다", () => {
    expect(festaDeadline(at("2026-11-23T08:30:00+09:00"), PERIOD)).toEqual({
      kind: "today",
      target: "start",
      remainingMs: 90 * 60_000,
    });
  });

  it("진행 중에는 마지막 날까지 남은 날을 센다", () => {
    expect(festaDeadline(at("2026-11-23T10:00:00+09:00"), PERIOD)).toEqual({ kind: "days", target: "end", days: 6 });
    expect(festaDeadline(at("2026-11-28T00:00:00+09:00"), PERIOD)).toEqual({ kind: "days", target: "end", days: 1 });
  });

  it("기기 시간대와 상관없이 한국 날짜로 센다 — UTC로는 아직 11/28이어도 한국은 마지막 날이다", () => {
    expect(festaDeadline(at("2026-11-28T15:00:00Z"), PERIOD)).toEqual({
      kind: "today",
      target: "end",
      remainingMs: 24 * 3_600_000,
    });
  });

  it("18:00 마감이면 그날이 마지막 날이다", () => {
    const evening = toWindow({ startAt: "2026-11-23T10:00:00+09:00", endAt: "2026-11-29T18:00:00+09:00" });
    expect(festaDeadline(at("2026-11-28T20:00:00+09:00"), evening)).toEqual({ kind: "days", target: "end", days: 1 });
    expect(festaDeadline(at("2026-11-29T12:47:27+09:00"), evening)).toEqual({
      kind: "today",
      target: "end",
      remainingMs: (5 * 3_600 + 12 * 60 + 33) * 1_000,
    });
  });

  it("마감 시각부터는 마감으로 본다", () => {
    expect(festaDeadline(PERIOD.end, PERIOD)).toEqual({ kind: "closed" });
    expect(festaDeadline(at("2026-12-01T12:00:00+09:00"), PERIOD)).toEqual({ kind: "closed" });
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
