import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PROJECTS } from "../../mocks/project/projects";

import { ProjectCard } from "./ProjectCard";

describe("ProjectCard", () => {
  const project = PROJECTS[0];

  it("프로젝트 정보를 렌더링한다", () => {
    render(<ProjectCard project={project} />);

    expect(screen.getByRole("heading", { name: project.title })).toBeInTheDocument();
    expect(screen.getByText(project.description)).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === `${project.team} · ${project.semester}`),
    ).toBeInTheDocument();
    for (const tech of project.techStack) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  });

  it("코드 · 데모 링크가 새 탭으로 열리도록 구성돼 있다", () => {
    render(<ProjectCard project={project} />);

    const codeLink = screen.getByRole("link", { name: /코드/ });
    const demoLink = screen.getByRole("link", { name: /데모/ });

    expect(codeLink).toHaveAttribute("href", project.codeUrl);
    expect(codeLink).toHaveAttribute("target", "_blank");
    expect(demoLink).toHaveAttribute("href", project.demoUrl);
    expect(demoLink).toHaveAttribute("target", "_blank");
  });
});
