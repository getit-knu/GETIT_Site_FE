import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getStaffs } from "../apis/public/publicApi";
import type { StaffDirectory } from "../types/site";

import LeadersPage from "./LeadersPage";

vi.mock("../apis/public/publicApi");

const DIRECTORY: StaffDirectory = {
  sections: [
    {
      section: "EXECUTIVE",
      sectionName: "임원진",
      staffs: [
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
          name: "이서준",
          staffRole: "부회장",
          department: "컴퓨터공학과 20",
          introduction: "",
          profileImageUrl: null,
          githubUrl: null,
          instagramUrl: null,
          order: 2,
        },
        {
          id: 3,
          name: "김운영",
          staffRole: "총무",
          department: "경영학과 22",
          introduction: "",
          profileImageUrl: null,
          githubUrl: null,
          instagramUrl: null,
          order: 3,
        },
      ],
    },
    {
      section: "SW",
      sectionName: "SW",
      staffs: [
        {
          id: 4,
          name: "이재민",
          staffRole: "SW 운영진",
          department: "컴퓨터공학과 21",
          introduction: "",
          profileImageUrl: null,
          githubUrl: null,
          instagramUrl: null,
          order: 1,
        },
      ],
    },
    {
      section: "STARTUP",
      sectionName: "창업",
      staffs: [
        {
          id: 5,
          name: "오지훈",
          staffRole: "창업 운영진",
          department: "경영학과 21",
          introduction: "",
          profileImageUrl: null,
          githubUrl: null,
          instagramUrl: null,
          order: 1,
        },
      ],
    },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <LeadersPage />
    </QueryClientProvider>,
  );
}

describe("LeadersPage", () => {
  it("헤더와 Leader 섹션(회장·부회장·총무)을 렌더링한다", async () => {
    vi.mocked(getStaffs).mockResolvedValue(DIRECTORY);
    renderPage();

    expect(screen.getByRole("heading", { name: "운영진 소개" })).toBeInTheDocument();
    expect(await screen.findByText("홍길동")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Leader" })).toBeInTheDocument();
    expect(screen.getByText("이서준")).toBeInTheDocument();
    expect(screen.getByText("김운영")).toBeInTheDocument();
  });

  it("Leader가 아닌 운영진은 SW·창업 구분 없이 하나의 Staff 섹션에 이름 가나다순으로 모아 보여준다", async () => {
    vi.mocked(getStaffs).mockResolvedValue(DIRECTORY);
    renderPage();

    expect(await screen.findByText("이재민")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Staff" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "SW 운영진" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "창업 운영진" })).not.toBeInTheDocument();
    // 팀 구분을 없앴으니 카드 안에도 "SW 운영진"·"창업 운영진" 역할 문구가 없어야 한다.
    expect(screen.queryByText("SW 운영진")).not.toBeInTheDocument();
    expect(screen.queryByText("창업 운영진")).not.toBeInTheDocument();

    const staffMembers = [...DIRECTORY.sections[1].staffs, ...DIRECTORY.sections[2].staffs];
    const names = staffMembers.map((staff) => staff.name).sort((a, b) => a.localeCompare(b, "ko"));
    const rendered = names.map((name) => screen.getByText(name));
    for (let i = 1; i < rendered.length; i++) {
      // 가나다순으로 배치됐다면 이전 이름이 DOM 상에서 다음 이름보다 앞에 있어야 한다.
      expect(rendered[i - 1].compareDocumentPosition(rendered[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});
