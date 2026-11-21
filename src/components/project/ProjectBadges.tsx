import { isLinkableUrl } from "../../libs/linkableUrl";
import type { ProjectDetailFields } from "../../types/project";
import { Badge } from "../ui/Badge/Badge";

import { PROGRESS_OPTIONS } from "./projectDetailsDraft";

type Project = Pick<ProjectDetailFields, "progressStatus" | "progressStatusLabel" | "playStoreUrl" | "appStoreUrl">;

/** 진행 상태 배지(#389). 정하지 않았으면 그리지 않는다. 서비스 중만 강조색이다. */
export function ProjectStatusBadge({ project }: { project: Project }) {
  if (project.progressStatus === null) return null;
  const label =
    project.progressStatusLabel ?? PROGRESS_OPTIONS.find((option) => option.value === project.progressStatus)?.label;
  return <Badge variant={project.progressStatus === "LIVE" ? "accent" : "neutral"}>{label}</Badge>;
}

/**
 * Google Play·App Store 링크(#389). 호출부의 줄(flex) 안에 그대로 끼워 넣도록 조각으로 돌려준다.
 * http(s)가 아닌 주소는 걸지 않는다.
 */
export function ProjectStoreLinks({ project, className }: { project: Project; className: string }) {
  const links = [
    { label: "Google Play", url: project.playStoreUrl },
    { label: "App Store", url: project.appStoreUrl },
  ].filter((link): link is { label: string; url: string } => isLinkableUrl(link.url));

  return (
    <>
      {links.map((link) => (
        <a key={link.label} className={className} href={link.url} target="_blank" rel="noreferrer">
          {link.label} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </>
  );
}
