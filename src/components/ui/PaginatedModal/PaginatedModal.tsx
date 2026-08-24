import type { ReactNode } from "react";

import { Modal, ModalBody, ModalFooter } from "../Modal/Modal";
import { useModalTitleId } from "../Modal/modalTitleContext";

import styles from "./PaginatedModal.module.scss";

interface PaginatedModalProps {
  title: string;
  onClose: () => void;
  /** 1부터 세는 현재 위치와 전체 개수. 서버가 계산해 준다. */
  current: number;
  total: number;
  /** `null` 이면 그쪽 끝이라 버튼을 누를 수 없다. */
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  children: ReactNode;
  /** 푸터 좌측에 붙는 것. 저장 버튼 같은 것. */
  actions?: ReactNode;
}

/**
 * 순차 탐색이 붙은 모달. 와이어프레임 p18 · p19.
 *
 * **공통 `Modal` 을 감싸는 어드민 전용 래퍼다.** 헤더에 `1 / 2` 를 넣어야 하는데
 * `ModalHeader` 는 제목과 닫기만 받는다. 그쪽을 고치는 대신 여기서 헤더를 직접 그린다 —
 * 순차 탐색은 평가·피드백 화면에만 있는 요구라 공통 컴포넌트가 알 필요가 없다.
 */
interface HeaderProps {
  title: string;
  current: number;
  total: number;
  onClose: () => void;
}

/**
 * **`Modal` 안에서 그려야 한다.** 제목 id 는 `Modal` 이 컨텍스트로 내려주므로
 * 바깥에서 훅을 부르면 값을 받지 못하고 `aria-labelledby` 가 끊긴다.
 */
function Header({ title, current, total, onClose }: HeaderProps) {
  const titleId = useModalTitleId();

  return (
    <div className={styles.header}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <span className={styles.counter} aria-live="polite">
        {current} / {total}
      </span>
      <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
        ✕
      </button>
    </div>
  );
}

export function PaginatedModal({
  title,
  onClose,
  current,
  total,
  onPrev,
  onNext,
  children,
  actions,
}: PaginatedModalProps) {
  return (
    <Modal isOpen onClose={onClose}>
      <Header title={title} current={current} total={total} onClose={onClose} />

      <ModalBody>{children}</ModalBody>

      <ModalFooter>
        <div className={styles.footer}>
          <div className={styles.nav}>
            <button type="button" onClick={() => onPrev?.()} disabled={onPrev === null}>
              &lt; 이전
            </button>
            <button type="button" onClick={() => onNext?.()} disabled={onNext === null}>
              다음 &gt;
            </button>
          </div>
          {actions}
        </div>
      </ModalFooter>
    </Modal>
  );
}
