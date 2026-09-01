import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getColleges, getMajors } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import {
  applicationErrorMessage,
  evaluationErrorMessage,
  evaluationSaveErrorMessage,
} from "../../errors/application/errorMessages";
import {
  useAdjacentApplicants,
  useApplicationDetail,
  useEvaluationSummary,
  useSaveEvaluation,
} from "../../hooks/application/useApplicationDetail";
import { formatDateTime } from "../../libs/formatDate";
import type {
  ApplicantListParams,
  ApplicationAnswer,
  ApplicationStatus,
  EvaluationSummary,
} from "../../types/application";
import { Button } from "../ui/Button/Button";
import { PaginatedModal } from "../ui/PaginatedModal/PaginatedModal";
import { ErrorState, FormSkeleton, TextSkeleton } from "../ui/states/States";

import { DecisionButtons } from "./DecisionButtons";
import styles from "./ApplicationDetailModal.module.scss";

/**
 * 문항 타입별로 답변을 사람이 읽을 텍스트로 바꾼다.
 *
 * `TEXT` 는 `answerText`, `CHOICE`/`CHECKBOX` 는 `selectedOptions`(id) 를 `options`(라벨)
 * 에서 찾아 보여준다. `CHECKBOX` 는 단일 동의 문항이라 체크 여부만 있으면 된다.
 */
function answerDisplay(answer: ApplicationAnswer): { text: string; empty: boolean } {
  if (answer.type === "CHECKBOX") {
    const checked = (answer.selectedOptions?.length ?? 0) > 0;
    return checked ? { text: "동의함", empty: false } : { text: "답변 없음", empty: true };
  }

  if (answer.type === "CHOICE") {
    const selectedId = answer.selectedOptions?.[0];
    const label = selectedId ? answer.options?.find((o) => o.id === selectedId)?.label : undefined;
    return label !== undefined ? { text: label, empty: false } : { text: "답변 없음", empty: true };
  }

  return answer.answerText !== null ? { text: answer.answerText, empty: false } : { text: "답변 없음", empty: true };
}

/** 입력 중에는 빈 칸을 허용해야 지우고 다시 칠 수 있다. */
type Draft = Record<number, string>;

function toDraft(summary: EvaluationSummary): Draft {
  return Object.fromEntries(summary.criteria.map((c) => [c.criterionId, c.myScore === null ? "" : String(c.myScore)]));
}

/** 배점을 넘거나 숫자가 아니면 저장할 수 없다. */
function invalidReason(draft: Draft, summary: EvaluationSummary): string | null {
  for (const criterion of summary.criteria) {
    const raw = draft[criterion.criterionId] ?? "";
    if (raw === "") return "모든 기준에 점수를 입력해 주세요.";

    const score = Number(raw);
    if (!Number.isInteger(score)) return "점수는 정수로 입력해 주세요.";
    if (score < 0 || score > criterion.maxScore) {
      return `${criterion.criterionName}은(는) 0 ~ ${criterion.maxScore}점 사이여야 합니다.`;
    }
  }
  return null;
}

function totalOf(draft: Draft): number {
  return Object.values(draft).reduce((sum, raw) => sum + (Number(raw) || 0), 0);
}

interface EvaluationSectionProps {
  applicationId: number;
  status: ApplicationStatus;
}

/**
 * 서류 평가. **여러 운영진이 각자 채점한다**(BE #151) — 기준마다 다른 평가자들의 점수도
 * 함께 보여주고, 입력칸엔 로그인한 본인의 점수만 매긴다.
 *
 * **`SUBMITTED` 상태일 때만 채점할 수 있다**(BE `ApplicationEvaluationService` 확인함,
 * 그 외 상태는 `APPLICATION_NOT_SCORABLE`로 막힘) — 서류 합불이 이미 결정된 뒤에도
 * 입력칸이 계속 열려 있으면 눌러서 저장을 시도하고서야 막힌 걸 알게 된다(0831 QA).
 */
