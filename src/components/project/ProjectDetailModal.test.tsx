import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PROJECTS } from "../../mocks/project/projects";

import { ProjectDetailModal } from "./ProjectDetailModal";

describe("ProjectDetailModal", () => {
  const project = PROJECTS[0];

  it("project가 없으면 아무것도 렌더링하지 않는다", () => {
    render(<ProjectDetailModal project={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("project가 있으면 상세 정보를 렌더링한다", () => {
    render(<ProjectDetailModal project={project} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: project.title });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === `${project.team} · ${project.semester}`),
    ).toBeInTheDocument();
    expect(screen.getByText(project.description)).toBeInTheDocument();
    for (const tech of project.techStack) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }

    const codeLink = screen.getByRole("link", { name: "코드 보기" });
    const demoLink = screen.getByRole("link", { name: "데모 보기" });
    expect(codeLink).toHaveAttribute("href", project.codeUrl);
    expect(demoLink).toHaveAttribute("href", project.demoUrl);
  });

  it("닫기 버튼을 누르면 onClose가 호출된다", () => {
    const handleClose = vi.fn();
    render(<ProjectDetailModal project={project} onClose={handleClose} />);

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
