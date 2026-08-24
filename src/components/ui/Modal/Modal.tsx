import { useContext, useEffect, useId, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

import styles from "./Modal.module.scss";
import { ModalTitleContext } from "./modalTitleContext";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, closeOnOverlayClick = true, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);
  const titleId = useId();

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

    // 안에 있는 임의의 요소(예: 첫 번째 버튼) 대신 다이얼로그 자체에 포커스를 준다.
    // 어떤 자식이 "첫 포커스로 적절한지"는 Modal이 알 수 없고, WAI-ARIA도 이 방식을 권장한다.
    dialog?.focus();

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

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    mouseDownTargetRef.current = event.target;
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (!closeOnOverlayClick) return;

    // 다이얼로그 안 텍스트를 드래그로 선택하다 오버레이 위에서 마우스를 놓으면
    // click의 target이 오버레이가 되어버린다. mousedown도 오버레이 자신이었을
    // 때만 닫히게 해서, 드래그가 오버레이에서 "끝난" 것과 "시작한" 것을 구분한다.
    if (event.target === event.currentTarget && mouseDownTargetRef.current === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div
      className={styles.overlay}
      data-testid="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <ModalTitleContext.Provider value={titleId}>{children}</ModalTitleContext.Provider>
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
  const titleId = useContext(ModalTitleContext);

  return (
    <div className={styles.header}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
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
