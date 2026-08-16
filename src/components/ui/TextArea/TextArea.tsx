import { useId } from "react";
import clsx from "clsx";

import styles from "./TextArea.module.scss";

interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
}

export function TextArea({ label, value, onChange, placeholder, error, rows = 4, disabled }: TextAreaProps) {
  const id = useId();

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={clsx(styles.textarea, error && styles.textareaError)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
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
