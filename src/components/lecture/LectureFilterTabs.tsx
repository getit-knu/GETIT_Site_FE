import clsx from "clsx";

import type { MemberTrack } from "../../types/lecture";

import { ALL_LECTURES_FILTER, buildLectureFilterOptions } from "./lectureFilters";
import styles from "./LectureFilterTabs.module.scss";

interface LectureFilterTabsProps {
  tracks: MemberTrack[];
  value: string;
  onChange: (value: string) => void;
}

/** 개수 배지는 없다 — 소분류 기준 개수(`tabs[].count`)뿐이라 소분류 없는 트랙엔 값이 없다. */
export function LectureFilterTabs({ tracks, value, onChange }: LectureFilterTabsProps) {
  const options = buildLectureFilterOptions(tracks);

  return (
    <div className={styles.tabs} role="group" aria-label="트랙 필터">
      <button
        type="button"
        aria-pressed={value === ALL_LECTURES_FILTER}
        className={clsx(styles.tab, value === ALL_LECTURES_FILTER && styles.active)}
        onClick={() => onChange(ALL_LECTURES_FILTER)}
      >
        전체
      </button>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={value === option.key}
          className={clsx(styles.tab, value === option.key && styles.active)}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
