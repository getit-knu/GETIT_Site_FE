import { useSession } from "../../hooks/auth/useSession";

import styles from "./MyPage.module.scss";

/** 프로필 이미지가 없을 때 쓸 이니셜. `Topbar`의 것과 같은 규칙(한글 이름은 성을 뺀 첫 글자). */
function initialOf(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

/** 내 정보(마이페이지). Figma 와이어프레임(`7:6721`) 기준. */
export default function MyPage() {
  const { user } = useSession();

  // RequireRole 이 이 라우트까지 오는 걸 이미 보장해서, 여기 도달했으면 로그인 상태다.
  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>내 정보</h1>

        <div className={styles.profileCard}>
          <div className={styles.identity}>
            {user.profileImageUrl ? (
              <img className={styles.avatar} src={user.profileImageUrl} alt="" />
            ) : (
              <span className={styles.avatar} aria-hidden="true">
                {initialOf(user.name)}
              </span>
            )}
            <div>
              <h2 className={styles.name}>{user.name}</h2>
              {user.major && user.studentYear && (
                <p className={styles.subtitle}>
                  {user.major} {user.studentYear}학번
                </p>
              )}
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div>
              <p className={styles.label}>이메일</p>
              <div className={styles.infoValue}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                  <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path
                    d="M3 5.5l7 5.25 7-5.25"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{user.email}</span>
              </div>
            </div>
            <div>
              <p className={styles.label}>학과</p>
              <div className={styles.infoValue}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                  <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.3" />
                  <path
                    d="M4 16.5c0-3.038 2.686-5.5 6-5.5s6 2.462 6 5.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                <span>{user.major ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
