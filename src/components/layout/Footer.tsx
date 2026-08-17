import styles from "./Footer.module.scss";

/**
 * 공개 사이트 하단 푸터.
 *
 * "바로가기" 항목(지원하기·프로젝트·운영진)도 Nav와 같은 이유로 아직 클릭되지 않는
 * 텍스트다 — 대상 페이지가 생기면 링크로 바꾼다.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div>
            <h3 className={styles.heading}>GETIT</h3>
            <p className={styles.muted}>금융 IT 동아리로 함께 성장하는 커뮤니티</p>
          </div>

          <div>
            <h4 className={styles.subheading}>바로가기</h4>
            <ul className={styles.linkList}>
              <li>지원하기</li>
              <li>프로젝트</li>
              <li>운영진</li>
            </ul>
          </div>

          <div>
            <h4 className={styles.subheading}>문의</h4>
            <p className={styles.muted}>getit@example.com</p>
          </div>
        </div>

        <p className={styles.copyright}>© 2026 GETIT. All rights reserved.</p>
      </div>
    </footer>
  );
}
