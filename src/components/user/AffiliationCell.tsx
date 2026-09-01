import { useState } from "react";

import type { AdminUser } from "../../types/user";

import styles from "./AffiliationCell.module.scss";

interface AffiliationCellProps {
  user: AdminUser;
  disabled: boolean;
  onSave: (patch: { college?: string; major?: string }) => void;
}

/**
 * 소속(단과대학·학과) 입력칸.
 *
 * 본인 수정(`MyPage`, #199)은 오타를 막으려 College · Major 마스터 데이터의 id로만 받지만,
 * 어드민 수정(9.2)은 자유 문자열 그대로 둔다 — 마스터에 없는 학과를 예외적으로 적어야 할
 * 때가 있어서다(PR #200 결정).
 *
 * `GenerationCell`과 같은 방식 — 값이 바뀐 채로 포커스를 벗어나야 저장한다. 빈 값으로
 * 지우고 벗어나면 그것도 저장된다(빈 문자열은 유효한 값이라 실수로 채운 소속을 지울 수
 * 있어야 한다) — 원래 값 그대로면 저장하지 않는다.
 */
export function AffiliationCell({ user, disabled, onSave }: AffiliationCellProps) {
  const [college, setCollege] = useState(user.college ?? "");
  const [major, setMajor] = useState(user.major ?? "");

  function commitCollege() {
    const trimmed = college.trim();
    setCollege(trimmed);
    if (trimmed === (user.college ?? "")) return;
    onSave({ college: trimmed });
  }

  function commitMajor() {
    const trimmed = major.trim();
    setMajor(trimmed);
    if (trimmed === (user.major ?? "")) return;
    onSave({ major: trimmed });
  }

  return (
    <div className={styles.affiliation}>
      <input
        className={styles.affiliationInput}
        aria-label={`${user.name} 단과대학`}
        value={college}
        disabled={disabled}
        onChange={(e) => setCollege(e.target.value)}
        onBlur={commitCollege}
        placeholder="단과대학"
      />
      <input
        className={styles.affiliationInput}
        aria-label={`${user.name} 학과`}
        value={major}
        disabled={disabled}
        onChange={(e) => setMajor(e.target.value)}
        onBlur={commitMajor}
        placeholder="학과"
      />
    </div>
  );
}
