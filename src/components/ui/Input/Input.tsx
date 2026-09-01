import { useId } from "react";
import clsx from "clsx";

import styles from "./Input.module.scss";

type InputType = "text" | "email" | "password" | "number" | "date" | "datetime-local";

interface InputProps {
  /**
   * 바깥에서 이 칸을 지목해야 할 때만 준다(예: 제출을 막는 칸으로 포커스를 옮기는 지원 폼).
   * 안 주면 `useId`로 알아서 만든다 — 라벨 연결에만 쓰이므로 대개 필요 없다.
   */
  id?: string;
  label?: string;
  /** 라벨을 화면에 두지 않을 때 스크린리더용 이름. 표나 카드 안에서 쓴다. */
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  type?: InputType;
  disabled?: boolean;
  maxLength?: number;
}

export function Input({
  id: givenId,
  label,
  ariaLabel,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  type = "text",
  disabled,
  maxLength,
}: InputProps) {
  const generatedId = useId();
  const id = givenId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={clsx(styles.input, error && styles.inputError)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-label={label ? undefined : ariaLabel}
        /*
          빨간 테두리는 눈에만 보인다. `aria-invalid` 로 상태를,
          `aria-describedby` 로 이유를 칸 자체에 붙여야 한다.

          아래 문구의 `role="alert"` 만으로는 부족하다 — alert 는 DOM 에 꽂히는
          **그 순간 한 번** 읽히고 끝이라, 사용자가 나중에 이 칸으로 다시 탭해
          오면 "이메일, 편집" 만 들리고 왜 막혔는지는 알 수 없다.
        */
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
      />
      {error && (
        <p id={errorId} role="alert" className={styles.errorMessage}>
          {error}
        </p>
      )}
    </div>
  );
}
