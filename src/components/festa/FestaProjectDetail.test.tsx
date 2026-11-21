import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PublicProject } from "../../types/project";
import { NO_PROJECT_DETAILS } from "../../mocks/projectDetails";

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
    ...NO_PROJECT_DETAILS,
    galleryImageUrls: [],
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

  it("스크린샷이 있으면 미리보기로 순서대로 보여주고, 없으면 그 칸을 숨긴다 (#382)", () => {
    const { rerender } = render(
      <FestaProjectDetail
        project={project({ galleryImageUrls: ["https://cdn/1.png", "https://cdn/2.png"] })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "미리보기" })).toBeInTheDocument();
    const shots = screen.getAllByRole("img", { name: /폴리핏 화면/ });
    expect(shots.map((img) => img.getAttribute("src"))).toEqual(["https://cdn/1.png", "https://cdn/2.png"]);
    expect(shots[0]).toHaveAttribute("loading", "lazy");

    rerender(<FestaProjectDetail project={project({ id: 2, galleryImageUrls: [] })} onClose={vi.fn()} />);
    expect(screen.queryByRole("heading", { name: "미리보기" })).not.toBeInTheDocument();
  });

  it("설명은 마크다운으로 보여주고 줄바꿈을 살린다. 외부 주소 이미지는 그리지 않는다 (#384)", () => {
    const description = "## 주요 기능\n\n첫 줄\n둘째 줄\n\n![추적](https://tracker.example.com/p.gif)";
    render(<FestaProjectDetail project={project({ description })} onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "주요 기능" })).toBeInTheDocument();
    expect(screen.getByText(/첫 줄/).querySelector("br")).not.toBeNull();
    expect(screen.queryByRole("img", { name: "추적" })).not.toBeInTheDocument();
  });

  it("진행 상태 배지와 http(s) 스토어 링크만 보여준다 (#389)", () => {
    render(
      <FestaProjectDetail
        project={project({
          progressStatus: "LIVE",
          progressStatusLabel: "서비스 중",
          playStoreUrl: "https://play.google.com/store/apps/details?id=a",
          appStoreUrl: "javascript:alert(1)",
        })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("서비스 중")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Google Play/ })).toHaveAttribute(
      "href",
      "https://play.google.com/store/apps/details?id=a",
    );
    expect(screen.queryByRole("link", { name: /App Store/ })).not.toBeInTheDocument();
  });
});
