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

it("maxLength가 없으면 글자 수를 보여주지 않는다", () => {
  render(<TextArea value="아무 값" onChange={() => {}} />);

  expect(screen.queryByText(/\/ \d+자/)).not.toBeInTheDocument();
});

it("maxLength가 있으면 현재/최대 글자 수를 보여준다", () => {
  render(<TextArea value="가나다" onChange={() => {}} maxLength={500} />);

  expect(screen.getByText("3 / 500자")).toBeInTheDocument();
});

it("90% 이상 채우면 눈에 띄게 표시한다", () => {
  render(<TextArea value={"가".repeat(450)} onChange={() => {}} maxLength={500} />);

  expect(screen.getByText("450 / 500자").className).toMatch(/counterNear/);
});

it("제한을 넘으면 다른 스타일로 표시한다", () => {
  // 붙여넣기 등으로 넘는 경우를 대비한다 — 실제 저장을 막는 건 화면단 검증(submitBlocker)의 몫이다.
  render(<TextArea value={"가".repeat(501)} onChange={() => {}} maxLength={500} />);

  expect(screen.getByText("501 / 500자").className).toMatch(/counterOver/);
});
