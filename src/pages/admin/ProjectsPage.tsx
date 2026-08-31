import clsx from "clsx";

import { AdminProjectFormModal } from "../../components/project/AdminProjectFormModal";
import { Button } from "../../components/ui/Button/Button";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { EmptyState, ErrorState } from "../../components/ui/states/States";
import { projectErrorMessage, projectSaveErrorMessage } from "../../errors/project/errorMessages";
import {
  useApproveProject,
  useDeleteProject,
  useProjectBoard,
  useRejectProject,
} from "../../hooks/project/useProjects";
import { useModalParams } from "../../hooks/ui/useModalParams";
import { useTableParams } from "../../hooks/ui/useTableParams";
import type { AdminProject, AdminProjectStatus } from "../../types/project";

import styles from "./ProjectsPage.module.scss";

const PAGE_SIZE = 12;

/**
 * 상태 배지 색. **문구는 서버가 준 `statusLabel` 을 그대로 쓴다** — 여기에 한글을 박아 두면
 * 서버가 표기를 바꿔도 화면만 옛말을 남긴다.
 */
const STATUS_STYLE: Record<AdminProjectStatus, string> = {
  PENDING: styles.pending,
  APPROVED: styles.approved,
  REJECTED: styles.rejected,
};

/**
 * 어드민 프로젝트 관리(#222). 대응하는 와이어프레임이 없어 신설한 화면 —
 * 기존 어드민 카드 그리드 톤(강의 관리 등)을 그대로 따른다.
 *
 * 별도 상세 조회 엔드포인트가 없어(BE 확인함), 수정은 목록에 이미 실려 온 행 데이터를
 * 그대로 폼 초기값으로 쓴다.
 */
export default function AdminProjectsPage() {
  // 학기 필터가 아직 없어 useTableParams 는 페이지 번호만 쓴다.
  const { page, setPage } = useTableParams("semester", [] as const);
  const { data, isPending, isError, error, refetch } = useProjectBoard({ page, size: PAGE_SIZE });
  const { modal, id: modalId, openModal, closeModal } = useModalParams();
  const remove = useDeleteProject();
  const approve = useApproveProject();
  const reject = useRejectProject();

  function handleDelete(project: AdminProject) {
    const message = project.isFeatured
      ? `"${project.title}"을(를) 삭제할까요? Home 화면 소개에서도 함께 사라집니다.`
      : `"${project.title}"을(를) 삭제할까요?`;
    if (!window.confirm(message)) return;
    remove.mutate(project.id);
  }

  function handleReject(project: AdminProject) {
    // 공개 중인 것을 내리는 것이라 되돌리려면 다시 승인해야 한다.
    const message =
      project.status === "APPROVED"
        ? `"${project.title}"을(를) 반려할까요? 공개 사이트에서 내려갑니다.`
        : `"${project.title}"을(를) 반려할까요?`;
    if (!window.confirm(message)) return;
    reject.mutate(project.id);
  }

  const editing =
    modal === "project" && modalId !== null ? (data?.content.find((p) => p.id === modalId) ?? null) : null;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button onClick={() => openModal("project")}>+ 프로젝트 추가</Button>
      </div>

      {isPending && <p className={styles.loading}>불러오는 중…</p>}
      {isError && <ErrorState message={projectErrorMessage(error)} onRetry={() => void refetch()} />}

      {data && data.content.length === 0 && <EmptyState message="등록된 프로젝트가 없습니다." />}

      {data && data.content.length > 0 && (
        <>
          <div className={styles.grid}>
            {data.content.map((project) => (
              <div key={project.id} className={styles.card}>
                <div
                  className={styles.thumbnail}
                  style={project.thumbnailUrl ? { backgroundImage: `url(${project.thumbnailUrl})` } : undefined}
                  aria-hidden="true"
                />
                <div className={styles.body}>
                  <div className={styles.head}>
                    <strong>{project.title}</strong>
                    <span className={clsx(styles.badge, STATUS_STYLE[project.status])}>{project.statusLabel}</span>
                    {project.isFeatured && <span className={styles.badge}>Home 소개</span>}
                  </div>
                  <span className={styles.muted}>
                    {project.teamName} · {project.semester}
                  </span>
                  <p className={styles.description}>{project.description}</p>
                  {project.techStacks.length > 0 && (
                    <div className={styles.stacks}>
                      {project.techStacks.map((stack) => (
                        <span key={stack} className={styles.stack}>
                          {stack}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.actions}>
                  {/* 이미 공개 중이면 다시 승인할 것이 없고, 반려된 것은 다시 승인할 수 있다. */}
                  {project.status !== "APPROVED" && (
                    <button type="button" disabled={approve.isPending} onClick={() => approve.mutate(project.id)}>
                      승인
                    </button>
                  )}
                  {project.status !== "REJECTED" && (
                    <button type="button" disabled={reject.isPending} onClick={() => handleReject(project)}>
                      반려
                    </button>
                  )}
                  <button type="button" onClick={() => openModal("project", project.id)}>
                    수정
                  </button>
                  <button type="button" className={styles.danger} onClick={() => handleDelete(project)}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {remove.error !== null && <p className={styles.reason}>{projectSaveErrorMessage(remove.error)}</p>}
      {approve.error !== null && <p className={styles.reason}>{projectSaveErrorMessage(approve.error)}</p>}
      {reject.error !== null && <p className={styles.reason}>{projectSaveErrorMessage(reject.error)}</p>}

      {modal === "project" && <AdminProjectFormModal project={editing} onClose={closeModal} />}
    </div>
  );
}
