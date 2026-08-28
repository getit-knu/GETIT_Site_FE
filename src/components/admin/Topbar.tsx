import type { Me } from "../../types/auth";

import styles from "./Topbar.module.scss";

const ROLE_LABEL: Record<Me["role"], string> = {
  GUEST: "비회원",
  MEMBER: "부원",
  ADMIN: "운영진",
};

/** 프로필 이미지가 없을 때 쓸 이니셜. 한글 이름은 성을 뺀 첫 글자가 더 알아보기 쉽다. */
function initialOf(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

interface TopbarProps {
  title: string;
  user: Me | undefined;
  onMenuClick: () => void;
}

export function Topbar({ title, user, onMenuClick }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button type="button" className={styles.menuButton} aria-label="메뉴 열기" onClick={onMenuClick}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        {/*
          와이어프레임에는 배지에 `2` 가 찍혀 있지만 대응하는 API 가 없다.
          숫자를 지어내면 실제로 읽지 않은 항목이 있는 것처럼 보이므로 배지는 달지 않는다.
          TODO: 알림 API 가 생기면 미확인 개수를 붙인다.
        */}
        <button type="button" className={styles.bell} aria-label="알림">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
          </svg>
        </button>

        {user && (
          <div className={styles.account}>
            <div className={styles.identity}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.role}>{ROLE_LABEL[user.role]}</span>
            </div>
            {user.profileImageUrl ? (
              <img className={styles.avatar} src={user.profileImageUrl} alt="" />
            ) : (
              <span className={styles.avatar} aria-hidden="true">
                {initialOf(user.name)}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
