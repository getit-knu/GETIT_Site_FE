import axios, { type AxiosError, type AxiosInstance } from "axios";

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

// 컴포넌트는 envelope을 몰라야 한다: 여기서 한 번 벗겨서 data만 내려준다.
client.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>;
    response.data = envelope.data;
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
