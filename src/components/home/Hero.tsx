import { Link } from "react-router";

import styles from "./Hero.module.scss";

/** Home 최상단 히어로. "9기 지원하러 가기"는 `/apply`, "프로젝트 구경하기"는 `/projects`로 이동한다. */
export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.blobBlue} aria-hidden="true" />
      <div className={styles.blobTeal} aria-hidden="true" />

      <div className={styles.inner}>
        <p className={styles.badge}>IT STARTUP CLUB</p>

        <h1 className={styles.heading}>
          <span>LET&apos;S MAKE</span>
          <span className={styles.headingAccent}>ANYTHING.</span>
        </h1>

        <p className={styles.description}>상상을 현실로 만드는 IT 창업 동아리, GET IT입니다.</p>

        <div className={styles.actions}>
          <Link to="/apply" className={styles.primaryCta}>
            9기 지원하러 가기
            <svg className={styles.ctaIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link to="/projects" className={styles.secondaryCta}>
            프로젝트 구경하기
          </Link>
        </div>
      </div>
    </section>
  );
}
