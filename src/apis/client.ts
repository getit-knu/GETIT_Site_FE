import axios, { type AxiosError, type AxiosInstance } from "axios";

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
});

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === "object" && value !== null && "success" in value;
}

// 컴포넌트는 envelope을 몰라야 한다: 여기서 한 번 벗겨서 data만 내려준다.
client.interceptors.response.use(
  (response) => {
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
        // TODO: 인증 만료 처리 (auth 도메인 구축 시 재로그인/토큰 갱신 연결)
        break;
      case 403:
        // TODO: 권한 없음 처리
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
