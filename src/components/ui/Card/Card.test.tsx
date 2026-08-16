import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";

import { Card } from "./Card";

it("children을 렌더링한다", () => {
  render(<Card>프로젝트 카드</Card>);

  expect(screen.getByText("프로젝트 카드")).toBeInTheDocument();
});

it("onClick이 있으면 클릭 시 호출되고 role이 button이 된다", () => {
  const handleClick = vi.fn();
  render(<Card onClick={handleClick}>프로젝트 카드</Card>);

  fireEvent.click(screen.getByRole("button", { name: "프로젝트 카드" }));

  expect(handleClick).toHaveBeenCalledTimes(1);
});

it("Enter · Space 키를 누르면 onClick이 호출된다", () => {
  const handleClick = vi.fn();
  render(<Card onClick={handleClick}>프로젝트 카드</Card>);

  const card = screen.getByRole("button", { name: "프로젝트 카드" });
  fireEvent.keyDown(card, { key: "Enter" });
  fireEvent.keyDown(card, { key: " " });

  expect(handleClick).toHaveBeenCalledTimes(2);
});
