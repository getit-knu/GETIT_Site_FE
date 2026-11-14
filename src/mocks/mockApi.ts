import type { ApplicationDraftPayload, MyApplicationResult } from "../types/application";
import type { FestaInvestment, FestaPortfolioPayload } from "../types/festa";

import { eventsFor } from "./eventFixtures";
import * as fx from "./fixtures";
import { memberLectures, memberTracks, myGroup, myProjects, myQuestions, mySummary } from "./memberLectureFixtures";

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

  /**
   * 임시 저장·제출 body가 최소한의 모양을 갖췄는지 본다. 미들웨어는 본문이 없거나 JSON
   * 파싱에 실패하면 `undefined`를 넘기는데, 그대로 단언해서 넘기면 `upsertDraft`가
   * `payload.basicInfo`에서 예외를 던져 응답이 아예 안 나간다(요청이 멈춘다).
   */
  function isDraftPayload(body: unknown): body is ApplicationDraftPayload {
    if (typeof body !== "object" || body === null) return false;
    const candidate = body as Partial<ApplicationDraftPayload>;
    return typeof candidate.basicInfo === "object" && candidate.basicInfo !== null && Array.isArray(candidate.answers);
  }

  // FESTA 가상 투자(#364). BE `FestaPortfolioService`의 검증 순서를 그대로 흉내 낸다.
  const FESTA_BUDGET = 10_000_000;
  const FESTA_UNIT = 100_000;
  let festaPhone: string | null = null;
  let festaInvestments: FestaInvestment[] = [];

  function festaPortfolio() {
    const invested = festaInvestments.reduce((sum, i) => sum + i.amount, 0);
    const maskedPhoneNumber = festaPhone === null ? null : `${festaPhone.slice(0, 4)}****${festaPhone.slice(8)}`;
    return {
      budget: FESTA_BUDGET,
      unit: FESTA_UNIT,
      remaining: FESTA_BUDGET - invested,
      maskedPhoneNumber,
      investments: festaInvestments,
    };
  }

  function saveFesta(body: unknown): MockResponse {
    const payload = body as Partial<FestaPortfolioPayload> | undefined;
    if (!Array.isArray(payload?.investments)) return fail(400, "VALIDATION_FAILED", "investments 가 없습니다.");
    const investments = payload.investments;
    const ids = investments.map((i) => i.projectId);
    if (new Set(ids).size !== ids.length) return fail(400, "DUPLICATE_PROJECT", "중복 프로젝트");
    if (investments.some((i) => i.amount < 0 || i.amount % FESTA_UNIT !== 0))
      return fail(400, "INVALID_AMOUNT", "단위");
    if (investments.reduce((sum, i) => sum + i.amount, 0) > FESTA_BUDGET) return fail(400, "BUDGET_EXCEEDED", "초과");
    if (ids.some((id) => !fx.festaProjects.some((p) => p.id === id))) return fail(400, "PROJECT_NOT_ENTERED", "미출전");
    const ownIds = fx.me.role === "MEMBER" ? myProjects.map((p) => p.id) : [];
    if (ids.some((id) => ownIds.includes(id))) return fail(403, "OWN_GROUP_PROJECT", "우리 조");

    const phone = payload.phoneNumber?.trim() ?? "";
    if (phone === "" && festaPhone === null) return fail(400, "PHONE_NUMBER_REQUIRED", "번호 필요");
    if (phone !== "") {
      if (!/^010-\d{4}-\d{4}$/.test(phone)) return fail(400, "INVALID_PHONE_NUMBER", "번호 형식");
      if (payload.privacyConsent !== true) return fail(400, "PRIVACY_CONSENT_REQUIRED", "동의 필요");
      festaPhone = phone;
    }
    festaInvestments = investments.filter((i) => i.amount > 0).sort((a, b) => a.projectId - b.projectId);
    return ok(festaPortfolio());
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
      case "GET /api/public/festa/projects":
        return ok(fx.festaProjects);
      case "GET /api/festa/portfolio":
        return ok(festaPortfolio());
      case "PUT /api/festa/portfolio":
        return saveFesta(body);
      case "GET /api/public/projects": {
        const semester = searchParams.get("semester");
        if (semester === null) return ok(fx.projects);
        const content = fx.projects.content.filter((p) => p.semester === semester);
        return ok({ ...fx.projects, content, totalElements: content.length });
      }
      case "GET /api/member/me/summary":
        return ok(mySummary);
      case "GET /api/member/projects":
        return ok(myProjects);
      case "GET /api/member/group":
        return ok(myGroup);
      case "GET /api/member/questions":
        return ok(myQuestions);
      case "GET /api/member/tracks":
        return ok(memberTracks);
      case "GET /api/member/lectures": {
        // 필터를 실제로 걸어 준다 — 전부 그대로 돌려주면 dev 에서 탭을 눌러도 아무 일도
        // 일어나지 않아, 필터가 동작하는지 아닌지 알 수 없다.
        const trackId = searchParams.get("trackId");
        const subCategoryId = searchParams.get("subCategoryId");
        const track = trackId !== null ? memberTracks.find((t) => t.id === Number(trackId)) : undefined;
        const subCategory =
          subCategoryId !== null
            ? memberTracks.flatMap((t) => t.subCategories).find((c) => c.id === Number(subCategoryId))
            : undefined;

        const content = memberLectures.content.filter(
          (lecture) =>
            (track === undefined || lecture.trackName === track.name) &&
            (subCategory === undefined || lecture.subCategoryName === subCategory.name),
        );
        return ok({ ...memberLectures, content, totalElements: content.length });
      }
      case "GET /api/public/events": {
        const year = Number(searchParams.get("year") ?? new Date().getFullYear());
        const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
        return ok(eventsFor(year, month));
      }
      case "GET /api/applications/form":
        return ok(fx.applicationForm);
      case "GET /api/applications/me":
        return ok(saved);
      case "PUT /api/applications/me/draft": {
        if (!isDraftPayload(body)) {
          return fail(400, "VALIDATION_FAILED", "지원서 본문(basicInfo·answers)이 올바르지 않습니다.");
        }
        const next = upsertDraft(body);
        return ok({ id: next.id, status: next.status, savedAt: next.savedAt });
      }
      case "POST /api/applications/me/submit": {
        if (!isDraftPayload(body)) {
          return fail(400, "VALIDATION_FAILED", "지원서 본문(basicInfo·answers)이 올바르지 않습니다.");
        }
        const next = upsertDraft(body);
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
