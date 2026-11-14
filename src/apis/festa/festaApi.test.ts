import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { client } from "../client";

import { getPortfolio, savePortfolio } from "./festaApi";

// 모양은 BE `FestaPortfolioResult` 기준. 스파이 대신 어댑터를 갈아 끼워 실제 envelope 인터셉터를 태운다.
const portfolio = {
  budget: 10_000_000,
  unit: 100_000,
  remaining: 7_000_000,
  maskedPhoneNumber: "010-****-5678",
  investments: [{ projectId: 3, amount: 3_000_000 }],
};

async function withAdapter<T>(run: () => Promise<T>): Promise<{ result: T; config: InternalAxiosRequestConfig }> {
  let seen: InternalAxiosRequestConfig | undefined;
  const adapter: AxiosAdapter = (config) => {
    seen = config;
    return Promise.resolve({
      data: { success: true, data: portfolio, error: null },
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

describe("festaApi (#364 wire-shape)", () => {
  it("getPortfolio 는 envelope 안의 현황을 돌려준다", async () => {
    const { result, config } = await withAdapter(getPortfolio);

    expect(config.method).toBe("get");
    expect(config.url).toBe("/api/festa/portfolio");
    expect(result).toEqual(portfolio);
  });

  it("savePortfolio 는 PUT 으로 번호·동의·투자를 함께 보낸다", async () => {
    const payload = {
      phoneNumber: "010-1234-5678",
      privacyConsent: true,
      investments: [{ projectId: 3, amount: 3_000_000 }],
    };
    const { result, config } = await withAdapter(() => savePortfolio(payload));

    expect(config.method).toBe("put");
    expect(config.url).toBe("/api/festa/portfolio");
    expect(JSON.parse(config.data as string)).toEqual(payload);
    expect(result.remaining).toBe(7_000_000);
  });
});
