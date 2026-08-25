import { useState } from "react";

import { ProjectCard } from "../components/project/ProjectCard";
import {
  ALL_PROJECTS_FILTER,
  ProjectFilterTabs,
  type ProjectFilterValue,
} from "../components/project/ProjectFilterTabs";
import { PROJECTS } from "../mocks/project/projects";

import styles from "./ProjectsPage.module.scss";

/** 전체 프로젝트 목록. Figma 와이어프레임(`4:2730`) 기준. */
export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectFilterValue>(ALL_PROJECTS_FILTER);

  const projects =
    filter === ALL_PROJECTS_FILTER ? PROJECTS : PROJECTS.filter((project) => project.semester === filter);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>프로젝트 쇼케이스</h1>
          <p className={styles.subtitle}>GETIT 부원들이 만든 혁신적인 IT 프로젝트들</p>
        </div>

        <ProjectFilterTabs value={filter} onChange={setFilter} />

        <ul className={styles.grid}>
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
