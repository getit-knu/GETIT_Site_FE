import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import * as staffsMock from "../mocks/site/staffs";

import LeadersPage from "./LeadersPage";

describe("LeadersPage", () => {
  it("헤더와 Leader 섹션(회장·부회장·총무)을 렌더링한다", () => {
    render(<LeadersPage />);

    const leaders = staffsMock.getStaffsSnapshot().filter((staff) => staff.section === "EXECUTIVE");

    expect(screen.getByRole("heading", { name: "운영진 소개" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Leader" })).toBeInTheDocument();
    for (const leader of leaders) {
      expect(screen.getByText(leader.name)).toBeInTheDocument();
      expect(screen.getByText(leader.staffRole)).toBeInTheDocument();
    }
  });

  it("스냅샷을 모듈 로드 시 한 번만 캐싱하지 않고 렌더마다 새로 읽는다", () => {
    // 캐싱해 두면 어드민에서 운영진을 수정해도 새로고침 전까지 반영되지 않는다(리뷰 지적 사항).
    const spy = vi.spyOn(staffsMock, "getStaffsSnapshot");
    const callsBefore = spy.mock.calls.length;

    const { unmount } = render(<LeadersPage />);
    unmount();
    render(<LeadersPage />);

    expect(spy.mock.calls.length - callsBefore).toBeGreaterThanOrEqual(2);
    spy.mockRestore();
  });
});
