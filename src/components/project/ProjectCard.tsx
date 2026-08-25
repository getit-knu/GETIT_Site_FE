import type { MouseEvent } from "react";

import type { Project } from "../../types/project";
import { Badge } from "../ui/Badge/Badge";
import { Card } from "../ui/Card/Card";

import styles from "./ProjectCard.module.scss";

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

/**
 * `onClick`은 지금은 아무도 넘기지 않는다. 카드 클릭 시 상세 모달을 여는 동작은
 * 후속 이슈(프로젝트 상세 모달)에서 연결한다.
 */
export function ProjectCard({ project, onClick }: ProjectCardProps) {
  function stopPropagation(event: MouseEvent) {
    // 코드 · 데모는 카드 자체와 다른 동작(외부 이동)이라, 카드 클릭(모달 열기)이 같이 발동하면 안 된다.
    event.stopPropagation();
  }

  return (
    <Card className={styles.card} onClick={onClick}>
      <div className={styles.thumbnail} style={{ backgroundImage: project.gradient }} aria-hidden="true" />

      <div className={styles.content}>
        <p className={styles.meta}>
          {project.team} <span aria-hidden="true">·</span> {project.semester}
        </p>
        <h3 className={styles.title}>{project.title}</h3>
        <p className={styles.description}>{project.description}</p>

        <ul className={styles.techStack}>
          {project.techStack.map((tech) => (
            <li key={tech}>
              <Badge variant="accent">{tech}</Badge>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <a
            className={styles.codeLink}
            href={project.codeUrl}
            target="_blank"
            rel="noreferrer"
            onClick={stopPropagation}
          >
            <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M6 4.5L2 9L6 13.5M12 4.5L16 9L12 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            코드
          </a>
          <a
            className={styles.demoLink}
            href={project.demoUrl}
            target="_blank"
            rel="noreferrer"
            onClick={stopPropagation}
          >
            <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M7.5 4.5H4.5C3.94772 4.5 3.5 4.94772 3.5 5.5V13.5C3.5 14.0523 3.94772 14.5 4.5 14.5H12.5C13.0523 14.5 13.5 14.0523 13.5 13.5V10.5M10.5 3.5H14.5V7.5M14 4L8 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            데모
          </a>
        </div>
      </div>
    </Card>
  );
}
