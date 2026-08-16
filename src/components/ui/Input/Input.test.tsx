import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";

import { Input } from "./Input";

it("입력하면 onChange가 새 값과 함께 호출된다", () => {
  const handleChange = vi.fn();
  render(<Input value="" onChange={handleChange} />);

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "getit" } });

  expect(handleChange).toHaveBeenCalledWith("getit");
});

it("error가 있으면 에러 문구를 보여준다", () => {
  render(<Input value="" onChange={() => {}} error="이메일 형식이 올바르지 않습니다." />);

  expect(screen.getByRole("alert")).toHaveTextContent("이메일 형식이 올바르지 않습니다.");
});
