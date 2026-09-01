import { useEffect, useRef } from "react";
import type { AnimationEvent } from "react";

import { useAnimatedPresence } from "../../../hooks/ui/useAnimatedPresence";

import styles from "./Toast.module.scss";

/** 퇴장 애니메이션(150ms)보다 넉넉히 잡은 폴백 시한. */
const EXIT_MS = 200;

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  /**
   * 떠 있어야 하는지. `false`로 바꾸면 곧바로 사라지지 않고 **내려가는 모습을 보여준 뒤**
   * 스스로 아무것도 그리지 않는다.
   *
   * 부모가 `{조건 && <Toast/>}`로 조건부 마운트하면 퇴장을 보여줄 방법이 없다 — 조건이
   * 꺼지는 순간 DOM에서 통째로 빠지기 때문이다. 그런 호출부는 기본값(`true`)으로 종전과
   * 똑같이 동작하고, 퇴장을 보여주고 싶은 쪽만 계속 마운트한 채 이 값을 내리면 된다.
   */
  open?: boolean;
  message: string;
  /** 있으면 토스트가 되묻는 역할을 한다 — 누르지 않으면 아무 일도 일어나지 않는다. */
  action?: ToastAction;
  onClose: () => void;
  /** 저절로 닫히기까지의 시간(ms). */
  duration?: number;
}

const DEFAULT_DURATION = 8000;

/**
 * 화면 아래에 잠깐 떠서 알리는 띠.
 *
 * `action` 을 주면 **되묻는 용도**로 쓸 수 있다. 그때는 넉넉히 띄워 둔다 — 읽고 판단할
 * 시간이 필요한데 지나가 버리면 아무것도 못 한다. 저절로 닫히는 것은 "취소" 와 같다:
 * 놓쳐서 되돌릴 수 없는 일이 일어나는 쪽으로는 절대 기울지 않는다.
 */
export function Toast({ open = true, message, action, onClose, duration = DEFAULT_DURATION }: ToastProps) {
  const actionRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const { mounted, exiting, endExit } = useAnimatedPresence(open, EXIT_MS);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    // 이미 내려가는 중이면 다시 닫으라고 재촉할 이유가 없다.
    if (!open) return;

    // onClose 를 deps 에 넣으면 부모가 `onClose={() => ...}` 처럼 인라인 함수를 넘길 때
    // 리렌더마다 타이머가 새로 걸려 duration 이 지나도 닫히지 않는다. 최신 콜백은 ref 로만 읽는다.
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration, open]);

  useEffect(() => {
    // 되묻는 토스트는 키보드만 쓰는 사람도 바로 답할 수 있어야 한다.
    if (open) actionRef.current?.focus();
  }, [open]);

  if (!mounted) return null;

  /** 퇴장이 끝나면 진짜로 없앤다. 안쪽에서 올라온 애니메이션은 무시한다. */
  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    endExit();
  }

  return (
    <div
      className={styles.toast}
      role="alert"
      data-exiting={exiting || undefined}
      // 내려가는 중에는 스크린리더에서 즉시 뺀다 — 사용자에겐 이미 답이 끝난 알림이다.
      aria-hidden={exiting || undefined}
      onAnimationEnd={handleAnimationEnd}
    >
      <p className={styles.message}>{message}</p>
      {action !== undefined && (
        <button ref={actionRef} type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
      <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
