import { useId } from "react";
import clsx from "clsx";

import styles from "./Input.module.scss";

type InputType = "text" | "email" | "password" | "number";

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: InputType;
  disabled?: boolean;
}

export function Input({ label, value, onChange, placeholder, error, type = "text", disabled }: InputProps) {
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
