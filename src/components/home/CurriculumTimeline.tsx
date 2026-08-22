import styles from "./CurriculumTimeline.module.scss";

const CURRICULUM = [
  {
    id: "semester-1",
    title: "1학기",
    items: ["GETIT Chat", "SW 교육", "창업 빌드업", "세미나", "창업 관련 행사", "창업 해커톤"],
  },
  {
    id: "semester-2",
    title: "2학기",
    items: ["GETIT Chat", "창업 빌드업", "세미나", "아이디어톤", "MVP 제작", "유저유치행사"],
  },
];

export function CurriculumTimeline() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 className={styles.title}>커리큘럼</h2>
          <p className={styles.subtitle}>체계적인 교육 프로그램으로 성장하세요</p>
        </div>

        <div className={styles.grid}>
          {CURRICULUM.map((semester) => (
            <div key={semester.id} className={styles.card}>
              <h3 className={styles.semesterTitle}>{semester.title}</h3>
              <ul className={styles.itemList}>
                {semester.items.map((item) => (
                  <li key={item} className={styles.item}>
                    <span className={styles.dot} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
