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
});
