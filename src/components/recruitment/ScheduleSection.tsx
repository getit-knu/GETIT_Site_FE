import { useState } from "react";

import { isRecruitmentErrorCode, recruitmentErrorMessage } from "../../errors/recruitment/errorMessages";
import { useSaveSchedule, useSchedule } from "../../hooks/recruitment/useRecruitment";
import { formatDateTime } from "../../libs/formatDate";
import { toIso, toLocalInput } from "../../libs/datetimeLocalInput";
import type { RecruitmentSchedule, SchedulePayload } from "../../types/recruitment";
import { Button } from "../ui/Button/Button";
import { ErrorState } from "../ui/states/States";

import styles from "./Section.module.scss";

/** 폼 상태. 서버는 오프셋 붙은 ISO 8601 을 주고받지만 `<input type="datetime-local">` 은 못 받는다. */
type ScheduleDraft = Record<keyof SchedulePayload, string>;

const FIELDS: { key: keyof ScheduleDraft; label: string }[] = [
  { key: "totalStartAt", label: "전체 시작" },
  { key: "totalEndAt", label: "전체 종료" },
  { key: "documentStartAt", label: "서류 시작" },
  { key: "documentEndAt", label: "서류 마감" },
  { key: "interviewStartAt", label: "면접 시작" },
];

function emptyDraft(): ScheduleDraft {
  return { totalStartAt: "", totalEndAt: "", documentStartAt: "", documentEndAt: "", interviewStartAt: "" };
}

function toDraft(schedule: RecruitmentSchedule): ScheduleDraft {
  return {
    totalStartAt: toLocalInput(schedule.totalStartAt),
    totalEndAt: toLocalInput(schedule.totalEndAt),
    documentStartAt: toLocalInput(schedule.documentStartAt),
    documentEndAt: toLocalInput(schedule.documentEndAt),
    interviewStartAt: toLocalInput(schedule.interviewStartAt),
  };
}

function toPayload(draft: ScheduleDraft): SchedulePayload {
  return {
    totalStartAt: toIso(draft.totalStartAt),
    totalEndAt: toIso(draft.totalEndAt),
    documentStartAt: toIso(draft.documentStartAt),
    documentEndAt: toIso(draft.documentEndAt),
    interviewStartAt: toIso(draft.interviewStartAt),
  };
}

/**
 * 서버가 지키는 순서를 화면에서 먼저 확인한다.
 * 저장을 눌러 보고 알게 하면 무엇이 틀렸는지 찾기 어렵다.
 */
function invalidReason(draft: ScheduleDraft): string | null {
  if (FIELDS.some(({ key }) => !draft[key])) return "모든 일정을 입력해 주세요.";

  /*
    비어 있지 않다고 쓸 수 있는 값은 아니다. 형태가 어긋난 값은 `toIso` 가 빈 문자열을
    돌려주므로, 막지 않으면 저장 버튼이 열린 채 빈 일정이 서버로 나간다.
  */
  const malformed = FIELDS.find(({ key }) => toIso(draft[key]) === "");
  if (malformed) return `${malformed.label} 일시 형식이 올바르지 않습니다.`;

  if (draft.totalStartAt >= draft.totalEndAt) return "전체 시작은 종료보다 빨라야 합니다.";
  if (draft.documentStartAt >= draft.documentEndAt) return "서류 시작은 마감보다 빨라야 합니다.";
  if (draft.documentEndAt > draft.totalEndAt) return "서류 마감은 전체 종료 안에 있어야 합니다.";
  if (draft.documentEndAt > draft.interviewStartAt) return "면접은 서류 마감 뒤에 시작해야 합니다.";
  // 서류·면접이 전체 기간 밖으로 나가면 공개 사이트의 단계 표기가 어긋난다.
  if (draft.documentStartAt < draft.totalStartAt) return "서류 접수는 전체 시작 뒤에 열려야 합니다.";
  if (draft.interviewStartAt > draft.totalEndAt) return "면접은 전체 종료 안에 시작해야 합니다.";
  return null;
}

