import clsx from "clsx";

import styles from "./FestaProjectIcon.module.scss";

interface FestaProjectIconProps {
  title: string;
  thumbnailUrl: string | null;
  size: "card" | "detail";
}

/**
 * 앱스토어처럼 둥근 정사각형 아이콘. 지금 썸네일은 가로형이 많아 가운데를 정사각형으로
 * 잘라 보여준다(`background-size: cover`). 썸네일이 없으면 제목 첫 글자(코드 포인트 단위)를 쓴다.
 */
export function FestaProjectIcon({ title, thumbnailUrl, size }: FestaProjectIconProps) {
  return (
    <span
      className={clsx(styles.icon, styles[size])}
      style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : undefined}
      aria-hidden="true"
    >
      {thumbnailUrl ? null : (Array.from(title.trim())[0] ?? "")}
    </span>
  );
}
