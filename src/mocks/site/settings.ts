import type { SiteSavePayload, SiteSettings } from "../../types/site";

/**
 * 모집 일정 · FAQ 목.
 *
 * 진행 기수 · 운영진 · 행사 · 커리큘럼 · 강의 분류는 실제 BE 엔드포인트로 옮겨갔다
 * (#194 · #195) — 이 목엔 아직 실제 엔드포인트가 없는 나머지 섹션만 남는다.
 */

let state: SiteSettings = {
  /*
    일정은 분 단위로 둔다. 화면이 `datetime-local` 로 다뤄 초를 버리므로, 목에 초가 있으면
    아무것도 고치지 않고 저장해도 마감이 앞당겨진다.

    BE 가 초를 담아 보내기 시작하면 화면에서 초를 지켜 되돌려 보낼지 정해야 한다.
  */
  schedule: {
    totalStartAt: "2026-09-01T00:00:00+09:00",
    totalEndAt: "2026-09-30T23:59:00+09:00",
    documentStartAt: "2026-09-01T00:00:00+09:00",
    documentEndAt: "2026-09-10T23:59:00+09:00",
    interviewStartAt: "2026-09-15T00:00:00+09:00",
  },
  faqs: [{ id: 1, question: "동아리 활동 시간은?", answer: "매주 화요일 저녁 7시입니다." }],
};

const delay = () => new Promise((r) => setTimeout(r, 200));

export async function fetchSiteSettings(): Promise<SiteSettings> {
  await delay();
  return structuredClone(state);
}

export async function saveSiteSettings(payload: SiteSavePayload): Promise<SiteSettings> {
  await delay();
  state = structuredClone(payload);
  return structuredClone(state);
}
