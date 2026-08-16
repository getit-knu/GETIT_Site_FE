import { useEffect, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

import styles from "./Modal.module.scss";

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialog) return;

      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", trapFocus);

    return () => {
      document.removeEventListener("keydown", trapFocus);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
        ✕
      </button>
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
}

export function ModalBody({ children }: ModalBodyProps) {
  return <div className={styles.body}>{children}</div>;
}

interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <div className={styles.footer}>{children}</div>;
}
