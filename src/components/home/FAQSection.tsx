import styles from "./FAQSection.module.scss";

/**
 * 아직 실제 답변 콘텐츠가 없어 질문 목록만 정적으로 보여준다. 실제 답변이 생기면
 * 그때 펼침/접힘 인터랙션을 추가한다.
 */
const QUESTIONS = [
  "동아리 활동 시간은 어떻게 되나요?",
  "프로그래밍을 처음 배우는데 괜찮을까요?",
  "회비가 있나요?",
  "어떤 학과 학생들이 지원하나요?",
];

export function FAQSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 className={styles.title}>자주 묻는 질문</h2>
          <p className={styles.subtitle}>FAQ</p>
        </div>

        <ul className={styles.list}>
          {QUESTIONS.map((question) => (
            <li key={question} className={styles.item}>
              <span>{question}</span>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
