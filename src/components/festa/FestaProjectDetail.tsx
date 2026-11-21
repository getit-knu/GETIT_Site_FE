import { useState } from "react";

import { isOurPublicFileUrl } from "../../libs/publicFileUrl";
import type { PublicProject } from "../../types/project";
import { ProjectGallery } from "../project/ProjectGallery";
import { Badge } from "../ui/Badge/Badge";
import { Markdown } from "../ui/Markdown/Markdown";
import { Modal, ModalBody } from "../ui/Modal/Modal";
import { useModalTitleId } from "../ui/Modal/modalTitleContext";

import { FestaProjectIcon } from "./FestaProjectIcon";
import styles from "./FestaProjectDetail.module.scss";

/**
 * 링크로 걸 수 있는 URL인지. 빈 문자열·`null`도 온다(springdoc이 nullable을 못 잡음). http(s)만 통과 —
 * 부원 제출(`ProjectSubmitRequest`)엔 BE `@HttpUrl` 검증이 없어 아무 스킴이나 내려온다(#360 리뷰).
 */
function isLinkableUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && /^https?:\/\/\S+$/i.test(url.trim());
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
        {isLinkableUrl(project.demoUrl) && (
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
 * 스크린샷(#382)은 설명보다 먼저 둔다 — 글보다 화면을 보고 써 볼지 정하는 경우가 많다.
 */
export function FestaProjectDetail({ project, onClose }: FestaProjectDetailProps) {
  // 닫힐 때도 마지막 프로젝트를 그린다 — 퇴장 애니메이션 동안 빈 시트만 내려가던 문제(#360 리뷰).
  const [shown, setShown] = useState(project);
  if (project !== null && project !== shown) setShown(project);

  return (
    <Modal isOpen={project !== null} onClose={onClose} className={styles.dialog}>
      {shown && (
        <ModalBody>
          <span className={styles.handle} aria-hidden="true" />
          <DetailHeader project={shown} onClose={onClose} />

          <div className={styles.sections}>
            {shown.galleryImageUrls.length > 0 && (
              <section>
                <h3 className={styles.sectionTitle}>미리보기</h3>
                <ProjectGallery urls={shown.galleryImageUrls} title={shown.title} />
              </section>
            )}

            {shown.description && (
              <section>
                <h3 className={styles.sectionTitle}>프로젝트 설명</h3>
                <Markdown
                  className={styles.description}
                  content={shown.description}
                  keepLineBreaks
                  allowImage={isOurPublicFileUrl}
                />
              </section>
            )}

            {shown.techStacks.length > 0 && (
              <section>
                <h3 className={styles.sectionTitle}>기술 스택</h3>
                <ul className={styles.techStack}>
                  {shown.techStacks.map((tech) => (
                    <li key={tech}>
                      <Badge variant="accent">{tech}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {isLinkableUrl(shown.codeUrl) && (
              <a className={styles.codeLink} href={shown.codeUrl} target="_blank" rel="noreferrer">
                코드 보기 <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </ModalBody>
      )}
    </Modal>
  );
}
