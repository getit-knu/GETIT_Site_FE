import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/application/applicationsApi";
import * as publicApi from "../../apis/public/publicApi";
import type { Applicant, ApplicationDetail } from "../../types/application";

import { ApplicantsTab } from "./ApplicantsTab";

vi.mock("../../apis/application/applicationsApi");
vi.mock("../../apis/public/publicApi");

function applicant(over: Partial<Applicant> = {}): Applicant {
  return {
    id: 42,
    name: "김지원",
    studentNumber: "202012345",
    college: "경영대학",
    grade: 2,
    status: "SUBMITTED",
    submittedAt: "2026-09-08T12:03:44.000Z",
    ...over,
  };
}

/** 모달을 여는 경로만 확인한다. 상세 내용은 ApplicationDetailModal 테스트가 본다. */
function detail(over: Partial<ApplicationDetail> = {}): ApplicationDetail {
  return {
    id: 42,
    status: "SUBMITTED",
    basicInfo: {
      name: "김지원",
      email: "kim@gmail.com",
      phoneNumber: "010-1234-5678",
      collegeId: 1,
      majorId: 1,
      grade: 2,
      studentNumber: "202012345",
    },
    answers: [],
    submittedAt: "2026-09-08T12:03:44.000Z",
    ...over,
  };
}

function page(content: Applicant[], over = {}) {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    ...over,
  };
}

