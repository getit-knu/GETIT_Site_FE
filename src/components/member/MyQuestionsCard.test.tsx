import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyQuestions } from "../../apis/qna/myQuestionsApi";
import type { MyQuestion } from "../../types/lecture";

import { MyQuestionsCard } from "./MyQuestionsCard";

vi.mock("../../apis/qna/myQuestionsApi");

function question(over: Partial<MyQuestion> & { id: number }): MyQuestion {
  return {
    lectureId: 7,
    lectureTitle: "3주차 · 재무제표 읽기",
    authorName: "김부원",
    content: "감가상각비는 왜 비용인가요?",
    createdAt: "2026-09-01T10:00:00+09:00",
    status: "PENDING",
    answers: [],
    ...over,
  };
}

function page(content: MyQuestion[]) {
  return { content, page: 0, size: 5, totalElements: content.length, totalPages: 1, first: true, last: true };
}

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/member/dashboard", element: <MyQuestionsCard /> },
      { path: "/member/lectures/:id", element: <p>강의 상세</p> },
    ],
    { initialEntries: ["/member/dashboard"] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("MyQuestionsCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("질문과 어느 강의의 것인지를 함께 보여준다", async () => {
    // 강의를 가로지르는 목록이라, 강의 이름이 없으면 무엇에 대한 질문인지 알 수 없다.
    vi.mocked(getMyQuestions).mockResolvedValue(page([question({ id: 1 })]));
    renderCard();

    expect(await screen.findByText("감가상각비는 왜 비용인가요?")).toBeInTheDocument();
    expect(screen.getByText("3주차 · 재무제표 읽기")).toBeInTheDocument();
  });

  it("답변이 달린 질문과 아직 안 달린 질문을 구분한다", async () => {
    vi.mocked(getMyQuestions).mockResolvedValue(
      page([question({ id: 1 }), question({ id: 2, content: "두 번째", status: "ANSWERED" })]),
    );
    renderCard();

    expect(await screen.findByText("답변 대기")).toBeInTheDocument();
    expect(screen.getByText("답변 완료")).toBeInTheDocument();
  });

  it("답변 여부는 서버가 준 상태로 정한다", async () => {
    /*
      답변 배열이 비어 있어도 서버가 ANSWERED 라면 답변 완료다 — 화면이 따로 세면
      서버와 판정이 갈린다.
    */
    vi.mocked(getMyQuestions).mockResolvedValue(page([question({ id: 1, status: "ANSWERED", answers: [] })]));
    renderCard();

    expect(await screen.findByText("답변 완료")).toBeInTheDocument();
    expect(screen.queryByText("답변 대기")).not.toBeInTheDocument();
  });

  it("누르면 그 질문이 달린 강의로 간다", async () => {
    vi.mocked(getMyQuestions).mockResolvedValue(page([question({ id: 1, lectureId: 42 })]));
    renderCard();

    expect(await screen.findByRole("link")).toHaveAttribute("href", "/member/lectures/42");
  });

  it("남긴 질문이 없으면 안내를 보여준다", async () => {
    vi.mocked(getMyQuestions).mockResolvedValue(page([]));
    renderCard();

    expect(await screen.findByText("아직 남긴 질문이 없습니다.")).toBeInTheDocument();
  });

  it("조회에 실패해도 카드 안에서만 알린다", async () => {
    /*
      서버에 아직 이 엔드포인트가 없다(BE#185). 실패가 대시보드 전체를 무너뜨리면
      학습 통계 · 제출 내역까지 못 보게 된다.
    */
    vi.mocked(getMyQuestions).mockRejectedValue({ code: "NOT_FOUND", message: "?" });
    renderCard();

    expect(await screen.findByText("질문을 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "내 질문" })).toBeInTheDocument();
  });
});
