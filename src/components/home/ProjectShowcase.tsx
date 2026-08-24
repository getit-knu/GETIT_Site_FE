import { PROJECTS } from "../../mocks/home/projects";

import styles from "./ProjectShowcase.module.scss";

/**
 * "모든 프로젝트 보기" · "지원하기"는 프로젝트 목록 · 지원하기 페이지가 아직 없어
 * Nav와 같은 이유로 클릭되지 않는 텍스트로 둔다.
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
          <span className={styles.viewAllLink}>
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
          </span>

          <div className={styles.applyBadge}>
            <span className={styles.ddayLabel}>D-DAY</span>
            <span className={styles.applyCta}>
              지원하기
              <svg className={styles.applyIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
