import { Link, useParams } from "react-router";

import { getMemberLectureDetail } from "../../mocks/lecture/memberLectureDetail";

import styles from "./LectureDetailPage.module.scss";

/** `watch?v=` · `youtu.be/` 링크를 임베드용 iframe src로 바꾼다. 매치되지 않으면 원본을 그대로 준다. */
function toYoutubeEmbedUrl(url: string): string {
  const watchMatch = /[?&]v=([^&]+)/.exec(url);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  const shortMatch = /youtu\.be\/([^?]+)/.exec(url);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  return url;
}

function BackLink() {
  return (
    <Link to="/member" className={styles.backLink}>
      <svg className={styles.backIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M12.5 15L7.5 10L12.5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      강좌 목록으로 돌아가기
    </Link>
  );
}

/** 강의 시청. Figma 와이어프레임(`6:6528`) 기준. 과제 제출·Q&A 섹션은 스코프 밖(#119) — 후속 이슈로 분리. */
export default function LectureDetailPage() {
  const { id } = useParams();
  const lecture = getMemberLectureDetail(Number(id));

  if (!lecture) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.notFound}>강의를 찾을 수 없습니다.</p>
          <BackLink />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <div className={styles.inner}>
          <BackLink />
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.videoWrapper}>
              <iframe
                className={styles.video}
                src={toYoutubeEmbedUrl(lecture.youtubeUrl)}
                title={lecture.title}
                allowFullScreen
              />
            </div>

            <div className={styles.infoCard}>
              <div className={styles.instructor}>
                <span className={styles.avatar} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" focusable="false">
                    <circle cx="12" cy="8" r="3.5" fill="currentColor" />
                    <path
                      d="M5 19c0-3.314 3.134-6 7-6s7 2.686 7 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className={styles.instructorName}>{lecture.instructorName}</p>
                  <p className={styles.postedDate}>{lecture.postedDate}</p>
                </div>
              </div>

              <h1 className={styles.title}>{lecture.title}</h1>

              <section>
                <h2 className={styles.sectionTitle}>학습 구성</h2>
                <p className={styles.description}>{lecture.description}</p>
              </section>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.materialsCard}>
              <h2 className={styles.materialsHeading}>강의 자료</h2>

              {lecture.materials.length === 0 ? (
                <p className={styles.noMaterials}>등록된 자료가 없습니다.</p>
              ) : (
                <ul className={styles.materialsList}>
                  {lecture.materials.map((file) => (
                    <li key={file.fileId}>
                      <a className={styles.materialLink} href={file.url} target="_blank" rel="noreferrer">
                        <span>{file.displayName}</span>
                        <svg
                          className={styles.materialIcon}
                          viewBox="0 0 18 18"
                          fill="none"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path
                            d="M9 2v9m0 0l-3-3m3 3l3-3M3 15h12"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
