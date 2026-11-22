import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { client } from "../client";

import {
  destroyFestaPhoneNumbers,
  drawFestaWinners,
  getFestaResults,
  getFestaSchedule,
  getFestaVoteResults,
  getFestaWinners,
  resetFestaInvestments,
  updateFestaSchedule,
} from "./festaAdminApi";

// 모양은 BE `FestaResultsResult`·`FestaPhoneDestroyResult`·`FestaResetResult` 기준.
// 스파이 대신 어댑터를 갈아 끼워 실제 envelope 인터셉터를 태운다.
async function withAdapter<T>(
  data: unknown,
  run: () => Promise<T>,
): Promise<{ result: T; config: InternalAxiosRequestConfig }> {
  let seen: InternalAxiosRequestConfig | undefined;
  const adapter: AxiosAdapter = (config) => {
    seen = config;
    return Promise.resolve({
      data: { success: true, data, error: null },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  };
  const original = client.defaults.adapter;
  client.defaults.adapter = adapter;
  try {
    const result = await run();
    if (seen === undefined) throw new Error("요청이 나가지 않았다");
    return { result, config: seen };
  } finally {
    client.defaults.adapter = original;
  }
}

describe("festaAdminApi (#365 wire-shape)", () => {
  it("getFestaResults 는 envelope 안의 집계를 돌려준다", async () => {
    const results = {
      investorCount: 12,
      projects: [{ projectId: 3, title: "GETIT", teamName: "1조", totalAmount: 30_000_000, investorCount: 5 }],
    };
    const { result, config } = await withAdapter(results, getFestaResults);

    expect(config.method).toBe("get");
    expect(config.url).toBe("/api/admin/festa/results");
    expect(result).toEqual(results);
  });

  it("destroyFestaPhoneNumbers 는 DELETE 로 번호를 파기한다", async () => {
    const { result, config } = await withAdapter({ destroyedCount: 7 }, destroyFestaPhoneNumbers);

    expect(config.method).toBe("delete");
    expect(config.url).toBe("/api/admin/festa/investors/phones");
    expect(result.destroyedCount).toBe(7);
  });

  it("resetFestaInvestments 는 DELETE 로 투자 데이터를 지운다", async () => {
    const { result, config } = await withAdapter({ deletedInvestorCount: 3 }, resetFestaInvestments);

    expect(config.method).toBe("delete");
    expect(config.url).toBe("/api/admin/festa/investments");
    expect(result.deletedInvestorCount).toBe(3);
  });

  it("getFestaVoteResults 는 envelope 안의 득표 집계를 돌려준다(#373)", async () => {
    const results = {
      voterCount: 9,
      projects: [{ projectId: 3, title: "GETIT", teamName: "1조", voteCount: 5 }],
    };
    const { result, config } = await withAdapter(results, getFestaVoteResults);

    expect(config.method).toBe("get");
    expect(config.url).toBe("/api/admin/festa/vote-results");
    expect(result).toEqual(results);
  });

  it("getFestaSchedule 은 정하지 않은 기간을 null 그대로 돌려준다(#379)", async () => {
    const { result, config } = await withAdapter({ startAt: null, endAt: null }, getFestaSchedule);

    expect(config.method).toBe("get");
    expect(config.url).toBe("/api/admin/festa/schedule");
    expect(result).toEqual({ startAt: null, endAt: null });
  });

  it("updateFestaSchedule 은 기간을 PUT 본문으로 보내고 저장된 기간을 돌려준다(#379)", async () => {
    const schedule = { startAt: "2026-11-23T10:00:00+09:00", endAt: "2026-11-30T00:00:00+09:00" };
    const { result, config } = await withAdapter(schedule, () =>
      updateFestaSchedule({ startAt: "2026-11-23T01:00:00.000Z", endAt: "2026-11-29T15:00:00.000Z" }),
    );

    expect(config.method).toBe("put");
    expect(config.url).toBe("/api/admin/festa/schedule");
    expect(JSON.parse(config.data as string)).toEqual({
      startAt: "2026-11-23T01:00:00.000Z",
      endAt: "2026-11-29T15:00:00.000Z",
    });
    expect(result).toEqual(schedule);
  });

  // 모양은 BE `FestaWinnersResult` 기준(#412, BE#241).
  const WINNERS = {
    winners: [
      { drawOrder: 1, userId: 7, name: "김참여", phoneNumber: "010-1234-5678", drawnAt: "2026-11-30T10:00:00+09:00" },
    ],
  };

  it("drawFestaWinners 는 인원·추가 여부를 POST 본문으로 보내고 당첨자를 돌려준다(#412)", async () => {
    const { result, config } = await withAdapter(WINNERS, () => drawFestaWinners({ count: 1, additional: true }));

    expect(config.method).toBe("post");
    expect(config.url).toBe("/api/admin/festa/draw");
    expect(JSON.parse(config.data as string)).toEqual({ count: 1, additional: true });
    expect(result).toEqual(WINNERS);
  });

  it("getFestaWinners 는 envelope 안의 당첨자를 돌려준다(#412)", async () => {
    const { result, config } = await withAdapter(WINNERS, getFestaWinners);

    expect(config.method).toBe("get");
    expect(config.url).toBe("/api/admin/festa/winners");
    expect(result).toEqual(WINNERS);
  });
});
