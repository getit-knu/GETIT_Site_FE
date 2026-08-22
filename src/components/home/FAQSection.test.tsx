import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FAQSection } from "./FAQSection";

describe("FAQSection", () => {
  it("제목과 질문 4개를 보여준다", () => {
    render(<FAQSection />);

    expect(screen.getByRole("heading", { name: "자주 묻는 질문" })).toBeInTheDocument();
    for (const question of [
      "동아리 활동 시간은 어떻게 되나요?",
      "프로그래밍을 처음 배우는데 괜찮을까요?",
      "회비가 있나요?",
      "어떤 학과 학생들이 지원하나요?",
    ]) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
  });
});
