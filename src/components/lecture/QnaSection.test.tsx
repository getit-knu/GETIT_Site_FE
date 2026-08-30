import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/lecture/memberLecturesApi";
import type { MemberQuestion } from "../../types/lecture";

import { QnaSection } from "./QnaSection";

vi.mock("../../apis/lecture/memberLecturesApi");

function question(over: Partial<MemberQuestion> = {}): MemberQuestion {
  return {
    id: 9001,
    authorName: "김부원",
    content: "CSS flexbox와 grid의 차이점이 무엇인가요?",
    createdAt: "2026-06-02T10:00:00+09:00",
    status: "ANSWERED",
    answers: [],
    ...over,
  };
}

function renderSection(lectureId = 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <QnaSection lectureId={lectureId} />
    </QueryClientProvider>,
  );
}

describe("QnaSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("등록된 질문과 답변을 렌더링한다", async () => {
    vi.mocked(api.getMyLectureQuestions).mockResolvedValue([
      question({
        answers: [
          {
            id: 1,
            adminName: "운영진",
            content: "Flexbox는 1차원, Grid는 2차원입니다.",
            createdAt: "2026-06-03T00:00:00+09:00",
          },
        ],
      }),
    ]);
    renderSection();

    expect(await screen.findByText("CSS flexbox와 grid의 차이점이 무엇인가요?")).toBeInTheDocument();
    expect(screen.getByText("운영진의 답변")).toBeInTheDocument();
    expect(screen.getByText("Flexbox는 1차원, Grid는 2차원입니다.")).toBeInTheDocument();
  });

  it("질문이 없으면 빈 상태를 보여준다", async () => {
    vi.mocked(api.getMyLectureQuestions).mockResolvedValue([]);
    renderSection();

    expect(await screen.findByText("등록된 질문이 없습니다.")).toBeInTheDocument();
  });

  it("조회 실패면 에러 화면을 보여준다", async () => {
    vi.mocked(api.getMyLectureQuestions).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });

  it("질문을 입력하기 전엔 질문하기 버튼이 비활성화고, 입력하면 목록에 추가된다", async () => {
    vi.mocked(api.getMyLectureQuestions)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([question({ content: "과제는 어디에 제출하나요?", answers: [] })]);
    vi.mocked(api.createLectureQuestion).mockResolvedValue({
      id: 9101,
      content: "과제는 어디에 제출하나요?",
      status: "PENDING",
      createdAt: "2026-06-10T00:00:00+09:00",
    });
    const user = userEvent.setup();
    renderSection();

    const askButton = await screen.findByRole("button", { name: "질문하기" });
    expect(askButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("질문을 입력하세요"), "과제는 어디에 제출하나요?");
    expect(askButton).toBeEnabled();

    await user.click(askButton);

    expect(await screen.findByText("과제는 어디에 제출하나요?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("질문을 입력하세요")).toHaveValue("");
  });
});
