import { useState } from "react";

import { exportUsers } from "../../apis/user/usersApi";
import { Button } from "../../components/ui/Button/Button";
import { DataTable, type Column } from "../../components/ui/DataTable/DataTable";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { Select } from "../../components/ui/Select/Select";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/states/States";
import { userErrorMessage, userExportErrorMessage } from "../../errors/user/errorMessages";
import { useGroupBoard } from "../../hooks/group/useGroups";
import { useTableParams } from "../../hooks/ui/useTableParams";
import { useDeleteUser, usePromoteApplicants, useUpdateUser, useUsers } from "../../hooks/user/useUsers";
import { ROLES, type Role } from "../../types/auth";
import type { AdminUser, PromotionResult } from "../../types/user";

import styles from "./MembersTab.module.scss";

const PAGE_SIZE = 10;

const ROLE_LABEL: Record<Role, string> = { GUEST: "비회원", MEMBER: "부원", ADMIN: "운영진" };

const ROLE_TABS: { value: Role | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  ...ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] })),
];

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }));

interface GenerationCellProps {
  user: AdminUser;
  disabled: boolean;
  onSave: (generationNo: number) => void;
}

/**
 * 기수 입력칸(0831 QA에서 발견). `LectureService.requireActiveMember`가 `generationNo`가
 * 없거나 활성 기수와 다르면 403을 던지는데, 권한만 바꾸는 옆 칸(`Select`)엔 기수를 넣을
 * 방법이 아예 없었다 — 그래서 권한만 올린 계정은 강좌·대시보드가 계속 막혀 있었다.
 *
 * 목록으로 고를 만한 "전체 기수" 조회 엔드포인트가 없어 자유 입력 칸으로 둔다. 값이
 * 바뀐 채로 포커스를 벗어나야만 저장한다 — `Select`처럼 즉시 반영하면 숫자를 한 자리씩
 * 지우는 중간에도 저장이 나간다.
 */
function GenerationCell({ user, disabled, onSave }: GenerationCellProps) {
  const [draft, setDraft] = useState(user.generationNo === null ? "" : String(user.generationNo));

  function commit() {
    const value = Number(draft);
    if (draft.trim() === "" || !Number.isInteger(value) || value < 1) {
      setDraft(user.generationNo === null ? "" : String(user.generationNo));
      return;
    }
    if (value !== user.generationNo) onSave(value);
  }

  return (
    <input
      type="number"
      className={styles.generationInput}
      aria-label={`${user.name} 기수`}
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  );
}

