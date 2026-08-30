import { Link } from "react-router";

import styles from "./Footer.module.scss";

const INSTAGRAM_URL = "https://www.instagram.com/knu_get_it/";

/** 공개 사이트 하단 푸터. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div>
            <h3 className={styles.heading}>GETIT</h3>
            <p className={styles.muted}>상상을 현실로 만드는 IT 창업 동아리, GETIT</p>
          </div>

          <div>
            <h4 className={styles.subheading}>바로가기</h4>
            <ul className={styles.linkList}>
              <li>
                <Link to="/apply" className={styles.link}>
                  지원하기
                </Link>
              </li>
              <li>
                <Link to="/projects" className={styles.link}>
                  프로젝트
                </Link>
              </li>
              <li>
                <Link to="/leaders" className={styles.link}>
                  운영진
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={styles.subheading}>문의</h4>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={styles.link}>
              Instagram
            </a>
          </div>
        </div>

        <p className={styles.copyright}>© 2026 GETIT. All rights reserved.</p>
      </div>
    </footer>
  );
}
