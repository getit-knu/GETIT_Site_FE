import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./Badge.module.scss";

type BadgeVariant = "accent" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return <span className={clsx(styles.badge, styles[variant])}>{children}</span>;
}
