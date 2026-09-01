import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PublicStaff } from "../../types/site";

import { LeaderCard } from "./LeaderCard";

const STAFF: PublicStaff = {
  id: 1,
  name: "홍길동",
  staffRole: "회장",
  department: "컴퓨터공학과 21",
  introduction: "",
  profileImageUrl: null,
  githubUrl: null,
  instagramUrl: null,
  order: 1,
};

describe("LeaderCard", () => {
  it("이름 · 역할 · 학과를 렌더링한다", () => {
    render(<LeaderCard staff={STAFF} />);

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("회장")).toBeInTheDocument();
    expect(screen.getByText("컴퓨터공학과 21")).toBeInTheDocument();
  });

  it("showRole이 false면 역할을 숨긴다", () => {
    render(<LeaderCard staff={STAFF} showRole={false} />);

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.queryByText("회장")).not.toBeInTheDocument();
    expect(screen.getByText("컴퓨터공학과 21")).toBeInTheDocument();
  });

  it("SNS 링크가 없으면 아이콘도 안 보여준다", () => {
    render(<LeaderCard staff={STAFF} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("SNS 링크가 있으면 실제 계정으로 이동하는 아이콘을 보여준다", () => {
    render(
      <LeaderCard
        staff={{
          ...STAFF,
          githubUrl: "https://github.com/honggildong",
          instagramUrl: "https://instagram.com/honggildong",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "홍길동 GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/honggildong",
    );
    expect(screen.getByRole("link", { name: "홍길동 Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/honggildong",
    );
  });

  it("사진이 있으면 실제 이미지를 보여준다", () => {
    // alt=""(장식 이미지)라 role은 "img"가 아니라 "presentation"으로 잡힌다 — 태그로 직접 찾는다.
    const { container } = render(
      <LeaderCard staff={{ ...STAFF, profileImageUrl: "https://cdn.getit.com/staff/1.jpg" }} />,
    );

    expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn.getit.com/staff/1.jpg");
  });

  it("사진이 없으면 그라디언트 placeholder를 보여준다", () => {
    const { container } = render(<LeaderCard staff={STAFF} />);

    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("사진은 화면에 들어올 때까지 느긋하게(lazy) 불러온다", () => {
    const { container } = render(
      <LeaderCard staff={{ ...STAFF, profileImageUrl: "https://cdn.getit.com/staff/1.jpg" }} />,
    );

    expect(container.querySelector("img")).toHaveAttribute("loading", "lazy");
  });

  it("사진이 로드되기 전엔 스피너를 보여주다가, 로드되면 치운다", () => {
    const { container } = render(
      <LeaderCard staff={{ ...STAFF, profileImageUrl: "https://cdn.getit.com/staff/1.jpg" }} />,
    );

    expect(container.querySelector('[class*="spinner"]')).toBeInTheDocument();

    const img = container.querySelector("img");
    if (img === null) throw new Error("img not found");
    fireEvent.load(img);

    expect(container.querySelector('[class*="spinner"]')).not.toBeInTheDocument();
  });

  it("사진 로드에 실패하면(깨진 CDN 주소 등) 그라디언트로 되돌아간다", () => {
    const { container } = render(
      <LeaderCard staff={{ ...STAFF, profileImageUrl: "https://cdn.getit.com/broken.jpg" }} />,
    );

    const img = container.querySelector("img");
    if (img === null) throw new Error("img not found");
    fireEvent.error(img);

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector('[class*="spinner"]')).not.toBeInTheDocument();
  });

  it("소개글이 있으면 보여준다", () => {
    render(<LeaderCard staff={{ ...STAFF, introduction: "새로운 기술을 배우고 나누는 걸 좋아합니다." }} />);

    expect(screen.getByText("새로운 기술을 배우고 나누는 걸 좋아합니다.")).toBeInTheDocument();
  });

  it("소개글이 비어 있으면 아무것도 그리지 않는다", () => {
    const { container } = render(<LeaderCard staff={STAFF} />);

    // 역할 · 학과 문단만 있고 소개글 문단은 아예 없어야 한다.
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });
});
