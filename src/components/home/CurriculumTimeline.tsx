import { CURRICULUM } from "../../mocks/home/curriculum";

import styles from "./CurriculumTimeline.module.scss";

/**
 * 커리큘럼 섹션. 학기마다 스파인(세로선)을 두고 항목을 좌우로 번갈아 붙이는 실제
 * 타임라인으로 재설계했다(#173) — 예전엔 이름만 "Timeline"이고 실제로는 이어지지
 * 않은 2열 카드 그리드였다. 시안은 디자인 캔버스에서 먼저 잡고 승인받았다.
 */
export function CurriculumTimeline() {
  return (
    <section className={styles.section}>
      <div className={styles.blobBlue} aria-hidden="true" />
      <div className={styles.blobTeal} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 className={styles.title}>커리큘럼</h2>
          <p className={styles.subtitle}>체계적인 교육 프로그램으로 성장하세요</p>
        </div>

        <div className={styles.timeline}>
          {CURRICULUM.map((semester) => (
            <div key={semester.id} className={styles.semester}>
              <div className={styles.semesterBadgeRow}>
                <h3 className={styles.semesterBadge}>{semester.title}</h3>
              </div>

              <div className={styles.timelineList}>
                <div className={styles.spine} aria-hidden="true" />

                {semester.items.map((item, index) => (
                  <div key={item} className={styles.row} data-side={index % 2 === 0 ? "left" : "right"}>
                    <div className={styles.chip}>
                      <span className={styles.chipIndex}>{index + 1}</span>
                      <span className={styles.chipLabel}>{item}</span>
                    </div>
                    <span className={styles.node} aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
