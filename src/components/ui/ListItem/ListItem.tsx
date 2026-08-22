import type { ReactNode } from "react";

import styles from "./ListItem.module.scss";

/**
 * 배경색만 다른 같은 구조. 와이어프레임 p5 의 세 목록이 이 형태를 공유한다 —
 * 미확인 Q&A(옅은 파랑) · 행사 일정(옅은 노랑) · 진행 중 강의(회색).
 */
export type ListItemTone = "blue" | "yellow" | "gray";

interface ListItemProps {
  title: string;
  /** 제목 아래 한 줄. 소속·일시처럼 보조 정보를 담는다. */
  meta: ReactNode;
  tone: ListItemTone;
  /** 우측 끝에 붙는 것. D-day 배지 같은 것. */
  trailing?: ReactNode;
  /** 주면 항목 전체가 링크가 된다. */
  href?: string;
  /** `href` 를 쓸 때 라우터 `Link` 를 넘긴다. 이 컴포넌트는 라우터를 모른다. */
  linkAs?: (props: { to: string; className: string; children: ReactNode }) => ReactNode;
}

export function ListItem({ title, meta, tone, trailing, href, linkAs }: ListItemProps) {
  const body = (
    <>
      <span className={styles.title}>{title}</span>
      <span className={styles.meta}>{meta}</span>
    </>
  );

  return (
    <li className={`${styles.item} ${styles[tone]}`}>
      {href && linkAs ? linkAs({ to: href, className: styles.link, children: body }) : body}
      {trailing}
    </li>
  );
}
