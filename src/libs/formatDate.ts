/**
 * 서버는 ISO 8601 문자열을 준다. 화면에는 한국 시간으로 표기한다.
 *
 * `toLocaleString` 을 그대로 쓰면 사용자의 OS 로캘·시간대를 따라가 사람마다 다르게 보인다.
 * 운영진이 같은 목록을 보고 이야기하는 화면이라 표기를 고정한다.
 */
const FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return FORMATTER.format(date);
}
