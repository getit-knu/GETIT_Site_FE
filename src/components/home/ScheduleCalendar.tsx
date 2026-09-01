import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type CSSProperties, type WheelEvent } from "react";

import { getEvents } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import { useScrollReveal } from "../../hooks/ui/useScrollReveal";
import { prefersReducedMotion } from "../../libs/prefersReducedMotion";
import type { PublicEvent, SiteEventType } from "../../types/site";
import { Badge } from "../ui/Badge/Badge";

import styles from "./ScheduleCalendar.module.scss";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 겹친 일정을 몇 줄까지 얇은 선으로 그릴지. 넘치는 만큼은 날짜 버튼의 `aria-label` 개수로만
 * 알린다 — 48px 칸에 네 줄 이상을 밀어 넣으면 선끼리 붙어 오히려 한 덩어리로 보인다.
 *
 * `.module.scss`의 `--lane-*` 값들이 이 수를 전제로 칸 아래 자리를 비운다. 늘리려면 양쪽을
 * 같이 고쳐야 한다.
 */
const MAX_LANES = 3;

/** 불러오는 동안 세워 둘 뼈대 줄 수. 흔한 달의 일정 수에 맞춰 카드 높이가 크게 안 튀는 값. */
const SKELETON_ROWS = [0, 1, 2];

/** 사이트 관리(#194)의 `EventsSection`과 같은 표기·톤. */
const TYPE_LABEL: Record<SiteEventType, string> = { COMPETITION: "대회", WORKSHOP: "워크숍", EVENT: "행사" };
const TYPE_BADGE_VARIANT: Record<SiteEventType, "accent" | "info" | "neutral"> = {
  COMPETITION: "accent",
  WORKSHOP: "info",
  EVENT: "neutral",
};

/** `monthIndex`는 0~11(0=1월). 다음 달 0일 = 이번 달 마지막 날이라 말일수를 바로 구한다. */
function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function firstWeekday(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay();
}

/** `2026-01-05` → 5. 형태가 어긋나면 `NaN`(호출부가 `Number.isNaN`으로 거른다). */
function dayOf(dateStr: string): number {
  const day = Number(dateStr.slice(8, 10));
  return Number.isInteger(day) ? day : NaN;
}

/**
 * 절대 월수(0년 1월 = 0)를 연·월로 되돌린다. 음수 나머지를 보정해 기원전으로 넘어가는 쪽에서도
 * `monthIndex`가 0~11에 머문다.
 */
function monthCursor(totalMonths: number) {
  return { year: Math.floor(totalMonths / 12), monthIndex: ((totalMonths % 12) + 12) % 12 };
}

/** 날짜 칸에 그릴 얇은 선 한 줄. 한 날에 일정이 겹치면 이런 줄이 여러 개 쌓인다. */
type DayLane = {
  event: PublicEvent;
  /** 왼쪽 목록에서의 순서. 날을 눌렀을 때 어느 일정으로 데려갈지 고르는 기준. */
  order: number;
  /** 위에서 몇 번째 줄인지. 여러 날 일정이 날마다 같은 줄에 머물러야 하나의 긴 선으로 읽힌다. */
  lane: number;
  /** 이웃 칸의 **같은 일정** 선과 맞닿는가. 칸이 아니라 선마다 판단해야 거짓말을 안 한다. */
  connectLeft: boolean;
  connectRight: boolean;
};

/**
 * 이 달에 걸치는 일정을 날짜별 "줄(lane)"로 눕힌다.
 *
 * 예전엔 한 날에 일정 하나만 남기고 나머지를 버려서(`if (!map.has(day))`), 프로덕션 10월처럼
 * 9/14~10/20 워크숍이 달을 가로지르는 경우 그 아래 겹친 일정 두 개가 캘린더에 아예 나타나지
 * 않았다. 게다가 켜진 20일이 두꺼운 알약 하나로 이어져 날짜 숫자까지 덮었다.
 *
 * 줄 배정은 구글·노션 캘린더와 같은 그리디 방식이다 — 시작일 순으로(같은 날 시작이면 긴 일정
 * 먼저) 훑으며, 겹치는 일정이 차지하지 않은 **가장 위 줄**에 넣는다. 그래서 (1) 여러 날 일정이
 * 날마다 같은 줄에 머물러 하나의 긴 선으로 읽히고, (2) 줄 수는 최대 동시 겹침 수만큼만 쓴다.
 */
