import { useState } from "react";
import type { MouseEvent } from "react";

import { PrivacyConsent } from "../components/ui/PrivacyConsent/PrivacyConsent";
import { LOGIN_PRIVACY_NOTICE } from "../libs/privacyNotices";

import styles from "./LoginPage.module.scss";

const CONSENT_ID = "login-privacy-consent";

/** Google 4색 로고. 브랜드 아이콘이라 원본 색상 그대로 직접 그린다(Figma 원격 asset은 7일 뒤 만료). */
function GoogleIcon() {
  return (
    <svg className={styles.googleIcon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.99-4.33 2.99-7.33Z"
      />
      <path
        fill="#34A853"
        d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.23-2.5c-.9.6-2.06.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H1.06v2.59A10 10 0 0 0 10 20Z"
      />
      <path fill="#FBBC05" d="M4.4 11.91a5.99 5.99 0 0 1 0-3.82V5.5H1.06a10 10 0 0 0 0 9l3.34-2.59Z" />
      <path
        fill="#EA4335"
        d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.96 9.96 0 0 0 10 0a10 10 0 0 0-8.94 5.5l3.34 2.59C5.19 5.74 7.4 3.98 10 3.98Z"
      />
    </svg>
  );
}

/** 로그인. Figma 와이어프레임(`5:3207`) 기준. "테스트 계정" 섹션은 BE 대응 엔드포인트가 없어 제외. */
export default function LoginPage() {
  const googleLoginUrl = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`;
  const [consent, setConsent] = useState(false);
  const [blocked, setBlocked] = useState(false);

  /*
    구글로 넘어가는 순간부터는 BE가 계정을 만들고 이메일·이름 등을 그대로 받는다 —
    돌아온 뒤에는 이미 늦다. 그래서 링크는 href를 그대로 두어(스크린리더에도 진짜
    링크로 읽힌다) 클릭만 막고, 동의 칸으로 데려다 놓는다.
  */
  function handleLoginClick(event: MouseEvent<HTMLAnchorElement>) {
    if (consent) return;
    event.preventDefault();
    setBlocked(true);
    document.getElementById(CONSENT_ID)?.focus();
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <span className={styles.iconBox} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" focusable="false">
            <path
              d="M13 8V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 15l4-3-4-3M9 12h12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h1 className={styles.title}>로그인</h1>
        <p className={styles.subtitle}>GET IT에 오신 것을 환영합니다</p>

        <div className={styles.card}>
          <PrivacyConsent
            id={CONSENT_ID}
            checked={consent}
            onChange={(next) => {
              setConsent(next);
              if (next) setBlocked(false);
            }}
            notice={LOGIN_PRIVACY_NOTICE}
            error={blocked ? "로그인하려면 개인정보 수집·이용에 동의해 주세요." : undefined}
          />

          <a className={styles.googleButton} href={googleLoginUrl} onClick={handleLoginClick}>
            <GoogleIcon />
            Google로 로그인
          </a>
        </div>
      </div>
    </div>
  );
}
