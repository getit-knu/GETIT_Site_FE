import { useRef, useState, type WheelEvent } from "react";

import { SCHEDULE_2026 } from "../../mocks/home/schedule";
import type { ScheduleEventTag } from "../../types/home";
import { Badge } from "../ui/Badge/Badge";

import styles from "./ScheduleCalendar.module.scss";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const YEAR = 2026;

const TAG_BADGE_VARIANT: Record<ScheduleEventTag, "accent" | "info"> = {
  event: "accent",
  seminar: "info",
};

/** monthIndex는 0~11(0=1월). 다음 달 0일 = 이번 달 마지막 날이라 말일수를 바로 구한다. */
function daysInMonth(monthIndex: number) {
  return new Date(YEAR, monthIndex + 1, 0).getDate();
}

function firstWeekday(monthIndex: number) {
  return new Date(YEAR, monthIndex, 1).getDay();
}

/**
 * Home 일정 캘린더. 실제 일정 API 연동 전까지 2026년 목업 데이터(mocks/home/schedule.ts)를
 * 월 단위로 보여준다. 좌우 버튼, 하단 점, 캘린더 위 휠 스크롤로 달을 넘길 수 있다.
 */
export function ScheduleCalendar() {
  const [monthIndex, setMonthIndex] = useState(0);
  const lastWheelAt = useRef(0);

  const month = monthIndex + 1;
  const events = SCHEDULE_2026[monthIndex]?.events ?? [];
  const highlightedDays = new Set(events.map((event) => event.day));

  /**
   * 함수형 업데이터를 쓴다 — 이전 달/다음 달 버튼을 빠르게 연달아 누르면 리렌더가 따라오기
   * 전에 두 클릭이 같은 monthIndex 값을 캡처해 둘 다 같은 달로 이동해 버린다.
   */
  function stepMonth(delta: number) {
    setMonthIndex((current) => (((current + delta) % 12) + 12) % 12);
  }

  function goToMonth(index: number) {
    setMonthIndex(index);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    // 트랙패드는 스크롤 한 번에 휠 이벤트를 여러 번 쏘아서, 너무 잦은 이벤트는 걸러낸다.
    const now = Date.now();
    if (now - lastWheelAt.current < 500) return;
    lastWheelAt.current = now;

    event.preventDefault();
    stepMonth(event.deltaY > 0 ? 1 : -1);
  }

  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekday(monthIndex) }, () => null),
    ...Array.from({ length: daysInMonth(monthIndex) }, (_, index) => index + 1),
  ];

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.eventsCard}>
          <div className={styles.eventsHeader}>
            <div>
              <h3 className={styles.eventsTitle}>
                {YEAR}년 {month}월
              </h3>
              <p className={styles.eventsSubtitle}>GETIT 활동 일정</p>
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
                  <span className={styles.eventDay}>{event.day}</span>
                  <div>
                    <h4 className={styles.eventTitle}>{event.title}</h4>
                    <p className={styles.eventDate}>{event.date}</p>
                    <Badge variant={TAG_BADGE_VARIANT[event.tag]}>{event.tag}</Badge>
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
              ‹
            </button>
            <div>
              <p className={styles.calendarMonth}>{month}월</p>
              <p className={styles.calendarYear}>{YEAR}</p>
            </div>
            <button type="button" className={styles.navButton} aria-label="다음 달" onClick={() => stepMonth(1)}>
              ›
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
            {SCHEDULE_2026.map((item, index) => (
              <button
                key={item.month}
                type="button"
                className={index === monthIndex ? styles.dotActive : styles.dot}
                aria-label={`${item.month}월로 이동`}
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
