import { ACTIVITIES } from "../../mocks/home/activities";

import styles from "./ActivityPhotos.module.scss";

function CardList({ hidden }: { hidden?: boolean }) {
  return (
    <ul className={styles.grid} aria-hidden={hidden}>
      {ACTIVITIES.map((activity) => (
        <li key={activity.id} className={styles.card}>
          <div className={styles.thumbnail} aria-hidden="true">
            <div className={styles.thumbnailIcon} />
          </div>
          <span className={styles.label}>{activity.label}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 실제 활동 사진은 아직 없어 Figma의 회색 플레이스홀더를 그대로 쓴다(#172).
 *
 * 카드 목록을 통째로 한 번 더 복제해 나란히 붙이고, 그 폭의 절반만큼 왼쪽으로
 * 무한 반복 이동시켜 자연스럽게 흘러가는 것처럼 보이게 한다 — 원본과 복제본의
 * 폭이 정확히 같아야 이어지는 지점이 안 보인다(`ActivityPhotos.module.scss` 참고).
 * 복제본은 화면에 두 번 읽히지 않도록 `aria-hidden`으로 접근성 트리에서 뺀다.
 */
export function ActivityPhotos() {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>GETIT과 함께한 순간들</h2>
        <p className={styles.subtitle}>타과생도 부담 없이, 동아리 활동 현장을 먼저 만나보세요</p>
      </div>

      <div className={styles.marquee}>
        <div className={styles.track}>
          <CardList />
          <CardList hidden />
        </div>
      </div>
    </section>
  );
}
