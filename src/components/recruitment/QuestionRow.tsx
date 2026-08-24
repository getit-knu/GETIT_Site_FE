import type { QuestionOption, QuestionPayload, QuestionType, RecruitmentQuestion } from "../../types/recruitment";
import { EditableListRow } from "../ui/EditableListRow/EditableListRow";
import { Select } from "../ui/Select/Select";

import styles from "./Section.module.scss";

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "TEXT", label: "서술형" },
  { value: "CHOICE", label: "객관식" },
];

/** 화면에서 만든 선택지의 id. 서버가 값을 정해 주기 전까지 쓰는 임시 값이다. */
function nextOptionId(options: QuestionOption[]): string {
  const used = new Set(options.map((o) => o.id));
  for (let n = 1; ; n += 1) {
    const id = `opt-${n}`;
    if (!used.has(id)) return id;
  }
}

/**
 * 타입을 바꿀 때 그 타입이 쓰지 않는 칸은 비운다.
 *
 * 명세서 6.3 에서 `maxLength` 는 `TEXT` 만, `options` 는 `CHOICE` 만 쓴다.
 * 남겨 두면 서버가 쓰지 않는 값을 계속 들고 다니게 되고, 다시 바꿨을 때
 * 예전 선택지가 되살아난다.
 */
function withType(question: RecruitmentQuestion, type: QuestionType): QuestionPayload {
  return {
    type,
    content: question.content,
    required: question.required,
    maxLength: type === "TEXT" ? (question.maxLength ?? 300) : null,
    options: type === "CHOICE" ? (question.options ?? [{ id: "opt-1", label: "선택지 1" }]) : null,
  };
}

interface QuestionRowProps {
  question: RecruitmentQuestion;
  index: number;
  disabled: boolean;
  onMoveUp: (() => void) | null;
  onMoveDown: (() => void) | null;
  onRemove: () => void;
  onChange: (payload: QuestionPayload) => void;
}

export function QuestionRow({ question, index, disabled, onMoveUp, onMoveDown, onRemove, onChange }: QuestionRowProps) {
  const no = index + 1;
  const options = question.options ?? [];

  function patchOptions(next: QuestionOption[]) {
    onChange({ ...question, options: next });
  }

  return (
    <EditableListRow
      moveLabel={`${no}번 문항`}
      removeLabel={`${no}번 문항 삭제`}
      disabled={disabled}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <input
        className={styles.guideline}
        defaultValue={question.content}
        aria-label={`${no}번 문항 내용`}
        disabled={disabled}
        onBlur={(e) => {
          const content = e.target.value.trim();
          // 빈 문항은 무엇을 묻는지 알 수 없다. 원래 값으로 되돌린다.
          if (content === "" || content === question.content) {
            e.target.value = question.content;
            return;
          }
          onChange({ ...question, content });
        }}
      />

      <Select
        ariaLabel={`${no}번 문항 유형`}
        value={question.type}
        options={TYPES}
        disabled={disabled}
        onChange={(type: QuestionType) => onChange(withType(question, type))}
      />

      <label className={styles.required}>
        <input
          type="checkbox"
          checked={question.required}
          disabled={disabled}
          onChange={(e) => onChange({ ...question, required: e.target.checked })}
        />
        필수
      </label>

      {question.type === "CHOICE" && (
        <ul className={styles.options}>
          {options.map((option, at) => (
            <li key={option.id}>
              <input
                defaultValue={option.label}
                aria-label={`${no}번 문항 ${at + 1}번 선택지`}
                disabled={disabled}
                onBlur={(e) => {
                  const label = e.target.value.trim();
                  // 이름 없는 선택지는 지원자가 무엇을 고르는지 알 수 없다.
                  if (label === "" || label === option.label) {
                    e.target.value = option.label;
                    return;
                  }
                  patchOptions(options.map((o) => (o.id === option.id ? { ...o, label } : o)));
                }}
              />
              <button
                type="button"
                aria-label={`${no}번 문항 ${at + 1}번 선택지 삭제`}
                // 선택지가 하나뿐인 객관식은 고를 것이 없다.
                disabled={disabled || options.length <= 1}
                onClick={() => patchOptions(options.filter((o) => o.id !== option.id))}
              >
                ✕
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={styles.addOption}
              disabled={disabled}
              onClick={() =>
                patchOptions([...options, { id: nextOptionId(options), label: `선택지 ${options.length + 1}` }])
              }
            >
              + 선택지
            </button>
          </li>
        </ul>
      )}
    </EditableListRow>
  );
}
