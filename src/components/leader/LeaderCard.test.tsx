import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Staff } from "../../types/site";

import { LeaderCard } from "./LeaderCard";

const STAFF: Staff = {
  id: 1,
  userId: null,
  name: "홍길동",
  staffRole: "회장",
  section: "EXECUTIVE",
  department: "컴퓨터공학과 21",
  introduction: "",
  profileImageUrl: null,
  order: 1,
  generationNo: 9,
};

describe("LeaderCard", () => {
  it("이름 · 역할 · 학과를 렌더링한다", () => {
    render(<LeaderCard staff={STAFF} />);

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("회장")).toBeInTheDocument();
    expect(screen.getByText("컴퓨터공학과 21")).toBeInTheDocument();
  });
});
