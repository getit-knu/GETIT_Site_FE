import { Badge } from "../ui/Badge/Badge";

import styles from "./ScheduleCalendar.module.scss";

interface ScheduleEvent {
  id: string;
  day: number;
  title: string;
  date: string;
  tag: string;
}

const EVENTS: ScheduleEvent[] = [
  { id: "new-year-gathering", day: 5, title: "신년 모임", date: "1월 5일", tag: "event" },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 실제 일정 API 연동 전까지는 2026년 1월을 정적으로 보여준다. 1일이 목요일부터 시작해
// 앞 4칸은 비워둔다.
const CALENDAR_CELLS: Array<number | null> = [
  null,
  null,
  null,
  null,
  ...Array.from({ length: 31 }, (_, index) => index + 1),
];

const HIGHLIGHTED_DAY = 5;
const PAGINATION_DOT_COUNT = 12;

/** Home 일정 캘린더. 실제 일정 API 연동은 별도 이슈에서 진행하고 지금은 목업 데이터만 보여준다. */
export function ScheduleCalendar() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.eventsCard}>
          <div className={styles.eventsHeader}>
            <div>
              <h3 className={styles.eventsTitle}>2026년 1월</h3>
              <p className={styles.eventsSubtitle}>GETIT 활동 일정</p>
            </div>
            <div className={styles.monthBadge}>
              <span className={styles.monthNumber}>1</span>
              <span className={styles.monthLabel}>MONTH</span>
            </div>
          </div>

          <ul className={styles.eventList}>
            {EVENTS.map((event) => (
              <li key={event.id} className={styles.eventItem}>
                <span className={styles.eventDay}>{event.day}</span>
                <div>
                  <h4 className={styles.eventTitle}>{event.title}</h4>
                  <p className={styles.eventDate}>{event.date}</p>
                  <Badge variant="accent">{event.tag}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <p className={styles.calendarMonth}>1월</p>
            <p className={styles.calendarYear}>2026</p>
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
              {CALENDAR_CELLS.map((date, index) =>
                date === null ? (
                  <span key={`empty-${index}`} />
                ) : (
                  <span key={date} className={date === HIGHLIGHTED_DAY ? styles.dateActive : styles.date}>
                    {date}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className={styles.pagination} aria-hidden="true">
            {Array.from({ length: PAGINATION_DOT_COUNT }, (_, index) => (
              <span key={index} className={index === 0 ? styles.dotActive : styles.dot} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
