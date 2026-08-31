import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PublicStaff } from "../../types/site";

import { StaffGroup } from "./StaffGroup";

const STAFFS: PublicStaff[] = [
  {
    id: 1,
    name: "홍길동",
    staffRole: "회장",
    department: "컴퓨터공학과 21",
    introduction: "",
    profileImageUrl: null,
    githubUrl: null,
    instagramUrl: null,
    order: 1,
  },
  {
    id: 2,
    name: "김운영",
    staffRole: "총무",
    department: "경영학과 22",
    introduction: "",
    profileImageUrl: null,
    githubUrl: null,
    instagramUrl: null,
    order: 2,
  },
];

describe("StaffGroup", () => {
  it("제목과 구성원 카드를 모두 렌더링한다", () => {
    render(<StaffGroup title="Leader" staffs={STAFFS} />);

    expect(screen.getByRole("heading", { name: "Leader" })).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("김운영")).toBeInTheDocument();
  });

  it("showRole을 지정하지 않으면 기본적으로 역할을 숨긴다(Staff 그룹 기본값)", () => {
    render(<StaffGroup title="Staff" staffs={STAFFS} />);

    expect(screen.queryByText("회장")).not.toBeInTheDocument();
    expect(screen.queryByText("총무")).not.toBeInTheDocument();
  });

  it("showRole이 true면 각 카드의 역할을 보여준다(Leader 그룹)", () => {
    render(<StaffGroup title="Leader" staffs={STAFFS} showRole />);

    expect(screen.getByText("회장")).toBeInTheDocument();
    expect(screen.getByText("총무")).toBeInTheDocument();
  });
});
