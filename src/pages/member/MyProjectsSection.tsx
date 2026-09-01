import clsx from "clsx";

import { projectErrorMessage } from "../../errors/project/errorMessages";
import { useMyProjects } from "../../hooks/project/useMemberProjects";
import { ErrorState } from "../../components/ui/states/States";
import type { AdminProjectStatus } from "../../types/project";

import styles from "./MyProjectsSection.module.scss";

/** 문구는 서버가 준 `statusLabel`을 그대로 쓴다 — 틴트만 여기서 정한다. */
const STATUS_STYLE: Record<AdminProjectStatus, string> = {
  PENDING: styles.pending,
  APPROVED: styles.approved,
  REJECTED: styles.rejected,
};

/**
 * 우리 조가 낸 프로젝트(#296). `ProjectSubmitForm`에서 등록해도 결과를 다시 볼 방법이
 * 없던 것을 고친다 — `GET /api/member/projects`(BE#190)로 상태·반려 사유까지 보여준다.
 *
 * 아직 하나도 안 냈으면 섹션 자체를 숨긴다 — 빈 목록 안내보다, 바로 아래 있는
 * "프로젝트 등록" 폼이 할 일을 대신 말해준다.
 */
export function MyProjectsSection() {
  const { data, isPending, isError, error, refetch } = useMyProjects();

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) return <ErrorState message={projectErrorMessage(error)} onRetry={() => void refetch()} />;
  if (data.length === 0) return null;

  return (
    <>
      <h3 className={styles.sectionTitle}>우리 조가 낸 프로젝트</h3>
      <ul className={styles.list}>
        {data.map((project) => (
          <li key={project.id} className={styles.item}>
            <div className={styles.head}>
              <span className={styles.itemTitle}>{project.title}</span>
              <span className={clsx(styles.badge, STATUS_STYLE[project.status])}>{project.statusLabel}</span>
            </div>
            <p className={styles.meta}>{project.semester}</p>
            {project.rejectReason !== null && <p className={styles.reason}>반려 사유: {project.rejectReason}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
