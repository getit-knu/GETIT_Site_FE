import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("제목과 안내 문구를 렌더링한다", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByText("GET IT에 오신 것을 환영합니다")).toBeInTheDocument();
  });

  it("Google 로그인 버튼이 BE의 OAuth2 시작 경로를 가리킨다", () => {
    render(<LoginPage />);

    const link = screen.getByRole("link", { name: "Google로 로그인" });
    expect(link.getAttribute("href")).toMatch(/\/oauth2\/authorization\/google$/);
  });

  it("동의 없이도 바로 누를 수 있다 — 개인정보 동의는 신규 유저 온보딩에서 받는다", () => {
    // 기존 회원까지 매번 다시 동의하게 만들지 않으려고 여기서는 게이트를 두지 않는다
    // (`OnboardingPage` 참고).
    render(<LoginPage />);

    expect(screen.queryByLabelText(/개인정보/)).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Google로 로그인" });
    expect(link).not.toHaveAttribute("aria-disabled");
  });
});
