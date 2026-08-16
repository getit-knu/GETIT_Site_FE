import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";

import { TextArea } from "./TextArea";

it("입력하면 onChange가 새 값과 함께 호출된다", () => {
  const handleChange = vi.fn();
  render(<TextArea value="" onChange={handleChange} />);

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "안녕하세요" } });

  expect(handleChange).toHaveBeenCalledWith("안녕하세요");
});

it("error가 있으면 에러 문구를 보여준다", () => {
  render(<TextArea value="" onChange={() => {}} error="필수 입력 항목입니다." />);

  expect(screen.getByRole("alert")).toHaveTextContent("필수 입력 항목입니다.");
});
