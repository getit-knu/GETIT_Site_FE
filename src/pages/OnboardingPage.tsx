import { useState } from "react";
import { Navigate } from "react-router";

import { Button } from "../components/ui/Button/Button";
import { PrivacyConsent } from "../components/ui/PrivacyConsent/PrivacyConsent";
import { useConfirmPrivacyConsent, useSession } from "../hooks/auth/useSession";
import { LOGIN_PRIVACY_NOTICE } from "../libs/privacyNotices";
import { destinationFor } from "../libs/roleDestination";

import styles from "./OnboardingPage.module.scss";

const CONSENT_ID = "onboarding-privacy-consent";

/**
 * 신규 유저 전용 첫 화면. `OAuthCallbackPage`가 BE의 `isNewUser`를 보고 여기로 보낸다
 * (`/me`처럼 role 무관 `RequireRole allowed={ROLES}`로 감싸져 있다 — GUEST도 온다).
 *
 * 여기서 개인정보 수집·이용 동의를 받는다. 로그인 버튼 앞이 아니라 여기서 받는 이유는
 * `LoginPage`의 주석 참고 — 기존 회원까지 매번 다시 묻지 않으려면 "신규 유저" 신호가
 * 필요한데, 그건 구글에서 돌아온 뒤에야(`isNewUser`) 안다.
 */
export default function OnboardingPage() {
  const { user } = useSession();
  const [consent, setConsent] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const confirmConsent = useConfirmPrivacyConsent();

  if (!user) return null;

  // 직접 주소를 쳐서 다시 들어오는 등, 이미 동의한 사람은 여기 머물 이유가 없다.
  if (user.privacyConsentedAt) {
    return <Navigate to={destinationFor(user.role)} replace />;
  }

  function handleContinue() {
    if (!consent) {
      setBlocked(true);
      document.getElementById(CONSENT_ID)?.focus();
      return;
    }
    confirmConsent.mutate();
  }

  if (confirmConsent.isSuccess) {
    return <Navigate to={destinationFor(user.role)} replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>GET IT에 오신 것을 환영합니다</h1>
        <p className={styles.subtitle}>시작하기 전에 아래 내용에 동의해 주세요.</p>

        <div className={styles.card}>
          <PrivacyConsent
            id={CONSENT_ID}
            checked={consent}
            onChange={(next) => {
              setConsent(next);
              if (next) setBlocked(false);
            }}
            notice={LOGIN_PRIVACY_NOTICE}
            error={blocked ? "계속하려면 개인정보 수집·이용에 동의해 주세요." : undefined}
          />

          {confirmConsent.isError && (
            <p role="alert" className={styles.reason}>
              동의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          )}

          <Button onClick={handleContinue} disabled={confirmConsent.isPending}>
            {confirmConsent.isPending ? "확인하는 중…" : "동의하고 시작하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
