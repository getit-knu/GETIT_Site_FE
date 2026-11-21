import clsx from "clsx";

import styles from "./ProjectCover.module.scss";

interface ProjectCoverProps {
  /** 칸에 넣을 사진. 없으면 칸만 그린다(호출부 배경색). */
  url: string | null;
  /** 칸의 크기·모서리·배경색·호버 효과는 호출부가 정한다. */
  className?: string;
}

/**
 * 프로젝트 썸네일 칸(#398). 사진을 자르지 않고 칸 안에 전부 보여주고, 남는 곳은 같은 사진을 흐리게 깔아
 * 채운다. 정사각형 프로젝트 아이콘이나 세로 휴대폰 스크린샷이 가로 칸에서 잘리던 문제를 막는다.
 *
 * 같은 주소를 두 번 쓰므로 브라우저는 한 번만 받는다. 장식용이라 스크린리더에는 숨긴다.
 */
export function ProjectCover({ url, className }: ProjectCoverProps) {
  return (
    <div className={clsx(styles.cover, className)} aria-hidden="true">
      {url && (
        <>
          <div className={styles.backdrop} style={{ backgroundImage: `url(${JSON.stringify(url)})` }} />
          <img className={styles.image} src={url} alt="" loading="lazy" />
        </>
      )}
    </div>
  );
}
