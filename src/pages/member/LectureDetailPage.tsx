import { Link, useParams } from "react-router";

import { AssignmentSection, MaterialLink } from "../../components/lecture/AssignmentSection";
import { QnaSection } from "../../components/lecture/QnaSection";
import { ErrorState } from "../../components/ui/states/States";
import { lectureErrorMessage } from "../../errors/lecture/errorMessages";
import { useMemberLectureDetail } from "../../hooks/lecture/useMemberLectures";
import { formatDateTime } from "../../libs/formatDate";
import type { MemberLectureDetail } from "../../types/lecture";

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
    <Link viewTransition to="/member" className={styles.backLink}>
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

/** 강의 시청. Figma 와이어프레임(`6:6528`) 기준. */
export default function LectureDetailPage() {
  const { id } = useParams();
  const { data: lecture, isPending, isError, error, refetch } = useMemberLectureDetail(Number(id));

  if (isPending) return <p className={styles.notFound}>불러오는 중…</p>;
  if (isError) return <ErrorState message={lectureErrorMessage(error)} onRetry={() => void refetch()} />;

  return <LectureDetailView lecture={lecture} />;
}

function LectureDetailView({ lecture }: { lecture: MemberLectureDetail }) {
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
                  <p className={styles.instructorName}>{lecture.author.name}</p>
                  <p className={styles.postedDate}>{formatDateTime(lecture.publishedAt)}</p>
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
                    <MaterialLink key={file.fileId} lectureId={lecture.id} material={file} />
                  ))}
                </ul>
              )}
            </div>

            <AssignmentSection
              lectureId={lecture.id}
              assignment={lecture.assignment}
              mySubmission={lecture.mySubmission}
            />

            <QnaSection lectureId={lecture.id} />
          </aside>
        </div>
      </div>
    </div>
  );
}
