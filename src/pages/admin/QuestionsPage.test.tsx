import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getQuestion, getQuestions, saveAnswer } from "../../apis/qna/questionsApi";
import type { Page, QuestionDetail, QuestionListItem } from "../../types/qna";

import QuestionsPage from "./QuestionsPage";

vi.mock("../../apis/qna/questionsApi");

function listItem(overrides: Partial<QuestionListItem> = {}): QuestionListItem {
  return {
    no: 1,
    id: 7001,
    authorName: "김부원",
    major: "경영학과",
    content: "강의 내용을 따라가기가 어렵습니다.",
    createdAt: "2026-01-01T07:04:22.000Z",
    status: "PENDING",
    statusLabel: "미답변",
    lectureTitle: null,
    ...overrides,
  };
}

function page(content: QuestionListItem[], overrides: Partial<Page<QuestionListItem>> = {}) {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    ...overrides,
  };
}

function detail(overrides: Partial<QuestionDetail> = {}): QuestionDetail {
  return {
    id: 7001,
    author: { id: 21, name: "김부원", college: "경영대학", major: "경영학과", role: "MEMBER" },
    createdAt: "2026-01-01T07:04:22.000Z",
    content: "강의 내용을 따라가기가 어렵습니다.",
    status: "PENDING",
    lecture: null,
    answer: null,
    ...overrides,
  };
}

