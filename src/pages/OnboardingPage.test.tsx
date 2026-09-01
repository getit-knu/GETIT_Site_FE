import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { confirmPrivacyConsent, getMe } from "../apis/auth/authApi";
import type { Me } from "../types/auth";

import OnboardingPage from "./OnboardingPage";

vi.mock("../apis/auth/authApi");

function me(over: Partial<Me> = {}): Me {
  return {
    id: 1,
    email: "member@getit.com",
    name: "김부원",
    phoneNumber: null,
    college: null,
    major: null,
    studentYear: null,
    studentNumber: null,
    profileImageUrl: null,
    role: "MEMBER",
    generationNo: 9,
    status: "ACTIVE",
    privacyConsentedAt: null,
    ...over,
  };
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>홈</p> },
      { path: "/member", element: <p>부원 본문</p> },
      { path: "/onboarding", element: <OnboardingPage /> },
    ],
    { initialEntries: [path] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("환영 문구와 동의 칸을 보여준다", async () => {
    vi.mocked(getMe).mockResolvedValue(me());
    renderAt("/onboarding");

    expect(await screen.findByRole("heading", { name: "GET IT에 오신 것을 환영합니다" })).toBeInTheDocument();
    expect(screen.getByLabelText(/개인정보 수집·이용에 동의합니다/)).toBeInTheDocument();
  });

  it("동의 없이 시작하기를 누르면 막고 동의 칸으로 포커스를 옮긴다", async () => {
    vi.mocked(getMe).mockResolvedValue(me());
    renderAt("/onboarding");

    await userEvent.click(await screen.findByRole("button", { name: "동의하고 시작하기" }));

    expect(await screen.findByText("계속하려면 개인정보 수집·이용에 동의해 주세요.")).toBeInTheDocument();
    expect(screen.getByLabelText(/개인정보 수집·이용에 동의합니다/)).toHaveFocus();
    expect(confirmPrivacyConsent).not.toHaveBeenCalled();
  });

  it("동의하고 시작하기를 누르면 동의를 저장하고 역할에 맞는 곳으로 보낸다", async () => {
    vi.mocked(getMe).mockResolvedValue(me({ role: "MEMBER" }));
    vi.mocked(confirmPrivacyConsent).mockResolvedValue(me({ privacyConsentedAt: "2026-09-01T00:00:00+09:00" }));
    renderAt("/onboarding");

    await userEvent.click(await screen.findByLabelText(/개인정보 수집·이용에 동의합니다/));
    await userEvent.click(screen.getByRole("button", { name: "동의하고 시작하기" }));

    expect(confirmPrivacyConsent).toHaveBeenCalled();
    expect(await screen.findByText("부원 본문")).toBeInTheDocument();
  });

  it("이미 동의한 사람이 다시 들어오면 곧장 제 영역으로 보낸다", async () => {
    // 주소를 직접 쳐서 재방문하는 경우 등의 안전망이다.
    vi.mocked(getMe).mockResolvedValue(me({ privacyConsentedAt: "2026-09-01T00:00:00+09:00" }));
    renderAt("/onboarding");

    expect(await screen.findByText("부원 본문")).toBeInTheDocument();
  });

  it("동의 저장에 실패하면 안내하고 다시 시도할 수 있다", async () => {
    vi.mocked(getMe).mockResolvedValue(me());
    vi.mocked(confirmPrivacyConsent).mockRejectedValue(new Error("network"));
    renderAt("/onboarding");

    await userEvent.click(await screen.findByLabelText(/개인정보 수집·이용에 동의합니다/));
    await userEvent.click(screen.getByRole("button", { name: "동의하고 시작하기" }));

    expect(await screen.findByText("동의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
  });
});
