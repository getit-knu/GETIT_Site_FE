import { useState } from "react";
import { useNavigate } from "react-router";

import { LectureFilterTabs } from "../../components/lecture/LectureFilterTabs";
import { ALL_LECTURES_FILTER, filterToParams } from "../../components/lecture/lectureFilters";
import { MemberLectureCard } from "../../components/lecture/MemberLectureCard";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { BlockSkeleton, CardGridSkeleton, EmptyState, ErrorState } from "../../components/ui/states/States";
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
        ) : tracksQuery.isPending ? (
          // 트랙 탭은 데이터가 와야 그릴 수 있다. 자리를 안 잡으면 아래 목록이 통째로 밀린다.
          // 높이는 같은 모양인 프로젝트 학기 탭 한 줄 실측값(35px). 여러 줄로 접히는 경우는
          // 트랙 개수가 곧 기다리는 데이터라 미리 알 수 없다 — `ProjectsPage` 주석 참고.
          <BlockSkeleton height="2.1875rem" label="트랙 필터 불러오는 중" />
        ) : (
          <LectureFilterTabs tracks={tracks} value={filter} onChange={handleFilterChange} />
        )}

        {lecturesQuery.isPending ? (
          /*
            격자가 데스크톱에서 4열이라 두 줄(8장)을 잡는다.

            **높이가 한 값으로 고정되지 않는 자리다.** `MemberLectureCard` 의 `.title` 은
            `ProjectCard`(#274)와 달리 줄 수가 묶여 있지 않아, 제목이 두 줄로 접히면 카드가
            24px(한 줄) 커진다. 열 폭에 따라 접히는 지점이 달라져 실측이 두 값으로 갈렸다 —
            1920·1440·1280·768 에서 318px, 1024·900·600 에서 294px.

            열이 4열인 데스크톱 폭에 맞춰 318px 을 쓴다. 실제 강의 제목은 목보다 길어서
            좁은 폭에서도 두 줄이 될 가능성이 높다. `.title` 에 line-clamp 를 걸어 #274 처럼
            높이를 묶으면 이 값이 정확해진다 — 디자인 결정이라 여기서 하지 않았다.
          */
          <CardGridSkeleton className={styles.grid} count={8} height="19.875rem" label="강의 목록 불러오는 중" />
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
