import { client } from "../client";
import type {
  ApplicationDecisionResult,
  ApplicationDraftPayload,
  ApplicationFormResult,
  DraftSaveResult,
  MyApplicationResult,
  SubmitResult,
} from "../../types/application";

/**
 * 내 지원서 API. 명세서 3.1 이하.
 *
 * `applicationsApi.ts`(어드민 지원자 관리)와는 다른 파일이다 — 로그인한 지원자 본인이
 * 자기 지원서를 조회·작성하는 API라 사용자·권한이 다르다.
 */

/** `GET /api/applications/form` — 지원서 양식 조회(3.1). 로그인이 필요하다. */
export async function getForm(): Promise<ApplicationFormResult> {
  const { data } = await client.get<ApplicationFormResult>("/api/applications/form");
  return data;
}

/** `GET /api/applications/me` — 내 지원서 조회(3.2). 지원서가 없으면 에러가 아니라 `null`이 온다. */
export async function getMyApplication(): Promise<MyApplicationResult | null> {
  const { data } = await client.get<MyApplicationResult | null>("/api/applications/me");
  return data;
}

/**
 * `PUT /api/applications/me/draft` — 지원서 임시 저장(3.3).
 *
 * 필수값 · 글자수 검증은 안 한다(BE가 제출 시점에만 함) — 다 안 채워도 저장할 수 있다.
 */
export async function saveDraft(payload: ApplicationDraftPayload): Promise<DraftSaveResult> {
  const { data } = await client.put<DraftSaveResult>("/api/applications/me/draft", payload);
  return data;
}

/** `POST /api/applications/me/submit` — 지원서 제출(3.4). */
export async function submit(payload: ApplicationDraftPayload): Promise<SubmitResult> {
  const { data } = await client.post<SubmitResult>("/api/applications/me/submit", payload);
  return data;
}

/** `GET /api/applications/me/result` — 지원서 결과 조회(3.5). 제출한 지원서가 없으면 404다. */
export async function getResult(): Promise<ApplicationDecisionResult> {
  const { data } = await client.get<ApplicationDecisionResult>("/api/applications/me/result");
  return data;
}
