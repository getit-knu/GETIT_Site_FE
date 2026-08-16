import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./Button.module.scss";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";
type ButtonType = "button" | "submit";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  isLoading,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(styles.button, styles[variant], styles[size])}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      onClick={onClick}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
