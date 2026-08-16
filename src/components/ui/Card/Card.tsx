import clsx from "clsx";
import type { KeyboardEvent, ReactNode } from "react";

import styles from "./Card.module.scss";

interface CardProps {
  onClick?: () => void;
  children: ReactNode;
}

export function Card({ onClick, children }: CardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;

    // role="button"으로 선언한 이상 네이티브 button처럼 Enter/Space로도 눌러야 한다.
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className={clsx(styles.card, onClick && styles.clickable)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
