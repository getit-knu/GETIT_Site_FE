/**
 * 모의투자 FESTA(#351) 행사 문구. 행사용 한시 화면이라 어드민 설정 대신 상수로 둔다 —
 * 날짜·부제가 확정되면 이 값만 바꾸면 된다.
 */
export const FESTA_EVENT = {
  dateLabel: "11.23 – 11.29",
  subtitle: "부원들이 직접 만든 서비스를 써 보고, 마음에 드는 팀을 골라 주세요.",
} as const;

const SEASON_ORDER: Record<string, number> = { SPRING: 0, SUMMER: 1, FALL: 2, WINTER: 3 };

const SEMESTER_PATTERN = /^(\d{4})-(SPRING|SUMMER|FALL|WINTER)$/;

function semesterRank(semester: string): number | null {
  const match = SEMESTER_PATTERN.exec(semester);
  if (match === null) return null;
  return Number(match[1]) * 10 + SEASON_ORDER[match[2]];
}

/**
 * `GET /api/public/projects`의 `semesters`(`2026-FALL` 꼴) 중 가장 최근 학기를 고른다.
 * BE(`findDistinctSemestersByStatus`)가 `semester desc`로 주긴 하지만 **문자열 정렬**이라 같은 해 안에서
 * 겨울>여름>봄>가을 순이 된다 — 연도 → 계절(봄<여름<가을<겨울) 순으로 직접 비교한다. 형식이 어긋난 값은 건너뛴다.
 */
export function pickLatestSemester(semesters: readonly string[]): string | null {
  let latest: string | null = null;
  let latestRank = -1;
  for (const semester of semesters) {
    const rank = semesterRank(semester);
    if (rank !== null && rank > latestRank) {
      latest = semester;
      latestRank = rank;
    }
  }
  return latest;
}
