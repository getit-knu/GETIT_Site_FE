import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from "axios";

import { clearAccessToken, getAccessToken } from "../libs/accessToken";

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
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const payload = error.response?.data?.error;

    switch (error.response?.status) {
      case 401:
        // 들고 있던 토큰이 더는 유효하지 않다. 남겨 두면 이후 요청이 전부 401 로 죽는다.
        // 지우면 세션 쿼리가 실패하고 RequireRole 이 로그인으로 보낸다.
        //
        // TODO: 무음 갱신 — 401 을 만나면 /api/auth/refresh 로 한 번 재발급하고
        // 원래 요청을 재시도한다. 동시에 터진 요청이 각자 갱신하지 않도록
        // 진행 중인 갱신 Promise 를 공유해야 해서 별도 이슈로 뺀다.
        clearAccessToken();
        break;
      case 403:
        // 로그인은 됐지만 권한이 없다. 토큰은 유효하므로 지우지 않는다.
        // 화면 전환은 RequireRole 이 담당한다.
        break;
      default:
        break;
    }

    const apiError: ApiErrorPayload = payload ?? {
      code: "UNKNOWN_ERROR",
      message: error.message,
    };

    return Promise.reject(apiError);
  },
);
