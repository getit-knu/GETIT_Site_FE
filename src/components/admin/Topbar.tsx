import { Link } from "react-router";

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
        {/* 이전엔 진입 링크 자체가 없었다(#240) — 계정 블록을 내 정보 화면으로 가는 링크로 쓴다. */}
        {user && (
          <Link viewTransition to="/me" className={styles.account}>
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
          </Link>
        )}
      </div>
    </header>
  );
}
