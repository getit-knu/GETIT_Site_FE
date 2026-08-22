import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAccessToken, setAccessToken } from "../libs/accessToken";

import { client } from "./client";

/**
 * 401 무음 갱신. 인터셉터의 실패 핸들러를 직접 돌려 검증한다.
 *
 * `refreshOnce` 는 `client.post` 를, 재시도는 `client.request` 를 부르므로
 * 그 둘만 가로채면 서버 없이도 흐름 전체를 확인할 수 있다.
 */
interface Handler {
  rejected: (e: AxiosError) => Promise<AxiosResponse>;
}

function rejectedHandler(): Handler {
  return (client.interceptors.response as unknown as { handlers: Handler[] }).handlers[0];
}

/** 401 을 만든다. `url` 을 주면 그 요청이 실패한 것으로 본다. */
function unauthorized(url = "/api/admin/users"): AxiosError {
  return {
    message: "Request failed",
    config: { url, headers: {} } as InternalAxiosRequestConfig,
    response: {
      status: 401,
      data: { success: false, data: null, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
    },
  } as AxiosError;
}

const run = (error: AxiosError) => rejectedHandler().rejected(error);

describe("401 무음 갱신", () => {
  beforeEach(() => {
    setAccessToken("expired-token");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it("갱신에 성공하면 원래 요청을 다시 보낸다", async () => {
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: { accessToken: "new-token" } });
    const request = vi.spyOn(client, "request").mockResolvedValue({ data: { ok: true } });

    const result = await run(unauthorized());

    expect(post).toHaveBeenCalledWith("/api/auth/refresh");
    expect(request).toHaveBeenCalledOnce();
    expect(result.data).toEqual({ ok: true });
    // 새 토큰이 저장돼야 이후 요청이 통한다.
    expect(getAccessToken()).toBe("new-token");
  });

  it("동시에 여러 요청이 401 을 받아도 갱신은 한 번만 나간다", async () => {
    // BE 는 Refresh Token Rotation 을 쓴다. 각자 갱신하면 두 번째가 재사용으로 보여
    // 오히려 세션이 끊긴다.
    const post = vi
      .spyOn(client, "post")
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { accessToken: "new-token" } }), 10)),
      );
    vi.spyOn(client, "request").mockResolvedValue({ data: { ok: true } });

    await Promise.all([
      run(unauthorized("/api/a")),
      run(unauthorized("/api/b")),
      run(unauthorized("/api/c")),
      run(unauthorized("/api/d")),
      run(unauthorized("/api/e")),
    ]);

    expect(post).toHaveBeenCalledOnce();
  });

  it("갱신이 실패하면 재시도하지 않고 토큰을 버린다", async () => {
    vi.spyOn(client, "post").mockRejectedValue({ code: "UNAUTHORIZED", message: "만료" });
    const request = vi.spyOn(client, "request");

    await expect(run(unauthorized())).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    expect(request).not.toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
  });

  it("갱신 요청 자체의 401 은 다시 갱신하지 않는다", async () => {
    // 여기서 갱신을 또 부르면 무한 루프가 된다.
    const post = vi.spyOn(client, "post");

    await expect(run(unauthorized("/api/auth/refresh"))).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    expect(post).not.toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
  });

  it("재시도한 요청이 또 401 이면 포기한다", async () => {
    const error = unauthorized();
    (error.config as { _retried?: boolean })._retried = true;
    const post = vi.spyOn(client, "post");

    await expect(run(error)).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    expect(post).not.toHaveBeenCalled();
  });

  it("한 번 갱신한 뒤 다시 만료되면 또 갱신한다", async () => {
    // 진행 중 Promise 를 비우지 않으면 두 번째 만료 때 영영 갱신되지 않는다.
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: { accessToken: "new-token" } });
    vi.spyOn(client, "request").mockResolvedValue({ data: { ok: true } });

    await run(unauthorized("/api/first"));
    await run(unauthorized("/api/second"));

    expect(post).toHaveBeenCalledTimes(2);
  });

  it("403 은 갱신하지 않고 토큰도 남긴다", async () => {
    const post = vi.spyOn(client, "post");
    const forbidden = {
      message: "Forbidden",
      config: { url: "/api/admin/users", headers: {} } as InternalAxiosRequestConfig,
      response: {
        status: 403,
        data: { success: false, data: null, error: { code: "FORBIDDEN", message: "권한 없음" } },
      },
    } as AxiosError;

    await expect(run(forbidden)).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(post).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe("expired-token");
  });

  it("만료된 토큰으로 파일을 받아도 갱신 후 파일로 다시 받는다", async () => {
    // 재시도할 때 responseType 을 잃으면 파일이 envelope 검사에 걸려 막힌다.
    vi.spyOn(client, "post").mockResolvedValue({ data: { accessToken: "new-token" } });
    const request = vi.spyOn(client, "request").mockResolvedValue({ data: new Blob(["a,b"]) });

    const error = unauthorized("/api/admin/users/export");
    (error.config as InternalAxiosRequestConfig).responseType = "blob";

    await run(error);

    expect(request.mock.calls[0][0]).toMatchObject({ responseType: "blob" });
  });
});

describe("파일 응답의 실패", () => {
  it("Blob 으로 감싸여 온 error 코드를 꺼낸다", async () => {
    // responseType: blob 이면 실패 응답까지 Blob 이다. 풀지 않으면 모든 다운로드 실패가
    // UNKNOWN_ERROR 가 되어 화면이 이유를 말하지 못한다.
    const error = {
      message: "Request failed",
      config: { url: "/api/admin/users/export", responseType: "blob", headers: {} } as InternalAxiosRequestConfig,
      response: {
        status: 403,
        data: new Blob([
          JSON.stringify({ success: false, data: null, error: { code: "FORBIDDEN", message: "권한 없음" } }),
        ]),
      },
    } as AxiosError;

    await expect(run(error)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("진짜 파일이 실려 오면 UNKNOWN_ERROR 로 둔다", async () => {
    const error = {
      message: "Request failed",
      config: { url: "/api/admin/users/export", responseType: "blob", headers: {} } as InternalAxiosRequestConfig,
      response: { status: 500, data: new Blob(["PK\x03\x04binary"]) },
    } as AxiosError;

    await expect(run(error)).rejects.toMatchObject({ code: "UNKNOWN_ERROR" });
  });
});
