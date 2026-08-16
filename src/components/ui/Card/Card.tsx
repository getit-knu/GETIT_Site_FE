import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./Card.module.scss";

interface CardProps {
  onClick?: () => void;
  children: ReactNode;
}

export function Card({ onClick, children }: CardProps) {
  return (
    <div
      className={clsx(styles.card, onClick && styles.clickable)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
