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
});
