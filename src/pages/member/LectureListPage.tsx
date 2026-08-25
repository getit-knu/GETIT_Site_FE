import { useState } from "react";

import { LectureFilterTabs } from "../../components/lecture/LectureFilterTabs";
import { ALL_LECTURES_FILTER, filterLectures } from "../../components/lecture/lectureFilters";
import { MemberLectureCard } from "../../components/lecture/MemberLectureCard";
import { getMemberLecturesSnapshot } from "../../mocks/lecture/memberLectures";

import styles from "./LectureListPage.module.scss";

/** 강좌 목록. Figma 와이어프레임(`6:6147`) 기준. `/member` 진입점. */
export default function LectureListPage() {
  const [filter, setFilter] = useState(ALL_LECTURES_FILTER);
  // 렌더마다 새로 읽는다 — 모듈 최상단에서 한 번만 읽으면 캐싱되는 문제를 #104 리뷰에서 겪었다.
  const lectures = getMemberLecturesSnapshot();
  const filtered = filterLectures(lectures, filter);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>강좌 목록</h1>
          <p className={styles.subtitle}>수강 가능한 강의를 확인하고 학습을 시작하세요</p>
        </div>

        <LectureFilterTabs lectures={lectures} value={filter} onChange={setFilter} />

        <ul className={styles.grid}>
          {filtered.map((lecture) => (
            <li key={lecture.id}>
              <MemberLectureCard lecture={lecture} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
