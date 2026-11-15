import type { FestaInvestState } from "../../hooks/festa/useFestaInvestment";
import { rememberReturnPath, googleLoginUrl } from "../../libs/loginReturn";
import { PHONE_NUMBER_EXAMPLE, PHONE_NUMBER_MAX_LENGTH } from "../../libs/phoneNumber";
import { FESTA_PRIVACY_NOTICE } from "../../libs/privacyNotices";
import { Input } from "../ui/Input/Input";
import { PrivacyConsent } from "../ui/PrivacyConsent/PrivacyConsent";

import { formatWon } from "./festaConfig";
import styles from "./FestaInvestPanel.module.scss";

interface FestaInvestPanelProps {
  invest: FestaInvestState;
}

/**
 * 쇼케이스 위쪽 투자 안내(#364). 비로그인이면 로그인 버튼, 로그인했으면 추첨 연락처를 받는다.
 * 금액은 카드에서, 저장은 아래 `FestaInvestBar`에서 한다.
 */
export function FestaInvestPanel({ invest }: FestaInvestPanelProps) {
  if (invest.phase === "loading") return null;

  if (invest.phase === "signedOut") {
    return (
      <section className={styles.panel} aria-label="가상 투자">
        <p className={styles.lead}>
          구글로 로그인하면 누구나 가상 투자금 <strong>1,000만 원</strong>을 받아요. 투자한 분 중 추첨으로 스타벅스
          기프티콘을 드려요.
        </p>
        {/* 로그인하고 나면 이 화면으로 돌아온다 — 안 그러면 역할별 기본 화면(/member 등)으로 빠진다. */}
        <a className={styles.login} href={googleLoginUrl()} onClick={() => rememberReturnPath("/")}>
          구글 로그인하고 투자하기
        </a>
      </section>
    );
  }

  if (invest.phase === "error") {
    return (
      <section className={styles.panel} aria-label="가상 투자">
        <p role="alert" className={styles.lead}>
          {invest.loadError}
        </p>
      </section>
    );
  }

  const { contact } = invest;

  return (
    <section className={styles.panel} aria-label="가상 투자">
      <p className={styles.lead}>
        카드마다 금액을 정해 <strong>{formatWon(invest.budget)}</strong>을 나눠 넣고 저장하세요. 행사 기간에는 언제든
        다시 바꿀 수 있어요.
      </p>

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
