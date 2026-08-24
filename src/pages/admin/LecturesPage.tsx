import { useEffect } from "react";

import { FeedbackModal } from "../../components/lecture/FeedbackModal";
import { LectureCard } from "../../components/lecture/LectureCard";
import { LectureFormModal } from "../../components/lecture/LectureFormModal";
import { Button } from "../../components/ui/Button/Button";
import { EmptyState, ErrorState } from "../../components/ui/states/States";
import { lectureErrorMessage } from "../../errors/lecture/errorMessages";
import { useDeleteLecture, useLectureBoard } from "../../hooks/lecture/useLectures";
import { useModalParams } from "../../hooks/ui/useModalParams";
import { useNumericParams } from "../../hooks/ui/useNumericParams";
import type { Lecture } from "../../types/lecture";

import styles from "./LecturesPage.module.scss";

const PARAM_KEYS = ["trackId", "subCategoryId"] as const;

/** 와이어프레임 p12. */
export default function LecturesPage() {
  const { values, setValues } = useNumericParams(PARAM_KEYS);
  const { trackId } = values;

  // 소분류는 트랙에 딸려 있다. 트랙 없이 소분류만 있는 주소(`?subCategoryId=2`)는
  // 조회에 실려도 화면에 탭이 없어 사용자가 걸린 필터를 보거나 풀 수 없다.
  const subCategoryId = trackId === undefined ? undefined : values.subCategoryId;

  const { data, isPending, isError, error, refetch } = useLectureBoard({ trackId, subCategoryId });
  const removeLecture = useDeleteLecture();
  const { modal, id: modalId, openModal, closeModal } = useModalParams();

  // 응답에 실린 트랙 목록으로만 필터가 유효한지 알 수 있다. 조회한 뒤에 걸러낸다.
  // `?trackId=999` 처럼 없는 값이 남아 있으면 어떤 탭도 선택되지 않은 채
  // 결과만 비어 사용자가 이유를 알 수 없다.
  const tracks = data?.tracks;
  useEffect(() => {
    if (!tracks) return;

    const track = tracks.find((t) => t.id === trackId);
    const trackUnknown = trackId !== undefined && track === undefined;
    const subUnknown =
      values.subCategoryId !== undefined && !track?.subCategories.some((sub) => sub.id === values.subCategoryId);

    if (trackUnknown || subUnknown) {
      setValues({
        trackId: trackUnknown ? undefined : trackId,
        subCategoryId: undefined,
      });
    }
  }, [tracks, trackId, values.subCategoryId, setValues]);

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

  /*
    강의 카드의 '과제 피드백' 은 제출물 하나를 지목할 수 없다 — 8.7 은 submissionId 를
    받는데 카드가 아는 것은 강의뿐이다. 실제 진입점은 제출 현황 표의 행이고,
    그 표는 같은 이슈의 다른 PR 에 있다. 두 PR 이 모두 머지된 뒤 행에 버튼을 붙인다.
    지금은 주소(`?modal=feedback&id={submissionId}`)로 열린다.

    제출 현황 모달은 아직 별도 PR 이라 여기서는 준비 중으로 둔다.
  */
  const notImplemented = (name: string) => () => window.alert(`${name} 화면은 준비 중입니다.`);

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  // 문구는 BE ErrorCode 에서 가져온다. FE 가 코드를 새로 짓지 않는다.
  if (isError) return <ErrorState message={lectureErrorMessage(error)} onRetry={() => void refetch()} />;

  const activeTrack = data.tracks.find((t) => t.id === trackId);
  // 창업 빌드업·세미나처럼 소분류가 비어 있는 트랙이 있다. 그때는 탭 줄을 그리지 않는다.
  const subCategories = activeTrack?.subCategories ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button onClick={() => openModal("lecture")}>+ 강의 추가</Button>
      </div>

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
              onEdit={(id) => openModal("lecture", id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal === "lecture" && (
        <LectureFormModal
          // id 가 없으면 추가 모드다. 추가와 수정이 같은 폼을 쓴다.
          lectureId={modalId}
          tracks={data.tracks}
          onClose={closeModal}
        />
      )}

      {modal === "feedback" && modalId !== null && (
        <FeedbackModal submissionId={modalId} onNavigate={(id) => openModal("feedback", id)} onClose={closeModal} />
      )}
    </div>
  );
}
