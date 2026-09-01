import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type CSSProperties, type WheelEvent } from "react";

import { getEvents } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import { useScrollReveal } from "../../hooks/ui/useScrollReveal";
import { prefersReducedMotion } from "../../libs/prefersReducedMotion";
import type { SiteEventType } from "../../types/site";
import { Badge } from "../ui/Badge/Badge";

import styles from "./ScheduleCalendar.module.scss";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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

  // 하루짜리든 여러 날짜에 걸치든, 이 달 범위 안에 걸리는 날을 전부 켠다.
  // 켜진 날은 눌러서 왼쪽 목록의 해당 일정으로 갈 수 있어야 하므로, 날짜 → 일정 id도 함께 만든다.
  // 한 날에 여러 일정이 겹치면 먼저 시작한(= 목록에서 위에 오는) 쪽으로 보낸다.
  const eventIdByDay = new Map<number, number>();
  for (const event of events) {
    const start = event.startDate < `${year}-${String(month).padStart(2, "0")}-01` ? 1 : dayOf(event.startDate);
    const lastDay = daysInMonth(year, monthIndex);
    const endCap = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const end = event.endDate > endCap ? lastDay : dayOf(event.endDate);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    for (let d = start; d <= end; d++) if (!eventIdByDay.has(d)) eventIdByDay.set(d, event.id);
  }

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

    const list = eventListRef.current;
    const target = list?.querySelector<HTMLElement>(`[data-event-id="${eventIdByDay.get(day)}"]`);
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

  /**
   * 이웃한 날이 **같은 일정**으로 이어지는지. 이어지면 두 칸의 강조가 하나의 긴 알약처럼 붙는다.
   *
   * 하루짜리 일정 두 개가 우연히 붙어 있는 경우까지 이으면 하나의 긴 일정처럼 보여 거짓말이 되므로,
   * 같은 `id`일 때만 잇는다. 주가 바뀌면 줄이 갈리니 일요일의 왼쪽·토요일의 오른쪽은 잇지 않는다.
   */
  function connects(day: number, side: -1 | 1) {
    const weekday = (leadingBlanks + day - 1) % 7;
    if (side === -1 && weekday === 0) return false;
    if (side === 1 && weekday === 6) return false;
    const id = eventIdByDay.get(day);
    return id !== undefined && eventIdByDay.get(day + side) === id;
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
                if (!eventIdByDay.has(date)) {
                  return (
                    <span key={date} className={styles.date} data-today={today}>
                      {date}
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
                    data-connect-left={connects(date, -1) || undefined}
                    data-connect-right={connects(date, 1) || undefined}
                    aria-label={`${month}월 ${date}일 일정 보기`}
                    onClick={() => selectDay(date)}
                  >
                    {date}
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
