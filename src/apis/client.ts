import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import { clearAccessToken, getAccessToken, setAccessToken } from "../libs/accessToken";

// TODO: BE 도메인이 아직 스켈레톤 상태라 로컬 fake 서버(계약 기준 mock)로만 검증됨.
// 실제 BE 엔드포인트 연동 후 재검증 필요.

// BE 응답 envelope 구조 (Coding Convention-Common 참고)
export interface ApiErrorPayload {
  code: string;
  message: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
}

export const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  // Refresh Token 이 HttpOnly 쿠키로 오간다. 이게 없으면 /api/auth/refresh 가 항상 401 이다.
  withCredentials: true,
});

// Access Token 은 메모리에만 있다. 요청마다 여기서 실어 준다.
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 갱신 요청 자체가 401 이면 다시 갱신할 수 없다. 무한 루프를 막는 유일한 기준점이다. */
const REFRESH_URL = "/api/auth/refresh";

/** 이미 한 번 재시도한 요청인지. 두 번 이상 돌면 401 이 반복될 때 무한 루프가 된다. */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * 진행 중인 갱신. **여러 요청이 동시에 401 을 받아도 갱신은 한 번만 나간다.**
 *
 * BE 는 Refresh Token Rotation 을 쓴다. 같은 Refresh 를 두 번 쓰면 재사용으로 보고
 * 세션을 끊으므로, 각자 갱신하면 오히려 로그아웃된다.
 */
let refreshing: Promise<void> | null = null;

function refreshOnce(): Promise<void> {
  refreshing ??= client
    .post<{ accessToken: string }>(REFRESH_URL)
    .then(({ data }) => {
      setAccessToken(data.accessToken);
    })
    .finally(() => {
      // 성공이든 실패든 비워야 다음 만료 때 다시 갱신할 수 있다.
      refreshing = null;
    });

  return refreshing;
}

/**
 * 실패 응답의 error 를 꺼낸다.
 *
 * **`responseType: "blob"` 으로 요청하면 실패 응답까지 Blob 으로 감싸여 온다.**
 * 그대로 두면 `data.error` 를 읽지 못해 모든 다운로드 실패가 UNKNOWN_ERROR 가 된다.
 * 화면은 "권한이 없습니다" 대신 "실패했습니다" 만 보게 된다.
 */
async function extractError(data: unknown): Promise<ApiErrorPayload | undefined> {
  if (data instanceof Blob) {
    try {
      const parsed: unknown = JSON.parse(await data.text());
      if (isEnvelope(parsed)) return parsed.error ?? undefined;
    } catch {
      // 진짜 파일이거나 JSON 이 아니다. 알 수 있는 게 없다.
    }
    return undefined;
  }

  return isEnvelope(data) ? (data.error ?? undefined) : undefined;
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === "object" && value !== null && "success" in value;
}

/**
 * 파일 응답은 envelope 이 아니다.
 *
 * 엑셀 다운로드(명세서 7.6 · 9.5)는 본문이 곧 파일이라 아래 검사에 걸려
 * `MALFORMED_RESPONSE` 로 막힌다. 요청한 쪽이 파일을 기대했으면 그대로 통과시킨다.
 */
function isFileResponse(response: AxiosResponse): boolean {
  const type = response.config.responseType;
  return type === "blob" || type === "arraybuffer";
}

// 컴포넌트는 envelope을 몰라야 한다: 여기서 한 번 벗겨서 data만 내려준다.
client.interceptors.response.use(
  (response) => {
    if (isFileResponse(response)) return response;

    // 2xx 라고 전부 envelope 은 아니다. baseURL 이 비어 있으면 요청이 개발 서버로 가고,
    // 개발 서버는 SPA 폴백으로 index.html 을 200 으로 준다.
    // 검사 없이 벗기면 data 가 조용히 undefined 가 되고, 그 결과는
    // "Query data cannot be undefined" 처럼 원인과 동떨어진 곳에서 터진다.
    if (!isEnvelope(response.data)) {
      const malformed: ApiErrorPayload = {
        code: "MALFORMED_RESPONSE",
        message: "서버 응답 형식이 올바르지 않습니다. API 주소 설정을 확인해 주세요.",
      };
      return Promise.reject(malformed);
    }

    response.data = response.data.data;
    return response;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const payload = await extractError(error.response?.data);
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401) {
      // Access Token 은 수명이 짧아 작업 중에 흔히 만료된다. 표를 보다가, 모달에
      // 답변을 쓰다가 튕기지 않도록 조용히 재발급하고 원래 요청을 다시 보낸다.
      //
      // 다시 보내면 안 되는 경우가 셋이다.
      //  - 갱신 요청 자체가 401 → Refresh 까지 만료됐다
      //  - 이미 한 번 재시도한 요청 → 반복하면 무한 루프다
      //  - config 가 없는 오류 → 무엇을 다시 보낼지 알 수 없다
      const canRetry = config !== undefined && config.url !== REFRESH_URL && !config._retried;

      if (canRetry) {
        config._retried = true;
        try {
          await refreshOnce();
          return await client.request(config);
        } catch {
          // 갱신에 실패했다. 아래로 내려가 원래 오류를 그대로 돌려준다.
        }
      }

      // 여기까지 왔으면 이 브라우저의 세션은 끝났다. 토큰을 남겨 두면
      // 이후 요청이 전부 401 로 죽는다. 지우면 세션 쿼리가 실패하고
      // RequireRole 이 로그인으로 보낸다.
      clearAccessToken();
    }

    // 403 은 토큰을 지우지 않는다. 로그인은 유효하고 권한만 모자란 상태라,
    // 지우면 멀쩡한 세션이 끊긴다. 화면 전환은 RequireRole 이 담당한다.

    const apiError: ApiErrorPayload = payload ?? {
      code: "UNKNOWN_ERROR",
      message: error.message,
    };

    return Promise.reject(apiError);
  },
);