function renderPage(entry = "/admin/applications") {
  const router = createMemoryRouter([{ path: "/admin/applications", element: <ApplicantsTab /> }], {
    initialEntries: [entry],
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("ApplicantsTab", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getApplicants).mockResolvedValue(page([applicant()]));
    vi.mocked(api.decideApplication).mockResolvedValue({ applicationId: 42, status: "DOC_PASS" });
    vi.mocked(api.decideApplicationsBulk).mockResolvedValue({ updatedCount: 0, status: "DOC_PASS" });
    // 행을 눌러 모달을 여는 테스트에서만 필요하지만, 매번 새로 정의하지 않게 기본값을 깔아 둔다.
    vi.mocked(api.getApplicationDetail).mockResolvedValue(detail());
    vi.mocked(api.getAdjacentApplicants).mockResolvedValue({ previousId: null, nextId: null });
    vi.mocked(api.getEvaluationSummary).mockResolvedValue({
      applicationId: 42,
      criteria: [],
      totalScore: null,
      evaluatorCount: 0,
      myTotalScore: null,
    });
    vi.mocked(publicApi.getColleges).mockResolvedValue([]);
    vi.mocked(publicApi.getMajors).mockResolvedValue([]);
  });

  it("목록을 표로 그린다", async () => {
    renderPage();

    const table = await screen.findByRole("table", { name: "지원자 목록" });
    expect(within(table).getByText("김지원")).toBeInTheDocument();
    expect(within(table).getByText("202012345")).toBeInTheDocument();
    expect(within(table).getByText("경영대학")).toBeInTheDocument();
  });

  it("학번·소속이 없으면 대시로 보여준다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(page([applicant({ studentNumber: null, college: null })]));
    renderPage();

    const table = await screen.findByRole("table");
    expect(within(table).getAllByText("—")).toHaveLength(2);
  });

  it("상태 탭이 URL 과 조회 조건에 함께 반영된다", async () => {
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("tab", { name: "서류 합격" }));

    expect(router.state.location.search).toContain("status=DOC_PASS");
    expect(api.getApplicants).toHaveBeenLastCalledWith(expect.objectContaining({ status: "DOC_PASS" }));
  });

  it("제출 상태는 서류 합·불 버튼을, 서류 합격 상태는 최종 합·불 버튼을 보여준다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(page([applicant({ status: "DOC_PASS" })]));
    renderPage();

    expect(await screen.findByRole("button", { name: "김지원 최종 합격 처리" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "김지원 최종 불합격 처리" })).toBeInTheDocument();
  });

  it("이미 결정이 끝난 상태(서류 불합격)는 버튼 대신 대시를 보여준다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(page([applicant({ status: "DOC_FAIL" })]));
    renderPage();

    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: /처리/ })).not.toBeInTheDocument();
  });

  it("합격 처리를 서버에 보낸다", async () => {
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "김지원 서류 합격 처리" }));

    expect(api.decideApplication).toHaveBeenCalledWith(42, true);
  });

  it("불합격 처리를 서버에 보낸다", async () => {
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "김지원 서류 불합격 처리" }));

    expect(api.decideApplication).toHaveBeenCalledWith(42, false);
  });

  it("합격·불합격 버튼을 눌러도 모달은 열리지 않는다", async () => {
    // 행 클릭과 셀 안 버튼 클릭이 서로 방해하면 안 된다.
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "김지원 서류 합격 처리" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("체크박스로 여러 명을 선택하면 일괄 처리 버튼이 나온다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(
      page([applicant({ id: 1, name: "A" }), applicant({ id: 2, name: "B" })]),
    );
    // 일괄 처리는 상태 필터를 하나로 좁혔을 때만 켠다.
    renderPage("/admin/applications?status=SUBMITTED");
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("checkbox", { name: "A 선택" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "B 선택" }));

    expect(screen.getByText("2명 선택됨")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "일괄 서류 합격" }));

    expect(api.decideApplicationsBulk).toHaveBeenCalledWith({ applicationIds: [1, 2], status: "DOC_PASS" });
  });

  it("상태 필터가 '전체'거나 '서류 불합격'이면 일괄 처리 버튼을 보여주지 않는다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(page([applicant({ status: "DOC_FAIL" })]));
    renderPage("/admin/applications?status=DOC_FAIL");
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("checkbox", { name: "김지원 선택" }));

    expect(screen.queryByText(/선택됨/)).not.toBeInTheDocument();
  });

  it("전체 선택 체크박스로 이 페이지 전부를 고른다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(
      page([applicant({ id: 1, name: "A" }), applicant({ id: 2, name: "B" })]),
    );
    renderPage("/admin/applications?status=SUBMITTED");
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("checkbox", { name: "이 페이지 전체 선택" }));

    expect(screen.getByText("2명 선택됨")).toBeInTheDocument();
  });

  it("엑셀 다운로드가 실패하면 이유를 보여준다", async () => {
    vi.mocked(api.exportApplicants).mockRejectedValue({ code: "FORBIDDEN", message: "권한이 없습니다." });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "엑셀 다운로드" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다.");
  });

  it("범위를 벗어난 페이지는 '지원자가 없다'고 말하지 않는다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(
      page([], { page: 99, totalElements: 31, totalPages: 4, first: false, last: true }),
    );

    renderPage("/admin/applications?page=99");

    expect(await screen.findByText(/이 페이지에는 지원자가 없습니다/)).toBeInTheDocument();
    expect(screen.queryByText("접수된 지원서가 없습니다.")).not.toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getApplicants).mockRejectedValue({ code: "UNKNOWN_ERROR", message: "실패" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("지원자 목록을 불러오지 못했습니다.");
  });

  it("오류 문구를 BE 코드에서 가져온다", async () => {
    vi.mocked(api.getApplicants).mockRejectedValue({ code: "FORBIDDEN", message: "서버 원문" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("지원서를 볼 권한이 없습니다.");
  });

  it("다운로드 실패는 목록 조회와 다른 문구를 쓴다", async () => {
    vi.mocked(api.exportApplicants).mockRejectedValue({ code: "SOMETHING_NEW", message: "?" });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "엑셀 다운로드" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("엑셀 다운로드에 실패했습니다.");
  });

  it("행을 누르면 상세 모달이 열리고 주소에 남는다", async () => {
    // 열고 닫는 경로가 끊겨도 모달 자체 테스트로는 알 수 없다.
    const router = renderPage();

    await userEvent.click((await screen.findByText("김지원")).closest("tr")!);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(router.state.location.search).toContain("modal=application");
    expect(router.state.location.search).toContain("id=42");
  });

  it("순차 탐색에 목록 필터를 그대로 넘긴다", async () => {
    // 순차 탐색이 목록과 같은 순서를 따라야 한다(명세서 7.5).
    vi.mocked(api.getApplicants).mockResolvedValue(page([applicant({ status: "DOC_PASS" })]));
    renderPage("/admin/applications?status=DOC_PASS");

    await userEvent.click((await screen.findByText("김지원")).closest("tr")!);

    await screen.findByRole("dialog");
    expect(api.getAdjacentApplicants).toHaveBeenCalledWith(42, { status: "DOC_PASS" });
  });
});
