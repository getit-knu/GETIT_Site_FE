import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PublicProject } from "../../types/project";

import { FestaProjectDetail } from "./FestaProjectDetail";

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

describe("FestaProjectDetail", () => {
  it("project가 없으면 아무것도 렌더링하지 않는다", () => {
    render(<FestaProjectDetail project={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("제목·팀·학기·설명·기술 스택과 두 링크를 보여준다", () => {
    const p = project();
    render(<FestaProjectDetail project={p} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: p.title })).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === "TEAM A · 2026 Fall")).toBeInTheDocument();
    expect(screen.getByText(p.description)).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "사이트 바로가기" })).toHaveAttribute("href", p.demoUrl);
    expect(screen.getByRole("link", { name: "코드 보기" })).toHaveAttribute("href", p.codeUrl);
  });

  it("링크가 비어 있거나 null이면 그 버튼을 숨긴다", () => {
    const empty = project({ demoUrl: "  ", codeUrl: null as unknown as string });
    render(<FestaProjectDetail project={empty} onClose={vi.fn()} />);

    expect(screen.queryByRole("link", { name: "사이트 바로가기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "코드 보기" })).not.toBeInTheDocument();
  });

  it("http(s)가 아닌 링크는 걸지 않는다", () => {
    render(
      <FestaProjectDetail
        project={project({ demoUrl: "ftp://polifit.example.com", codeUrl: "github.com/getit-knu/polifit" })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: "사이트 바로가기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "코드 보기" })).not.toBeInTheDocument();
  });

  it("닫히는 동안에도 마지막 프로젝트 내용을 그대로 보여준다", () => {
    const { rerender } = render(<FestaProjectDetail project={project()} onClose={vi.fn()} />);

    rerender(<FestaProjectDetail project={null} onClose={vi.fn()} />);

    // 퇴장 애니메이션이 끝나기 전이라 껍데기가 남아 있고, 그 안의 내용도 비지 않는다.
    expect(screen.getByText("폴리핏")).toBeInTheDocument();
    expect(screen.getByText("나에게 맞는 청년 정책을 골라 주는 서비스")).toBeInTheDocument();
  });

  it("닫기 버튼을 누르면 onClose가 불린다", () => {
    const onClose = vi.fn();
    render(<FestaProjectDetail project={project()} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
