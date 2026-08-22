import { ACTIVITIES } from "../../mocks/home/activities";

import styles from "./ActivityPhotos.module.scss";

/** 실제 활동 사진은 아직 없어 Figma의 회색 플레이스홀더 그대로 보여준다. */
export function ActivityPhotos() {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>GETIT과 함께한 순간들</h2>
        <p className={styles.subtitle}>타과생도 부담 없이, 동아리 활동 현장을 먼저 만나보세요</p>
      </div>

      <ul className={styles.grid}>
        {ACTIVITIES.map((activity) => (
          <li key={activity.id} className={styles.card}>
            <div className={styles.thumbnail} aria-hidden="true">
              <div className={styles.thumbnailIcon} />
            </div>
            <span className={styles.label}>{activity.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
