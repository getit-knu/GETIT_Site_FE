import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PublicProject } from "../../types/project";

import { FestaProjectCard } from "./FestaProjectCard";

function project(over: Partial<PublicProject> = {}): PublicProject {
  return {
    id: 1,
    title: "폴리핏",
    teamName: "TEAM A",
    semester: "2026-FALL",
    semesterLabel: "2026 Fall",
    description: "나에게 맞는 청년 정책을 골라 주는 서비스",
    techStacks: ["React", "Spring"],
    codeUrl: "https://github.com/getit-knu/polifit",
    demoUrl: "https://polifit.example.com",
    thumbnailUrl: null,
    ...over,
  };
}

describe("FestaProjectCard", () => {
  it("출전 번호·팀명·제목·소개·기술 스택을 보여준다", () => {
    render(
      <ul>
        <FestaProjectCard project={project()} index={1} onSelect={vi.fn()} />
      </ul>,
    );

    expect(screen.getByText("02 · TEAM A")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "폴리핏" })).toBeInTheDocument();
    expect(screen.getByText("나에게 맞는 청년 정책을 골라 주는 서비스")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Spring")).toBeInTheDocument();
  });

  it("자세히 보기를 누르면 그 프로젝트로 onSelect가 불린다", () => {
    const onSelect = vi.fn();
    const p = project();
    render(
      <ul>
        <FestaProjectCard project={p} index={0} onSelect={onSelect} />
      </ul>,
    );

    fireEvent.click(screen.getByRole("button", { name: "폴리핏 자세히 보기" }));

    expect(onSelect).toHaveBeenCalledWith(p);
  });

  it("썸네일이 없으면 제목 첫 글자를 아이콘으로 쓰고, 있으면 이미지로 채운다", () => {
    const { container, rerender } = render(
      <ul>
        <FestaProjectCard project={project()} index={0} onSelect={vi.fn()} />
      </ul>,
    );
    expect(container.querySelector("[aria-hidden='true']")).toHaveTextContent("폴");

    rerender(
      <ul>
        <FestaProjectCard
          project={project({ thumbnailUrl: "https://cdn.example.com/a.png" })}
          index={0}
          onSelect={vi.fn()}
        />
      </ul>,
    );
    const icon = container.querySelector<HTMLElement>("[aria-hidden='true']");
    expect(icon).toBeEmptyDOMElement();
    expect(icon?.style.backgroundImage).toContain("https://cdn.example.com/a.png");
  });

  it("설명·기술 스택이 비어 있으면 그 자리를 그리지 않는다", () => {
    render(
      <ul>
        <FestaProjectCard project={project({ description: "", techStacks: [] })} index={0} onSelect={vi.fn()} />
      </ul>,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
