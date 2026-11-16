import type { FestaContact } from "../../hooks/festa/useFestaContact";
import { rememberReturnPath, googleLoginUrl } from "../../libs/loginReturn";
import { PHONE_NUMBER_EXAMPLE, PHONE_NUMBER_MAX_LENGTH } from "../../libs/phoneNumber";
import { FESTA_PRIVACY_NOTICE } from "../../libs/privacyNotices";
import { Input } from "../ui/Input/Input";
import { PrivacyConsent } from "../ui/PrivacyConsent/PrivacyConsent";

import styles from "./FestaJoinPanel.module.scss";

interface FestaJoinPanelProps {
  /** 투자(`useFestaInvestment`)와 투표(`useFestaVote`) 상태 모두 이 모양을 갖는다. */
  state: { phase: "loading" | "signedOut" | "error" | "ready"; loadError: string | null; contact: FestaContact };
  copy: { signedOut: string; login: string; ready: string };
}

/**
 * 쇼케이스 위쪽 참여 안내(#364, #373). 비로그인이면 로그인 버튼, 로그인했으면 추첨 연락처를 받는다.
 * 고르기는 카드에서, 저장은 아래 바에서 한다.
 */
export function FestaJoinPanel({ state, copy }: FestaJoinPanelProps) {
  if (state.phase === "loading") return null;

  if (state.phase === "signedOut") {
    return (
      <section className={styles.panel} aria-label="참여하기">
        <p className={styles.lead}>{copy.signedOut} 참여한 분 중 추첨으로 스타벅스 기프티콘을 드려요.</p>
        {/* 로그인하고 나면 이 화면으로 돌아온다 — 안 그러면 역할별 기본 화면(/member 등)으로 빠진다. */}
        <a className={styles.login} href={googleLoginUrl()} onClick={() => rememberReturnPath("/")}>
          {copy.login}
        </a>
      </section>
    );
  }

  if (state.phase === "error") {
    return (
      <section className={styles.panel} aria-label="참여하기">
        <p role="alert" className={styles.lead}>
          {state.loadError}
        </p>
      </section>
    );
  }

  const { contact } = state;

  return (
    <section className={styles.panel} aria-label="참여하기">
      <p className={styles.lead}>{copy.ready}</p>

      {contact.needsPhone ? (
        <div className={styles.contact}>
          <Input
            label="추첨 연락처 (휴대전화)"
            value={contact.phone}
            onChange={contact.setPhone}
            placeholder={PHONE_NUMBER_EXAMPLE}
            maxLength={PHONE_NUMBER_MAX_LENGTH}
          />
          <PrivacyConsent checked={contact.consent} onChange={contact.setConsent} notice={FESTA_PRIVACY_NOTICE} />
          {contact.maskedPhoneNumber !== null && (
            <button type="button" className={styles.link} onClick={contact.cancelEditing}>
              번호 그대로 두기
            </button>
          )}
        </div>
      ) : (
        <p className={styles.saved}>
          추첨 연락처 <strong>{contact.maskedPhoneNumber}</strong>
          <button type="button" className={styles.link} onClick={contact.startEditing}>
            번호 바꾸기
          </button>
        </p>
      )}
    </section>
  );
}
