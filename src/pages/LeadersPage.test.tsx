import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getStaffsSnapshot } from "../mocks/site/staffs";

import LeadersPage from "./LeadersPage";

describe("LeadersPage", () => {
  it("헤더와 Leader 섹션(회장·부회장·총무)을 렌더링한다", () => {
    render(<LeadersPage />);

    const leaders = getStaffsSnapshot().filter((staff) => staff.section === "EXECUTIVE");

    expect(screen.getByRole("heading", { name: "운영진 소개" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Leader" })).toBeInTheDocument();
    for (const leader of leaders) {
      expect(screen.getByText(leader.name)).toBeInTheDocument();
      expect(screen.getByText(leader.staffRole)).toBeInTheDocument();
    }
  });
});
