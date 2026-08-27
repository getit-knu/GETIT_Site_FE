import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/application/applicationsApi";
import type { Applicant, ApplicationDetail } from "../../types/application";

import { ApplicantsTab } from "./ApplicantsTab";

vi.mock("../../apis/application/applicationsApi");

function applicant(over: Partial<Applicant> = {}): Applicant {
  return {
    id: 42,
    applicantName: "김지원",
    college: "경영대학",
    major: "경영학과",
    grade: 2,
    totalScore: null,
    evaluated: false,
    status: "SUBMITTED",
    passed: null,
    submittedAt: "2026-09-08T12:03:44.000Z",
    ...over,
  };
}

/** 모달을 여는 경로만 확인한다. 상세 내용은 ApplicationDetailModal 테스트가 본다. */
function detail(): ApplicationDetail {
  return {
    id: 42,
    applicantName: "김지원",
    email: "kim@gmail.com",
    phoneNumber: "010-1234-5678",
    college: "경영대학",
    major: "경영학과",
    grade: 2,
    status: "SUBMITTED",
    submittedAt: "2026-09-08T12:03:44.000Z",
    answers: [],
    evaluation: { evaluated: false, totalScore: null, scores: [] },
    navigation: { current: 1, total: 1, prevId: null, nextId: null },
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
    vi.mocked(api.updateStatus).mockResolvedValue();
  });

  afterEach(() => {
    // 가짜 타이머가 남으면 뒤 테스트가 전부 멈춘다.
    vi.useRealTimers();
  });

  it("목록을 표로 그린다", async () => {
    renderPage();

    const table = await screen.findByRole("table", { name: "지원자 목록" });
    expect(within(table).getByText("김지원")).toBeInTheDocument();
    expect(within(table).getByText("경영대학 경영학과")).toBeInTheDocument();
  });

  it("평가 전 지원자는 점수 자리를 비운다", async () => {
    // 0 점으로 보이면 평가했는데 0 점을 준 것으로 읽힌다.
    renderPage();

    const table = await screen.findByRole("table");
    expect(within(table).getByText("—")).toBeInTheDocument();
    expect(within(table).queryByText("0")).not.toBeInTheDocument();
  });

  it("평가한 지원자는 총점을 보여준다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(
      page([applicant({ totalScore: 87, evaluated: true, status: "DOC_PASS", passed: true })]),
    );
    renderPage();

    expect(await screen.findByText("87")).toBeInTheDocument();
  });

  it("총점이 0 이면 0 을 그대로 보여준다", async () => {
    // null 과 0 을 같이 취급하면 안 된다.
    vi.mocked(api.getApplicants).mockResolvedValue(page([applicant({ totalScore: 0, evaluated: true })]));
    renderPage();

    const table = await screen.findByRole("table");
    expect(within(table).getByText("0")).toBeInTheDocument();
    expect(within(table).queryByText("—")).not.toBeInTheDocument();
  });

  it("상태 탭이 URL 과 조회 조건에 함께 반영된다", async () => {
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("tab", { name: "서류 합격" }));

    expect(router.state.location.search).toContain("status=DOC_PASS");
    expect(api.getApplicants).toHaveBeenLastCalledWith(expect.objectContaining({ status: "DOC_PASS" }));
  });

  it("평가 여부로 거른다", async () => {
    renderPage();
    await screen.findByRole("table");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "평가 여부" }), "todo");

    expect(api.getApplicants).toHaveBeenLastCalledWith(expect.objectContaining({ evaluated: false }));
  });

  it("평가 전체를 고르면 조건에서 뺀다", async () => {
    // false 와 '전체'를 같이 취급하면 미평가만 보이게 된다.
    renderPage();
    await screen.findByRole("table");

    const select = screen.getByRole("combobox", { name: "평가 여부" });
    await userEvent.selectOptions(select, "done");
    await userEvent.selectOptions(select, "all");

    expect(api.getApplicants).toHaveBeenLastCalledWith(expect.objectContaining({ evaluated: undefined }));
  });

  it("검색은 타이핑이 멈춘 뒤에 한 번만 조회한다", async () => {
    renderPage();
    await screen.findByRole("table");
    const before = vi.mocked(api.getApplicants).mock.calls.length;

    await userEvent.type(screen.getByRole("textbox", { name: "지원자 이름 검색" }), "김지원");

    // 글자마다 조회하면 여기서 이미 늘어나 있다.
    expect(vi.mocked(api.getApplicants).mock.calls.length).toBe(before);

    await waitFor(() =>
      expect(api.getApplicants).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: "김지원" })),
    );
    // 중간 글자로는 조회하지 않았다.
    expect(vi.mocked(api.getApplicants).mock.calls.length).toBe(before + 1);
  });

  it("합격 처리를 서버에 보낸다", async () => {
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "김지원 합격 처리" }));

    expect(api.updateStatus).toHaveBeenCalledWith(42, true);
  });

  it("불합격 처리를 서버에 보낸다", async () => {
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "김지원 불합격 처리" }));

    expect(api.updateStatus).toHaveBeenCalledWith(42, false);
  });

  it("이미 정해진 합·불을 눌린 상태로 표시한다", async () => {
    vi.mocked(api.getApplicants).mockResolvedValue(
      page([applicant({ evaluated: true, status: "DOC_PASS", passed: true, totalScore: 87 })]),
    );
    renderPage();

    expect(await screen.findByRole("button", { name: "김지원 합격 처리" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "김지원 불합격 처리" })).toHaveAttribute("aria-pressed", "false");
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

  it("평가 여부가 URL 에 남는다", async () => {
    // useState 로 들면 새로고침·링크 공유에서 조건이 사라진다.
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "평가 여부" }), "todo");

    expect(router.state.location.search).toContain("evaluated=todo");
  });

  it("URL 의 평가 여부를 읽어 조회에 쓴다", async () => {
    renderPage("/admin/applications?evaluated=done");

    await screen.findByRole("table");
    expect(api.getApplicants).toHaveBeenCalledWith(expect.objectContaining({ evaluated: true }));
  });

  it("검색어가 URL 에 남는다", async () => {
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.type(screen.getByRole("textbox", { name: "지원자 이름 검색" }), "김지원");

    await waitFor(() => expect(router.state.location.search).toContain("keyword=%EA%B9%80%EC%A7%80%EC%9B%90"));
  });

  it("URL 의 검색어를 입력칸에 채워 시작한다", async () => {
    renderPage("/admin/applications?keyword=김지원");

    expect(await screen.findByRole("textbox", { name: "지원자 이름 검색" })).toHaveValue("김지원");
    expect(api.getApplicants).toHaveBeenCalledWith(expect.objectContaining({ keyword: "김지원" }));
  });

  it("허용 목록에 없는 평가 여부는 조회 조건에 싣지 않는다", async () => {
    renderPage("/admin/applications?evaluated=DROP");

    await screen.findByRole("table");
    expect(api.getApplicants).toHaveBeenCalledWith(expect.objectContaining({ evaluated: undefined }));
  });

  it("조건을 바꾸면 첫 페이지로 돌아간다", async () => {
    const router = renderPage("/admin/applications?page=2");
    await screen.findByRole("table");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "평가 여부" }), "done");

    expect(router.state.location.search).not.toContain("page=");
  });

  it("기본값은 주소에 남기지 않는다", async () => {
    // 공유한 링크가 지저분해진다.
    const router = renderPage("/admin/applications?evaluated=done");
    await screen.findByRole("table");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "평가 여부" }), "all");

    expect(router.state.location.search).not.toContain("evaluated");
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
    vi.mocked(api.getApplicationDetail).mockResolvedValue(detail());
    const router = renderPage();

    await userEvent.click((await screen.findByText("김지원")).closest("tr")!);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(router.state.location.search).toContain("modal=application");
    expect(router.state.location.search).toContain("id=42");
  });

  it("합격·불합격 버튼을 눌러도 모달은 열리지 않는다", async () => {
    // 행 클릭과 셀 안 버튼 클릭이 서로 방해하면 안 된다.
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "김지원 합격 처리" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("상세 조회에 목록 필터를 그대로 넘긴다", async () => {
    // 순차 탐색이 목록과 같은 순서를 따라야 한다(명세서 7.5).
    vi.mocked(api.getApplicationDetail).mockResolvedValue(detail());
    renderPage("/admin/applications?status=DOC_PASS");

    await userEvent.click((await screen.findByText("김지원")).closest("tr")!);

    await waitFor(() => expect(api.getApplicationDetail).toHaveBeenCalled());
    expect(vi.mocked(api.getApplicationDetail).mock.lastCall?.[1]).toMatchObject({ status: "DOC_PASS" });
  });
});
