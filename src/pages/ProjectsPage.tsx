import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getProjects } from "../apis/public/publicApi";
import { queryKeys } from "../apis/queryKeys";
import { ProjectCard } from "../components/project/ProjectCard";
import { ProjectDetailModal } from "../components/project/ProjectDetailModal";
import {
  ALL_PROJECTS_FILTER,
  ProjectFilterTabs,
  type ProjectFilterValue,
} from "../components/project/ProjectFilterTabs";
import { Pagination } from "../components/ui/Pagination/Pagination";
import { BlockSkeleton, CardGridSkeleton, EmptyState, ErrorState } from "../components/ui/states/States";
import { projectErrorMessage } from "../errors/project/errorMessages";
import type { PublicProject } from "../types/project";

import styles from "./ProjectsPage.module.scss";

/** 전체 프로젝트 목록(#219). `GET /api/public/projects`, Figma 와이어프레임(`4:2730`) 기준. */
export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectFilterValue>(ALL_PROJECTS_FILTER);
  const [page, setPage] = useState(0);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

  const semester = filter === ALL_PROJECTS_FILTER ? undefined : filter;
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.public.projects({ semester, page }),
    queryFn: () => getProjects({ semester, page }),
    placeholderData: (previous) => previous,
  });

  function handleFilterChange(next: ProjectFilterValue) {
    setFilter(next);
    // 필터를 바꾸면 결과 수가 달라진다. 이전 페이지에 머물면 없는 페이지를 요청하게 된다.
    setPage(0);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>프로젝트 쇼케이스</h1>
          <p className={styles.subtitle}>GET IT 부원들이 직접 만든 프로젝트들</p>
        </div>

        {data && <ProjectFilterTabs semesters={data.semesters} value={filter} onChange={handleFilterChange} />}
        {/*
          학기 탭은 데이터가 와야 그릴 수 있다. 자리를 안 잡으면 목록이 통째로 밀린다(실측 67px).
          높이는 탭 **한 줄** 실측값이다(35px = 2.1875rem, 1920~480 폭에서 동일).

          **탭이 여러 줄로 접히면 그만큼은 여전히 밀린다.** 줄 수는 학기 개수와 폭이 함께
          정하는데 그 개수가 곧 기다리는 중인 데이터라, 미리 알 방법이 없다(390px + 3개 =
          2줄). 한 줄은 하한이라 과하게 잡아 위로 튀는 일은 없다.

          실패했을 때는 잡지 않는다 — 오지 않을 탭 자리를 계속 비워 둘 이유가 없다.
        */}
        {isPending && <BlockSkeleton height="2.1875rem" label="학기 필터 불러오는 중" />}

        {/*
          한 페이지가 6장이라 스켈레톤도 6장.

          **높이 471px 은 폭과 무관하다** — 1920·1440·1280·1024·768·600·390 일곱 폭에서
          전부 같았다. `ProjectCard` 가 #274 에서 썸네일 12rem, 제목·메타 nowrap, 설명
          `height: 3rem` + line-clamp 2, 태그 1.75rem 으로 전부 고정됐기 때문이다.
          그 고정이 풀리면 이 값도 같이 틀어진다.
        */}
        {isPending && (
          <CardGridSkeleton className={styles.grid} count={6} height="29.5rem" label="프로젝트 불러오는 중" />
        )}
        {isError && <ErrorState message={projectErrorMessage(error)} onRetry={() => void refetch()} />}

        {data && data.content.length === 0 && <EmptyState message="등록된 프로젝트가 없습니다." />}

        {data && data.content.length > 0 && (
          <>
            <ul className={styles.grid}>
              {data.content.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} onClick={() => setSelectedProject(project)} />
                </li>
              ))}
            </ul>

            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
