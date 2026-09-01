import type { ApplicationDraftPayload, MyApplicationResult } from "../types/application";

import * as fx from "./fixtures";

export interface MockResponse {
  status: number;
  body: unknown;
}

function ok(data: unknown): MockResponse {
  return { status: 200, body: { success: true, data, error: null } };
}

function fail(status: number, code: string, message: string): MockResponse {
  return { status, body: { success: false, data: null, error: { code, message } } };
}

/**
 * dev 목 API의 라우팅 테이블. 순수 함수 + 내부 상태(내 지원서)라 vitest로 바로 검증한다.
 * 미들웨어(`devApiMockPlugin`)는 HTTP 입출력만 담당한다.
 */
export function createMockApi() {
  let saved: MyApplicationResult | null = null;

  function upsertDraft(payload: ApplicationDraftPayload): MyApplicationResult {
    const base = saved ?? fx.emptyMyApplication();
    saved = { ...base, basicInfo: payload.basicInfo, answers: payload.answers, savedAt: new Date().toISOString() };
    return saved;
  }

  function resolve(
    method: string,
    pathname: string,
    searchParams: URLSearchParams,
    body?: unknown,
  ): MockResponse | null {
    const key = `${method} ${pathname}`;

    switch (key) {
      case "GET /api/auth/me":
        return ok(fx.me);
      case "GET /api/public/home":
        return ok(fx.home);
      case "GET /api/public/faqs":
        return ok(fx.faqs);
      case "GET /api/public/activity-photos":
        return ok(fx.activityPhotos);
      case "GET /api/public/recruitment/status":
        return ok(fx.recruitmentStatus);
      case "GET /api/public/colleges":
        return ok(fx.colleges);
      case "GET /api/public/majors":
        return ok(fx.majors);
      case "GET /api/public/staffs":
        return ok(fx.staffs);
      case "GET /api/public/projects":
        return ok(fx.projects);
      case "GET /api/public/events": {
        const year = Number(searchParams.get("year") ?? new Date().getFullYear());
        const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
        return ok(fx.eventsFor(year, month));
      }
      case "GET /api/applications/form":
        return ok(fx.applicationForm);
      case "GET /api/applications/me":
        return ok(saved);
      case "PUT /api/applications/me/draft": {
        const next = upsertDraft(body as ApplicationDraftPayload);
        return ok({ id: next.id, status: next.status, savedAt: next.savedAt });
      }
      case "POST /api/applications/me/submit": {
        const next = upsertDraft(body as ApplicationDraftPayload);
        saved = { ...next, status: "SUBMITTED", submittedAt: new Date().toISOString() };
        return ok({ id: saved.id, status: saved.status, submittedAt: saved.submittedAt });
      }
      case "GET /api/applications/me/result": {
        if (saved === null || saved.status === "DRAFT") {
          return fail(404, "RESOURCE_NOT_FOUND", "제출한 지원서가 없습니다.");
        }
        return ok({
          generationNo: saved.generationNo,
          status: saved.status,
          statusLabel: "서류를 검토하고 있어요",
          documentAnnouncedAt: "2026-09-08T18:00:00",
          finalAnnouncedAt: "2026-09-22T18:00:00",
          nextStep: null,
        });
      }
      default:
        return null;
    }
  }

  return { resolve };
}
