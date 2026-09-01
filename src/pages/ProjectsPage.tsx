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
        {/* 학기 탭은 데이터가 와야 그릴 수 있다. 자리를 안 잡으면 목록이 통째로 밀린다(실측 67px).
            실패했을 때는 잡지 않는다 — 오지 않을 탭 자리를 계속 비워 둘 이유가 없다. */}
        {isPending && <BlockSkeleton height="2.375rem" label="학기 필터 불러오는 중" />}

        {/* 한 페이지가 6장이라 스켈레톤도 6장. 높이는 실측(1440 폭에서 471px)에 맞춘다. */}
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
