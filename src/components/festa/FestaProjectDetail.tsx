import type { PublicProject } from "../../types/project";
import { Badge } from "../ui/Badge/Badge";
import { Modal, ModalBody } from "../ui/Modal/Modal";
import { useModalTitleId } from "../ui/Modal/modalTitleContext";

import { FestaProjectIcon } from "./FestaProjectIcon";
import styles from "./FestaProjectDetail.module.scss";

/**
 * 링크가 비었는지. 타입은 `string`이지만 BE가 URL을 안 넣은 프로젝트에서 빈 문자열이나
 * `null`이 올 수 있어(springdoc이 nullable을 못 잡는 다른 필드들과 같은 이유) 둘 다 막는다.
 */
function hasUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim() !== "";
}

interface DetailHeaderProps {
  project: PublicProject;
  onClose: () => void;
}

/** `useModalTitleId()`는 `Modal` 자식 트리 안에서만 값이 있다 — `ProjectDetailModal`과 같은 이유로 뺐다. */
function DetailHeader({ project, onClose }: DetailHeaderProps) {
  const titleId = useModalTitleId();

  return (
    <div className={styles.header}>
      <FestaProjectIcon title={project.title} thumbnailUrl={project.thumbnailUrl} size="detail" />
      <div className={styles.headerText}>
        <h2 id={titleId} className={styles.title}>
          {project.title}
        </h2>
        <p className={styles.meta}>
          {project.teamName} <span aria-hidden="true">·</span> {project.semesterLabel}
        </p>
        {hasUrl(project.demoUrl) && (
          <a className={styles.siteLink} href={project.demoUrl} target="_blank" rel="noreferrer">
            사이트 바로가기 <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
        ✕
      </button>
    </div>
  );
}

interface FestaProjectDetailProps {
  project: PublicProject | null;
  onClose: () => void;
}

/**
 * FESTA 쇼케이스 상세(#358). 앱스토어 상세처럼 아이콘 옆에 바로 "사이트 바로가기"를 둔다 —
 * 행사장에서 학생이 가장 먼저 할 행동이 실제 서비스를 써 보는 것이라서다.
 *
 * 모바일은 아래에서 올라오는 바텀시트, 데스크톱은 가운데 모달이다(스타일 파일 참고).
 * `/projects`의 `ProjectDetailModal`에 있는 "작동 사진" 자리는 아직 데이터가 없어 넣지 않았다(#356).
 */
export function FestaProjectDetail({ project, onClose }: FestaProjectDetailProps) {
  return (
    <Modal isOpen={project !== null} onClose={onClose} className={styles.dialog}>
      {project && (
        <ModalBody>
          <span className={styles.handle} aria-hidden="true" />
          <DetailHeader project={project} onClose={onClose} />

          <div className={styles.sections}>
            {project.description && (
              <section>
                <h3 className={styles.sectionTitle}>프로젝트 설명</h3>
                <p className={styles.description}>{project.description}</p>
              </section>
            )}

            {project.techStacks.length > 0 && (
              <section>
                <h3 className={styles.sectionTitle}>기술 스택</h3>
                <ul className={styles.techStack}>
                  {project.techStacks.map((tech) => (
                    <li key={tech}>
                      <Badge variant="accent">{tech}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hasUrl(project.codeUrl) && (
              <a className={styles.codeLink} href={project.codeUrl} target="_blank" rel="noreferrer">
                코드 보기 <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </ModalBody>
      )}
    </Modal>
  );
}
