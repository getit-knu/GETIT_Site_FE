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
