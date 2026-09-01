import { useState } from "react";

import type { AdminUser } from "../../types/user";

import styles from "./GenerationCell.module.scss";

interface GenerationCellProps {
  user: AdminUser;
  disabled: boolean;
  onSave: (generationNo: number) => void;
}

/**
 * 기수 입력칸(0831 QA에서 발견). `LectureService.requireActiveMember`가 `generationNo`가
 * 없거나 활성 기수와 다르면 403을 던지는데, 권한만 바꾸는 옆 칸(`Select`)엔 기수를 넣을
 * 방법이 아예 없었다 — 그래서 권한만 올린 계정은 강좌·대시보드가 계속 막혀 있었다.
 *
 * 목록으로 고를 만한 "전체 기수" 조회 엔드포인트가 없어 자유 입력 칸으로 둔다. 값이
 * 바뀐 채로 포커스를 벗어나야만 저장한다 — `Select`처럼 즉시 반영하면 숫자를 한 자리씩
 * 지우는 중간에도 저장이 나간다.
 */
export function GenerationCell({ user, disabled, onSave }: GenerationCellProps) {
  const [draft, setDraft] = useState(user.generationNo === null ? "" : String(user.generationNo));

  function commit() {
    const value = Number(draft);
    if (draft.trim() === "" || !Number.isInteger(value) || value < 1) {
      setDraft(user.generationNo === null ? "" : String(user.generationNo));
      return;
    }
    if (value !== user.generationNo) onSave(value);
  }

  return (
    <input
      type="number"
      className={styles.generationInput}
      aria-label={`${user.name} 기수`}
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  );
}