interface ScheduleSectionProps {
  /** 사이트 관리(`SitePage`)의 섹션 네비게이션 앵커용. 모집 관리에선 안 쓴다. */
  id?: string;
}

/**
 * `id`가 있는 곳(`SitePage`)은 로딩·실패 상태에서도 `<section>`을 유지한다 — 그래야
 * 섹션 네비게이션 앵커가 화면이 채워지기 전에도 존재한다(`CurriculumsSection` 등과 같은
 * 이유). `id`가 없는 곳(`ApplicationsPage`)은 앵커가 필요 없어 그대로 둔다.
 */
export function ScheduleSection({ id }: ScheduleSectionProps) {
  const { data, isPending, isError, error, refetch } = useSchedule();
  const save = useSaveSchedule();
  const [edited, setEdited] = useState<ScheduleDraft | null>(null);

  if (isPending) {
    return id !== undefined ? (
      <section id={id} className={styles.section}>
        <p className={styles.loading}>불러오는 중…</p>
      </section>
    ) : (
      <p className={styles.loading}>불러오는 중…</p>
    );
  }

  /*
    새 기수를 막 활성화해서 이 기수의 모집 일정을 한 번도 저장한 적 없으면 조회 자체가
    404 SCHEDULE_NOT_FOUND 다(BE 확인함) — 오류가 아니라 "아직 없다"는 정상 상태다.
    `PUT`은 이미 upsert 로 짜여 있어서(BE `updateSchedule` 확인함), 빈 폼에 값을 채워
    저장하면 그게 곧 최초 생성이 된다. 그 외 실패는 그대로 막는다.
  */
  const scheduleMissing = isRecruitmentErrorCode(error, "SCHEDULE_NOT_FOUND");

  if (isError && !scheduleMissing) {
    const errorState = <ErrorState message={recruitmentErrorMessage(error)} onRetry={() => void refetch()} />;
    return id !== undefined ? (
      <section id={id} className={styles.section}>
        {errorState}
      </section>
    ) : (
      errorState
    );
  }

  const draft: ScheduleDraft = edited ?? (data ? toDraft(data) : emptyDraft());
  const reason = invalidReason(draft);
  // 이미 저장된 값이 있을 때만 서버가 준 값으로 보여준다 — 새로 만드는 중엔 아직 없다.
  const totalEndPreview = draft.totalEndAt !== "" ? formatDateTime(toIso(draft.totalEndAt)) : null;

  return (
    <section id={id} className={styles.section}>
      <header className={styles.head}>
        <h3 className={styles.title}>{data ? `모집 일정 · ${data.generationNo}기 (${data.year})` : "모집 일정"}</h3>
      </header>

      {scheduleMissing && (
        <p className={styles.hint}>아직 설정된 모집 일정이 없습니다. 입력하고 저장하면 새로 만들어집니다.</p>
      )}

      <div className={styles.fields}>
        {FIELDS.map(({ key, label }) => (
          <div key={key} className={styles.field}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              type="datetime-local"
              value={draft[key]}
              disabled={save.isPending}
              onChange={(e) => setEdited({ ...draft, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {/* 면접 종료는 요청에 없다. 서버가 전체 종료로 맞춘다(명세서 6.2). */}
      <p className={styles.lockNotice}>
        면접 종료는 전체 종료{totalEndPreview && `(${totalEndPreview})`}와 같게 설정됩니다.
      </p>

      <div className={styles.actions}>
        <Button
          disabled={save.isPending || reason !== null}
          onClick={() => save.mutate(toPayload(draft), { onSuccess: () => setEdited(null) })}
        >
          저장
        </Button>
      </div>

      {reason !== null && <p className={styles.reason}>{reason}</p>}
      {save.error !== null && <p className={styles.reason}>{recruitmentErrorMessage(save.error)}</p>}
    </section>
  );
}
