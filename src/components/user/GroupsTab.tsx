import { useState } from "react";

import {
  useAddMember,
  useCreateGroup,
  useDeleteGroup,
  useGroupBoard,
  useRemoveMember,
  useRenameGroup,
} from "../../hooks/group/useGroups";
import { groupErrorMessage } from "../../errors/user/errorMessages";
import type { Group, GroupMember } from "../../types/group";
import { Button } from "../ui/Button/Button";
import { Input } from "../ui/Input/Input";
import { Select } from "../ui/Select/Select";
import { EmptyState, ErrorState, TextSkeleton } from "../ui/states/States";

import styles from "./GroupsTab.module.scss";

/** 조원 한 줄. 어느 조에 있든 같은 모양이라 한 곳에서 그린다. */
function MemberRow({ member, action }: { member: GroupMember; action: React.ReactNode }) {
  return (
    <li className={styles.member}>
      <span className={styles.memberName}>{member.name}</span>
      <span className={styles.memberMeta}>
        {member.major} · {member.roleLabel}
      </span>
      {action}
    </li>
  );
}

function GroupCard({ group }: { group: Group }) {
  const rename = useRenameGroup();
  const removeGroup = useDeleteGroup();
  const removeMember = useRemoveMember();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);

  function handleRename() {
    const trimmed = name.trim();
    // 빈 이름으로 저장하면 어느 조인지 알 수 없게 된다.
    if (!trimmed || trimmed === group.name) {
      setName(group.name);
      setEditing(false);
      return;
    }
    rename.mutate({ id: group.id, name: trimmed }, { onSuccess: () => setEditing(false) });
  }

  function handleDelete() {
    // 조를 지워도 사람은 남는다. 그 사실을 문구로 알려 주저하지 않게 한다.
    const message =
      group.members.length > 0
        ? `${group.name}을(를) 삭제할까요? 조원 ${group.members.length}명은 미배정으로 돌아갑니다.`
        : `${group.name}을(를) 삭제할까요?`;
    if (!window.confirm(message)) return;
    removeGroup.mutate(group.id);
  }

  return (
    <section className={styles.group}>
      <header className={styles.groupHead}>
        {editing ? (
          <Input value={name} onChange={setName} ariaLabel={`${group.name} 이름`} onBlur={handleRename} />
        ) : (
          <h3 className={styles.groupName}>
            {group.name}
            <span className={styles.count}>{group.memberCount}명</span>
          </h3>
        )}

        <div className={styles.groupActions}>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} aria-label={`${group.name} 이름 수정`}>
              수정
            </button>
          )}
          <button type="button" className={styles.danger} onClick={handleDelete} aria-label={`${group.name} 삭제`}>
            삭제
          </button>
        </div>
      </header>

      {group.members.length === 0 ? (
        <p className={styles.emptyGroup}>아직 조원이 없습니다.</p>
      ) : (
        <ul className={styles.members}>
          {group.members.map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              action={
                <button
                  type="button"
                  className={styles.move}
                  aria-label={`${m.name} 조에서 빼기`}
                  onClick={() => removeMember.mutate({ groupId: group.id, userId: m.userId })}
                >
                  빼기
                </button>
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * 와이어프레임 p14. `/admin/users` 의 그룹 관리 탭.
 *
 * **조원 이동은 드래그가 아니라 버튼으로 한다.** 드래그는 키보드로 조작할 수 없어
 * 접근성 대응을 따로 해야 하고, 조가 늘어나면 놓을 자리를 찾기도 어렵다.
 */
export function GroupsTab() {
  const { data, isPending, isError, error, refetch } = useGroupBoard();
  const createGroup = useCreateGroup();
  const addMember = useAddMember();
  const [newName, setNewName] = useState("");

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createGroup.mutate(trimmed, { onSuccess: () => setNewName("") });
  }

  if (isPending) return <TextSkeleton lines={6} label="조 편성 불러오는 중" />;
  // 문구는 BE ErrorCode 에서 가져온다. FE 가 코드를 새로 짓지 않는다.
  if (isError) return <ErrorState message={groupErrorMessage(error)} onRetry={() => void refetch()} />;

  const groupOptions = data.groups.map((g) => ({ value: g.id, label: g.name }));

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <span className={styles.generation}>{data.generationNo}기</span>
        <div className={styles.create}>
          <Input value={newName} onChange={setNewName} placeholder="새 조 이름" ariaLabel="새 조 이름" />
          <Button onClick={handleCreate} disabled={!newName.trim() || createGroup.isPending}>
            조 추가
          </Button>
        </div>
      </div>

      <div className={styles.columns}>
        <div className={styles.groups}>
          {data.groups.length === 0 ? (
            <EmptyState message="아직 만든 조가 없습니다." />
          ) : (
            data.groups.map((group) => <GroupCard key={group.id} group={group} />)
          )}
        </div>

        <section className={styles.group}>
          <header className={styles.groupHead}>
            <h3 className={styles.groupName}>
              미배정
              <span className={styles.count}>{data.unassigned.length}명</span>
            </h3>
          </header>

          {data.unassigned.length === 0 ? (
            <p className={styles.emptyGroup}>모두 배정되었습니다.</p>
          ) : (
            <ul className={styles.members}>
              {data.unassigned.map((m) => (
                <MemberRow
                  key={m.userId}
                  member={m}
                  action={
                    // 조가 하나도 없으면 보낼 곳이 없다.
                    groupOptions.length === 0 ? null : (
                      <Select
                        ariaLabel={`${m.name} 조 배정`}
                        value={0}
                        options={[{ value: 0, label: "조 선택" }, ...groupOptions]}
                        onChange={(groupId: number) => groupId !== 0 && addMember.mutate({ groupId, userId: m.userId })}
                      />
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
