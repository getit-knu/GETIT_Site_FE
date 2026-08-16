import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";

import { Button } from "./Button";

it("클릭하면 onClick이 호출된다", () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>확인</Button>);

  fireEvent.click(screen.getByRole("button", { name: "확인" }));

  expect(handleClick).toHaveBeenCalledTimes(1);
});

it("disabled면 클릭해도 onClick이 호출되지 않는다", () => {
  const handleClick = vi.fn();
  render(
    <Button onClick={handleClick} disabled>
      확인
    </Button>,
  );

  fireEvent.click(screen.getByRole("button", { name: "확인" }));

  expect(handleClick).not.toHaveBeenCalled();
});

it("type을 지정하지 않으면 기본값은 button이다", () => {
  render(<Button>확인</Button>);

  expect(screen.getByRole("button", { name: "확인" })).toHaveAttribute("type", "button");
});

it("type을 submit으로 지정하면 폼 제출 버튼이 된다", () => {
  render(<Button type="submit">제출하기</Button>);

  expect(screen.getByRole("button", { name: "제출하기" })).toHaveAttribute("type", "submit");
});

it("isLoading이면 비활성화되고 클릭해도 onClick이 호출되지 않는다", () => {
  const handleClick = vi.fn();
  render(
    <Button onClick={handleClick} isLoading>
      제출하기
    </Button>,
  );

  const button = screen.getByRole("button", { name: "제출하기" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");

  fireEvent.click(button);

  expect(handleClick).not.toHaveBeenCalled();
});
