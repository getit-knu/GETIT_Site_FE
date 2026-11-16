import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { client } from "../client";

import { destroyFestaPhoneNumbers, getFestaResults, getFestaVoteResults, resetFestaInvestments } from "./festaAdminApi";

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
});
