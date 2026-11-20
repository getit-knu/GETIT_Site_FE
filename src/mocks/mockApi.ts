import type { ApplicationDraftPayload, MyApplicationResult } from "../types/application";
import type {
  FestaInvestment,
  FestaPortfolioPayload,
  FestaSchedule,
  FestaScheduleSetting,
  FestaVotePayload,
} from "../types/festa";

import { eventsFor } from "./eventFixtures";
import * as fx from "./fixtures";
import { memberLectures, memberTracks, myGroup, myProjects, myQuestions, mySummary } from "./memberLectureFixtures";

export interface MockResponse {
  status: number;
  body: unknown;
  /** 주면 `body`(문자열)를 JSON 으로 감싸지 않고 이 타입으로 그대로 보낸다. 파일 응답용. */
  contentType?: string;
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
  const festaOwnIds = () => (fx.me.role === "MEMBER" ? myProjects.map((p) => p.id) : []);

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
    if (ids.some((id) => festaOwnIds().includes(id))) return fail(403, "OWN_GROUP_PROJECT", "우리 조");

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

  // FESTA 투표 기간(#379). 계약은 BE#234 이슈 기준. 처음엔 정하지 않은 상태다.
  let festaSchedule: FestaScheduleSetting = { startAt: null, endAt: null };

  function saveFestaSchedule(body: unknown): MockResponse {
    const { startAt = "", endAt = "" } = (body ?? {}) as Partial<FestaSchedule>;
    const start = Date.parse(startAt);
    const end = Date.parse(endAt);
    if (Number.isNaN(start) || Number.isNaN(end)) return fail(400, "VALIDATION_FAILED", "시각 필요");
    if (start >= end) return fail(400, "INVALID_FESTA_SCHEDULE", "시작이 종료보다 늦음");
    festaSchedule = { startAt, endAt };
    return ok(festaSchedule);
  }

  // FESTA 1인 1팀 투표(#373). 계약은 BE#232 이슈 기준. 번호는 투자와 같은 칸(`festaPhone`)을 쓴다.
  let festaVote: number | null = null;

  function festaVoteResult() {
    const maskedPhoneNumber = festaPhone === null ? null : `${festaPhone.slice(0, 4)}****${festaPhone.slice(8)}`;
    return { projectId: festaVote, maskedPhoneNumber, ownProjectIds: festaOwnIds() };
  }

  function saveVote(body: unknown): MockResponse {
    const payload = (body ?? {}) as Partial<FestaVotePayload>;
    const projectId = payload.projectId;
    if (typeof projectId !== "number") return fail(400, "VALIDATION_FAILED", "projectId 가 없습니다.");
    if (!fx.festaProjects.some((p) => p.id === projectId)) return fail(400, "PROJECT_NOT_ENTERED", "미출전");
    if (festaOwnIds().includes(projectId)) return fail(403, "OWN_GROUP_PROJECT", "우리 조");

    const phone = payload.phoneNumber?.trim() ?? "";
    if (phone === "" && festaPhone === null) return fail(400, "PHONE_NUMBER_REQUIRED", "번호 필요");
    if (phone !== "") {
      if (!/^010-\d{4}-\d{4}$/.test(phone)) return fail(400, "INVALID_PHONE_NUMBER", "번호 형식");
      if (payload.privacyConsent !== true) return fail(400, "PRIVACY_CONSENT_REQUIRED", "동의 필요");
      festaPhone = phone;
    }
    festaVote = projectId;
    return ok(festaVoteResult());
  }

  // FESTA 어드민(#365). 목에는 투자자가 나 하나뿐이다.
  function festaResults() {
    const projects = fx.festaProjects
      .map((p) => {
        const amount = festaInvestments.find((i) => i.projectId === p.id)?.amount ?? 0;
        return {
          projectId: p.id,
          title: p.title,
          teamName: p.teamName,
          totalAmount: amount,
          investorCount: amount > 0 ? 1 : 0,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
    return { investorCount: festaInvestments.length > 0 ? 1 : 0, projects };
  }

  function festaInvestorsCsv(): MockResponse {
    const rows =
      festaPhone !== null && (festaInvestments.length > 0 || festaVote !== null)
        ? [`"${fx.me.name}","${festaPhone}","2026-11-23 12:00:00"`]
        : [];
    const csv = ["\uFEFF이름,전화번호,마지막 투자 시각", ...rows].join("\r\n") + "\r\n";
    return { status: 200, body: csv, contentType: "text/csv; charset=UTF-8" };
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
      case "GET /api/festa/vote":
        return ok(festaVoteResult());
      case "PUT /api/festa/vote":
        return saveVote(body);
      case "GET /api/admin/festa/vote-results": {
        const projects = fx.festaProjects
          .map((p) => ({
            projectId: p.id,
            title: p.title,
            teamName: p.teamName,
            voteCount: festaVote === p.id ? 1 : 0,
          }))
          .sort((a, b) => b.voteCount - a.voteCount);
        return ok({ voterCount: festaVote === null ? 0 : 1, projects });
      }
      case "GET /api/admin/festa/schedule":
        return ok(festaSchedule);
      case "PUT /api/admin/festa/schedule":
        return saveFestaSchedule(body);
      case "GET /api/admin/festa/results":
        return ok(festaResults());
      case "GET /api/admin/festa/investors.csv":
        return festaInvestorsCsv();
      case "DELETE /api/admin/festa/investors/phones": {
        const destroyedCount = festaPhone === null ? 0 : 1;
        festaPhone = null;
        return ok({ destroyedCount });
      }
      case "DELETE /api/admin/festa/investments": {
        if (fx.home.features.mockInvestment) return fail(409, "FESTA_RESET_WHILE_OPEN", "토글 켜짐");
        const deletedInvestorCount = festaPhone === null && festaInvestments.length === 0 && festaVote === null ? 0 : 1;
        festaPhone = null;
        festaInvestments = [];
        festaVote = null;
        return ok({ deletedInvestorCount });
      }
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
