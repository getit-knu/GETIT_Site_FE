import type { AxiosError, AxiosResponse } from "axios";
import { beforeEach, describe, expect, it } from "vitest";

import { getAccessToken, setAccessToken } from "../libs/accessToken";

import { client, type ApiErrorPayload } from "./client";

/**
 * 인터셉터를 직접 꺼내 돌린다. axios 내부 핸들러 배열을 읽는 방식이라
 * 서버를 띄우지 않고도 응답 변환만 떼어 검증할 수 있다.
 */
interface Handler {
  fulfilled: (r: AxiosResponse) => Promise<AxiosResponse>;
  rejected: (e: AxiosError) => Promise<never>;
}

function responseHandler(): Handler {
  return (client.interceptors.response as unknown as { handlers: Handler[] }).handlers[0];
}

function runResponseInterceptor(data: unknown, responseType?: string): Promise<AxiosResponse> {
  const response = {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { responseType },
  } as AxiosResponse;
  return Promise.resolve(responseHandler().fulfilled(response));
}

/** 실패 응답을 인터셉터에 흘려보낸다. `error` 는 BE envelope 의 error 필드. */
function runErrorInterceptor(status: number, error: ApiErrorPayload | null): Promise<never> {
  const axiosError = {
    message: "Request failed",
    response: { status, data: { success: false, data: null, error } },
  } as AxiosError;
  return responseHandler().rejected(axiosError);
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

describe("실패 응답 인터셉터", () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it("BE 가 준 error 를 그대로 넘긴다", async () => {
    await expect(
      runErrorInterceptor(409, { code: "ALREADY_ANSWERED", message: "이미 답변이 존재합니다." }),
    ).rejects.toEqual({ code: "ALREADY_ANSWERED", message: "이미 답변이 존재합니다." });
  });

  it("error 가 없으면 UNKNOWN_ERROR 로 채운다", async () => {
    // 게이트웨이가 envelope 없이 5xx 를 뱉는 경우가 있다. 화면이 code 를 못 읽으면 안 된다.
    await expect(runErrorInterceptor(502, null)).rejects.toMatchObject({ code: "UNKNOWN_ERROR" });
  });

  it("401 을 받으면 들고 있던 토큰을 버린다", async () => {
    // 남겨 두면 이후 요청이 전부 401 로 죽고, 세션 쿼리가 실패하지 않아
    // 로그인 상태로 잘못 남는다.
    setAccessToken("stale-token");

    await expect(
      runErrorInterceptor(401, { code: "UNAUTHORIZED", message: "인증이 필요합니다." }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    expect(getAccessToken()).toBeNull();
  });

  it("403 은 토큰을 지우지 않는다", async () => {
    // 로그인은 유효하고 권한만 모자란 상태다. 토큰을 버리면 멀쩡한 세션이 끊긴다.
    setAccessToken("valid-token");

    await expect(runErrorInterceptor(403, { code: "FORBIDDEN", message: "권한이 없습니다." })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(getAccessToken()).toBe("valid-token");
  });

  it("그 밖의 상태 코드도 토큰을 건드리지 않는다", async () => {
    setAccessToken("valid-token");

    await expect(runErrorInterceptor(500, null)).rejects.toMatchObject({ code: "UNKNOWN_ERROR" });

    expect(getAccessToken()).toBe("valid-token");
  });
});

describe("파일 응답", () => {
  it("blob 으로 요청했으면 envelope 검사를 건너뛴다", async () => {
    // 엑셀 다운로드(명세서 7.6 · 9.5)는 본문이 곧 파일이다.
    // 검사에 걸리면 MALFORMED_RESPONSE 로 막혀 다운로드가 아예 동작하지 않는다.
    const blob = new Blob(["a,b,c"], { type: "text/csv" });

    const response = await runResponseInterceptor(blob, "blob");

    expect(response.data).toBe(blob);
  });

  it("arraybuffer 도 마찬가지다", async () => {
    const buffer = new ArrayBuffer(8);

    const response = await runResponseInterceptor(buffer, "arraybuffer");

    expect(response.data).toBe(buffer);
  });

  it("파일을 기대하지 않은 요청은 여전히 거른다", async () => {
    // responseType 을 주지 않았는데 envelope 이 아니면 잘못된 응답이 맞다.
    await expect(runResponseInterceptor(new Blob(["x"]))).rejects.toMatchObject({
      code: "MALFORMED_RESPONSE",
    });
  });
});
