import { useState } from "react";

import { recruitmentErrorMessage } from "../../errors/recruitment/errorMessages";
import { useCriteria, useSaveCriteria } from "../../hooks/recruitment/useRecruitment";
import type { CriterionDraft } from "../../types/recruitment";
import { Button } from "../ui/Button/Button";
import { EditableListRow } from "../ui/EditableListRow/EditableListRow";
import { ErrorState } from "../ui/states/States";

import styles from "./Section.module.scss";

const REQUIRED_TOTAL = 100;

/** 입력 중에는 빈 칸을 허용해야 지우고 다시 칠 수 있다. */
interface Row extends Omit<CriterionDraft, "maxScore"> {
  maxScore: string;
}

function totalOf(rows: Row[]): number {
  return rows.reduce((sum, r) => sum + (Number(r.maxScore) || 0), 0);
}

function invalidReason(rows: Row[]): string | null {
  if (rows.length === 0) return "평가 기준이 최소 하나는 있어야 합니다.";
  if (rows.some((r) => r.name.trim() === "")) return "기준 이름을 입력해 주세요.";
  if (rows.some((r) => !Number.isInteger(Number(r.maxScore)) || Number(r.maxScore) <= 0)) {
    return "배점은 1 이상의 정수여야 합니다.";
  }

  const total = totalOf(rows);
  if (total !== REQUIRED_TOTAL) {
    return `배점 합계는 ${REQUIRED_TOTAL}점이어야 합니다. (현재 ${total}점)`;
  }
  return null;
}

/**
 * 평가 기준. 와이어프레임 p6.
 *
 * **한 번에 저장한다.** 명세서 6.9 ~ 6.11 은 추가·수정·삭제마다 합계 100 을 강제하는데,
 * 그러면 기준을 하나 늘리려고 다른 것을 줄이는 순간 90 이 되어 막히고, 먼저 늘려도
 * 110 이 되어 막힌다 — 어느 순서로도 편집할 수 없다. 명세서 본문도 일괄 저장을 권장한다.
 */
export function CriteriaSection() {
  const { data, isPending, isError, error, refetch } = useCriteria();
  const save = useSaveCriteria();
  const [rows, setRows] = useState<Row[] | null>(null);

  // 조회가 끝난 뒤에만 초안을 만든다. 저장하면 초안을 비워 서버 값으로 되돌린다.
  const draft = rows ?? data?.criteria.map((c) => ({ ...c, maxScore: String(c.maxScore) })) ?? [];
  const reason = invalidReason(draft);
  const total = totalOf(draft);

  function update(index: number, patch: Partial<Row>) {
    setRows(draft.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleSave() {
    if (reason !== null) return;
    save.mutate(
      draft.map((r) => ({
        id: r.id,
        name: r.name.trim(),
        guideline: r.guideline.trim(),
        maxScore: Number(r.maxScore),
      })),
      {
        // 실패해도 초안을 비운다. saveCriteria 는 여러 요청으로 나뉘어 나가서, 중간에
        // 하나가 실패하면 서버는 이미 일부만 반영된 상태다 — 실패했다고 원래 쓰던 초안을
        // 그대로 두면 방금 무엇까지 반영됐는지 모른 채 다시 저장을 누르게 된다. 비우면
        // 훅이 다시 받아온 실제 서버 상태로 화면이 채워져, 그걸 보고 다시 편집할 수 있다.
        onSettled: () => setRows(null),
      },
    );
  }

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) {
    return <ErrorState message={recruitmentErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h3 className={styles.title}>평가 기준</h3>
        <span className={total === REQUIRED_TOTAL ? styles.totalOk : styles.totalBad}>
          총점 {total} / {REQUIRED_TOTAL}점
        </span>
      </header>

      <ul className={styles.list}>
        {draft.map((row, i) => (
          <EditableListRow
            key={row.id ?? `new-${i}`}
            removeLabel={`${row.name || `${i + 1}번 기준`} 삭제`}
            disabled={save.isPending}
            onRemove={() => setRows(draft.filter((_, at) => at !== i))}
          >
            <input
              className={styles.name}
              value={row.name}
              aria-label={`${i + 1}번 기준 이름`}
              disabled={save.isPending}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <input
              className={styles.guideline}
              value={row.guideline}
              placeholder="가이드라인"
              aria-label={`${i + 1}번 기준 가이드라인`}
              disabled={save.isPending}
              onChange={(e) => update(i, { guideline: e.target.value })}
            />
            <span className={styles.scoreBox}>
              <input
                type="number"
                min={1}
                step={1}
                value={row.maxScore}
                aria-label={`${i + 1}번 기준 배점`}
                disabled={save.isPending}
                onChange={(e) => update(i, { maxScore: e.target.value })}
              />
              <span>점</span>
            </span>
          </EditableListRow>
        ))}
      </ul>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={save.isPending}
          onClick={() => setRows([...draft, { name: "", guideline: "", maxScore: "0" }])}
        >
          + 기준 추가
        </Button>
        <Button disabled={save.isPending || reason !== null} onClick={handleSave}>
          저장
        </Button>
      </div>

      {/* 저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다. */}
      {reason !== null && <p className={styles.reason}>{reason}</p>}

      {save.error !== null && <p className={styles.reason}>{recruitmentErrorMessage(save.error)}</p>}
    </section>
  );
}
