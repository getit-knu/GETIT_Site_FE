import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getFaqs } from "../../apis/public/publicApi";
import type { PublicFaq } from "../../types/home";

import { FAQSection } from "./FAQSection";

vi.mock("../../apis/public/publicApi");

const FAQS: PublicFaq[] = [
  { id: 1, question: "동아리 활동 시간은 어떻게 되나요?", answer: "화요일 저녁 7시입니다.", order: 1 },
  { id: 2, question: "회비가 있나요?", answer: "없습니다.", order: 2 },
];

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FAQSection />
    </QueryClientProvider>,
  );
}

describe("FAQSection", () => {
  it("FAQ가 없으면 아무것도 보여주지 않는다", async () => {
    vi.mocked(getFaqs).mockResolvedValue([]);
    const { container } = renderSection();

    await vi.waitFor(() => expect(getFaqs).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("제목과 질문 목록을 보여준다", async () => {
    vi.mocked(getFaqs).mockResolvedValue(FAQS);
    renderSection();

    expect(await screen.findByRole("heading", { name: "자주 묻는 질문" })).toBeInTheDocument();
    for (const faq of FAQS) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
  });

  it("처음에는 답변이 전부 접혀 있다", async () => {
    vi.mocked(getFaqs).mockResolvedValue(FAQS);
    renderSection();

    for (const faq of FAQS) {
      expect(await screen.findByRole("button", { name: faq.question })).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("질문을 누르면 답변이 펼쳐지고, 다시 누르면 접힌다", async () => {
    vi.mocked(getFaqs).mockResolvedValue(FAQS);
    renderSection();

    const button = await screen.findByRole("button", { name: "회비가 있나요?" });
    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("없습니다.")).toBeInTheDocument();

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("없습니다.")).not.toBeInTheDocument();
  });

  it("한 번에 하나만 펼쳐진다", async () => {
    vi.mocked(getFaqs).mockResolvedValue(FAQS);
    renderSection();

    await userEvent.click(await screen.findByRole("button", { name: "회비가 있나요?" }));
    await userEvent.click(screen.getByRole("button", { name: "동아리 활동 시간은 어떻게 되나요?" }));

    expect(screen.getByRole("button", { name: "회비가 있나요?" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "동아리 활동 시간은 어떻게 되나요?" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
