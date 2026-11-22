import { useState } from "react";

import styles from "./MaskedPhone.module.scss";

interface MaskedPhoneProps {
  /** 서버가 이미 가려서 준 번호(`010-****-5678`, BE#237). 화면은 그대로 쓴다 — 다시 가리면 별표만 남는다. */
  phoneNumber: string | null;
  /** 누구 번호인지. "보기" 버튼 이름에 쓴다(스크린리더가 줄마다 구분할 수 있게). */
  owner: string;
  /** 전체 번호를 받아 온다. 부를 때마다 서버에 열람 기록이 남는다. */
  reveal: () => Promise<string | null>;
}

/**
 * 어드민 화면의 전화번호(#408, #411). 기본은 서버가 가려 준 번호를 보여주고, "보기"를 눌러야
 * 전체 번호를 받아 온다. 받은 번호는 이 칸에만 두고, "숨기기"를 누르면 버린다 — 다시 볼 때 새로
 * 받아야 서버에 열람 기록이 남는다.
 */
export function MaskedPhone({ phoneNumber, owner, reveal }: MaskedPhoneProps) {
  const [fullNumber, setFullNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!phoneNumber) return <>-</>;

  const revealed = fullNumber !== null;

  async function handleClick() {
    if (revealed) {
      setFullNumber(null);
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      // 그사이 번호가 지워졌으면 null 이 온다. 가린 번호를 그대로 둔 채 "없음"을 보여줄 수 없으니 "-" 로 연다.
      setFullNumber((await reveal()) ?? "-");
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className={styles.phone}>
      <span className={styles.number}>{fullNumber ?? phoneNumber}</span>
      <button
        type="button"
        className={styles.toggle}
        aria-label={`${owner} 연락처 ${revealed ? "숨기기" : "보기"}`}
        aria-pressed={revealed}
        disabled={loading}
        onClick={() => void handleClick()}
      >
        {revealed ? "숨기기" : "보기"}
      </button>
      {failed && (
        <span role="alert" className={styles.error}>
          번호를 불러오지 못했어요
        </span>
      )}
    </span>
  );
}
