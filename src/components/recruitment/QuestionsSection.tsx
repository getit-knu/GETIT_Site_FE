import { useState } from "react";

import { recruitmentErrorMessage } from "../../errors/recruitment/errorMessages";
import {
  useCreateQuestion,
  useDeleteQuestion,
  useQuestions,
  useReorderQuestions,
  useUpdateQuestion,
} from "../../hooks/recruitment/useRecruitment";
import type { QuestionType, RecruitmentQuestion } from "../../types/recruitment";
import { Button } from "../ui/Button/Button";
import { Select } from "../ui/Select/Select";
import { ErrorState, TextSkeleton } from "../ui/states/States";

import { QuestionRow } from "./QuestionRow";
import styles from "./Section.module.scss";

/** `all` 은 화면에서만 쓰는 값이다. */
type TypeFilter = QuestionType | "all";

const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "TEXT", label: "서술형" },
  { value: "CHOICE", label: "객관식" },
  { value: "CHECKBOX", label: "체크박스" },
];

/** 문항은 하나씩 저장한다. 평가 기준과 달리 서로 얽힌 제약이 없다. */
export function QuestionsSection() {
  const { data, isPending, isError, error, refetch } = useQuestions();
  const [filter, setFilter] = useState<TypeFilter>("all");
  const create = useCreateQuestion();
  const update = useUpdateQuestion();
  const remove = useDeleteQuestion();
  const reorder = useReorderQuestions();

  const busy = create.isPending || update.isPending || remove.isPending || reorder.isPending;

  if (isPending) return <TextSkeleton lines={4} label="지원서 문항 불러오는 중" />;
  if (isError) {
    return <ErrorState message={recruitmentErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  // 이른 반환 뒤라 값이 있는 것이 확실하다. 중첩 함수는 그 좁힘을 물려받지 못한다.
  const questions = data;
  const shown = filter === "all" ? questions : questions.filter((q) => q.type === filter);

  /** 배열 순서대로 order 를 다시 매긴다(명세서 6.7). 화면에서 자리만 바꿔 보낸다. */
  function move(from: number, to: number) {
    const ids = questions.map((q) => q.id);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    reorder.mutate(ids);
  }

  function handleDelete(question: RecruitmentQuestion) {
    // 이미 제출된 지원서의 답변이 딸려 있을 수 있다.
    if (!window.confirm(`"${question.content}" 문항을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    remove.mutate(question.id);
  }

  const anyError = create.error ?? update.error ?? remove.error ?? reorder.error;

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h3 className={styles.title}>지원서 문항</h3>
        <Select ariaLabel="문항 유형 필터" value={filter} options={FILTERS} onChange={setFilter} />
        <span className={styles.required}>
          {shown.length}개{filter !== "all" && ` / 전체 ${questions.length}개`}
        </span>
      </header>

      {shown.length === 0 ? (
        <p className={styles.loading}>이 유형의 문항이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {shown.map((question) => {
            // 순서는 걸러낸 목록이 아니라 전체 기준이다. 필터를 걸었다고 자리가 달라지지 않는다.
            const at = questions.indexOf(question);

            return (
              <QuestionRow
                key={question.id}
                question={question}
                index={at}
                disabled={busy}
                /*
                  걸러낸 상태에서 화살표를 누르면 화면에 없는 문항과 자리를 바꾸게 되어
                  무슨 일이 일어났는지 보이지 않는다. 전체를 보고 있을 때만 옮긴다.
                */
                onMoveUp={filter === "all" && at > 0 ? () => move(at, at - 1) : null}
                onMoveDown={filter === "all" && at < questions.length - 1 ? () => move(at, at + 1) : null}
                onRemove={() => handleDelete(question)}
                onChange={(payload) => update.mutate({ id: question.id, payload })}
              />
            );
          })}
        </ul>
      )}

      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            // 걸러 보고 있으면 그 유형으로 만든다. 만들자마자 사라지면 안 된다.
            const type: QuestionType = filter === "all" ? "TEXT" : filter;
            create.mutate({
              type,
              content: "새 문항",
              required: false,
              maxLength: type === "TEXT" ? 300 : null,
              // CHOICE는 BE가 옵션 2개 이상을 요구한다(QuestionRow의 withType 주석 참고) —
              // 1개만 보내면 만들자마자 VALIDATION_FAILED로 막힌다.
              options:
                type === "TEXT"
                  ? null
                  : type === "CHECKBOX"
                    ? [{ id: "opt-1", label: "동의합니다" }]
                    : [
                        { id: "opt-1", label: "선택지 1" },
                        { id: "opt-2", label: "선택지 2" },
                      ],
            });
          }}
        >
          + 문항 추가
        </Button>
      </div>

      {anyError !== null && <p className={styles.reason}>{recruitmentErrorMessage(anyError)}</p>}
    </section>
  );
}
