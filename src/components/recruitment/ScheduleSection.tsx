import { useState } from "react";

import { recruitmentErrorMessage } from "../../errors/recruitment/errorMessages";
import { useSaveSchedule, useSchedule } from "../../hooks/recruitment/useRecruitment";
import type { SchedulePayload } from "../../types/recruitment";
import { Button } from "../ui/Button/Button";
import { ErrorState } from "../ui/states/States";

import styles from "./Section.module.scss";

const FIELDS: { key: keyof SchedulePayload; label: string }[] = [
  { key: "totalStartAt", label: "전체 시작" },
  { key: "totalEndAt", label: "전체 종료" },
  { key: "documentStartAt", label: "서류 시작" },
  { key: "documentEndAt", label: "서류 마감" },
  { key: "interviewStartAt", label: "면접 시작" },
];

/**
 * 서버가 지키는 순서를 화면에서 먼저 확인한다.
 * 저장을 눌러 보고 알게 하면 무엇이 틀렸는지 찾기 어렵다.
 */
function invalidReason(draft: SchedulePayload): string | null {
  if (FIELDS.some(({ key }) => !draft[key])) return "모든 일정을 입력해 주세요.";
  if (draft.totalStartAt >= draft.totalEndAt) return "전체 시작은 종료보다 빨라야 합니다.";
  if (draft.documentStartAt >= draft.documentEndAt) return "서류 시작은 마감보다 빨라야 합니다.";
  if (draft.documentEndAt > draft.totalEndAt) return "서류 마감은 전체 종료 안에 있어야 합니다.";
  if (draft.documentEndAt > draft.interviewStartAt) return "면접은 서류 마감 뒤에 시작해야 합니다.";
  return null;
}

export function ScheduleSection({ locked }: { locked: boolean }) {
  const { data, isPending, isError, error, refetch } = useSchedule();
  const save = useSaveSchedule();
  const [edited, setEdited] = useState<SchedulePayload | null>(null);

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) {
    return <ErrorState message={recruitmentErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  const draft: SchedulePayload = edited ?? {
    totalStartAt: data.totalStartAt,
    totalEndAt: data.totalEndAt,
    documentStartAt: data.documentStartAt,
    documentEndAt: data.documentEndAt,
    interviewStartAt: data.interviewStartAt,
  };
  const reason = invalidReason(draft);

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h3 className={styles.title}>
          모집 일정 · {data.generationNo}기 ({data.year})
        </h3>
      </header>

      <div className={styles.fields}>
        {FIELDS.map(({ key, label }) => (
          <div key={key} className={styles.field}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              type="datetime-local"
              value={draft[key]}
              disabled={locked || save.isPending}
              onChange={(e) => setEdited({ ...draft, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {/* 면접 종료는 요청에 없다. 서버가 전체 종료로 맞춘다(명세서 6.2). */}
      <p className={styles.lockNotice}>면접 종료는 전체 종료({data.totalEndAt})와 같게 설정됩니다.</p>

      <div className={styles.actions}>
        <Button
          disabled={locked || save.isPending || reason !== null}
          onClick={() => save.mutate(draft, { onSuccess: () => setEdited(null) })}
        >
          저장
        </Button>
      </div>

      {!locked && reason !== null && <p className={styles.reason}>{reason}</p>}
      {save.error !== null && <p className={styles.reason}>{recruitmentErrorMessage(save.error)}</p>}
    </section>
  );
}