function renderPage(initialEntry = "/admin/questions") {
  const router = createMemoryRouter([{ path: "/admin/questions", element: <QuestionsPage /> }], {
    initialEntries: [initialEntry],
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("QuestionsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getQuestions).mockResolvedValue(page([listItem()]));
  });

  it("불러오는 동안 표 자리를 잡아 둔다", () => {
    vi.mocked(getQuestions).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole("status", { name: "불러오는 중" })).toBeInTheDocument();
  });

  it("목록을 표로 그린다", async () => {
    renderPage();

    const table = await screen.findByRole("table", { name: "Q&A 목록" });
    expect(within(table).getByText("김부원")).toBeInTheDocument();
    expect(within(table).getByText("경영학과")).toBeInTheDocument();
  });

  it("상태 표기는 서버가 준 statusLabel 을 쓴다", async () => {
    // FE 에 매핑 테이블을 두지 않는다는 BE 규약(roleLabel 과 같은 이유).
    vi.mocked(getQuestions).mockResolvedValue(page([listItem({ status: "ANSWERED", statusLabel: "답변완료" })]));

    renderPage();

    expect(await screen.findByText("답변완료")).toBeInTheDocument();
  });

  it("결과가 없으면 빈 상태를 보여준다", async () => {
    vi.mocked(getQuestions).mockResolvedValue(page([]));

    renderPage();

    expect(await screen.findByText("등록된 질문이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("범위를 벗어난 페이지는 '질문이 없다'고 말하지 않는다", async () => {
    // 결과는 34건 있는데 99페이지를 보고 있는 상황(?page=99).
    // 이 페이지가 비었을 뿐이므로 등록된 질문이 없다고 알리면 잘못 읽힌다.
    vi.mocked(getQuestions).mockResolvedValue(
      page([], { page: 99, totalElements: 34, totalPages: 4, first: false, last: true }),
    );

    renderPage("/admin/questions?page=99");

    expect(await screen.findByText(/이 페이지에는 질문이 없습니다/)).toBeInTheDocument();
    expect(screen.queryByText("등록된 질문이 없습니다.")).not.toBeInTheDocument();
  });

  it("범위를 벗어났으면 첫 페이지로 돌아갈 방법을 준다", async () => {
    vi.mocked(getQuestions).mockResolvedValue(
      page([], { page: 99, totalElements: 34, totalPages: 4, first: false, last: true }),
    );
    const router = renderPage("/admin/questions?page=99");

    await userEvent.click(await screen.findByRole("button", { name: "첫 페이지로" }));

    expect(router.state.location.search).not.toContain("page=");
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(getQuestions).mockRejectedValue({ code: "UNKNOWN_ERROR", message: "실패" });

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("질문 목록을 불러오지 못했습니다.");
  });

  it("상태 탭을 고르면 URL 과 조회 조건이 함께 바뀐다", async () => {
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("tab", { name: "미답변" }));

    expect(router.state.location.search).toContain("status=PENDING");
    expect(vi.mocked(getQuestions)).toHaveBeenLastCalledWith(expect.objectContaining({ status: "PENDING" }));
  });

  it("필터를 바꾸면 첫 페이지로 돌아간다", async () => {
    // 3페이지에서 필터를 좁히면 있지도 않은 페이지를 요청하게 된다.
    const router = renderPage("/admin/questions?page=2");
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("tab", { name: "답변완료" }));

    expect(router.state.location.search).not.toContain("page=");
  });

  it("URL 의 page 를 그대로 조회에 쓴다", async () => {
    renderPage("/admin/questions?page=3");

    await screen.findByRole("table");
    expect(vi.mocked(getQuestions)).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
  });

  it("page 가 이상한 값이면 첫 페이지로 본다", async () => {
    // Number("0x10") 은 16 이다. 그대로 실리면 없는 페이지를 요청한다.
    renderPage("/admin/questions?page=0x10");

    await screen.findByRole("table");
    expect(vi.mocked(getQuestions)).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
  });

  it("답변 버튼을 누르면 모달이 URL 로 열린다", async () => {
    vi.mocked(getQuestion).mockResolvedValue(detail());
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("button", { name: /답변하기/ }));

    expect(router.state.location.search).toContain("modal=answer");
    expect(router.state.location.search).toContain("id=7001");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("URL 에 모달이 적혀 있으면 새로고침해도 열린 채로 시작한다", async () => {
    vi.mocked(getQuestion).mockResolvedValue(detail());

    renderPage("/admin/questions?modal=answer&id=7001");

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("상세를 불러오는 동안에는 답변 작성/수정을 단정하지 않는다", async () => {
    // 이미 답변한 질문을 열면 제목이 `답변 작성` → `답변 수정` 으로 바뀌어 깜빡인다.
    vi.mocked(getQuestion).mockReturnValue(new Promise(() => {}));

    renderPage("/admin/questions?modal=answer&id=7001");

    const heading = await screen.findByRole("heading", { name: "답변" });
    expect(heading).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "답변 작성" })).not.toBeInTheDocument();
  });

  it("이미 답변한 질문은 기존 답변을 채워 수정 모드로 연다", async () => {
    vi.mocked(getQuestion).mockResolvedValue(
      detail({
        status: "ANSWERED",
        answer: {
          id: 8001,
          adminId: 3,
          adminName: "김운영",
          content: "다음 차시부터 난이도를 조정하겠습니다.",
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: null,
        },
      }),
    );

    renderPage("/admin/questions?modal=answer&id=7001");

    expect(await screen.findByDisplayValue("다음 차시부터 난이도를 조정하겠습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "답변 수정 완료!" })).toBeInTheDocument();
  });

  it("답변을 저장하면 서버에 보내고 모달을 닫는다", async () => {
    vi.mocked(getQuestion).mockResolvedValue(detail());
    vi.mocked(saveAnswer).mockResolvedValue();

    renderPage("/admin/questions?modal=answer&id=7001");

    await userEvent.type(await screen.findByRole("textbox"), "확인했습니다.");
    await userEvent.click(screen.getByRole("button", { name: "답변 작성 완료!" }));

    expect(saveAnswer).toHaveBeenCalledWith(7001, "확인했습니다.", false);
  });

  it("빈 답변은 저장할 수 없다", async () => {
    vi.mocked(getQuestion).mockResolvedValue(detail());

    renderPage("/admin/questions?modal=answer&id=7001");

    expect(await screen.findByRole("button", { name: "답변 작성 완료!" })).toBeDisabled();
  });
});