function EvaluationSection({ applicationId, status }: EvaluationSectionProps) {
  const { data, isPending, isError, error, refetch } = useEvaluationSummary(applicationId);
  const { mutate, isPending: saving, error: saveError } = useSaveEvaluation(applicationId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const locked = status !== "SUBMITTED";

  if (isPending) return <FormSkeleton fields={3} label="평가 불러오는 중" />;
  if (isError) return <ErrorState message={evaluationErrorMessage(error)} onRetry={() => void refetch()} />;

  // 별도 const 로 다시 잡아 둔다 — `data` 를 그대로 쓰면 아래 중첩 함수 안에서는
  // TS 가 위 가드로 좁혀진 타입(undefined 아님)을 유지해 주지 않는다.
  const summary = data;
  const currentDraft = draft ?? toDraft(summary);
  const reason = invalidReason(currentDraft, summary);
  const maxTotal = summary.criteria.reduce((sum, c) => sum + c.maxScore, 0);

  function handleSave() {
    if (reason !== null) return;
    mutate(
      {
        scores: summary.criteria.map((c) => ({
          criterionId: c.criterionId,
          score: Number(currentDraft[c.criterionId]),
        })),
      },
      { onSuccess: () => setDraft(null) },
    );
  }

  return (
    <>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>서류 평가</h3>
        <ul className={styles.criteria}>
          {summary.criteria.map((criterion) => (
            <li key={criterion.criterionId} className={styles.criterion}>
              <div className={styles.criterionHead}>
                <span className={styles.criterionName}>{criterion.criterionName}</span>
                {criterion.evaluatorScores.length > 0 && (
                  <span className={styles.guideline}>
                    {criterion.evaluatorScores.map((s) => `${s.evaluatorName} ${s.score}점`).join(" · ")}
                    {criterion.averageScore !== null && ` (평균 ${criterion.averageScore.toFixed(1)}점)`}
                  </span>
                )}
              </div>
              <div className={styles.scoreInput}>
                <input
                  type="number"
                  min={0}
                  max={criterion.maxScore}
                  step={1}
                  value={currentDraft[criterion.criterionId] ?? ""}
                  aria-label={`${criterion.criterionName} 내 점수`}
                  disabled={saving || locked}
                  onChange={(e) => setDraft({ ...currentDraft, [criterion.criterionId]: e.target.value })}
                />
                <span className={styles.maxScore}>/ {criterion.maxScore}점</span>
              </div>
            </li>
          ))}
        </ul>

        <p className={styles.total}>
          내 합계 <strong>{totalOf(currentDraft)}</strong> / {maxTotal}점
          {summary.totalScore !== null &&
            ` · 운영진 평균 ${summary.totalScore.toFixed(1)}점(${summary.evaluatorCount}명 완료)`}
        </p>

        {/*
          저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다.

          role 을 셋으로 가르는 기준은 `ApplyForm` 의 같은 자리 주석 참고. 여기 세 줄이
          그 세 경우를 한 번에 보여준다 — `locked` 는 이 지원자에 대해 늘 참인 설명문이라
          사건이 아니고(role 없음), `reason` 은 점수를 고치는 동안 바뀌며(status),
          `saveError` 는 저장을 누른 뒤에만 생긴다(alert).
        */}
        {locked && <p className={styles.reason}>합불이 이미 결정돼 채점할 수 없습니다.</p>}
        {!locked && reason !== null && (
          <p role="status" className={styles.reason}>
            {reason}
          </p>
        )}

        {saveError !== null && (
          <p role="alert" className={styles.reason}>
            {evaluationSaveErrorMessage(saveError)}
          </p>
        )}
      </section>

      <div className={styles.saveRow}>
        <Button onClick={handleSave} disabled={saving || locked || reason !== null}>
          {summary.myTotalScore !== null ? "평가 수정" : "평가 저장"}
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
  const { data, isPending, isError, error, refetch } = useApplicationDetail(applicationId);
  const { data: adjacent } = useAdjacentApplicants(applicationId, listParams);
  // 학과 이름 조인. 상세 응답엔 collegeId·majorId(숫자)만 온다(BE 확인함).
  const { data: colleges = [] } = useQuery({ queryKey: queryKeys.public.colleges(), queryFn: getColleges });
  const { data: majors = [] } = useQuery({ queryKey: queryKeys.public.majors(), queryFn: getMajors });

  const collegeId = data?.basicInfo.collegeId ?? null;
  const majorId = data?.basicInfo.majorId ?? null;
  const collegeName = collegeId !== null ? (colleges.find((c) => c.id === collegeId)?.name ?? "-") : "-";
  const majorName = majorId !== null ? (majors.find((m) => m.id === majorId)?.name ?? "-") : "-";

  // 아래서 새 const 로 옮겨 잡는다 — `adjacent?.previousId`를 화살표 함수 안에서 그대로
  // 다시 읽으면 TS 가 좁혀진 타입(null 아님)을 유지해 주지 않는다.
  const previousId = adjacent?.previousId ?? null;
  const nextId = adjacent?.nextId ?? null;

  return (
    <PaginatedModal
      title={data ? `${data.basicInfo.name} 지원서` : "지원서"}
      onClose={onClose}
      onPrev={previousId !== null ? () => onNavigate(previousId) : null}
      onNext={nextId !== null ? () => onNavigate(nextId) : null}
      actions={
        data && <DecisionButtons id={data.id} name={data.basicInfo.name} status={data.status} onDecided={onClose} />
      }
    >
      {isPending && <TextSkeleton lines={6} label="지원서 불러오는 중" />}

      {isError && <ErrorState message={applicationErrorMessage(error)} onRetry={() => void refetch()} />}

      {data && (
        <>
          <dl className={styles.meta}>
            <div>
              <dt>소속</dt>
              <dd>
                {collegeName} {majorName} {data.basicInfo.grade ?? "-"}학년
              </dd>
            </div>
            <div>
              <dt>연락처</dt>
              <dd>{data.basicInfo.phoneNumber ?? "-"}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{data.basicInfo.email}</dd>
            </div>
            <div>
              <dt>제출일</dt>
              <dd>{formatDateTime(data.submittedAt)}</dd>
            </div>
          </dl>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>지원서 내용</h3>
            <ol className={styles.answers}>
              {data.answers.map((answer) => {
                // 비워 둔 문항이 있다. 빈 자리로 두면 화면이 깨진 것처럼 보인다.
                const { text, empty } = answerDisplay(answer);
                return (
                  <li key={answer.questionId}>
                    <p className={styles.question}>{answer.question}</p>
                    <p className={empty ? styles.noAnswer : styles.answer}>{text}</p>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* key로 지원자 전환 시 EvaluationSection의 draft를 초기화한다(EvaluationForm과 같은 이유). */}
          <EvaluationSection key={data.id} applicationId={data.id} status={data.status} />
        </>
      )}
    </PaginatedModal>
  );
}
