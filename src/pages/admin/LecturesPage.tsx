import { LectureCard } from "../../components/lecture/LectureCard";
import { EmptyState, ErrorState } from "../../components/ui/states/States";
import { useDeleteLecture, useLectureBoard } from "../../hooks/lecture/useLectures";
import { useNumericParams } from "../../hooks/ui/useNumericParams";
import type { Lecture } from "../../types/lecture";

import styles from "./LecturesPage.module.scss";

const PARAM_KEYS = ["trackId", "subCategoryId"] as const;

/** 와이어프레임 p12. */
export default function LecturesPage() {
  const { values, setValues } = useNumericParams(PARAM_KEYS);
  const { trackId, subCategoryId } = values;

  const { data, isPending, isError, refetch } = useLectureBoard({ trackId, subCategoryId });
  const removeLecture = useDeleteLecture();

  function selectTrack(nextTrackId: number | undefined) {
    // 소분류는 트랙에 딸려 있다. 트랙을 바꾸면 남아 있던 소분류가 다른 트랙 것이 돼
    // 결과가 늘 비어 버린다. 함께 지운다.
    setValues({ trackId: nextTrackId, subCategoryId: undefined });
  }

  function handleDelete(lecture: Lecture) {
    // 되돌릴 수 없고 제출물·피드백이 딸려 있다. 무엇이 사라지는지 알려 준다.
    const message =
      lecture.submittedCount > 0
        ? `${lecture.title}을(를) 삭제할까요? 제출물 ${lecture.submittedCount}건도 함께 사라집니다.`
        : `${lecture.title}을(를) 삭제할까요?`;
    if (!window.confirm(message)) return;
    removeLecture.mutate(lecture.id);
  }

  // TODO: 강의 추가·수정 모달은 별도 이슈. 제출 현황·피드백 모달도 마찬가지다.
  const notImplemented = (name: string) => () => window.alert(`${name} 화면은 준비 중입니다.`);

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) return <ErrorState message="강의 목록을 불러오지 못했습니다." onRetry={() => void refetch()} />;

  const activeTrack = data.tracks.find((t) => t.id === trackId);
  // 창업 빌드업·세미나처럼 소분류가 비어 있는 트랙이 있다. 그때는 탭 줄을 그리지 않는다.
  const subCategories = activeTrack?.subCategories ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist" aria-label="트랙">
        <button
          type="button"
          role="tab"
          aria-selected={trackId === undefined}
          className={trackId === undefined ? styles.tabActive : styles.tab}
          onClick={() => selectTrack(undefined)}
        >
          전체
        </button>
        {data.tracks.map((track) => (
          <button
            key={track.id}
            type="button"
            role="tab"
            aria-selected={trackId === track.id}
            className={trackId === track.id ? styles.tabActive : styles.tab}
            onClick={() => selectTrack(track.id)}
          >
            {track.name}
          </button>
        ))}
      </div>

      {subCategories.length > 0 && (
        <div className={styles.subTabs} role="tablist" aria-label="소분류">
          <button
            type="button"
            role="tab"
            aria-selected={subCategoryId === undefined}
            className={subCategoryId === undefined ? styles.subTabActive : styles.subTab}
            onClick={() => setValues({ subCategoryId: undefined })}
          >
            전체
          </button>
          {subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              role="tab"
              aria-selected={subCategoryId === sub.id}
              className={subCategoryId === sub.id ? styles.subTabActive : styles.subTab}
              onClick={() => setValues({ subCategoryId: sub.id })}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {data.lectures.length === 0 ? (
        <EmptyState message={trackId ? "이 분류에 등록된 강의가 없습니다." : "등록된 강의가 없습니다."} />
      ) : (
        <div className={styles.grid}>
          {data.lectures.map((lecture) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              onFeedback={notImplemented("과제 피드백")}
              onSubmissions={notImplemented("제출 현황")}
              onEdit={notImplemented("강의 수정")}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
