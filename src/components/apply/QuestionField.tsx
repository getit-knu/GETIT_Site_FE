import { TextArea } from "../ui/TextArea/TextArea";
import type { ApplicationFormQuestion } from "../../types/application";

import type { AnswerState } from "./answerState";
import styles from "./QuestionField.module.scss";

interface QuestionFieldProps {
  /**
   * 이 문항의 **첫 번째 입력 컨트롤**에 붙는 id. 답을 안 한 문항으로 화면을 데려다 놓을 때
   * 지원 폼이 이 id로 찾는다(`ApplyForm`의 `focusField` 참고).
   */
  id: string;
  question: ApplicationFormQuestion;
  answer: AnswerState;
  onChange: (next: AnswerState) => void;
}

/** 문항 타입(TEXT/CHOICE/CHECKBOX)에 맞춰 입력 컨트롤을 고른다. */
export function QuestionField({ id, question, answer, onChange }: QuestionFieldProps) {
  const label = question.required ? `${question.content} *` : question.content;

  if (question.type === "TEXT") {
    return (
      <TextArea
        id={id}
        label={label}
        value={answer.answerText ?? ""}
        onChange={(value) => onChange({ answerText: value, selectedOptions: null })}
        placeholder={question.placeholder ?? undefined}
        maxLength={question.maxLength ?? undefined}
      />
    );
  }

  if (question.type === "CHECKBOX") {
    // 항상 옵션 1개짜리 동의 문항이다(어드민 QuestionRow.tsx와 같은 규약).
    const option = question.options?.[0];
    const checked = (answer.selectedOptions?.length ?? 0) > 0;

    return (
      <div className={styles.field}>
        <span className={styles.label}>{label}</span>
        <label className={styles.optionRow}>
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(event) =>
              onChange({ answerText: null, selectedOptions: event.target.checked && option ? [option.id] : [] })
            }
          />
          {option?.label}
        </label>
      </div>
    );
  }

  // CHOICE
  return (
    <fieldset className={styles.field}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.optionsList}>
        {question.options?.map((option, index) => (
          <label key={option.id} className={styles.optionRow}>
            <input
              // 여러 선택지 중 첫 칸이 이 문항의 대표 — 여기로 포커스를 옮기면 라디오 그룹 전체가 잡힌다.
              id={index === 0 ? id : undefined}
              type="radio"
              name={`question-${question.id}`}
              checked={answer.selectedOptions?.[0] === option.id}
              onChange={() => onChange({ answerText: null, selectedOptions: [option.id] })}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
