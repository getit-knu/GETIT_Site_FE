import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { client, type ApiErrorPayload } from "./client";

/**
 * 인터셉터를 직접 꺼내 돌린다. axios 내부 핸들러 배열을 읽는 방식이라
 * 서버를 띄우지 않고도 응답 변환만 떼어 검증할 수 있다.
 */
function runResponseInterceptor(data: unknown): Promise<AxiosResponse> {
  const handlers = client.interceptors.response as unknown as {
    handlers: { fulfilled: (r: AxiosResponse) => Promise<AxiosResponse> }[];
  };

  const response = { data, status: 200, statusText: "OK", headers: {}, config: {} } as AxiosResponse;
  return Promise.resolve(handlers.handlers[0].fulfilled(response));
}

describe("응답 인터셉터", () => {
  it("envelope 을 벗겨 data 만 내려준다", async () => {
    const response = await runResponseInterceptor({
      success: true,
      data: { id: 1, name: "김부원" },
      error: null,
    });

    expect(response.data).toEqual({ id: 1, name: "김부원" });
  });

  it("data 가 null 인 envelope 은 그대로 null 이다", async () => {
    const response = await runResponseInterceptor({ success: true, data: null, error: null });

    expect(response.data).toBeNull();
  });

  it("envelope 이 아닌 200 응답은 조용히 통과시키지 않는다", async () => {
    // 개발 서버 SPA 폴백이 index.html 을 200 으로 주는 상황.
    // 예전에는 undefined 가 흘러가 엉뚱한 곳에서 터졌다.
    await expect(runResponseInterceptor("<!doctype html><html></html>")).rejects.toMatchObject({
      code: "MALFORMED_RESPONSE",
    } satisfies Partial<ApiErrorPayload>);
  });

  it("빈 응답 본문도 거른다", async () => {
    await expect(runResponseInterceptor(undefined)).rejects.toMatchObject({
      code: "MALFORMED_RESPONSE",
    });
  });
});
