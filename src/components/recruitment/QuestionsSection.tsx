import { recruitmentErrorMessage } from "../../errors/recruitment/errorMessages";
import {
  useCreateQuestion,
  useDeleteQuestion,
  useQuestions,
  useReorderQuestions,
  useUpdateQuestion,
} from "../../hooks/recruitment/useRecruitment";
import type { RecruitmentQuestion } from "../../types/recruitment";
import { Button } from "../ui/Button/Button";
import { EditableListRow } from "../ui/EditableListRow/EditableListRow";
import { ErrorState } from "../ui/states/States";

import styles from "./Section.module.scss";

/** 문항은 하나씩 저장한다. 평가 기준과 달리 서로 얽힌 제약이 없다. */
export function QuestionsSection({ locked }: { locked: boolean }) {
  const { data, isPending, isError, error, refetch } = useQuestions();
  const create = useCreateQuestion();
  const update = useUpdateQuestion();
  const remove = useDeleteQuestion();
  const reorder = useReorderQuestions();

  const busy = locked || create.isPending || update.isPending || remove.isPending || reorder.isPending;

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) {
    return <ErrorState message={recruitmentErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  // 이른 반환 뒤라 값이 있는 것이 확실하다. 중첩 함수는 그 좁힘을 물려받지 못한다.
  const questions = data;

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
        <span className={styles.required}>{questions.length}개</span>
      </header>

      <ul className={styles.list}>
        {questions.map((question, i) => (
          <EditableListRow
            key={question.id}
            moveLabel={`${i + 1}번 문항`}
            removeLabel={`${i + 1}번 문항 삭제`}
            disabled={busy}
            onMoveUp={i > 0 ? () => move(i, i - 1) : null}
            onMoveDown={i < questions.length - 1 ? () => move(i, i + 1) : null}
            onRemove={() => handleDelete(question)}
          >
            <input
              className={styles.guideline}
              defaultValue={question.content}
              aria-label={`${i + 1}번 문항 내용`}
              disabled={busy}
              onBlur={(e) => {
                const content = e.target.value.trim();
                // 빈 문항은 무엇을 묻는지 알 수 없다. 원래 값으로 되돌린다.
                if (content === "" || content === question.content) {
                  e.target.value = question.content;
                  return;
                }
                update.mutate({ id: question.id, payload: { ...question, content } });
              }}
            />
            <label className={styles.required}>
              <input
                type="checkbox"
                checked={question.required}
                disabled={busy}
                onChange={(e) =>
                  update.mutate({ id: question.id, payload: { ...question, required: e.target.checked } })
                }
              />
              필수
            </label>
          </EditableListRow>
        ))}
      </ul>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() =>
            create.mutate({
              type: "TEXT",
              content: "새 문항",
              required: false,
              maxLength: 300,
              options: null,
            })
          }
        >
          + 문항 추가
        </Button>
      </div>

      {anyError !== null && <p className={styles.reason}>{recruitmentErrorMessage(anyError)}</p>}
    </section>
  );
}
