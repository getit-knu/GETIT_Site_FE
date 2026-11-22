import { useState } from "react";

import { maskPhoneNumber } from "../../libs/phoneNumber";

import styles from "./MaskedPhone.module.scss";

interface MaskedPhoneProps {
  phoneNumber: string | null;
  /** 누구 번호인지. "보기" 버튼 이름에 쓴다(스크린리더가 줄마다 구분할 수 있게). */
  owner: string;
}

/**
 * 어드민 화면의 전화번호(#408). 기본은 `010-****-5678`로 가리고, "보기"를 눌러야 전체를 보여준다.
 * 화면 너머로 보이거나 캡처·화면 공유로 번호가 새는 것을 줄인다. API는 여전히 전체 번호를 준다(BE 후속).
 */
export function MaskedPhone({ phoneNumber, owner }: MaskedPhoneProps) {
  const [revealed, setRevealed] = useState(false);

  if (!phoneNumber) return <>-</>;

  return (
    <span className={styles.phone}>
      <span className={styles.number}>{revealed ? phoneNumber : maskPhoneNumber(phoneNumber)}</span>
      <button
        type="button"
        className={styles.toggle}
        aria-label={`${owner} 연락처 ${revealed ? "숨기기" : "보기"}`}
        aria-pressed={revealed}
        onClick={() => setRevealed((prev) => !prev)}
      >
        {revealed ? "숨기기" : "보기"}
      </button>
    </span>
  );
}
