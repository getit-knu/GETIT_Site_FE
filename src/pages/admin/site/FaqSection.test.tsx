import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../../apis/site/siteApi";
import type { Faq } from "../../../types/site";

import { FaqSection } from "./FaqSection";

vi.mock("../../../apis/site/siteApi");

const FAQS: Faq[] = [{ id: 1, question: "활동 시간은?", answer: "화요일 저녁 7시", order: 1, isVisible: true }];

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FaqSection />
    </QueryClientProvider>,
  );
}

describe("FaqSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getFaqs).mockResolvedValue(FAQS);
    vi.mocked(api.deleteFaq).mockResolvedValue();
  });

  it("목록을 보여준다", async () => {
    renderSection();
    expect(await screen.findByText("활동 시간은?")).toBeInTheDocument();
  });

  it("비공개 FAQ를 표시한다", async () => {
    vi.mocked(api.getFaqs).mockResolvedValue([{ ...FAQS[0], isVisible: false }]);
    renderSection();
    expect(await screen.findByText("(비공개)")).toBeInTheDocument();
  });

  it("빈 목록은 안내를 보여준다", async () => {
    vi.mocked(api.getFaqs).mockResolvedValue([]);
    renderSection();
    expect(await screen.findByText("등록된 FAQ가 없습니다.")).toBeInTheDocument();
  });

  it("질문이나 답변이 비어 있으면 저장을 막는다", async () => {
    renderSection();
    await screen.findByText("활동 시간은?");

    await userEvent.click(screen.getByRole("button", { name: "+ FAQ 추가" }));

    expect(screen.getByText("질문을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });

  it("추가는 다음 순서를 실어 보낸다", async () => {
    vi.mocked(api.createFaq).mockResolvedValue({
      id: 2,
      question: "새 질문",
      answer: "새 답변",
      order: 2,
      isVisible: true,
    });
    renderSection();
    await screen.findByText("활동 시간은?");

    await userEvent.click(screen.getByRole("button", { name: "+ FAQ 추가" }));
    await userEvent.type(screen.getByLabelText("질문 *"), "새 질문");
    await userEvent.type(screen.getByLabelText("답변 *"), "새 답변");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(api.createFaq).toHaveBeenCalled());
    expect(vi.mocked(api.createFaq).mock.lastCall?.[0]).toMatchObject({ question: "새 질문", order: 2 });
  });

  it("삭제는 확인을 묻고, 확인하면 지운다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderSection();
    await screen.findByText("활동 시간은?");

    await userEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(api.deleteFaq).toHaveBeenCalledWith(1);
    vi.unstubAllGlobals();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getFaqs).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });
});
