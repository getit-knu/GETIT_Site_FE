import { useId } from "react";
import clsx from "clsx";

import styles from "./TextArea.module.scss";

interface TextAreaProps {
  /** 바깥에서 이 칸을 지목해야 할 때만 준다(`Input`의 같은 이름 프롭 설명 참고). */
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  rows?: number;
  maxLength?: number;
  name?: string;
  disabled?: boolean;
}

export function TextArea({
  id: givenId,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  rows = 4,
  maxLength,
  name,
  disabled,
}: TextAreaProps) {
  const generatedId = useId();
  const id = givenId ?? generatedId;

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        className={clsx(styles.textarea, error && styles.textareaError)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
      />
      {error && (
        <p role="alert" className={styles.errorMessage}>
          {error}
        </p>
      )}
    </div>
  );
}
