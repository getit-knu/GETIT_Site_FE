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

it("포커스를 벗어나면 onBlur가 호출된다", () => {
  const handleBlur = vi.fn();
  render(<TextArea value="" onChange={() => {}} onBlur={handleBlur} />);

  fireEvent.blur(screen.getByRole("textbox"));

  expect(handleBlur).toHaveBeenCalledTimes(1);
});

it("error가 있으면 잘못된 값임을 칸 자체가 알리고 문구를 설명으로 연결한다", () => {
  // 이유는 `Input.test.tsx` 의 같은 테스트 참고.
  render(<TextArea label="지원 동기" value="" onChange={() => {}} error="필수 입력 항목입니다." />);

  const textarea = screen.getByRole("textbox", { name: "지원 동기" });
  expect(textarea).toHaveAttribute("aria-invalid", "true");
  expect(textarea).toHaveAccessibleDescription("필수 입력 항목입니다.");
});

it("error가 없으면 잘못된 값 표시를 남기지 않는다", () => {
  render(<TextArea label="지원 동기" value="열심히 하겠습니다." onChange={() => {}} />);

  const textarea = screen.getByRole("textbox", { name: "지원 동기" });
  expect(textarea).not.toHaveAttribute("aria-invalid");
  expect(textarea).not.toHaveAttribute("aria-describedby");
});
