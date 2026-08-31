import { useEffect, useRef } from "react";

import styles from "./Toast.module.scss";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
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
export function Toast({ message, action, onClose, duration = DEFAULT_DURATION }: ToastProps) {
  const actionRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    // onClose 를 deps 에 넣으면 부모가 `onClose={() => ...}` 처럼 인라인 함수를 넘길 때
    // 리렌더마다 타이머가 새로 걸려 duration 이 지나도 닫히지 않는다. 최신 콜백은 ref 로만 읽는다.
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    // 되묻는 토스트는 키보드만 쓰는 사람도 바로 답할 수 있어야 한다.
    actionRef.current?.focus();
  }, []);

  return (
    <div className={styles.toast} role="alert">
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