function buildDayLanes(events: PublicEvent[], year: number, monthIndex: number) {
  const lastDay = daysInMonth(year, monthIndex);
  const month = String(monthIndex + 1).padStart(2, "0");
  const monthStart = `${year}-${month}-01`;
  const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

  // 달 경계로 자른 구간. 지난달에 시작한 일정은 1일부터, 다음 달까지 가는 일정은 말일까지 걸친다.
  const spans: Array<{ event: PublicEvent; order: number; start: number; end: number }> = [];
  events.forEach((event, order) => {
    const start = event.startDate < monthStart ? 1 : dayOf(event.startDate);
    const end = event.endDate > monthEnd ? lastDay : dayOf(event.endDate);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return;
    spans.push({ event, order, start, end });
  });

  // 같은 날 시작이면 긴 일정을 위 줄로 — 달을 통째로 가로지르는 일정이 맨 윗줄에 놓여야
  // 아래 줄의 짧은 일정들이 그 위를 오르내리지 않는다.
  spans.sort((a, b) => a.start - b.start || b.end - a.end || a.order - b.order);

  // laneEnds[i] = i번째 줄이 지금까지 차지한 마지막 날. 시작일 순으로 훑으니, 그 날보다 앞에서
  // 끝난 줄은 다시 비어 있는 셈이다.
  const laneEnds: number[] = [];
  const lanesByDay = new Map<number, DayLane[]>();

  for (const span of spans) {
    const reusable = laneEnds.findIndex((end) => end < span.start);
    const lane = reusable === -1 ? laneEnds.length : reusable;
    laneEnds[lane] = span.end;

    for (let day = span.start; day <= span.end; day++) {
      // 주가 바뀌면 줄이 갈리니 일요일의 왼쪽·토요일의 오른쪽은 잇지 않는다.
      const weekday = new Date(year, monthIndex, day).getDay();
      const lanes = lanesByDay.get(day) ?? [];
      lanes.push({
        event: span.event,
        order: span.order,
        lane,
        connectLeft: day > span.start && weekday !== 0,
        connectRight: day < span.end && weekday !== 6,
      });
      lanesByDay.set(day, lanes);
    }
  }

  return lanesByDay;
}

/**
 * Home 일정 캘린더(#220). `GET /api/public/events?year=&month=`로 연동한다.
 *
 * 좌우 버튼, 헤더의 "오늘" 버튼, 캘린더 위 휠 스크롤로 달을 넘길 수 있다 — 연말·연초를
 * 넘기면 연도도 함께 넘어간다(옛 목업은 2026년 한 해만 순환했다). 하단 12개월 점 페이지네이션은
 * 좌우 화살표와 기능이 겹치고 시각 소음만 더해 제거했다(대신 "오늘" 버튼으로 복귀).
 */
