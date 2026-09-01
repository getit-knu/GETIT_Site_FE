import { useState } from "react";
import { useSearchParams } from "react-router";

import { exportUsers } from "../../apis/user/usersApi";
import { Badge } from "../../components/ui/Badge/Badge";
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

import { GenerationCell } from "./GenerationCell";
import styles from "./MembersTab.module.scss";

const PAGE_SIZE = 10;

const ROLE_LABEL: Record<Role, string> = { GUEST: "비회원", MEMBER: "부원", ADMIN: "운영진" };

const ROLE_TABS: { value: Role | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  ...ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] })),
];

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }));

/** 와이어프레임 p8. `/admin/users` 의 사용자 관리 탭. */
export function MembersTab() {
  const { page, filter: role, setPage, setFilter: setRole } = useTableParams("role", ROLES);
  const { data, isPending, isError, error, refetch } = useUsers({ role, page, size: PAGE_SIZE });

  // 삭제는 소프트 삭제라 지운 사용자가 `WITHDRAWN` 으로 계속 내려온다(#277). 기본은 숨기되
  // 이력을 봐야 할 때가 있어 아주 지우지는 않고 토글로 남긴다. 상태는 다른 표 상태와 같이
  // 주소에 둔다 — 새로고침·링크 공유가 유지된다.
  const [searchParams, setSearchParams] = useSearchParams();
  const showWithdrawn = searchParams.get("withdrawn") === "1";

  // 조 목록은 그룹 관리(#196)의 실제 조 편성을 그대로 쓴다. 못 받아도 사용자 목록 자체는 봐야 한다.
  const { data: groupBoard } = useGroupBoard();
  const updateUser = useUpdateUser();
  const removeUser = useDeleteUser();
  const promote = usePromoteApplicants();
  const [exportError, setExportError] = useState<string | null>(null);
  const [promoted, setPromoted] = useState<PromotionResult | null>(null);

  /** 파일 응답이라 실패도 Blob 으로 온다 — 화면 문구는 BE `ErrorCode` 에서 가져온다. */
  async function handleExport() {
    setExportError(null);
    try {
      await exportUsers();
    } catch (caught) {
      setExportError(userExportErrorMessage(caught));
    }
  }

  /**
   * 여러 명의 권한을 한 번에 올린다. 한 명 삭제보다 되돌리기 어렵다.
   * 대상 수를 미리 알 수 없으므로 무엇이 일어나는지라도 분명히 말한다.
   */
  function handlePromote() {
    const message = "서류 합격자를 모두 부원으로 올릴까요? 되돌리려면 한 명씩 권한을 되돌려야 합니다.";
    if (!window.confirm(message)) return;

    setPromoted(null);
    promote.mutate(undefined, { onSuccess: (result) => setPromoted(result) });
  }

  /** 되돌릴 수 없다. 확인 문구에 이름을 넣어 다른 행을 지우는 실수를 줄인다. */
  function handleDelete(user: AdminUser) {
    if (!window.confirm(`${user.name}(${user.email}) 님을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    removeUser.mutate(user.id);
  }

  /**
   * `useTableParams` 의 `setPage` 와 한 핸들러에서 같이 부르면 뒤엣것이 앞엣것을 덮는다
   * (`useTableParams` 주석 참고). 한 번의 `setSearchParams` 안에서 page 까지 함께 지운다 —
   * 숨김을 끄고 켜면 보이는 인원이 달라지므로 필터와 같은 이유로 첫 페이지로 되돌린다.
   */
  function toggleWithdrawn(next: boolean) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next) params.set("withdrawn", "1");
      else params.delete("withdrawn");
      params.delete("page");
      return params;
    });
  }

  const rows = data?.content ?? [];
  const visibleRows = showWithdrawn ? rows : rows.filter((u) => u.status !== "WITHDRAWN");
  const hiddenCount = rows.length - visibleRows.length;

  const groups = [
    { value: 0, label: "미배정" },
    ...(groupBoard?.groups ?? []).map((g) => ({ value: g.id, label: g.name })),
  ];

  const columns: Column<AdminUser>[] = [
    { header: "이름", render: (u) => u.name, width: "6rem" },
    { header: "이메일", render: (u) => u.email, width: "13rem" },
    // 서버가 아직 안 주는 값이라 대부분 "-" 로 뜬다(BE#182). 승격 때 지원서에서 옮겨 온다.
    { header: "연락처", render: (u) => u.phoneNumber ?? "-", width: "9rem" },
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
      render: (u) =>
        // 이미 탈퇴한 사용자는 다시 지울 것이 없다. 눌러도 아무 일이 없을 버튼을 두지 않는다.
        u.status === "WITHDRAWN" ? (
          <Badge>탈퇴</Badge>
        ) : (
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
          <label className={styles.toggle}>
            <input type="checkbox" checked={showWithdrawn} onChange={(e) => toggleWithdrawn(e.target.checked)} />
            탈퇴한 사용자 보기
          </label>
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

      {/* 페이지 수·전체 인원은 서버가 센 값이라 탈퇴자를 포함한다. 숨긴 만큼 표가 짧아 보이는
          이유를 말해 두지 않으면 목록이 잘린 것처럼 읽힌다. */}
      {hiddenCount > 0 && visibleRows.length > 0 && (
        <p className={styles.notice} role="status">
          탈퇴한 사용자 {hiddenCount}명을 숨겼습니다. 아래 페이지 수와 전체 인원에는 탈퇴자도 들어 있습니다.
        </p>
      )}

      {data && visibleRows.length === 0 && hiddenCount > 0 && (
        <EmptyState
          message={`이 페이지의 사용자 ${hiddenCount}명은 모두 탈퇴했습니다.`}
          action={
            <button type="button" className={styles.backToFirst} onClick={() => toggleWithdrawn(true)}>
              탈퇴한 사용자 보기
            </button>
          }
        />
      )}

      {data && rows.length === 0 && data.totalElements === 0 && (
        <EmptyState message={role ? "해당 권한의 사용자가 없습니다." : "등록된 사용자가 없습니다."} />
      )}

      {data && rows.length === 0 && data.totalElements > 0 && (
        <EmptyState
          message={`이 페이지에는 사용자가 없습니다. 전체 ${data.totalElements}명은 ${data.totalPages}페이지까지 있습니다.`}
          action={
            <button type="button" className={styles.backToFirst} onClick={() => setPage(0)}>
              첫 페이지로
            </button>
          }
        />
      )}

      {data && visibleRows.length > 0 && (
        <>
          <DataTable columns={columns} rows={visibleRows} rowKey={(u) => u.id} caption="사용자 목록" />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
