import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PublicProject } from "../../types/project";
import { NO_PROJECT_DETAILS } from "../../mocks/projectDetails";

import { ProjectCard } from "./ProjectCard";

function project(over: Partial<PublicProject> = {}): PublicProject {
  return {
    id: 1,
    title: "AI 포트폴리오 추천 시스템",
    teamName: "Team Alpha",
    semester: "2025-FALL",
    semesterLabel: "2025 Fall",
    description: "투자 성향을 분석해 포트폴리오를 추천한다",
    techStacks: ["Python", "TensorFlow"],
    codeUrl: "https://github.com/getit-knu/ai-portfolio-recommender",
    demoUrl: "https://ai-portfolio-recommender.getit-knu.dev",
    thumbnailUrl: null,
    ...NO_PROJECT_DETAILS,
    galleryImageUrls: [],
    ...over,
  };
}

describe("ProjectCard", () => {
  it("프로젝트 정보를 렌더링한다", () => {
    const p = project();
    render(<ProjectCard project={p} />);

    expect(screen.getByRole("heading", { name: p.title })).toBeInTheDocument();
    expect(screen.getByText(p.description)).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === `${p.teamName} · ${p.semesterLabel}`),
    ).toBeInTheDocument();
    for (const tech of p.techStacks) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  });

  it("코드 · 데모 링크가 새 탭으로 열리도록 구성돼 있다", () => {
    const p = project();
    render(<ProjectCard project={p} />);

    const codeLink = screen.getByRole("link", { name: /코드/ });
    const demoLink = screen.getByRole("link", { name: /데모/ });

    expect(codeLink).toHaveAttribute("href", p.codeUrl);
    expect(codeLink).toHaveAttribute("target", "_blank");
    expect(demoLink).toHaveAttribute("href", p.demoUrl);
    expect(demoLink).toHaveAttribute("target", "_blank");
  });

  it("커버는 첫 스크린샷을 먼저 쓰고, 없으면 아이콘을 쓴다 (#382)", () => {
    const cover = (container: HTMLElement) =>
      (container.querySelector("[aria-hidden='true']") as HTMLElement).style.backgroundImage;

    const withShot = render(
      <ProjectCard
        project={project({ thumbnailUrl: "https://cdn/icon.png", galleryImageUrls: ["https://cdn/1.png"] })}
      />,
    );
    expect(cover(withShot.container)).toContain("https://cdn/1.png");
    withShot.unmount();

    const iconOnly = render(<ProjectCard project={project({ thumbnailUrl: "https://cdn/icon.png" })} />);
    expect(cover(iconOnly.container)).toContain("https://cdn/icon.png");
  });

  it("카드 설명은 마크다운 문법을 걷어낸 평문으로 보여준다 (#384)", () => {
    render(
      <ProjectCard project={project({ description: "## 소개\n\n**굵게** 쓴 설명 ![화면](https://cdn/1.png)" })} />,
    );

    expect(screen.getByText("소개 굵게 쓴 설명")).toBeInTheDocument();
  });
});
