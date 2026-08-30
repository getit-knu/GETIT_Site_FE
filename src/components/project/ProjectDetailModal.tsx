import type { PublicProject } from "../../types/project";
import { Badge } from "../ui/Badge/Badge";
import { Modal, ModalBody } from "../ui/Modal/Modal";
import { useModalTitleId } from "../ui/Modal/modalTitleContext";

import styles from "./ProjectDetailModal.module.scss";

interface DetailHeaderProps {
  project: PublicProject;
  onClose: () => void;
}

/**
 * `Modal`이 만든 제목 id는 `Modal`의 자식 트리에서만 유효하다. `ProjectDetailModal`
 * 최상위에서 바로 `useModalTitleId()`를 부르면 `undefined`가 나와서, 그 트리 안에
 * 실제로 얹히는 작은 컴포넌트로 따로 뺐다.
 */
function DetailHeader({ project, onClose }: DetailHeaderProps) {
  const titleId = useModalTitleId();

  return (
    <div className={styles.headerRow}>
      <div className={styles.headerText}>
        <h2 id={titleId} className={styles.title}>
          {project.title}
        </h2>
        <p className={styles.meta}>
          {project.teamName} <span aria-hidden="true">·</span> {project.semesterLabel}
        </p>
      </div>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
        ✕
      </button>
    </div>
  );
}

interface ProjectDetailModalProps {
  project: PublicProject | null;
  onClose: () => void;
}

/** 프로젝트 카드 클릭 시 뜨는 상세 모달. `project`가 없으면(닫힘) 아무것도 그리지 않는다. */
export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  return (
    <Modal isOpen={project !== null} onClose={onClose} className={styles.dialog}>
      {project && (
        <ModalBody>
          <div className={styles.content}>
            <DetailHeader project={project} onClose={onClose} />

            <div
              className={styles.hero}
              style={project.thumbnailUrl ? { backgroundImage: `url(${project.thumbnailUrl})` } : undefined}
              aria-hidden="true"
            />

            <ul className={styles.techStack}>
              {project.techStacks.map((tech) => (
                <li key={tech}>
                  <Badge variant="accent">{tech}</Badge>
                </li>
              ))}
            </ul>

            <section>
              <h3 className={styles.sectionTitle}>프로젝트 설명</h3>
              <p className={styles.description}>{project.description}</p>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>작동 사진</h3>
              <div className={styles.photos}>
                <div className={styles.photoPlaceholder} aria-hidden="true" />
                <div className={styles.photoPlaceholder} aria-hidden="true" />
                <div className={styles.photoPlaceholder} aria-hidden="true" />
              </div>
            </section>

            <div className={styles.actions}>
              <a className={styles.codeLink} href={project.codeUrl} target="_blank" rel="noreferrer">
                코드 보기
              </a>
              <a className={styles.demoLink} href={project.demoUrl} target="_blank" rel="noreferrer">
                데모 보기
              </a>
            </div>
          </div>
        </ModalBody>
      )}
    </Modal>
  );
}
