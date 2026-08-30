import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getMe } from "../../apis/auth/authApi";
import type { Me } from "../../types/auth";

import MyPage from "./MyPage";

vi.mock("../../apis/auth/authApi");

const MEMBER: Me = {
  id: 1,
  email: "member@getit.com",
  name: "김부원",
  phoneNumber: null,
  college: "경영대학",
  major: "경영학과",
  studentYear: 21,
  studentNumber: null,
  profileImageUrl: null,
  role: "MEMBER",
  generationNo: 9,
  status: "ACTIVE",
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyPage />
    </QueryClientProvider>,
  );
}

describe("MyPage", () => {
  it("로그인한 사용자의 프로필을 렌더링한다", async () => {
    vi.mocked(getMe).mockResolvedValue(MEMBER);
    renderPage();

    expect(await screen.findByRole("heading", { name: "김부원" })).toBeInTheDocument();
    expect(screen.getByText("경영학과 21학번")).toBeInTheDocument();
    expect(screen.getByText("member@getit.com")).toBeInTheDocument();
    expect(screen.getByText("김")).toBeInTheDocument();
  });

  it("세션 판정이 끝나기 전에는 아무것도 그리지 않는다", () => {
    vi.mocked(getMe).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();

    expect(container).toBeEmptyDOMElement();
  });
});
