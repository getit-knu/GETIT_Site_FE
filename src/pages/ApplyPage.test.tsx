import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ApplyPage from "./ApplyPage";

describe("ApplyPage", () => {
  it("헤더와 두 섹션의 필드를 모두 렌더링한다", () => {
    render(<ApplyPage />);

    expect(screen.getByRole("heading", { name: "GETIT 지원하기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지원서 작성" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "기본 정보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지원 동기 및 경험" })).toBeInTheDocument();

    for (const label of ["이름 *", "이메일 *", "전화번호 *", "단과 대학 *", "전공 *", "학번(10자) *"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("GETIT에 지원하게 된 동기는 무엇인가요? *")).toBeInTheDocument();
    expect(screen.getByLabelText("프로그래밍 경험이 있다면 간단히 설명해주세요")).toBeInTheDocument();
    expect(screen.getByLabelText("GETIT에서 어떤 프로젝트를 하고 싶으신가요? *")).toBeInTheDocument();
    expect(screen.getByLabelText("궁금한 점이나 하고 싶은 말이 있다면 자유롭게 작성해주세요")).toBeInTheDocument();
  });

  it("입력한 값이 필드에 그대로 반영된다", () => {
    render(<ApplyPage />);

    const nameInput = screen.getByLabelText("이름 *");
    fireEvent.change(nameInput, { target: { value: "홍길동" } });

    expect(nameInput).toHaveValue("홍길동");
  });

  it("sticky footer에 임시 저장 · 제출하기 버튼이 있다", () => {
    render(<ApplyPage />);

    expect(screen.getByRole("button", { name: "임시 저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "제출하기" })).toBeInTheDocument();
  });
});
