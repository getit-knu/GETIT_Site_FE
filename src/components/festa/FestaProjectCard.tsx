import type { PublicProject } from "../../types/project";

import { FestaProjectIcon } from "./FestaProjectIcon";
import styles from "./FestaProjectCard.module.scss";

interface FestaProjectCardProps {
  project: PublicProject;
  /** 목록 안 순서(0부터). 출전 번호와 데스크톱 기울기 방향에 쓴다. */
  index: number;
  onSelect: (project: PublicProject) => void;
}

/**
 * FESTA 쇼케이스 카드(#358). 앱스토어 목록처럼 아이콘·이름·짧은 소개를 한 덩어리로 보여준다.
 *
 * 실제 버튼은 "자세히 보기" 하나뿐이고, 그 버튼의 `::after`가 카드 전체를 덮어 어디를
 * 눌러도 상세가 열린다 — 카드를 통째로 `<button>`으로 만들면 안의 제목·설명까지 전부
 * 버튼 이름으로 읽혀서 스크린리더 사용자에게 시끄럽다.
 */
export function FestaProjectCard({ project, index, onSelect }: FestaProjectCardProps) {
  return (
    <li className={styles.item}>
      <article className={styles.card}>
        <div className={styles.top}>
          <FestaProjectIcon title={project.title} thumbnailUrl={project.thumbnailUrl} size="card" />
          <div className={styles.heading}>
            <p className={styles.entry}>
              {String(index + 1).padStart(2, "0")} · {project.teamName}
            </p>
            <h3 className={styles.title}>{project.title}</h3>
          </div>
          <button
            type="button"
            className={styles.more}
            aria-label={`${project.title} 자세히 보기`}
            onClick={() => onSelect(project)}
          >
            자세히 보기
          </button>
        </div>

        {project.description && <p className={styles.description}>{project.description}</p>}

        {project.techStacks.length > 0 && (
          <ul className={styles.techStack}>
            {project.techStacks.map((tech) => (
              <li key={tech} className={styles.chip}>
                {tech}
              </li>
            ))}
          </ul>
        )}
      </article>
    </li>
  );
}
