import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getProjects } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import type { PublicProject } from "../../types/project";

import { FESTA_EVENT, pickLatestSemester } from "./festaConfig";
import { FestaProjectCard } from "./FestaProjectCard";
import { FestaProjectDetail } from "./FestaProjectDetail";
import styles from "./FestaShowcase.module.scss";

/** 한 학기 출전 팀은 많아야 열 팀 남짓 — 페이지를 넘기지 않고 한 번에 다 받는다. */
const FESTA_PAGE_SIZE = 20;

/**
 * 가장 최근 학기의 공개 프로젝트 전부. 학기 목록(`semesters`)은 어느 페이지를 불러도 같이
 * 오니, 먼저 한 건만 불러 학기를 고른 뒤 그 학기로 다시 부른다.
 *
 * **임시 방식이다.** 출전 팀은 어드민에서 고르게 바뀐다(BE 선행 이슈) — 그때 이 훅을 교체한다.
 */
const SEMESTER_PROBE = { size: 1 } as const;

function useFestaProjects() {
  const boardQuery = useQuery({
    queryKey: queryKeys.public.projects(SEMESTER_PROBE),
    queryFn: () => getProjects(SEMESTER_PROBE),
  });
  const semester = boardQuery.data ? pickLatestSemester(boardQuery.data.semesters) : null;
  const params = { semester: semester ?? undefined, size: FESTA_PAGE_SIZE };
  const listQuery = useQuery({
    queryKey: queryKeys.public.projects(params),
    queryFn: () => getProjects(params),
    enabled: semester !== null,
  });

  const noSemester = boardQuery.isSuccess && semester === null;
  return {
    projects: listQuery.data?.content ?? [],
    isPending: !noSemester && (boardQuery.isPending || listQuery.isPending),
    isError: boardQuery.isError || listQuery.isError,
  };
}

/**
 * 모의투자 FESTA 쇼케이스(#359). 행사 기간(`MOCK_INVESTMENT` 토글 on)에 `HomePage`가 기존 홈 대신
 * 그린다. 배경은 홈 히어로와 같은 블롭을 쓰고, 그 위에 출전 팀 카드를 앱스토어 목록처럼 깐다.
 */
export function FestaShowcase() {
  const { projects, isPending, isError } = useFestaProjects();
  const [selected, setSelected] = useState<PublicProject | null>(null);
  const semesterLabel = projects[0]?.semesterLabel;

  return (
    <section className={styles.showcase}>
      <div className={styles.blobBlue} aria-hidden="true" />
      <div className={styles.blobTeal} aria-hidden="true" />

      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.badge}>GET IT {semesterLabel ? `${semesterLabel} · ` : ""}프로젝트 쇼케이스</p>
          <h1 className={styles.title}>
            모의투자 <span className={styles.titleAccent}>FESTA</span>
          </h1>
          <p className={styles.date}>
            {FESTA_EVENT.dateLabel}
            {projects.length > 0 && ` · ${projects.length}팀 출전`}
          </p>
          <p className={styles.subtitle}>{FESTA_EVENT.subtitle}</p>
        </header>

        {isError ? (
          <p className={styles.status} role="alert">
            프로젝트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : isPending ? (
          <p className={styles.status} aria-live="polite">
            출전 프로젝트를 불러오는 중이에요…
          </p>
        ) : projects.length === 0 ? (
          <p className={styles.status}>출전 프로젝트를 준비하고 있어요.</p>
        ) : (
          <>
            <h2 className={styles.visuallyHidden}>출전 프로젝트</h2>
            <ul className={styles.grid}>
              {projects.map((project, index) => (
                <FestaProjectCard key={project.id} project={project} index={index} onSelect={setSelected} />
              ))}
            </ul>
          </>
        )}
      </div>

      <FestaProjectDetail project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
