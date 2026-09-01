import { useEffect, useRef } from "react";
import { Link } from "react-router";

import { prefersReducedMotion } from "../../libs/prefersReducedMotion";

import styles from "./Hero.module.scss";

/**
 * Home 최상단 히어로. "9기 지원하러 가기"는 `/apply`, "프로젝트 구경하기"는 `/projects`로 이동한다.
 *
 * 마우스를 따라 텍스트가 아주 미세하게 기우는 패럴랙스를 얹었다(UX 라운드 2). 리렌더 없이
 * CSS 변수(`--parallax-x/y`)만 rAF로 갱신하고, 실제 이동량·전환은 `Hero.module.scss`가 정한다.
 * 마우스 전용이라 터치 포인터는 무시하고, 동작 줄이기 사용자에겐 리스너 자체를 안 단다.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (sectionEl === null || prefersReducedMotion()) return;

    // 클로저(이벤트 핸들러·rAF 콜백)에서도 non-null로 쓰기 위한 좁혀진 별칭.
    const section: HTMLElement = sectionEl;

    let raf = 0;

    function apply(x: number, y: number) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        section.style.setProperty("--parallax-x", x.toFixed(3));
        section.style.setProperty("--parallax-y", y.toFixed(3));
      });
    }

    function handleMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const rect = section.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // 섹션 중앙을 (0, 0)으로 두는 -0.5 ~ 0.5 좌표
      apply((event.clientX - rect.left) / rect.width - 0.5, (event.clientY - rect.top) / rect.height - 0.5);
    }

    function handleLeave() {
      apply(0, 0);
    }

    section.addEventListener("pointermove", handleMove);
    section.addEventListener("pointerleave", handleLeave);
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", handleMove);
      section.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.hero}>
      <div className={styles.blobNavy} aria-hidden="true" />
      <div className={styles.blobPeriwinkle} aria-hidden="true" />
      <div className={styles.blobLavender} aria-hidden="true" />

      <div className={styles.inner}>
        <p className={styles.badge}>경북대학교 컴퓨터학부 SW&창업 동아리</p>

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