/** 와이어프레임 p8. `/admin/users` 의 사용자 관리 탭. */
export function MembersTab() {
  const { page, filter: role, setPage, setFilter: setRole } = useTableParams("role", ROLES);
  const { data, isPending, isError, error, refetch } = useUsers({ role, page, size: PAGE_SIZE });

  // 조 목록은 그룹 관리(#196)의 실제 조 편성을 그대로 쓴다. 못 받아도 사용자 목록 자체는 봐야 한다.
  const { data: groupBoard } = useGroupBoard();
  const updateUser = useUpdateUser();
  const removeUser = useDeleteUser();
  const promote = usePromoteApplicants();
  const [exportError, setExportError] = useState<string | null>(null);
  const [promoted, setPromoted] = useState<PromotionResult | null>(null);

  async function handleExport() {
    setExportError(null);
    try {
      await exportUsers();
    } catch (caught) {
      // 파일 응답이라 실패도 Blob 으로 온다. 문구는 BE ErrorCode 에서 가져온다.
      setExportError(userExportErrorMessage(caught));
    }
  }

  function handlePromote() {
    // 여러 명의 권한을 한 번에 올린다. 한 명 삭제보다 되돌리기 어렵다.
    // 대상 수를 미리 알 수 없으므로 무엇이 일어나는지라도 분명히 말한다.
    const message = "서류 합격자를 모두 부원으로 올릴까요? 되돌리려면 한 명씩 권한을 되돌려야 합니다.";
    if (!window.confirm(message)) return;

    setPromoted(null);
    promote.mutate(undefined, { onSuccess: (result) => setPromoted(result) });
  }

  function handleDelete(user: AdminUser) {
    // 되돌릴 수 없다. 문구에 이름을 넣어 다른 행을 지우는 실수를 줄인다.
    if (!window.confirm(`${user.name}(${user.email}) 님을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    removeUser.mutate(user.id);
  }

  const groups = [
    { value: 0, label: "미배정" },
    ...(groupBoard?.groups ?? []).map((g) => ({ value: g.id, label: g.name })),
  ];

  const columns: Column<AdminUser>[] = [
    { header: "이름", render: (u) => u.name, width: "6rem" },
    { header: "이메일", render: (u) => u.email, width: "13rem" },
    // GUEST 는 아직 소속·학년·기수가 없을 수 있다.
    { header: "소속", render: (u) => (u.college && u.major ? `${u.college} ${u.major}` : "-"), width: "13rem" },
    {
      header: "학년",
      render: (u) => (u.studentYear === null ? "-" : `${u.studentYear}학년`),
      width: "5rem",
      align: "center",
    },
    {
      header: "기수",
      width: "6rem",
      align: "center",
      render: (u) => (
        <GenerationCell
          user={u}
          disabled={updateUser.isPending}
          onSave={(generationNo) => updateUser.mutate({ id: u.id, payload: { generationNo } })}
        />
      ),
    },
    {
      header: "권한",
      width: "7rem",
      render: (u) => (
        <Select
          ariaLabel={`${u.name} 권한`}
          value={u.role}
          options={ROLE_OPTIONS}
          disabled={updateUser.isPending}
          onChange={(next) => updateUser.mutate({ id: u.id, payload: { role: next } })}
        />
      ),
    },
    {
      header: "조",
      width: "7rem",
      render: (u) => (
        <Select
          ariaLabel={`${u.name} 조`}
          value={u.group?.id ?? 0}
          options={groups}
          disabled={updateUser.isPending}
          // 0 은 화면에서 쓰는 값일 뿐이다. 서버에는 미배정을 null 로 보낸다.
          onChange={(next) => updateUser.mutate({ id: u.id, payload: { groupId: next === 0 ? null : next } })}
        />
      ),
    },
    {
      header: "삭제",
      width: "4rem",
      align: "center",
      render: (u) => (
        <button type="button" className={styles.remove} aria-label={`${u.name} 삭제`} onClick={() => handleDelete(u)}>
          🗑
        </button>
      ),
    },
  ];

  return (
    <div className={styles.members}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="권한">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={role === tab.value}
              className={role === tab.value ? styles.tabActive : styles.tab}
              onClick={() => setRole(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={handlePromote} disabled={promote.isPending}>
            합격자 일괄 승격
          </Button>
          <Button variant="secondary" onClick={() => void handleExport()}>
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {exportError && <ErrorState message={exportError} onRetry={() => void handleExport()} />}

      {/* 눌러도 화면이 그대로면 됐는지 알 수 없다. 몇 명이 올라갔는지, 몇 명이 제외됐는지 알린다. */}
      {promoted !== null && (
        <p className={styles.notice} role="status">
          {promoted.promotedCount === 0
            ? "승격할 합격자가 없습니다."
            : `${promoted.promotedCount}명을 부원으로 올렸습니다.`}
          {promoted.skippedCount > 0 && ` (이미 부원이거나 탈퇴 · 불합격 등으로 ${promoted.skippedCount}명 제외)`}
        </p>
      )}

      {isPending && <TableSkeleton columns={columns.length} rows={PAGE_SIZE} />}

      {isError && <ErrorState message={userErrorMessage(error)} onRetry={() => void refetch()} />}

      {data && data.content.length === 0 && data.totalElements === 0 && (
        <EmptyState message={role ? "해당 권한의 사용자가 없습니다." : "등록된 사용자가 없습니다."} />
      )}

      {data && data.content.length === 0 && data.totalElements > 0 && (
        <EmptyState
          message={`이 페이지에는 사용자가 없습니다. 전체 ${data.totalElements}명은 ${data.totalPages}페이지까지 있습니다.`}
          action={
            <button type="button" className={styles.backToFirst} onClick={() => setPage(0)}>
              첫 페이지로
            </button>
          }
        />
      )}

      {data && data.content.length > 0 && (
        <>
          <DataTable columns={columns} rows={data.content} rowKey={(u) => u.id} caption="사용자 목록" />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
