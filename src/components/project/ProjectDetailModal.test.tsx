import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PublicProject } from "../../types/project";

import { ProjectDetailModal } from "./ProjectDetailModal";

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
    ...over,
  };
}

describe("ProjectDetailModal", () => {
  it("project가 없으면 아무것도 렌더링하지 않는다", () => {
    render(<ProjectDetailModal project={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("project가 있으면 상세 정보를 렌더링한다", () => {
    const p = project();
    render(<ProjectDetailModal project={p} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: p.title });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === `${p.teamName} · ${p.semesterLabel}`),
    ).toBeInTheDocument();
    expect(screen.getByText(p.description)).toBeInTheDocument();
    for (const tech of p.techStacks) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }

    const codeLink = screen.getByRole("link", { name: "코드 보기" });
    const demoLink = screen.getByRole("link", { name: "데모 보기" });
    expect(codeLink).toHaveAttribute("href", p.codeUrl);
    expect(demoLink).toHaveAttribute("href", p.demoUrl);
  });

  it("닫기 버튼을 누르면 onClose가 호출된다", () => {
    const handleClose = vi.fn();
    render(<ProjectDetailModal project={project()} onClose={handleClose} />);

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
