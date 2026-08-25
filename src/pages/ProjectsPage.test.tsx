import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PROJECTS } from "../mocks/project/projects";

import ProjectsPage from "./ProjectsPage";

describe("ProjectsPage", () => {
  it("헤더와 전체 프로젝트를 렌더링한다", () => {
    render(<ProjectsPage />);

    expect(screen.getByRole("heading", { name: "프로젝트 쇼케이스" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(PROJECTS.length);
  });

  it("필터 탭을 선택하면 해당 기수 프로젝트만 보여준다", () => {
    render(<ProjectsPage />);

    fireEvent.click(screen.getByRole("button", { name: "2025 Fall" }));

    const fallProjects = PROJECTS.filter((project) => project.semester === "2025 Fall");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(fallProjects.length);
  });

  it("카드를 클릭하면 상세 모달이 열리고, 닫기를 누르면 닫힌다", () => {
    render(<ProjectsPage />);
    const project = PROJECTS[0];

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("heading", { name: project.title, level: 3 }));

    expect(screen.getByRole("dialog", { name: project.title })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
