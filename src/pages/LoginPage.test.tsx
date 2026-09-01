import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("개인정보 동의 전에는 로그인 버튼을 눌러도 이동하지 않고 동의 칸으로 데려간다", async () => {
    // <a href>는 그대로 둔다(스크린리더에도 진짜 링크로 읽혀야 한다) — 클릭만 막는다.
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("link", { name: "Google로 로그인" }));

    expect(await screen.findByText(/로그인하려면 개인정보 수집·이용에 동의해 주세요/)).toBeInTheDocument();
    expect(screen.getByLabelText(/개인정보 수집·이용에 동의합니다/)).toHaveFocus();
  });

  it("동의하면 안내 문구가 사라지고 클릭이 막히지 않는다", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("link", { name: "Google로 로그인" }));
    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용에 동의합니다/));

    expect(screen.queryByText(/로그인하려면 개인정보 수집·이용에 동의해 주세요/)).not.toBeInTheDocument();
  });
});
