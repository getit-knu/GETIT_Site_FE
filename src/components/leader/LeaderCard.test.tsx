import { render, screen } from "@testing-library/react";
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
});
