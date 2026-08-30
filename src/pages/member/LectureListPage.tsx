import { useState } from "react";
import { useNavigate } from "react-router";

import { LectureFilterTabs } from "../../components/lecture/LectureFilterTabs";
import { ALL_LECTURES_FILTER, filterToParams } from "../../components/lecture/lectureFilters";
import { MemberLectureCard } from "../../components/lecture/MemberLectureCard";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { EmptyState, ErrorState } from "../../components/ui/states/States";
import { lectureErrorMessage } from "../../errors/lecture/errorMessages";
import { useMemberLectures, useMemberTracks } from "../../hooks/lecture/useMemberLectures";

import styles from "./LectureListPage.module.scss";

/** 강좌 목록. Figma 와이어프레임(`6:6147`) 기준. `/member` 진입점. */
export default function LectureListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(ALL_LECTURES_FILTER);
  const [page, setPage] = useState(0);

  const tracksQuery = useMemberTracks();
  const tracks = tracksQuery.data ?? [];
  const lecturesQuery = useMemberLectures({ ...filterToParams(filter, tracks), page });

  function handleFilterChange(next: string) {
    setFilter(next);
    setPage(0);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>강좌 목록</h1>
          <p className={styles.subtitle}>수강 가능한 강의를 확인하고 학습을 시작하세요</p>
        </div>

        {tracksQuery.isError ? (
          <ErrorState message={lectureErrorMessage(tracksQuery.error)} onRetry={() => void tracksQuery.refetch()} />
        ) : (
          !tracksQuery.isPending && <LectureFilterTabs tracks={tracks} value={filter} onChange={handleFilterChange} />
        )}

        {lecturesQuery.isPending ? (
          <p className={styles.loading}>불러오는 중…</p>
        ) : lecturesQuery.isError ? (
          <ErrorState message={lectureErrorMessage(lecturesQuery.error)} onRetry={() => void lecturesQuery.refetch()} />
        ) : lecturesQuery.data.content.length === 0 ? (
          <EmptyState message="등록된 강의가 없습니다." />
        ) : (
          <>
            <ul className={styles.grid}>
              {lecturesQuery.data.content.map((lecture) => (
                <li key={lecture.id}>
                  <MemberLectureCard lecture={lecture} onClick={() => navigate(`/member/lectures/${lecture.id}`)} />
                </li>
              ))}
            </ul>
            <Pagination page={page} totalPages={lecturesQuery.data.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
