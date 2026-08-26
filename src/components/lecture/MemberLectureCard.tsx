import type { MemberLecture } from "../../mocks/lecture/memberLectures";
import { TRACKS } from "../../mocks/lecture/lectures";
import { Card } from "../ui/Card/Card";

import styles from "./MemberLectureCard.module.scss";

function resolveTrackLabel(lecture: MemberLecture): string {
  const track = TRACKS.find((t) => t.id === lecture.trackId);
  if (!track) return "";
  if (lecture.subCategoryId === null) return track.name;
  return track.subCategories.find((sub) => sub.id === lecture.subCategoryId)?.name ?? track.name;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

interface MemberLectureCardProps {
  lecture: MemberLecture;
  onClick?: () => void;
}

/** 부원용 강좌 목록 카드. 어드민의 `LectureCard`(진행도·관리 액션 위주)와는 용도가 달라 이름을 구분했다. */
export function MemberLectureCard({ lecture, onClick }: MemberLectureCardProps) {
  return (
    <Card className={styles.card} onClick={onClick}>
      <div className={styles.thumbnail} aria-hidden="true">
        <div className={styles.thumbnailIcon}>
          <svg viewBox="0 0 24 24" fill="none" focusable="false">
            <path
              d="M8 6.82v10.36a1 1 0 0 0 1.5.87l9-5.18a1 1 0 0 0 0-1.74l-9-5.18A1 1 0 0 0 8 6.82Z"
              fill="currentColor"
            />
          </svg>
        </div>
        {lecture.completed && <span className={styles.completedBadge}>완료</span>}
        <span className={styles.weekBadge}>Week {lecture.week}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.trackBadge}>{resolveTrackLabel(lecture)}</span>
          <span className={styles.duration}>
            <svg className={styles.durationIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
              <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {formatDuration(lecture.durationMinutes)}
          </span>
        </div>
        <h3 className={styles.title}>{lecture.title}</h3>
        <p className={styles.deadline}>마감 {lecture.deadline}</p>
      </div>
    </Card>
  );
}
