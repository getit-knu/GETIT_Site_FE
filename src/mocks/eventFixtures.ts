import type { PublicEventCalendar } from "../types/site";

/**
 * 개발용 일정 목 데이터. **dev 서버에서만 쓰인다**(`fixtures.ts` 상단 설명 참고).
 *
 * `fixtures.ts`에서 떼어냈다 — 달마다 개수·기간을 달리 주는 규칙이 늘면서 한 파일에 두기엔
 * 덩치가 커졌고, 일정은 다른 목 데이터와 달리 "달 → 목록"을 계산하는 로직이 딸려 있다.
 */

/** 돌려 쓸 일정 견본. `eventsFor`가 달마다 앞에서부터 필요한 만큼 잘라 쓴다. */
const EVENT_SAMPLES: Array<Pick<PublicEventCalendar["events"][number], "title" | "type" | "place"> & { day: number }> =
  [
    { day: 5, title: "정기 세션", type: "WORKSHOP", place: "IT대 101호" },
    { day: 14, title: "교내 해커톤", type: "COMPETITION", place: "본관 대강당" },
    { day: 22, title: "번개 모임", type: "EVENT", place: "북문" },
    { day: 8, title: "신입 부원 OT", type: "EVENT", place: "IT대 205호" },
    { day: 17, title: "포트폴리오 워크숍", type: "WORKSHOP", place: "IT대 101호" },
    { day: 26, title: "창업 아이디어 피칭", type: "COMPETITION", place: "창업보육센터" },
  ];

/**
 * 달마다 **일정 개수를 다르게** 준다(0~6개). 예전엔 어느 달이나 3개씩 고정이라, 달을 넘길 때
 * 카드 높이가 변하는 경우를 개발 중에 아예 만날 수 없었다 — 일정이 없는 달, 한 개뿐인 달,
 * 꽉 찬 달이 모두 화면에서 확인돼야 한다.
 *
 * 달마다 값이 고정이라(무작위가 아니다) 같은 달을 다시 보면 결과가 늘 같다.
 */
const EVENT_COUNT_BY_MONTH = [2, 0, 3, 1, 5, 2, 4, 0, 3, 1, 6, 2];

/**
 * 손으로 박아 두는 달. 위 생성기로는 만들 수 없는 경우를 개발 중에 반드시 만나게 한다.
 *
 * 8월에 **사흘 이상 이어지는 행사**와 **주 경계를 넘는 행사**를 같이 둔다. 달력에서 이어진 날은
 * 하나의 긴 알약으로 붙는데, 주가 바뀌면 줄이 갈리므로 토요일에서 끊기고 일요일에서 다시
 * 시작한다 — 그 두 모습을 한 화면에서 확인할 수 있어야 한다.
 */
const EVENT_OVERRIDES: Record<number, Array<{ day: number; span: number } & (typeof EVENT_SAMPLES)[number]>> = {
  8: [
    { day: 4, span: 1, title: "정기 세션", type: "WORKSHOP", place: "IT대 101호" },
    // 한 주 안에서 나흘(2026년 기준 월~목) — 한 줄짜리 긴 알약이 된다.
    { day: 10, span: 4, title: "여름 부트캠프", type: "WORKSHOP", place: "IT대 401호" },
    // 주 경계를 넘는 나흘(2026년 기준 금~월) — 토요일에서 한 번 끊기고 일요일에서 이어진다.
    { day: 21, span: 4, title: "여름 MT", type: "EVENT", place: "청도 펜션" },
  ],
};

export function eventsFor(year: number, month: number): PublicEventCalendar {
  const mm = String(month).padStart(2, "0");
  const pad = (day: number) => String(day).padStart(2, "0");
  const override = EVENT_OVERRIDES[month];

  if (override !== undefined) {
    return {
      year,
      month,
      events: override.map((item, index) => ({
        id: index + 1,
        title: item.title,
        startDate: `${year}-${mm}-${pad(item.day)}`,
        endDate: `${year}-${mm}-${pad(item.day + item.span - 1)}`,
        type: item.type,
        place: item.place,
      })),
    };
  }

  const count = EVENT_COUNT_BY_MONTH[(month - 1) % 12];

  return {
    year,
    month,
    events: Array.from({ length: count }, (_, index) => {
      const sample = EVENT_SAMPLES[index % EVENT_SAMPLES.length];
      // 견본을 한 바퀴 넘게 쓰는 달은 날짜가 겹치지 않도록 한 바퀴마다 하루씩 민다.
      const day = Math.min(28, sample.day + Math.floor(index / EVENT_SAMPLES.length));
      const isMultiDay = sample.type === "COMPETITION";

      return {
        id: index + 1,
        title: sample.title,
        startDate: `${year}-${mm}-${pad(day)}`,
        endDate: `${year}-${mm}-${pad(isMultiDay ? Math.min(28, day + 1) : day)}`,
        type: sample.type,
        place: sample.place,
      };
    }),
  };
}
