import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./Button.module.scss";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", disabled, onClick, children }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.button, styles[variant], styles[size])}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
