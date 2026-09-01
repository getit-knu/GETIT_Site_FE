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

it("maxLength를 지정하면 그 길이만큼만 입력할 수 있다", () => {
  render(<Input value="" onChange={() => {}} maxLength={10} />);

  expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "10");
});

it("error가 있으면 잘못된 값임을 칸 자체가 알린다", () => {
  // 테두리 색은 눈에만 보인다. 보조기기는 `aria-invalid` 로만 이걸 안다.
  render(<Input label="이메일" value="hong@getit" onChange={() => {}} error="이메일 형식이 올바르지 않습니다." />);

  expect(screen.getByRole("textbox", { name: "이메일" })).toHaveAttribute("aria-invalid", "true");
});

it("error 문구가 칸의 설명으로 연결된다", () => {
  /*
   * `role="alert"` 는 문구가 꽂히는 순간 한 번만 읽힌다. 사용자가 나중에 이 칸으로
   * 다시 탭해 왔을 때도 이유가 들려야 하므로 `aria-describedby` 로 묶는다.
   * 속성 존재만 보지 않고 실제로 읽히는 설명을 확인한다 — id 가 어긋나면 잡힌다.
   */
  render(<Input label="이메일" value="hong@getit" onChange={() => {}} error="이메일 형식이 올바르지 않습니다." />);

  expect(screen.getByRole("textbox", { name: "이메일" })).toHaveAccessibleDescription(
    "이메일 형식이 올바르지 않습니다.",
  );
});

it("error가 없으면 잘못된 값 표시를 남기지 않는다", () => {
  // `aria-invalid="false"` 를 늘 붙여 두면 일부 리더가 "유효함"을 매번 읽어 시끄럽다.
  render(<Input label="이메일" value="hong@getit.kr" onChange={() => {}} />);

  const input = screen.getByRole("textbox", { name: "이메일" });
  expect(input).not.toHaveAttribute("aria-invalid");
  expect(input).not.toHaveAttribute("aria-describedby");
});

it("여러 칸을 함께 그려도 각자의 error 문구를 가리킨다", () => {
  // id 를 상수로 두면 두 번째 칸이 첫 번째 칸의 문구를 가리킨다. `useId` 로 갈리는지 본다.
  render(
    <>
      <Input label="이메일" value="" onChange={() => {}} error="이메일을 입력해 주세요." />
      <Input label="전화번호" value="" onChange={() => {}} error="전화번호를 입력해 주세요." />
    </>,
  );

  expect(screen.getByRole("textbox", { name: "이메일" })).toHaveAccessibleDescription("이메일을 입력해 주세요.");
  expect(screen.getByRole("textbox", { name: "전화번호" })).toHaveAccessibleDescription("전화번호를 입력해 주세요.");
});

it("숫자 칸은 받을 수 있는 범위를 칸에 적어 둔다", () => {
  // 범위를 검증에만 두면 스피너가 7, 8 로도 올라가고 보조기기는 경계를 알 길이 없다.
  render(<Input label="학년" type="number" value="" onChange={() => {}} min={1} max={6} />);

  const grade = screen.getByRole("spinbutton", { name: "학년" });
  expect(grade).toHaveAttribute("min", "1");
  expect(grade).toHaveAttribute("max", "6");
});
