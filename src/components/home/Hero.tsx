import styles from "./Hero.module.scss";

/**
 * Home 최상단 히어로.
 *
 * "9기 지원하러 가기" · "프로젝트 구경하기"는 지원하기 · 프로젝트 페이지가 아직 없어
 * Nav와 같은 이유로 클릭되지 않는 텍스트로 둔다. 페이지가 생기면 링크로 바꾼다.
 */
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
          <span className={styles.primaryCta}>
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
          </span>
          <span className={styles.secondaryCta}>프로젝트 구경하기</span>
        </div>
      </div>
    </section>
  );
}
