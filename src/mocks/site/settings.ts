import type { SiteSavePayload, SiteSettings } from "../../types/site";

/**
 * 사이트 설정 목 (명세서 10절).
 *
 * BE 에 admin setting 컨트롤러가 아직 없어 화면을 먼저 만든다.
 */

let state: SiteSettings = {
  generation: { id: 9, generationNo: 9, year: 2026, isActive: true },
  schedule: {
    totalStartAt: "2026-09-01T00:00:00+09:00",
    totalEndAt: "2026-09-30T23:59:59+09:00",
    documentStartAt: "2026-09-01T00:00:00+09:00",
    documentEndAt: "2026-09-10T23:59:59+09:00",
    interviewStartAt: "2026-09-15T00:00:00+09:00",
  },
  // 아직 편집 화면이 없는 섹션들. 저장할 때 그대로 되돌려 보내야 지워지지 않는다.
  tracks: [
    {
      id: 1,
      name: "SW",
      subCategories: [
        { id: 1, name: "웹기초" },
        { id: 2, name: "React.js" },
      ],
    },
    { id: 2, name: "창업", subCategories: [{ id: 6, name: "Figma" }] },
  ],
  curriculums: [{ id: 1, title: "Python & 데이터 분석", subtitle: "Python 기초부터 데이터 분석까지" }],
  events: [
    { id: 11, title: "창업 프로젝트 개발 대회", startDate: "2026-09-27", endDate: "2026-11-11", type: "COMPETITION" },
  ],
  faqs: [{ id: 1, question: "동아리 활동 시간은?", answer: "매주 화요일 저녁 7시입니다." }],
};

const delay = () => new Promise((r) => setTimeout(r, 200));

/**
 * 10.1 · 10.3 · 10.10 · 10.14 · 10.18 을 한 번에 돌려준다.
 *
 * 명세서에는 조회가 다섯 개로 나뉘어 있다. 화면은 다섯을 모두 들고 있어야
 * 10.20 으로 되돌려 보낼 수 있어, 목에서는 한 덩어리로 둔다.
 * BE 가 붙으면 `Promise.all` 로 다섯을 병렬 호출하거나 통합 조회를 요청한다.
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  await delay();
  return structuredClone(state);
}

/** 10.20. 화면 전체 상태를 한 트랜잭션으로 반영한다. */
export async function saveSiteSettings(payload: SiteSavePayload): Promise<SiteSettings> {
  await delay();

  const changingGeneration = payload.generation.generationNo !== state.generation.generationNo;
  // 새 기수를 활성화하면 기존 활성 기수가 내려간다. 동시 활성 시도는 409 다(명세서 10.2).
  if (changingGeneration && payload.generation.generationNo < state.generation.generationNo) {
    throw { code: "ACTIVE_GENERATION_EXISTS", message: "이미 활성화된 기수가 있습니다." };
  }

  state = {
    generation: {
      id: state.generation.id + (changingGeneration ? 1 : 0),
      generationNo: payload.generation.generationNo,
      year: payload.generation.year,
      isActive: true,
    },
    schedule: structuredClone(payload.schedule),
    tracks: structuredClone(payload.tracks),
    curriculums: structuredClone(payload.curriculums),
    events: structuredClone(payload.events),
    faqs: structuredClone(payload.faqs),
  };

  return structuredClone(state);
}
