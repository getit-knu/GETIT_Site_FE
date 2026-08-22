import { Badge } from "../ui/Badge/Badge";
import { ProgressBar } from "../ui/ProgressBar/ProgressBar";
import type { Lecture } from "../../types/lecture";

import styles from "./LectureCard.module.scss";

interface LectureCardProps {
  lecture: Lecture;
  onSubmissions: (id: number) => void;
  onFeedback: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (lecture: Lecture) => void;
}

/**
 * 와이어프레임 p12. 어드민에서 유일하게 표가 아니라 카드로 그리는 목록이다.
 *
 * 강의마다 제출·피드백 진행도가 따라붙어 한 줄로 세우기 어렵다.
 */
export function LectureCard({ lecture, onSubmissions, onFeedback, onEdit, onDelete }: LectureCardProps) {
  const rate = lecture.totalCount === 0 ? 0 : (lecture.submittedCount / lecture.totalCount) * 100;

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <Badge variant="neutral">Week {lecture.week}</Badge>
        {/* 미공개는 부원에게 보이지 않는다. 운영진이 한눈에 알아야 한다. */}
        {!lecture.isPublished && <Badge variant="info">미공개</Badge>}
        <span className={styles.deadline}>마감 {lecture.deadline}</span>
      </header>

      <h3 className={styles.title}>{lecture.title}</h3>
      <p className={styles.description}>{lecture.description}</p>

      <div className={styles.progress}>
        <div className={styles.progressHead}>
          <span>
            제출 {lecture.submittedCount}/{lecture.totalCount}
          </span>
          <span>피드백 {lecture.feedbackDoneCount}</span>
        </div>
        <ProgressBar rate={rate} label={`${lecture.title} 제출률`} />
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => onFeedback(lecture.id)}>
          과제 피드백
        </button>
        <button type="button" onClick={() => onSubmissions(lecture.id)}>
          제출 현황
        </button>
        <button type="button" onClick={() => onEdit(lecture.id)}>
          수정
        </button>
        <button type="button" className={styles.danger} onClick={() => onDelete(lecture)}>
          삭제
        </button>
      </div>
    </article>
  );
}
