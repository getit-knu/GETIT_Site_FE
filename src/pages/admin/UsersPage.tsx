import { useState } from "react";

import { exportUsers } from "../../apis/user/usersApi";
import { Button } from "../../components/ui/Button/Button";
import { DataTable, type Column } from "../../components/ui/DataTable/DataTable";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { Select } from "../../components/ui/Select/Select";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/states/States";
import { useTableParams } from "../../hooks/ui/useTableParams";
import { useDeleteUser, usePromoteApplicants, useUpdateUser, useUsers } from "../../hooks/user/useUsers";
import { ROLES, type Role } from "../../types/auth";
import type { AdminUser } from "../../types/user";

import styles from "./UsersPage.module.scss";

const PAGE_SIZE = 10;

const ROLE_LABEL: Record<Role, string> = { GUEST: "비회원", MEMBER: "부원", ADMIN: "운영진" };

const ROLE_TABS: { value: Role | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  ...ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] })),
];

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }));

/** 조 목록은 그룹 관리(#51)가 붙기 전까지 목록에 실린 값에서 모은다. */
function groupOptions(users: AdminUser[]) {
  const seen = new Map<number, string>();
  users.forEach((u) => u.group && seen.set(u.group.id, u.group.name));
  return [{ value: 0, label: "미배정" }, ...[...seen].map(([id, name]) => ({ value: id, label: name }))];
}

/** 와이어프레임 p8. */
export default function UsersPage() {
  const { page, filter: role, setPage, setFilter: setRole } = useTableParams("role", ROLES);
  const { data, isPending, isError, refetch } = useUsers({ role, page, size: PAGE_SIZE });

  const updateUser = useUpdateUser();
  const removeUser = useDeleteUser();
  const promote = usePromoteApplicants();
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExportError(null);
    try {
      await exportUsers();
    } catch (error) {
      // 파일 응답이라 실패도 Blob 으로 온다. downloadFile 이 풀어 준 메시지를 쓴다.
      setExportError((error as { message?: string }).message ?? "다운로드에 실패했습니다.");
    }
  }

  function handleDelete(user: AdminUser) {
    // 되돌릴 수 없다. 문구에 이름을 넣어 다른 행을 지우는 실수를 줄인다.
    if (!window.confirm(`${user.name}(${user.email}) 님을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    removeUser.mutate(user.id);
  }

  const groups = groupOptions(data?.content ?? []);

  const columns: Column<AdminUser>[] = [
    { header: "이름", render: (u) => u.name, width: "6rem" },
    { header: "이메일", render: (u) => u.email, width: "13rem" },
    { header: "소속", render: (u) => `${u.college} ${u.major}`, width: "13rem" },
    { header: "학년", render: (u) => `${u.studentYear}학년`, width: "5rem", align: "center" },
    { header: "기수", render: (u) => `${u.generationNo}기`, width: "5rem", align: "center" },
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
    <div className={styles.page}>
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
          <Button variant="secondary" onClick={() => promote.mutate()} disabled={promote.isPending}>
            합격자 일괄 승격
          </Button>
          <Button variant="secondary" onClick={() => void handleExport()}>
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {exportError && <ErrorState message={exportError} onRetry={() => void handleExport()} />}

      {isPending && <TableSkeleton columns={columns.length} rows={PAGE_SIZE} />}

      {isError && <ErrorState message="사용자 목록을 불러오지 못했습니다." onRetry={() => void refetch()} />}

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
