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
    }
  });

  it("Leader가 아닌 운영진은 SW·창업 구분 없이 하나의 Staff 섹션에 이름 가나다순으로 모아 보여준다", () => {
    render(<LeadersPage />);

    const staffMembers = staffsMock.getStaffsSnapshot().filter((staff) => staff.section !== "EXECUTIVE");
    expect(staffMembers.length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { name: "Staff" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "SW 운영진" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "창업 운영진" })).not.toBeInTheDocument();
    // 팀 구분을 없앴으니 카드 안에도 "SW 운영진"·"창업 운영진" 역할 문구가 없어야 한다.
    expect(screen.queryByText("SW 운영진")).not.toBeInTheDocument();
    expect(screen.queryByText("창업 운영진")).not.toBeInTheDocument();

    const names = staffMembers.map((staff) => staff.name).sort((a, b) => a.localeCompare(b, "ko"));
    const rendered = names.map((name) => screen.getByText(name));
    for (let i = 1; i < rendered.length; i++) {
      // 가나다순으로 배치됐다면 이전 이름이 DOM 상에서 다음 이름보다 앞에 있어야 한다.
      expect(rendered[i - 1].compareDocumentPosition(rendered[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
