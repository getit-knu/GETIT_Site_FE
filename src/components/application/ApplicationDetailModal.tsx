import { useState } from "react";

import { applicationErrorMessage } from "../../errors/application/errorMessages";
import { useApplicationDetail, useSaveEvaluation } from "../../hooks/application/useApplicationDetail";
import { formatDateTime } from "../../libs/formatDate";
import type { ApplicantListParams, ApplicationDetail } from "../../types/application";
import { Button } from "../ui/Button/Button";
import { PaginatedModal } from "../ui/PaginatedModal/PaginatedModal";
import { ErrorState } from "../ui/states/States";

import styles from "./ApplicationDetailModal.module.scss";

/** 입력 중에는 빈 칸을 허용해야 지우고 다시 칠 수 있다. */
type Draft = Record<number, string>;

function toDraft(detail: ApplicationDetail): Draft {
  return Object.fromEntries(
    detail.evaluation.scores.map((s) => [s.criterionId, s.score === null ? "" : String(s.score)]),
  );
}

/** 배점을 넘거나 숫자가 아니면 저장할 수 없다. */
function invalidReason(draft: Draft, detail: ApplicationDetail): string | null {
  for (const criterion of detail.evaluation.scores) {
    const raw = draft[criterion.criterionId] ?? "";
    if (raw === "") return "모든 기준에 점수를 입력해 주세요.";

    const score = Number(raw);
    if (!Number.isInteger(score)) return "점수는 정수로 입력해 주세요.";
    if (score < 0 || score > criterion.maxScore) {
      return `${criterion.name}은(는) 0 ~ ${criterion.maxScore}점 사이여야 합니다.`;
    }
  }
  return null;
}

function totalOf(draft: Draft): number {
  return Object.values(draft).reduce((sum, raw) => sum + (Number(raw) || 0), 0);
}

interface EvaluationFormProps {
  detail: ApplicationDetail;
  onSaved: () => void;
}

/**
 * 평가 입력. **상세가 도착한 뒤에만 마운트한다.**
 * 그래야 `useState` 초기값으로 기존 점수를 넣을 수 있다.
 */
function EvaluationForm({ detail, onSaved }: EvaluationFormProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(detail));
  const { mutate, isPending, error } = useSaveEvaluation(detail.id);

  const maxTotal = detail.evaluation.scores.reduce((sum, s) => sum + s.maxScore, 0);
  const reason = invalidReason(draft, detail);

  function handleSave() {
    if (reason !== null) return;
    mutate(
      {
        scores: detail.evaluation.scores.map((s) => ({
          criterionId: s.criterionId,
          score: Number(draft[s.criterionId]),
        })),
      },
      { onSuccess: onSaved },
    );
  }

  return (
    <>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>서류 평가</h3>
        <ul className={styles.criteria}>
          {detail.evaluation.scores.map((criterion) => (
            <li key={criterion.criterionId} className={styles.criterion}>
              <div className={styles.criterionHead}>
                <span className={styles.criterionName}>{criterion.name}</span>
                <span className={styles.guideline}>{criterion.guideline}</span>
              </div>
              <div className={styles.scoreInput}>
                <input
                  type="number"
                  min={0}
                  max={criterion.maxScore}
                  step={1}
                  value={draft[criterion.criterionId] ?? ""}
                  aria-label={`${criterion.name} 점수`}
                  disabled={isPending}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [criterion.criterionId]: e.target.value }))}
                />
                <span className={styles.maxScore}>/ {criterion.maxScore}점</span>
              </div>
            </li>
          ))}
        </ul>

        <p className={styles.total}>
          합계 <strong>{totalOf(draft)}</strong> / {maxTotal}점
        </p>

        {/* 저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다. */}
        {reason !== null && <p className={styles.reason}>{reason}</p>}

        {error !== null && <p className={styles.reason}>{applicationErrorMessage(error)}</p>}
      </section>

      <div className={styles.saveRow}>
        <Button onClick={handleSave} disabled={isPending || reason !== null}>
          {detail.evaluation.evaluated ? "평가 수정" : "평가 저장"}
        </Button>
      </div>
    </>
  );
}

interface ApplicationDetailModalProps {
  applicationId: number;
  /** 목록 필터. 순차 탐색 순서를 목록과 맞추려면 함께 넘겨야 한다. */
  listParams: ApplicantListParams;
  onNavigate: (id: number) => void;
  onClose: () => void;
}

/** 와이어프레임 p18. */
export function ApplicationDetailModal({
  applicationId,
  listParams,
  onNavigate,
  onClose,
}: ApplicationDetailModalProps) {
  const { data, isPending, isError, error, refetch } = useApplicationDetail(applicationId, listParams);

  const nav = data?.navigation;

  return (
    <PaginatedModal
      title={data ? `${data.applicantName} 지원서` : "지원서"}
      onClose={onClose}
      current={nav?.current ?? 0}
      total={nav?.total ?? 0}
      onPrev={nav?.prevId != null ? () => onNavigate(nav.prevId!) : null}
      onNext={nav?.nextId != null ? () => onNavigate(nav.nextId!) : null}
    >
      {isPending && <p className={styles.loading}>불러오는 중…</p>}

      {isError && <ErrorState message={applicationErrorMessage(error)} onRetry={() => void refetch()} />}

      {data && (
        <>
          <dl className={styles.meta}>
            <div>
              <dt>소속</dt>
              <dd>
                {data.college} {data.major} {data.grade}학년
              </dd>
            </div>
            <div>
              <dt>연락처</dt>
              <dd>{data.email}</dd>
            </div>
            <div>
              <dt>제출일</dt>
              <dd>{formatDateTime(data.submittedAt)}</dd>
            </div>
          </dl>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>지원서 내용</h3>
            <ol className={styles.answers}>
              {data.answers.map((answer) => (
                <li key={answer.questionId}>
                  <p className={styles.question}>{answer.question}</p>
                  {/* 비워 둔 문항이 있다. 빈 자리로 두면 화면이 깨진 것처럼 보인다. */}
                  <p className={answer.answerText === null ? styles.noAnswer : styles.answer}>
                    {answer.answerText ?? "답변 없음"}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/*
            지원자가 바뀌면 조회가 다시 시작돼 data 가 잠시 사라지고, 이 폼도 언마운트되면서
            입력값이 초기화된다. key 는 그 동작에 기대지 않으려는 보험이다 —
            나중에 깜빡임을 줄이려고 placeholderData 를 붙이면 언마운트가 사라져
            앞 사람 점수가 그대로 남는다.
          */}
          <EvaluationForm key={data.id} detail={data} onSaved={onClose} />
        </>
      )}
    </PaginatedModal>
  );
}
