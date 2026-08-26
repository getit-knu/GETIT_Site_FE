import clsx from "clsx";

import { useSession } from "../../hooks/auth/useSession";
import { getMyPageStats } from "../../mocks/member/myPageStats";

import styles from "./MyPage.module.scss";

/** 프로필 이미지가 없을 때 쓸 이니셜. `Topbar`의 것과 같은 규칙(한글 이름은 성을 뺀 첫 글자). */
function initialOf(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

/** 내 정보(마이페이지). Figma 와이어프레임(`7:6721`) 기준. */
export default function MyPage() {
  const { user } = useSession();
  const stats = getMyPageStats();

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

        <div className={styles.statsCard}>
          <h3 className={styles.sectionTitle}>학습 통계</h3>
          <div className={styles.statsGrid}>
            <div className={clsx(styles.statBox, styles.statBlue)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path
                  d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5V5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5V5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <strong className={styles.statValue}>{stats.lecturesTaken}</strong>
              <p className={styles.statLabel}>수강한 강의</p>
            </div>

            <div className={clsx(styles.statBox, styles.statGreen)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <strong className={styles.statValue}>{stats.assignmentsSubmitted}</strong>
              <p className={styles.statLabel}>제출한 과제</p>
            </div>
          </div>
        </div>

        <div className={styles.historyCard}>
          <h3 className={styles.sectionTitleSm}>과제 제출 내역</h3>
          <ul className={styles.historyList}>
            {stats.submissionHistory.map((entry) => (
              <li key={`${entry.status}-${entry.weeks}`} className={styles.historyRow}>
                <p className={styles.historyStatus}>
                  {entry.status}:{" "}
                  <strong className={entry.status === "미제출" ? styles.danger : styles.warning}>
                    {entry.count}회
                  </strong>
                </p>
                <span className={styles.historyWeeks}>{entry.weeks}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