export function ScheduleCalendar() {
  const now = new Date();
  /**
   * 보고 있는 달. 연·월을 **한 덩어리로** 들고 있는다.
   *
   * 예전엔 `year`·`monthIndex`를 따로 두고, 연도가 넘어갈 때 `setMonthIndex` 업데이터 **안에서**
   * `setYear`를 불렀다. 업데이터는 순수해야 하는데 그 자리에서 다른 상태를 갱신하면 부작용이다 —
   * StrictMode(앱은 `main.tsx`에서 켜 둔다)가 업데이터를 두 번 호출하면서 `setYear`도 두 번
   * 걸려 연도가 2년씩 뛰었다(2026년 12월에서 한 칸 넘기면 2028년 1월).
   */
  const [cursor, setCursor] = useState(() => ({ year: now.getFullYear(), monthIndex: now.getMonth() }));
  const { year, monthIndex } = cursor;
  // 달 넘김 방향. 날짜 그리드가 이동 방향에서 미끄러져 들어오는 애니메이션의 기준(UX 라운드 2).
  const [direction, setDirection] = useState<"next" | "prev">("next");
  // 달력에서 고른 날. 그 날에 걸린 일정을 왼쪽 목록에서 짚어 준다.
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const lastWheelAt = useRef(0);
  const eventListRef = useRef<HTMLUListElement>(null);
  const [eventsCardRef, eventsCardRevealed] = useScrollReveal<HTMLDivElement>();
  const [calendarCardRef, calendarCardRevealed] = useScrollReveal<HTMLDivElement>();

  const month = monthIndex + 1;
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.public.events(year, month),
    queryFn: () => getEvents(year, month),
  });
  const events = data?.events ?? [];

  // 하루짜리든 여러 날짜에 걸치든, 이 달 범위 안에 걸리는 날을 전부 켠다. 한 날에 여러 일정이
  // 겹치면 줄(lane)을 나눠 **전부** 들고 있는다 — 켜진 날은 눌러서 왼쪽 목록으로 갈 수 있어야
  // 하므로 어느 일정인지도 함께 남는다.
  const lanesByDay = buildDayLanes(events, year, monthIndex);

  /**
   * 함수형 업데이터를 쓴다 — 이전 달/다음 달 버튼을 빠르게 연달아 누르면 리렌더가 따라오기
   * 전에 두 클릭이 같은 값을 캡처해 둘 다 같은 달로 이동해 버린다.
   *
   * 연·월을 절대 월수(`year * 12 + monthIndex`)로 환산해 **한 번에** 계산한다. 업데이터 안에서
   * 다른 setter를 부르지 않으므로 몇 번을 호출해도 결과가 같다.
   */
  function stepMonth(delta: number) {
    setDirection(delta > 0 ? "next" : "prev");
    setSelectedDay(null);
    setCursor((current) => monthCursor(current.year * 12 + current.monthIndex + delta));
  }

  /** 헤더의 "오늘" 버튼 — 몇 달을 넘겨봤든 오늘이 속한 달로 바로 돌아온다. */
  function goToToday() {
    // 과거를 보고 있었으면 앞으로(next), 미래를 보고 있었으면 뒤로(prev) 미끄러진다.
    setDirection(year * 12 + monthIndex < now.getFullYear() * 12 + now.getMonth() ? "next" : "prev");
    setSelectedDay(null);
    setCursor({ year: now.getFullYear(), monthIndex: now.getMonth() });
  }

  /**
   * 일정이 있는 날을 누르면 왼쪽 목록에서 그 일정으로 스크롤하고 짚어 준다.
   *
   * `scrollIntoView` 대신 목록의 `scrollTop`을 직접 옮긴다 — `scrollIntoView`는 조상까지
   * 따라 스크롤해서, 목록 안만 움직이면 될 상황에 페이지 전체가 딸려 움직인다.
   */
  function selectDay(day: number) {
    setSelectedDay(day);

    // 겹친 날이면 목록에서 위에 오는(= `order`가 가장 작은) 일정으로 데려간다. 줄 순서는
    // 긴 일정을 위로 올리느라 목록 순서와 다를 수 있으니 `lane`이 아니라 `order`로 고른다.
    const first = lanesByDay.get(day)?.reduce((top, lane) => (lane.order < top.order ? lane : top));
    const list = eventListRef.current;
    const target = list?.querySelector<HTMLElement>(`[data-event-id="${first?.event.id}"]`);
    if (list === null || !target) return;

    const top = target.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    list.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    // 트랙패드는 스크롤 한 번에 휠 이벤트를 여러 번 쏘아서, 너무 잦은 이벤트는 걸러낸다.
    const nowMs = Date.now();
    if (nowMs - lastWheelAt.current < 500) return;
    lastWheelAt.current = nowMs;

    event.preventDefault();
    stepMonth(event.deltaY > 0 ? 1 : -1);
  }

  const leadingBlanks = firstWeekday(year, monthIndex);
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth(year, monthIndex) }, (_, index) => index + 1),
  ];

  // 오늘 링 표시용 — 지금 보고 있는 달이 실제 오늘이 속한 달일 때만 날짜가 의미를 가진다.
  const isCurrentMonth = year === now.getFullYear() && monthIndex === now.getMonth();

  /** 캘린더에서 고른 날에 이 일정이 걸려 있는지 — 목록에서도 그 줄들을 함께 짚어 준다. */
  function isOnSelectedDay(eventId: number) {
    if (selectedDay === null) return false;
    return lanesByDay.get(selectedDay)?.some((lane) => lane.event.id === eventId) === true;
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div ref={eventsCardRef} data-revealed={eventsCardRevealed || undefined} className={styles.eventsCard}>
          {/* 오른쪽에 큰 숫자로 달을 한 번 더 보여주는 배지가 있었는데, 바로 옆 제목이 이미
              "2026년 8월"이라고 말하고 있어 같은 말을 두 번 하는 자리였다 — 걷어냈다. */}
          <div className={styles.eventsHeader}>
            <h3 className={styles.eventsTitle}>
              {year}년 {month}월
            </h3>
            <p className={styles.eventsSubtitle}>GET IT 활동 일정</p>
          </div>

          {/* 불러오는 중과 "정말 일정이 없음"을 갈라 놓는다. 예전엔 둘 다 `events.length === 0`
              으로 뭉뚱그려, 달을 넘길 때마다 "일정이 없습니다"가 한 번 번쩍인 뒤 목록이 다시
              채워졌다 — 아직 모르는 것을 없다고 단정한 셈이라 눈에도 걸리고 사실도 아니었다.
              자리를 그대로 차지하는 뼈대를 대신 세워 카드 높이도 튀지 않게 한다. */}
          {isPending ? (
            <ul className={styles.eventList} aria-busy="true" aria-label="일정 불러오는 중">
              {SKELETON_ROWS.map((row) => (
                <li key={row} className={styles.eventSkeleton} />
              ))}
            </ul>
          ) : isError ? (
            <p className={styles.emptyState}>일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          ) : events.length > 0 ? (
            <ul className={styles.eventList} ref={eventListRef}>
              {events.map((event, index) => (
                <li
                  key={event.id}
                  className={styles.eventItem}
                  data-event-id={event.id}
                  data-selected={isOnSelectedDay(event.id) || undefined}
                  style={{ "--reveal-index": index } as CSSProperties}
                >
                  <span className={styles.eventDay}>{dayOf(event.startDate)}</span>
                  <div>
                    <h4 className={styles.eventTitle}>{event.title}</h4>
                    <p className={styles.eventDate}>
                      {event.startDate}
                      {event.endDate !== event.startDate && ` ~ ${event.endDate}`}
                    </p>
                    <Badge variant={TYPE_BADGE_VARIANT[event.type]}>{TYPE_LABEL[event.type]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>이 달에는 예정된 일정이 없습니다.</p>
          )}
        </div>

        <div
          ref={calendarCardRef}
          data-revealed={calendarCardRevealed || undefined}
          className={styles.calendarCard}
          onWheel={handleWheel}
        >
          <div className={styles.calendarHeader}>
            <div className={styles.calendarNavGroup}>
              <button type="button" className={styles.navButton} aria-label="이전 달" onClick={() => stepMonth(-1)}>
                <ChevronLeft aria-hidden="true" />
              </button>
              <div>
                <p className={styles.calendarMonth}>{month}월</p>
                <p className={styles.calendarYear}>{year}</p>
              </div>
              <button type="button" className={styles.navButton} aria-label="다음 달" onClick={() => stepMonth(1)}>
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
            {/* WCAG 2.5.3: aria-label은 화면에 보이는 텍스트("오늘")를 그대로 포함해야 한다 —
                이전엔 "이번 달로 이동"이라 시각 라벨과 완전히 달라 음성 입력 사용자가 "오늘을
                클릭"이라 말해도 매칭되지 않았다. */}
            <button type="button" className={styles.todayButton} aria-label="오늘로 이동" onClick={goToToday}>
              오늘
            </button>
          </div>

          <div className={styles.calendarBody}>
            <div className={styles.weekdayRow}>
              {WEEKDAYS.map((day, index) => (
                <span
                  key={day}
                  className={styles.weekday}
                  data-sunday={index === 0 || undefined}
                  data-saturday={index === 6 || undefined}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* key로 달마다 다시 그려 이동 방향에서 미끄러져 들어오게 한다 — 휠·버튼 어느 쪽으로
                넘겨도 "어느 방향으로 이동했는지"가 눈에 남는다. */}
            <div key={`${year}-${monthIndex}`} className={styles.dateGrid} data-direction={direction}>
              {calendarCells.map((date, index) => {
                if (date === null) return <span key={`empty-${index}`} />;

                const today = (isCurrentMonth && date === now.getDate()) || undefined;
                const lanes = lanesByDay.get(date);
                if (lanes === undefined) {
                  return (
                    <span key={date} className={styles.date} data-today={today}>
                      <span className={styles.dateNumber}>{date}</span>
                    </span>
                  );
                }

                // 일정이 걸린 날만 누를 수 있다 — 빈 날은 눌러도 갈 곳이 없으니 버튼으로 만들지 않는다.
                return (
                  <button
                    key={date}
                    type="button"
                    className={styles.date}
                    data-active
                    data-today={today}
                    data-selected={date === selectedDay || undefined}
                    aria-label={`${month}월 ${date}일 일정 ${lanes.length}개 보기`}
                    onClick={() => selectDay(date)}
                  >
                    <span className={styles.dateNumber}>{date}</span>
                    {/* 얇은 선 자체는 장식이다 — 몇 개 걸렸는지는 위 aria-label이 말한다. */}
                    <span className={styles.laneStrip} aria-hidden="true">
                      {lanes
                        .filter((lane) => lane.lane < MAX_LANES)
                        .map((lane) => (
                          <span
                            key={lane.event.id}
                            className={styles.lane}
                            data-lane={lane.lane}
                            data-event-id={lane.event.id}
                            data-type={lane.event.type}
                            data-connect-left={lane.connectLeft || undefined}
                            data-connect-right={lane.connectRight || undefined}
                          />
                        ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
