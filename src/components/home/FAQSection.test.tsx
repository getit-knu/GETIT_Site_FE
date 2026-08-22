import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FAQSection } from "./FAQSection";

const QUESTIONS = [
  "동아리 활동 시간은 어떻게 되나요?",
  "프로그래밍을 처음 배우는데 괜찮을까요?",
  "회비가 있나요?",
  "어떤 학과 학생들이 지원하나요?",
];

describe("FAQSection", () => {
  it("제목과 질문 4개를 보여준다", () => {
    render(<FAQSection />);

    expect(screen.getByRole("heading", { name: "자주 묻는 질문" })).toBeInTheDocument();
    for (const question of QUESTIONS) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
  });

  it("처음에는 답변이 전부 접혀 있다", () => {
    render(<FAQSection />);

    for (const question of QUESTIONS) {
      expect(screen.getByRole("button", { name: question })).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("질문을 누르면 답변이 펼쳐지고, 다시 누르면 접힌다", async () => {
    render(<FAQSection />);

    const button = screen.getByRole("button", { name: "회비가 있나요?" });
    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("정확한 답변을 준비하고 있어요. 곧 업데이트할 예정입니다.")).toBeInTheDocument();

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("정확한 답변을 준비하고 있어요. 곧 업데이트할 예정입니다.")).not.toBeInTheDocument();
  });

  it("한 번에 하나만 펼쳐진다", async () => {
    render(<FAQSection />);

    await userEvent.click(screen.getByRole("button", { name: "회비가 있나요?" }));
    await userEvent.click(screen.getByRole("button", { name: "어떤 학과 학생들이 지원하나요?" }));

    expect(screen.getByRole("button", { name: "회비가 있나요?" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "어떤 학과 학생들이 지원하나요?" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
