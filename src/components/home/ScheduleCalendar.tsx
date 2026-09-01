import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type WheelEvent } from "react";

import { getEvents } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import type { SiteEventType } from "../../types/site";
import { Badge } from "../ui/Badge/Badge";

import styles from "./ScheduleCalendar.module.scss";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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
 * Home 일정 캘린더(#220). `GET /api/public/events?year=&month=`로 연동한다.
 *
 * 좌우 버튼, 하단 점, 캘린더 위 휠 스크롤로 달을 넘길 수 있다 — 연말·연초를 넘기면
 * 연도도 함께 넘어간다(옛 목업은 2026년 한 해만 순환했다).
 */
export function ScheduleCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const lastWheelAt = useRef(0);

  const month = monthIndex + 1;
  const { data } = useQuery({ queryKey: queryKeys.public.events(year, month), queryFn: () => getEvents(year, month) });
  const events = data?.events ?? [];

  // 하루짜리든 여러 날짜에 걸치든, 이 달 범위 안에 걸리는 날을 전부 켠다.
  const highlightedDays = new Set<number>();
  for (const event of events) {
    const start = event.startDate < `${year}-${String(month).padStart(2, "0")}-01` ? 1 : dayOf(event.startDate);
    const lastDay = daysInMonth(year, monthIndex);
    const endCap = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const end = event.endDate > endCap ? lastDay : dayOf(event.endDate);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    for (let d = start; d <= end; d++) highlightedDays.add(d);
  }

  /**
   * 함수형 업데이터를 쓴다 — 이전 달/다음 달 버튼을 빠르게 연달아 누르면 리렌더가 따라오기
   * 전에 두 클릭이 같은 monthIndex 값을 캡처해 둘 다 같은 달로 이동해 버린다.
   */
  function stepMonth(delta: number) {
    setMonthIndex((current) => {
      const total = current + delta;
      const next = ((total % 12) + 12) % 12;
      const yearDelta = Math.floor(total / 12);
      if (yearDelta !== 0) setYear((y) => y + yearDelta);
      return next;
    });
  }

  function goToMonth(index: number) {
    setMonthIndex(index);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    // 트랙패드는 스크롤 한 번에 휠 이벤트를 여러 번 쏘아서, 너무 잦은 이벤트는 걸러낸다.
    const nowMs = Date.now();
    if (nowMs - lastWheelAt.current < 500) return;
    lastWheelAt.current = nowMs;

    event.preventDefault();
    stepMonth(event.deltaY > 0 ? 1 : -1);
  }

  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekday(year, monthIndex) }, () => null),
    ...Array.from({ length: daysInMonth(year, monthIndex) }, (_, index) => index + 1),
  ];

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.eventsCard}>
          <div className={styles.eventsHeader}>
            <div>
              <h3 className={styles.eventsTitle}>
                {year}년 {month}월
              </h3>
              <p className={styles.eventsSubtitle}>GET IT 활동 일정</p>
            </div>
            <div className={styles.monthBadge}>
              <span className={styles.monthNumber}>{month}</span>
              <span className={styles.monthLabel}>MONTH</span>
            </div>
          </div>

          {events.length > 0 ? (
            <ul className={styles.eventList}>
              {events.map((event) => (
                <li key={event.id} className={styles.eventItem}>
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

        <div className={styles.calendarCard} onWheel={handleWheel}>
          <div className={styles.calendarHeader}>
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

            <div className={styles.dateGrid}>
              {calendarCells.map((date, index) =>
                date === null ? (
                  <span key={`empty-${index}`} />
                ) : (
                  <span key={date} className={highlightedDays.has(date) ? styles.dateActive : styles.date}>
                    {date}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className={styles.pagination}>
            {Array.from({ length: 12 }, (_, index) => (
              <button
                key={index}
                type="button"
                className={index === monthIndex ? styles.dotActive : styles.dot}
                aria-label={`${index + 1}월로 이동`}
                aria-current={index === monthIndex}
                onClick={() => goToMonth(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
