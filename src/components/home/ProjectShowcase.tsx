import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { getHome } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import { useScrollReveal } from "../../hooks/ui/useScrollReveal";
import type { HomeFeaturedProject } from "../../types/home";

import styles from "./ProjectShowcase.module.scss";

/**
 * 쇼케이스 한 줄. 행마다 각자 뷰포트에 들어올 때 아래에서 떠오른다(UX 라운드 2) —
 * 섹션 단위로 한 번에 나타나면 아래쪽 행들은 정작 보일 때 이미 끝나 있어 행 단위로 건다.
 */
function ShowcaseRow({ project }: { project: HomeFeaturedProject }) {
  const [rowRef, rowRevealed] = useScrollReveal<HTMLLIElement>();

  return (
    <li ref={rowRef} data-revealed={rowRevealed || undefined} className={styles.row}>
      <div
        className={styles.thumbnail}
        style={project.thumbnailUrl ? { backgroundImage: `url(${project.thumbnailUrl})` } : undefined}
        aria-hidden="true"
      />
      <div className={styles.content}>
        <h3 className={styles.projectTitle}>{project.title}</h3>
        <p className={styles.projectDescription}>{project.description}</p>
      </div>
    </li>
  );
}

/**
 * `GET /api/public/home`(#218)의 `featuredProjects` — 어드민에서 `isFeatured`로
 * 표시한 프로젝트만 온다(#222). 팀 이름·기술 스택은 이 미리보기엔 없다(전체 목록
 * `/projects`, #219에만 있음) — 옛 목업도 제목·설명만 보여줬으니 화면은 그대로 맞는다.
 *
 * D-Day 지원하기 배지는 이 섹션 안이 아니라 `HomePage`의 `DdayBadge`로 뺐다(#170) —
 * 홈 화면 전체에서 스크롤을 따라다녀야 해서 섹션 하나에 갇혀 있으면 안 된다.
 */
export function ProjectShowcase() {
  const { data } = useQuery({ queryKey: queryKeys.public.home(), queryFn: getHome });
  const [headingRef, headingRevealed] = useScrollReveal<HTMLDivElement>();
  const projects = data?.featuredProjects ?? [];

  if (projects.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div ref={headingRef} data-revealed={headingRevealed || undefined} className={styles.heading}>
          <h2 className={styles.title}>프로젝트 쇼케이스</h2>
          <p className={styles.subtitle}>GET IT 부원들이 만든 프로젝트를 확인해보세요</p>
        </div>

        <ul className={styles.list}>
          {projects.map((project) => (
            <ShowcaseRow key={project.id} project={project} />
          ))}
        </ul>

        <div className={styles.footer}>
          <Link viewTransition to="/projects" className={styles.viewAllLink}>
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
