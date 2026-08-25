import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Staff } from "../../types/site";

import { StaffGroup } from "./StaffGroup";

const STAFFS: Staff[] = [
  {
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
  },
  {
    id: 2,
    userId: null,
    name: "김운영",
    staffRole: "총무",
    section: "EXECUTIVE",
    department: "경영학과 22",
    introduction: "",
    profileImageUrl: null,
    order: 2,
    generationNo: 9,
  },
];

describe("StaffGroup", () => {
  it("제목과 구성원 카드를 모두 렌더링한다", () => {
    render(<StaffGroup title="Leader" staffs={STAFFS} />);

    expect(screen.getByRole("heading", { name: "Leader" })).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("김운영")).toBeInTheDocument();
  });
});
