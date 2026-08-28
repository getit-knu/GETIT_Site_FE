import { Link } from "react-router";

import { PROJECTS } from "../../mocks/home/projects";

import styles from "./ProjectShowcase.module.scss";

/**
 * D-Day 지원하기 배지는 이 섹션 안이 아니라 `HomePage`의 `DdayBadge`로 뺐다(#170) —
 * 홈 화면 전체에서 스크롤을 따라다녀야 해서 섹션 하나에 갇혀 있으면 안 된다.
 */
export function ProjectShowcase() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 className={styles.title}>프로젝트 쇼케이스</h2>
          <p className={styles.subtitle}>GETIT 부원들이 만든 프로젝트를 확인해보세요</p>
        </div>

        <ul className={styles.list}>
          {PROJECTS.map((project) => (
            <li key={project.id} className={styles.row}>
              <div className={styles.thumbnail} style={{ backgroundImage: project.gradient }} aria-hidden="true" />
              <div className={styles.content}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <Link to="/projects" className={styles.viewAllLink}>
            모든 프로젝트 보기
            <svg className={styles.viewAllIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
