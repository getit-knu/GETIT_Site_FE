import clsx from "clsx";

import type { ProjectSemester } from "../../types/project";

import styles from "./ProjectFilterTabs.module.scss";

export const ALL_PROJECTS_FILTER = "전체";

export type ProjectFilterValue = typeof ALL_PROJECTS_FILTER | ProjectSemester;

const FILTERS: ProjectFilterValue[] = [ALL_PROJECTS_FILTER, "2025 Fall", "2025 Spring", "2024 Fall"];

interface ProjectFilterTabsProps {
  value: ProjectFilterValue;
  onChange: (value: ProjectFilterValue) => void;
}

export function ProjectFilterTabs({ value, onChange }: ProjectFilterTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="기수 필터">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          role="tab"
          aria-selected={value === filter}
          className={clsx(styles.tab, value === filter && styles.active)}
          onClick={() => onChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
