import styles from "./ProjectShowcase.module.scss";

/** 실제 프로젝트 API 연동 전까지는 목업 3건과 장식용 그라디언트 썸네일을 보여준다. */
const PROJECTS = [
  {
    id: "portfolio-recommender",
    title: "주식 포트폴리오 추천 시스템",
    description: "AI 기반 맞춤형 포트폴리오 추천",
    gradient: "linear-gradient(150deg, #ad46ff 0%, #f6339a 100%)",
  },
  {
    id: "crypto-trading-bot",
    title: "암호화폐 트레이딩 봇",
    description: "자동화된 거래 시스템 구축",
    gradient: "linear-gradient(150deg, #2b7fff 0%, #00b8db 100%)",
  },
  {
    id: "news-sentiment-analysis",
    title: "금융 뉴스 감성 분석",
    description: "NLP를 활용한 시장 동향 분석",
    gradient: "linear-gradient(150deg, #ff6900 0%, #fb2c36 100%)",
  },
];

/**
 * "모든 프로젝트 보기" · "지원하기"는 프로젝트 목록 · 지원하기 페이지가 아직 없어
 * Nav와 같은 이유로 클릭되지 않는 텍스트로 둔다.
 */
export function ProjectShowcase() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 className={styles.title}>프로젝트 쇼케이스</h2>
          <p className={styles.subtitle}>GETIT 부원들이 만든 프로젝트를 확인해보세요</p>
        </div>

        <ul className={styles.list}>
          {PROJECTS.map((project) => (
            <li key={project.id} className={styles.row}>
              <div className={styles.thumbnail} style={{ backgroundImage: project.gradient }} aria-hidden="true" />
              <div className={styles.content}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <span className={styles.viewAllLink}>
            모든 프로젝트 보기
            <svg className={styles.viewAllIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <div className={styles.applyBadge}>
            <span className={styles.ddayLabel}>D-DAY</span>
            <span className={styles.applyCta}>
              지원하기
              <svg className={styles.applyIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
