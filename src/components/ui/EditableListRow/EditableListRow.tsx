import type { ReactNode } from "react";

import styles from "./EditableListRow.module.scss";

interface EditableListRowProps {
  /** 입력칸들. 행마다 개수가 달라 슬롯으로 받는다. */
  children: ReactNode;
  /** 무엇을 지우는지 낭독기가 알 수 있어야 한다. */
  removeLabel: string;
  onRemove: () => void;
  /** 순서를 바꿀 수 있으면 준다. 끝 행은 그쪽이 `null`. */
  onMoveUp?: (() => void) | null;
  onMoveDown?: (() => void) | null;
  moveLabel?: string;
  disabled?: boolean;
}

/**
 * 입력칸 + 우측 빨간 휴지통. 와이어프레임 p6 · p9 · p10 에서 반복된다.
 *
 * **순서 변경은 드래그가 아니라 화살표로 한다.** 드래그는 키보드로 조작할 수 없어
 * 접근성 대응을 따로 해야 하고, 문항이 늘어나면 놓을 자리를 찾기도 어렵다.
 */
export function EditableListRow({
  children,
  removeLabel,
  onRemove,
  onMoveUp,
  onMoveDown,
  moveLabel = "",
  disabled,
}: EditableListRowProps) {
  const movable = onMoveUp !== undefined || onMoveDown !== undefined;

  return (
    <li className={styles.row}>
      {movable && (
        <div className={styles.move}>
          <button
            type="button"
            aria-label={`${moveLabel} 위로`}
            disabled={disabled || !onMoveUp}
            onClick={() => onMoveUp?.()}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`${moveLabel} 아래로`}
            disabled={disabled || !onMoveDown}
            onClick={() => onMoveDown?.()}
          >
            ↓
          </button>
        </div>
      )}

      <div className={styles.fields}>{children}</div>

      <button type="button" className={styles.remove} aria-label={removeLabel} disabled={disabled} onClick={onRemove}>
        🗑
      </button>
    </li>
  );
}
