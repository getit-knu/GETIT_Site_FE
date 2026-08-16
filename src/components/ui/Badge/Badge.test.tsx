import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";

import { Badge } from "./Badge";

it("children을 렌더링한다", () => {
  render(<Badge>답변완료</Badge>);

  expect(screen.getByText("답변완료")).toBeInTheDocument();
});

it("variant에 따라 다른 스타일 클래스가 적용된다", () => {
  const { rerender } = render(<Badge variant="info">미답변</Badge>);
  expect(screen.getByText("미답변").className).toMatch(/info/);

  rerender(<Badge variant="neutral">답변완료</Badge>);
  expect(screen.getByText("답변완료").className).toMatch(/neutral/);
});
