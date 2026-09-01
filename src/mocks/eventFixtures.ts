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
 * 얇은 선이 칸 사이를 메우며 한 줄로 이어지는데, 주가 바뀌면 줄이 갈리므로 토요일에서 끊기고
 * 일요일에서 다시 시작한다 — 그 두 모습을 한 화면에서 확인할 수 있어야 한다.
 *
 * 10월은 **겹침** 담당이다. 프로덕션 2026년 10월이 실제로 이런 모양이었다(9/14~10/20 워크숍이
 * 달을 가로지르고 그 아래로 짧은 일정들이 겹친다). 겹침이 없으면 줄 배정·줄 상한을 개발 중에
 * 아예 만날 수 없어서, 하루에 2·3·4개가 겹치는 날을 일부러 섞어 뒀다:
 *
 * - 1~4일: 2개 — 워크숍 둘이 위아래 줄로 갈린다.
 * - 5일: 3개 — 줄 상한(`MAX_LANES`)까지 꽉 찬 모습.
 * - 6~7일: 4개 — 상한을 넘겨 네 번째 일정의 선은 그려지지 않는다(개수는 `aria-label`이 말한다).
 * - 8일: 2개 — 7일에 끝난 워크숍이 비운 줄로 하루짜리 행사가 들어온다(같은 줄, 다른 일정이라
 *   이어 붙이지 않는다).
 * - 16~19일: 3개 — 주 경계(17일 토 → 18일 일)를 세 줄이 함께 넘는다.
 */
const EVENT_OVERRIDES: Record<number, Array<{ day: number; span: number } & (typeof EVENT_SAMPLES)[number]>> = {
  8: [
    { day: 4, span: 1, title: "정기 세션", type: "WORKSHOP", place: "IT대 101호" },
    // 한 주 안에서 나흘(2026년 기준 월~목) — 한 줄짜리 긴 선이 된다.
    { day: 10, span: 4, title: "여름 부트캠프", type: "WORKSHOP", place: "IT대 401호" },
    // 주 경계를 넘는 나흘(2026년 기준 금~월) — 토요일에서 한 번 끊기고 일요일에서 이어진다.
    { day: 21, span: 4, title: "여름 MT", type: "EVENT", place: "청도 펜션" },
  ],
  10: [
    // `day`가 0 이하면 지난달에 시작한 일정이다 — 9/14에 시작해 10/20에 끝난다.
    { day: -16, span: 37, title: "팀별 빌드업 I", type: "WORKSHOP", place: "IT대 401호" },
    { day: 1, span: 7, title: "팀별 빌드업 III", type: "WORKSHOP", place: "IT대 401호" },
    { day: 5, span: 3, title: "중간 발표 리허설", type: "COMPETITION", place: "IT대 101호" },
    // 6~7일을 네 겹으로 만드는 일정. 줄 상한을 넘기는 날이 화면에 하나는 있어야 한다.
    { day: 6, span: 2, title: "멘토링 데이", type: "EVENT", place: "IT대 205호" },
    { day: 8, span: 1, title: "아이디어 컨설팅", type: "EVENT", place: "본관 대강당" },
    { day: 15, span: 6, title: "데모데이 준비", type: "WORKSHOP", place: "IT대 401호" },
    { day: 16, span: 4, title: "포스터 제작", type: "EVENT", place: "IT대 205호" },
  ],
};

/**
 * `day`가 1보다 작거나 말일을 넘어도 옳은 날짜를 준다 — `new Date`가 달을 넘겨 보정한다.
 * 그래서 지난달에 시작해 이 달로 넘어오는 일정(10월 목업의 "팀별 빌드업 I")도 만들 수 있다.
 * 문자열을 직접 붙이면 `2026-10-00`·`2026-10-34` 같은 없는 날짜가 나온다.
 */
function isoDate(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

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
        startDate: isoDate(year, month, item.day),
        endDate: isoDate(year, month, item.day + item.span - 1),
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
