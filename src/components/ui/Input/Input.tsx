import { useId } from "react";
import clsx from "clsx";

import styles from "./Input.module.scss";

type InputType = "text" | "email" | "password" | "number";

interface InputProps {
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
}

export function Input({
  label,
  ariaLabel,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  type = "text",
  disabled,
}: InputProps) {
  const id = useId();

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
        placeholder={placeholder}
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
