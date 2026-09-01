import styles from "./HomeBoundaryDecor.module.scss";

/**
 * Home 전용 좌우 여백 장식. 히어로 한정 오로라(픽스 라운드 2)가 "너무 어두워진다"는 피드백으로
 * 기각된 뒤, 사용자가 지정한 새 방향 — 화면 좌우 가장자리에만 은은한 세로 글로우를 두고
 * 중앙 콘텐츠는 건드리지 않는다. `position: fixed`라 Home을 스크롤하는 내내 화면 가장자리에
 * 그대로 붙어 있다(섹션이 바뀌어도 잘리거나 끊기지 않는다).
 */
export function HomeBoundaryDecor() {
  return (
    <>
      <div className={`${styles.decor} ${styles.left}`} aria-hidden="true" />
      <div className={`${styles.decor} ${styles.right}`} aria-hidden="true" />
    </>
  );
}
