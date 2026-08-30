import clsx from "clsx";

import styles from "./ProjectFilterTabs.module.scss";

export const ALL_PROJECTS_FILTER = "전체";

export type ProjectFilterValue = typeof ALL_PROJECTS_FILTER | string;

const SEASON_LABEL: Record<string, string> = { SPRING: "Spring", SUMMER: "Summer", FALL: "Fall", WINTER: "Winter" };

/** `2026-FALL` → `2026 Fall`. BE `ProjectPublicService.toSemesterLabel`과 같은 규칙. */
function formatSemester(semester: string): string {
  const [year, season] = semester.split("-");
  return `${year} ${SEASON_LABEL[season] ?? season}`;
}

interface ProjectFilterTabsProps {
  /** `GET /api/public/projects`가 준, 전체 프로젝트 기준 중복 없는 학기 목록(`2026-FALL` 형태). */
  semesters: string[];
  value: ProjectFilterValue;
  onChange: (value: ProjectFilterValue) => void;
}

export function ProjectFilterTabs({ semesters, value, onChange }: ProjectFilterTabsProps) {
  return (
    <div className={styles.tabs} role="group" aria-label="기수 필터">
      <button
        type="button"
        aria-pressed={value === ALL_PROJECTS_FILTER}
        className={clsx(styles.tab, value === ALL_PROJECTS_FILTER && styles.active)}
        onClick={() => onChange(ALL_PROJECTS_FILTER)}
      >
        {ALL_PROJECTS_FILTER}
      </button>
      {semesters.map((semester) => (
        <button
          key={semester}
          type="button"
          aria-pressed={value === semester}
          className={clsx(styles.tab, value === semester && styles.active)}
          onClick={() => onChange(semester)}
        >
          {formatSemester(semester)}
        </button>
      ))}
    </div>
  );
}
