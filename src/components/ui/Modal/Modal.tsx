import clsx from "clsx";
import { useContext, useEffect, useId, useRef } from "react";
import type { AnimationEvent, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

import { useAnimatedPresence } from "../../../hooks/ui/useAnimatedPresence";

import styles from "./Modal.module.scss";
import { ModalTitleContext } from "./modalTitleContext";

/** 퇴장 애니메이션 길이($duration-base 200ms)보다 넉넉히 잡은 폴백 시한. */
const EXIT_MS = 250;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  className?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, closeOnOverlayClick = true, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);
  const titleId = useId();
  /*
    닫힐 때 바로 사라지지 않고 퇴장 애니메이션이 끝날 때까지 마운트를 유지한다.

    `isOpen`이 아니라 `mounted`로 그릴지 말지를 정한다 — 그래서 `isOpen`이 false가 되는
    순간 아래 두 이펙트(Esc 처리·포커스 가둠)는 곧바로 정리되고 포커스도 원래 자리로
    돌아간다. 사라지는 중인 껍데기가 키보드를 계속 붙잡고 있으면 안 된다.
  */
  const { mounted, exiting, endExit } = useAnimatedPresence(isOpen, EXIT_MS);

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

  if (!mounted) return null;

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    mouseDownTargetRef.current = event.target;
  }

  /** 퇴장 애니메이션이 끝나면 진짜로 없앤다. 안쪽에서 올라온 애니메이션은 무시한다. */
  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    endExit();
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    // 나가는 중에는 오버레이를 눌러도 이미 닫히는 중이라 할 일이 없다.
    if (exiting || !closeOnOverlayClick) return;

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
      data-exiting={exiting || undefined}
      /*
        나가는 중에는 접근성 트리에서 즉시 뺀다. 눈에는 사라지는 모습이 보여야 하지만,
        스크린리더에는 이미 닫힌 대화상자다 — 포커스는 이 시점에 원래 자리로 돌아간 뒤라
        `aria-hidden` 안에 포커스가 갇히는 문제도 없다.
      */
      aria-hidden={exiting || undefined}
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className={clsx(styles.dialog, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-exiting={exiting || undefined}
        onAnimationEnd={handleAnimationEnd}
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
