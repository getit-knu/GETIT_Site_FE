import clsx from "clsx";

import type { MemberLecture } from "../../mocks/lecture/memberLectures";

import { ALL_LECTURES_FILTER, buildLectureFilterOptions } from "./lectureFilters";
import styles from "./LectureFilterTabs.module.scss";

interface LectureFilterTabsProps {
  lectures: MemberLecture[];
  value: string;
  onChange: (value: string) => void;
}

export function LectureFilterTabs({ lectures, value, onChange }: LectureFilterTabsProps) {
  const options = buildLectureFilterOptions();

  return (
    <div className={styles.tabs} role="group" aria-label="트랙 필터">
      <button
        type="button"
        aria-pressed={value === ALL_LECTURES_FILTER}
        className={clsx(styles.tab, value === ALL_LECTURES_FILTER && styles.active)}
        onClick={() => onChange(ALL_LECTURES_FILTER)}
      >
        전체 ({lectures.length})
      </button>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={value === option.key}
          className={clsx(styles.tab, value === option.key && styles.active)}
          onClick={() => onChange(option.key)}
        >
          {option.label} ({lectures.filter(option.matches).length})
        </button>
      ))}
    </div>
  );
}
